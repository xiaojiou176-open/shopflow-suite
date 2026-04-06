# Public Skills Catalog (Ready To Sync)

This page is the human-readable companion for Shopflow's read-only skills
catalog packet.

In plain language:

> this is the shelf label for the skills-facing part of the Claude Code starter
> bundle, without pretending a public skills pack is already distributed.

## Use This When

You need one honest answer to:

- which Shopflow skill scaffolds already exist
- which ecosystems they currently fit best
- what still must not be claimed about public distribution

Use the direct read-only packet when you want the same answer as JSON:

```bash
pnpm cli:read-only -- public-skills-catalog
```

Use the import surface when you want the same packet inside code:

```ts
import { publicSkillsCatalog } from '@shopflow/contracts';
```

## Current Catalog

Today's packet centers on repo-local skill scaffolds such as:

- `shopflow-read-only-runtime-seam-consumption`
- `shopflow-live-browser-ops`
- `shopflow-builder-facing-discoverability-and-ready-sync`

These are useful today for:

- Codex
- Claude Code
- comparison-level OpenClaw discussion where noted

For the 4/6 public distribution uplift, the strongest truthful story is:

- Claude Code uses this catalog as a starter-bundle companion packet
- Codex can still read the same skills-facing boundaries as context
- the checked-in JSON acts as sample config, not as proof of external skills
  publication

They are **not** proof that:

- a public skills pack already exists
- official external distribution already happened

## Claude Code Skills Bundle Row

| Bundle piece      | Current truthful surface                         | First file / command                                                                                 | Must not claim                                     |
| :---------------- | :----------------------------------------------- | :--------------------------------------------------------------------------------------------------- | :------------------------------------------------- |
| starter companion | `public-skills-catalog.json` + Claude quickstart | [public-skills-catalog.json](./examples/public-skills-catalog.json)                                  | distributed public skills pack                     |
| sample config     | checked-in JSON packet                           | `docs/ecosystem/examples/public-skills-catalog.json`                                                 | official external skills listing                   |
| install docs      | Claude Code quickstart                           | [Claude Code Quickstart](./claude-code-quickstart.md)                                                | official Claude Code integration                   |
| proof loop        | catalog export command                           | `pnpm cli:read-only -- public-skills-catalog --output .runtime-cache/cli/public-skills-catalog.json` | that auth or external publication already happened |

## Pair This With

- [Agent Quickstarts](./agent-quickstarts.md)
- [Agent Distribution Artifacts](./agent-distribution-artifacts.md)
- [Public Distribution Bundle](./public-distribution-bundle.ready.md)

## Handoff Packet

- **Audience:** operator, docs sync owner, or agent-ecosystem reviewer preparing skills-facing copy
- **Best sync target:** skills-facing docs, ready-to-sync public copy, or internal packaging discussion
- **Best screenshot sources:** [Agent Quickstarts](./agent-quickstarts.md), [Claude Code Quickstart](./claude-code-quickstart.md), [Agent Distribution Artifacts](./agent-distribution-artifacts.md)
- **Best JSON example:** [public-skills-catalog.json](./examples/public-skills-catalog.json)
- **Boundary sentence to reuse verbatim:** `Shopflow ships a repo-owned skills-facing starter-bundle companion today, not a distributed public skills pack.`

## Boundary Reminder

- current skill scaffolds remain repo-local
- this packet is the strongest truthful public distribution companion for Claude
  Code today
- it does not create a public skills marketplace by itself
