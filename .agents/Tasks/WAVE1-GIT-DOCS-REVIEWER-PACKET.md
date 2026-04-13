# Shopflow Wave 1 Git + Docs Reviewer Packet

## Scope

This packet covers Wave 1 governance closeout only:

- Git closeout truth
- public docs route cleanup
- SSOT drift correction
- final security + quality gate legitimacy after the cleanup

## Current Truth

- Wave 1 is a governance wave, not a UI polish wave
- `popup / sidepanel / suite` remain historical R4 receipts unless fresh evidence reopens them
- current branch is `builder-fallback-copy-sync`
- PR `#30` is open at packet creation time
- public docs previously routed to:
  - `*.ready.md`
  - `ready-to-sync*.md`
  - `openclaw-publish-unblock-packet.ready.md`
  - acceptance-card scoreboards
- Wave 1 has moved internal sync/unblock/acceptance-card docs under `.agents/Tasks/WAVE1-public-sync/**`

## Required Evidence

- fresh git/remote facts for:
  - `git branch -a -vv`
  - `git worktree list`
  - `git status --short --branch`
  - `gh pr list --repo xiaojiou176-open/shopflow-suite --state open`
  - `git ls-remote --heads origin`
- fresh gates for:
  - `pnpm verify:sensitive-surfaces`
  - `pnpm verify:sensitive-public-surface`
  - `pnpm verify:sensitive-history`
  - `pnpm verify:external-governance`
  - `pnpm verify:release-readiness`
- current diffs in:
  - `README.md`
  - `docs/README.md`
  - `docs/index.md`
  - `docs/ecosystem/**`
  - `packages/contracts/src/**`
  - `packages/runtime/src/builder-outcome-bundle.ts`
  - `tests/integration/**`
  - `.agents/Tasks/WAVE1-GIT-DOCS-GOVERNANCE-LEDGER.md`

## Reviewer Questions

1. Does any public front door still route readers into sync / unblock / acceptance-card packet material?
2. After the latest fresh git check, is there still any evidence-backed blocker against saying `Git closeout done`?
3. Did the cleanup preserve truthful builder/public docs instead of over-pruning real current-scope public docs?
4. Do the fresh governance/security/release gates support the final Wave 1 verdict without fake-green behavior?

## Output Contract

- `Verdict: APPROVED / BLOCKED`
- `Blockers (max 3)`
- `Residual risks`
- `Revisit triggers`
