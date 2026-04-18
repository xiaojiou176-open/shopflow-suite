# Shopflow Docs Atlas

![Shopflow front door](./assets/shopflow-front-door.svg)

![Shopflow storefront atlas](./assets/shopflow-storefront-atlas.svg)

[Public Pages front door](https://xiaojiou176-open.github.io/shopflow-suite/) ·
[Product boundary](https://xiaojiou176-open.github.io/shopflow-suite/adr/ADR-001-shopflow-repo-topology-and-product-boundary.html) ·
[Verification bar](https://xiaojiou176-open.github.io/shopflow-suite/contracts/testing-and-verification-bar.html) ·
[Latest review shelf](https://github.com/xiaojiou176-open/shopflow-suite/releases/latest) ·
[Public repo README](https://github.com/xiaojiou176-open/shopflow-suite#readme) ·
[Release review runbook](https://xiaojiou176-open.github.io/shopflow-suite/runbooks/release-artifact-review.html)

This page is the GitHub-local docs atlas and service desk.
If you want the public first-touch lobby, start with the Pages front door above.

## Start Here First

- **What this is:** the product-first docs desk for one Chrome-first shopping
  extension family with `8` storefront apps and `1` Suite shell, kept as a
  GitHub-local atlas instead of a second public front desk.
- **Why it is worth opening now:** the repo already exposes a real product
  front door, a real review shelf, and a real repo-local read-only MCP without
  splitting truth across multiple public repos.
- **First honest route:** open the public Pages front door for first touch, then
  use this atlas when you want the deeper GitHub-local shelves.
- **What is still claim-gated:** reviewed live receipt evidence and
  signed/store-ready artifacts still gate broader public support wording.

> The default story is still:
> shopping extension family under evidence and claim boundaries.

## First Product Path

1. [Public Pages front door](https://xiaojiou176-open.github.io/shopflow-suite/)
2. [Product boundary](https://xiaojiou176-open.github.io/shopflow-suite/adr/ADR-001-shopflow-repo-topology-and-product-boundary.html)
3. [Verification bar](https://xiaojiou176-open.github.io/shopflow-suite/contracts/testing-and-verification-bar.html)
4. [Latest review shelf](https://github.com/xiaojiou176-open/shopflow-suite/releases/latest)

## What You Can Inspect Today

| Surface                 | What it proves today                            | What it must not be mistaken for               |
| :---------------------- | :---------------------------------------------- | :--------------------------------------------- |
| public Pages front door | the clearest public first-touch route           | a packet atlas or builder dump                 |
| GitHub docs atlas       | the deeper repo-local service desk              | a second public homepage                       |
| latest review shelf     | reviewer-facing bundles and readiness materials | a signed store-ready shelf                     |
| public repo README      | the short public product story                  | a replacement for deeper docs and runbooks     |
| read-only stdio MCP     | repo-truth access for AI tools                  | a public HTTP MCP or official registry listing |

## Verification Layers

- `pre-commit`
  - `pnpm verify:local-hygiene`
- `pre-push`
  - `pnpm verify:pre-push`
- `hosted`
  - `shopflow-ci` runs `pnpm verify:release-readiness`
- `nightly`
  - `external-governance` runs `pnpm verify:external-governance`
- `manual`
  - live/browser/review/signing/submission lanes

Important boundary:

> `verify:release-readiness` is the strongest repo-owned lane.
> It is still not the same thing as reviewed live evidence, signing, or real store submission.

## Need Help or the Deeper Atlas?

- [Public Pages front door](https://xiaojiou176-open.github.io/shopflow-suite/)
- [Release Artifact Review Runbook](https://xiaojiou176-open.github.io/shopflow-suite/runbooks/release-artifact-review.html)
- [Live Receipt Capture Runbook](https://xiaojiou176-open.github.io/shopflow-suite/runbooks/live-receipt-capture.html)
- [Distribution truth on GitHub](https://github.com/xiaojiou176-open/shopflow-suite/blob/main/DISTRIBUTION.md)
- [Open an issue](https://github.com/xiaojiou176-open/shopflow-suite/issues/new/choose)
- [Contributing on GitHub](https://github.com/xiaojiou176-open/shopflow-suite/blob/main/CONTRIBUTING.md)

## Secondary Builder / Maintainer Shelves

If you already know you are here for repo-local builder, agent, or MCP
materials, jump straight to the secondary shelves below.
If you are only checking the public product story, you can stop before this section:

- [Builder Start Here](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/builder-start-here.html)
- [Agent Quickstarts](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/agent-quickstarts.html)
- [MCP Quickstart](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/mcp-quickstart.html)

### Quick command entrypoints

- `pnpm mcp:stdio`
- `pnpm cli:read-only -- runtime-seam`
- `pnpm cli:read-only -- runtime-consumer --base-url <switchyard-base-url>`

These shelves are real, but they are still **secondary** to the default product
route above.

## Maintainer Boundary

Detailed maintainer-only browser, review, and release procedures are kept
**off** the public docs shelf.

Public docs explain:

- what the product proves today
- what is still claim-gated
- how to inspect the public review shelf truthfully

They do **not** act as the operator manual for local browser/session handling,
repo-local artifact paths, or maintainer-only release choreography.

## Truth Layers

- `fixture-ready`: the repo practiced with stable sample inputs
- `repo-verified`: the repo can prove the path with its own tests and review artifacts
- `public-claim-ready`: the product has the extra evidence needed to make public support claims

Repo verification is real progress.
It is still not a substitute for reviewed live evidence, signed artifacts, or
store submission.
