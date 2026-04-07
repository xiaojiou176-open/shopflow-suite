# Shopflow

Shopflow is a **Chrome-first shopping extension product family** built as a dedicated new repository.

It is designed to ship:

- `8` Store apps
- `1` Suite app
- one shared engineering source of truth

In plain language:

> many storefront doors, one kitchen.

## Front Door in 30 Seconds

- **Category:** a Chrome-first shopping extension family with `8` storefront apps plus `1` suite shell
- **Heat hook:** storefront-specific entry points stay narrow and searchable, while shared logic stays in one engineering source of truth
- **Current result:** the repo has materialized `8+1` app shells, shared contracts, and repo-owned verification/review packaging; the latest release is a **review shelf**, not a signed/store-ready shelf, and Shopflow is **not** yet public-claim-ready

## What Shopflow Is and Is Not

Shopflow is a **browser extension product repo**. It is not a hosted shopping SaaS, not a write-capable MCP hub, and not an autonomous agent platform.

When this repo says:

- `runtime`, it means the extension runtime inside Chrome, such as the Side Panel, Popup, Content Script, and Service Worker
- `operator`, it means the internal reviewer or tester using those extension surfaces during repo verification and evidence review
- `control-plane`, it means the Suite internal-alpha routing and visibility surface inside the extension product family, not a remote control tower service

This wording matters because repo-verified extension surfaces are real progress, but they are still different from public-ready support claims, signed release artifacts, or live action proof.

## Public Readers Start Here

If you are opening this repository as a public codebase first, start with these
three questions before you read any ecosystem packet pages:

1. What product is this repo actually building?
   - [ADR-001: Shopflow Repo Topology and Product Boundary](./docs/adr/ADR-001-shopflow-repo-topology-and-product-boundary.md)
2. What does the repo currently prove, and what does it still not prove?
   - [Testing and Verification Bar](./docs/contracts/testing-and-verification-bar.md)
3. What should reviewers and operators treat as real vs still claim-gated?
   - [Docs Front Door](./docs/README.md)
   - [Evidence and Submission Current-Scope Readiness](./docs/ecosystem/evidence-submission-current-scope-readiness.md)

In plain language:

> this repo's main story is still "shopping extension family under evidence
> gates," not "public plugin marketplace."

## Builder Lane Is Secondary

This is a **secondary** reading path, not the default repo identity.

If you are evaluating Shopflow as an open-source product repo rather than as an
agent-consumption packet source, read the product and verification docs above
first.

If you are here specifically for builder-facing packets, keep the root README
short and open the docs shelf instead:

1. [`docs/ecosystem/builder-start-here.md`](./docs/ecosystem/builder-start-here.md)
2. [`docs/ecosystem/integration-recipes.md`](./docs/ecosystem/integration-recipes.md)
3. [`docs/ecosystem/agent-quickstarts.md`](./docs/ecosystem/agent-quickstarts.md)

Shopflow is not a generic AI assistant, but it does expose truthful
builder-facing surfaces today:

- typed contracts plus explicit readiness / claim-boundary truth
- read-only builder snapshots, workflow briefs, and reviewer artifacts
- a repo-local read-only CLI plus builder docs and example packets in the docs shelf

Target-specific quickstarts, example JSON, and ecosystem-specific packets stay
in the docs shelf, not the root README. These surfaces are real today, but
they are **not** proof that Shopflow already ships a public API, public MCP,
official marketplace listing, or SDK.

## Vision Upgrade Matrix

The stronger product vision for Shopflow is now split into five honest buckets.

### Today

- a Chrome-first shopping extension family with `8+1` app shells
- typed contracts, runtime truth, and builder-facing read models
- English-first public wording
- AI in the real operator flow through workflow decision briefs and workflow-copilot briefs

### Current-scope now

