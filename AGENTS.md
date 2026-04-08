# AGENTS.md

This file is the local collaboration constitution for the Shopflow repository.

## 0. Repo Identity

Shopflow is a **new, independent, Chrome-first shopping extension repository**.

It is not:

- a continuation of Terry_Tampermonkey
- a general scripts factory
- a mixed-product workspace

Shopflow exists to build one product family only:

- `8` Store apps
- `1` Suite app
- one shared engineering source of truth

The formal umbrella brand is:

- `Shopflow`

The formal repository name is:

- `shopflow-suite`

## 1. Current Truth

Current repo state is **all `8+1` app shells materialized, with Wave 1 + Wave 2 repo-verified, Wave 3 Kroger/Weee now repo-verified, and a Suite internal alpha shell in place**.

What exists today:

- `.git/`
- `docs/`
- root workspace files
- Wave 1 `apps/*` scaffolding
- Wave 2 `apps/*` scaffolding for `ext-costco`, `ext-walmart`, and `ext-temu`
- Wave 3 `apps/*` materialization for `ext-kroger` and `ext-weee`
- `ext-shopping-suite` internal-only alpha shell scaffolding
- shared `packages/*` scaffolding
- Wave 1 + Wave 2 store package scaffolding for shipped waves
- Wave 3 `packages/store-kroger` and `packages/store-weee` materialization
- contract, integration, and E2E verification scaffolding
- repo-owned live-receipt evidence harness foundations
- live-receipt workflow states that distinguish missing, in-progress, captured, reviewed, rejected, and expired evidence
- live-receipt workflow transition guards and operator-packet semantics that keep `captured` distinct from `reviewed`
- CI review artifact packaging for all `8+1` apps, with `internal-alpha` and store-review bundles kept separate
- readable parity, review-manifest, and packaging-completeness guards in repo-owned verification and release tooling
- repo-owned sensitive-surface guards that now fail verification when the worktree or reachable Git history still carries secrets, personal email addresses, user-specific absolute paths, or committed log/db/key residue
- CI now publishes the repo-owned submission-readiness report as a review artifact, not just the raw release manifest
- CI now uses the same serial `verify:release-readiness` lane as local verification instead of maintaining a parallel release-readiness command chain
- Shopflow now separates commit-time hygiene, push-time fast verification, hosted release-readiness, nightly external-governance checks, and manual live/signing lanes instead of forcing every layer through the same gate
- Shopflow now carries a thin provider-runtime consumer snapshot plus an internal-alpha Suite handoff surface that can turn a real Switchyard base URL into explicit acquisition routes without pretending Shopflow already owns that runtime
- representative store capability maturity improvements for Albertsons / Temu plus stricter adapter causality on Kroger / Weee
- deeper Wave 3 DOM-variant coverage for Kroger family product/deal cards and Weee product pages
- shared Side Panel, Popup, and Suite internal alpha surfaces with clearer readiness, claim-boundary, operator-next-step, and routing guidance
- app-scoped recent activity recording that now feeds lightweight live operator context into shared surfaces
- shared Side Panel and Popup now expose direct jump-back links when recent activity already knows the latest source page
- Suite internal alpha drill-down that now shows per-app latest detection, recent activity, and evidence queue summaries from shared storage
- Suite evidence queue now groups items by triage state instead of flattening every evidence item into one undifferentiated list
- repo-owned submission-readiness reporting now explains which apps are internal-alpha-only, claim-gated, or still waiting on external signing/submission conditions
- reusable contract-fixture testkit support for simple storefront-shell contract tests
- a serial root release-readiness entrypoint that runs hygiene, test, and review-bundle packaging in one trustworthy lane
- architecture, contract, runbook, blueprint, branding, and dependency policy documents

What does **not** exist yet:

- live receipt evidence bundles
- store-ready signed extension release artifacts

