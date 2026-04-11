# Shopflow

Chrome-first shopping extension family.

![Shopflow front door](./assets/shopflow-front-door.svg)
![Shopflow storefront atlas](./assets/shopflow-storefront-atlas.svg)

> many storefront doors, one kitchen, one truthful review shelf.

[Open the public repo](https://github.com/xiaojiou176-open/shopflow-suite) ·
[See the product boundary](https://xiaojiou176-open.github.io/shopflow-suite/adr/ADR-001-shopflow-repo-topology-and-product-boundary.html) ·
[See the product feel](https://xiaojiou176-open.github.io/shopflow-suite/ui/shopflow-product-surface-spec.html) ·
[See the verification boundary](https://xiaojiou176-open.github.io/shopflow-suite/contracts/testing-and-verification-bar.html) ·
[Open the latest review shelf](https://github.com/xiaojiou176-open/shopflow-suite/releases/latest)

Secondary doors:
[Builder Start Here](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/builder-start-here.html) ·
[Evidence and submission readiness](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/evidence-submission-current-scope-readiness.html) ·
[Distribution truth on GitHub](https://github.com/xiaojiou176-open/shopflow-suite/blob/main/DISTRIBUTION.md) ·
[Canonical README on GitHub](https://github.com/xiaojiou176-open/shopflow-suite#readme)

## Shopflow In 30 Seconds

- **Category:** a Chrome-first shopping extension family with `8` storefront
  apps plus `1` Suite shell
- **Heat hook:** one repo already packages `8` storefront review bundles plus
  `1` Suite internal-alpha bundle without splitting storefront truth across `9`
  code paths
- **Current result:** the public repo, Pages front door, review shelf, and
  read-only stdio MCP are live today, but Shopflow is still **not**
  public-claim-ready for broader support wording

In plain language:

> this repo already has real doors, real contracts, and real review packaging.
> it still does not have reviewed live receipt evidence bundles or signed
> store-ready artifacts.

## Public Surfaces

![Shopflow public Pages snapshot card](./assets/shopflow-pages-front-door-card.svg)

![Shopflow review shelf snapshot card](./assets/shopflow-review-shelf-card.svg)

## What This Repo Is

Shopflow is a **browser extension product repo**.

It is:

- a shopping-only product family
- an `8+1` monorepo with one shared engineering kitchen
- a repo where Side Panel / Popup / Suite surfaces consume shared runtime truth
- a repo that keeps builder-facing packets real, but secondary

It is not:

- a hosted shopping SaaS
- a write-capable MCP hub
- a generic autonomous agent platform
- proof that public support claims are already cleared

## Start With The Right Question

| If you want to know... | Open this first | Why this is the shortest honest path |
| :--- | :--- | :--- |
| what product this repo is actually building | [ADR-001: Repo Topology and Product Boundary](https://xiaojiou176-open.github.io/shopflow-suite/adr/ADR-001-shopflow-repo-topology-and-product-boundary.html) | this is the contract that locks `8+1`, shopping-only scope, and the Suite boundary |
| what the repo currently proves, and what it still does not prove | [What Is Public Today](#what-is-public-today) | this page already separates live public surfaces from claim-gated store support lines |
| what support claims still need stronger evidence | [Testing and Verification Bar](https://xiaojiou176-open.github.io/shopflow-suite/contracts/testing-and-verification-bar.html) | this is where `fixture-ready`, `repo-verified`, and `public-claim-ready` are separated |
| how review bundles and submission-readiness should be read | [Evidence and Submission Current-Scope Readiness](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/evidence-submission-current-scope-readiness.html) | this is the operator/reviewer scorecard |
| how builders or coding agents should approach the repo | [Builder Start Here](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/builder-start-here.html) | this is the shortest truthful side entrance for builder-facing surfaces |

## What Is Public Today

- public canonical repo:
  `https://github.com/xiaojiou176-open/shopflow-suite`
- public Pages entry:
  `https://xiaojiou176-open.github.io/shopflow-suite/`
- current release tag:
  [`v0.1.0`](https://github.com/xiaojiou176-open/shopflow-suite/releases/latest)
- attached release shelf now works as a public review shelf and includes:
  - review bundles for the `8` store apps
  - the `Shopflow Suite` internal-alpha review bundle
  - the review manifest
  - the submission-readiness report
- public builder-facing docs and machine-readable packets for:
  - `Codex`
  - `Claude Code`
  - `OpenClaw`
- a repo-local read-only stdio MCP entry:
  - `pnpm mcp:stdio`

## Public Repo Topology

Use the public repo surface like one front entrance:

| Repo | Role now | Open this when | Must not be mistaken for |
| :--- | :--- | :--- | :--- |
| `xiaojiou176-open/shopflow-suite` | only canonical repo | you want the main product, docs, Pages, release, review shelf, and read-only stdio MCP | a mirror, packet-only side shelf, or public HTTP MCP service |

If you only want one link, use:

- `https://github.com/xiaojiou176-open/shopflow-suite`

What this does **not** mean:

- not official Codex listing proof
- not official Claude Code marketplace proof
- not reviewed live evidence for claim-gated store support
- not a signed store-ready shelf
- not signed store-ready artifact proof
- not three equal canonical Shopflow repos

## Best First Route

1. Read the [product boundary](https://xiaojiou176-open.github.io/shopflow-suite/adr/ADR-001-shopflow-repo-topology-and-product-boundary.html).
2. Read the [verification boundary](https://xiaojiou176-open.github.io/shopflow-suite/contracts/testing-and-verification-bar.html).
3. Open the [latest review shelf](https://github.com/xiaojiou176-open/shopflow-suite/releases/latest).
4. If you need the operator scorecard, read [Evidence and Submission Current-Scope Readiness](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/evidence-submission-current-scope-readiness.html).
5. Only after that, if you are here as a builder, open [Builder Start Here](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/builder-start-here.html) or [Agent Quickstarts](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/agent-quickstarts.html).

## Need the product feel or the support desk?

If the first route above answered **what Shopflow is**, use this service desk to
answer **what it should feel like** or **where to go when you need help**:

- [Shopflow Product Surface Spec](https://xiaojiou176-open.github.io/shopflow-suite/ui/shopflow-product-surface-spec.html)
  - use this when you want the clearest product-facing explanation of Side Panel,
    Popup, Content UI, and Options responsibilities
- [Release Artifact Review Runbook](https://xiaojiou176-open.github.io/shopflow-suite/runbooks/release-artifact-review.html)
  - use this when you want the reviewer/operator desk for bundle truth, review
    channels, and the exact meaning of the current shelf
- [Live Receipt Capture Runbook](https://xiaojiou176-open.github.io/shopflow-suite/runbooks/live-receipt-capture.html)
  - use this when you need the real-browser evidence path instead of broader
    public-support claims
- [Docs front door on GitHub](https://github.com/xiaojiou176-open/shopflow-suite/blob/main/docs/README.md)
  - use this when you want the fuller atlas instead of only the public Pages
    front row
- [Open an issue](https://github.com/xiaojiou176-open/shopflow-suite/issues/new/choose)
  - use this when you found a public-surface gap or a misleading support claim
- [Contributing on GitHub](https://github.com/xiaojiou176-open/shopflow-suite/blob/main/CONTRIBUTING.md)
  - use this when you want the repo's truth rules and local contribution
    expectations before opening a PR

## Builder Lane Is Real, But Secondary

If you already know you are here for coding-agent or builder-facing surfaces,
start with:

- [Builder Start Here](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/builder-start-here.html)
- [Integration Recipes](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/integration-recipes.html)
- [Agent Quickstarts](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/agent-quickstarts.html)
- [MCP Quickstart](https://xiaojiou176-open.github.io/shopflow-suite/ecosystem/mcp-quickstart.html)

That lane is truthful today.
It is still **secondary** to the default product story:

> shopping extension family under strict evidence and claim boundaries.
