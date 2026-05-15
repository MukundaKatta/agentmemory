import { test } from "node:test";
import assert from "node:assert";
import {
  EpisodicStore,
  OnDemandSummarizer,
  MemoryDriftWatcher,
} from "../src/index.js";

// =================== EpisodicStore ===================

test("store: append assigns id and stores fields", async () => {
  const s = new EpisodicStore();
  const e = await s.append({
    sessionId: "s1",
    ts: 1000,
    kind: "user_message",
    text: "hello world",
  });
  assert.strictEqual(typeof e.id, "string");
  assert.strictEqual(e.sessionId, "s1");
  assert.strictEqual(e.text, "hello world");
  assert.strictEqual(s.size, 1);
});

test("store: append calls embedder when configured", async () => {
  const calls = [];
  const embedder = (text) => {
    calls.push(text);
    return [1, 2, 3];
  };
  const s = new EpisodicStore({ embedder });
  const e = await s.append({
    sessionId: "s1",
    kind: "user_message",
    text: "foo",
  });
  assert.deepStrictEqual(e.embedding, [1, 2, 3]);
  assert.deepStrictEqual(calls, ["foo"]);
});

test("store: retrieve uses cosine when embedder configured", async () => {
  // Tiny embedder: maps known words to fixed vectors
  const vecs = {
    cat: [1, 0, 0],
    dog: [0, 1, 0],
    fish: [0, 0, 1],
    pet: [0.7, 0.7, 0],
  };
  const embedder = (t) => vecs[t.trim()] ?? [0, 0, 0];
  const s = new EpisodicStore({ embedder });
  await s.append({ sessionId: "s1", kind: "msg", text: "cat" });
  await s.append({ sessionId: "s1", kind: "msg", text: "dog" });
  await s.append({ sessionId: "s1", kind: "msg", text: "fish" });

  const r = await s.retrieve("pet", { topK: 2 });
  assert.strictEqual(r.length, 2);
  // pet [0.7, 0.7, 0] should be closer to cat and dog than fish.
  const texts = r.map((x) => x.text);
  assert.ok(texts.includes("cat"));
  assert.ok(texts.includes("dog"));
  assert.ok(!texts.includes("fish"));
});

test("store: retrieve falls back to keyword overlap when no embedder", async () => {
  const s = new EpisodicStore();
  await s.append({
    sessionId: "s1",
    kind: "msg",
    text: "we discussed quarterly revenue",
  });
  await s.append({ sessionId: "s1", kind: "msg", text: "the cat sat" });
  const r = await s.retrieve("quarterly revenue review", { topK: 1 });
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].text, "we discussed quarterly revenue");
});

test("store: retrieve respects sessionId filter", async () => {
  const s = new EpisodicStore();
  await s.append({ sessionId: "s1", kind: "msg", text: "foo" });
  await s.append({ sessionId: "s2", kind: "msg", text: "foo" });
  const r = await s.retrieve("foo", { sessionId: "s1", topK: 5 });
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].sessionId, "s1");
});

test("store: retrieve respects time-window filter", async () => {
  const s = new EpisodicStore();
  await s.append({ sessionId: "s1", ts: 100, kind: "msg", text: "old" });
  await s.append({ sessionId: "s1", ts: 200, kind: "msg", text: "mid" });
  await s.append({ sessionId: "s1", ts: 300, kind: "msg", text: "new" });
  const r = await s.retrieve("old mid new", {
    sinceTs: 150,
    untilTs: 250,
    topK: 5,
  });
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].text, "mid");
});

test("store: deleteEvent removes the event entirely", async () => {
  const s = new EpisodicStore();
  const e = await s.append({ sessionId: "s1", kind: "msg", text: "secret" });
  assert.strictEqual(s.size, 1);
  const ok = s.deleteEvent(e.id);
  assert.strictEqual(ok, true);
  assert.strictEqual(s.size, 0);
  // Real delete: can no longer retrieve, and no tombstone.
  const r = await s.retrieve("secret", { topK: 5 });
  assert.strictEqual(r.length, 0);
  assert.strictEqual(s.get(e.id), undefined);
});

