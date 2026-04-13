# Codex Quickstart

This is the shortest truthful path for using Shopflow from a Codex-style coding
workflow.

In plain language:

> think of this page as the “open these three drawers first” card for Codex.

## What Codex Can Read Today

Codex can already consume:

- typed contracts
- the builder integration surface
- the joined read-only outcome bundle
- the thin runtime-consumer packet when you already have a real Switchyard base
  URL
- a plugin-level public distribution bundle with a starter packet, sample
  config, install docs, proof loop, and listing payload

It still must **not** claim:

- official Codex integration
- an official Codex listing
- a published Codex plugin
- a public Shopflow MCP

## Codex Public Distribution Matrix

| Bundle piece               | What Shopflow has now                                 | Where to open it first                                                                                                                | What it still must not claim                         |
| :------------------------- | :---------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------- |
| starter bundle             | repo-owned Codex packet + quickstart                  | `pnpm cli:read-only -- agent-target-packet --target codex`                                                                            | official Codex listing                               |
| sample config              | checked-in Codex packet + listing payload examples    | `docs/ecosystem/examples/agent-target-packet.codex.json`                                                                              | published Codex plugin                               |
| install docs               | Codex install path and front-door guide               | `docs/ecosystem/codex-quickstart.md`                                                                                                  | official Codex integration                           |
| proof loop                 | target packet + listing payload export + bundle check | `pnpm cli:read-only -- plugin-marketplace-metadata --target codex --output .runtime-cache/cli/plugin-marketplace-metadata.codex.json` | that auth or marketplace submission already happened |
| metadata / listing payload | checked-in listing payload example + CLI export       | `docs/ecosystem/examples/plugin-marketplace-metadata.codex.json`                                                                      | official listing still unconfirmed                   |

In plain language:

> Shopflow now has a real Codex starter bundle.
> It is like a boxed starter kit on the shelf.
> What it is **not** is proof that the box is already stocked in an official store.

## Fastest Command Path

1. inspect the high-level truth buckets

```bash
pnpm cli:read-only -- integration-surface
```

2. pull one joined read-only bundle

```bash
pnpm cli:read-only -- outcome-bundle --app ext-kroger
```

3. consume the thin runtime seam only if you already have a real base URL

```bash
pnpm cli:read-only -- runtime-consumer --base-url http://127.0.0.1:4317
```

4. when you need the plugin-level public distribution bundle without
   overclaiming publication

```bash
pnpm cli:read-only -- agent-target-packet --target codex
pnpm cli:read-only -- public-distribution-bundle
pnpm cli:read-only -- agent-integration-bundle
pnpm cli:read-only -- public-mcp-capability-map --output .runtime-cache/cli/public-mcp-capability-map.json
pnpm cli:read-only -- plugin-marketplace-metadata --target codex --output .runtime-cache/cli/plugin-marketplace-metadata.codex.json
```

## Best Companion Pages

- [Builder Start Here](./builder-start-here.md)
- [Integration Recipes](./integration-recipes.md)
- [Agent Quickstarts](./agent-quickstarts.md)
- [Agent Distribution Artifacts](./agent-distribution-artifacts.md)

## Fastest No-Runtime Packet

If you want checked-in examples before you run anything:

- [agent-integration-bundle.json](./examples/agent-integration-bundle.json)
- [agent-target-packet.codex.json](./examples/agent-target-packet.codex.json)
- [public-mcp-capability-map.json](./examples/public-mcp-capability-map.json)
- [plugin-marketplace-metadata.codex.json](./examples/plugin-marketplace-metadata.codex.json)

That trio now acts as the Codex starter bundle:

1. `agent-target-packet.codex.json` = the sample config / handoff packet
2. `plugin-marketplace-metadata.codex.json` = the listing payload example
3. this quickstart page = the install doc and proof-loop guide

If you want the code import surface instead of CLI output:

```ts
import {
  agentIntegrationBundle,
  publicMcpCapabilityMap,
  pluginMarketplaceMetadataPacket,
} from '@shopflow/contracts';
```

## 30-Second Copy-Paste Path

### Best first command

```bash
pnpm cli:read-only -- agent-target-packet --target codex
```

### Best second command

```bash
pnpm cli:read-only -- plugin-marketplace-metadata --target codex --output .runtime-cache/cli/plugin-marketplace-metadata.codex.json
```

### Best companion doc

- [MCP Quickstart](./mcp-quickstart.md)

### Must not claim

- official Codex integration
- official Codex listing
- published Codex plugin
- public Shopflow MCP already shipped for Codex

## Why This Path Is Honest

- it stays repo-local
- it stays read-only
- it gives machine-readable starter-bundle outputs instead of asking Codex to
  scrape prose
- it includes a proof loop for sample config plus listing payload export
- it keeps official-listing wording behind real official surface confirmation
