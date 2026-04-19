# Codex Packet

This folder is the Codex-facing public fallback packet.

In plain language:

> this is the Codex box on the shelf while the official Codex shelf exists but
> Shopflow is still not listed there.

The canonical Shopflow repo remains:

- `https://github.com/xiaojiou176-open/shopflow-suite`

## Truthful Position

- An official Codex surface now exists, but Shopflow is not listed or published there yet.
- This folder is therefore meant for a public fallback packet, not an official
  marketplace claim.
- The packet is still useful as a smaller mirror, but it is not the main
  product front door and it is a deprecated-candidate surface if the canonical
  repo fully covers the need.

## Files In This Folder

| File | Purpose | Canonical source |
| :--- | :--- | :--- |
| `agent-target-packet.codex.json` | target packet / sample config / handoff packet | `docs/ecosystem/examples/agent-target-packet.codex.json` |
| `plugin-marketplace-metadata.codex.json` | listing payload example | `docs/ecosystem/examples/plugin-marketplace-metadata.codex.json` |
| `../shared/public-mcp-capability-map.json` | shared capability map reused by Codex packet consumers | `docs/ecosystem/examples/public-mcp-capability-map.json` |

Main narrative source:

- `docs/ecosystem/codex-quickstart.md`
- `docs/ecosystem/public-distribution-bundle.md`
- `README.md`

Supporting copy source:

- `docs/ecosystem/public-distribution-bundle.md`
- `README.md`

## How To Use It

1. Start with this README.
2. Open `agent-target-packet.codex.json` for the main machine-readable packet.
3. Open `plugin-marketplace-metadata.codex.json` for the listing payload
   example.
4. Open `../shared/public-mcp-capability-map.json` for the shared capability
   story.

## Must Not Claim

- canonical Shopflow repo status
- official Codex integration
- official Codex listing
- published Codex plugin
- public Shopflow MCP already shipped for Codex