test("store: deleteEvent returns false when id not found", () => {
  const s = new EpisodicStore();
  assert.strictEqual(s.deleteEvent("e_does_not_exist"), false);
});

test("store: deleteSession removes all events for that session", async () => {
  const s = new EpisodicStore();
  await s.append({ sessionId: "s1", kind: "msg", text: "a" });
  await s.append({ sessionId: "s1", kind: "msg", text: "b" });
  await s.append({ sessionId: "s2", kind: "msg", text: "c" });
  const n = s.deleteSession("s1");
  assert.strictEqual(n, 2);
  assert.strictEqual(s.size, 1);
  assert.strictEqual(s.list()[0].sessionId, "s2");
});

test("store: deleteOlderThan enforces retention by ts", async () => {
  const s = new EpisodicStore();
  await s.append({ sessionId: "s1", ts: 100, kind: "msg", text: "old" });
  await s.append({ sessionId: "s1", ts: 500, kind: "msg", text: "new" });
  const n = s.deleteOlderThan(300);
  assert.strictEqual(n, 1);
  assert.strictEqual(s.list()[0].text, "new");
});

test("store: sessions returns distinct session ids", async () => {
  const s = new EpisodicStore();
  await s.append({ sessionId: "s1", kind: "msg", text: "a" });
  await s.append({ sessionId: "s1", kind: "msg", text: "b" });
  await s.append({ sessionId: "s2", kind: "msg", text: "c" });
  assert.deepStrictEqual(s.sessions().sort(), ["s1", "s2"]);
});

// =================== OnDemandSummarizer ===================

test("summarizer: requires an llm function", () => {
  assert.throws(() => new OnDemandSummarizer({}), /llm/);
});

test("summarizer: empty events returns empty summary, no llm call", async () => {
  let called = false;
  const llm = async () => {
    called = true;
    return "should not happen";
  };
  const sum = new OnDemandSummarizer({ llm });
  const r = await sum.summarize([], "any intent");
  assert.strictEqual(r.summary, "");
  assert.strictEqual(called, false);
  assert.deepStrictEqual(r.trace.eventIds, []);
});

test("summarizer: builds a prompt that includes intent, events, and maxTokens", async () => {
  let receivedPrompt = "";
  const llm = async (p) => {
    receivedPrompt = p;
    return "synthesized summary";
  };
  const sum = new OnDemandSummarizer({ llm, maxTokens: 250 });
  const events = [
    { id: "e1", ts: 1000, kind: "user_message", text: "I prefer Postgres" },
    { id: "e2", ts: 2000, kind: "assistant_message", text: "Noted." },
  ];
  const r = await sum.summarize(events, "decide on a database");
  assert.strictEqual(r.summary, "synthesized summary");
  assert.deepStrictEqual(r.trace.eventIds, ["e1", "e2"]);
  assert.strictEqual(r.trace.maxTokens, 250);
  assert.strictEqual(r.trace.intent, "decide on a database");
  assert.ok(receivedPrompt.includes("decide on a database"));
  assert.ok(receivedPrompt.includes("MAX_TOKENS: 250"));
  assert.ok(receivedPrompt.includes("I prefer Postgres"));
  assert.ok(receivedPrompt.includes("Noted."));
});

test("summarizer: trims summary whitespace", async () => {
  const llm = async () => "  spaced summary  \n";
  const sum = new OnDemandSummarizer({ llm });
  const r = await sum.summarize(
    [{ id: "e1", ts: 1, kind: "msg", text: "x" }],
    "i",
  );
  assert.strictEqual(r.summary, "spaced summary");
});

test("summarizer: custom system prompt is honored", async () => {
  let receivedPrompt = "";
  const llm = async (p) => {
    receivedPrompt = p;
    return "ok";
  };
  const sum = new OnDemandSummarizer({
    llm,
    systemPrompt: "BE TERSE.",
  });
  await sum.summarize([{ id: "e1", ts: 1, kind: "msg", text: "x" }], "i");
  assert.ok(receivedPrompt.startsWith("BE TERSE."));
});

