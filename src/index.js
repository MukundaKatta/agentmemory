// agentmemory — honest pull-model memory for LLM agents.
//
// Three pieces:
//
//   1. EpisodicStore        — append-only event log with real deletes
//   2. OnDemandSummarizer   — pull-model context builder (BYO LLM, never silent)
//   3. MemoryDriftWatcher   — flags when retrieval quality drops
//
// Designed as the open-source alternative to background-consolidation memory
// systems (like Anthropic Dreaming). Trade-off: pull beats push on
// reversibility, transparency, and cost; loses on latency.

export { EpisodicStore } from "./store.js";
export { OnDemandSummarizer } from "./summarizer.js";
export { MemoryDriftWatcher } from "./drift.js";
