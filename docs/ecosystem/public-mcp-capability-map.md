# Public MCP Capability Map

This page is the human-readable companion for Shopflow's **live read-only stdio
MCP** and the packet that describes it.

In plain language:

> this is the public capability sheet for the live stdio MCP.

## Use This When

You need one honest answer to:

- what the current read-only stdio MCP exposes
- which capabilities are already stable enough to describe today
- which commands and docs anchor those capabilities right now

## Inspect As JSON

Use the direct read-only packet when you want the same answer as JSON:

```bash
pnpm cli:read-only -- public-mcp-capability-map
```

Use the live repo-local MCP transport when you want the actual tools instead
of the packet:

```bash
pnpm mcp:stdio
```

## Current Capability Set

Today's live stdio MCP covers these read-only capabilities:

- `integration-surface`
- `runtime-seam`
- `submission-readiness`
- `public-distribution-bundle`

Those are repo-owned and real today.

They are **not** proof that:

- a public HTTP MCP server is already published
- write-capable actions exist
- any external registry entry already exists

## Public Inputs To Pair With

- [Builder Start Here](./builder-start-here.md)
- [Agent Quickstarts](./agent-quickstarts.md)
- [Codex Quickstart](./codex-quickstart.md)
- [public-mcp-capability-map.json](./examples/public-mcp-capability-map.json)

## Boundary Reminder

- this surface is publication-adjacent, but it remains read-only
- it stays repo-local over stdio
- it does not upgrade Shopflow into a public HTTP MCP product
