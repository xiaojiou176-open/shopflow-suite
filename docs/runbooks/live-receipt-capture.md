# Live Receipt Capture Runbook

- Status: Draft
- Date: 2026-03-30
- Owners: Shopflow Delivery + Quality
- Related:
  - [Testing and Verification Bar](../contracts/testing-and-verification-bar.md)
  - [Shopflow Brand and Claim Boundary](../branding/shopflow-brand-and-claim-boundary.md)

## Purpose

This runbook defines the **repo-owned capture path** for claims that still need
real-world evidence before they can become public-facing support statements.

In plain language:

> this is the checklist for turning a fixture-backed workflow into a reviewable
> live receipt bundle.

## Current Scope

This runbook is currently most important for:

- `ext-albertsons`
  - Safeway Schedule & Save subscribe
  - Safeway Schedule & Save cancel
- `ext-temu`
  - non-local warehouse filter proof, if future public wording depends on it

## What Already Exists in Repo

These artifacts are already present and should be used instead of inventing a
second evidence path:

- runtime evidence ledger:
  - `packages/runtime/src/storage/evidence-capture-repository.ts`
- evidence storage integration test:
  - `tests/integration/runtime.evidence-capture-repository.test.ts`
- contract-honest action gating:
  - `packages/store-albertsons/src/adapter.ts`
  - `packages/store-temu/src/temu-adapter.ts`
- browser smoke coverage for routed fixtures:
  - `tests/e2e/ext-albertsons.smoke.spec.ts`
  - `tests/e2e/ext-temu.smoke.spec.ts`
- repo-owned browser lane helpers:
  - `pnpm preflight:live`
  - `pnpm diagnose:live`
  - `pnpm probe:live`
  - `pnpm open:live-browser`
  - these write repo-local JSON artifacts under `.runtime-cache/live-browser/`

## What Still Requires External Evidence

The repo can now prove:

- fixture-backed action semantics
- receipt shape honesty
- extension loading
- sidepanel wording and gating

The repo **cannot** by itself prove:

- a real Safeway subscribe/cancel run happened on a live account
- a real screenshot was captured from a live merchant session
- a public claim is safe to publish

That missing step is the external blocker.

When the repo-owned review bundle, reviewer start path, and parity checks are
already clear, the submission-readiness report should expose that missing live
packet under `externalBlockers` instead of pretending packaging is still the
main blocker.

That means the reviewer/operator split should read like this:

- repo-owned path:
  - review bundle exists
  - reviewer start path is clear
  - parity checks are clean
- external-only path:
  - the real merchant capture still has to happen
  - the live packet still has to be reviewed

In plain language:

> once the repo-side desk work is organized, the remaining problem is no longer
> “which file do I open?”
> it becomes “someone now has to do the real live proof outside the repo.”

## Wave 14 Browser Lane Contract

These commands formalize the repo-owned browser preparation path. They are
useful because they turn “which browser/profile/session did I actually use?”
into a reviewable JSON report instead of guesswork.

Use this env contract:

```bash
SHOPFLOW_LIVE=1
SHOPFLOW_LIVE_USER_DATA_DIR="$HOME/.cache/shopflow/browser/chrome-user-data"
SHOPFLOW_LIVE_PROFILE_DIRECTORY="Profile 1"
SHOPFLOW_LIVE_PROFILE_NAME="shopflow"
SHOPFLOW_LIVE_ATTACH_MODE="auto"
SHOPFLOW_LIVE_CDP_URL="http://127.0.0.1:9335"
SHOPFLOW_LIVE_TARGETS="safeway-home,safeway-cart,safeway-manage,fred-meyer-coupons,qfc-search,temu-search"
```

### Command order

1. `pnpm browser:seed-profile`
   - verifies that the default Chrome root is quiet before copying anything
   - now refuses to overwrite an already-existing dedicated Shopflow browser
     root unless you explicitly pass `--replace-existing-root`
   - copies only `Local State` plus the chosen source profile into the
     dedicated Shopflow root
   - rewrites the dedicated root to `Profile 1 / shopflow`
   - deletes copied `Singleton*` files before the first launch
2. `pnpm preflight:live`
   - checks the requested Chrome profile, Local State, selected merchant targets,
     and whether the requested live lane has enough filesystem/CDP prerequisites
