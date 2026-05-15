# Splunk Agentic Ops Hackathon

**URL:** https://splunk.devpost.com/  
**Deadline:** June 15, 2026  
**Prize:** $20K

---

## Project name

```
ragvitals: drift signals into Splunk for the on-call
```

## Tagline

```
A small agent that pushes 5-dim RAG drift signals into Splunk so the same on-call engineer who watches infra also catches retrieval degradation.
```

## About the project (markdown)

```markdown
## Inspiration

Splunk is where the on-call already lives. Every infra alert, every error rate, every SLO burn rate is one search away. RAG quality, until now, has lived somewhere else: a separate eval dashboard, a Slack thread, a manual spot-check. The result is that retrieval degradation gets noticed by the user first, not the on-call. We wanted RAG drift to land in the same Splunk dashboard the team already reads.

## What it does

ragvitals pushes five drift dimensions to Splunk as custom events, on a schedule:

1. Data drift: distribution shift in the source corpus
2. Embedding drift: vector space rotation (MMD, sliced Wasserstein)
3. Response drift: answer style shift
4. Confidence drift: model self-rating shift
5. Query drift: user intent shift

When a dimension crosses threshold, an agent (Claude or any local LLM) writes a short incident summary using the same Splunk event metadata, and the on-call gets a Splunk alert through the same channel they already use for everything else.

## How we built it

- `ragdrift` (Rust crate) for the numerical core.
- `ragdrift-py` (PyPI v0.1.3) for the Python integration.
- Splunk HEC (HTTP Event Collector) for ingestion. The agent posts events directly, no separate forwarder needed.
- Claude or local LLM (LM Studio, Ollama) for the natural language summary.

## Challenges

Splunk events have specific metadata expectations for the dashboard explorer to surface them well. Settled on `sourcetype=rag.drift`, `index=ai_quality`, with each dimension as a top-level field. Discoverable via the same query patterns the team already uses.

## Accomplishments

The project uses Splunk's existing alerting + on-call routing without inventing a new pipeline. The agent is small enough to vendor into your own observability sidecar.

## What's next

Splunk Watchdog correlation: tie drift spikes to known infrastructure events (deploys, autoscaling) so the agent's summary includes the upstream cause when there is one.
```

## Built with

```
splunk, splunk-hec, ragdrift, python, claude, llm, ai-agents, opensearch, observability
```

## Repo URL

```
https://github.com/MukundaKatta/ragdrift
```

## Notes

- Submit to the Observability track.
- Key angle: the on-call already uses Splunk; this turns RAG quality into the same kind of signal infra has had for years.
