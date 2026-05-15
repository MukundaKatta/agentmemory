// Postgres-backed EpisodicStore.
//
// Same public interface as the in-memory EpisodicStore. Real deletes via
// DELETE statements (no tombstones). Embeddings stored as float8[]; if you
// have pgvector installed and want the real index speedup, swap the embedding
// column to `vector(N)` and rewrite the retrieve() ORDER BY accordingly
// (left as an exercise so the adapter has zero hard deps).
//
// Schema:
//
//   CREATE TABLE agentmemory_events (
//     id          BIGSERIAL PRIMARY KEY,
//     session_id  TEXT NOT NULL,
//     ts          BIGINT NOT NULL,
//     kind        TEXT NOT NULL,
//     text        TEXT NOT NULL,
//     meta        JSONB,
//     embedding   FLOAT8[]
//   );
//   CREATE INDEX agentmemory_events_session_ts ON agentmemory_events (session_id, ts);
//   CREATE INDEX agentmemory_events_kind ON agentmemory_events (kind);
//
// Use:
//
//   import pg from "pg";
//   import { PostgresEpisodicStore } from "@mukundakatta/agentmemory/postgres";
//
//   const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
//   const store = new PostgresEpisodicStore({ pool, embedder: myEmbedder });
//   await store.init();
//   await store.append({ sessionId: "s1", kind: "user_message", text: "hi" });
//
// Peer dependency:
//   npm install pg

/**
 * @typedef {import("../store.js").EpisodicEvent} EpisodicEvent
 * @typedef {import("../store.js").RetrievalOptions} RetrievalOptions
 */

/**
 * @typedef {Object} PostgresStoreOptions
 * @property {{ query: (sql: string, params?: any[]) => Promise<{ rows: any[] }> }} pool - A pg.Pool or compatible client
 * @property {(text: string) => Promise<number[]> | number[]} [embedder] - Optional embedder; if absent, retrieval falls back to keyword overlap (unindexed)
 * @property {string} [tableName="agentmemory_events"] - Override the table name (useful for multi-tenant setups)
 */

const DEFAULT_TABLE = "agentmemory_events";

const SCHEMA_SQL = (table) => `
CREATE TABLE IF NOT EXISTS ${table} (
  id          BIGSERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL,
  ts          BIGINT NOT NULL,
  kind        TEXT NOT NULL,
  text        TEXT NOT NULL,
  meta        JSONB,
  embedding   FLOAT8[]
);
CREATE INDEX IF NOT EXISTS ${table}_session_ts ON ${table} (session_id, ts);
CREATE INDEX IF NOT EXISTS ${table}_kind ON ${table} (kind);
`;

export class PostgresEpisodicStore {
  /**
   * @param {PostgresStoreOptions} opts
   */
  constructor(opts) {
    if (!opts?.pool || typeof opts.pool.query !== "function") {
      throw new Error(
        "PostgresEpisodicStore: `pool` option must be a pg.Pool (or anything with .query(sql, params)).",
      );
    }
    this.pool = opts.pool;
    this.embedder = opts.embedder;
    this.table = opts.tableName ?? DEFAULT_TABLE;
  }

  /**
   * Create the table + indexes if they don't exist. Safe to call repeatedly.
   * @returns {Promise<void>}
   */
  async init() {
    await this.pool.query(SCHEMA_SQL(this.table));
  }