Current repo truth now includes repo-verified adapter coverage for each app's
current MVP focus within today's verified scope. That is still not the same
thing as reviewed live evidence or public-claim-ready support.

This means:

> Do not describe planned structures as already implemented structures.

Blueprints and ADRs remain contract truth. Existing scaffolds, routed-fixture smoke, repo verification, and the Suite internal alpha shell are not proof that a capability is publicly claim-ready.

### Public Repo Topology

Current public repo roles are:

- canonical repo and default front door:
  `xiaojiou176-open/shopflow-suite`
- canonical OpenClaw install subdir:
  `xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin`

Boundary rules:

- `shopflow-suite` is the only canonical Shopflow repo
- canonical OpenClaw installs should use
  `xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin`
- no deleted side repo should remain in live-facing docs, examples, or packet
  boundary notes as an active route

## 2. Truth Order

When files disagree, use this authority order:

1. `docs/adr/`
2. `docs/contracts/`
3. `docs/runbooks/`
4. `docs/ui/`
5. `docs/blueprints/`
6. `docs/branding/`
7. `docs/vendor/`
8. root `README.md`
9. root `CHANGELOG.md`

Conversation memory, chat summaries, and assumptions are not source of truth.

## 2.1 Host Safety Contract

- `worker-safe` is the default mode for this repository.
- Broad host cleanup is forbidden: no `killall`, no `pkill`, no `killpg(...)`, no negative/zero PID signals, no `loginwindow` / Force Quit APIs, and no pattern-scoped force-kill.
- Live-browser teardown must stay on exact repo-owned records such as a recorded PID, recorded user-data-dir, recorded profile directory, and recorded CDP URL.
- Read-only AppleScript inspection may exist for operator diagnostics, but any focus/input/quit path or `System Events` app-control must fail closed unless the repo has an explicit operator-manual contract for that action.
- Detached browser launch is review-required only; any `detached: true` + `.unref()` path must stay inside a repo-owned browser root and may not pair with broad cleanup.

## 3. Product Boundary

Shopflow owns the shopping line only.

In scope:

- product extraction
- search result extraction
- deal extraction
- supported shopping actions
- shopping-oriented extension UX
- the Shopflow Suite shell

Out of scope:

- forum or reader tooling
- AI export tooling
- unrelated account utilities
- preserving Tampermonkey-specific runtime assumptions as future product truth

## 4. Fixed Product Shape

Canonical app set:

- `ext-albertsons`
- `ext-kroger`
- `ext-amazon`
- `ext-costco`
- `ext-walmart`
- `ext-weee`
- `ext-target`
- `ext-temu`
- `ext-shopping-suite`

Canonical shared packages:

- `packages/contracts`
- `packages/core`
- `packages/runtime`
- `packages/ui`
- `packages/testkit`

Canonical store packages:

- `packages/store-albertsons`
- `packages/store-kroger`
- `packages/store-amazon`
- `packages/store-costco`
- `packages/store-walmart`
- `packages/store-weee`
- `packages/store-target`
- `packages/store-temu`

## 5. Hard Engineering Rules

1. `apps/*` must not import each other
2. shared logic flows through `packages/*` only
3. `packages/ui` must not import `packages/store-*`
4. `packages/contracts` must remain runtime-free
5. `packages/store-*` must remain UI-free
6. `ext-shopping-suite` is a composition shell, not a second logic plane
7. Terry legacy metadata is migration input only, never hidden runtime SSOT

## 6. Release and Verification Rules

Canonical release waves:

- `Wave 1`: `ext-albertsons`, `ext-amazon`, `ext-target`
- `Wave 2`: `ext-costco`, `ext-walmart`, `ext-temu`
- `Wave 3`: `ext-kroger`, `ext-weee`, `ext-shopping-suite`

Wave ordering means release sequence only. It does not remove anything from final scope.

Verification law:

> No fresh evidence, no support claim.

Required concepts:

- `fixture-ready`
- `repo-verified`
- `public-claim-ready`

