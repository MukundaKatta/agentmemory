// End-to-end demo: a small Claude agent that uses agentmemory.
//
// What this shows:
//   - EpisodicStore captures every turn (user + assistant + tool).
//   - When a NEW session starts on the same topic, the OnDemandSummarizer
//     pulls relevant past events and asks Claude to write a short
//     context summary.
//   - The summary is shown in the console BEFORE it goes into the prompt,
//     so the user can see exactly what's being injected.
//   - Real delete: the user can ask the agent to forget a specific event
//     and the event is gone, no tombstone, no derived artifact.
//
// Run:
//   ANTHROPIC_API_KEY=sk-ant-... node examples/claude-agent.js
//
// Requires:
//   npm install @anthropic-ai/sdk

import Anthropic from "@anthropic-ai/sdk";
import {
  EpisodicStore,
  OnDemandSummarizer,
} from "@mukundakatta/agentmemory";

const MODEL = "claude-3-5-haiku-latest";

// ---------- 1. Set up Claude as both the agent and the summarizer ----------

const claude = new Anthropic();

async function askClaude(prompt) {
  const r = await claude.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });
  return r.content[0].text;
}

// ---------- 2. Wire the memory pieces ----------

const store = new EpisodicStore();
// No embedder configured: store falls back to keyword overlap retrieval.
// For production, plug in a small embedder (e.g. all-MiniLM-L6-v2 via Transformers.js)
// or a hosted embedding API.

const summarizer = new OnDemandSummarizer({
  llm: askClaude,
  maxTokens: 250,
});

// ---------- 3. Session 1: user states preferences, agent responds ----------

console.log("\n=== Session 1: user states preferences ===");
const session1 = "session-001";

const turn1 = "I prefer Postgres for the new project and want to skip MongoDB.";
console.log("USER:", turn1);
await store.append({
  sessionId: session1,
  kind: "user_message",
  text: turn1,
});
const reply1 = await askClaude(turn1);
console.log("CLAUDE:", reply1);
await store.append({
  sessionId: session1,
  kind: "assistant_message",
  text: reply1,
});

// ---------- 4. Session 2: new session, agent needs context ----------

console.log("\n=== Session 2 (new): agent needs to recall preferences ===");
const session2 = "session-002";

const intent = "pick a database for a new feature";

// Pull, never push: explicitly retrieve and summarize.
const relevant = await store.retrieve(intent, { topK: 5 });
console.log(`\nRetrieved ${relevant.length} relevant past events:`);
for (const e of relevant) {
  console.log(`  - [${e.kind}] ${e.text} (score=${e.score.toFixed(2)})`);
}

const { summary, trace } = await summarizer.summarize(relevant, intent);
console.log("\n--- SUMMARY shown to user before injection ---");
console.log(summary);
console.log("\n--- Trace: which event ids fed this summary ---");
console.log(trace.eventIds);

// Now build the new-session prompt with the explicit memory snippet.
const newPrompt = `Context from past sessions:\n${summary}\n\nNew question: ${intent}`;
const reply2 = await askClaude(newPrompt);
console.log("\nCLAUDE (with memory):", reply2);
await store.append({
  sessionId: session2,
  kind: "assistant_message",
  text: reply2,
});

// ---------- 5. Real delete: user asks to forget a past event ----------

console.log("\n=== Forget request: user asks to delete the Postgres preference ===");
const all = store.list();
const target = all.find((e) => e.text.toLowerCase().includes("postgres"));
if (target) {
  const ok = store.deleteEvent(target.id);
  console.log(`Deleted event ${target.id}: ${ok}`);
}

// Re-retrieve. The Postgres preference should NOT come back.
const afterDelete = await store.retrieve("which database should I use", { topK: 5 });
console.log("\nAfter delete, retrieval returns:");
for (const e of afterDelete) {
  console.log(`  - [${e.kind}] ${e.text}`);
}
console.log(
  "\n(Real delete: no tombstone. The Postgres preference is gone, not just hidden.)\n",
);
