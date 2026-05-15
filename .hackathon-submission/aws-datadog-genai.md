# AWS + Datadog Generative AI Hackathon 2026

**URL:** https://events.datadoghq.com/events/aws-generative-ai-hackathon-challenge-2026/  
**Prize:** $25K AWS credits + $10K prizes

---

## Project name

```
ragvitals on AgentCore + Datadog MCP
```

## Tagline

```
A Bedrock AgentCore agent that uses Datadog MCP to surface 5-dim RAG drift signals back to the on-call dashboard, before users notice.
```

## About the project (markdown)

```markdown
## Inspiration

Datadog already watches every other system the team owns. RAG quality is one of the few signals it does not. With Datadog MCP and Bedrock AgentCore newly available, the missing piece (drift detection) becomes a tool the agent can call, and the result becomes a dashboard the team already reads.

## What it does

The agent runs on Bedrock AgentCore. Every five minutes it:

1. Calls `ragdrift` against the last batch of retrieval traces.
2. Pushes the five drift dimensions to Datadog as custom metrics via Datadog MCP.
3. If any dimension crosses threshold, the agent uses Claude to write a one-paragraph summary and creates a Datadog incident.
4. The on-call gets the same alert path they already have for everything else.

## How we built it

- Bedrock AgentCore for orchestration.
- Datadog MCP server for metric and incident creation (the agent uses MCP tools natively).
- `ragdrift-py` (PyPI v0.1.3) for the drift math.
- Claude on Bedrock for the natural language summary.
- Lambda for the polling trigger.

## Challenges

Custom metric naming. The five drift dimensions need consistent naming conventions to be useful in the Datadog explorer. Settled on `rag.drift.<dimension>.<percentile>` to be discoverable alongside infrastructure metrics.

## Accomplishments

The agent uses Datadog MCP rather than the REST API directly, so swapping to a different observability backend means swapping one MCP server, not rewriting the agent.

## What's next

Datadog Watchdog correlation: if drift spikes correlate with infrastructure incidents (deploy, autoscaling), surface that to the agent so its summary includes the upstream cause.
```

## Built with

```
amazon-bedrock-agentcore, datadog-mcp, datadog, claude, ragdrift, python, pyo3, lambda, opensearch
```

## Repo URL

```
https://github.com/MukundaKatta/ragdrift
```

## Notes

- Datadog MCP integration is the differentiator here. Lean into it in the writeup.
- AWS Partner products track is the right submission category.
