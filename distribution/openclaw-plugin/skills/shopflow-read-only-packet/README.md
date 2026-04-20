# Shopflow Read-only Packet Public Skill

This folder is the public, self-contained skill packet for Shopflow's
read-only MCP surface and packet-oriented distribution lane.

In plain language:

> this is the companion booklet on the side counter.
> the main product is still the browser-first Shopflow extension family.

Use it when you want one portable folder that teaches an agent four things:

- how to attach Shopflow's local read-only MCP server
- which capability packets are safe first
- what a good first-success packet loop looks like
- which claims stay outside the repo until a real listing or store publish
  exists

## What this packet includes

- `SKILL.md`
- `manifest.yaml`
- `references/README.md`
- `references/INSTALL.md`
- `references/OPENHANDS_MCP_CONFIG.json`
- `references/OPENCLAW_MCP_CONFIG.json`
- `references/CAPABILITIES.md`
- `references/DEMO.md`
- `references/TROUBLESHOOTING.md`

## Best-fit hosts

- OpenHands/extensions contribution flow
- ClawHub-style skill publication
- repo-local packet import flows that expect one standalone folder

## Packet role

- **Primary product stays elsewhere:** `apps/ext-*` and
  `apps/ext-shopping-suite` remain the browser-first Shopflow product lane.
- **This folder is a companion packet:** it helps OpenClaw/OpenHands-style host
  flows attach the read-only MCP and packet truth.
- **This folder is not the storefront:** host-side packet status here must not
  be reused as Chrome Web Store or broader Shopflow browser/store publication
  proof.

## Latest repo-tracked packet-lane receipts

- the latest ClawHub receipt points this packet URL at a public skill page for
  **this companion packet**
- the latest OpenHands/extensions receipt is PR `#161`, now closed as a
  historical contribution receipt rather than a live listing
- neither of those packet-lane receipts proves Chrome Web Store listing, signed
  release artifacts, or broader Shopflow public/live browser claims

## What this packet must not claim

- no live OpenHands/extensions listing without a fresh accepted receipt
- no official registry, marketplace, or Chrome Web Store listing unless fresh
  receipt exists
- no hosted runtime or public HTTP MCP transport
