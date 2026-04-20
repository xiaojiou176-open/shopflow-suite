# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog.

## [Unreleased]

## [0.1.3] - 2026-04-19

### Fixed

- refreshed the public release shelf again so the latest GitHub release now
  includes the post-PR-69 mainline instead of stopping one commit behind.
- aligned the repo/public version chain to `0.1.3` across workspace packages,
  the public manifest, MCP server metadata, and the OpenClaw packet version
  surfaces.
- corrected the public OpenHands receipt wording from a stale
  review-pending/live-ish reading to a closed historical receipt that does not
  imply a live OpenHands listing.

## [0.1.2] - 2026-04-19

### Fixed

- refreshed the public release shelf to a new current-mainline tag so the
  latest GitHub release no longer stops at the pre-PR-68 snapshot.
- aligned the repo/public version chain to `0.1.2` across workspace packages,
  the public manifest, MCP server metadata, and the OpenClaw packet version
  surfaces.
- carried the hardened popup/sidepanel/suite review-surface contract and native
  Chrome review tooling into the release shelf snapshot instead of leaving them
  as post-release-only mainline changes.

## [0.1.1] - 2026-04-19

### Fixed

- restored the sync-ready public packet mirrors so packet metadata and
  troubleshooting now point at the canonical public `.md` sources instead of
  stale `.ready.md` paths.
- OpenClaw packet troubleshooting now re-checks the canonical
  `docs/ecosystem/public-distribution-bundle.md` path instead of the old
  nonexistent `docs/ecosystem/examples/*.ready.md` location.
- public repo topology wording now treats
  `xiaojiou176-open/shopflow-suite` as the only canonical repo, demotes
  `xiaojiou176/shopflow-public-packets` to a secondary fallback mirror and
  deprecated candidate, and rewrites the OpenClaw lane around the already-live
  `xiaojiou176/shopflow-openclaw-plugin` fallback shell instead of leaving
  future-scaffold wording alive.
- OpenClaw install guidance now moves the canonical `customPlugins` route into
  `xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin`, while the
  standalone `xiaojiou176/shopflow-openclaw-plugin` repo is treated as an
  archived legacy fallback for older pins only.
- GitHub Actions no longer mislabel disabled GitHub-native security features as
  code failures; the platform security check now records capability gaps
  truthfully while still failing when enabled features carry real open alerts.
- transitive `defu` usage is now pinned to `6.1.6` through a root `pnpm`
  override so the known prototype-pollution advisory no longer blocks
  open-source readiness on the current dependency tree.
- checked-in builder outcome examples no longer embed user-specific absolute
  filesystem paths; payload source pointers are now repo-relative instead of
  leaking one machine's local runtime directory layout.
- Target search fixtures and live/browser maintenance tests now use
  de-identified placeholder values for API-key-like fields, profile names, and
  home/cache roots instead of shipping personal or production-looking residue.
- the closeout tree now treats stale task-board baselines and optimistic
  external-only wording as drift to be corrected instead of as final truth.
- the remaining visible OpenClaw front-door labels now say
  `OpenClaw Public-Ready Packet` instead of leaving the old
  `Comparison Packet` wording alive after the 4/6 uplift.
- builder-facing public-distribution wording now says
  `starter bundle / listing payload / distribution packet` where the repo
  already ships bundle-level current-scope surfaces, instead of underselling
  them as `metadata skeletons` or generic `preparation`.
- live/browser defaults now point at the dedicated Shopflow Chrome root under
  `~/.cache/shopflow/browser/chrome-user-data`, and the canonical singleton
  profile is now `Profile 1 / shopflow` instead of the old default Chrome root
  `Profile 19 / ShopFlow` model.
- Shopflow live/browser helpers now keep a repo-owned singleton instance record
  and no longer treat default-root Chrome tabs as acceptable canonical live
  fallback.
- local runtime/cache governance now keeps Shopflow-owned external cache under
  `~/.cache/shopflow/**` instead of letting pnpm drift into another repo's
  shared-runner namespace, and `pnpm store path` now resolves to the Shopflow
  cache root via repo-local config.
