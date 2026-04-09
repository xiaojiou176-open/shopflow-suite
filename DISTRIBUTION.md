# Distribution Truth

This page keeps the public distribution story short, truthful, and reusable.

## Live now

- Public canonical repo: `https://github.com/xiaojiou176-open/shopflow-suite`
- Public Pages front door: `https://xiaojiou176-open.github.io/shopflow-suite/`
- Public release channel: `https://github.com/xiaojiou176-open/shopflow-suite/releases`
- Read-only stdio MCP: `pnpm mcp:stdio`
- Reviewer shelf artifacts:
  - `8` storefront review bundles
  - `1` Suite internal-alpha review bundle
  - review manifest
  - submission-readiness report

## Primary lane vs companion lanes

- **Primary lane:** the browser-first extension family under `apps/ext-*` and
  `apps/ext-shopping-suite`
- **Companion lane:** the read-only stdio MCP plus builder-facing packet docs
- **Companion packet lane:** the OpenClaw/OpenHands-facing skill packet and the
  smaller packet mirrors under `distribution/`

Important boundary:

> a companion skill packet can be listed or under review on its own host lane
> without proving that Shopflow itself is already Chrome Web Store listed,
> signed, or public-claim-ready.

## Ready but not live yet

- Richer storefront visuals and builder-facing packet polish can keep improving
  without changing the truthful product boundary.
- Reviewer-facing release materials already exist, but they are still
  pre-signing materials rather than a store-ready shelf.

## Not published yet

- Chrome Web Store submission
- Official MCP registry listing
- Public HTTP MCP transport
- Public SDK/package claim
- Plugin marketplace listing
- Docker catalog listing

## Manual later

- Custom GitHub social preview upload still belongs to GitHub Settings.

## Truthful wording

It is truthful to say:

- Shopflow is public and reviewable today.
- The Pages front door, release shelf, and read-only stdio MCP already exist.
- The repo can package review bundles and submission-readiness materials today.
- Some companion packet lanes can have their own host-side state without
  changing the browser/store truth of the main product.

It is not truthful to say:

- Chrome Web Store is already ready for submission
- signed/store-ready artifacts are already complete
- a public HTTP MCP endpoint already ships
- an official registry or marketplace listing already exists

## Read next

- Public repo front door: [README.md](./README.md)
- Docs front door: [docs/README.md](./docs/README.md)
- Verification boundary: [docs/contracts/testing-and-verification-bar.md](./docs/contracts/testing-and-verification-bar.md)
- Review/scope scoreboard: [docs/ecosystem/evidence-submission-current-scope-readiness.md](./docs/ecosystem/evidence-submission-current-scope-readiness.md)
