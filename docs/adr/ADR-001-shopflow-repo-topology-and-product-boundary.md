# ADR-001: Shopflow Repo Topology and Product Boundary

- Status: Accepted
- Date: 2026-03-29
- Owners: Shopflow Architecture
- Related:
  - [ADR-002: Release Wave and Product Tiering](./ADR-002-release-wave-and-product-tiering.md)
  - [Store Adapter Contract](../contracts/store-adapter-contract.md)
  - [Store Capability Priority Matrix](../contracts/store-capability-priority-matrix.md)

## Context

Shopflow is not a continuation of the current Terry_Tampermonkey workspace.

The current Terry workspace is a broad governed scripts factory with multiple surfaces, heavy repo-wide governance, and mixed product lines. The shopping line inside that workspace is already valuable, but it is still packaged as scripts and metadata records rather than as a dedicated browser extension product family.

Current live inventory from the Terry workspace is:

- Total scripts: `48`
- Shopping scripts: `25`
- AI conversation export scripts: `4`
- Remaining scripts: `19`

The shopping line is the only scope that moves into Shopflow.

The business objective is also different from the Terry workspace objective:

- Terry workspace objective: govern and evolve a broad scripts platform
- Shopflow objective: ship a dedicated Chrome-first shopping extension product family that can support multiple Chrome Web Store listings without fragmenting the code source of truth

The design pressure is therefore:

1. Keep multiple storefront entrypoints for acquisition and discoverability
2. Keep exactly one engineering source of truth
3. Avoid turning `8+1` public apps into `9` independent engineering systems
4. Avoid carrying the Terry workspace's full governance surface into a narrower product repo

## Decision

### 1. Shopflow is a completely independent new repository

Shopflow is created as a new repository, not as an in-place evolution of Terry_Tampermonkey.

This means:

- Shopflow has its own Git history
- Shopflow has its own contracts and release logic
- Shopflow does not inherit the Terry repo's root structure as-is
- Terry repo metadata is treated as migration input, not as future runtime truth

### 2. Shopflow uses one Chrome-first monorepo

Shopflow will use one monorepo with a narrow product boundary.

Canonical top-level layout:

```text
shopflow-suite/
  apps/
  packages/
  tests/
  docs/
  tooling/
```

The repo is optimized for browser extension delivery, not for preserving legacy script authoring categories such as `extractors`, `searchers`, `deals`, or `utilities`.

### 3. Product surface is fixed as `8+1` apps

Shopflow owns:

- `8` Store apps
- `1` Suite app

Canonical app set:

- `ext-albertsons`
- `ext-kroger`
- `ext-amazon`
- `ext-costco`
- `ext-walmart`
- `ext-weee`
- `ext-target`
- `ext-temu`
- `ext-shopping-suite`

Public product family:

- `Shopflow for Albertsons Family`
- `Shopflow for Kroger Family`
- `Shopflow for Amazon`
- `Shopflow for Costco`
- `Shopflow for Walmart`
- `Shopflow for Weee`
- `Shopflow for Target`
- `Shopflow for Temu`
- `Shopflow Suite`

### 4. Shared engineering layers are fixed

Canonical shared packages:

- `packages/contracts`
- `packages/core`
- `packages/runtime`
- `packages/ui`
- `packages/testkit`

Canonical store adapter packages:

- `packages/store-albertsons`
- `packages/store-kroger`
- `packages/store-amazon`
- `packages/store-costco`
- `packages/store-walmart`
- `packages/store-weee`
- `packages/store-target`
- `packages/store-temu`

Responsibilities:

- `contracts`: schemas, types, receipts, public claim boundaries
- `core`: orchestration, normalization, shared business rules, action pipeline
- `runtime`: browser messaging, storage repository, permission handling, side panel control
- `ui`: shared design system and extension UI surfaces
- `store-*`: URL matching, DOM probing, selectors, parsing, action handlers, capability declaration

### 5. Suite is a composition shell, not a parallel product system

`ext-shopping-suite` exists to:

- detect the current site
- show available capabilities
- route users to supported actions and result views
- provide a unified navigation surface

`ext-shopping-suite` must not:

- fork shared logic into a second system
- define alternative adapter contracts
- become the only place where advanced capabilities work
- outrun the store apps in contract or runtime semantics

In plain language: Suite is a lobby, not a second building.

### 6. Public claim boundary is stricter than internal package naming

Engineering naming and public claim naming are different concerns.

Internal package names may use family-level grouping:

- `store-albertsons`
- `store-kroger`

Public claims must stay tied to verified scopes:

- `Shopflow for Albertsons Family` must explicitly state that the current verified scope starts with `Safeway`
- `Shopflow for Kroger Family` must explicitly state that the current verified scope is `Fred Meyer + QFC`

This repo must never promote "theoretical family compatibility" as "verified family-wide support".

### 7. Terry metadata is migration input only

The following legacy surfaces are migration sources only:

- Terry `metadata/scripts.json`
- Terry `metadata/install-manifest.json`

They are not future Shopflow runtime truth.

After migration, Shopflow source of truth becomes:

- contracts in `packages/contracts`
- adapter declarations in `packages/store-*`
- app-specific configuration in `apps/ext-*`

## Product Boundary

Shopflow only owns the shopping line.

In scope:

- product extraction
- search result extraction
- deal extraction
- supported shopping actions
- shopping-centric side panel UX
- shopping suite navigation

Out of scope:

- reader / forum / content research scripts
- AI conversation export product line
- account utilities outside shopping
- legacy Tampermonkey installer workflows as a runtime dependency
- carrying over the entire Terry governance stack unchanged

## Alternatives Rejected

### A. Keep building inside Terry_Tampermonkey

Rejected because:

- it preserves the wrong repo boundary
- it keeps shopping product work coupled to unrelated product lines
- it makes extension delivery subordinate to a scripts-factory topology

### B. Create `8` independent GitHub repos

Rejected because:

- Stars fragment
- CI, releases, and issues fragment
- shared logic drifts
- adapter and UI versioning becomes a coordination tax

### C. Build one giant shopping app only

Rejected because:

- it sacrifices storefront discoverability
- it weakens host-specific value propositions
- it removes narrow-permission entrypoints

### D. Split `core` and `ui` into their own standalone repos

Rejected because:

- it adds versioning and release coordination too early
- it turns internal packages into premature public infrastructure
- it makes migration harder rather than easier

## Consequences

### Positive

- Multiple public entrypoints with one engineering source of truth
- Clear app boundary and shared package boundary
- Suite remains additive rather than parasitic
- Future store expansion becomes "new adapter + new app shell", not "new repo universe"

### Negative

- Shopflow needs its own contracts, docs, and release bar from day one
- Family-level naming requires public-claim discipline
- Migration must be explicit; no silent metadata dependency can remain

## Hard Rules

1. `apps/*` must never import each other
2. Shared logic flows through `packages/*` only
3. `packages/ui` must not import `packages/store-*`
4. `packages/contracts` must stay runtime-free
5. Suite must not introduce a second logic plane
6. Terry metadata must not survive as a hidden runtime SSOT after migration

## Follow-up Documents

This ADR is only complete when the following documents are also treated as binding:

- [ADR-002: Release Wave and Product Tiering](./ADR-002-release-wave-and-product-tiering.md)
- [Store Adapter Contract](../contracts/store-adapter-contract.md)
- [Store Capability Priority Matrix](../contracts/store-capability-priority-matrix.md)
- [Testing and Verification Bar](../contracts/testing-and-verification-bar.md)