- live/dev browser defaults now point at the dedicated Shopflow Chrome root
  (`~/.cache/shopflow/browser/chrome-user-data`, `Profile 1 / shopflow`) while
  smoke/E2E/CI remain isolated.
- `pnpm cli:read-only -- outcome-bundle` no longer backfills
  `.runtime-cache/builder/*` as a hidden side effect; the read-only path now
  reuses existing generated payloads or checked-in examples, and coverage now
  locks that no-write contract in place.
- `pnpm verify:coverage` now runs Vitest coverage inside a unique
  repo-local scratch directory and only swaps the result back into
  `.runtime-cache/coverage/` after the run completes, which removes the
  intermittent `.tmp` lifecycle races that could block commit-hook closeout
  even after coverage itself had succeeded.
- `pnpm cli:read-only -- plugin-marketplace-metadata --target <target>` now
  reports the supported targets directly, and `pnpm cli:read-only --help` now
  keeps the command/target/export boundary visible from the terminal instead of
  forcing users back into prose docs first.
- release artifact staging now waits longer for freshly zipped outputs to appear
  on disk, reducing transient false-red package race failures in the serial
  release-readiness lane.
- `pnpm open:live-browser` now reports the current browser main-process PID
  set plus the subsets already matching the requested Shopflow user-data-dir
  and requested debugging port when the browser-budget guard refuses a new
  debug launch.
- `pnpm exec tsx tooling/live/write-operator-capture-packet.ts` now turns the
  latest `diagnose/probe/trace` artifacts into one operator packet that says
  which capture IDs are already `capture-ready` and which are still blocked.
- `pnpm exec tsx tooling/live/write-review-candidate-records.ts` now turns the
  latest operator packet into schema-valid `captured` review-candidate records
  while still keeping blocked capture IDs explicit.
- `pnpm exec tsx tooling/live/write-reviewed-records.ts -- --review-input <path>`
  now turns explicit reviewer decisions into schema-valid `reviewed` /
  `rejected` records while refusing to auto-upgrade undecided or action-heavy
  packets without the required review metadata.
- `pnpm exec tsx tooling/live/write-review-input-template.ts` now writes a safe
  pending review-input template from the latest captured review-candidate
  records, so the remaining human review step no longer has to handcraft the
  JSON from scratch.
- the live review helpers now also have short package-script entrypoints:
  `pnpm operator-capture-packet:live`,
  `pnpm review-candidate-records:live`,
  `pnpm review-input-template:live`,
  and `pnpm reviewed-records:live -- --review-input <path>`.
- live trace bundles now write a `screenshots.json` manifest, and the operator
  capture packet now prefers page URL/title matches from that manifest over
  fragile observed-tab index order when attaching screenshots to capture IDs.

### Added

- `pnpm verify:github-platform-security`, which reports whether GitHub-native
  code scanning, secret scanning, Dependabot alerts, and vulnerability alerts
  are enabled and whether enabled surfaces still carry open alerts.
- `pre-push` root hook wiring through `pnpm hooks:pre-push`, which points at
  the same serial `verify:release-readiness` lane used for closeout.
- `.pre-commit-config.yaml`, so the repo now has a standard auditable hook
  contract for `pre-commit`, `commit-msg`, and `pre-push` stages in addition to
  the existing simple-git-hooks runtime wiring.
- `.github/dependabot.yml` for npm and GitHub Actions update intake.
- dedicated workflow gates for:
  - `actionlint`
  - `zizmor`
  - `gitleaks`
  - `trufflehog`
  - `trivy`
  - `dependency-review`
  - `codeql` with truthful platform gating for private-repo capability gaps
- [Final Closeout and Hard-Cut Runbook](./docs/runbooks/final-closeout-and-hard-cut.md)
  defining no-code-loss anchoring, route selection, hard-cut minimums, and
  final verdict rules.
- root open-source governance files:
  - `LICENSE`
  - `SECURITY.md`
  - `CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`
  - `.env.example`
- `pnpm verify:sensitive-surfaces`, which scans tracked plus non-ignored
  worktree files for secrets, personal email addresses, user-specific absolute
  filesystem paths, and blocked log/db/key artifact paths.
- `pnpm verify:sensitive-history`, which scans reachable Git history for the
  same sensitive classes before the serial release-readiness lane can pass.