`Capability-heavy Product` apps must not be treated as publicly launchable without the required live-receipt evidence.

## 6.1 Live Browser Resource Guardrail

When a task touches real browser/session/login-state work:

1. treat **one or two targeted live checks** as enough to decide whether the
   canonical Shopflow browser profile actually carries the required login state
2. if the canonical profile still lacks the real login/session after those
   checks, classify that gap as a blocker instead of opening more and more
   browser instances
3. prefer `preflight:live`, `diagnose:live`, `probe:live`, and existing-session
   inspection before attempting `open:live-browser`
4. prefer `close:live-browser` over raw host-level kills when shutting down the
   dedicated Shopflow singleton
5. do not inspect arbitrary host Chrome tabs outside the recorded Shopflow
   singleton / dedicated CDP lane just to guess whether merchant pages are open
6. only send `SIGTERM` / `SIGKILL` to a recorded Shopflow singleton pid after
   re-verifying the executable path, user-data-dir, profile directory, and
   remote-debugging port against the current process table
7. default the canonical live profile to:
   - user data dir `~/.cache/shopflow/browser/chrome-user-data`
   - profile directory `Profile 1`
   - profile name `shopflow`
   while still allowing the existing `SHOPFLOW_LIVE_*` env contract to override
8. seed that dedicated browser root once through `pnpm browser:seed-profile`
   instead of continuing to share the default Chrome root
9. once the dedicated root is healthy, reuse or relaunch that same root instead
   of reseeding it on every reopen; replacing the dedicated root should be an
   explicit action, not the default reopen path
10. use `safeway-home` as the Safeway session-health target before concluding
   that `cart/manage` failures mean the session is truly gone
11. distinguish `login_required` from `deep_link_unstable` so Safeway deep-link
   drift is not automatically overclaimed as a lost session
12. keep smoke/E2E/CI on isolated browsers instead of the real Chrome profile
13. avoid stealing focus when opening browser pages whenever the host/browser API
   allows a less disruptive path
14. if the machine already has **more than 6 browser main processes**, wait for
   other workers to release resources before launching another debug browser
   instance

In plain language:

> confirm the missing login state, record the blocker, and stop drilling once
> the answer is clear.

## 6.2 Multi-Repo Resource Hygiene

When Shopflow work touches browser, profile, port, Docker, cache, or disk
resources:

1. distinguish Shopflow-owned resources from other repos' resources before any
   launch, cleanup, or reuse decision
2. do not reuse or clean another repo's browser profile, CDP listener, tabs,
   Docker container, or cache just because it is visible on the same machine
3. clean Shopflow's own disposable residue after verification:
   - repo-local temp browser profiles
   - stale runtime-cache logs
   - rebuildable builder / CLI payloads
   - `.output` / `.wxt` / coverage / test-results
   - Shopflow-owned external cache under `~/.cache/shopflow/**`
4. keep the minimum artifacts still needed for evidence:
   - release artifacts
   - latest live-browser aliases
   - the newest retained trace bundles
5. keep Shopflow cache ownership on two rails only:
   - repo-internal cache under `.runtime-cache/**`
   - repo-external but Shopflow-owned cache under `~/.cache/shopflow/**`
6. apply the Shopflow external cache policy consistently:
   - TTL: `3` days
   - cap: `2 GB`
   - prune stale entries first, then trim by LRU
7. keep the dedicated browser root under
   `~/.cache/shopflow/browser/chrome-user-data/**` as persistent state:
   - do not include it in TTL/cap auto-pruning
   - do not include it in `cleanup:external-cache`
8. treat machine-wide caches, shared pnpm stores outside
   `~/.cache/shopflow/**`, the default Chrome root, and unrelated Docker
   containers as out-of-scope
9. if Docker is used for Shopflow in the future, require the Shopflow label
   `com.shopflow.repo=shopflow-suite` before cleanup is allowed
