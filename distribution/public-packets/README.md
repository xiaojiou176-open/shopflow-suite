# Shopflow Public Packet Mirror

This directory is the source scaffold for the live secondary public GitHub repo
`xiaojiou176/shopflow-public-packets`.

In plain language:

> treat this as the side shelf, not the storefront.

It gives L1 one smaller packet-only mirror that can stay public without
pretending it is the main Shopflow repo.

## What This Rack Is

- A checked-in, traceable packet mirror under `distribution/public-packets/**`
- The source for the live secondary repo
  `https://github.com/xiaojiou176/shopflow-public-packets`
- A packaging surface built from canonical Shopflow docs and example JSON
- A fallback or mirror surface for smaller packet-only handoff

## What This Rack Is Not

- not the canonical Shopflow repo
- not the default public front door
- not a second main product repo
- not the primary OpenClaw install route

The canonical source remains:

- `https://github.com/xiaojiou176-open/shopflow-suite`

## Which Targets Live Here

| Target | Folder | Truthful public position | Main canonical source |
| :--- | :--- | :--- | :--- |
| `codex` | `./codex/` | no confirmed separate official listing surface; use this repo only as the fallback mirror while `shopflow-suite` stays canonical | `docs/ecosystem/codex-quickstart.md` + `docs/ecosystem/examples/agent-target-packet.codex.json` |
| `claude-code` | `./claude-code/` | no confirmed separate official listing surface; use this repo only as the fallback mirror while `shopflow-suite` stays canonical | `docs/ecosystem/claude-code-quickstart.md` + `docs/ecosystem/examples/agent-target-packet.claude-code.json` |
| `openclaw` | `./openclaw/` | keep only as a legacy packet mirror; the canonical install path now uses `shopflow-suite?dir=distribution/openclaw-plugin` | `docs/ecosystem/openclaw-comparison.md` + `docs/ecosystem/examples/agent-target-packet.openclaw.json` |

## Shared Supporting Packets

The `./shared/` folder contains shared machine-readable packets reused by one or
more targets:

- `public-mcp-capability-map.json`
- `public-skills-catalog.json`

Think of these as the common inserts that multiple boxes reuse.

## How To Use The Packet Files

1. Sync this directory into
   `https://github.com/xiaojiou176/shopflow-public-packets` when the mirror
   needs a refresh.
2. Keep each target folder together with `shared/` so the packet remains
   traceable.
3. Link readers to the canonical repo first when you need the main product
   story, then to the target folder README for packet-only fallback.
4. Link readers to the target folder README first, then to the JSON packet
   files.
5. Treat the JSON files as checked-in packet payloads and example metadata, not
   as proof that a marketplace submission already happened.
6. If a real official listing surface later becomes available, keep this repo as
   a fallback or mirror only when it still serves a real deep-link or packet
   need; otherwise it is a retirement candidate.

## What This Rack Must Not Claim

- It is not the canonical Shopflow repo.
- It is not an official Codex listing.
- It is not an official Claude Code listing.
- It is not proof that a Codex or Claude Code plugin is published.
- It is not proof that a public Shopflow MCP or public skills pack is shipped.
- It is not proof that OpenClaw publication is already live.
- It is not proof that any official marketplace submission or auth flow has
  completed.

## Canonical Source Rule

Each copied packet in this rack comes from a checked-in canonical source under:

- `docs/ecosystem/*.md`
- `docs/ecosystem/examples/*.json`

The target README files record the exact canonical source path for each copied
artifact so future refreshes can stay aligned.
