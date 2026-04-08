# Ready-to-Sync Public Copy Packet

This page is the short packet for people who need to know:

- which copy artifacts are ready to paste
- which destination each artifact fits
- which claims still remain out of bounds

In plain language:

> this is the labeled folder you hand to someone before they post anything.
> it is ready-to-sync, not already synced.

## Repo Description

Canonical Shopflow repo for a Chrome-first shopping extension family with `8`
storefront apps and `1` Suite shell. It already gives builders typed workflow
truth, builder snapshots, workflow briefs, repo-local read-only outcome
tooling, repo-owned review artifacts, and current-scope distribution packets
without pretending every ecosystem already has an official listing surface.

## Release Body

### What changed in this repo slice

- builder-facing discovery now has a shorter front door for contracts, examples,
  outcome tooling, and release-boundary artifacts
- integration recipes now explain how to consume the current read-only outcome
  surfaces without overclaiming public platform status
- ready-to-sync public copy now uses one more consistent current-scope story
  across repo description, release notes, and builder-facing blurbs

### What this still does not claim

- no public MCP server
- no public HTTP API
- no public SDK package
- no official listing where the target ecosystem does not actually provide one
- no public-ready support claim without reviewed live evidence

### Builder takeaway

If you are evaluating Shopflow with Codex, Claude Code, or other coding agents,
start from the typed contracts, builder read models, workflow briefs, and the
repo-local read-only outcome bundle command. Treat public API / MCP / CLI / SDK
/ transport as later-stage surfaces, but treat package / plugin / skills /
 catalog / marketplace distribution packets as current-scope execution work.

## Sync Destinations

| Use this file | When you need | Destination |
| :--- | :--- | :--- |
| `docs/ecosystem/public-copy.ready.md` | the short packet and boundary reminder | prep pass before any external sync |
| `docs/ecosystem/ready-to-sync-public-copy.md` | paste-ready snippets | GitHub about, release notes, social/page drafts |
| `docs/ecosystem/release-body.ready.md` | a short release-note block | GitHub release body |
| `docs/ecosystem/repo-description.ready.md` | one-line repo description | GitHub repo description |

For the full chooser, read
[Ready-to-Sync Artifacts](./ready-to-sync-artifacts.md).
