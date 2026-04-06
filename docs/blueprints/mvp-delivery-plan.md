# Shopflow MVP Delivery Plan

- Status: Accepted
- Date: 2026-03-29
- Owners: Shopflow Delivery
- Related:
  - [ADR-002: Release Wave and Product Tiering](../adr/ADR-002-release-wave-and-product-tiering.md)
  - [Store Capability Priority Matrix](../contracts/store-capability-priority-matrix.md)
  - [Store Adapter Contract](../contracts/store-adapter-contract.md)
  - [Shopflow Product Surface Spec](../ui/shopflow-product-surface-spec.md)
  - [Legacy Metadata Migration Runbook](../runbooks/legacy-metadata-migration.md)

## Purpose

This blueprint answers four questions:

1. which three apps are built first
2. what each wave delivers
3. how work should be split across agents
4. what counts as done

In plain language:

> this is the build order and the handoff map.

## Final-Scope Reminder

All `8` Store apps and `1` Suite app remain in final scope.

This blueprint stages delivery. It does not shrink the product family.

## MVP Definition

The first practical MVP wave is:

- `Shopflow for Albertsons Family`
  - verified scope: `Safeway`
- `Shopflow for Amazon`
- `Shopflow for Target`

Why these three:

- `Albertsons/Safeway` proves the differentiated action-heavy path
- `Amazon` proves the highest-value acquisition shell
- `Target` proves the balanced read + deals path

This gives Shopflow:

- one action-heavy product
- one high-acquisition shell
- one balanced shell with richer product story

## Delivery Waves

### Wave 0 — Foundation

Goal:

- make the repo buildable and contract-driven before any app pretends to be real

Required outputs:

- monorepo scaffold
- package boundaries
- contracts package
- runtime package
- UI package skeleton
- testkit skeleton
- migration baseline snapshot

### Wave 1 — MVP Release Apps

Apps:

- `ext-albertsons`
- `ext-amazon`
- `ext-target`

Required outputs:

- working adapters for these stores
- thin app shells
- Side Panel home surface
- Popup launcher
- minimum verification bar for all three apps

### Wave 2 — Expansion Shells

Apps:

- `ext-costco`
- `ext-walmart`
- `ext-temu`

Required outputs:

- reuse proven architecture without contract drift
- extend fixtures, contract tests, and E2E smoke coverage

### Wave 3 — Completion Wave

Apps:

- `ext-kroger`
- `ext-weee`
- `ext-shopping-suite`

Required outputs:

- Kroger family public-claim-safe release
- Weee shell release
- first Suite release as composition shell + capability navigator

## Delivery Strategy

### Core Rule

Do not parallelize work that depends on unresolved contracts.

Do parallelize work once file boundaries and contract surfaces are locked.

### Required Sequence

1. freeze contracts
2. scaffold shared packages
3. scaffold runtime and UI shell
4. implement Wave 1 adapters and apps
5. verify Wave 1
6. move to Wave 2 and Wave 3

## Agent Split Plan

This is the recommended split for zero-context agents.

### Lane A — Repo Foundation

Ownership:

- root workspace files
- package scaffolding
- build/test tooling entry

Responsibilities:

- create workspace layout
- create package shells
- create app shells
- wire baseline WXT + TypeScript + workspace config

DoD:

- repo installs cleanly
- workspace graph exists
- app and package boundaries are materialized

### Lane B — Contracts

Ownership:

- `packages/contracts`
- schema and type layer

Responsibilities:

- implement Store Adapter contract types
- implement capability state types
- implement action receipt types
- implement public claim boundary types

DoD:

- all Wave 1 stores can be described without missing contract concepts
- contract tests can target the types without gaps

### Lane C — Runtime + Surface Skeleton

Ownership:

- `packages/runtime`
- `packages/ui`
- base Side Panel and Popup routing

Responsibilities:

- create runtime messaging
- create storage repository
- create side panel open/close flow
- create Side Panel home shell
- create Popup launcher

DoD:

- app surfaces can render from view-model input
- no store adapter imports UI
- no UI component reaches into raw DOM directly

### Lane D — Albertsons / Safeway

Ownership:

- `packages/store-albertsons`
- `apps/ext-albertsons`

Responsibilities:

- implement Safeway verified scope support
- support product/search/deals/action capability surface
- uphold public claim boundary

DoD:

- product/search/deal extraction contract passes
- action receipt contract passes
- live receipt bar exists for action claims

### Lane E — Amazon

Ownership:

- `packages/store-amazon`
- `apps/ext-amazon`

Responsibilities:

- implement product/search shell
- keep app thin and acquisition-oriented

DoD:

- product/search capabilities pass fixture + contract + E2E smoke

### Lane F — Target

Ownership:

- `packages/store-target`
- `apps/ext-target`

Responsibilities:

- implement product/search/deals shell
- preserve Target deals as the differentiated hook

DoD:

- deals support passes fixture + contract + E2E smoke

## Suggested Parallelism

After Lane A and Lane B freeze the contract and scaffold boundaries:

- Lane C may run in parallel with Lanes D/E/F
- Lanes D/E/F may run in parallel with disjoint store ownership

Do not start Wave 2 store implementation before Wave 1 verification bar is green enough to prove the architecture.

## Per-Wave Deliverables

### Wave 0 Deliverables

- workspace config
- base app directories
- base shared package directories
- migration baseline artifact
- contracts package v1
- testkit placeholders

### Wave 1 Deliverables

- `ext-albertsons`
- `ext-amazon`
- `ext-target`
- shared Side Panel home
- Popup launcher
- Wave 1 verification evidence

### Wave 2 Deliverables

- `ext-costco`
- `ext-walmart`
- `ext-temu`
- extension of fixtures and tests

### Wave 3 Deliverables

- `ext-kroger`
- `ext-weee`
- `ext-shopping-suite`
- family-scope claim-safe copy for Kroger
- Suite composition navigation

## DoD Levels

### Task DoD

A single task is done only when:

1. file ownership stayed inside approved boundaries
2. new code conforms to contracts
3. required tests for that slice exist and pass
4. no new undocumented assumption was introduced

### Wave DoD

A wave is done only when:

1. all apps in that wave exist
2. fixtures exist for declared supported page kinds
3. contract tests pass for affected adapters
4. runtime integration remains green
5. E2E smoke passes for each wave app
6. any required live receipts exist
7. public claim wording stays inside verified scope

### Repo DoD

Shopflow is not "done" until all three waves complete.

Final repo DoD:

1. all `8+1` apps are materialized
2. all apps are backed by the shared architecture, not one-off hacks
3. legacy metadata is no longer a runtime dependency
4. verification bar is enforceable
5. public claim boundaries are explicit and honest

## What Agents Must Not Do

1. do not treat Wave 1 as the final product boundary
2. do not silently drop lower-priority apps from total scope
3. do not create app-to-app imports
4. do not bypass contracts to move faster
5. do not overclaim family support before verified scope evidence exists

## Immediate Start Order

If work starts now, the next order is:

1. scaffold workspace and package graph
2. implement `packages/contracts`
3. implement `packages/runtime`
4. implement `packages/ui` surface skeleton
5. implement `store-albertsons`
6. implement `store-amazon`
7. implement `store-target`
8. wire `ext-albertsons`, `ext-amazon`, `ext-target`
9. run Wave 1 verification
