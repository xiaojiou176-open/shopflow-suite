# Public Distribution Bundle

This page explains the strongest truthful public-distribution surfaces that
Shopflow already carries inside the canonical repo.

In plain language:

> this is the public shipping map.
> it shows what bundle surfaces exist today, how to inspect them, and which
> claims still remain outside repo-owned control.

## What This Surface Covers

Use this page when you need one honest answer to:

- which public-distribution surfaces already exist in-repo today
- which commands expose those surfaces as read-only packets
- which sample artifacts a reviewer or builder can inspect right now
- which publication steps are still outside repo-owned control

## Current Public Repo Topology

Use this repo map before you inspect any bundle:

- canonical repo and public front door:
  `https://github.com/xiaojiou176-open/shopflow-suite`
- canonical OpenClaw install path:
  `github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin`

Boundary reminder:

- `shopflow-suite` stays the only canonical repo
- OpenClaw installs should use the canonical subdir route above

## Inspect As JSON

Use the machine-readable bundle when you want the same answer as JSON:

```bash
pnpm cli:read-only -- public-distribution-bundle
pnpm cli:read-only -- agent-integration-bundle
pnpm cli:read-only -- agent-target-packet --target codex
pnpm cli:read-only -- agent-target-packet --target claude-code
pnpm cli:read-only -- agent-target-packet --target openclaw
pnpm cli:read-only -- public-mcp-capability-map
pnpm cli:read-only -- public-skills-catalog
pnpm cli:read-only -- plugin-marketplace-metadata
```

## Public Distribution Matrix

| Surface | What exists today | What a reader can inspect now | What it must not be mistaken for |
| :--- | :--- | :--- | :--- |
| public read-only API | repo-owned docs, boundary notes, and packet shape | this page plus `pnpm cli:read-only -- public-distribution-bundle` | a live public API transport |
| public read-only MCP | repo-local stdio MCP plus capability packet | [MCP Quickstart](./mcp-quickstart.md), `pnpm mcp:stdio`, and [Public MCP Capability Map](./public-mcp-capability-map.md) | a public HTTP MCP server |
| public skills | Claude Code-facing starter-bundle companion plus checked-in sample config | [Public Skills Catalog](./public-skills-catalog.md) and [`public-skills-catalog.json`](./examples/public-skills-catalog.json) | an already distributed public skills pack |
| plugin / marketplace | starter bundles, listing payload examples, install docs, and canonical OpenClaw subdir route | [Plugin Marketplace Metadata](./plugin-marketplace-metadata.md), target packets, and checked-in example JSON | an already published plugin or marketplace listing |

## Codex / Claude Code Public Distribution Matrix

| Target | Current bundle state | Shortest truthful entry | Listing status boundary |
| :--- | :--- | :--- | :--- |
| `Codex` | plugin-level public distribution bundle | [Codex Quickstart](./codex-quickstart.md) + [`agent-target-packet.codex.json`](./examples/agent-target-packet.codex.json) | official Codex surface exists, but Shopflow is not listed or published there |
| `Claude Code` | plugin-level public distribution bundle | [Claude Code Quickstart](./claude-code-quickstart.md) + [`agent-target-packet.claude-code.json`](./examples/agent-target-packet.claude-code.json) + [`public-skills-catalog.json`](./examples/public-skills-catalog.json) | official Claude Code surface exists, but Shopflow is not listed or published there |

## Related Public Pages

- [Public MCP Capability Map](./public-mcp-capability-map.md)
- [Public Skills Catalog](./public-skills-catalog.md)
- [Plugin Marketplace Metadata](./plugin-marketplace-metadata.md)
- [Agent Quickstarts](./agent-quickstarts.md)
- [Agent Distribution Artifacts](./agent-distribution-artifacts.md)

## How To Inspect It Today

If you only need the current repo-owned distribution story, start with:

1. this page
2. `https://github.com/xiaojiou176-open/shopflow-suite`
3. `pnpm cli:read-only -- public-distribution-bundle`
4. `pnpm cli:read-only -- agent-target-packet --target codex`
5. `pnpm cli:read-only -- agent-target-packet --target claude-code`
6. `pnpm cli:read-only -- agent-target-packet --target openclaw`
7. `pnpm cli:read-only -- agent-integration-bundle`

## Boundary Reminder

- Shopflow still only claims repo-local, read-only builder/runtime surfaces today.
- This page does **not** upgrade repo-local CLI / runtime-seam / runtime-consumer into official public distribution by itself.
- External publication still needs the real target registry, marketplace, or hosting path.
- If an official surface exists but Shopflow is not listed or published there yet, this bundle remains the strongest truthful public surface and nothing stronger should be claimed.
