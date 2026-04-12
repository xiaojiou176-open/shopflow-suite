# Tooling

Local helpers, generation scripts, and verification utilities live here.

Current release helper:

- `tooling/release/write-artifact-manifest.ts`
  - writes `.runtime-cache/release-artifacts/manifest.json`
  - verifies that packaged zip outputs exist when called with `--require-outputs`
- `tooling/release/write-review-artifact-manifest.ts`
  - writes `shopflow-review-artifact.json` next to a built extension bundle
  - keeps CI review artifact labeling consistent across store-review and internal-alpha-review channels
- `tooling/release/write-submission-readiness-report.ts`
  - writes `.runtime-cache/release-artifacts/submission-readiness.json`
  - turns release-readiness state into a reviewer-facing checklist with category-tagged guardrails
  - derives reviewer start URLs from the shared store catalog so release reporting and parity checks stay on one contract source
  - fails closed on missing reviewer start-path truth by surfacing a readable blocker instead of a fake URL

Current builder helper:

- `tooling/builder/write-builder-runtime-payloads.ts`
  - writes repo-local builder snapshot / operator decision brief / workflow-copilot brief JSON files under `.runtime-cache/builder/`
  - uses canonical current-scope runtime truth for supported apps such as `ext-albertsons`, `ext-amazon`, `ext-kroger`, and `ext-temu` instead of hand-maintained output payloads
  - gives the outcome bundle a truthful `generated-runtime-file` source to consume before falling back to checked-in examples
- `tooling/builder/write-builder-example-rack.ts`
  - refreshes the checked-in example rack under `docs/ecosystem/examples/`
  - reuses repo-owned generated runtime payloads and writes matching multi-app outcome-bundle examples for `ext-albertsons`, `ext-amazon`, `ext-kroger`, and `ext-temu`
  - now also writes common checked-in agent/distribution examples such as `agent-integration-bundle.json`, `public-mcp-capability-map.json`, `public-skills-catalog.json`, and plugin metadata packets
  - keeps checked-in examples refreshable instead of treating them as hand-maintained sample JSON
- `tooling/builder/write-builder-outcome-bundle.ts`
  - writes `.runtime-cache/builder/builder-outcome-bundle.json`
  - assembles the current builder integration surface, checked-in read-model examples, and generated release-artifact summaries plus source pointers into one read-only outcome bundle
  - prefers `.runtime-cache/builder/{builder-app-snapshot,operator-decision-brief,workflow-copilot-brief}.<appId>.json` when those generated runtime payloads already exist, and falls back to checked-in example payloads otherwise
  - now also includes builder discoverability routes plus ready-to-sync copy pointers so coding tools can find the right current-scope entry without guessing
  - supports `--app`, `--output`, and `--stdout` for the most common builder consumption paths
  - stays repo-local and does not claim a public CLI surface

Current CLI helper:

- `tooling/cli/read-only.ts`
  - provides one repo-local read-only CLI wrapper for:
    - `agent-integration-bundle`
    - `agent-target-packet`
    - `public-mcp-capability-map`
    - `public-skills-catalog`
    - `plugin-marketplace-metadata`
    - `integration-surface`
    - `runtime-seam`
    - `runtime-consumer`
    - `public-distribution-bundle`
    - `outcome-bundle`
    - `submission-readiness`
  - keeps `outcome-bundle` honest by reusing existing generated payloads or the
    checked-in example rack instead of silently regenerating
    `.runtime-cache/builder/*`
  - now also exposes one machine-readable onboarding packet for Codex / Claude
    Code quickstarts plus an OpenClaw public-ready packet
  - now also exposes one smaller target-specific handoff packet when a caller
    only needs the Codex, Claude Code, or OpenClaw slice
  - stays repo-local and does not claim a public CLI commitment

Builder-facing docs for this helper:

- `docs/ecosystem/builder-start-here.md`
- `docs/ecosystem/integration-recipes.md`
- `docs/ecosystem/examples/README.md`

Current verification helper:

- `tooling/verification/check-verification-parity.ts`
  - checks that app directories, fixtures, contract tests, E2E specs, and live-evidence wiring stay aligned with the shared verification catalog
- `tooling/verification/capture-ui-surfaces.ts`
  - powers `pnpm capture:ui-surfaces`
  - launches the built extension in headless Chromium and emits PNG previews for:
    - the selected store app popup
    - the selected store app sidepanel
    - the Suite sidepanel
  - defaults to `ext-albertsons` plus `locale=en`
  - writes timestamped screenshots under `.runtime-cache/ui-surface-captures/<run-id>/`
  - refreshes `*.latest.png` aliases and `ui-surface-capture-manifest-latest.json`
  - stays in repo-verification territory by using routed fixtures for store surfaces and seeded shared storage for the Suite surface