- `pnpm verify:sensitive-public-surface`, which scans the GitHub-hosted public
  fallback repos plus their issue / PR / release text surfaces for the same
  sensitive classes.
- root hygiene and CI gate wiring now route those sensitive-surface checks
  through `verify:local-hygiene`, `verify:release-readiness`, `pre-commit`,
  and the GitHub-hosted `verify` job with full history checkout.
- repo-owned sensitive-surface response guidance for public-surface cases that
  cannot be fixed by a simple tip-only edit.
- tracked public-distribution scaffolds under `distribution/`:
  - `distribution/public-packets/**` for the Codex / Claude Code / OpenClaw
    public fallback rack
  - `distribution/openclaw-plugin/**` for the OpenClaw `customPlugins`
    fallback scaffold
- `pnpm browser:seed-profile`, which:
  - verifies the default Chrome root is quiet
  - copies only `Local State` plus the legacy source profile into the dedicated
    Shopflow browser root
  - rewrites the target to `Profile 1 / shopflow`
  - removes copied `Singleton*` files
  - launches and records the Shopflow singleton Chrome instance
- `pnpm close:live-browser`, which closes the recorded Shopflow singleton
  through CDP first, falls back to `SIGTERM`, and only force-kills the
  recorded Shopflow PID as a last resort.
- live browser diagnostics and closeout now refuse host-wide Chrome tab
  inspection and will only signal a PID after re-verifying the recorded
  executable, profile, and debugging port against the current process table.
- Safeway session-health and deep-link drift diagnostics:
  - `safeway-home` is now the stable session-health target
  - `deep_link_unstable` now distinguishes a live Safeway session from a
    broken `cart/manage` deep link instead of overclaiming it as a hard login
    loss
- persistent browser-state governance under
  `~/.cache/shopflow/browser/chrome-user-data/**`, explicitly excluded from the
  external cache TTL / cap cleanup lane.
- cache-policy and cleanup commands for:
  - Shopflow-owned external cache under `~/.cache/shopflow/**`
  - automatic TTL/cap pruning before cache-producing local commands
  - Shopflow-labeled Docker dry-run / `--apply` cleanup
  - docs/test coverage that locks the Hosted Runner, cache boundary, and live
    profile contract to one story
- Target-specific agent handoff packets for `Codex`, `Claude Code`, and
  `OpenClaw`, including:
  - `packages/contracts/src/agent-integration-bundle.ts`
  - `tooling/cli/read-only.ts`
  - `tooling/builder/write-builder-example-rack.ts`
  - checked-in `agent-target-packet.*.json` examples
  - sharper front-door and quickstart routing toward the target-specific packet
- Builder-facing docs and examples now keep that target-specific packet visible
  beyond the quickstarts, including:
  - `docs/ecosystem/builder-start-here.md`
  - `docs/ecosystem/builder-read-models.md`
  - `docs/ecosystem/builder-surfaces.md`
  - `docs/ecosystem/integration-recipes.md`
  - `docs/ecosystem/public-distribution-bundle.md`
  - refreshed checked-in `builder-outcome-bundle.*.json` examples
- Agent-specific onboarding and metadata scaffolds:
  - `packages/contracts/src/agent-integration-bundle.ts`
  - `docs/ecosystem/agent-quickstarts.md`
  - `docs/ecosystem/agent-distribution-artifacts.md`
  - `docs/ecosystem/codex-quickstart.md`
  - `docs/ecosystem/claude-code-quickstart.md`
  - `docs/ecosystem/openclaw-comparison.md`
  - `pnpm cli:read-only -- agent-integration-bundle`
  - direct read-only commands for `public-mcp-capability-map`, `public-skills-catalog`, and `plugin-marketplace-metadata`
  - direct ready pages for `public-mcp-capability-map`, `public-skills-catalog`, and `plugin-marketplace-metadata`
  - checked-in JSON examples for `agent-integration-bundle`, `public-mcp-capability-map`, `public-skills-catalog`, and plugin metadata skeletons
