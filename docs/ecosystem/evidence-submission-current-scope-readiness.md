# Evidence and Submission Current-Scope Readiness

This page is the acceptance card for Shopflow's **live-evidence / review-bundle
/ submission-boundary** subline.

In plain language:

> this is the scorecard for the reviewer handoff desk.
> it is **not** the scorecard for every unfinished part of the whole repo.

## What This Page Covers

This page answers:

- how far the repo-owned evidence workflow is already compressed
- whether review bundles, submission-readiness reporting, and runbooks tell the
  same story
- which items are still repo-side actionable inside this subline
- which items are now truly external-only
- whether git closeout is ready yet

It does **not** turn this subline into:

- reviewed live proof
- signed release proof
- actual store-submission proof
- proof that the README top-level brakes disappeared

## Evidence and Submission Acceptance Matrix

| Line item | Status | Why it matters | Evidence anchor | Next owner |
| :--- | :--- | :--- | :--- | :--- |
| Evidence queue states stay mechanically distinct from capture through review outcome | `done` | operators can tell “missing”, “in progress”, “waiting for review”, “reviewed”, “rejected”, and “expired” apart instead of flattening them into one red blob | `packages/runtime/src/storage/evidence-capture-repository.ts`, `packages/ui/src/evidence-section-routing.ts`, `tests/integration/runtime.evidence-capture-repository.test.ts`, `tests/unit/runtime.evidence-section-routing.test.ts` | keep under repo-owned runtime truth |
| Side Panel, Popup, and Suite route operators through the same evidence/review split | `done` | shared surfaces act like three doors into the same hallway instead of three different stories | `packages/ui/src/runtime-surface.tsx`, `packages/ui/src/side-panel-home-page.tsx`, `packages/ui/src/popup-launcher.tsx`, `apps/ext-shopping-suite/src/suite-control-plane-model.ts`, corresponding unit tests | keep under shared surface ownership |
| Reviewer handoff surfaces separate repo-owned status from true external-only blockers | `done` | claim-gated is no longer silently treated as “everything is still repo work” or “everything is already external-only” | `tooling/release/write-submission-readiness-report.ts`, `tests/integration/submission-readiness-report.tooling.test.ts`, `.runtime-cache/release-artifacts/submission-readiness.json` after fresh rerun | release tooling stays repo-owned |
| Review artifact manifest keeps review bundle metadata, bundle completeness, and review-channel separation honest | `done` | reviewers can see what bundle they opened without mistaking it for a signed release | `tooling/release/write-review-artifact-manifest.ts`, `tooling/release/write-artifact-manifest.ts`, `tooling/release/stage-package-artifacts.ts`, `tests/integration/release-review-artifact-manifest.tooling.test.ts` | release tooling stays repo-owned |
| Reviewer/operator docs now give one clearer “where do I start” path | `done` | reviewers do not need to reverse-engineer which file, URL, or runbook comes first | `docs/runbooks/release-artifact-review.md`, `docs/runbooks/live-receipt-capture.md`, `docs/ecosystem/ready-to-sync-artifacts.md`, `docs/README.md` | L1 owns final wording |
| Reviewed live receipt evidence bundles exist for required claim-gated flows | `external only` | this is the real proof gate for capability-heavy public wording, and it cannot be faked inside the repo | `docs/runbooks/live-receipt-capture.md`, `docs/contracts/testing-and-verification-bar.md`, `submission-readiness.json` `externalBlockers` | real merchant session + external review |
| Signed store-ready artifacts and real submission environments exist | `external only` | review bundles are still reviewer packets, not signed releases | `docs/runbooks/release-artifact-review.md`, `submission-readiness.json` `externalBlockers` | signing + platform workflow outside repo |
| Git closeout for the overall Prompt 1-10 worktree | `not done` | this subline can be compressed without pretending the whole repo is already closed clean | `git status --short --branch`, `git diff --stat` | L1 only |

## Repo-Side Still-Actionable Inside This Subline

These items still matter, but they are now **narrow**:

- keep rerunning the serial release-readiness lane so `submission-readiness.json`
  and staged review artifacts stay fresh instead of drifting behind the code
- keep reviewer/operator docs aligned whenever review-start-path truth,
  packaging rules, or external-blocker semantics change
- keep shared runtime surfaces honest about operator routing and review-state
  boundaries when future UX work touches Side Panel / Popup / Suite

## Repo-Global Brakes That Still Exist

These are still real, but they are **not proof that this evidence/submission
subline failed**:

| Repo-global brake | Status | Why it is not this subline's own blocker |
| :--- | :--- | :--- |
| `live receipt evidence bundles` | `external only` | this is the genuine outside-the-repo proof step after repo-owned handoff is clear |
| `store-ready signed extension release artifacts` | `external only` | review bundles still stop at reviewer confidence, not signed-release reality |

## Closeout Readiness Summary

- Evidence/submission line: **repo-side compressed**
- Strongest gate: **must stay serial and trustworthy by fresh evidence**
- Reviewer handoff: **clear enough to start from `submission-readiness.json` instead of guessing**
- Git closeout: **ready for the current repo-owned baseline**, because the
  current local `main` is now landed on `origin/main`
