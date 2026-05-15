# UiPath Global AgentHack 2026

**URL:** https://buildindia2026.devfolio.co/ (or via DevPost when listed)  
**Deadline:** TBD (recently launched)  
**Format:** Devpost-hosted, individual or team up to 4. GitHub repo + demo video required.

---

## Project name

```
mcp-stack: 14 reliable transforms for UiPath agents
```

## Tagline

```
A UiPath agent that calls 14 well-tested MCP servers for the boring transforms (CSV, regex, JMESPath, SQL formatting) that LLMs reliably get wrong. One npm install per tool, no framework lock-in.
```

## About the project (markdown)

```markdown
## Inspiration

UiPath agents are excellent at orchestrating workflows but pay a tax every time they reach for a transform LLMs typically get wrong. CSV with embedded commas. Regex with lookahead. JMESPath against deep JSON. SQL formatting across dialects. Each is a small, well-defined problem that should be a tool call away.

mcp-stack solves this. Fourteen MCP servers, each focused on one boring-but-frequently-broken transform.

## What it does

Each of the fourteen servers is one focused tool the UiPath agent can call:

| Server | What it does |
|---|---|
| csv-tools-mcp | RFC 4180 CSV parsing + generation |
| regex-test-mcp | Trustworthy JS regex testing |
| jmespath-mcp | Deep JSON queries |
| diff-mcp | Character-precise unified diffs |
| sqlfmt-mcp | SQL formatting across 19 dialects |
| shellquote-mcp | bash, cmd.exe, PowerShell escaping |
| json5-mcp | Parse JSON5, round-trip to strict |
| toml-yaml-json-mcp | Convert across three formats |
| timezone-mcp | IANA timezone math |
| html-to-markdown-mcp | HTML to Markdown |
| promptbudget-mcp | Token budget pre-flight |
| ragdrift-mcp | RAG drift diagnosis |
| citecite-mcp | Citation marker handling |
| ragmetric-mcp | RAG retrieval IR metrics |

A UiPath agent orchestrating a customer-data workflow can call csv-tools-mcp to parse the input, jmespath-mcp to extract fields, sqlfmt-mcp to format the resulting query, and shellquote-mcp to escape values being passed to a shell call. Each is one MCP call. The model never has to guess.

## How we built it

TypeScript + MCP SDK 1.29. Each server published independently to npm under `@mukundakatta`. All 14 listed in the official MCP Registry.

## Challenges

mcp-publisher's JWT had a 6 hour TTL. Multiple re-logins mid-batch. Built a small pre-flight to check token expiry before kicking off a batch.

## Accomplishments

All 14 servers live in the [official MCP Registry](https://registry.modelcontextprotocol.io/v0/servers?search=io.github.MukundaKatta), each callable from any MCP client (Claude Desktop, Cursor, Cline, Windsurf, Zed, and any UiPath agent that speaks MCP).

## What's next

A UiPath-specific orchestration template that wires all 14 into a sample workflow.
```

## Built with

```
typescript, mcp-sdk, uipath, node, npm, mcp-registry
```

## Repo URL

```
https://github.com/MukundaKatta/mcp-stack
```

## Notes

- UiPath cares about agentic automation. The MCP-as-tool-belt framing is the strongest angle.
- Devpost-hosted means similar form structure to GCP Rapid Agent (use that as a template).