3. `pnpm diagnose:live`
   - combines preflight plus probe state into blockers and copy-ready next steps
   - now also writes a machine-readable `recommendations` block with canonical
     profile-alignment status plus copy-ready `diagnose` / `probe` /
     `open-browser` commands
4. `pnpm probe:live`
   - inspects the requested merchant tabs and writes a repo-local probe artifact
   - also writes a standardized trace bundle under
     `.runtime-cache/live-browser/bundles/`
5. `pnpm operator-capture-packet:live`
   - reads the latest `diagnose/probe/trace` artifacts
   - writes one machine-readable operator packet under
     `.runtime-cache/live-browser/operator-capture-packet-latest.json`
   - reports which capture IDs are already `capture-ready`
   - reports which capture IDs are still blocked, and why
   - prefers the trace bundle's `screenshots.json` manifest when mapping
     screenshots back to capture IDs, so page URL/title wins over fragile
     tab-index guesses
6. `pnpm review-candidate-records:live`
   - reads the latest operator capture packet
   - writes schema-valid `captured` review-candidate records under
     `.runtime-cache/live-browser/review-candidate-records-latest.json`
   - keeps blocked capture IDs separate instead of promoting them prematurely
7. `pnpm review-input-template:live`
   - reads the latest captured review-candidate records
   - prefers any existing `reviewed-records-latest.json` so the template focuses
     on the still-undecided captures instead of already-reviewed ones
   - writes a safe pending template under
     `.runtime-cache/live-browser/review-input-template-latest.json`
   - leaves each decision at `status: "pending"` so the file can exist without
     silently upgrading anything
8. `pnpm reviewed-records:live -- --review-input <path>`
   - reads the latest captured review-candidate records plus an explicit
     reviewer decision JSON
   - writes schema-valid `reviewed` or `rejected` records under
     `.runtime-cache/live-browser/reviewed-records-latest.json`
   - preserves already-finalized `reviewed` / `rejected` records unless the
     new review input explicitly overrides that same `captureId`
   - still refuses to auto-review everything:
     - `pending` template decisions keep `captured` records undecided
     - action-heavy captures must include action counts in the review input
       before they can be upgraded to `reviewed`
   - run steps `5` through `8` serially when you care about the `*-latest.json`
     aliases, because each helper rewrites the latest artifact it owns
9. `pnpm open:live-browser`
   - ensures the dedicated Shopflow singleton Chrome instance exists
   - if that singleton already exists, reuses it instead of second-launching the
     same browser root
   - only launches a remote-debuggable Chrome process when the dedicated
     singleton instance does not already exist
   - when `SHOPFLOW_LIVE_ATTACH_MODE=browser`, prefer the remote-debuggable
     launch path for the dedicated Shopflow browser root
   - if the machine already has more than `6` browser main processes, refuse a
     new debug launch and wait for other workers to release browser resources
     first
   - when that budget guard trips, the JSON report now also includes:
     - all detected browser main-process PIDs
     - the subset already using the requested Shopflow user-data-dir
     - the subset already advertising the requested debugging port
   - when reusing the existing Shopflow singleton instance, avoid stealing focus
     unless the host/browser layer offers no quieter option
   - the report now includes `launchVerification.outcome`, so the operator can
     tell whether the listener is really ready or the spawned process exited
     before `9335` ever became reachable
10. `pnpm close:live-browser`
   - reads the current Shopflow singleton record
   - attempts a browser-owned CDP close first
   - if the browser does not exit, falls back to `SIGTERM`
   - only if that still fails does it use a final force kill on the recorded
     Shopflow singleton PID
   - removes the singleton record only when the recorded browser is truly gone

### What these commands are for

- confirming which dedicated Shopflow browser root is being targeted
- defaulting to the canonical dedicated `Profile 1 / shopflow` live lane unless the
  operator explicitly overrides it with `SHOPFLOW_LIVE_*`
- using `safeway-home` as the stable Safeway session-health target before
  judging whether `cart/manage` failures mean “real login lost” or “deep link drift”
- keeping live/dev/browser work out of the default Chrome root
- confirming whether the active debug listener matches that profile
- confirming whether a requested debug launch actually produced a reachable
  listener for the dedicated Shopflow browser root
- refusing host-wide tab inspection outside the recorded Shopflow singleton/CDP
  lane
- proving whether the requested merchant targets are visible, login-gated, or
  simply not open yet
