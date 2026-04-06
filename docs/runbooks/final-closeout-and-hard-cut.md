# Final Closeout and Hard-Cut Runbook

- Status: Accepted
- Date: 2026-04-06
- Owners: Shopflow Delivery + Release Engineering
- Related:
  - [Testing and Verification Bar](../contracts/testing-and-verification-bar.md)
  - [Sensitive Surface Incident Response Runbook](./sensitive-surface-incident-response.md)
  - [Release Artifact Review Runbook](./release-artifact-review.md)

## Purpose

This runbook defines the final closeout decision tree for Shopflow.

In plain language:

> first lock the evidence, then decide whether this house is safe to repair in
> place or whether it is cleaner to move into a new one.

## Four Ledgers

Every final closeout judgment must keep these ledgers separate:

1. `repo-side engineering`
2. `delivery landed`
3. `git closure`
4. `external blocker`

Never flatten these into one `done / not-done` sentence.

## Truth Anchor First

Before any destructive action:

1. record:
   - `git status --short --branch`
   - `git branch -a`
   - `git worktree list`
   - `git remote -v`
   - `git log --oneline --decorate -n 12`
   - `gh pr list`
   - `gh issue list`
   - `gh run list`
   - `gh release list`
2. create rollback assets:
   - a named backup branch
   - a `git bundle` or mirror clone
3. keep the current tree intact until the new route is verified

## Route Selection

### Route A — In-place closeout

Prefer in-place closeout only when all are true:

- current reachable Git history is already clean enough for the sensitive-history gate
- public fallback surfaces are clean
- remaining work is primarily repo-owned governance, truthful CI, docs sync, or Git landing
- no hard-cut is required to remove historical or platform residue

### Route B — Hard cut

Prefer hard cut immediately when any of these is true:

- reachable Git history still carries real sensitive residue
- old raw / cache / search / public surfaces can still expose stale sensitive content
- the current canonical history is too messy to remain the long-term trusted entry
- the repo needs a new clean linear history with `<= 10` explanatory commits
- platform residue or history residue means the current repo should not stay the canonical long-lived entry

In plain language:

> if the plumbing inside the walls is contaminated, do not keep repainting the
> old house and call it closed.

## Platform Capability Truth

GitHub-native security features must be reported honestly:

- `Code Scanning`
- `Secret Scanning`
- `Dependabot alerts`
- `Vulnerability alerts`

Rules:

1. if the capability is enabled, zero open alerts is required
2. if the capability is disabled or unavailable for the current repo/platform,
   record it as a platform capability gap instead of pretending the code failed
3. platform capability gaps do not erase repo-owned responsibilities such as
   `verify:sensitive-history` or `verify:sensitive-public-surface`

## Hard-Cut Minimum

If Route B wins, finish the whole chain in one program:

1. protect the old tree and truth anchor
2. rebuild a clean linear history offline
3. create the new canonical repo
4. push the rebuilt history
5. migrate P0 GitHub settings
6. migrate required package / public distribution / metadata references
7. validate clone, CI, and distribution surfaces
8. retire or rename the old canonical entry
9. clean up staging and migration residue

## Verdict Rules

### `FULLY_CLEAN_AND_CLOSED`

Allowed only when:

- current canonical history is clean
- current worktree is clean
- repo-owned gates are green
- docs and closeout ledgers agree
- nothing repo-owned remains actionable

### `REPO_SIDE_CLEAN_BUT_PLATFORM_RESIDUAL_REMAINS`

Use this when:

- the new or current canonical repo is clean
- but platform-controlled residue still exists outside the repo, such as stale cache/search/index retention

### `BLOCKED_BY_TRUE_EXTERNAL_ONLY`

Use this only for:

- admin-only platform enablement
- billing / auth / CAPTCHA
- official marketplace or store review
- manual evidence review inputs that the repo has already compressed as far as possible

### `NOT_CLEAN_REQUIRES_FURTHER_REPAIR`

Use this only when repo-owned work remains actionable now.

## Non-Negotiable Rules

1. no code loss
2. no fake green CI
3. no flattening platform gaps into code failures
4. no `external-only` wording while repo-owned brakes still exist
5. no hard cut that stops halfway through cutover
