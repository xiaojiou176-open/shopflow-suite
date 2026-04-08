# Public MCP Capability Map (Ready To Sync)

This page is the human-readable companion for Shopflow's **live read-only stdio
MCP** and the packet that describes it.

In plain language:

> this is the labeled capability sheet you hand to someone before they attach
> to the live stdio MCP.

## Use This When

You need one honest answer to:

- what the current read-only stdio MCP exposes
- which capabilities are already stable enough to describe today
- which commands and docs anchor those capabilities right now

Use the direct read-only packet when you want the same answer as JSON:

```bash
pnpm cli:read-only -- public-mcp-capability-map
```

Use the live repo-local MCP transport when you want the actual tools instead of
the packet:

```bash
pnpm mcp:stdio
```

Use the import surface when you want the same packet inside code:

```ts
import { publicMcpCapabilityMap } from '@shopflow/contracts';
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

## Pair This With

- [Agent Quickstarts](./agent-quickstarts.md)
- [Agent Distribution Artifacts](./agent-distribution-artifacts.md)
- [Public Distribution Bundle](./public-distribution-bundle.ready.md)

## Handoff Packet

- **Audience:** operator, docs sync owner, or ecosystem reviewer preparing MCP-facing copy
- **Best sync target:** MCP-facing docs, release notes, or repo description updates that need one honest capability sheet
- **Best screenshot sources:** [Builder Start Here](./builder-start-here.md), [Agent Quickstarts](./agent-quickstarts.md), [Codex Quickstart](./codex-quickstart.md)
- **Best JSON example:** [public-mcp-capability-map.json](./examples/public-mcp-capability-map.json)
- **Boundary sentence to reuse verbatim:** `Shopflow now ships a repo-local read-only stdio MCP today, while public transport and registry publication still remain later-stage work.`

## Boundary Reminder

- this is publication prep
- it stays read-only
- it stays repo-local over stdio
- it does not upgrade Shopflow into a public HTTP MCP product
