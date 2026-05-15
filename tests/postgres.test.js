// Tests for the Postgres adapter.
//
// Skipped automatically when DATABASE_URL is not set, so CI on a clean box
// just passes through. To run locally:
//
//   docker run -d --rm --name agentmem-pg -p 5433:5432 \
//     -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=agentmem postgres:16
//   DATABASE_URL=postgres://postgres:postgres@localhost:5433/agentmem \
//     node --test tests/postgres.test.js

import { test } from "node:test";
import assert from "node:assert";

const DB = process.env.DATABASE_URL;

if (!DB) {
  test("postgres adapter: skipped (set DATABASE_URL to run)", { skip: true }, () => {});
} else {
  // Dynamic import so `pg` is only required when the user runs Postgres tests.
  const { default: pg } = await import("pg");
  const { PostgresEpisodicStore } = await import("../src/adapters/postgres.js");

  const TABLE = `agentmemory_test_${Math.floor(Math.random() * 1e9)}`;
  const pool = new pg.Pool({ connectionString: DB });
  const store = new PostgresEpisodicStore({ pool, tableName: TABLE });

  test("postgres: init creates table", async () => {
    await store.init();
    const r = await pool.query(
      `SELECT to_regclass('${TABLE}') AS t`,
    );
    assert.strictEqual(r.rows[0].t, TABLE);
  });

  test("postgres: append + size + sessions", async () => {
    await store.append({ sessionId: "s1", kind: "msg", text: "hello" });
    await store.append({ sessionId: "s2", kind: "msg", text: "world" });
    assert.strictEqual(await store.size(), 2);
    assert.deepStrictEqual((await store.sessions()).sort(), ["s1", "s2"]);
  });

  test("postgres: retrieve by keyword overlap", async () => {
    const r = await store.retrieve("hello world", { topK: 5 });
    assert.ok(r.length > 0);
    // Best match should be one of the two we wrote.
    assert.ok(["hello", "world"].includes(r[0].text));
  });

  test("postgres: list filters by sessionId", async () => {
    const r = await store.list({ sessionId: "s1" });
    assert.strictEqual(r.length, 1);
    assert.strictEqual(r[0].sessionId, "s1");
  });

  test("postgres: get returns event by id", async () => {
    const e = await store.append({
      sessionId: "s3",
      kind: "msg",
      text: "find me",
    });
    const fetched = await store.get(e.id);
    assert.strictEqual(fetched.text, "find me");
  });

  test("postgres: deleteEvent removes the row", async () => {
    const e = await store.append({
      sessionId: "s4",
      kind: "msg",
      text: "delete me",
    });
    const ok = await store.deleteEvent(e.id);
    assert.strictEqual(ok, true);
    assert.strictEqual(await store.get(e.id), undefined);
  });

  test("postgres: deleteSession removes all rows for that session", async () => {
    await store.append({ sessionId: "s5", kind: "msg", text: "a" });
    await store.append({ sessionId: "s5", kind: "msg", text: "b" });
    const n = await store.deleteSession("s5");
    assert.strictEqual(n, 2);
  });

  test("postgres: deleteOlderThan enforces retention", async () => {
    await store.append({
      sessionId: "s6",
      ts: 100,
      kind: "msg",
      text: "old",
    });
    await store.append({
      sessionId: "s6",
      ts: Date.now(),
      kind: "msg",
      text: "new",
    });
    const n = await store.deleteOlderThan(Date.now() - 1000);
    assert.ok(n >= 1);
  });

  test("postgres: embedder is called and stored", async () => {
    const calls = [];
    const embedder = (text) => {
      calls.push(text);
      return [1, 0, 0];
    };
    const s = new PostgresEpisodicStore({
      pool,
      tableName: TABLE,
      embedder,
    });
    const e = await s.append({
      sessionId: "s7",
      kind: "msg",
      text: "embed me",
    });
    assert.deepStrictEqual(calls, ["embed me"]);
    const fetched = await s.get(e.id);
    assert.deepStrictEqual(fetched.embedding, [1, 0, 0]);
  });

  test("postgres: cleanup test table", async () => {
    await pool.query(`DROP TABLE IF EXISTS ${TABLE}`);
    await pool.end();
  });
}
