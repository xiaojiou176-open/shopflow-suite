# Legacy Metadata Migration Runbook

- Status: Accepted
- Date: 2026-03-29
- Owners: Shopflow Migration
- Related:
  - [ADR-001: Shopflow Repo Topology and Product Boundary](../adr/ADR-001-shopflow-repo-topology-and-product-boundary.md)
  - [Store Capability Priority Matrix](../contracts/store-capability-priority-matrix.md)
  - [Store Adapter Contract](../contracts/store-adapter-contract.md)
  - [Testing and Verification Bar](../contracts/testing-and-verification-bar.md)

## Purpose

This runbook defines how the legacy Terry shopping metadata moves into Shopflow without creating dual truth.

In plain language:

> the old repo is the inventory sheet;
> Shopflow is the new operating system.

The goal is not to keep both alive forever. The goal is to cut over cleanly.

## Scope

This runbook covers only the shopping line migrating from the legacy Terry workspace into Shopflow.

Covered migration sources:

- legacy `metadata/scripts.json`
- legacy `metadata/install-manifest.json`

Covered migration targets:

- Shopflow `packages/contracts`
- Shopflow `packages/store-*`
- Shopflow `apps/ext-*`
- Shopflow verification surfaces

Not covered:

- reader line migration
- AI export line migration
- legacy installer preservation as a runtime dependency
- public release process outside Shopflow

## Current Baseline Snapshot

Legacy live snapshot used as migration input:

- total scripts: `48`
- shopping scripts: `25`
- AI export scripts: `4`
- remaining scripts: `19`

The `25` shopping scripts are the only scripts migrated into Shopflow.

## Hard Migration Rule

> Legacy metadata is migration input only.  
> It is not Shopflow runtime truth.

After cutover, Shopflow runtime, UI, tests, and release surfaces must not read legacy metadata directly.

## Future Shopflow Source of Truth

After migration, canonical truth lives in:

- `packages/contracts`
- `packages/store-*`
- `apps/ext-*`

The intended truth split is:

- `packages/contracts`
  - schema and protocol truth
- `packages/store-*`
  - store behavior truth
- `apps/ext-*`
  - app packaging, host scope, and public surface truth

## Migration Principles

1. **No dual truth**
   - legacy metadata and Shopflow contracts must not both act as runtime truth
2. **No hidden carryover**
   - no silent runtime dependency on Terry metadata paths
3. **No scope creep**
   - only the shopping line migrates in this runbook
4. **No public overclaim**
   - family naming may exist internally, but public claims stay inside verified scope
5. **No data-shape drift**
   - legacy script inventory must be mapped into explicit capability and app contracts

## Migration Phases

### Phase 0 — Freeze the migration baseline

Purpose:

- prevent moving-target migration

Actions:

1. declare the migration snapshot date
2. read legacy `metadata/scripts.json`
3. read legacy `metadata/install-manifest.json`
4. confirm the input counts still match:
   - `48 / 25 / 4 / 19`

Outputs:

- `.runtime-cache/migration/legacy-shopping-baseline.json`
- `.runtime-cache/migration/legacy-install-baseline.json`

Exit criteria:

- counts are confirmed
- no unresolved mismatch between inventory and install manifest

### Phase 1 — Build the migration mapping ledger

Purpose:

- turn legacy script inventory into explicit Shopflow targets

Required ledger shape:

| legacySourceId | sourceCategory | targetApp | targetStorePackage | targetCapability | publicClaimScope | notes |
| :------------- | :------------- | :-------- | :----------------- | :--------------- | :--------------- | :---- |

Rules:

- every one of the `25` shopping scripts must map to exactly one primary target app
- a legacy script may inform multiple app surfaces only if shared capability is intentionally modeled via contracts or adapters
- no script may remain unclassified

Suggested output:

- `.runtime-cache/migration/legacy-shopping-mapping.csv`

Exit criteria:

- all `25` shopping scripts are mapped
- target capability names match the Store Adapter contract

### Phase 2 — Stand up Shopflow contracts first

Purpose:

- create the new truth plane before any app shell starts pretending to work

Required contract artifacts:

- `packages/contracts/src/store-adapter.ts`
- `packages/contracts/src/capabilities.ts`
- `packages/contracts/src/action-receipt.ts`
- `packages/contracts/src/public-claim-boundary.ts`
- `packages/contracts/src/store-catalog.ts`

Rules:

- contracts are defined before app shells become executable
- legacy script ids may appear only as migration keys or provenance notes
- legacy naming must not remain the only semantic structure

Exit criteria:

- contract package can represent all `25` migrated shopping capabilities
- verified-scope language is formalized

### Phase 3 — Build store adapters

Purpose:

- convert legacy script logic into store-shaped capability packages

Required packages:

- `packages/store-albertsons`
- `packages/store-kroger`
- `packages/store-amazon`
- `packages/store-costco`
- `packages/store-walmart`
- `packages/store-weee`
- `packages/store-target`
- `packages/store-temu`

Rules:

- adapters own DOM understanding and action execution
- adapters must satisfy the Store Adapter contract
- adapters must not import UI

Exit criteria:

- each migrated store package passes contract tests
- each package truthfully declares `verifiedScopes`

### Phase 4 — Build app shells

Purpose:

- bind each store adapter set to a releaseable app surface

Required apps:

- `apps/ext-albertsons`
- `apps/ext-kroger`
- `apps/ext-amazon`
- `apps/ext-costco`
- `apps/ext-walmart`
- `apps/ext-weee`
- `apps/ext-target`
- `apps/ext-temu`
- `apps/ext-shopping-suite`

Rules:

- app shells are thin
- app shells own host permissions, manifests, icons, and release identity
- app shells must not become logic silos

Exit criteria:

- each app reads from shared contracts/runtime/ui plus its intended store package
- no app imports another app

### Phase 5 — Backfill tests and fixtures

Purpose:

- prove that new truth is real before the old truth is retired

Required minimums:

- fixtures for supported page kinds
- contract tests per adapter
- integration tests for runtime messaging and storage
- E2E smoke per release app
- live receipts for action-heavy claims

Exit criteria:

- verification bar is met for the current wave target

### Phase 6 — Hard cutover

Purpose:

- remove legacy metadata from the Shopflow runtime path

Cutover actions:

1. remove any runtime reads of Terry `metadata/scripts.json`
2. remove any runtime reads of Terry `metadata/install-manifest.json`
3. confirm app surfaces derive support truth from Shopflow contracts and adapters only
4. confirm public claim copy reads from Shopflow claim-boundary truth only

Exit criteria:

- no Shopflow runtime code imports or reads legacy metadata
- legacy metadata is only referenced in migration evidence or historical notes

## App Mapping Summary

| Target App       | Legacy Shopping Scripts |
| :--------------- | ----------------------: |
| `ext-albertsons` |                       5 |
| `ext-kroger`     |                       6 |
| `ext-amazon`     |                       2 |
| `ext-costco`     |                       2 |
| `ext-walmart`    |                       2 |
| `ext-weee`       |                       2 |
| `ext-target`     |                       3 |
| `ext-temu`       |                       3 |
| **Total**        |                  **25** |

## Legacy ID Handling Rule

Legacy ids remain useful during migration, but only in one narrow role:

- `legacySourceId`

They may be preserved in:

- mapping ledgers
- migration evidence
- provenance comments

They must not remain the only primary runtime concept after Shopflow contracts exist.

## Cutover Checklist

Before declaring migration complete, all of the following must be true:

1. baseline counts are confirmed
2. mapping ledger exists for all `25` shopping scripts
3. Shopflow contracts exist and are runtime truth
4. store adapters exist for all `8` store targets
5. app shells exist for all `8+1` products, even if release waves are staged
6. current release-wave apps meet the verification bar
7. no Shopflow runtime path still depends on legacy metadata

## What Must Not Happen

1. Do not let legacy metadata remain a hidden runtime dependency
2. Do not migrate non-shopping product lines in this runbook
3. Do not preserve dual truth because it feels safer
4. Do not keep legacy ids as the only semantic grouping mechanism
5. Do not cut over public claims before verified-scope truth exists in Shopflow
