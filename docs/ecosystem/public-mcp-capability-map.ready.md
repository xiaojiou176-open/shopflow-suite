# Public MCP Capability Map (Ready To Sync)

This page is the human-readable companion for Shopflow's read-only MCP packet.

In plain language:

> this is the labeled capability sheet you would hand to someone before any MCP
> server ever goes live.

## Use This When

You need one honest answer to:

- what a future public read-only MCP should expose
- which capabilities are already stable enough to describe today
- which commands and docs anchor those capabilities right now

Use the direct read-only packet when you want the same answer as JSON:

```bash
pnpm cli:read-only -- public-mcp-capability-map
```

Use the import surface when you want the same packet inside code:

```ts
import { publicMcpCapabilityMap } from '@shopflow/contracts';
```

## Current Capability Set

Today's packet covers these read-only capabilities:

- `integration-surface`
- `runtime-seam`
- `runtime-consumer`
- `outcome-bundle`
- `submission-readiness`

Those are repo-owned and real today.

They are **not** proof that:

- a public MCP server is already published
- write-capable actions exist
- any external registry entry already exists

## Pair This With

- [Agent Quickstarts](./agent-quickstarts.md)
- [Agent Distribution Artifacts](./agent-distribution-artifacts.md)
- [Public Distribution Bundle](./public-distribution-bundle.ready.md)

## Handoff Packet

- **Audience:** operator, docs sync owner, or ecosystem reviewer preparing MCP-facing copy
- **Best sync target:** MCP-facing docs, release notes, or repo description updates that need one honest capability sheet
- **Best screenshot sources:** [Builder Start Here](./builder-start-here.md), [Agent Quickstarts](./agent-quickstarts.md), [Codex Quickstart](./codex-quickstart.md)
- **Best JSON example:** [public-mcp-capability-map.json](./examples/public-mcp-capability-map.json)
- **Boundary sentence to reuse verbatim:** `Shopflow is preparing a read-only MCP capability packet, not claiming a published MCP server today.`

## Boundary Reminder

- this is publication prep
- it stays read-only
- it stays repo-local
- it does not upgrade Shopflow into a current public MCP product