- OpenCode and OpenHands target-packet discoverability sync:
  - `pnpm cli:read-only -- agent-target-packet --target opencode`
  - `pnpm cli:read-only -- agent-target-packet --target openhands`
  - checked-in `agent-target-packet.opencode.json`
  - checked-in `agent-target-packet.openhands.json`
  - refreshed docs front door, quickstarts, and agent-distribution artifact rack without promoting either ecosystem to front-door-primary or official-package status
- Builder integration and product-language contract:
  - `docs/adr/ADR-003-builder-integration-surface-and-product-language-boundary.md`
  - `docs/ecosystem/integration-surface-roadmap.md`
  - `packages/contracts/src/builder-integration-surface.ts`
- Minimal shell-level locale route toggle across popup / side panel / suite surfaces:
  - `packages/ui/src/runtime-surface.tsx`
  - `apps/ext-shopping-suite/entrypoints/popup/main.tsx`
  - `apps/ext-shopping-suite/entrypoints/sidepanel/main.tsx`
  - `apps/ext-shopping-suite/src/suite-alpha-page.tsx`
- Release review artifact tooling:
  - `tooling/release/write-review-artifact-manifest.ts`
  - `docs/runbooks/release-artifact-review.md`
  - `tests/integration/release-review-artifact-manifest.tooling.test.ts`
- Evidence/submission current-scope closeout card:
  - `docs/ecosystem/evidence-submission-current-scope-readiness.md`
- Contract-test reuse support:
  - `packages/testkit/src/contract-fixture.ts`
- Live receipt workflow semantics coverage:
  - `tests/unit/live-receipt-workflow-semantics.test.ts`
- Merchant live browser helper tooling:
  - `tooling/live/shared.ts`
  - `tooling/live/preflight.ts`
  - `tooling/live/diagnose.ts`
  - `tooling/live/probe.ts`
  - `tooling/live/open-live-browser.ts`
  - `tests/integration/live-browser.tooling.test.ts`
- Switchyard provider-runtime seam first slice:
  - `docs/adr/ADR-004-switchyard-provider-runtime-seam.md`
  - `packages/contracts/src/provider-runtime-seam.ts`
  - `packages/core/src/provider-runtime-bridge.ts`
  - `tests/unit/provider-runtime-bridge.test.ts`
- Repo-local read-only CLI prototype:
  - `tooling/cli/read-only.ts`
  - `tests/integration/read-only-cli.tooling.test.ts`
- Root collaboration entrypoints:
  - `AGENTS.md`
  - `README.md`
  - `CHANGELOG.md`
- Root implementation foundation:
  - `package.json`
  - `pnpm-workspace.yaml`
  - `tsconfig.json`
  - `wxt-env.d.ts`
  - `vitest.config.ts`
  - `playwright.config.ts`
  - `.gitignore`
  - `.github/workflows/ci.yml`
- Shared package scaffolding:
  - `packages/contracts`
  - `packages/core`
  - `packages/runtime`
  - `packages/ui`
  - `packages/testkit`
- Wave 1 store package scaffolding:
  - `packages/store-albertsons`
  - `packages/store-amazon`
  - `packages/store-target`
- Wave 1 extension scaffolding:
  - `apps/ext-albertsons`
  - `apps/ext-amazon`
  - `apps/ext-target`
- Test skeletons and fixtures:
  - `tests/fixtures`
  - `tests/unit`
  - `tests/contract`
  - `tests/integration`
  - `tests/e2e`
- Wave 2 store package materialization:
  - `packages/store-costco`
  - `packages/store-walmart`
  - `packages/store-temu`
- Wave 2 extension materialization:
  - `apps/ext-costco`
  - `apps/ext-walmart`
  - `apps/ext-temu`
- Suite internal alpha materialization:
  - `apps/ext-shopping-suite`
  - `tests/contract/store-suite.contract.test.ts`
  - `tests/e2e/ext-shopping-suite.smoke.spec.ts`
- Wave 3 materialization:
  - `apps/ext-kroger`
  - `apps/ext-weee`
  - `packages/store-kroger`
  - `packages/store-weee`
  - `tests/contract/store-kroger.contract.test.ts`
  - `tests/contract/store-weee.contract.test.ts`
  - `tests/e2e/ext-kroger.smoke.spec.ts`
  - `tests/e2e/ext-weee.smoke.spec.ts`
