# Mega Agent-A-Thon

**Find on:** https://devpost.com/c/ai-ml  
**Deadline:** June 14, 2026  
**Prize:** Non-monetary (badges, recognition)

---

## Project name

```
agentkit: 5 small libs that solve the boring agent-reliability problems
```

## Tagline

```
Five focused npm libraries (fit, guard, snap, vet, cast) that turn any LLM into an agent you can trust in production. Compose what you need, skip what you do not.
```

## About the project (markdown)

```markdown
## Inspiration

Most "agent frameworks" force you to adopt their entire stack: their prompting, their tool calling, their orchestration, their tracing. The honest version of each problem is much smaller. fit a chat history into a budget. guard the network egress. snap a tool-call trace as a regression test. vet args before execution. cast LLM text into clean JSON. Five tiny libraries, each does one thing, no framework lock-in.

## What it does

Five composable libraries, all on npm under `@mukundakatta/agent*`:

1. **agentfit**: token-aware message truncation
2. **agentguard**: declarative network egress allowlist
3. **agentsnap**: Jest-style snapshot tests for tool-call traces
4. **agentvet**: validate tool-call args, return retry hints
5. **agentcast**: structured-output enforcer with retry loop

Use one. Use all five. Use three and write your own for the other two. The point is composability without commitment.

## How we built it

Pure ESM JavaScript. Zero runtime dependencies in any of them. TypeScript types in the box.

## Challenges

Resisting the temptation to add a sixth library that ties them together. The whole point is they DO NOT need to know about each other.

## Accomplishments

All five live on npm under the `@mukundakatta` scope, each shipped as both a library and an MCP server.

## What's next

Each library has a Rust port already on crates.io for native deployments.
```

## Built with

```
javascript, typescript, npm, mcp-sdk, ai-agents, llm
```

## Repo URLs

```
https://www.npmjs.com/~mukundakatta
```

## Notes

- Non-cash hackathon = lower stakes, easier write-up. Use the existing dev.to "Six Reliability Primitives" post as a starting point.
- Differentiator: zero-deps, composable, no framework.
