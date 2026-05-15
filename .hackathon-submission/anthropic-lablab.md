# Anthropic AI Hackathon (lablab.ai)

**URL:** https://lablab.ai/ai-hackathons/anthropic-ai-hackathon  
**When:** May 26 → June 2, 2026 (7 days)  
**Solo OK. Claude API access provided.**

---

## Project name

```
agentmemory: pull-model alternative to Anthropic Dreaming
```

## Tagline

```
The honest open-source version of Dreaming. On-demand summarization with provenance and real deletes, instead of a background consolidation that bakes memories you cannot un-bake.
```

## About the project (markdown)

```markdown
## Inspiration

Anthropic shipped Dreaming on May 6 as a managed background consolidation pass. The OSS reflex is to clone it next weekend with Llama or Qwen. I sat with that and walked away (full reasoning in [the dev.to post](https://dev.to/mukundakatta/why-i-refused-to-build-a-dreaming-clone-for-oss-claude-2631)).

The core problem with cloning Dreaming: the consolidator IS the model. Run a smaller LLM to summarize, you get a different feature with the same name and lower quality. Plus deletion gets harder once memories are baked.

agentmemory is the honest version. Not a Dreaming clone, a different shape that handles the same job.

## What it does

Three pieces:

1. **Time-bucketed episodic store**: append-only event log of agent interactions, embedded at write time, indexed by session and timestamp. No consolidation. Retention policy is per-event. Deletion is a real delete.

2. **On-demand summarizer**: when a new session starts and the prompt budget allows, retrieve the top-N relevant events for the current intent and summarize them inline using the same model the runtime uses. The summary is shown in the trace, never silently injected.

3. **ragdrift integration**: watch the retrieval distribution over time. If yesterday's "remember when we discussed X" stops returning anything because the user's intent has drifted, surface that as a drift signal instead of pretending the memory is healthy.

## How we built it

Pull model instead of push. The latency tax is real (200ms-2s on cold start), but in exchange you get full reversibility, no derived artifacts, and the user can see exactly what was retrieved before it goes into the context.

Built on Claude via the Anthropic SDK for the summarizer. Uses `ragdrift-py` for the retrieval-quality watching.

## Challenges

The discipline of NOT building the magical version. Every weekend project on this theme will be Dreaming-shaped. The pull-model version is honest about its limits.

## Accomplishments

The first piece (episodic store + summarizer) runs on a 16 GB MacBook with Claude Haiku as the summarizer. The full design is documented in the linked dev.to post.

## What's next

Multi-session compaction with explicit user consent dialogs (you must click "yes, summarize this older session" before the summarizer touches it).
```

## Built with

```
javascript, typescript, esm, anthropic-sdk, claude, node, npm
```

## Repo URL

```
https://github.com/MukundaKatta/agentmemory
```

## npm package

```
https://www.npmjs.com/package/@mukundakatta/agentmemory
```

Install: `npm install @mukundakatta/agentmemory`

## Demo / write-up URL

```
https://dev.to/mukundakatta/why-i-refused-to-build-a-dreaming-clone-for-oss-claude-2631
```

## Status: SHIPPED v0.2.0 + live demo ready

- ✅ Library on npm at v0.2.0 (`npm install @mukundakatta/agentmemory`)
- ✅ GitHub repo public at MukundaKatta/agentmemory
- ✅ Three modules: `EpisodicStore`, `OnDemandSummarizer`, `MemoryDriftWatcher`
- ✅ End-to-end **Claude demo** at `examples/claude-agent.js` (uses Anthropic SDK + agentmemory)
- ✅ **Postgres adapter** (`PostgresEpisodicStore`) for production with real `DELETE` semantics
- ✅ **Streamlit live demo** at `examples/streamlit/app.py` (Python sibling, dry-run mode for reviewers)
- ✅ 24 tests, 23 pass + 1 Postgres test correctly skipped without DATABASE_URL
- ✅ Companion essay live on dev.to (5 min read)
- ✅ Zero runtime dependencies, pure ESM, Node 20+, MIT

## Live demo URL

```
https://agentmemory.streamlit.app
```

Deployed on Streamlit Community Cloud, dry-run mode enabled (works without an API key for casual exploration). To enable Claude calls, set `ANTHROPIC_API_KEY` under Settings > Secrets at https://share.streamlit.io.

## Notes

- The contrarian framing (refused to clone Dreaming, built honest alternative) is the angle. Anthropic judges will notice.
- 7-day sprint runs May 26 - June 2. Library was scaffolded May 15. Plan: spend the contest week recording a 3-5 min demo video + polish + maybe one more adapter (Redis or in-memory-with-snapshot) and submit.
- **Disclose timing honestly in the submission:** "design and core library shipped May 15 in advance of the contest opening; the demo agent + Postgres adapter were also done in advance to validate the design. Polish and the Claude-integration video were produced during the contest window."