- Shared verification upgrades:
  - `build:wave2` workspace script
  - `build:suite-alpha` workspace script
  - generic `tests/e2e/support/extension-smoke.ts`
  - runtime evidence capture repository
  - `docs/runbooks/live-receipt-capture.md`
  - `tests/integration/legacy-metadata-cutover.test.ts`
- CI review artifact packaging now uploads one reviewable extension bundle per app shell, with `store-review` artifacts separated from the Suite `internal-alpha-review` bundle.
- Root hygiene gate wiring for `pre-commit`, `commitlint`, and coverage regression checks.
- Root serial release-readiness entrypoint:
  - `verify:release-readiness`
- Submission-readiness release tooling:
  - `tooling/release/write-submission-readiness-report.ts`
  - `tests/integration/submission-readiness-report.tooling.test.ts`
- Repo-local disk footprint governance tooling:
  - `tooling/maintenance/disk-artifacts.ts`
  - `tooling/maintenance/audit-disk-footprint.ts`
  - `tooling/maintenance/cleanup-disk-artifacts.ts`
  - `docs/runbooks/disk-footprint-governance.md`
  - `tests/unit/disk-artifacts.maintenance.test.ts`
  - `tests/integration/disk-footprint.tooling.test.ts`
  - `tests/integration/extension-smoke.temp-root.test.ts`
- Thin Switchyard consumer slice:
  - `packages/core/src/provider-runtime-consumer.ts`
  - `tooling/cli/read-only.ts`
  - `tests/unit/provider-runtime-bridge.test.ts`
  - `tests/integration/read-only-cli.tooling.test.ts`
- Public distribution bundle slice:
  - `packages/contracts/src/public-distribution-bundle.ts`
  - `docs/ecosystem/public-distribution-bundle.md`
  - `tooling/cli/read-only.ts`
  - `tests/integration/read-only-cli.tooling.test.ts`

### Changed

- README, docs front door, and agent quickstarts now expose a shorter
  Codex/Claude Code/OpenClaw routing table, checked-in JSON example links, and
  target-specific metadata/export examples so plugin/skills packet consumption
  is smoother without overclaiming publication.
