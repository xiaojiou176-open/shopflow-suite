# OpenClaw Packet Mirror

This folder is the OpenClaw-facing legacy packet mirror.

In plain language:

> the live install box is now its own repo.
> this folder is only the extra copy on the side shelf.

## Truthful Position

- OpenClaw has an official or upstream public route outside this packet rack.
- The canonical Shopflow install path now lives at
  `github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin`.
- The archived legacy fallback repo remains at
  `https://github.com/xiaojiou176/shopflow-openclaw-plugin`.
- This folder can still matter as a legacy packet mirror, but it is no longer
  the main OpenClaw route.
- The canonical Shopflow repo still remains
  `https://github.com/xiaojiou176-open/shopflow-suite`.

## Files In This Folder

| File | Purpose | Canonical source |
| :--- | :--- | :--- |
| `agent-target-packet.openclaw.json` | target packet / sample config / public-ready handoff | `docs/ecosystem/examples/agent-target-packet.openclaw.json` |
| `plugin-marketplace-metadata.openclaw.json` | ready-to-publish metadata packet | `docs/ecosystem/examples/plugin-marketplace-metadata.openclaw.json` |
| `../shared/public-mcp-capability-map.json` | shared capability map reused by OpenClaw readers | `docs/ecosystem/examples/public-mcp-capability-map.json` |

Main narrative source:

- `docs/ecosystem/openclaw-comparison.md`

Supporting source:

- `docs/ecosystem/agent-distribution-artifacts.md`

## How To Use It

1. Start with this README.
2. Open `agent-target-packet.openclaw.json` for the main machine-readable
   packet.
3. Open `plugin-marketplace-metadata.openclaw.json` for the ready-to-publish
   metadata draft.
4. Open `../shared/public-mcp-capability-map.json` if the reader also needs the
   broader shared capability story.

## Must Not Claim

- canonical Shopflow repo status
- primary OpenClaw fallback route status
- official OpenClaw listing already live
- official OpenClaw integration already approved
- external publication already completed
