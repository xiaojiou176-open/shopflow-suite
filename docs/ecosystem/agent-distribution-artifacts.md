# Agent Distribution Artifacts

This page is the checked-in artifact rack for Shopflow's agent-facing public
distribution bundle.

In plain language:

> if `agent-integration-bundle` is the packed suitcase, this page is the list
> of labeled pouches inside it.

## What Lives Here

These files are checked-in JSON examples for the same repo-owned, read-only
story:

| Need                                      | File                                                                                                    | Why it matters                                                                                                                       |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------- |
| one full onboarding packet                | [agent-integration-bundle.json](./examples/agent-integration-bundle.json)                               | one machine-readable entry for Codex / Claude Code / OpenClaw routing                                                                |
| Codex handoff packet only                 | [agent-target-packet.codex.json](./examples/agent-target-packet.codex.json)                             | one smaller Codex starter-bundle sample config when the full onboarding bundle is more than you need                                 |
| Claude Code handoff packet only           | [agent-target-packet.claude-code.json](./examples/agent-target-packet.claude-code.json)                 | one smaller Claude Code starter-bundle sample config that keeps skills, metadata, and command entrypoints together                   |
| OpenCode handoff packet only              | [agent-target-packet.opencode.json](./examples/agent-target-packet.opencode.json)                       | one ecosystem-secondary packet that makes later packaging work concrete without promoting OpenCode to the front door                 |
| OpenHands handoff packet only             | [agent-target-packet.openhands.json](./examples/agent-target-packet.openhands.json)                     | one ecosystem-secondary packet that keeps agentic workflow comparison concrete without implying an official package                  |
| OpenClaw handoff packet only              | [agent-target-packet.openclaw.json](./examples/agent-target-packet.openclaw.json)                       | one smaller public-ready packet that shows install shape, discovery path, and proof loop without claiming an official listing        |
| MCP capability map only                   | [public-mcp-capability-map.json](./examples/public-mcp-capability-map.json)                             | one focused packet for later MCP publication prep                                                                                    |
| skills catalog only                       | [public-skills-catalog.json](./examples/public-skills-catalog.json)                                     | one focused packet for the Claude Code skills-facing bundle companion without pretending a public skills pack is already distributed |
| Codex plugin metadata payload             | [plugin-marketplace-metadata.codex.json](./examples/plugin-marketplace-metadata.codex.json)             | one reusable listing payload example for the Codex starter bundle and proof loop                                                     |
| Claude Code plugin metadata payload       | [plugin-marketplace-metadata.claude-code.json](./examples/plugin-marketplace-metadata.claude-code.json) | one reusable listing payload example for the Claude Code starter bundle and proof loop                                               |
| OpenClaw ready-to-publish metadata packet | [plugin-marketplace-metadata.openclaw.json](./examples/plugin-marketplace-metadata.openclaw.json)       | one ready-to-publish metadata draft for a truthful public GitHub or listing surface, still below official-live claims                |

## How These Files Get Refreshed

To rewrite the checked-in files on disk, run:

```bash
pnpm builder:refresh-example-rack
```

That refresh command rewrites both:

- the multi-app builder example rack
- the common agent/distribution example artifacts above

If you only want to read the same packet shapes without rewriting checked-in
files, run the read-only commands instead:

```bash
pnpm cli:read-only -- public-mcp-capability-map
pnpm cli:read-only -- public-skills-catalog
pnpm cli:read-only -- plugin-marketplace-metadata
pnpm cli:read-only -- agent-target-packet --target codex
pnpm cli:read-only -- agent-target-packet --target claude-code
pnpm cli:read-only -- agent-target-packet --target opencode
pnpm cli:read-only -- agent-target-packet --target openhands
pnpm cli:read-only -- agent-target-packet --target openclaw
```

Those commands emit repo-local read-only payloads. They do **not** refresh the
checked-in examples in this folder.

## Codex / Claude Code Starter Bundle Pack

Use this when someone asks for the shortest truthful public distribution bundle:

1. Codex:
   `agent-target-packet.codex.json` + `plugin-marketplace-metadata.codex.json` + [Codex Quickstart](./codex-quickstart.md)
2. Claude Code:
   `agent-target-packet.claude-code.json` + `public-skills-catalog.json` + `plugin-marketplace-metadata.claude-code.json` + [Claude Code Quickstart](./claude-code-quickstart.md)

That is the current starter bundle.
It is strong enough for install docs, sample config, proof loop, and listing payload reuse.
It is still **not** proof of an official listing.

## Boundary Reminder

- these are checked-in examples, not published marketplace payloads
- Codex / Claude Code starter bundles are truthful public-distribution packets,
  not official-listing receipts
- OpenClaw's packet is now public-ready and ready-to-publish, but it is still
  not proof that an official OpenClaw-owned listing is already live
- they help people and tools reuse the current packaging story without
  pretending official integrations already exist
