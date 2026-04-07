# Claude Code Quickstart

This is the shortest truthful path for using Shopflow from a Claude Code style
workflow.

In plain language:

> if Codex is the engineer opening the box, Claude Code is the engineer plus
> operator notes. This page tells it which notes to read first.

## What Claude Code Can Read Today

Claude Code can already consume:

- typed contracts and readiness buckets
- the provider-runtime seam boundary
- submission-readiness reporting
- the joined read-only outcome bundle
- repo-local Shopflow skill scaffolds that explain runtime seam, live browser
  ownership, and builder-facing discoverability boundaries
- a plugin-level public distribution bundle with a starter packet, sample
  config, install docs, proof loop, listing payload, and skills-facing
  companion packet

It still must **not** claim:

- official Claude Code integration
- an official Claude Code listing
- a published Claude Code plugin
- a distributed public Shopflow skills pack

## Claude Code Public Distribution Matrix

| Bundle piece               | What Shopflow has now                                                     | Where to open it first                                                                               | What it still must not claim                         |
| :------------------------- | :------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------- | :--------------------------------------------------- |
| starter bundle             | Claude Code packet + quickstart + skills catalog companion                | `pnpm cli:read-only -- agent-target-packet --target claude-code`                                     | official Claude Code listing                         |
| sample config              | checked-in Claude Code packet + skills catalog + listing payload examples | `docs/ecosystem/examples/agent-target-packet.claude-code.json`                                       | published Claude Code plugin                         |
| install docs               | Claude Code install path and operator-facing guide                        | `docs/ecosystem/claude-code-quickstart.md`                                                           | official Claude Code integration                     |
| proof loop                 | target packet + skills catalog export + listing payload export            | `pnpm cli:read-only -- public-skills-catalog --output .runtime-cache/cli/public-skills-catalog.json` | that auth or marketplace submission already happened |
| metadata / listing payload | checked-in listing payload example + CLI export                           | `docs/ecosystem/examples/plugin-marketplace-metadata.claude-code.json`                               | official listing still unconfirmed                   |

In plain language:

> Claude Code now has a fuller starter kit than before.
> You can think of it as the Codex box plus an operator-notes binder.
> The binder is public-distribution-ready, but it is still **not** an official listing receipt.

## Fastest Command Path

1. inspect the same truth buckets Codex sees

```bash
pnpm cli:read-only -- integration-surface
```

2. inspect the external runtime boundary before touching any Switchyard story

```bash
pnpm cli:read-only -- runtime-seam
```

3. inspect the release / reviewer side without pretending store submission is done

```bash
pnpm cli:read-only -- submission-readiness
```

4. when you need the combined agent-facing packet and the stronger
   skills-facing bundle companion

```bash
pnpm cli:read-only -- agent-target-packet --target claude-code
pnpm cli:read-only -- agent-integration-bundle
pnpm cli:read-only -- public-skills-catalog --output .runtime-cache/cli/public-skills-catalog.json
pnpm cli:read-only -- plugin-marketplace-metadata --target claude-code --output .runtime-cache/cli/plugin-marketplace-metadata.claude-code.json
```

## Local Skill Scaffolds Worth Reading

- `.agents/skills/shopflow-read-only-runtime-seam-consumption/SKILL.md`
- `.agents/skills/shopflow-live-browser-ops/SKILL.md`
- `.agents/skills/shopflow-builder-facing-discoverability-and-ready-sync/SKILL.md`

## Best Companion Pages

- [Agent Quickstarts](./agent-quickstarts.md)
- [Agent and MCP Positioning](./agent-and-mcp-positioning.md)
- [Integration Recipes](./integration-recipes.md)
- [Public Distribution Bundle](./public-distribution-bundle.ready.md)

## Fastest No-Runtime Packet

If you want checked-in examples before you run anything:

- [agent-integration-bundle.json](./examples/agent-integration-bundle.json)
- [agent-target-packet.claude-code.json](./examples/agent-target-packet.claude-code.json)
- [public-skills-catalog.json](./examples/public-skills-catalog.json)
- [plugin-marketplace-metadata.claude-code.json](./examples/plugin-marketplace-metadata.claude-code.json)

That trio now acts as the Claude Code starter bundle:

1. `agent-target-packet.claude-code.json` = the sample config / handoff packet
2. `public-skills-catalog.json` = the skills-facing companion config
3. `plugin-marketplace-metadata.claude-code.json` = the listing payload example

If you want the code import surface instead of CLI output:

```ts
import {
  agentIntegrationBundle,
  publicSkillsCatalog,
  pluginMarketplaceMetadataPacket,
} from '@shopflow/contracts';
```

## 30-Second Copy-Paste Path

### Best first command

```bash
pnpm cli:read-only -- agent-target-packet --target claude-code
```

### Best second command

```bash
pnpm cli:read-only -- plugin-marketplace-metadata --target claude-code --output .runtime-cache/cli/plugin-marketplace-metadata.claude-code.json
pnpm cli:read-only -- public-skills-catalog --output .runtime-cache/cli/public-skills-catalog.json
```

### Best companion doc

- [Public Skills Catalog](./public-skills-catalog.ready.md)

### Must not claim

- official Claude Code integration
- official Claude Code listing
- published Claude Code plugin
- distributed public Shopflow skills pack

## Why This Path Is Honest

- it keeps the repo-local skills story visible as part of a stronger starter
  bundle without pretending those skills are already publicly distributed
- it keeps release/readiness separate from public publication
- it gives Claude Code a real operator-facing read path plus a proof loop for
  sample config and listing payload export instead of generic AI marketing
  language
