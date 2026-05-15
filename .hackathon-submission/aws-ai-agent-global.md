# AWS AI Agent Global Hackathon

**URL:** https://aws-agent-hackathon.devpost.com/  
**Prize:** $45K cash + $100/dev AWS credits

---

## Project name

```
ragvitals on Bedrock: drift agent for Claude on AWS
```

## Tagline

```
A Bedrock-powered agent that watches your RAG for 5-dim drift and triggers a Lambda runbook when retrieval quality degrades.
```

## About the project (markdown)

```markdown
## Inspiration

Production RAG silently degrades as the corpus shifts, embeddings rotate, and user intent moves. Most teams find out from a complaint, not a metric. We wanted an agent that runs on AWS, watches the RAG itself, and acts before users do.

## What it does

ragvitals on Bedrock is a Claude-powered agent that:

1. Pulls the last N retrieval traces from OpenSearch (your existing vector store).
2. Runs `ragdrift` against five dimensions: data, embedding, response, confidence, query.
3. Asks Claude to interpret the scores and recommend the next action.
4. Invokes a Lambda runbook (rebuild index, swap embedding, rotate prompts) when threshold is crossed.
5. Posts a Slack incident summary and writes the full report to S3.

## How we built it

- `ragdrift` (Rust) for the math, `ragdrift-py` (PyPI) for the Python integration layer.
- Amazon Bedrock for Claude inference.
- OpenSearch for vector storage and retrieval traces.
- Lambda for the runbook executor.
- EventBridge schedule for the polling loop.
- CloudWatch for the drift metric exports.

## Challenges

OpenSearch trace shape varies across deployments. Built a small adapter so the agent can ingest from `_search` responses or from a custom log format without code changes.

Bedrock latency on cold starts. Wrapped Claude calls with a timeout and a fallback summary that the agent can post even when Bedrock is slow, then enriches when the response arrives.

## Accomplishments

- Already on PyPI and crates.io as `ragdrift-py` v0.1.3 and `ragdrift` v0.1.3.
- Shipping with adapters for OpenSearch, pgvector, and Pinecone.
- CloudWatch exporter is one of the three production exporters in the box.

## What's next

Bedrock AgentCore migration: move the schedule-and-summarize loop into AgentCore so it composes with other agents you have running.
```

## Built with

```
rust, python, amazon-bedrock, claude, opensearch, lambda, eventbridge, s3, cloudwatch, pyo3, maturin, slack-api
```

## Repo URL

```
https://github.com/MukundaKatta/ragdrift
```

## Notes

- Submit to the Bedrock track if available.
- AgentCore + AWS Partner products track may also fit.
- $100 AWS credits per dev (first come, first serve) is worth grabbing during registration.