  /**
   * Append an event. Returns the row with id and embedding if embedder configured.
   * @param {Omit<EpisodicEvent, "id">} event
   * @returns {Promise<EpisodicEvent>}
   */
  async append(event) {
    const ts = event.ts ?? Date.now();
    const embedding = this.embedder ? await this.embedder(event.text) : null;
    const sql = `
      INSERT INTO ${this.table} (session_id, ts, kind, text, meta, embedding)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const result = await this.pool.query(sql, [
      event.sessionId,
      ts,
      event.kind,
      event.text,
      event.meta ? JSON.stringify(event.meta) : null,
      embedding,
    ]);
    return {
      id: `e_${result.rows[0].id}`,
      sessionId: event.sessionId,
      ts,
      kind: event.kind,
      text: event.text,
      meta: event.meta,
      ...(embedding ? { embedding } : {}),
    };
  }

  /**
   * Retrieve events relevant to a query. If the embedder is configured AND
   * stored events have embeddings, ranks by cosine. Otherwise falls back to
   * keyword-overlap scoring computed in JS (so it works on any Postgres,
   * pgvector or not).
   * @param {string} query
   * @param {RetrievalOptions} [opts]
   * @returns {Promise<Array<EpisodicEvent & { score: number }>>}
   */
  async retrieve(query, opts = {}) {
    const topK = opts.topK ?? 5;
    const { whereSql, params } = this._buildWhere(opts);
    const sql = `
      SELECT id, session_id, ts, kind, text, meta, embedding
      FROM ${this.table}
      ${whereSql}
      ORDER BY ts DESC
      LIMIT 5000
    `;
    const result = await this.pool.query(sql, params);
    let candidates = result.rows.map(rowToEvent);

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
   * Get a single event by id (string of the form "e_<bigint>").
   * @param {string} id
   * @returns {Promise<EpisodicEvent | undefined>}
   */
  async get(id) {
    const numeric = parseId(id);
    if (numeric === null) return undefined;
    const sql = `SELECT id, session_id, ts, kind, text, meta, embedding FROM ${this.table} WHERE id = $1`;
    const result = await this.pool.query(sql, [numeric]);
    if (result.rows.length === 0) return undefined;
    return rowToEvent(result.rows[0]);
  }

  /**
   * List events, optionally filtered.
   * @param {RetrievalOptions} [opts]
   * @returns {Promise<EpisodicEvent[]>}
   */
  async list(opts = {}) {
    const { whereSql, params } = this._buildWhere(opts);
    const sql = `SELECT id, session_id, ts, kind, text, meta, embedding FROM ${this.table} ${whereSql} ORDER BY ts ASC`;
    const result = await this.pool.query(sql, params);
    return result.rows.map(rowToEvent);
  }

  /**
   * Hard-delete a single event. Returns true if a row was deleted.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteEvent(id) {
    const numeric = parseId(id);
    if (numeric === null) return false;
    const sql = `DELETE FROM ${this.table} WHERE id = $1`;
    const result = await this.pool.query(sql, [numeric]);
    return result.rowCount > 0;
  }

  /**
   * Hard-delete all events for a session. Returns the number deleted.
   * @param {string} sessionId
   * @returns {Promise<number>}
   */
  async deleteSession(sessionId) {
    const sql = `DELETE FROM ${this.table} WHERE session_id = $1`;
    const result = await this.pool.query(sql, [sessionId]);
    return result.rowCount;
  }

  /**
   * Hard-delete events older than the given ts.
   * @param {number} olderThanTs
   * @returns {Promise<number>}
   */
  async deleteOlderThan(olderThanTs) {
    const sql = `DELETE FROM ${this.table} WHERE ts < $1`;
    const result = await this.pool.query(sql, [olderThanTs]);
    return result.rowCount;
  }

  /**
   * Total event count.
   * @returns {Promise<number>}
   */
  async size() {
    const result = await this.pool.query(
      `SELECT COUNT(*)::int AS n FROM ${this.table}`,
    );
    return result.rows[0].n;
  }

  /**
   * Distinct sessions seen.
   * @returns {Promise<string[]>}
   */
  async sessions() {
    const result = await this.pool.query(
      `SELECT DISTINCT session_id FROM ${this.table} ORDER BY session_id`,
    );
    return result.rows.map((r) => r.session_id);
  }

  /**
   * Build the WHERE clause + parameter list from a RetrievalOptions filter.
   * @param {RetrievalOptions} opts
   * @returns {{ whereSql: string, params: any[] }}
   */
  _buildWhere(opts) {
    const where = [];
    const params = [];
    if (opts.sessionId) {
      params.push(opts.sessionId);
      where.push(`session_id = $${params.length}`);
    }
    if (opts.sinceTs != null) {
      params.push(opts.sinceTs);
      where.push(`ts >= $${params.length}`);
    }
    if (opts.untilTs != null) {
      params.push(opts.untilTs);
      where.push(`ts <= $${params.length}`);
    }
    if (opts.kind) {
      params.push(opts.kind);
      where.push(`kind = $${params.length}`);
    }
    return {
      whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
      params,
    };
  }
}

/**
 * Map a SQL row to the public EpisodicEvent shape.
 * @param {any} row
 * @returns {EpisodicEvent}
 */
function rowToEvent(row) {
  const event = {
    id: `e_${row.id}`,
    sessionId: row.session_id,
    ts: Number(row.ts),
    kind: row.kind,
    text: row.text,
  };
  if (row.meta != null) event.meta = row.meta;
  if (row.embedding != null) event.embedding = row.embedding;
  return event;
}

/**
 * Parse the public id form "e_<digits>" to its numeric primary key.
 * Returns null if the format is unexpected.
 * @param {string} id
 * @returns {number | null}
 */
function parseId(id) {
  if (typeof id !== "string" || !id.startsWith("e_")) return null;
  const n = Number(id.slice(2));
  return Number.isFinite(n) ? n : null;
}

/** @param {number[]} a @param {number[]} b */
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

/** @param {string[]} qWords @param {string[]} cWords */
function keywordOverlap(qWords, cWords) {
  if (qWords.length === 0) return 0;
  const cSet = new Set(cWords);
  let hits = 0;
  for (const w of qWords) {
    if (cSet.has(w)) hits++;
  }
  return hits / qWords.length;
}
