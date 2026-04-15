# Shopflow Docs Front Door

![Shopflow front door](./assets/shopflow-front-door.svg)

![Shopflow storefront atlas](./assets/shopflow-storefront-atlas.svg)

This page is the shortest honest map for readers who need the product story
first, not the whole back office.

[Product boundary](https://xiaojiou176-open.github.io/shopflow-suite/adr/ADR-001-shopflow-repo-topology-and-product-boundary.html) ·
[Verification bar](https://xiaojiou176-open.github.io/shopflow-suite/contracts/testing-and-verification-bar.html) ·
[Latest review shelf](https://github.com/xiaojiou176-open/shopflow-suite/releases/latest) ·
[Public repo README](https://github.com/xiaojiou176-open/shopflow-suite#readme) ·
[Release review runbook](https://xiaojiou176-open.github.io/shopflow-suite/runbooks/release-artifact-review.html)

## Start Here First

- **What this is:** the product-first docs desk for one Chrome-first shopping
  extension family with `8` storefront apps and `1` Suite shell.
- **Why it is worth opening now:** the repo already exposes a real product
  front door, a real review shelf, and a real repo-local read-only MCP without
  splitting truth across multiple public repos.
- **First honest route:** read the product boundary, then the verification bar,
  then the latest review shelf.
- **What is still claim-gated:** reviewed live receipt evidence and
  signed/store-ready artifacts still gate broader public support wording.

> The default story is still:
> shopping extension family under evidence and claim boundaries.

## First Product Path

1. [Product boundary](https://xiaojiou176-open.github.io/shopflow-suite/adr/ADR-001-shopflow-repo-topology-and-product-boundary.html)
2. [Verification bar](https://xiaojiou176-open.github.io/shopflow-suite/contracts/testing-and-verification-bar.html)
3. [Latest review shelf](https://github.com/xiaojiou176-open/shopflow-suite/releases/latest)
4. [Public repo README](https://github.com/xiaojiou176-open/shopflow-suite#readme)

## What You Can Inspect Today

| Surface | What it proves today | What it must not be mistaken for |
| :--- | :--- | :--- |
| product docs front door | the clearest product-first route through the repo | a packet atlas or builder dump |
| latest review shelf | reviewer-facing bundles and readiness materials | a signed store-ready shelf |
| public repo README | the short public product story | a replacement for deeper docs and runbooks |
| read-only stdio MCP | repo-truth access for AI tools | a public HTTP MCP or official registry listing |

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

- [Release Artifact Review Runbook](https://xiaojiou176-open.github.io/shopflow-suite/runbooks/release-artifact-review.html)
- [Live Receipt Capture Runbook](https://xiaojiou176-open.github.io/shopflow-suite/runbooks/live-receipt-capture.html)
- [Sensitive Surface Incident Response Runbook](https://xiaojiou176-open.github.io/shopflow-suite/runbooks/sensitive-surface-incident-response.html)
- [Distribution truth on GitHub](https://github.com/xiaojiou176-open/shopflow-suite/blob/main/DISTRIBUTION.md)
- [Open an issue](https://github.com/xiaojiou176-open/shopflow-suite/issues/new/choose)
- [Contributing on GitHub](https://github.com/xiaojiou176-open/shopflow-suite/blob/main/CONTRIBUTING.md)

## Secondary Repo-Local Engineering Shelves

If you already know you are here for repo-local builder, agent, or MCP
materials, jump straight to the secondary shelves below:

- [Builder Start Here](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/builder-start-here.html)
- [Agent Quickstarts](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/agent-quickstarts.html)
- [MCP Quickstart](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/mcp-quickstart.html)

Useful repo-local commands:

- `pnpm mcp:stdio`
- `pnpm cli:read-only -- runtime-seam`
- `pnpm cli:read-only -- runtime-consumer --base-url <switchyard-base-url>`

These shelves are real, but they are still **secondary** to the default product
route above.

## Live Browser Lane

When you need the real-browser lane instead of static repo proof, start here:

- `pnpm preflight:live`
- `pnpm diagnose:live`
- `pnpm probe:live`
- `pnpm operator-capture-packet:live`
- `pnpm review-candidate-records:live`
- `pnpm review-input-template:live`

Useful evidence files:

- `.runtime-cache/live-browser/open-live-browser-latest.json`
- `.runtime-cache/live-browser/diagnose-latest.json`
- `.runtime-cache/live-browser/probe-latest.json`

Useful budget fields:

- `browserInstanceBudget.browserMainProcessPids`
- `browserInstanceBudget.matchingRequestedRootPids`
- `browserInstanceBudget.matchingRequestedPortPids`

## Truth Layers

- `fixture-ready`: the repo practiced with stable sample inputs
- `repo-verified`: the repo can prove the path with its own tests and review artifacts
- `public-claim-ready`: the product has the extra evidence needed to make public support claims

Repo verification is real progress.
It is still not a substitute for reviewed live evidence, signed artifacts, or
store submission.
