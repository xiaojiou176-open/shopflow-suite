# Ready-to-Sync Artifacts

This page is the control card for Shopflow's paste-ready public-sync material.

In plain language:

> These files are the copy you can reach for when repo truth is ready before
> external posting happens.

## What Ready-to-Sync Means

Ready-to-sync means:

- paste-ready
- repo-owned
- current-scope truthful
- safe to hand to the next human or tool without rewriting from scratch

Ready-to-sync does **not** mean:

- already published
- already externally approved
- already visible in GitHub, a release page, or a social post

## Which File to Use

| Need | File | Use this when | What it must not be mistaken for |
| :--- | :--- | :--- | :--- |
| one-line repo description | [repo-description.ready.md](./repo-description.ready.md) | you need one short repo summary | proof that the description is already live |
| short release body | [release-body.ready.md](./release-body.ready.md) | you need a compact release note body | proof that a release is already published |
| fuller public copy block | [public-copy.ready.md](./public-copy.ready.md) | you need a slightly richer description block | a public support claim |
| public distribution packet | [public-distribution-bundle.ready.md](./public-distribution-bundle.ready.md) | you need the repo-owned API / MCP / skills / plugin-marketplace handoff packet | proof that any public distribution already happened |
| MCP packet only | [public-mcp-capability-map.ready.md](./public-mcp-capability-map.ready.md) | you need the read-only MCP capability packet alone | proof that a public MCP server already exists |
| skills packet only | [public-skills-catalog.ready.md](./public-skills-catalog.ready.md) | you need the skills distribution packet alone | proof that a public skills pack already exists |
| plugin metadata packet only | [plugin-marketplace-metadata.ready.md](./plugin-marketplace-metadata.ready.md) | you need the plugin/listing metadata packet alone | proof that a marketplace listing already exists |
| reusable snippets | [ready-to-sync-public-copy.md](./ready-to-sync-public-copy.md) | you need modular copy blocks for GitHub, release notes, or page text | proof that external sync already happened |

## Suggested Sync Order

Before you sync any copy, anchor it to the canonical repo first:

- `https://github.com/xiaojiou176-open/shopflow-suite`

If you need to hand off or sync these later, start in this order:

1. repo description
2. release body
3. fuller public copy
4. public distribution packet
5. optional social or page snippets

Why this order works:

- the smallest claim surface gets reviewed first
- larger wording blocks inherit the same truth boundary
- it reduces the chance that one public surface outruns another
- it keeps side repos clearly secondary instead of letting them read like peer
  main repos

## Guardrails

Every ready-to-sync artifact must keep these boundaries visible:

- Shopflow is still a Chrome-first shopping extension family
- `shopflow-suite` is the only canonical repo and main front door
- any side-repo copy must point back to `shopflow-suite` and label itself as a
  fallback, mirror, or target-specific install shell rather than a second main
  repo
- builder-facing surfaces are still repo-local and read-only first
- current wording must not imply a public API, public MCP, public CLI, or SDK
- current wording must not imply public-ready support beyond reviewed evidence

## Pair These with the Source Pages

- [Builder Start Here](./builder-start-here.md)
- [Agent Quickstarts](./agent-quickstarts.md)
- [Agent Distribution Artifacts](./agent-distribution-artifacts.md)
- [Builder Read Models](./builder-read-models.md)
- [Agent and MCP Positioning](./agent-and-mcp-positioning.md)
- [Integration Surface Roadmap](./integration-surface-roadmap.md)
- [Public Distribution Bundle](./public-distribution-bundle.ready.md)

## Pair These with Reviewer Handoff

If the question is no longer “what public copy can I paste?” and is now “where
should the reviewer/operator start?”, use this order instead:

1. `submission-readiness.json` in `.runtime-cache/release-artifacts/`
2. the per-app `shopflow-review-artifact.json` inside the built review bundle
3. [Release Artifact Review Runbook](../runbooks/release-artifact-review.md)
4. [Live Receipt Capture Runbook](../runbooks/live-receipt-capture.md) if the
   remaining gate is reviewed live evidence
5. [Evidence and Submission Current-Scope Readiness](./evidence-submission-current-scope-readiness.md)

Why this pairing matters:

- ready-to-sync public copy is for later paste or sync work
- reviewer handoff artifacts are for deciding what is already repo-owned and
  what is now truly external-only
- keeping those two folders distinct reduces the chance that review bundles get
  mistaken for signed releases or already-published copy

Also pair them with the repo-owned release handoff packet when you are talking
about submission or review readiness:

- `.runtime-cache/release-artifacts/submission-readiness.json`

If that report still lists external live-evidence or signing blockers, keep the
copy in this folder framed as ready-to-sync material only. It is not the same
thing as an approved public release claim.