- Front-door and ecosystem wording now separate `today / current-scope now / later / no-go / owner-decision` for builder-facing API / MCP / CLI / SDK paths instead of flattening everything into one future bucket.
- README and ready-to-sync public copy now stay English-first while describing workflow briefs, builder snapshots, and future API / MCP / CLI boundaries more precisely.
- Suite internal alpha now routes its expand/collapse status labels through the shared locale catalog instead of leaving those strings hardcoded in the page component.
- Verification enforcement now includes a catalog-driven parity gate wired into the root `test` path.
- Verification parity failures now report categorized reasons, including path, fixture, claim-boundary, packaging, and suite drift.
- Repo-local disk governance now keeps generated artifacts under auditable Shopflow-owned paths, adds dry-run cleanup commands, and moves extension smoke temp Chromium profiles under `.runtime-cache/e2e-browser/` instead of `os.tmpdir()`.
- Live browser process detection now keeps quoted Chrome launch paths intact when matching `--user-data-dir` and `--profile-directory`, so profile-alignment evidence stops truncating space-containing paths.
- Shopflow now carries one thin repo-local consumer of the Switchyard seam, which turns a real base URL into explicit acquisition routes without overclaiming a public runtime product.
- Suite internal alpha now consumes that same provider-runtime consumer snapshot through one read-only handoff section instead of leaving the Switchyard seam trapped in docs and CLI output.
- Shopflow now carries one repo-owned public distribution bundle that turns public API / MCP / skills / plugin-marketplace prep into a concrete ready-to-sync packet without pretending publication already happened.
- Release engineering now supports local `pnpm package:artifacts` packaging, zipped review bundles, and repo-owned artifact manifests.
- Review artifact generation now rejects `appId`, `packageName`, `reviewChannel`, `surface`, and bundle-directory drift against the verification catalog.
- Release artifact manifests now fail more readably when build directories, zip outputs, or required bundle files are missing.
- Release packaging now also emits a repo-owned submission-readiness report that keeps internal-alpha, claim-gated, and awaiting-signing states explicit.
- Submission-readiness reporting now includes a manual review start URL and a short per-app checklist for reviewer handoff.
- Submission-readiness reporting now surfaces when claim-gated apps have already cleared repo-owned reviewer handoff and only reviewed external live-evidence packets remain.
- CI now uploads the repo-owned submission-readiness report as a first-class artifact next to the release manifest.
- CI now uses the same serial `verify:release-readiness` lane as local verification instead of maintaining a parallel release-readiness command chain.
- Root docs now remove `production-ready adapter implementations` from the top-level active brake list after current MVP adapter coverage, repo verification, and latest `shopflow-ci` success aligned.
- Root collaboration truth now removes the stale `release-grade extension UX polish` brake from `AGENTS.md`, leaving only reviewed live evidence and signed-release packaging as remaining top-level brakes.
- Builder/evidence current-scope cards now reflect that git closeout is ready for the latest `main` baseline instead of carrying older Prompt 9/10-era closeout language.
- Builder tooling now keeps claim-gated route truth stable in clean-room runtime payload generation and example-rack refresh flows.
- CI now installs Playwright Chromium before `verify:release-readiness`, uploads staged review artifacts from `.runtime-cache/release-artifacts/apps/**`, and aligns the Albertsons review lane with its capability-heavy product surface.
- Live receipt runbook and front-door docs now explain the repo-owned merchant browser helper stack without overstating it as reviewed live evidence.
- Shopflow now carries an explicit Switchyard seam contract and thin acquisition-route builder without pretending the external provider runtime is already running inside Shopflow.
- Builder-facing docs and contracts now acknowledge a repo-local read-only CLI prototype without turning it into a public CLI commitment.
- Per-app review artifact manifests now record discovered zip outputs instead of only bundle metadata.
- Albertsons Schedule & Save readiness now distinguishes runnable pages from already-complete carts instead of flattening both into one degraded state.
- Temu warehouse filtering now distinguishes runnable, already-filtered, and local-only states without overstating public-ready support.
- Kroger and Weee export blocking now reflects selector, parse, and unsupported-page causes more honestly, with additional realistic search-card DOM variants covered in fixtures.
- Kroger family product/deal extraction and Weee product extraction now accept additional realistic DOM-card variants instead of overfitting to one fixture shape.
- Shared Side Panel, Popup, and Suite internal alpha surfaces now foreground readiness, claim boundary, operator next step, and routing guidance more clearly.
- Shared runtime surfaces now record and render lightweight app-scoped recent activity instead of leaving the operator feed empty until a future rewrite.
- Shared runtime surfaces now let operators jump back to the latest known source page from Recent Activity when the source URL is available.
- Store content scripts now record the freshest ready extracted output into shared runtime storage instead of leaving operator surfaces with readiness-only summaries.
- Shared Side Panel, Popup, and Suite internal alpha now surface the latest repo-owned extracted output preview so operators can inspect what was actually captured.
- Side Panel readiness summaries now turn operator-next-step guidance into a real route CTA when the next useful page is already known.
- Popup quick router now also exposes a direct jump back to the latest known source page when recent activity already recorded it.
- Popup routing now keeps latest source-page jump-back and latest captured-page resume paths distinct instead of collapsing both into one link.
- Suite internal alpha now exposes per-app drill-down for latest detection, recent activity, and evidence queue summary instead of a dead inspect CTA.
- Suite evidence queue now groups items into triage buckets so operators can scan capture, review, and reviewed states more quickly.
- Costco search extraction now reuses page-owned rewrite/typeahead wiring before JSON-LD or DOM-only fallbacks when the page exposes that truth source.
- Kroger product extraction now reuses page-owned product payloads before JSON-LD or family-safe PDP selectors.
- Amazon product extraction now promotes hidden ASIN carriers into canonical `/dp/<ASIN>` identity when JSON-LD is absent.
- Front-door docs now describe Shopflow as a contract-first shopping operator control plane, add a docs hub, and make current-scope vs later/no-go agent/MCP boundaries explicit.
- Browser-level extension smoke now runs serially so the verification gate measures repo behavior instead of multi-worker extension boot contention.
- Live receipt workflow semantics now enforce explicit transition guards so `capture-in-progress`, `captured`, `reviewed`, `rejected`, and `expired` cannot silently collapse into one another.
- Weee adapter realism now accepts alternate product/search DOM variants and reports unsupported/account pages more honestly.
- Root verification wiring now covers both `Wave 1` and `Wave 2` extension builds during E2E runs.
- Root verification wiring now builds the Suite internal alpha shell during E2E runs.
- Root verification wiring now builds `Wave 3` Kroger / Weee slices during E2E runs.
- Root verification now covers `9` browser-level smoke paths, including Kroger / Weee and the Suite internal alpha.
- Package-level `test` scripts now execute against the repo-root Vitest / Playwright entrypoints instead of relying on fragile relative invocation.
- Legacy metadata cutover is now guarded by an automated regression test that blocks runtime/app code from re-reading Terry metadata paths.
- Repo status documents now describe Wave 2 shells, Wave 3 Kroger/Weee repo verification, and the Suite internal alpha shell while keeping live-receipt and public-claim boundaries explicit.
- Live receipt prep now reuses a contracts-backed capture-plan schema instead of leaving the rule shape stranded in test-only helpers.
- Live receipt readiness now uses explicit review lifecycle states (`missing-live-receipt`, `capture-in-progress`, `captured`, `reviewed`, `rejected`, `expired`) instead of a single binary ledger label.
- CI review artifact generation now flows through repo-owned tooling instead of an inline workflow snippet.
- Wave 1, Wave 2, and materialized Wave 3 shells now record `repo-verified` truth without overstating `public-claim-ready` support.
- Suite rollout titles and waves now derive from shared contract truth instead of a handwritten parallel catalog.
- Root release engineering now produces reviewable CI artifacts without pretending that unsigned review bundles are public release packages.
- Docs front door and reviewer runbooks now spell out one deterministic reviewer/operator start order across `submission-readiness.json`, `shopflow-review-artifact.json`, review-start URLs, and external-only live-evidence follow-up.
- Kroger host matching now accepts family subdomain variants, and Temu search extraction now accepts alternate DOM selectors without weakening contract honesty.
- Root local workflow now enforces `verify:local-hygiene` before commit and validates conventional commit types through `commitlint`.
- Root `commit-msg` hook now quotes the commit message file path so local git closeout still works when the repo lives under a path with spaces.
- Root release verification guidance now formalizes serial `test -> package` execution to avoid false-red `.output` contention during local readiness checks.
- Release-grade shell surfaces now close the Prompt 12 UX/locale wave with route-based Suite action localization, stronger first-screen hierarchy, and claim-gated operator-next-step routing.
- Extension smoke support now retries service-worker cold start deterministically so the serial `verify:release-readiness` lane can finish without false-red extension boot races.

