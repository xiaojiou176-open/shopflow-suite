# Distribution Truth

This page keeps the public distribution story short, truthful, and reusable.

## Exact receipts now

| Lane | Exact receipt today | Honest status | What this still must not be mistaken for |
| --- | --- | --- | --- |
| Public canonical repo | [`github.com/xiaojiou176-open/shopflow-suite`](https://github.com/xiaojiou176-open/shopflow-suite) | live | a packet-only side shelf |
| Pages front door | [`xiaojiou176-open.github.io/shopflow-suite/`](https://xiaojiou176-open.github.io/shopflow-suite/) | live | Chrome Web Store publication |
| Release review shelf | [`releases/latest`](https://github.com/xiaojiou176-open/shopflow-suite/releases/latest) | live reviewer shelf | a signed/store-ready shelf |
| Read-only stdio MCP lane | `pnpm mcp:stdio` | live repo-local stdio surface | a public HTTP MCP or official registry listing |
| Companion packet lane (ClawHub) | [`clawhub.ai/xiaojiou176/shopflow-read-only-packet`](https://clawhub.ai/xiaojiou176/shopflow-read-only-packet) | listed-live for the packet lane | proof that the primary browser/store lane is already published |
| Companion packet lane (OpenHands) | [`OpenHands/extensions#161`](https://github.com/OpenHands/extensions/pull/161) | submission_done_review_pending (`REVIEW_REQUIRED`) | accepted/live OpenHands publication |

Reviewer shelf artifacts still include:

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
- Official MCP registry listing (current search receipt is still `count: 0`)
- Public HTTP MCP transport
- Public SDK/package claim
- Plugin marketplace listing
- Docker catalog listing
- repo-tracked PyPI package receipt
- repo-tracked MCP.so public page receipt

## Current official publish-prep order

These are the strongest truthful prep lanes today if publication happens later:

| Surface | Current status | What to prepare now | What must still not be claimed yet |
| --- | --- | --- | --- |
| `npm` | official and stable | package metadata, trusted publishing, provenance, 2FA, maintainer access | that Shopflow already ships a public package today |
| `Claude Code` | official plugin / marketplace surface exists | `.claude-plugin/plugin.json`, screenshots, homepage/privacy/terms, marketplace-ready README | that Shopflow is already listed or published there |
| `OpenClaw / ClawHub` | official public lane exists | OpenClaw plugin package metadata, ClawHub-ready install/discovery copy, npm-safe package path | that the primary browser/store lane itself is already publicly published there |
| `MCP Registry` | official but `preview` | registry metadata only after a real npm-published MCP package exists | that registry publication already exists today |
| `Codex / OpenAI` | plugin system exists, official directory still preview-like / opening up | plugin metadata, screenshots, homepage/privacy/terms, dogfood-ready bundle | that Shopflow can already self-serve an official Codex listing today |

Recommended prep order:

1. `npm`
2. `Claude Code` / `OpenClaw + ClawHub`
3. `MCP Registry` if a real public MCP package is opened
4. `Codex / OpenAI` official directory later

## Manual later

- Custom GitHub social preview upload still belongs to GitHub Settings.

## Truthful wording

It is truthful to say:

- Shopflow is public and reviewable today via the public repo, Pages front door,
  and latest review shelf.
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
