# Public Skills Catalog

This page is the human-readable companion for Shopflow's read-only skills
catalog packet.

In plain language:

> this is the public shelf label for the skills-facing part of the Claude Code
> starter bundle, without pretending a public skills pack is already distributed.

## Use This When

You need one honest answer to:

- which Shopflow skill scaffolds already exist
- which ecosystems they currently fit best
- what still must not be claimed about public distribution

## Inspect As JSON

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

For the current public-distribution story:

- Claude Code uses this catalog as a starter-bundle companion packet
- Codex can still consume the same skills-facing boundaries as context
- the checked-in JSON acts as sample config, not as proof of external skills
  publication

They are **not** proof that:

- a public skills pack already exists
- official external distribution already happened

## Claude Code Skills Bundle Row

| Bundle piece | Current truthful surface | First file / command | Must not claim |
| :--- | :--- | :--- | :--- |
| starter companion | `public-skills-catalog.json` + Claude quickstart | [public-skills-catalog.json](./examples/public-skills-catalog.json) | distributed public skills pack |
| sample config | checked-in JSON packet | `docs/ecosystem/examples/public-skills-catalog.json` | official external skills listing |
| install docs | Claude Code quickstart | [Claude Code Quickstart](./claude-code-quickstart.md) | official Claude Code integration |
| proof loop | catalog export command | `pnpm cli:read-only -- public-skills-catalog --output .runtime-cache/cli/public-skills-catalog.json` | that auth or external publication already happened |

## Public Inputs To Pair With

- [Agent Quickstarts](./agent-quickstarts.md)
- [Claude Code Quickstart](./claude-code-quickstart.md)
- [Agent Distribution Artifacts](./agent-distribution-artifacts.md)
- [public-skills-catalog.json](./examples/public-skills-catalog.json)

## Boundary Reminder

- current skill scaffolds remain repo-local
- this packet is the strongest truthful public distribution companion for Claude Code today
- it does not create a public skills marketplace by itself