## [0.1.0] - 2026-03-29

### Added

- Initial Shopflow architecture and product-boundary baseline.
- Accepted repository topology decision for:
  - independent new repository
  - single Chrome-first monorepo
  - `8` Store apps plus `1` Suite app
- Accepted release-wave and product-tiering decision for:
  - `Wave 1`: Albertsons / Amazon / Target
  - `Wave 2`: Costco / Walmart / Temu
  - `Wave 3`: Kroger / Weee / Suite
- Accepted Store Adapter contract, including:
  - `matches`
  - `detect`
  - capability declaration
  - extractor boundaries
  - action receipt and error-code model
- Accepted shopping capability priority matrix for the current `25` shopping scripts.
- Accepted testing and verification bar, including:
  - fixture
  - contract
  - integration
  - E2E
  - live receipt gates
- Accepted migration runbook from Terry legacy shopping metadata into Shopflow source of truth.
- Accepted Shopflow product surface specification for:
  - Side Panel
  - Popup
  - Content UI
  - Options
  - Side Panel home information architecture
- Accepted Shopflow MVP delivery blueprint covering:
  - first three apps
  - wave sequencing
  - agent split plan
  - DoD levels
- Accepted branding and public-claim boundary rules for the Shopflow product family.
- Accepted dependency and reuse policy for:
  - framework dependencies
  - vendored UI code
  - reference-only sample repositories