- API substrate first through stable schemas, read models, examples, and builder docs
- product UI stays English-default with `zh-CN` support through shared locale catalogs
- systematic i18n: new user-visible strings must route through locale catalogs instead of scattered bilingual literals
- public distribution execution for builder-facing ecosystems through starter bundles, sample config, install docs, proof loops, and truthful metadata packets
- builder-facing copy can point to strong-fit ecosystems, but official-listing language stays conditional on real external surfaces
- front-door, plug-and-play, review UX, discoverability, and SEO hardening for those public-distribution paths

### Deferred by owner

- public read-only MCP transport
- public read-only API transport
- generated client or thin SDK
- hosted runtime product
- homepage migration
- custom domain / trademark / `.ai` landing
- release publish and social preview work

### No-go

- write-capable MCP
- hosted shopping SaaS control plane
- generic autonomous shopping assistant
- public wording that outruns reviewed live evidence

### Surface-dependent publication boundary

- use the official public surface when the target ecosystem actually has one
- otherwise use the strongest truthful public distribution surface that exists today
- do not turn a package, listing draft, skills catalog, or metadata payload into an official-listing claim by wording alone

See [`docs/ecosystem/agent-and-mcp-positioning.md`](./docs/ecosystem/agent-and-mcp-positioning.md)
and [`docs/ecosystem/integration-surface-roadmap.md`](./docs/ecosystem/integration-surface-roadmap.md)
for the detailed matrix.

## Current Status

Current repo state is **all `8+1` app shells materialized, with Wave 1 + Wave 2 repo-verified, Wave 3 Kroger/Weee now repo-verified, and a Suite internal alpha shell in place**.

What is already in place at the contract and policy layer:

- repo topology decisions
- release-wave decisions
- store adapter contract
- capability priority matrix
- verification bar
- migration runbook
- live receipt capture runbook
- UI surface specification
- MVP delivery blueprint
- branding rules
- dependency and reuse policy

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

Reviewable CI artifacts now exist for every app shell, but they are still not the same thing as a public release package.

The repo can now also write live browser preflight/diagnose/probe artifacts
under `.runtime-cache/live-browser/`, but those artifacts are still not the
reviewed live evidence bundle itself.

The repo can also turn explicit reviewer decisions into schema-valid
`reviewed` / `rejected` records, but that helper still requires an explicit
review input file and does not auto-upgrade action-heavy captures without
action counts.

The repo can also prebuild that review-input file as a safe pending template,
so the remaining human step is closer to “fill in the checklist” than “invent
the JSON from scratch.”

The shortest live-review helper commands are now:

- `pnpm operator-capture-packet:live`
- `pnpm review-candidate-records:live`
- `pnpm review-input-template:live`
- `pnpm reviewed-records:live -- --review-input <path>`

If you are new to Shopflow and need the shortest accurate builder entrypoint, start with [docs/README.md](./docs/README.md).

If you need one strongest repo-owned answer for release readiness, run the lane
serially:

```bash
pnpm verify:release-readiness
```

Why this matters:

- both `pnpm test` and `pnpm package:artifacts` rewrite per-app `.output/`
  directories
- parallel runs can create false-red `ENOENT` noise while one process rebuilds
  files another process is trying to inspect
- the serial lane is the honest repo-owned verification path

## Repo Hygiene Gates

Shopflow now wires three local mechanical gates at the repo root:

- `pre-commit`
  - runs `pnpm verify:local-hygiene`
  - also blocks secrets, personal email addresses, user-specific absolute paths, and committed log/db/key artifacts before they can land
- `pre-push`
  - runs `pnpm hooks:pre-push`
  - currently points at `pnpm verify:release-readiness`, so push-time verification uses the same strongest serial lane as release-readiness closeout
- `commitlint`
  - enforces `feat / fix / refactor / docs / test / chore`
- `verify:sensitive-surfaces`
  - scans tracked plus non-ignored worktree files for sensitive residue such as keys, user-specific absolute paths, personal emails, and blocked artifact paths
- `verify:sensitive-history`
  - scans reachable Git history for the same sensitive classes before the serial release-readiness lane can pass
