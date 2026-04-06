# Shopflow Public Packet Rack

This directory is a public packet rack scaffold for a separate public GitHub
repository.

In plain language:

> treat this as the public-facing filing cabinet, not the official marketplace
> itself.

It is meant to give L1 one clean folder that can be copied into a public repo
and used as the strongest truthful fallback surface for agent targets that do
not currently have a confirmed official listing path.

## What This Rack Is

- A checked-in, traceable packet rack under `distribution/public-packets/**`
- A public fallback repo scaffold for `codex`, `claude-code`, and `openclaw`
- A packaging surface built from canonical Shopflow docs and example JSON
- A place to host public-ready packets without pretending the main private repo
  is itself public

## Which Targets Live Here

| Target | Folder | Truthful public position | Main canonical source |
| :--- | :--- | :--- | :--- |
| `codex` | `./codex/` | no confirmed separate official listing surface; use this public repo as the fallback shelf | `docs/ecosystem/codex-quickstart.md` + `docs/ecosystem/examples/agent-target-packet.codex.json` |
| `claude-code` | `./claude-code/` | no confirmed separate official listing surface; use this public repo as the fallback shelf | `docs/ecosystem/claude-code-quickstart.md` + `docs/ecosystem/examples/agent-target-packet.claude-code.json` |
| `openclaw` | `./openclaw/` | official/upstream public route exists elsewhere; this rack still hosts a public-ready packet and fallback mirror | `docs/ecosystem/openclaw-comparison.md` + `docs/ecosystem/examples/agent-target-packet.openclaw.json` |

## Shared Supporting Packets

The `./shared/` folder contains shared machine-readable packets reused by one or
more targets:

- `public-mcp-capability-map.json`
- `public-skills-catalog.json`

Think of these as the common inserts that multiple boxes reuse.

## How To Use The Packet Files

1. Copy this whole directory into a separate public GitHub repository.
2. Keep each target folder together with `shared/` so the packet remains
   traceable.
3. Link readers to the target folder README first, then to the JSON packet
   files.
4. Treat the JSON files as checked-in packet payloads and example metadata, not
   as proof that a marketplace submission already happened.
5. If a real official listing surface later becomes available, keep this public
   repo as the fallback or mirror unless the official channel fully replaces it.

## What This Rack Must Not Claim

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
