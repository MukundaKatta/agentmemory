# DevNetwork [AI + ML] Hackathon 2026

**URL:** https://devnetwork-ai-ml-hack-2026.devpost.com/  
**Deadline:** May 28, 2026  
**You are already registered (visible on your Devpost dashboard).**

---

## Project name (60 chars)

```
ragvitals: 5-dim RAG drift agent
```

## Elevator pitch (≤200 chars)

```
Autonomous agent that watches your RAG for 5-dimensional drift and acts when retrieval quality degrades, before users notice. Rust core, Python wheel, ships everywhere.
```

## About the project (markdown)

```markdown
## Inspiration

Most RAG systems break quietly. The retrieval gets a little worse, the model starts paraphrasing more, citations stop matching the source, and nobody notices until a user complains. We wanted an agent that watches the system itself and acts before that complaint lands.

## What it does

ragvitals monitors a production RAG pipeline across five drift dimensions:

1. Data drift: distribution shift in the source corpus
2. Embedding drift: shift in the vector space (MMD with RBF kernel, sliced Wasserstein)
3. Response drift: shift in answer style and length
4. Confidence drift: shift in the model's self-rated certainty
5. Query drift: shift in the kinds of questions users are asking

When any dimension crosses threshold, the agent explains which one drifted, recommends the next action, and writes a short incident summary the on-call engineer reads.

## How we built it

Math in Rust, ergonomic facade in Python.

- `ragdrift` (Rust crate): the numerical core. ndarray, rayon, MMD with median heuristic, sliced Wasserstein-1, KS, PSI, k-means cluster assignment shift.
- `ragdrift-py` (PyPI wheel): PyO3 + maturin, abi3-py310 so one wheel covers Python 3.10 to 3.13.
- Storage adapters: OpenSearch, pgvector, Pinecone.
- Metric exporters: CloudWatch, Prometheus, Datadog.

## Challenges

Getting the Wasserstein math fast and explainable. Real corpora throw ragged batch sizes, near-empty distributions during cold start, and embedding-space rotation that looks like drift but is not. The Rust core handles a check in roughly 3 ms.

## Accomplishments

- Five drift dimensions in one library, not five separate tools.
- v0.1.3 on both crates.io and PyPI, MIT/Apache-2.0 licensed.
- Production-ready storage and exporter coverage out of the box.

## What we learned

Drift detection is the part of RAG ops most teams skip until it bites them.

## What's next

A second agent that auto-applies the recommended fix in shadow mode and waits for human approval to promote.
```

## Built with

```
rust, python, pyo3, maturin, ndarray, rayon, opensearch, pgvector, pinecone, cloudwatch, prometheus, datadog, github-actions
```

## Try it out / repo URL

```
https://github.com/MukundaKatta/ragdrift
```

## What you still need

- Demo video (YouTube or Vimeo URL): _to add_
- Live demo URL: _to add — could be the dev.to post that demos the lib_
- Cover image: optional, skip is fine
- Tracks: pick whichever AI/agent track best matches

## Notes

- DevNetwork hackathons are co-located with AI DevSummit. Reasonable cred for being a finalist.
- Same project base as GCP Rapid Agent. You can reuse the video and most fields verbatim.
