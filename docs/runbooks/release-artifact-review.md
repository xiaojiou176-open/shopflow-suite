# Release Artifact Review Runbook

- Status: Draft
- Date: 2026-03-30
- Owners: Shopflow Delivery + Release Engineering
- Related:
  - [Testing and Verification Bar](../contracts/testing-and-verification-bar.md)
  - [Live Receipt Capture Runbook](./live-receipt-capture.md)
  - [ADR-002: Release Wave and Product Tiering](../adr/ADR-002-release-wave-and-product-tiering.md)

## Purpose

This runbook defines the **repo-owned review artifact path** for Shopflow builds.

In plain language:

> this is the box label that tells reviewers what bundle they are looking at,
> what channel it belongs to, and why that still does not equal a public release.

## Current Review Channels

Shopflow currently publishes two review channels:

- `store-review`
  - store app bundles intended for engineering or release review
- `internal-alpha-review`
  - Suite internal alpha bundle intended for internal-only review

These channels are for review, not for store submission.

## Review Artifact Outputs

Every CI review bundle should include:

1. the built extension directory
2. the generated `shopflow-review-artifact.json`
3. the extension `manifest.json`

The generated review artifact manifest must record:

- `appId`
- `packageName`
- `releaseChannel`
- `claimState`
- `reviewChannel`
- `surface`
- `extensionName`
- `extensionVersion`
- `generatedAt`
- `githubWorkflow`
- `githubRunId`
- `sourceSha`
- `bundleCompleteness.requiredFiles`
- `bundleCompleteness.zipArtifacts`

After local or CI packaging completes, Shopflow also writes a
`submission-readiness.json` report in `.runtime-cache/release-artifacts/`.

This report does **not** claim store submission is ready. It exists to explain:

- whether the review bundle is complete
- whether the app is still claim-gated
- which live-evidence capture ids still matter
- which blockers are still external, such as signing or real submission review
- which URL a reviewer should start from when manually checking the store surface
- which short submission checklist still applies to this app

Claim-gated and internal-alpha-only states are still repo-owned status labels.
Do not use `externalBlockers` to hide repo-owned packaging, parity, or
review-start-path drift.

Once the review bundle is complete, the reviewer start path is trustworthy, and
verification parity is clean, the report should also surface truly external
gates under `externalBlockers`, such as:

- reviewed live-evidence packets that still need an external capture/review step
- signed artifacts that still need the real signing environment
- actual store submission / review that still happens outside the repo

The report should read like a reviewer handoff card, not a slogan. In practice
that means each entry should surface:

- a short readiness summary
- a category-tagged reviewer checklist that names whether drift belongs to
  artifact integrity, review-start-path truth, claim boundary, live evidence,
  verification parity, or submission boundary
- bundle audit details for missing build dir / zip / key bundle files
- a reviewer start path with channel, surface, artifact-manifest path, and first check
- that reviewer start path should be derived from the shared store-catalog default review host, so release reporting and parity guards read the same contract truth
- a readable blocker when the store catalog cannot produce a trustworthy reviewer start URL
- app-scoped verification parity drift when the repo-owned parity guard has
  caught claim/path/fixture/package wiring mismatch, so reviewers do not need
  to cross-reference a second report before starting
- a clear boundary note explaining why review bundle != signed release != public-ready claim

The manifest writer must also reject mismatched metadata when the requested
`appId`, `packageName`, `reviewChannel`, `surface`, or bundle directory drift
away from the verification catalog.

## Reviewer Start Order

Use the reviewer handoff path in this order:

1. open `submission-readiness.json`
2. pick the target app entry and read:
   - `repoOwnedStatus`
   - `readinessSummary`
   - `reviewerStartPath`
   - `externalBlockers`
3. open the per-app `shopflow-review-artifact.json`
4. open the reviewer start URL if one exists
5. only then decide whether the remaining blocker is:
   - still repo-owned packaging/parity/start-path drift
   - external live evidence
   - external signing/submission work

In plain language:

> read the handoff card first, then open the bundle, then open the page.
> do not guess the order from scattered files.

## Required Separation Rules

1. `ext-shopping-suite` must publish only as `internal-alpha-review`
2. Store apps must publish only as `store-review`
3. Review bundles must not be described as signed, store-ready, or public-claim-ready
4. Review bundles must stay separate from live receipt evidence bundles

## CI Flow

The current CI review flow is:

1. `verify` job runs `pnpm verify:release-readiness`
2. that serial lane covers lint, typecheck, verification gates, sensitive-surface checks for both the current worktree and reachable history, full repo test, review-bundle packaging, and submission-readiness reporting
3. CI uploads the release manifest and `submission-readiness.json`
4. `package-review-artifacts` builds each app independently
5. CI sanity-checks key bundle files such as `manifest.json`
6. CI runs `pnpm release:write-review-artifact-manifest`
7. CI uploads the built bundle plus the generated review manifest as an artifact
8. a parallel `sensitive-public-surface` job checks the GitHub-hosted public fallback repos plus their issue / PR / release text surfaces
9. that same job now also runs the GitHub platform security capability check so disabled native features are logged as platform gaps instead of being mislabeled as code failures

Local packaging checks should also fail readably when an output is incomplete.

Expected failure details include:

- whether the build directory is missing
- whether zip artifacts are missing
- which key bundle files are missing, such as `manifest.json`, `background.js`,
  `sidepanel.html`, and `popup.html` for store apps

## Local Reproduction

To reproduce the manifest-writing step locally:

```bash
export SHOPFLOW_APP_ID=ext-temu
export SHOPFLOW_PACKAGE_NAME=@shopflow/ext-temu
export SHOPFLOW_REVIEW_CHANNEL=store-review
export SHOPFLOW_SURFACE=storefront-shell
export SHOPFLOW_APP_DIR=apps/ext-temu
pnpm --filter @shopflow/ext-temu build
pnpm release:write-review-artifact-manifest
```

## Serial Verification Rule

If you need one repo-owned release-readiness answer, run the release lane
serially:

```bash
pnpm verify:release-readiness
```

Do not run `pnpm test` and `pnpm package:artifacts` in parallel against the
same workspace.

Why:

1. both flows rewrite per-app `.output/` directories
2. parallel runs can create false-red `ENOENT` failures while one process is
   rebuilding files the other process is trying to inspect
3. release review should consume serial evidence, because that is the
   trustworthy repo-owned signal

## Non-Negotiable Rules

1. Review bundles are not Chrome Web Store submissions
2. Review bundles are not signed production packages
3. Review bundles do not replace live-receipt evidence for public-claim decisions
4. Internal alpha artifacts must stay explicitly internal
5. The manifest writer must fail if a store app is mislabeled as
   `internal-alpha-review`, or if the Suite is mislabeled as `store-review`
