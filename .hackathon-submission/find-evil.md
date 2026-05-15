# FIND EVIL!

**Find on:** https://devpost.com/c/ai-ml  
**Deadline:** June 15, 2026  
**Prize:** $22K  
**Theme:** AI security threat detection and response

---

## Project name

```
kavach + prompt-injection-shield: minimum-viable defense against agentic threats
```

## Tagline

```
Two tiny libraries that catch the prompt injections and runaway tool calls that cost a real production agent dearly. Copy-pasteable into any stack, no framework lock-in.
```

## About the project (markdown)

```markdown
## Inspiration

A user pasted a help article into our agent. Three minutes later the agent silently rewrote a customer email, leaked an internal config value, and tried to call a tool with arguments that did not match its schema. None of those would have happened with the right two checks at the right two places. The dev.to writeup is at [I Got Burned by Prompt Injection in Production](https://dev.to/mukundakatta/i-got-burned-by-prompt-injection-in-production-here-are-2-tiny-npm-libs-that-stopped-it-438i).

## What it does

Two minimum-viable defenses for an agent under attack:

**kavach**: an inspectable threat-scoring library for AI app security. Takes signals (suspicious URLs in retrieved context, prompt-injection patterns, anomalous tool-call sequences) and produces a weighted score, a tier, and a playbook (allow, log, refuse, escalate to human).

**prompt-injection-shield**: a lightweight scanner that classifies whether untrusted input contains a known injection pattern. Updated regularly with new attack signatures from public corpora.

Used together: prompt-injection-shield runs at every untrusted-input boundary (web search results, document upload, email body). kavach scores the resulting agent step against a policy and routes accordingly.

## How we built it

Pure ESM JavaScript. Zero runtime dependencies. < 500 lines each. Both published on npm.

The classifiers in prompt-injection-shield use both regex patterns (fast) and a small embedding-based fallback (slower but catches paraphrased attacks).

kavach is intentionally not ML-based. It is a deterministic scoring engine you can read end-to-end. When something gets flagged, you can explain why.

## Challenges

The arms race. Every week new injection patterns surface. Settled on a versioned signature file so the library can ship signature updates without changing the API.

## Accomplishments

- Both live on npm. kavach at v0.1.0, prompt-injection-shield in production use.
- Documented attack patterns covered: indirect prompt injection, jailbreak chains, tool-output exfiltration, system-prompt leakage.
- The defenses are narrow on purpose. No "AI security framework" sprawl.

## What's next

A red-team CI action that runs both libraries against a test agent on every PR. Drafted, not shipped.
```

## Built with

```
javascript, typescript, ai-security, prompt-injection, kavach, npm, nodejs
```

## Repo URLs

```
https://www.npmjs.com/package/@mukundakatta/kavach
https://www.npmjs.com/package/@mukundakatta/prompt-injection-shield
```

## Notes

- Theme fit is direct: "AI security threat detection and response".
- Lean on the dev.to post as the demo/walkthrough.
