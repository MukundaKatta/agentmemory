# Global MCP Hackathon (Descope)

**URL:** https://globalmcphackathon.com/  
**Deadline:** TBD (currently active)  
**Prize:** $25K cash + $100K credits + Smithery feature

---

## Project name

```
mcp-stack: 14 reliable transforms LLMs reach for instead of imagining
```

## Tagline

```
A single npm workspace shipping 14 small MCP servers in the official Registry. Each does one boring thing well so the model never has to guess.
```

## About the project (markdown)

```markdown
## Inspiration

LLMs reliably mishandle a small set of boring transforms. Shell escaping, CSV edge cases, IANA timezone math, regex semantics, JSON5, TOML, JMESPath, character-precise diffs, SQL formatting across 19 dialects. Each is a single MCP call away from being solved. None of them existed in the official Registry as a focused, well-tested unit until now.

mcp-stack ships fourteen of them in one workspace, all listed in the official MCP Registry under `io.github.MukundaKatta/`.

## What it does

Fourteen MCP servers, one workspace, one publish flow:

1. csv-tools-mcp: RFC 4180 parsing + generation
2. regex-test-mcp: trustworthy JS regex testing
3. jmespath-mcp: deep JSON queries
4. diff-mcp: character-precise unified diffs + patch
5. sqlfmt-mcp: SQL formatting across 19 dialects
6. shellquote-mcp: bash, cmd.exe, PowerShell escaping
7. json5-mcp: parse JSON-with-comments, round-trip to strict
8. toml-yaml-json-mcp: parse, format, convert across three formats
9. timezone-mcp: IANA timezone math via Intl.DateTimeFormat
10. html-to-markdown-mcp: HTML to Markdown via Turndown
11. promptbudget-mcp: token budget pre-flight + chunking
12. ragdrift-mcp: drift diagnosis on demand
13. citecite-mcp: citation marker injection + parse + strip
14. ragmetric-mcp: RAG retrieval IR metrics on demand

## How we built it

TypeScript + the MCP SDK 1.29. Each server is its own npm package under the `@mukundakatta` scope, with stdio transport. node:test for unit tests. mcp-publisher for Registry publication with mcpName field set in package.json.

## Challenges

- mcp-publisher's JWT had a 6 hour TTL, requiring re-login multiple times mid-batch.
- Registry's server.json schema requires camelCase (registryType, registryBaseUrl) and a strict 100-char description max.
- Some packages needed a v0.1.0 to v0.1.1 bump just to add the mcpName field correctly.

## Accomplishments

All 14 are live in the official MCP Registry and installable via `npx -y @mukundakatta/<name>`. Five additional agent reliability servers (`agent*`) and `streamparse` round out the published set to 20 Registry entries total.

## What's next

A second-tier set of agent helpers (memory windows, prompt template diffs) once we see what gets used most.
```

## Built with

```
typescript, mcp-sdk, node, npm, mcp-publisher, mcp-registry, github-actions
```

## Repo URL

```
https://github.com/MukundaKatta/mcp-stack
```

## Demo URL options

```
https://registry.modelcontextprotocol.io/v0/servers?search=io.github.MukundaKatta
```

## Notes

- Pick ONE server (recommend `csv-tools-mcp` or `regex-test-mcp`) as the headline if the form requires single-project framing.
- Smithery feature is a great prize (free distribution boost). Your existing Registry presence means you are already pre-qualified.
- Theme tracks vary; if there is an "agent toolkit" or "developer experience" track, pick that.
