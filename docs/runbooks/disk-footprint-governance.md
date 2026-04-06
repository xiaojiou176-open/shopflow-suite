# Disk Footprint Governance Runbook

- Status: Accepted
- Date: 2026-04-04
- Owners: Shopflow Delivery + Runtime Hygiene
- Related:
  - [Live Receipt Capture Runbook](./live-receipt-capture.md)
  - [Release Artifact Review Runbook](./release-artifact-review.md)
  - [README](../../README.md)

## Purpose

This runbook defines how Shopflow keeps its own generated residue:

- repo-local when it belongs inside the repo
- repo-external but still Shopflow-owned when it belongs under
  `~/.cache/shopflow/**`
- auditable
- safe to clean
- clearly separated from shared or machine-wide storage

In plain language:

> Shopflow should clean up its own workbench.
> It should not wander out and start throwing away things from the whole house.

## Cache and Artifact Taxonomy

Shopflow now recognizes **two owned cache zones**.

### Repo-local artifact classes

| Category | Canonical path(s) | Meaning | Default cleanup posture |
| :--- | :--- | :--- | :--- |
| `release-artifacts` | `.runtime-cache/release-artifacts/` | review bundles, manifest, submission-readiness report | explicit cleanup only |
| `live-browser` | `.runtime-cache/live-browser/` | operator browser preflight / diagnose / probe / trace breadcrumbs | retained with pruning |
| `builder` | `.runtime-cache/builder/` | generated builder read-model payloads | disposable, rebuildable |
| `cli` | `.runtime-cache/cli/` | repo-local read-only CLI payloads | disposable, rebuildable |
| `coverage` | `.runtime-cache/coverage/`, `coverage/` | coverage output | disposable |
| `temp` | `.runtime-cache/temp/`, `.runtime-cache/e2e-browser/` | temp files and E2E Chromium user-data-dir residues | disposable |
| `logs` | `.runtime-cache/*.log` | operator / verification logs | disposable |
| `build-output` | `apps/*/.output/`, `test-results/`, `playwright-report/` | built extension bundles and test outputs | disposable |
| `wxt-cache` | `apps/*/.wxt/` | WXT cache | disposable |
| `dependencies` | `node_modules/` | repo-local dependency truth | keep unless intentionally resetting dependencies |

### Shopflow-owned external cache classes

| Category | Canonical path(s) | Meaning | Default cleanup posture |
| :--- | :--- | :--- | :--- |
| `browser-state` | `~/.cache/shopflow/browser/chrome-user-data/` | dedicated Chrome user-data root for Shopflow live/dev/browser work | persistent; explicit reset/reseed only |
| `external-cache` | `~/.cache/shopflow/pnpm-store/` | Shopflow-owned pnpm store | auto-prune by TTL, then cap |
| `external-cache` | `~/.cache/shopflow/ms-playwright/` | Playwright browser downloads for local Shopflow automation | auto-prune by TTL, then cap |
| `external-cache` | `~/.cache/shopflow/webkit-playwright/` | reserved WebKit cache namespace for future local Shopflow tooling | auto-prune by TTL, then cap |
| `external-cache` | `~/.cache/shopflow/tmp/` | Shopflow-owned external temp area | auto-prune by TTL, then cap |

Default external cache contract:

- `SHOPFLOW_CACHE_DIR=~/.cache/shopflow`
- `SHOPFLOW_CACHE_TTL_DAYS=3`
- `SHOPFLOW_CACHE_MAX_BYTES=2147483648`

## Operator Commands

Use these repo-native commands:

```bash
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

Rules:

- cleanup defaults to dry-run
- only `--apply` performs deletion
- repo-local cleanup only deletes repo-root descendants
- `cleanup:external-cache` only deletes paths inside `~/.cache/shopflow/**`
- `cleanup:docker` only deletes resources carrying the Shopflow Docker label
- the dedicated browser root is not part of `cleanup:external-cache`

## Cleanup Policy

### `pnpm cleanup:runtime-cache`

This clears disposable runtime residue:

- `.runtime-cache/coverage/`
- `.runtime-cache/temp/`
- `.runtime-cache/builder/`
- `.runtime-cache/cli/`
- `.runtime-cache/e2e-browser/`
- `.runtime-cache/*.log`

It also prunes `live-browser` breadcrumbs with a retention policy:

- keep all `*-latest.json`
- keep the newest `5` `trace-*` bundle directories
- delete older timestamped live-browser JSON older than `7` days

It does **not** delete:

- `.runtime-cache/release-artifacts/`
- checked-in docs or examples
- machine-wide caches

### `pnpm cleanup:external-cache`

This clears only Shopflow-owned **disposable** external cache paths under
`~/.cache/shopflow/`.

Policy:

1. prune cache entries older than `3` days
2. if the remaining Shopflow-owned external cache still exceeds `2 GB`, trim by
   LRU until it drops below the cap

This command may delete:

- stale pnpm-store subtrees under `~/.cache/shopflow/pnpm-store/`
- stale or oversized Playwright browser cache entries under
  `~/.cache/shopflow/ms-playwright/`
- stale or oversized entries under `~/.cache/shopflow/webkit-playwright/`
- stale or oversized temp entries under `~/.cache/shopflow/tmp/`

It does **not** touch:

- `~/.cache/shopflow/browser/chrome-user-data/**`
- `~/.cache/shopflow/browser/backups/**`
- non-Shopflow `~/.cache/**`
- `~/Library/**`
- repo-local MCP/tool state such as `.serena/**`
- the real Chrome profile root
- Docker data roots
- shared caches owned by other repos

### `pnpm cleanup:build-output`

This clears disposable build/test outputs:

- `apps/*/.output/`
- `apps/*/.wxt/`
- `coverage/`
- `test-results/`
- `playwright-report/`

### `pnpm cleanup:release-artifacts`

This only clears:

- `.runtime-cache/release-artifacts/`

Use it only after reviewer handoff is no longer needed.

### `pnpm cleanup:docker`

This only targets Docker resources labeled with:

- `com.shopflow.repo=shopflow-suite`

It is dry-run by default. It does **not**:

- delete `~/Library/Containers/com.docker.docker`
- clean Docker Desktop's machine-wide root
- touch unlabeled containers, images, volumes, or networks

## Machine-Wide Boundaries

The following are out of scope for Shopflow repo-native cleanup:

- `/private/var/folders/**`
- `com.google.Chrome.code_sign_clone`
- `~/Library/**`
- non-Shopflow `~/.cache/**`
- repo-local MCP/tool state such as `.serena/**`
- the default Chrome root under `~/Library/Application Support/Google/Chrome`
- shared caches owned by other repos
- Docker roots such as `~/Library/Containers/com.docker.docker`

Why:

- these paths are machine-wide, not repo-owned
- multiple tools or repos may write there
- deleting them from a repo-local helper would be an overreach

## pnpm Store Boundary

Shopflow now expects its own pnpm store to resolve to:

- `~/.cache/shopflow/pnpm-store`

That does **not** change the repo-local dependency truth:

- `node_modules/` remains the repo-local dependency tree
- the Shopflow-owned pnpm store is still disposable cache, not canonical source
- any pnpm store outside `~/.cache/shopflow/**` is treated as shared and
  out-of-scope for Shopflow auto-cleanup

In plain language:

> the pantry may be shared, but the groceries on Shopflow's kitchen counter are
> still Shopflow's own local ingredients.

## E2E Chromium Temp Profiles

Extension smoke tests now create temp Chromium user-data-dir roots under:

- `.runtime-cache/e2e-browser/`

This keeps interrupted test residue inside the repo instead of relying on the
system temp tree.

Normal success and failure cleanup still tries to remove those directories
immediately. The repo-local cleanup commands exist for the cases where:

- the process is interrupted
- a local run is abandoned
- the operator wants to reset the repo-local browser residue explicitly

## Hosted-First Guardrail

This runbook does not change Shopflow's Hosted-First direction.

It does **not**:

- switch CI to `self-hosted`
- add Docker-heavy local CI as the default path
- turn machine-wide cleanup into a normal repo command
- turn a local helper run into CI fact

The purpose is narrower:

> keep Shopflow's own residue inside Shopflow's own fence.

Standard CI remains:

- GitHub Actions on `ubuntu-latest`

## Canonical Live Profile Boundary

Shopflow's canonical live/dev/browser root defaults are:

- user data dir: `~/.cache/shopflow/browser/chrome-user-data`
- profile directory: `Profile 1`
- profile name: `shopflow`

Those defaults stay environment-configurable through the existing
`SHOPFLOW_LIVE_*` variables. They apply to:

- `pnpm browser:seed-profile`
- `pnpm preflight:live`
- `pnpm diagnose:live`
- `pnpm probe:live`
- `pnpm open:live-browser`
- local interactive browser / CDP / DOM / console workflows

They do **not** apply to smoke/E2E/CI:

- smoke/E2E still use isolated Playwright browsers
- repo-local temp browser residue for those paths stays under
  `.runtime-cache/e2e-browser/`
- the default Chrome root under `~/Library/Application Support/Google/Chrome`
  is migration input only, not the canonical live root anymore