- distinguishing:
  - `login_required`
  - `deep_link_unstable`
  for Safeway, instead of collapsing every cart/manage failure into the same
  bucket
- preserving repo-local JSON artifacts under `.runtime-cache/live-browser/`
  so the next operator does not have to reconstruct the environment from memory
- preserving a trace bundle with:
  - `summary.json`
  - `chrome-tabs.json`
  - `chrome-processes.json`
  - `cdp-summary.json`
  - `screenshots.json`
  - `console.ndjson`
  - `pageerrors.ndjson`
  - `requestfailed.ndjson`
  - `network.ndjson`
  - `screenshots/`

### What these commands are not for

- they do **not** create the reviewed live evidence bundle by themselves
- they do **not** replace the external merchant capture/review step
- they do **not** upgrade `capture-ready` operator packets into `reviewed`
  evidence
- `pnpm exec tsx tooling/live/write-reviewed-records.ts` only upgrades
  `captured` review-candidate records when an explicit reviewer decision JSON is
  supplied
  - it does **not** invent review decisions on its own
  - it does **not** bypass action-count requirements for action-heavy captures
  - `status: "pending"` is now the safe template state; it preserves the
    captured record as undecided until the review file is actually completed
- they do **not** turn a cloned or temporary debug profile into the canonical
  true-session lane
- they do **not** justify opening browser instances again and again once 1-2
  targeted checks already proved the canonical profile lacks the required login
  state
- they do **not** mean `pnpm browser:seed-profile` should become a daily reopen
  habit after the dedicated root is already healthy

### Trace bundle boundary

The trace bundle is a repo-local evidence packet for debugging and operator
handoff.

It is useful because it preserves:

- which tabs were visible
- which Chrome processes/listeners were visible
- whether CDP was reachable
- what passive network/request/console/pageerror signals were captured

It is still **not**:

- the reviewed live evidence bundle
- a public-claim-ready proof packet
- a replacement for the real merchant screenshot/review step

### Explicit review input shape

The `write-reviewed-records` helper expects a repo-local JSON file like:

```json
{
  "decisions": [
    {
      "captureId": "fred-meyer-verified-scope-live-receipt",
      "status": "reviewed",
      "reviewedBy": "Shopflow QA",
      "reviewSummary": "Screenshot and verified-scope page label match the review checklist."
    },
    {
      "captureId": "safeway-cancel-live-receipt",
      "status": "reviewed",
      "reviewedBy": "Shopflow QA",
      "reviewSummary": "Manage-page screenshot and cancellation counts match the review checklist.",
      "actionSnapshot": {
        "attempted": 1,
        "succeeded": 1,
        "failed": 0,
        "skipped": 0
      }
    }
  ]
}
```

If you do not want to handcraft that file, first run:

```bash
pnpm review-input-template:live
```

That helper writes `.runtime-cache/live-browser/review-input-template-latest.json`
with one pending decision per still-undecided captured record.

Why this matters:

- non-action captures such as verified-scope Fred Meyer / QFC can usually be
  reviewed from screenshot + scope proof
- action-heavy captures such as Safeway subscribe/cancel or Temu filter still
  need action counts before `reviewed` is contract-valid
- the helper makes the reviewer identity and judgment explicit instead of
  leaving review as an unstructured side note

### Trace bundle retention and cleanup boundary

- trace bundles live under `.runtime-cache/live-browser/`
- Shopflow keeps all `*-latest.json` aliases
- Shopflow keeps the newest `5` `trace-*` bundle directories
- older timestamped live-browser JSON older than `7` days is disposable
- routine cleanup should happen through `pnpm cleanup:runtime-cache --apply`

Out of scope:

- `/private/var/folders/**`
- `com.google.Chrome.code_sign_clone`
- the default Chrome root under `~/Library/Application Support/Google/Chrome`
- the shared pnpm download store

In plain language:

> Shopflow may leave breadcrumbs in its own notebook.
> It still must not pretend it owns the whole building's storage closet.

### True session lane vs clone lane

- the durable session lane is the dedicated root under
  `~/.cache/shopflow/browser/chrome-user-data`
- once that root is healthy, future reopen/re-attach should go through
  `pnpm open:live-browser`, `pnpm diagnose:live`, and `pnpm probe:live`
  instead of reseeding from the default Chrome root again