// =================== MemoryDriftWatcher ===================

test("drift: not enough samples returns no alert", () => {
  const w = new MemoryDriftWatcher();
  w.record({ ts: 1, scores: [0.9, 0.8] });
  const s = w.state();
  assert.strictEqual(s.alert, false);
  assert.match(s.reason, /not enough samples/);
});

test("drift: stable scores return no alert", () => {
  const w = new MemoryDriftWatcher({ dropThreshold: 0.15 });
  for (let i = 0; i < 10; i++) {
    w.record({ ts: i, scores: [0.85, 0.82, 0.80] });
  }
  const s = w.state();
  assert.strictEqual(s.alert, false);
});

test("drift: large drop in recent half triggers alert", () => {
  const w = new MemoryDriftWatcher({ dropThreshold: 0.15 });
  // Baseline: high scores
  for (let i = 0; i < 5; i++) {
    w.record({ ts: i, scores: [0.9, 0.85, 0.8] });
  }
  // Recent: collapse
  for (let i = 5; i < 10; i++) {
    w.record({ ts: i, scores: [0.3, 0.25, 0.2] });
  }
  const s = w.state();
  assert.strictEqual(s.alert, true);
  assert.ok(s.dropFraction > 0.15);
  assert.match(s.reason, /dropped/);
});

test("drift: window slides; old samples drop off", () => {
  const w = new MemoryDriftWatcher({ windowSize: 4, dropThreshold: 0.15 });
  // Push 6 samples; only last 4 should be kept.
  for (let i = 0; i < 6; i++) {
    w.record({ ts: i, scores: [0.5] });
  }
  const s = w.state();
  assert.strictEqual(s.samples, 4);
});

test("drift: reset clears the window", () => {
  const w = new MemoryDriftWatcher();
  for (let i = 0; i < 5; i++) {
    w.record({ ts: i, scores: [0.5] });
  }
  w.reset();
  const s = w.state();
  assert.strictEqual(s.samples, 0);
});

// =================== Integration: store + summarizer + drift ===================

test("integration: store -> retrieve -> summarize -> trace shows what was used", async () => {
  const s = new EpisodicStore();
  await s.append({
    sessionId: "s1",
    ts: 1000,
    kind: "user_message",
    text: "user prefers Postgres for the new project",
  });
  await s.append({
    sessionId: "s1",
    ts: 1100,
    kind: "user_message",
    text: "user wants to skip MongoDB",
  });

  const events = await s.retrieve("which database should I use", {
    sessionId: "s1",
    topK: 5,
  });
  assert.ok(events.length >= 1);

  const llm = async (prompt) => {
    // Pretend Claude returned a summary.
    return "User prefers Postgres and explicitly wants to skip MongoDB.";
  };
  const sum = new OnDemandSummarizer({ llm });
  const r = await sum.summarize(events, "pick a database");

  assert.match(r.summary, /Postgres/);
  // Crucial property: trace shows exactly which event ids fed the summary.
  assert.deepStrictEqual(
    new Set(r.trace.eventIds),
    new Set(events.map((e) => e.id)),
  );
});

test("integration: drift watcher catches degradation across many retrievals", async () => {
  const s = new EpisodicStore();
  // Old, relevant memory.
  await s.append({
    sessionId: "s1",
    kind: "msg",
    text: "decision: use Postgres",
  });
  // User intent later drifts to a different topic; old retrieval becomes irrelevant.
  const w = new MemoryDriftWatcher({ dropThreshold: 0.05 });
  for (let i = 0; i < 4; i++) {
    const r = await s.retrieve("use Postgres for the database", { topK: 1 });
    w.record({ ts: i, scores: r.map((x) => x.score) });
  }
  for (let i = 4; i < 8; i++) {
    const r = await s.retrieve("draft a marketing email about cookies", {
      topK: 1,
    });
    w.record({ ts: i, scores: r.map((x) => x.score) });
  }
  const state = w.state();
  assert.strictEqual(state.alert, true);
});
