# Plugin Marketplace Metadata

This page is the human-readable companion for Shopflow's plugin and marketplace
metadata packet.

In plain language:

> this page explains which listing payload examples already exist, and where
> the official-listing boundary still begins: official surfaces can exist, while
> Shopflow is still not listed or published there.

## Use This When

You need one honest answer to:

- what starter bundles and listing payloads already exist for target ecosystems
- how Codex / Claude Code / OpenClaw currently differ in placement
- which screenshots, capability references, and boundary notes are already prepared

## Inspect As JSON

Use the direct read-only packet when you want the same answer as JSON:

```bash
pnpm cli:read-only -- plugin-marketplace-metadata
pnpm cli:read-only -- plugin-marketplace-metadata --target codex
pnpm cli:read-only -- plugin-marketplace-metadata --target claude-code
pnpm cli:read-only -- plugin-marketplace-metadata --target openclaw
```

## Current Targets

- `codex`
  - front-door-primary
  - plugin-level-public-distribution-bundle
- `claude-code`
  - front-door-primary
  - plugin-level-public-distribution-bundle
- `openclaw`
  - public-ready-secondary via canonical repo subdir
  - ready-to-publish packet

Those entries are the strongest truthful public-distribution bundle Shopflow can
ship today.

They are **not** proof that:

- any plugin or listing is already published
- Shopflow is already listed or published on any official Codex / Claude Code / OpenClaw surface
- OpenClaw became a first-class front door or second canonical Shopflow repo
- official marketplace integration already exists

## Codex / Claude Code Bundle Rows

| Target | Starter bundle | Sample config | Install docs | Listing payload | Official surface status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `codex` | `agent-target-packet.codex.json` + quickstart | `agent-target-packet.codex.json` | [Codex Quickstart](./codex-quickstart.md) | [plugin-marketplace-metadata.codex.json](./examples/plugin-marketplace-metadata.codex.json) | official Codex surface exists, but Shopflow is not listed or published there |
| `claude-code` | `agent-target-packet.claude-code.json` + quickstart + skills catalog | `agent-target-packet.claude-code.json` | [Claude Code Quickstart](./claude-code-quickstart.md) | [plugin-marketplace-metadata.claude-code.json](./examples/plugin-marketplace-metadata.claude-code.json) | official Claude Code surface exists, but Shopflow is not listed or published there |

## Public Inputs To Pair With

- [README.md](../../README.md)
- [Codex Quickstart](./codex-quickstart.md)
- [Claude Code Quickstart](./claude-code-quickstart.md)
- [OpenClaw Public-Ready Packet](./openclaw-comparison.md)
- [OpenClaw Public-Ready Matrix](./openclaw-public-ready-matrix.md)
- [plugin-marketplace-metadata.codex.json](./examples/plugin-marketplace-metadata.codex.json)
- [plugin-marketplace-metadata.claude-code.json](./examples/plugin-marketplace-metadata.claude-code.json)
- [plugin-marketplace-metadata.openclaw.json](./examples/plugin-marketplace-metadata.openclaw.json)

## Boundary Reminder

- metadata and listing payloads are still repo-owned prep
- OpenClaw's packet can support a public GitHub/customPlugins route now, while
  official OpenClaw-owned placement still remains external platform work
- Codex / Claude Code official surfaces already exist; what is still missing is
  Shopflow being officially listed or published there through the real auth path
- this page must stay below public-release wording