- `verify:sensitive-public-surface`
  - scans the GitHub-hosted public fallback repos plus their issue / PR / release text surfaces for the same sensitive residue
- `verify:github-platform-security`
  - checks whether GitHub-native security surfaces such as code scanning, secret scanning, Dependabot alerts, and vulnerability alerts are enabled
  - if a feature is enabled, open alerts must be zero
  - if a feature is disabled, the result is recorded as a platform capability gap instead of being mislabeled as a code failure
- `verify:coverage`
  - blocks coverage regressions below the current repo baseline while the team works toward a higher global bar
- `verify:release-readiness`
  - runs local hygiene, sensitive-history, full repo test, and review-bundle packaging in one serial lane
  - use this when you need one honest answer for `can this repo currently verify and package cleanly?`

Additional GitHub workflows now cover:

- `actionlint`
- `zizmor`
- `gitleaks`
- `trufflehog`
- `trivy`
- `dependency-review`
- `codeql`

Important boundary:

> repo-owned scanners should fail on real repo findings.
> GitHub-native security features should only fail when they are enabled and actually report open alerts.
> A disabled platform feature is a platform gap, not proof that the code failed.

If a leak has already escaped to a public surface that cannot be cleaned with a
simple tip-only edit, follow the
[`Sensitive Surface Incident Response Runbook`](./docs/runbooks/sensitive-surface-incident-response.md).

If final closeout must choose between in-place cleanup and a clean-room
cutover, follow the
[`Final Closeout and Hard-Cut Runbook`](./docs/runbooks/final-closeout-and-hard-cut.md).

## Cache, Profile, and Disk Governance

Shopflow now keeps its cache story in **two owned zones**, not one blurry pile.

In plain language:

> repo-local residue lives under `.runtime-cache/**`, and repo-external but
> still Shopflow-owned cache lives under `~/.cache/shopflow/**`.
> Shared machine storage is a different room and is not ours to auto-clean.

### Repo-local cache family

These are the only repo-internal cache roots:

- `.runtime-cache/builder/`
- `.runtime-cache/cli/`
- `.runtime-cache/coverage/`
- `.runtime-cache/live-browser/`
- `.runtime-cache/temp/`
- `.runtime-cache/e2e-browser/`
- `.runtime-cache/release-artifacts/`

Related disposable build/test outputs still stay repo-local:

- `apps/*/.output/`
- `apps/*/.wxt/`
- `coverage/`
- `test-results/`
- `playwright-report/`

### Shopflow-owned external cache family

These are the only canonical repo-external cache roots:

- `~/.cache/shopflow/pnpm-store`
- `~/.cache/shopflow/ms-playwright`
- `~/.cache/shopflow/webkit-playwright`
- `~/.cache/shopflow/tmp`

Default policy:

- `SHOPFLOW_CACHE_DIR=~/.cache/shopflow`
- `SHOPFLOW_CACHE_TTL_DAYS=3`
- `SHOPFLOW_CACHE_MAX_BYTES=2147483648`

Shopflow now auto-prunes its own external cache before cache-producing local
commands:

1. delete stale Shopflow cache entries older than `3` days
2. then trim the remaining Shopflow cache entries by LRU until the total stays
   under `2 GB`

That policy applies only to the **disposable** cache lanes under
`~/.cache/shopflow/{pnpm-store,ms-playwright,webkit-playwright,tmp}`.
It does **not** auto-prune the dedicated browser root under
`~/.cache/shopflow/browser/chrome-user-data/`.

### Canonical live Chrome root

Local live/dev/browser work now defaults to a **dedicated Shopflow Chrome root**
instead of borrowing the default Chrome root:

- user data dir: `~/.cache/shopflow/browser/chrome-user-data`
- profile directory: `Profile 1`
- profile name: `shopflow`

This is still environment-configured through:

