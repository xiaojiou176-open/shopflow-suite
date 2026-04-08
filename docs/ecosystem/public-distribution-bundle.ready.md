# Public Distribution Bundle (Ready To Sync)

This page is the repo-owned packet for the Wave 18 distribution layer.

In plain language:

> this is the labeled shipping crate for today's strongest truthful public
> distribution surface.
> it is ready to hand off.
> it is not proof that anything in the crate is already officially listed or
> published.

## What This Packet Covers

Use this packet when you need one honest place to answer:

- what the public read-only API packet should contain
- what the public read-only MCP packet should contain
- what a public skills packet should contain
- what plugin / marketplace distribution packets should contain

## Current Public Repo Topology

Use this repo map before you sync any copy:

- canonical repo and public front door:
  `https://github.com/xiaojiou176-open/shopflow-suite`
- secondary packet mirror and deprecated candidate:
  `https://github.com/xiaojiou176/shopflow-public-packets`
- archived legacy OpenClaw fallback shell:
  `https://github.com/xiaojiou176/shopflow-openclaw-plugin`

Boundary reminder:

- `shopflow-suite` stays the only canonical repo
- `shopflow-public-packets` stays a smaller fallback or mirror surface, not a
  second product repo
- new OpenClaw installs should use
  `github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin`
- `shopflow-openclaw-plugin` is now an archived legacy compatibility shell, not
  the canonical repo and not an official listing

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
pnpm cli:read-only -- public-distribution-bundle --output .runtime-cache/cli/public-distribution-bundle.json
```

## Packet Matrix

| Surface              | Repo-owned status                       | What is already prepared                                                                                                                          | What it must not be mistaken for                   |
| :------------------- | :-------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------- |
| public read-only API | ready-to-sync packet                    | docs, boundary notes, publication checklist                                                                                                       | a live public API transport                        |
| public read-only MCP | ready-to-sync packet                    | agent-specific onboarding bundle, capability map, boundary notes                                                                                  | a published MCP server                             |
| public skills        | plugin-level public distribution bundle | local skill scaffolds, Claude Code starter bundle, sample config, proof loop                                                                      | an already distributed skills pack                 |
| plugin / marketplace | plugin-level public distribution bundle | Codex / Claude Code starter bundles, sample configs, install docs, proof loops, listing payloads, plus the separately tracked OpenClaw fallback shell and legacy packet mirror | an already published plugin or marketplace listing |

## Codex / Claude Code Public Distribution Matrix

| Target        | Starter bundle                                                       | Sample config                                                         | Install docs                                          | Proof loop                                                                                                                            | Listing payload                                | Official surface status                   |
| :------------ | :------------------------------------------------------------------- | :-------------------------------------------------------------------- | :---------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------- | :---------------------------------------- |
| `Codex`       | `agent-target-packet.codex.json` + quickstart                        | `agent-target-packet.codex.json`                                      | [Codex Quickstart](./codex-quickstart.md)             | `pnpm cli:read-only -- plugin-marketplace-metadata --target codex --output .runtime-cache/cli/plugin-marketplace-metadata.codex.json` | `plugin-marketplace-metadata.codex.json`       | unconfirmed, so no official-listing claim |
| `Claude Code` | `agent-target-packet.claude-code.json` + quickstart + skills catalog | `agent-target-packet.claude-code.json` + `public-skills-catalog.json` | [Claude Code Quickstart](./claude-code-quickstart.md) | `pnpm cli:read-only -- public-skills-catalog --output .runtime-cache/cli/public-skills-catalog.json`                                  | `plugin-marketplace-metadata.claude-code.json` | unconfirmed, so no official-listing claim |

## Direct Packet Pages

- [Public MCP Capability Map](./public-mcp-capability-map.ready.md)
- [Public Skills Catalog](./public-skills-catalog.ready.md)
- [Plugin Marketplace Metadata](./plugin-marketplace-metadata.ready.md)

## Boundary Reminder

- Shopflow still only claims repo-local, read-only builder/runtime surfaces today.
- This packet does **not** upgrade repo-local CLI / runtime-seam / runtime-consumer into official public distribution by itself.
- External publication still needs the real target registry, marketplace, or hosting path.
- If the official surface is unknown or unconfirmed, this bundle is the
  strongest truthful surface and nothing stronger should be claimed.

## Hand-Off Rule

When the next operator asks “what exactly should we publish?”, hand them:

1. this page
2. `https://github.com/xiaojiou176-open/shopflow-suite`
3. `pnpm cli:read-only -- public-distribution-bundle`
4. `pnpm cli:read-only -- agent-target-packet --target codex`
5. `pnpm cli:read-only -- agent-target-packet --target claude-code`
6. `pnpm cli:read-only -- agent-target-packet --target openclaw`
7. `pnpm cli:read-only -- agent-integration-bundle`
8. [Public MCP Capability Map](./public-mcp-capability-map.ready.md)
9. [Public Skills Catalog](./public-skills-catalog.ready.md)
10. [Plugin Marketplace Metadata](./plugin-marketplace-metadata.ready.md)
11. [Agent Quickstarts](./agent-quickstarts.md)
12. [Agent Distribution Artifacts](./agent-distribution-artifacts.md)
13. [Ready-to-Sync Artifacts](./ready-to-sync-artifacts.md)
14. [Agent and MCP Positioning](./agent-and-mcp-positioning.md)

That keeps the answer specific without pretending publication already happened.