- repeated reseeding is risky because it copies a snapshot of an older profile
  state; if the source profile drifted, or if the copy happens after an
  unclean browser state, you can overwrite a healthier dedicated root with a
  stale session snapshot
- if you truly need to throw away the current dedicated root and replace it,
  use `pnpm browser:seed-profile --replace-existing-root` on purpose
- to reduce future login loss, prefer this order:
  1. keep the dedicated root persistent
  2. reuse the singleton instance when it already exists
  3. if the singleton is gone, relaunch the same dedicated root
  4. when you are done, prefer `pnpm close:live-browser` over a raw host-level
     kill so Chrome gets a cleaner shutdown path
  5. only reseed when the dedicated root is truly broken and you explicitly
     want to replace it

- true session lane
  - attach to the canonical dedicated Shopflow Chrome root
  - manual login and repo-owned probe happen in the same browser instance
  - may feed a future reviewable live packet
- clone lane
  - useful for rehearsing routes, extension boot, and non-destructive debugging
  - must not be described as reviewed live evidence

### E2E temp-profile boundary

Extension smoke tests now create Chromium user-data-dir temp roots under:

- `.runtime-cache/e2e-browser/`

This keeps interrupted test residue repo-local instead of dropping it under the
system temp tree by default. Those temp profiles remain disposable and can be
cleared with `pnpm cleanup:runtime-cache --apply`.

Important boundary:

- live/dev/browser routes use the real Chrome profile
- smoke/E2E/CI stay on isolated Playwright browsers

## Required Fields for a Reviewable Live Receipt

Every live receipt bundle must include:

1. `appId`
2. `storeId`
3. `verifiedScope`
4. `pageKind`
5. `actionKind` or exercised capability
6. execution date
7. attempted / succeeded / failed counts when action-based
8. human-readable outcome summary
9. screenshot or equivalent visual proof

## Capture Sequence