- `SHOPFLOW_LIVE_USER_DATA_DIR`
- `SHOPFLOW_LIVE_PROFILE_DIRECTORY`
- `SHOPFLOW_LIVE_PROFILE_NAME`
- `SHOPFLOW_LIVE_CHROME_EXECUTABLE`

Important boundary:

- first-time setup now starts with `pnpm browser:seed-profile`
- live/dev/browser lanes use the dedicated Shopflow Chrome root
- that dedicated browser root is persistent state, not disposable cache
- smoke/E2E/CI stay on isolated browsers and repo-local temp profiles

### Operator commands

```bash
pnpm browser:seed-profile
pnpm close:live-browser
pnpm audit:disk-footprint
pnpm audit:disk-footprint --json
pnpm cleanup:runtime-cache
pnpm cleanup:runtime-cache --apply
pnpm cleanup:build-output
pnpm cleanup:build-output --apply
pnpm cleanup:release-artifacts
pnpm cleanup:release-artifacts --apply
pnpm cleanup:external-cache
pnpm cleanup:external-cache --apply
pnpm cleanup:docker
pnpm cleanup:docker --apply
```

### Shared and machine-wide boundaries

Shopflow does **not** auto-clean:

- the dedicated browser root at `~/.cache/shopflow/browser/chrome-user-data/**`
- the backup root at `~/.cache/shopflow/browser/backups/**`
- the default Chrome root at `~/Library/Application Support/Google/Chrome/**`
- `~/Library/Containers/com.docker.docker/**`
- non-Shopflow `~/.cache/**`
- repo-local MCP/tool state such as `.serena/**`
- shared tool caches owned by other repos
- Docker resources without the Shopflow label

`pnpm store path` is now expected to resolve to
`~/.cache/shopflow/pnpm-store`, while `node_modules/` remains the repo-local
dependency truth for this workspace.

CI stays GitHub Hosted Runner only:

- standard CI lane: `ubuntu-latest`
- not allowed as repo standard CI: local `self-hosted` runner drift

If you need the full boundary contract, read
[`docs/runbooks/disk-footprint-governance.md`](./docs/runbooks/disk-footprint-governance.md).

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
7. `docs/vendor/`
8. root docs

Do not use prior chats or assumptions as runtime truth.

## Document Map

Start with the docs front door if you want the shortest guided map:

- [Docs Front Door](./docs/README.md)

### ADRs

- [ADR-001: Shopflow Repo Topology and Product Boundary](./docs/adr/ADR-001-shopflow-repo-topology-and-product-boundary.md)
- [ADR-002: Release Wave and Product Tiering](./docs/adr/ADR-002-release-wave-and-product-tiering.md)
- [ADR-003: Builder Integration Surface and Product Language Boundary](./docs/adr/ADR-003-builder-integration-surface-and-product-language-boundary.md)

### Contracts

- [Store Adapter Contract](./docs/contracts/store-adapter-contract.md)
- [Store Capability Priority Matrix](./docs/contracts/store-capability-priority-matrix.md)
- [Testing and Verification Bar](./docs/contracts/testing-and-verification-bar.md)

### Runbook

- [Legacy Metadata Migration Runbook](./docs/runbooks/legacy-metadata-migration.md)
- [Live Receipt Capture Runbook](./docs/runbooks/live-receipt-capture.md)
- [Release Artifact Review Runbook](./docs/runbooks/release-artifact-review.md)
- [Final Closeout and Hard-Cut Runbook](./docs/runbooks/final-closeout-and-hard-cut.md)

### UI

- [Shopflow Product Surface Spec](./docs/ui/shopflow-product-surface-spec.md)

### Blueprint

- [Shopflow MVP Delivery Plan](./docs/blueprints/mvp-delivery-plan.md)

### Branding

- [Shopflow Brand and Claim Boundary](./docs/branding/shopflow-brand-and-claim-boundary.md)

### Vendor / Reuse Policy

- [Dependency and Reuse Policy](./docs/vendor/dependency-and-reuse-policy.md)

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