- `tooling/verification/capture-ui-surface-matrix.ts`
  - powers `pnpm capture:ui-matrix`
  - runs a fixed R3 matrix across multiple apps/locales:
    - `ext-albertsons` (`en`)
    - `ext-kroger` (`en`)
    - `ext-temu` (`en`)
    - `ext-albertsons` (`zh-CN`)
  - writes per-target capture roots under `.runtime-cache/ui-matrix/**`
  - stages a reviewer-facing subset into `.stitch/designs/matrix/r3/`
  - writes `ui-surface-matrix-manifest-latest.json`
- `tooling/wxt/reset-app-output.ts`
  - clears stale `.output` folders before root wave builds and packaging

Current maintenance helper:

- `tooling/maintenance/cache-policy.ts`
  - defines the canonical Shopflow external cache policy under `~/.cache/shopflow/**`
  - locks the default external cache TTL to `3` days and the cap to `2 GB`
  - keeps the dedicated `browser/chrome-user-data` root and canonical `Profile 1 / shopflow` defaults alongside the cache namespace contract
- `tooling/maintenance/disk-artifacts.ts`
  - defines the typed repo-local disk artifact inventory
  - keeps repo-owned cleanup policy and machine-wide guardrails in one source of truth
  - now also tracks Shopflow-owned external cache roots under `~/.cache/shopflow/**`
- `tooling/maintenance/audit-disk-footprint.ts`
  - powers `pnpm audit:disk-footprint`
  - reports repo-local artifact size, Shopflow external cache size, retention policy, recommended action, and out-of-scope machine-wide cache notes
- `tooling/maintenance/cleanup-disk-artifacts.ts`
  - powers:
    - `pnpm cleanup:runtime-cache`
    - `pnpm cleanup:build-output`
    - `pnpm cleanup:release-artifacts`
  - defaults to dry-run and only mutates paths under the repo root when called with `--apply`
  - refuses machine-wide targets such as `/private/var/folders/**`, `~/Library/**`, non-Shopflow `~/.cache/**`, shared stores, and Docker data roots
  - `cleanup:runtime-cache` clears disposable repo-local runtime outputs while retaining:
    - `.runtime-cache/release-artifacts/`
    - all `*-latest.json` live-browser aliases
    - the newest `5` live-browser trace bundles
    - live-browser timestamped JSON younger than `7` days
- `tooling/maintenance/cleanup-external-cache.ts`
  - powers `pnpm cleanup:external-cache`
  - only deletes Shopflow-owned cache paths inside `~/.cache/shopflow/**`
  - prunes by TTL first, then by the total-size cap
- `tooling/maintenance/docker-policy.ts`
  - locks the Shopflow Docker label to `com.shopflow.repo=shopflow-suite`
  - treats Docker Desktop roots as machine-wide and out of scope
- `tooling/maintenance/cleanup-docker-resources.ts`
  - powers `pnpm cleanup:docker`
  - only deletes Shopflow-labeled containers, images, volumes, and networks
- `tooling/runtime/prepare-shopflow-runtime.ts`
  - runs before cache-producing local commands
  - ensures `~/.cache/shopflow/**` exists
  - prunes Shopflow-owned external cache automatically before the main command continues
- `tooling/live/seed-browser-profile.ts`
  - powers `pnpm browser:seed-profile`
  - verifies the default Chrome root is quiet before copying the legacy source profile
  - seeds `~/.cache/shopflow/browser/chrome-user-data/Local State` and `Profile 1/`
  - rewrites the dedicated root to the canonical lower-case `shopflow` profile
  - writes the initial singleton instance record after first launch succeeds

Current live browser helper:

- `tooling/live/preflight.ts`
  - validates the requested Chrome profile, Local State, and selected merchant targets before a live lane run
- `tooling/live/diagnose.ts`
  - combines preflight and probe state into a blocker + next-action report
- `tooling/live/probe.ts`
  - inspects the requested merchant targets against the current Chrome/CDP/tabs state and writes repo-local artifacts under `.runtime-cache/live-browser/`
  - now also writes a standardized trace bundle under `.runtime-cache/live-browser/bundles/`
  - each trace bundle now also carries `screenshots.json`, a page URL/title to
    screenshot manifest that keeps later review-prep mapping deterministic
