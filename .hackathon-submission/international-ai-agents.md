# International AI Agents Hackathon

**Find on:** https://devpost.com/c/ai-ml  
**Deadline:** May 29, 2026  
**Prize:** $100  
**Theme:** Intelligent workflow automation agents

---

## Project name

```
mcp-stack: 14 utility MCP servers for workflow automation agents
```

## Tagline

```
A workflow automation agent only as reliable as the transforms it calls. mcp-stack ships 14 boring-but-trustworthy MCP servers that LLMs cannot fake their way through.
```

## About the project (markdown)

```markdown
## Inspiration

Workflow automation agents fail in predictable ways. The model gets shell escaping wrong, the CSV parser silently drops rows with embedded commas, the regex matches one too many things, the JSON path query returns null when the agent expected an array. Each of these is a one-line MCP call away from being solved correctly.

mcp-stack ships fourteen of those one-line solutions, all listed in the official MCP Registry.

## What it does

Fourteen focused MCP servers that any agent (UiPath, n8n, Zapier-style, custom) can call:

- csv-tools-mcp, regex-test-mcp, jmespath-mcp, diff-mcp, sqlfmt-mcp
- shellquote-mcp, json5-mcp, toml-yaml-json-mcp, timezone-mcp, html-to-markdown-mcp
- promptbudget-mcp, ragdrift-mcp, citecite-mcp, ragmetric-mcp

Each one does exactly what its name says. No hidden behavior, no model-call inside the tool, no surprise side effects.

## How we built it

TypeScript + MCP SDK 1.29. Each server is its own npm package under `@mukundakatta`. Each ships as both a library and an MCP server.

## Accomplishments

All 14 live in the [official MCP Registry](https://registry.modelcontextprotocol.io/v0/servers?search=io.github.MukundaKatta) and installable with `npx -y @mukundakatta/<name>`.

## What's next

Workflow templates that wire 5-7 of the servers into common automation patterns (data ingest, report generation, content moderation).
```

## Built with

```
typescript, mcp-sdk, node, npm, mcp-registry, workflow-automation
```

## Repo URL

```
https://github.com/MukundaKatta/mcp-stack
```

## Notes

- Smallest prize but easy submission. Reuse most of the UiPath AgentHack writeup.
- May 29 deadline (14 days from now).
