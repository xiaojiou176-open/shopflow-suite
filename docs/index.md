# Shopflow

Chrome-first shopping extension family.

![Shopflow front door](./assets/shopflow-front-door.svg)

> many storefront doors, one kitchen.

[Open the public repo](https://github.com/xiaojiou176-open/shopflow-suite) ·
[Read the Docs Front Door](./README.md) ·
[Open the latest release](https://github.com/xiaojiou176-open/shopflow-suite/releases/latest) ·
[Builder Start Here](./ecosystem/builder-start-here.md) ·
[Evidence and submission readiness](./ecosystem/evidence-submission-current-scope-readiness.md)

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
| what product this repo is actually building | [ADR-001: Repo Topology and Product Boundary](./adr/ADR-001-shopflow-repo-topology-and-product-boundary.md) | this is the contract that locks `8+1`, shopping-only scope, and the Suite boundary |
| what the repo currently proves, and what it still does not prove | [Docs Front Door](./README.md) | this is the clearest plain-language map of current truth and claim boundaries |
| what support claims still need stronger evidence | [Testing and Verification Bar](./contracts/testing-and-verification-bar.md) | this is where `fixture-ready`, `repo-verified`, and `public-claim-ready` are separated |
| how review bundles and submission-readiness should be read | [Evidence and Submission Current-Scope Readiness](./ecosystem/evidence-submission-current-scope-readiness.md) | this is the operator/reviewer scorecard |
| how builders or coding agents should approach the repo | [Builder Start Here](./ecosystem/builder-start-here.md) | this is the shortest truthful side entrance for builder-facing surfaces |

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

1. Read the [Docs Front Door](./README.md).
2. Read the [Testing and Verification Bar](./contracts/testing-and-verification-bar.md).
3. Read [Evidence and Submission Current-Scope Readiness](./ecosystem/evidence-submission-current-scope-readiness.md).
4. Only after that, if you are here as a builder, open [Builder Start Here](./ecosystem/builder-start-here.md) or [Agent Quickstarts](./ecosystem/agent-quickstarts.md).

## Builder Lane Is Real, But Secondary

If you already know you are here for coding-agent or builder-facing surfaces,
start with:

- [Builder Start Here](./ecosystem/builder-start-here.md)
- [Integration Recipes](./ecosystem/integration-recipes.md)
- [Agent Quickstarts](./ecosystem/agent-quickstarts.md)
- [MCP Quickstart](./ecosystem/mcp-quickstart.md)

That lane is truthful today.
It is still **secondary** to the default product story:

> shopping extension family under strict evidence and claim boundaries.
