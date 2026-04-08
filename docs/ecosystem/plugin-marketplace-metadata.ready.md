# Plugin Marketplace Metadata (Ready To Sync)

This page is the human-readable companion for Shopflow's plugin and marketplace
metadata packet.

In plain language:

> this is the listing-card template drawer plus the starter-bundle label, not
> proof that any listing is already live.

## Use This When

You need one honest answer to:

- what starter bundles and listing payloads already exist for target ecosystems
- how Codex / Claude Code / OpenClaw currently differ in placement
- which screenshots, capability refs, and boundary notes are already prepared

Use the direct read-only packet when you want the same answer as JSON:

```bash
pnpm cli:read-only -- plugin-marketplace-metadata
pnpm cli:read-only -- plugin-marketplace-metadata --target codex
pnpm cli:read-only -- plugin-marketplace-metadata --target claude-code
pnpm cli:read-only -- plugin-marketplace-metadata --target openclaw
```

Use the import surface when you want the full packet inside code:

```ts
import { pluginMarketplaceMetadataPacket } from '@shopflow/contracts';
```

## Current Targets

- `codex`
  - front-door-primary
  - plugin-level-public-distribution-bundle
- `claude-code`
  - front-door-primary
  - plugin-level-public-distribution-bundle
- `openclaw`
  - public-ready-secondary fallback install shell
  - ready-to-publish-packet

Those Codex / Claude Code entries are the strongest truthful public
distribution bundle Shopflow can ship today.
They include:

- starter bundle
- sample config
- install docs
- proof loop
- metadata / listing payload

For OpenClaw specifically, the strongest truthful public route is:

- the canonical Shopflow repo for docs and proof:
  `https://github.com/xiaojiou176-open/shopflow-suite`
- the public GitHub fallback install shell
  `https://github.com/xiaojiou176/shopflow-openclaw-plugin`, consumed through
  OpenClaw `customPlugins`
- paired with a ready-to-publish metadata draft
- optionally followed by official OpenClaw-owned placement if maintainers
  explicitly approve it

They are **not** proof that:

- any plugin or listing is already published
- any official listing surface has been confirmed
- OpenClaw became a first-class front door or second canonical Shopflow repo
- the fallback shell became a second canonical Shopflow repo
- official marketplace integration already exists

## Codex / Claude Code Bundle Rows

| Target        | Starter bundle                                                       | Sample config                          | Install docs                                          | Proof loop                                                                                                                                        | Listing payload                                                                                         | Official surface status                |
| :------------ | :------------------------------------------------------------------- | :------------------------------------- | :---------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------ | :------------------------------------- |
| `codex`       | `agent-target-packet.codex.json` + quickstart                        | `agent-target-packet.codex.json`       | [Codex Quickstart](./codex-quickstart.md)             | `pnpm cli:read-only -- plugin-marketplace-metadata --target codex --output .runtime-cache/cli/plugin-marketplace-metadata.codex.json`             | [plugin-marketplace-metadata.codex.json](./examples/plugin-marketplace-metadata.codex.json)             | unconfirmed, no official-listing claim |
| `claude-code` | `agent-target-packet.claude-code.json` + quickstart + skills catalog | `agent-target-packet.claude-code.json` | [Claude Code Quickstart](./claude-code-quickstart.md) | `pnpm cli:read-only -- plugin-marketplace-metadata --target claude-code --output .runtime-cache/cli/plugin-marketplace-metadata.claude-code.json` | [plugin-marketplace-metadata.claude-code.json](./examples/plugin-marketplace-metadata.claude-code.json) | unconfirmed, no official-listing claim |

## Pair This With

- [Codex Quickstart](./codex-quickstart.md)
- [Claude Code Quickstart](./claude-code-quickstart.md)
- [OpenClaw Public-Ready Packet](./openclaw-comparison.md)
- [OpenClaw Public-Ready Matrix](./openclaw-public-ready-matrix.md)
- [OpenClaw Publish Unblock Packet](./openclaw-publish-unblock-packet.ready.md)
- [Agent Distribution Artifacts](./agent-distribution-artifacts.md)
- [Public Distribution Bundle](./public-distribution-bundle.ready.md)

## Handoff Packet

- **Audience:** operator, docs sync owner, or marketplace-facing reviewer preparing listing copy
- **Best sync target:** plugin / marketplace metadata draft, screenshot checklist, or OpenClaw public-ready handoff
- **Best screenshot sources:** [README.md](../../README.md), [Codex Quickstart](./codex-quickstart.md), [Claude Code Quickstart](./claude-code-quickstart.md), [OpenClaw Public-Ready Packet](./openclaw-comparison.md), [OpenClaw Public-Ready Matrix](./openclaw-public-ready-matrix.md)
- **Best JSON example:** [plugin-marketplace-metadata.codex.json](./examples/plugin-marketplace-metadata.codex.json), [plugin-marketplace-metadata.claude-code.json](./examples/plugin-marketplace-metadata.claude-code.json), [plugin-marketplace-metadata.openclaw.json](./examples/plugin-marketplace-metadata.openclaw.json)
- **Boundary sentence to reuse verbatim:** `Shopflow ships a repo-owned plugin-level public distribution bundle today, but it must not be described as an official listing until the real official surface is confirmed.`

## Boundary Reminder

- metadata and listing payloads are still repo-owned prep
- OpenClaw's packet can support a public GitHub plugin route now, while official
  OpenClaw-owned placement still remains external platform work
- Codex / Claude Code only move from bundle-ready to official listing if the
  real official surface and auth path are confirmed
- this page must stay below public-release wording