### Step 1: Reconfirm Repo Baseline

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build:wave1
pnpm build:wave2
```

Do not start a live capture from a dirty or unverified repo state.

### Step 2: Reconfirm the Fixture-Honest Path

Run the smallest relevant checks before touching a live surface:

```bash
pnpm vitest run tests/contract/store-albertsons.contract.test.ts tests/contract/store-temu.contract.test.ts --passWithNoTests
pnpm exec playwright test tests/e2e/ext-albertsons.smoke.spec.ts tests/e2e/ext-temu.smoke.spec.ts --pass-with-no-tests
```

This does **not** create live proof.

It only confirms that the repo is still rendering the correct honesty gates.

### Step 3: Perform the Live Session Outside Version Control

Use a real browser session and a real supported surface.

Examples:

- Safeway cart page for `schedule_save_subscribe`
- Safeway manage page for `schedule_save_cancel`

Capture:

- the screenshot
- the timestamp
- the verified scope
- the human-readable outcome
- the action counts

Do not store secrets, account identifiers, or sensitive raw merchant details in
Git.

### Step 4: Record the Capture Status in the Repo-Owned Ledger

Use the runtime evidence repository shape:

- storage key prefix: `shopflow.liveEvidence`
- per-app key: `shopflow.liveEvidence.<appId>`

Example record shape:

```ts
{
  appId: 'ext-albertsons',
  captureId: 'safeway-subscribe-live-receipt',
  storeId: 'albertsons',
  verifiedScope: 'safeway',
  status: 'captured',
  summary: 'Safeway subscribe live receipt bundle captured and ready for review.',
  updatedAt: '2026-03-30T09:05:00.000Z',
  capturedAt: '2026-03-30T09:05:00.000Z',
  screenshotLabel: 'safeway-subscribe-success.png',
  sourcePageUrl: 'https://www.safeway.com/cart',
  sourcePageLabel: 'Live Safeway cart page',
}
```

If the live step has not happened yet, use `status: 'missing-live-receipt'`
instead of pretending evidence exists.

`sourcePageUrl` / `sourcePageLabel` are optional routing metadata for operators.
They help the Side Panel and Popup route back to the latest known capture
surface, but they still do **not** turn the repo-owned ledger into the live
bundle itself.

Related but separate:

- the shared latest-output preview may show the freshest repo-owned extracted
  product/search/deal payload for operator context
- that preview is still **not** the reviewed live receipt bundle
- treat it like a helpful breadcrumb, not a release-evidence substitute

### Step 4.1: Review the Capture Before Calling It Release Evidence

The repo-owned ledger now uses a real workflow state instead of a single
binary label:

- `missing-live-receipt`
- `capture-in-progress`
- `captured`
- `reviewed`
- `rejected`
- `expired`

Meaning:

- `capture-in-progress` means the operator packet is being assembled but is not reviewable yet
- `captured` means the operator packet exists and is waiting for review
- `reviewed` means the packet passed review and can support release decisioning
- `rejected` means the packet was recorded but failed review
- `expired` means the packet once existed, but is no longer trustworthy enough
  for release decisioning

Do not skip from `capture-in-progress` or `captured` straight to public wording.
The repo-owned storage path now also treats this as a **state-transition rule**:

- `capture-in-progress` must advance to `captured` before it can ever become `reviewed`
- `captured` is explicitly **review-pending**, not release evidence
- `reviewed` is the first state that can support release decisioning
- `rejected` and `expired` both mean recapture is required before another review pass

## Ledger Integrity Rules

The repo-owned ledger is now strict about what each review state must carry.

- `captured`
  - must include `capturedAt`
  - must include the latest `screenshotLabel`
- `reviewed`
  - must retain `capturedAt`
  - must include `reviewedAt`
  - must include `reviewedBy`
  - must include `reviewSummary`
  - must include the reviewed `screenshotLabel`
- `rejected`
  - must include `reviewedAt`
  - must include `reviewNotes`
- `expired`
  - must include `expiresAt`

In plain language:

> the ledger is no longer allowed to say “reviewed” without also saying who reviewed it, when they reviewed it, and which proof packet they actually looked at.

## Operator Packet Semantics

Treat each capture requirement like a small review packet with three separate questions:

1. **Was the packet started?**
   - `capture-in-progress`
2. **Is there a complete packet ready for reviewer eyes?**
   - `captured`
3. **Did a reviewer explicitly accept or reject it?**
   - `reviewed` or `rejected`

This means:

- a packet can be complete enough to wait for review without being approved yet
- a packet can be rejected even if screenshots and counts exist, if they do not satisfy the checklist
- an expired packet must go back through capture and review instead of being quietly reused
- app-level queue summaries can help operators see whether the next move is
  capture, recapture, or review, but those summaries are still coordination
  metadata layered on top of the raw packet records

## Operator Surface Routing

The shared operator surface now separates the workflow into three layers:

- `Evidence overview`
  - missing and `capture-in-progress` packets land here first
- `Review lane`
  - `captured`, `reviewed`, `rejected`, and `expired` packets land here so operators can see review outcomes, not just generic blockers
- `Raw packet ledger`
  - this stays the audit layer with packet-level detail and must not be mistaken for public-ready proof

In plain language:

> the summary card is the traffic sign, the review lane is the supervisor desk, and the raw packet ledger is the filing cabinet. They serve different jobs on purpose.

The repo-owned summary layer now also prefers the next operator path in this
order:

1. finish an already started capture packet
2. review a packet that is already captured
3. re-capture a rejected or expired packet
4. start a brand-new missing packet

This keeps the app-level blocker summary aligned with the raw packet ledger.
In plain language:

> do not abandon work that is already in flight just because another packet is still missing.

When the next actionable packet already has routing breadcrumbs recorded, the
repo-owned summary may also surface:

- `nextSourcePageUrl`
- `nextSourcePageLabel`
- `nextSourceRouteLabel`

These fields are still operator navigation aids only. They help a UI jump back
to the best known packet page, but they do **not** upgrade the repo ledger into
the reviewed live bundle.

### Step 5: Only Then Consider Public Claim Review

Public wording can only move forward when all of these are true:

1. repo verification is green
2. the live receipt bundle exists somewhere reviewable
3. the bundle status has been advanced to `reviewed`
4. the wording stays inside verified scope
5. the app does not overclaim beyond the captured workflow

## Non-Negotiable Rules

1. Routed fixtures are not live proof.
2. A stored summary without screenshot evidence is not a finished live receipt.
3. `Capability-heavy Product` wording stays blocked until live evidence exists
   and is reviewed.
4. The repo ledger is a coordination trail, not a replacement for the real live bundle.
5. App-level queue summaries and source-page routing are operator aids only.
   They do not upgrade `captured` into `reviewed`, and they do not replace the
   reviewed live packet outside version control.
