# Shopflow Wave 1 Git + Docs Governance Ledger

> Status: active Wave 1 SSOT
> Owner: current L1 coordinator
> Supersedes as live governance truth:
> - `.agents/Tasks/UIUX-EXTREME-ENDGAME-2026-04-12-R4.md`
> - `.agents/Tasks/EXACT_EXTERNAL_BLOCKER_PACKETS-4月12日-post-r4-merge.md`
> Scope: `Git closeout + docs governance closeout`

## 1. Current Stage Goal

Finish the governance tail without reopening solved product-surface work:

- keep `popup / sidepanel / suite` as historical extension-surface receipts
- move sync/unblock/acceptance packets off the public docs shelf
- close branch / PR / remote residue onto `main`
- stop only when repo-owned governance residue is zero and the remaining gaps are truly external-only

In plain language:

> Wave 1 is not “make the UI prettier.”
> Wave 1 is “clear the wrong paperwork off the front desk, then actually lock the branch cabinet.”

## 2. Five-Layer Truth Ledger

### repo-side

- extension surfaces remain strong enough from R4; no fresh evidence currently says `popup / sidepanel / suite` must re-enter main scope
- public docs governance is still actionable now
- the main docs problem is not “builder docs exist”; it is that sync packets, unblock packets, and acceptance-card surfaces were mixed into public routes
- Wave 1 has already started moving these internal sync files under `.agents/Tasks/WAVE1-public-sync/**`

### worktree

- current branch is still `builder-fallback-copy-sync`
- PR `#30` is still open
- this branch now contains:
  - the existing one-line builder fallback copy fix
  - Wave 1 docs-governance edits
  - Wave 1 SSOT / reviewer packet edits

### git_or_remote

- local long-lived target must be `main`
- fresh remote heads currently still include:
  - `origin/main`
  - `origin/builder-fallback-copy-sync`
- stale local remote refs previously still showed:
  - `origin/builder-example-refresh`
  - `origin/live-lane-packet-refinement`
  - `origin/uiux-r4-closeout-signed`
- Git closeout is **not done yet** until:
  - PR `#30` is merged or explicitly retired
  - current worktree lands on `main`
  - stale remote refs are pruned and re-checked

### live_or_public

- public front doors that should stay public:
  - `README.md`
  - `docs/README.md`
  - `docs/index.md`
  - product boundary / verification / review runbooks
  - truthful builder/public docs such as `builder-start-here`, `builder-read-models`, `integration-recipes`, `agent-quickstarts`, `codex-quickstart`, `claude-code-quickstart`, `mcp-quickstart`, `openclaw-*`
- internal sync / unblock / acceptance-card material is no longer allowed to be routed from public front doors
- release shelf `v0.1.0` is still a real public shelf, but it is not current tip truth

### owner-decision

- `forward-only cleanup` is the chosen path right now
- `rewrite / hard-cut` is **not triggered yet**
- this can only change if fresh security / sensitive-surface checks show real sensitive or high-risk exposure that forward-only cleanup cannot honestly contain

## 3. Chosen Path

Current chosen path:

1. lock a new Wave 1 SSOT
2. downgrade old R4/external-only verdicts into historical receipts
3. remove public routing to sync / unblock / acceptance-card material
4. keep public builder docs truthful and product-secondary
5. rerun security + quality gates
6. merge / close PR `#30`
7. refresh git truth on `main`

## 4. Docs Classification

### keep public

- `README.md`
- `docs/README.md`
- `docs/index.md`
- `docs/ecosystem/builder-start-here.md`
- `docs/ecosystem/builder-read-models.md`
- `docs/ecosystem/builder-surfaces.md`
- `docs/ecosystem/integration-recipes.md`
- `docs/ecosystem/agent-and-mcp-positioning.md`
- `docs/ecosystem/agent-distribution-artifacts.md`
- `docs/ecosystem/agent-quickstarts.md`
- `docs/ecosystem/codex-quickstart.md`
- `docs/ecosystem/claude-code-quickstart.md`
- `docs/ecosystem/mcp-quickstart.md`
- `docs/ecosystem/openclaw-comparison.md`
- `docs/ecosystem/openclaw-public-ready-matrix.md`

### moved internal

- `.agents/Tasks/WAVE1-public-sync/public-copy.ready.md`
- `.agents/Tasks/WAVE1-public-sync/ready-to-sync-public-copy.md`
- `.agents/Tasks/WAVE1-public-sync/release-body.ready.md`
- `.agents/Tasks/WAVE1-public-sync/repo-description.ready.md`
- `.agents/Tasks/WAVE1-public-sync/ready-to-sync-artifacts.md`
- `.agents/Tasks/WAVE1-public-sync/openclaw-publish-unblock-packet.ready.md`
- `.agents/Tasks/WAVE1-public-sync/builder-current-scope-readiness.md`
- `.agents/Tasks/WAVE1-public-sync/evidence-submission-current-scope-readiness.md`

## 5. README Top-Brake Matrix

| Brake | Current Status | Meaning |
| :--- | :--- | :--- |
| `live receipt evidence bundles are not yet in place` | active | public support claims still stay claim-gated |
| `store-ready signed extension release artifacts are not yet in place` | active | release shelf is still a reviewer shelf, not a store shelf |

## 6. Repo-Owned Done / Not-Done

### repo-owned done

- current-truth baseline locked across docs + git + remote + release shelf
- Wave 1 route chosen as forward-only cleanup
- internal sync/unblock/acceptance-card docs have been removed from the public docs shelf

### repo-owned not-done

- final public-route validation after docs edits
- old R4 / external-only receipts still need downgrade notes so they stop pretending to be live SSOT
- final fresh gate run still pending

### git / landing done

- open PR and active branch residue have been identified precisely
- current PR diff is narrow and clean enough to be reviewed as part of Wave 1 closeout

### git / landing not-done

- PR `#30` still open
- current local branch still not `main`
- final prune / remote ref verification not rerun yet

### true external blockers

- none yet at the Wave 1 governance layer
- external-only status can be restored only after Git closeout and docs governance both verify cleanly

## 7. Required Verification

### Git / remote

- `git branch -a -vv`
- `git worktree list`
- `git status --short --branch`
- `gh pr list --repo xiaojiou176-open/shopflow-suite --state open`
- `git ls-remote --heads origin`

### Security / governance

- `pnpm verify:sensitive-surfaces`
- `pnpm verify:sensitive-public-surface`
- `pnpm verify:sensitive-history`
- `pnpm verify:external-governance`

### Strongest repo-owned gate

- `pnpm verify:release-readiness`

## 8. Done When

Wave 1 is done only when:

1. public docs stop routing to sync / unblock / acceptance-card packet material
2. current work lands on `main`
3. open PR list becomes empty for this wave
4. remote branch residue matches the closeout claim
5. fresh security + governance + release-readiness checks are green
6. the only remaining blockers are genuinely external-only:
   - reviewed live evidence
   - signed/store-ready artifacts
   - store/platform submission
