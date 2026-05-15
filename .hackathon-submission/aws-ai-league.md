# AWS AI League 2026 Championship

**URL:** https://aws.amazon.com/about-aws/whats-new/2025/11/ai-league-2026-championship/  
**Prize:** $50K (doubled from prior year)

---

## Project name

```
ragvitals: AgentCore drift detection for SageMaker-served Claude
```

## Tagline

```
A Bedrock AgentCore agent that watches drift in a SageMaker custom-model RAG pipeline. Two AWS Partner products in one entry.
```

## About the project (markdown)

```markdown
## Inspiration

The two AWS AI League tracks (Model Customization with SageMaker, Agentic AI with Bedrock AgentCore) are usually separate submissions. RAG drift detection is the place they meet: customize the embedding model on SageMaker, run inference, watch the embedding drift on AgentCore. One coherent project, one submission.

## What it does

Two phases:

Phase 1, Model Customization: fine-tune a small embedding model on a domain corpus using SageMaker. Compare baseline cosine similarity against the fine-tuned scores using `ragdrift`'s embedding-drift detector to validate the fine-tune actually shifted the right things.

Phase 2, Agentic AI: deploy a Bedrock AgentCore agent that watches the production retrieval pipeline. When the embedding drift detector flags a shift greater than 2 standard deviations from the baseline, the agent decides whether to trigger a SageMaker re-fine-tune or rebuild the index.

## How we built it

- SageMaker for the embedding fine-tune job.
- Bedrock AgentCore for the agent runtime.
- `ragdrift` and `ragdrift-py` for the math.
- Claude on Bedrock for the routing decision.
- S3 + EventBridge for the trigger pipeline.

## Challenges

Tying the SageMaker fine-tune metadata to the AgentCore agent's drift baseline. Resolved by writing a small manifest to S3 after each fine-tune that the agent reads to know what its current baseline should look like.

## Accomplishments

Both tracks satisfied in one entry: the customization is real (SageMaker fine-tune with measurable embedding shift), the agent is real (AgentCore + Claude + drift detection).

## What's next

A second small model on SageMaker that scores the agent's routing decisions against ground truth, so the agent learns which interventions actually improve quality versus just shifting numbers around.
```

## Built with

```
sagemaker, bedrock-agentcore, claude, ragdrift, python, pyo3, s3, eventbridge, opensearch
```

## Repo URL

```
https://github.com/MukundaKatta/ragdrift
```

## Notes

- Submit to both tracks if the rules allow (Model Customization + Agentic AI).
- Key differentiator: the project ties the two tracks together with a real workflow, not two separate demos.
