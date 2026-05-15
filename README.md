# agentmemory

Honest pull-model memory for LLM agents. The open-source alternative to background-consolidation systems like Anthropic Dreaming, with a different shape: nothing happens in the background, every retrieval shows its work, and deletes are real deletes.

[![npm](https://img.shields.io/npm/v/%40mukundakatta%2Fagentmemory?style=flat-square&label=npm&color=D4A853)](https://www.npmjs.com/package/@mukundakatta/agentmemory)
[![tests](https://img.shields.io/badge/tests-23%2F23-brightgreen?style=flat-square)](#testing)
[![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

## Why this exists

Anthropic shipped Dreaming on May 6, 2026: a managed background consolidation pass that turns episodic conversation traces into semantic memory the next session can use. The OSS reflex is to clone it next weekend with Llama or Qwen. I sat with that and walked away. Full reasoning in [Why I refused to build a Dreaming clone for OSS Claude](https://dev.to/mukundakatta/why-i-refused-to-build-a-dreaming-clone-for-oss-claude-2631).

The short version: **the consolidator IS the model**. Run a smaller LLM to summarize, you get a different feature with the same name and lower quality. Plus deletion gets harder once memories are baked.

agentmemory is a different shape that solves the same job: pull-on-demand instead of push-in-background. The latency tax is real (200ms-2s on cold start). In exchange you get full reversibility, no derived artifacts, and the user can see exactly what was retrieved before it goes into the context.

## Install

```bash
npm install @mukundakatta/agentmemory
```

Requires Node 20+. Pure ESM, zero runtime dependencies.

## Three pieces

### 1. EpisodicStore

Append-only event log of agent interactions. Embedded at write time when an embedder is configured. **Real deletes, no tombstones, no derived artifacts.**

```js
import { EpisodicStore } from "@mukundakatta/agentmemory";

const store = new EpisodicStore({
  embedder: async (text) => myEmbedder(text), // optional; falls back to keyword overlap
});

await store.append({
  sessionId: "user-42",
  kind: "user_message",
  text: "I prefer Postgres for the new project",
});

const hits = await store.retrieve("which database should I use", {
  sessionId: "user-42",
  topK: 5,
});

// Real delete: gone, no trace.
const eventId = hits[0].id;
store.deleteEvent(eventId);

// Retention policies are first-class:
store.deleteOlderThan(Date.now() - 30 * 24 * 60 * 60 * 1000);
store.deleteSession("user-42");
```

### 2. OnDemandSummarizer

The pull-model context builder. Bring your own LLM. The summary is **shown in the trace, never silently injected**.

```js
import { OnDemandSummarizer } from "@mukundakatta/agentmemory";
import Anthropic from "@anthropic-ai/sdk";

const claude = new Anthropic();

const summarizer = new OnDemandSummarizer({
  llm: async (prompt) => {
    const r = await claude.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });
    return r.content[0].text;
  },
  maxTokens: 300,
});

const events = await store.retrieve("pick a database", { topK: 5 });
const { summary, trace } = await summarizer.summarize(events, "pick a database");

console.log("Summary:", summary);
console.log("Built from event ids:", trace.eventIds);
console.log("Prompt sent to LLM:", trace.prompt);
```

The trace lets you show the user (or log to your audit trail) exactly which events fed the summary. This is the key honesty property: nothing silent, nothing magical.

### 3. MemoryDriftWatcher

Watches retrieval quality over time. If yesterday's "remember when we discussed X" stops returning anything because user intent has drifted, you get a signal instead of a silent regression.

```js
import { MemoryDriftWatcher } from "@mukundakatta/agentmemory";

const watcher = new MemoryDriftWatcher({
  windowSize: 20,
  dropThreshold: 0.15, // 15% mean-score drop alerts
});

// After every retrieval call:
watcher.record({ ts: Date.now(), scores: hits.map((h) => h.score) });

const state = watcher.state();
if (state.alert) {
  console.warn("Memory drift alert:", state.reason);
}
```

For the heavy-duty drift math (MMD, sliced Wasserstein, KS, PSI, k-means cluster shift across five dimensions) see the sibling library [`ragdrift`](https://github.com/MukundaKatta/ragdrift).

## Design rules

1. **No background work.** Everything is synchronous-from-the-caller's-perspective. No cron, no consolidation pass, no "memories are being baked" race conditions.
2. **Real deletes.** No tombstones. No derived artifacts that survive after the source is deleted. If a user asks you to forget something, you can.
3. **Pull, never push.** The summarizer is called explicitly from the agent's main loop. Nothing gets injected without a call.
4. **Show the trace.** Every summary returns the event ids and the exact prompt that produced it.
5. **BYO LLM.** No assumption about which model summarizes. Use Claude, GPT, Gemini, or a local model. The library is the same.
6. **Zero runtime dependencies.** The whole library is < 500 lines. Easy to read end-to-end.

## What this is not

- Not a Dreaming clone. Different shape on purpose.
- Not a vector database. The default in-memory store is for tests and small agents. For production, swap for a persistent backend that satisfies the same interface.
- Not a "memory framework." Three small classes you compose into your existing agent loop.

## Compatibility with the [@mukundakatta/agent*](https://www.npmjs.com/~mukundakatta) reliability stack

agentmemory pairs cleanly with the existing zero-dep agent stack:

| Library | What it does |
|---|---|
| [`@mukundakatta/agentfit`](https://www.npmjs.com/package/@mukundakatta/agentfit) | Token-aware truncation. Use to fit a summary plus the new turn into your context budget. |
| [`@mukundakatta/agentguard`](https://www.npmjs.com/package/@mukundakatta/agentguard) | Network egress allowlist. Use to keep retrieved memories from triggering unrelated tool calls. |
| [`@mukundakatta/agentsnap`](https://www.npmjs.com/package/@mukundakatta/agentsnap) | Tool-call trace snapshots. Snapshot the agent's behavior with and without memory. |
| [`@mukundakatta/agentvet`](https://www.npmjs.com/package/@mukundakatta/agentvet) | Tool arg validation before execution. |
| [`@mukundakatta/agentcast`](https://www.npmjs.com/package/@mukundakatta/agentcast) | Structured output enforcer. Use to make the summarizer return JSON when needed. |

## Testing

```bash
npm test
```

23 tests, all passing. Tests cover:

- EpisodicStore: append, embed, retrieve (cosine + keyword fallback), filters (session, time, kind), deleteEvent, deleteSession, deleteOlderThan, sessions
- OnDemandSummarizer: requires LLM, empty-events shortcut, prompt structure, summary trim, custom system prompt
- MemoryDriftWatcher: cold-start, stable scores, drop alert, sliding window, reset
- Integration: end-to-end flow + drift watcher catching memory-quality decay

## License

MIT. See [LICENSE](LICENSE).

## Related

- Companion essay: [Why I refused to build a Dreaming clone for OSS Claude](https://dev.to/mukundakatta/why-i-refused-to-build-a-dreaming-clone-for-oss-claude-2631)
- Sibling library for full drift math: [ragdrift](https://github.com/MukundaKatta/ragdrift)
- The rest of the agent reliability stack: [@mukundakatta on npm](https://www.npmjs.com/~mukundakatta)