- `tooling/live/open-live-browser.ts`
  - ensures the dedicated Shopflow singleton Chrome instance exists before opening target pages
  - when `SHOPFLOW_LIVE_ATTACH_MODE=browser`, prefers the remote-debuggable
    launch path so later probe runs can attempt CDP attach first
  - now refuses a fresh debug launch when the machine is already over the
    browser main-process budget (`> 6`)
  - when the launch is budget-blocked, now also reports:
    - all detected browser main-process PIDs
    - which ones already match the requested Shopflow user-data-dir
    - which ones already match the requested remote-debugging port
  - now also reports whether that launch really made the requested listener
    reachable or exited before the listener came up
  - avoids forcing Google Chrome to take focus when only reopening URLs in the
    existing Shopflow singleton instance
  - no longer inspects arbitrary host Chrome tabs outside the recorded
    Shopflow singleton/CDP lane
  - defaults the live profile contract to `Profile 1 / shopflow` under
    `~/.cache/shopflow/browser/chrome-user-data`
  - keeps the dedicated browser root out of generic cleanup and TTL pruning
  - treats reseeding as an explicit replace action instead of the default reopen
    path once the dedicated browser root already exists
- `tooling/live/write-operator-capture-packet.ts`
  - short script entry: `pnpm operator-capture-packet:live`
  - turns the latest `diagnose/probe/trace` artifacts into one machine-readable
    operator packet
  - reports which `captureId` values are already `capture-ready`
  - reports which `captureId` values are still `blocked`, and why
  - prefers `screenshots.json` manifest matches over raw observed-tab order, so
    screenshot selection stays tied to page URL/title instead of fragile index
    guesses
  - keeps this as operator/review prep only; it does not overclaim a
    `reviewed` packet
- `tooling/live/write-review-candidate-records.ts`
  - short script entry: `pnpm review-candidate-records:live`
  - turns the latest operator capture packet into schema-valid `captured`
    review-candidate records
  - keeps `capture-ready` and `blocked` separated instead of pretending every
    live target is reviewable
  - still stops short of `reviewed`; human review remains explicit
- `tooling/live/write-reviewed-records.ts`
  - short script entry: `pnpm reviewed-records:live -- --review-input <path>`
  - turns explicit reviewer decisions plus the latest review-candidate packet
    into schema-valid `reviewed` / `rejected` records
  - safely ignores `pending` template decisions, so unfinished review-input
    files can live in the repo-local artifact lane without overclaiming review
  - preserves already-finalized `reviewed` / `rejected` records unless the
    new review input explicitly overrides that same capture
  - keeps undecided `captured` records explicit instead of silently upgrading
    everything
  - refuses to review action-heavy captures without action counts in the review
    input JSON
- `tooling/live/write-review-input-template.ts`
  - short script entry: `pnpm review-input-template:live`
  - builds a repo-local `review-input-template-latest.json` from the latest
    captured review-candidate records
  - prefers any existing reviewed-record packet so the template only contains
    the still-undecided captures
  - uses `status: "pending"` plus empty reviewer fields as a safe fill-in
    template instead of a silently runnable approval file

Live review helper order:

- `pnpm operator-capture-packet:live`
- `pnpm review-candidate-records:live`
- `pnpm review-input-template:live`
- `pnpm reviewed-records:live -- --review-input <path>`
- run them serially when you care about the `*-latest.json` aliases
- `tooling/live/close-live-browser.ts`
  - closes the recorded Shopflow singleton more gracefully than a raw host kill
  - tries CDP browser close first, then `SIGTERM`, then a last-resort force kill
    on the recorded Shopflow PID only
  - refuses to signal a PID that can no longer be re-verified against the
    recorded Shopflow Chrome executable / profile / debugging port
  - removes the singleton record only after the browser is actually gone

Safeway-specific live nuance:

- `safeway-home` is now the session-health target
- `safeway-cart` / `safeway-manage` still represent the capture-heavy deep links
- the live probe can now distinguish:
  - `login_required`
  - `deep_link_unstable`
  so a healthy Safeway homepage is not automatically treated as a full cart/manage failure

Current E2E temp-profile rule:

- `tests/e2e/support/extension-smoke.ts`
  - now creates Chromium user-data-dir temp roots under `.runtime-cache/e2e-browser/`
  - keeps interrupted E2E residue repo-local instead of relying on `os.tmpdir()`
  - lets `pnpm cleanup:runtime-cache --apply` clean up leftover E2E browser profiles later
