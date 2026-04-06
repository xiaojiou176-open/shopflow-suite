# OpenClaw Packet

This folder is the OpenClaw-facing public-ready packet.

In plain language:

> OpenClaw already has an upstream public route elsewhere, but this folder is
> still the packaged box we can hand out or mirror publicly.

## Truthful Position

- OpenClaw has an official or upstream public route outside this packet rack.
- This folder still matters because it keeps Shopflow's public-ready packet in
  one clean place for a public repo or mirror.
- The folder is public-ready, but it is not proof that the final external
  publish step is already complete.

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

- official OpenClaw listing already live
- official OpenClaw integration already approved
- external publication already completed
