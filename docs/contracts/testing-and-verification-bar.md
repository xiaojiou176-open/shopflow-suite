# Testing and Verification Bar

- Status: Accepted
- Date: 2026-03-29
- Owners: Shopflow Quality
- Related:
  - [ADR-002: Release Wave and Product Tiering](../adr/ADR-002-release-wave-and-product-tiering.md)

## Purpose

This document defines the minimum evidence required before Shopflow can claim:

- a store is supported
- a capability is working
- an action is safe to expose
- a family-level app can publicly reference its verified scope

The goal is simple:

> no fresh evidence, no support claim.

Verification guards should also fail readably.

In plain language:

> when Shopflow blocks a release path, it should say which contract surface drifted, not just flash a red light.

## Verification Levels

Shopflow uses five verification levels.

### Level 0 — Fixture

Purpose:

- prove parser and detector logic against stable, de-identified inputs

Examples:

- product page fixture
- search page fixture
- deal page fixture
- action-before / modal / after fixtures

### Level 1 — Contract Test

Purpose:

- prove every adapter satisfies the Store Adapter contract

Examples:

- `matches` correctness
- `detect` capability declaration
- schema-safe output checks
- `runAction` receipt shape checks

### Level 2 — Integration Test

Purpose:

- prove runtime plumbing works across browser contexts

Examples:

- messaging
- storage repository
- permission guard behavior
- side panel open/close logic

### Level 3 — E2E

Purpose:

- prove the extension actually loads and the user journey works in a browser

Examples:

- app loads
- side panel opens
- supported capability card is rendered correctly
- main happy path can execute

### Level 4 — Live Receipt

Purpose:

- prove high-risk public claims and action workflows have evidence from a real site interaction

Examples:

- Safeway Schedule & Save subscribe run
- Safeway Schedule & Save cancel run
- family-scope claim evidence tied to a verified banner

## Minimum Bar by Product Tier

| Tier                     | Fixture  | Contract | Integration |   E2E    |                                            Live Receipt                                            |
| :----------------------- | :------: | :------: | :---------: | :------: | :------------------------------------------------------------------------------------------------: |
| Storefront Shell         | Required | Required |  Required   | Required | Recommended by default, required for public verified-scope claims outside trivial single-host copy |
| Capability-heavy Product | Required | Required |  Required   | Required |                                            **Required**                                            |

## Minimum Bar by Capability Type

| Capability        | Fixture  | Contract |   E2E    |                        Live Receipt                        |
| :---------------- | :------: | :------: | :------: | :--------------------------------------------------------: |
| `extract_product` | Required | Required | Required | Optional unless the release claim depends on live evidence |
| `extract_search`  | Required | Required | Required | Optional unless the release claim depends on live evidence |
| `extract_deals`   | Required | Required | Required |                        Recommended                         |
| `run_action`      | Required | Required | Required |                        **Required**                        |

## Fixture Bar

### Directory Convention

```text
tests/fixtures/<store-id>/<page-kind>/
```

Examples:

```text
tests/fixtures/albertsons/product/
tests/fixtures/albertsons/cart/
tests/fixtures/albertsons/manage/
tests/fixtures/amazon/search/
tests/fixtures/target/deal/
```

### Minimum Counts

| Page Kind / Capability | Minimum Fixture Requirement                                                    |
| :--------------------- | :----------------------------------------------------------------------------- |
| `product`              | at least `1` de-identified HTML fixture                                        |
| `search`               | at least `1` de-identified HTML fixture                                        |
| `deal`                 | at least `1` de-identified HTML fixture                                        |
| action-capable page    | at least `3` fixtures: pre-action, in-flow/modal, post-action or failure state |

### Fixture Rules

1. Fixtures must be de-identified
2. Fixtures must be stable enough for contract tests
3. Fixtures must not include secrets or user-owned data
4. A new capability is not real until a matching fixture exists

## Contract Test Bar

### Directory Convention

```text
tests/contract/
```

Suggested file shape:

```text
tests/contract/store-albertsons.contract.test.ts
tests/contract/store-amazon.contract.test.ts
```

### Every Adapter Must Prove

1. `matches(url)` accepts owned URLs and rejects foreign URLs
2. `detect()` returns `storeId`, `pageKind`, `verifiedScopes`, and `capabilityStates`
3. every extractor output passes schema parsing
4. missing capabilities are expressed via omitted methods and non-ready capability states
5. `runAction()` returns a complete `ActionReceipt` when supported
6. catalog-level parity guards keep app packaging, app definitions, and review surfaces aligned
7. sensitive-surface gates must pass for both the current worktree and reachable Git history before verification can claim clean repo-owned closeout

## Sensitive Surface Gate

Current verification treats the following as blocker-grade residue:

1. secrets, tokens, private keys, or high-entropy credential-looking field values
2. user-specific absolute filesystem paths such as `/Users/<name>/...`, `/home/<name>/...`, or `C:\\Users\\<name>\\...`
3. personal email addresses
4. committed `.env` files or committed log/db/key/certificate artifacts

This gate is enforced in two layers:

1. `pnpm verify:sensitive-surfaces` scans tracked plus non-ignored worktree files
2. `pnpm verify:sensitive-history` scans reachable Git history
3. `pnpm verify:sensitive-public-surface` scans the GitHub-hosted public fallback repos plus their issue / PR / release text surfaces
4. `pnpm verify:github-platform-security` reports whether GitHub-native security surfaces are enabled and whether enabled surfaces still carry open alerts

In plain language:

> a repo is not clean just because HEAD looks clean; if the live tree or the
> reachable history or public fallback surface still contains sensitive residue,
> verification must fail.

## Integration Test Bar

### Directory Convention

```text
tests/integration/
```

### Runtime Integration Must Cover

1. browser messaging
2. storage repository behavior
3. permission request / denial flow
4. side panel enable / disable routing
5. error propagation from adapter/runtime into UI-friendly state

The runtime layer is not considered stable until integration tests prove these paths.

## E2E Bar

### Directory Convention

```text
tests/e2e/
```

Suggested file shape:

```text
tests/e2e/ext-amazon.smoke.spec.ts
tests/e2e/ext-albertsons.smoke.spec.ts
tests/e2e/ext-shopping-suite.smoke.spec.ts
```

### Minimum Per App

Every released app must have at least one browser-level smoke path proving:

1. extension loads successfully
2. side panel or popup entry opens as designed
3. current page detection succeeds
4. at least one primary capability renders as expected
5. unsupported or permission-needed states render honestly when applicable

### Capability-heavy Extra Requirement

For `Capability-heavy Product` apps, E2E must additionally prove:

- action controls only appear when capability state allows them
- partial failure is surfaced honestly
- the app does not pretend a blocked action is runnable

## Verification Failure Case Rule

Mechanical guards should prefer category-tagged failures such as:

- `[path]`
- `[fixture]`
- `[claim-boundary]`
- `[review-start-path]`
- `[packaging]`
- `[suite]`

This keeps local and CI drift triage readable instead of turning every failure
into a black box.

For release-readiness tooling, the parity layer should also keep these surfaces
mechanically aligned:

- app host matches vs catalog host + route patterns
- reviewer start hosts and derived reviewer start URLs vs extension host coverage
- family verified-scope copy vs app-definition wording
- required live-evidence wiring vs capture-plan requirements
- single-app review bundle completeness vs repo-owned packaging expectations

Reviewer start-path rule:

- derive the reviewer start URL from the first `defaultHosts` entry in the shared store catalog
- do not let parity tooling or release reporting invent ad hoc review URLs outside that contract source

## Live Receipt Bar

Live receipts are mandatory for:

1. any public claim about `run_action`
2. any family-scope public claim
3. any launch headline that depends on differentiated workflow proof

### Live Receipt Must Include

- app id
- store id
- verified scope
- page kind
- action kind or capability exercised
- execution date
- attempted / succeeded / failed counts if action-based
- a human-readable outcome summary
- a screenshot or equivalent visual proof

### Storage Rule

This document defines the required fields, not a permanent raw-evidence storage location.

Raw live evidence may stay outside version control if it contains sensitive surface detail, but a release decision must not be made without the evidence bundle existing somewhere reviewable.

### Live Receipt Workflow State

Required live receipt work now moves through explicit review states:

- `missing-live-receipt`
- `capture-in-progress`
- `captured`
- `reviewed`
- `rejected`
- `expired`

Rule:

- `capture-in-progress` means the operator is assembling the packet but review cannot start yet
- `captured` means the bundle exists and is waiting for review
- `reviewed` means the bundle is acceptable for release decisioning
- `rejected` or `expired` means the bundle does not satisfy the release gate

Ledger integrity guard:

- `captured` must carry `capturedAt` plus the latest screenshot label
- `reviewed` must additionally carry `reviewedAt`, `reviewedBy`, and `reviewSummary`
- `rejected` must record why the packet failed review
- `expired` must record when trust expired

## Release Claim States

To avoid mixing repo truth and marketing truth, Shopflow uses three claim states.

| State                | Meaning                                                       |
| :------------------- | :------------------------------------------------------------ |
| `fixture-ready`      | local parser and detector logic have stable inputs            |
| `repo-verified`      | fixture + contract + integration + E2E bar has passed         |
| `public-claim-ready` | `repo-verified` plus any required live receipt bar has passed and the evidence bundle has been reviewed |

Rules:

- Storefront Shells may be `repo-verified` before they are `public-claim-ready`
- Capability-heavy Products are not releasable without `public-claim-ready`

## Hard Rules

1. Do not write "supported" when only fixtures exist
2. Do not write family-wide claims outside verified scope
3. Do not expose action buttons that do not meet the action verification bar
4. Do not replace missing action evidence with placeholder tests
5. Do not let UI optimism outrun adapter truth

## Release Gate Summary

An app is eligible for release only when:

1. required fixtures exist
2. contract tests pass
3. runtime integration tests pass
4. E2E smoke passes
5. any required live receipt exists and has status `reviewed`
6. public copy stays inside verified claim scope
