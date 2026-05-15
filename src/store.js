// Time-bucketed episodic store for agent interactions.
// Append-only event log, indexed by session and timestamp.
// No consolidation. Retention policy is per-event. Deletion is a real delete.

/**
 * @typedef {Object} EpisodicEvent
 * @property {string} id - Unique event ID
 * @property {string} sessionId - Session this event belongs to
 * @property {number} ts - Unix timestamp ms
 * @property {string} kind - Event kind (e.g. "user_message", "assistant_message", "tool_call", "tool_result")
 * @property {string} text - Event content as text (used for retrieval matching)
 * @property {object} [meta] - Optional metadata (tool name, role, etc.)
 * @property {number[]} [embedding] - Optional embedding vector (set at write time if embedder provided)
 */

/**
 * @typedef {Object} StoreOptions
 * @property {(text: string) => Promise<number[]> | number[]} [embedder] - Function that embeds text. If not provided, store is text-only and retrieval falls back to keyword scoring.
 * @property {number} [bucketMs=86400000] - Bucket size in ms (default 1 day). Used for retention/deletion.
 */

/**
 * @typedef {Object} RetrievalOptions
 * @property {string} [sessionId] - Restrict to a single session
 * @property {number} [sinceTs] - Restrict to events at or after this ts
 * @property {number} [untilTs] - Restrict to events at or before this ts
 * @property {number} [topK=5] - Max results
 * @property {string} [kind] - Restrict to a specific event kind
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * In-memory episodic store. Suitable for tests and local agents.
 * For production, swap for a persistent backend that satisfies the same interface
 * (the test suite documents the contract).
 */
export class EpisodicStore {
  /**
   * @param {StoreOptions} [opts]
   */
  constructor(opts = {}) {
    this.embedder = opts.embedder;
    this.bucketMs = opts.bucketMs ?? DAY_MS;
    /** @type {EpisodicEvent[]} */
    this._events = [];
    this._nextId = 1;
  }

  /**
   * Append an event. Returns the stored event with id and embedding if embedder configured.
   * @param {Omit<EpisodicEvent, "id">} event
   * @returns {Promise<EpisodicEvent>}
   */
  async append(event) {
    const id = `e_${this._nextId++}`;
    const stored = {
      id,
      sessionId: event.sessionId,
      ts: event.ts ?? Date.now(),
      kind: event.kind,
      text: event.text,
      meta: event.meta,
    };
    if (this.embedder) {
      stored.embedding = await this.embedder(event.text);
    }
    this._events.push(stored);
    return stored;
  }

  /**
   * Retrieve events relevant to a query, ranked by cosine similarity if embedder available,
   * else by keyword overlap. Returns top K with scores.
   * @param {string} query
   * @param {RetrievalOptions} [opts]
   * @returns {Promise<Array<EpisodicEvent & { score: number }>>}
   */
  async retrieve(query, opts = {}) {
    const topK = opts.topK ?? 5;
    let candidates = this._events.filter((e) => {
      if (opts.sessionId && e.sessionId !== opts.sessionId) return false;
      if (opts.sinceTs && e.ts < opts.sinceTs) return false;
      if (opts.untilTs && e.ts > opts.untilTs) return false;
      if (opts.kind && e.kind !== opts.kind) return false;
      return true;
    });

    if (this.embedder && candidates.length > 0 && candidates[0].embedding) {
      const qVec = await this.embedder(query);
      candidates = candidates.map((e) => ({
        ...e,
        score: cosine(qVec, e.embedding),
      }));
    } else {
      const qWords = tokenize(query);
      candidates = candidates.map((e) => ({
        ...e,
        score: keywordOverlap(qWords, tokenize(e.text)),
      }));
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, topK);
  }

  /**
   * Get a single event by id.
   * @param {string} id
   * @returns {EpisodicEvent | undefined}
   */
  get(id) {
    return this._events.find((e) => e.id === id);
  }

  /**
   * List all events, optionally filtered.
   * @param {RetrievalOptions} [opts]
   * @returns {EpisodicEvent[]}
   */
  list(opts = {}) {
    return this._events.filter((e) => {
      if (opts.sessionId && e.sessionId !== opts.sessionId) return false;
      if (opts.sinceTs && e.ts < opts.sinceTs) return false;
      if (opts.untilTs && e.ts > opts.untilTs) return false;
      if (opts.kind && e.kind !== opts.kind) return false;
      return true;
    });
  }

  /**
   * Hard-delete an event by id. Returns true if deleted, false if not found.
   * Real delete: the event is gone from the store. No tombstone, no derived
   * artifact left behind. This is the central design choice that distinguishes
   * agentmemory from Dreaming-style consolidation.
   * @param {string} id
   * @returns {boolean}
   */
  deleteEvent(id) {
    const i = this._events.findIndex((e) => e.id === id);
    if (i === -1) return false;
    this._events.splice(i, 1);
    return true;
  }

  /**
   * Hard-delete all events for a session. Returns the number deleted.
   * @param {string} sessionId
   * @returns {number}
   */
  deleteSession(sessionId) {
    const before = this._events.length;
    this._events = this._events.filter((e) => e.sessionId !== sessionId);
    return before - this._events.length;
  }

  /**
   * Hard-delete all events older than the given timestamp. Returns the number deleted.
   * Used for retention policies (e.g. delete events older than 30 days).
   * @param {number} olderThanTs
   * @returns {number}
   */
  deleteOlderThan(olderThanTs) {
    const before = this._events.length;
    this._events = this._events.filter((e) => e.ts >= olderThanTs);
    return before - this._events.length;
  }

  /**
   * Total event count.
   * @returns {number}
   */
  get size() {
    return this._events.length;
  }

  /**
   * Distinct sessions seen by this store.
   * @returns {string[]}
   */
  sessions() {
    return [...new Set(this._events.map((e) => e.sessionId))];
  }
}

/**
 * Cosine similarity for two equal-length vectors. Used when an embedder is configured.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function cosine(a, b) {
  if (a.length !== b.length) {
    throw new Error(
      `cosine: vector length mismatch (${a.length} vs ${b.length})`,
    );
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** @param {string} s */
function tokenize(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Keyword overlap as a fallback when no embedder is configured.
 * Returns the fraction of query tokens present in the candidate.
 * @param {string[]} qWords
 * @param {string[]} cWords
 */
function keywordOverlap(qWords, cWords) {
  if (qWords.length === 0) return 0;
  const cSet = new Set(cWords);
  let hits = 0;
  for (const w of qWords) {
    if (cSet.has(w)) hits++;
  }
  return hits / qWords.length;
}
