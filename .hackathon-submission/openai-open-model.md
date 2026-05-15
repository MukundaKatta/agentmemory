# OpenAI Open Model Hackathon (gpt-oss)

**URL:** https://openai.devpost.com/  
**Format:** 6-week active. Best Local Agent track.  
**Partners:** OpenAI, Hugging Face, Nvidia, Ollama, vLLM, LM Studio

---

## Project name

```
agentkit-offline: 5-lib reliability stack for local gpt-oss agents
```

## Tagline

```
Five tiny zero-dep libraries that turn a local gpt-oss model into an agent you can trust offline. Token budget, snapshot tests, validators, network egress firewall, structured output enforcer.
```

## About the project (markdown)

```markdown
## Inspiration

Running gpt-oss locally is the easy part. Making the agent on top of it not break in production is the harder part: tool args drift, JSON outputs malform, network calls leak to wrong domains, prompts overflow context, and there is no eval safety net. A handful of small focused libraries solves each of those without a heavyweight framework.

## What it does

agentkit-offline composes five libraries from the `@mukundakatta/agent*` family:

1. **agentfit**: token-aware message truncation. Fits chat history into the local model's context budget with multiple strategies.
2. **agentguard**: declarative network egress allowlist. The agent can only fetch from domains you whitelist.
3. **agentsnap**: Jest-style snapshot tests for tool-call traces. Catches regressions during refactors.
4. **agentvet**: validates tool-call args before execution. Returns LLM-friendly retry hints when args are malformed.
5. **agentcast**: structured-output enforcer with a validate-then-retry loop. Gets clean JSON out of a small model.

All five run offline: no network, no telemetry, no API keys. They wrap whatever local runner you use (Ollama, LM Studio, vLLM, llama.cpp).

## How we built it

Pure ESM JavaScript. Zero runtime dependencies in any of the five. TypeScript types in the box for editor support. Each library is < 500 lines and < 10 KB minified. All published to npm under `@mukundakatta/agent*`.

For gpt-oss specifically, the wrapper layer is < 100 lines that turns the openai-compatible API gpt-oss exposes into the shapes the five libraries expect.

## Challenges

Keeping the dependency graph empty. Every dependency is a new attack surface and a new node_modules cost. Settled on standard library only for everything except agentcast (which uses Ajv for JSON Schema, the only way to get cleanly).

## Accomplishments

- All five live on npm under the `@mukundakatta` scope.
- Each one is small enough to read end-to-end in 15 minutes.
- The whole stack runs on a 16 GB MacBook with gpt-oss-20b.

## What's next

A sixth library: agentmemory. On-demand summarization of past sessions for local agents that need persistence without the storage cost of full transcripts. Drafted, not shipped.
```

## Built with

```
javascript, typescript, gpt-oss, ollama, vllm, lm-studio, npm, nodejs, ajv, llama-cpp
```

## Repo URLs

```
https://www.npmjs.com/package/@mukundakatta/agentfit
https://www.npmjs.com/package/@mukundakatta/agentguard
https://www.npmjs.com/package/@mukundakatta/agentsnap
https://www.npmjs.com/package/@mukundakatta/agentvet
https://www.npmjs.com/package/@mukundakatta/agentcast
```

## Notes

- Track: **Best Local Agent** is the perfect fit.
- Differentiator: zero runtime deps + offline-only. Most submissions will use a framework with tracking/telemetry.
