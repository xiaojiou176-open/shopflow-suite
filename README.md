# Shopflow

[Product boundary](./docs/adr/ADR-001-shopflow-repo-topology-and-product-boundary.md) ·
[Verification bar](./docs/contracts/testing-and-verification-bar.md) ·
[Latest review shelf](https://github.com/xiaojiou176-open/shopflow-suite/releases/latest) ·
[Pages front door](https://xiaojiou176-open.github.io/shopflow-suite/) ·
[Docs atlas](./docs/README.md) ·
[Open an issue](https://github.com/xiaojiou176-open/shopflow-suite/issues/new/choose)

Shopflow is a **Chrome-first shopping extension product family** for `8`
storefront apps plus `1` Suite shell, kept in one canonical public repo.

![Shopflow front door](./docs/assets/shopflow-front-door.svg)

In plain language:

> many storefront doors, one kitchen, one truthful review shelf.

![Shopflow public Pages snapshot card](./docs/assets/shopflow-pages-front-door-card.svg)

![Shopflow review shelf snapshot card](./docs/assets/shopflow-review-shelf-card.svg)

## Start Here First

- **What this is:** one shopping-only extension family with `8` storefront
  apps, `1` Suite shell, and one shared engineering kitchen.
- **Why it is worth opening now:** the repo already ships a product front door,
  a reviewer-facing release shelf, and one canonical public repo without
  splitting truth across `9` separate codebases.
- **First honest route:** read the product boundary, then the verification bar,
  then the latest review shelf.
- **Where to get help:** use the Pages front door for the public first touch,
  then the GitHub docs atlas for the fuller map, the
  release review runbook for bundle meaning, and GitHub issues when the public
  story drifts.
- **What is still claim-gated:** live receipt evidence bundles and
  store-ready signed extension release artifacts are not yet in place.

In plain language:

> the public repo and review shelf are real today.
> the support line is still gated by live evidence and signed release artifacts.

## First Product Route

If you want the shortest truthful product-first read, take this route:

1. [See the product boundary](./docs/adr/ADR-001-shopflow-repo-topology-and-product-boundary.md).
2. [See the verification boundary](./docs/contracts/testing-and-verification-bar.md).
3. [Open the latest review shelf](https://github.com/xiaojiou176-open/shopflow-suite/releases/latest).
4. If you want the public first-touch lobby, open the [Pages front door](https://xiaojiou176-open.github.io/shopflow-suite/).
5. If you need the fuller GitHub-local map, open the [Docs atlas](./docs/README.md).

## Need Help or the Fuller Atlas?

- [Pages front door](https://xiaojiou176-open.github.io/shopflow-suite/)
- [Docs atlas](./docs/README.md)
- [Release Review Shelf Boundary](./docs/runbooks/release-artifact-review.md)
- [Live Receipt Evidence Boundary](./docs/runbooks/live-receipt-capture.md)
- [Distribution truth](./DISTRIBUTION.md)
- [Contributing](./CONTRIBUTING.md)
- [Open an issue](https://github.com/xiaojiou176-open/shopflow-suite/issues/new/choose)

## What You Can See Right Away

| Surface              | What it proves today                            | What it must not be mistaken for               |
| :------------------- | :---------------------------------------------- | :--------------------------------------------- |
| public repo          | the canonical product and docs front door       | a packet-only side shelf                       |
| Pages front door     | the current public product story                | Chrome Web Store readiness                     |
| latest release shelf | reviewer-facing bundles and readiness materials | a signed store-ready release shelf             |

## Builder Side Door

This is a **secondary** reading path, not the default repo identity.

If you already know you are here for builder-facing packets or the repo-truth
MCP entry, start here after the product route above:

- [Builder Start Here](./docs/ecosystem/builder-start-here.md)
- [Integration Recipes](./docs/ecosystem/integration-recipes.md)
- [Agent Quickstarts](./docs/ecosystem/agent-quickstarts.md)
- [MCP Quickstart](./docs/ecosystem/mcp-quickstart.md)

These surfaces are real today, but they are still **secondary** to the default
product story:

> shopping extension family under strict evidence and claim boundaries.

Target-specific quickstarts, example JSON, and ecosystem-specific packets stay
in the docs shelf instead of taking over the root README.

## Primary Product vs Companion Surfaces

Think of Shopflow like a mall with one real storefront and a few information
desks:

| Surface                                                          | Role                          | Why it exists                                                                  | What it must not be mistaken for                                |
| :--------------------------------------------------------------- | :---------------------------- | :----------------------------------------------------------------------------- | :-------------------------------------------------------------- |
| `apps/ext-*` + `apps/ext-shopping-suite`                         | primary product lane          | the browser-first extension family itself                                      | a packet mirror or an MCP-first product                         |
| `distribution/openclaw-plugin/skills/shopflow-read-only-packet/` | companion public skill packet | one portable folder for host-native skill flows such as OpenClaw and OpenHands | proof that Shopflow browser/store lanes are already listed live |
| `distribution/public-packets/`                                   | companion packet mirror       | smaller target-specific handoff packets when a side shelf helps                | the canonical Shopflow front door or a second product repo      |
| `pnpm mcp:stdio` + builder docs                                  | companion repo-truth surface  | read-only repo, runtime-seam, and submission-readiness access for AI tools     | a public HTTP MCP, public SDK, or Chrome Web Store state        |

## What You Can Inspect Today

- public canonical repo:
  `https://github.com/xiaojiou176-open/shopflow-suite`
- public Pages front door:
  `https://xiaojiou176-open.github.io/shopflow-suite/`
- read-only stdio MCP:
  `pnpm mcp:stdio`
- latest release:
  [latest release shelf](https://github.com/xiaojiou176-open/shopflow-suite/releases/latest)
- current review shelf already includes:
  - `8` store review bundles
  - `1` Suite internal-alpha review bundle
  - a review manifest
  - a submission-readiness report

In plain language:

> there is already a real review shelf you can inspect today.
> it is a reviewer shelf, not a signed/store-ready shelf.

## Storefront Family

![Shopflow storefront atlas](./docs/assets/shopflow-storefront-atlas.svg)

This is the product shape at a glance:

- `8` storefront apps
- `1` Suite shell
- one shared engineering source of truth
- one canonical repo and one read-only MCP desk

## Public Repo Topology

Shopflow's public GitHub surface now uses **one main front door**.

If you only open one repo, open `xiaojiou176-open/shopflow-suite`.

| Repo                              | Role now            | Use it for                                                                       | Must not be mistaken for                                                  |
| :-------------------------------- | :------------------ | :------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| `xiaojiou176-open/shopflow-suite` | only canonical repo | the default product, docs, Pages, release, review shelf, and read-only MCP entry | a packet-only side shelf, a second repo, or a public HTTP API/MCP service |

In plain language:

> `shopflow-suite` is the main building and the only live GitHub front door.
> packet shelves can have their own host-side state, but they do not replace
> the browser-first product lane.

## What Shopflow Is and Is Not

Shopflow is a **browser extension product repo**. It is not a hosted shopping SaaS, not a write-capable MCP hub, and not an autonomous agent platform.

When this repo says:

- `runtime`, it means the extension runtime inside Chrome, such as the Side Panel, Popup, Content Script, and Service Worker
- `operator`, it means the internal reviewer or tester using those extension surfaces during repo verification and evidence review
- `control-plane`, it means the Suite internal-alpha routing and visibility surface inside the extension product family, not a remote control tower service

This wording matters because repo-verified extension surfaces are real progress, but they are still different from public-ready support claims, signed release artifacts, or live action proof.

Shopflow now also exposes a **read-only stdio MCP surface** for AI tools that
need repo-truth, runtime seam, submission readiness, and distribution packet
access.

## Public Readers Start Here

If you are opening this repository as a public codebase first, start with these
three questions before you read any ecosystem packet pages:

1. What product is this repo actually building?
   - [ADR-001: Shopflow Repo Topology and Product Boundary](./docs/adr/ADR-001-shopflow-repo-topology-and-product-boundary.md)
2. What does the repo currently prove, and what does it still not prove?
   - [Testing and Verification Bar](./docs/contracts/testing-and-verification-bar.md)
3. What should reviewers and operators treat as real vs still claim-gated?
   - [Docs Front Door](./docs/README.md)
   - [Release Review Shelf Boundary](./docs/runbooks/release-artifact-review.md)

In plain language:

> this repo's main story is still "shopping extension family under evidence
> gates," not "public plugin marketplace."

The canonical OpenClaw install path is now:

- `github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin`

## Current Scope Buckets

The full contract lives in
[`ADR-003: Builder Integration Surface and Product Language Boundary`](./docs/adr/ADR-003-builder-integration-surface-and-product-language-boundary.md).
The short version is:

- **Today:** `8+1` app shells, shared contracts, repo-owned review packaging, and truthful builder-facing read models already exist
- **Current-scope now:** public front door, read-only stdio MCP, builder packet quality, review UX, English-first copy, and discoverability can keep getting stronger without overclaiming public API/HTTP MCP/SDK reality
- **Deferred by owner:** hosted runtime, homepage migration, custom domain, and official ecosystem publication routes that depend on external surfaces
- **No-go:** write-capable MCP, hosted shopping SaaS control plane, and any public wording that outruns reviewed live evidence

## Current Status

Current repo state is **all `8+1` app shells materialized, with Wave 1 + Wave 2 repo-verified, Wave 3 Kroger/Weee now repo-verified, and a Suite internal alpha shell in place**.

What is already in place on the public contract and policy shelf:

- repo topology decisions
- release-wave decisions
- verification bar
- live receipt capture runbook
- branding rules

Additional maintainer-only implementation contracts, UI surface specs, and
dependency policy notes now stay in local private docs instead of the public
docs shelf.

What is already in place in the repo implementation layer:

- root workspace configuration
- TypeScript strict baseline
- Wave 1 app scaffolding for:
  - `ext-albertsons`
  - `ext-amazon`
  - `ext-target`
- Wave 2 app scaffolding for:
  - `ext-costco`
  - `ext-walmart`
  - `ext-temu`
- Wave 3 app materialization for:
  - `ext-kroger`
  - `ext-weee`
- internal-only alpha shell for:
  - `ext-shopping-suite`
- shared package scaffolding for:
  - `contracts`
  - `core`
  - `runtime`
  - `ui`
  - `testkit`
- all store packages for:
  - `store-albertsons`
  - `store-amazon`
  - `store-target`
  - `store-costco`
  - `store-walmart`
  - `store-temu`
  - `store-kroger`
  - `store-weee`
- contract, unit, integration, and E2E verification scaffolding
- routed fixture smoke coverage for Wave 1, Wave 2, Wave 3 Kroger/Weee, and the Suite internal alpha
- repo-owned live-receipt evidence harness foundations
- live-receipt workflow states that now distinguish missing, in-progress, captured, reviewed, rejected, and expired evidence
- verification-catalog parity tooling wired into the repo test gate
- CI review artifact packaging for all `8+1` apps, with `internal-alpha` and store-review bundles kept separate
- local `pnpm package:artifacts` packaging flow that emits zipped review bundles plus a repo-owned artifact manifest
- local release tooling that now also writes a repo-owned submission-readiness report so reviewers can see what still blocks store submission without reading code
- that submission-readiness report now also includes a manual review start URL and a small checklist so reviewers know where to begin
- CI now uploads that submission-readiness report as a first-class review artifact alongside the release manifest
- CI now runs the same serial `verify:release-readiness` lane as local verification, so the strongest local release-readiness answer and the strongest CI answer stay aligned
- repo-owned live browser helpers that can preflight, diagnose, probe, and
  reopen the canonical merchant Chrome session without pretending the reviewed
  live packet already exists, while refusing host-wide tab inspection and
  unverified PID closeout outside the recorded Shopflow singleton lane
  - when the host is over the browser main-process budget, the open-browser
    artifact now also records:
    - every detected browser main-process PID
    - which PIDs already match the requested Shopflow user-data-dir
    - which PIDs already match the requested debugging port
- a first Shopflow-local Switchyard seam contract plus thin route builder,
  which locks the provider-runtime boundary without pretending Shopflow already
  ships that runtime itself
- a thin provider-runtime consumer snapshot plus an internal-alpha Suite seam
  section that can render explicit acquisition routes when a real Switchyard
  base URL is provided
- root hygiene gates for `pre-commit`, `commitlint`, and coverage regression checks
- representative store maturity improvements that now distinguish runnable, blocked, and already-complete states more honestly for Albertsons and Temu
- Wave 3 adapter hardening that now maps Kroger / Weee export blocking to actual selector, parse, and page-scope causes instead of one generic blocked reason
- deeper Wave 3 DOM-variant coverage for Kroger family product/deal cards and Weee product pages
- shared Side Panel, Popup, and Suite internal alpha surfaces that now foreground readiness, claim boundary, operator next step, and routing guidance more clearly
- app-scoped recent activity recording that now feeds lightweight live operator context into shared surfaces instead of a static placeholder panel
- shared Side Panel and Popup now expose direct jump-back links to the latest known source page when recent activity already captured that route
- store content scripts now record the freshest ready extracted output into shared runtime storage instead of leaving shared surfaces with readiness-only summaries
- shared Side Panel and Suite drill-down now surface the freshest repo-owned extracted output preview so operators can see what was actually captured, not just that something was runnable
- Suite internal alpha drill-down that now inspects per-app latest detection, recent activity, and evidence queue summaries instead of a dead inspect CTA
- Suite evidence queue now groups items by triage state so operators can scan capture, review, and reviewed work faster
- live-receipt workflow transition guards that keep `capture-in-progress`, `captured`, `reviewed`, `rejected`, and `expired` semantically distinct
- verification and release tooling that now catches review-manifest drift, packaging completeness gaps, and parity failures with more readable failure categories
- reusable contract-fixture testkit helper for simple storefront shell contract tests

What is not yet in place:

- live receipt evidence bundles
- store-ready signed extension release artifacts

Current repo-owned adapter truth now covers each app's current MVP focus under
contract, contract-test, and browser-level verification. That is stronger than
"shells only," but it is still not public-claim-ready proof.

Reviewable CI artifacts now exist for every app shell, but they are still not
the same thing as a public release package.

If you are new to Shopflow and need the shortest accurate builder entrypoint, start with [docs/README.md](./docs/README.md).

## Verification Boundary

Shopflow keeps three truth layers separate:

- `repo-owned verification`
  - the strongest serial repo lane plus the review shelf
- `reviewed live evidence`
  - the external proof layer that still gates broader public claims
- `signing / store submission`
  - the platform layer that sits beyond repo packaging

In plain language:

> this repo can already prove a lot.
> it still does not get to collapse repo verification, live proof, and signed
> submission into one sentence.

Detailed maintainer verification choreography, browser/profile handling, cache
governance, and cleanup procedures are intentionally kept off the public front
door. Public readers should use the product boundary, verification bar, review
shelf, and docs atlas; maintainers can follow the deeper local guidance from
those shelves.

So if you are reading this now, treat Shopflow as:

- **contract-complete enough to support implementation**
- **all `8+1` app shells now materialized**
- **Wave 1 + Wave 2 + Kroger/Weee are repo-verified**
- **representative store workflows and shared operator surfaces are stronger, but still not the same thing as public-ready support**
- **Suite internal alpha is available as a composition shell, not a public release**
- **still not feature-complete or public-claim-ready**

If you want the shortest honest summary:

> Shopflow already has a credible extension-family repo shape and review path.
> It does **not** yet have the live evidence or release polish needed for public support claims.

## Product Family

Shopflow will eventually ship these public products:

- `Shopflow for Albertsons Family`
- `Shopflow for Kroger Family`
- `Shopflow for Amazon`
- `Shopflow for Costco`
- `Shopflow for Walmart`
- `Shopflow for Weee`
- `Shopflow for Target`
- `Shopflow for Temu`
- `Shopflow Suite`

Important claim boundary:

- `Albertsons Family` is currently verified on `Safeway`
- `Kroger Family` is currently verified on `Fred Meyer + QFC`

## Architecture Summary

Canonical repo shape:

```text
shopflow-suite/
  apps/
  packages/
  tests/
  docs/
  tooling/
```

Canonical shared layers:

- `packages/contracts`
- `packages/core`
- `packages/runtime`
- `packages/ui`
- `packages/testkit`

Canonical store adapter layers:

- `packages/store-albertsons`
- `packages/store-kroger`
- `packages/store-amazon`
- `packages/store-costco`
- `packages/store-walmart`
- `packages/store-weee`
- `packages/store-target`
- `packages/store-temu`

Main runtime shape:

- `Side Panel`
- `Content Script`
- `Service Worker`

Main UI rule:

- the primary app lives in **Side Panel**
- `Popup` is a light launcher
- page-injected UI stays thin

## Release Strategy

Release sequence is staged, but final scope is still `8+1`.

### Wave 1

- `Shopflow for Albertsons Family`
- `Shopflow for Amazon`
- `Shopflow for Target`

### Wave 2

- `Shopflow for Costco`
- `Shopflow for Walmart`
- `Shopflow for Temu`

### Wave 3

- `Shopflow for Kroger Family`
- `Shopflow for Weee`
- `Shopflow Suite`

## Review Artifacts

Shopflow CI now publishes a **review shelf** for each app shell.

In plain language:

> downloadable reviewer packets, not signed store-ready releases.

These bundles are for:

- reviewer download
- manifest and surface sanity checks
- internal alpha vs store artifact separation
- local parity with CI review packaging via `pnpm package:artifacts`
- `submission-readiness.json` context that explains which apps are still internal-alpha-only, claim-gated, or waiting on external signing/submission conditions
- a clearer reviewer handoff path that now separates repo-owned readiness from
  true external-only gates such as reviewed live evidence, signing, and real
  store submission

They are **not** the same thing as:

- Chrome Web Store-ready release artifacts
- signed production packages
- proof that an app is public-claim-ready

## Source of Truth

When documents disagree, follow this order:

1. `docs/adr/`
2. `docs/contracts/`
3. `docs/runbooks/`
4. `docs/ui/`
5. `docs/blueprints/`
6. `docs/branding/`
7. root docs

Do not use prior chats or assumptions as runtime truth.

## Document Map

Start with the docs front door if you want the shortest guided map:

- [Docs Front Door](./docs/README.md)

### ADRs

- [ADR-001: Shopflow Repo Topology and Product Boundary](./docs/adr/ADR-001-shopflow-repo-topology-and-product-boundary.md)
- [ADR-002: Release Wave and Product Tiering](./docs/adr/ADR-002-release-wave-and-product-tiering.md)
- [ADR-003: Builder Integration Surface and Product Language Boundary](./docs/adr/ADR-003-builder-integration-surface-and-product-language-boundary.md)

### Contracts

- [Testing and Verification Bar](./docs/contracts/testing-and-verification-bar.md)

### Runbook

- [Live Receipt Evidence Boundary](./docs/runbooks/live-receipt-capture.md)
- [Release Review Shelf Boundary](./docs/runbooks/release-artifact-review.md)

### Branding

- [Shopflow Brand and Claim Boundary](./docs/branding/shopflow-brand-and-claim-boundary.md)

## Implementation Readiness

Shopflow is ready for implementation execution and task handoff.

It is not yet ready to claim:

- released app support
- working runtime behavior
- public capability availability

Those claims require fresh verification evidence as defined in the testing bar.

## Open Source Basics

- License: [MIT](./LICENSE)
- Security reporting: [SECURITY.md](./SECURITY.md)
- Contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Community conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Environment template: [`.env.example`](./.env.example)