10. keep standard CI on GitHub Hosted Runner (`ubuntu-latest`) and do not drift
   into local `self-hosted` runner as the repo's default CI story

In plain language:

> clean Shopflow's desk, not the whole office.

## 6.3 Git and GitHub Final Closeout Discipline

Whole-program closeout cannot be declared until Git state is explicit.

Required checks:

1. list local branches, worktrees, and PR state
2. confirm whether `main` is the only active long-lived line
3. merge or close repo-owned work cleanly into `main`
4. avoid destructive history edits
5. do not leave stale repo-owned branches, worktrees, or pending PR state
   behind when the work is actually done

In plain language:

> if the work matters, it must land on the real mainline instead of living as
> ghost residue in side branches or extra worktrees.

## 6.4 External-Account Write Boundary

Shopflow agents may read, diagnose, and prepare packets for external systems,
but must not perform write actions on external accounts unless that exact write
surface is explicitly authorized for the current run.

This means:

- allowed by default:
  - read
  - inspect
  - diagnose
  - produce operator checklists
  - produce unblock packets
- not allowed by default:
  - merchant account mutations
  - store-console submission clicks
  - third-party platform publishing
  - production service configuration writes

Git / GitHub collaboration for this repo may be explicitly authorized in a
given run. That exception does **not** extend to merchant sites, store
consoles, or other third-party accounts.

## 6.5 Platform Security Capability Truth

GitHub-native security features must be reported honestly.

This includes:

- code scanning
- secret scanning
- Dependabot alerts
- vulnerability alerts

Rules:

1. if the feature is enabled, zero open alerts is required for a clean verdict
2. if the feature is disabled, that is a platform capability gap, not a code failure
3. disabled platform features do **not** erase repo-owned duties such as
   `verify:sensitive-history` or `verify:sensitive-public-surface`

In plain language:

> do not say "the repo failed" when the real problem is "the building has not
> installed that alarm system yet."

## 6.6 Hard-Cut Route Is First-Class

`history rewrite + new canonical repo hard cut` is a primary route for Shopflow,
not a backup-only idea.

Prefer hard cut when:

- reachable history still carries real sensitive residue
- old public or cached surfaces still make the old repo untrustworthy
- the current canonical history is too messy to remain the long-lived entry
- a clean linear history is safer than patching the old canonical line in place

If hard cut wins:

1. protect the current tree first
2. rebuild clean history offline
3. create the new canonical repo
4. cut over all required settings and public references
5. retire the old canonical entry

Do not stop halfway through rename-only or rewrite-only partial states.

## 7. Brand and Claim Rules

Public naming must stay consistent with the branding contract.

Approved public names:

- `Shopflow for Albertsons Family`
- `Shopflow for Kroger Family`
- `Shopflow for Amazon`
- `Shopflow for Costco`
- `Shopflow for Walmart`
- `Shopflow for Weee`
- `Shopflow for Target`
- `Shopflow for Temu`
- `Shopflow Suite`

Family apps must keep explicit verified-scope wording:

- `Albertsons Family` → currently verified on `Safeway`
- `Kroger Family` → currently verified on `Fred Meyer + QFC`

Never present family-wide support as already verified unless evidence says so.

## 8. Documentation Sync Triggers

Update docs in the same change set whenever any of these change:

- repo topology
- app list
- wave ordering
- package boundaries
- adapter contract
- public claim scope
- verification bar
- dependency policy
- UI surface ownership

Minimum companion updates:

1. `README.md`
2. `AGENTS.md`
3. `CHANGELOG.md`

## 9. Agent Working Style

Default assumption:

- downstream agents may have zero prior context

Therefore all work should:

- cite the controlling document
- keep file ownership explicit
- avoid hidden assumptions
- avoid dual truth
- avoid claiming implementation exists when only design exists

If a change introduces a blocker or contract conflict, stop and resolve the contract instead of improvising around it.
