# Store Adapter Contract

- Status: Accepted
- Date: 2026-03-29
- Owners: Shopflow Contracts
- Related:
  - [ADR-001: Shopflow Repo Topology and Product Boundary](../adr/ADR-001-shopflow-repo-topology-and-product-boundary.md)
  - [Store Capability Priority Matrix](./store-capability-priority-matrix.md)
  - [Testing and Verification Bar](./testing-and-verification-bar.md)

## Purpose

This document defines the formal contract between:

- shared Shopflow runtime and UI
- store-specific adapter packages

It exists to prevent the most common failure mode in multi-store extension systems:

> each new store "mostly works", but data shape, page detection, action semantics, and UI assumptions quietly drift apart.

In plain language: this is the rulebook that keeps every store speaking the same language.

## Non-Goals

This contract does not define:

- detailed UI component implementation
- Store listing copy
- exact fixture contents
- exact app manifest contents
- the release wave plan itself

## Core Principles

1. **Capability-first, not page-guess-first**
   - adapters declare what is supported
   - UI reads adapter-declared capability states
   - UI must not infer capabilities by peeking at raw DOM itself

2. **Asymmetry is allowed**
   - not every store supports every capability
   - unsupported methods must be omitted, not faked

3. **Outputs must be schema-safe**
   - every adapter output must be validated at the adapter boundary

4. **Contracts stay runtime-free**
   - `packages/contracts` must not import browser APIs

5. **Store packages stay UI-free**
   - `packages/store-*` must not import `packages/ui`

## Canonical Types

```ts
export type StoreId =
  | 'albertsons'
  | 'kroger'
  | 'amazon'
  | 'costco'
  | 'walmart'
  | 'weee'
  | 'target'
  | 'temu';

export type VerifiedScope =
  | 'safeway'
  | 'fred-meyer'
  | 'qfc'
  | 'amazon'
  | 'costco'
  | 'walmart'
  | 'weee'
  | 'target'
  | 'temu';

export type PageKind =
  | 'product'
  | 'search'
  | 'deal'
  | 'cart'
  | 'manage'
  | 'account'
  | 'unsupported'
  | 'unknown';

export type CapabilityId =
  | 'extract_product'
  | 'extract_search'
  | 'extract_deals'
  | 'run_action'
  | 'export_data';

export type CapabilityStatus =
  | 'ready'
  | 'unsupported_site'
  | 'unsupported_page'
  | 'permission_needed'
  | 'not_implemented'
  | 'degraded'
  | 'blocked';

export type ActionKind =
  | 'schedule_save_subscribe'
  | 'schedule_save_cancel'
  | 'capture_product'
  | 'capture_search_results'
  | 'capture_deals'
  | 'filter_non_local_warehouse';

export interface CapabilityState {
  capability: CapabilityId;
  status: CapabilityStatus;
  reasonCode?: ErrorCode;
  reasonMessage?: string;
}

export interface DetectionResult {
  storeId: StoreId;
  verifiedScopes: VerifiedScope[];
  matchedHost: string;
  pageKind: PageKind;
  confidence: number;
  capabilityStates: CapabilityState[];
}

export interface MoneyValue {
  currency: string;
  amount: number;
  displayText: string;
}

export interface NormalizedProduct {
  sourceStoreId: StoreId;
  sourceUrl: string;
  title: string;
  imageUrl?: string;
  price?: MoneyValue;
  availabilityLabel?: string;
  sku?: string;
}

export interface SearchResultItem {
  sourceStoreId: StoreId;
  sourceUrl: string;
  title: string;
  imageUrl?: string;
  price?: MoneyValue;
  position: number;
}

export interface DealItem {
  sourceStoreId: StoreId;
  sourceUrl: string;
  title: string;
  dealLabel: string;
  price?: MoneyValue;
}

export type ActionInput =
  | {
      actionKind: 'schedule_save_subscribe';
      dryRun?: boolean;
      limit?: number;
    }
  | {
      actionKind: 'schedule_save_cancel';
      dryRun?: boolean;
      limit?: number;
    }
  | {
      actionKind: 'filter_non_local_warehouse';
      dryRun?: boolean;
    };

export interface ActionReceipt {
  actionKind: ActionKind;
  status: 'success' | 'partial' | 'failed';
  attempted: number;
  succeeded: number;
  failed: number;
  skipped: number;
  errors: Array<{
    code: ErrorCode;
    message: string;
    itemRef?: string;
  }>;
}

export type ErrorCode =
  | 'UNSUPPORTED_SITE'
  | 'UNSUPPORTED_PAGE'
  | 'PERMISSION_REQUIRED'
  | 'SELECTOR_MISSING'
  | 'PARSE_FAILED'
  | 'ACTION_PRECONDITION_FAILED'
  | 'ACTION_STEP_FAILED'
  | 'ACTION_PARTIAL'
  | 'RATE_LIMITED'
  | 'USER_ABORTED'
  | 'STORAGE_UNAVAILABLE'
  | 'INTERNAL_ERROR'
  | 'NOT_IMPLEMENTED';

export interface StoreAdapter {
  storeId: StoreId;
  verifiedScopes: VerifiedScope[];
  matches(url: URL): boolean;
  detect(url: URL, document: Document): DetectionResult;
  extractProduct?: (document: Document) => Promise<NormalizedProduct>;
  extractSearchResults?: (document: Document) => Promise<SearchResultItem[]>;
  extractDeals?: (document: Document) => Promise<DealItem[]>;
  runAction?: (
    document: Document,
    input: ActionInput
  ) => Promise<ActionReceipt>;
}
```

## Method Semantics

### `matches(url: URL): boolean`

Purpose:

- cheap host/path candidate check
- no DOM inspection

Rules:

- must be deterministic
- must be safe to call often
- must not throw for unsupported URLs
- must not claim hosts outside the adapter's verified or planned ownership boundary

### `detect(url: URL, document: Document): DetectionResult`

Purpose:

- determine the current page kind
- determine which capabilities are available right now
- explain unavailable states explicitly

Rules:

- must always return a `DetectionResult`
- must not assume all supported stores support all capabilities
- must include `verifiedScopes`
- must give capability states even when nothing is runnable

### `extractProduct`

Only present when the adapter genuinely supports product extraction.

Rules:

- output must parse against `NormalizedProduct`
- missing support must be expressed by omission of the method plus a non-ready capability state
- method must not fake partial product objects just to satisfy type shape

### `extractSearchResults`

Only present when search extraction is real.

Rules:

- output must parse against `SearchResultItem[]`
- ordering must be stable and explicit through `position`

### `extractDeals`

Only present when deal extraction is real.

Rules:

- output must parse against `DealItem[]`
- deal semantics must stay store-truthful; do not normalize away the meaning of the underlying offer

### `runAction`

Only present for action-capable stores or pages.

Rules:

- every call must return a full `ActionReceipt`
- partial success must be represented as `status: 'partial'`
- continue-on-error behavior must be reflected in `attempted / succeeded / failed / skipped`
- action logic must never claim success without counting real attempted items

## Capability Declaration Rules

The adapter is the source of truth for capability rendering.

UI must only render based on `capabilityStates`.

Example:

- if a page is recognized but no deal surface exists, adapter returns:
  - `capability: 'extract_deals'`
  - `status: 'unsupported_page'`
- UI then disables or hides the deal action accordingly

This prevents the classic failure mode where the UI pretends every store has the same buttons.

## Error Code Taxonomy

| Error Code                   | Meaning                                     | Typical Use                           |
| :--------------------------- | :------------------------------------------ | :------------------------------------ |
| `UNSUPPORTED_SITE`           | URL is outside owned scope                  | runtime or adapter guard              |
| `UNSUPPORTED_PAGE`           | store is known, page is not supported       | capability downgrade                  |
| `PERMISSION_REQUIRED`        | host or browser permission missing          | capability downgrade or runtime guard |
| `SELECTOR_MISSING`           | expected DOM node not found                 | parser/action failure                 |
| `PARSE_FAILED`               | DOM found but data contract invalid         | extractor failure                     |
| `ACTION_PRECONDITION_FAILED` | action cannot safely start                  | action guard                          |
| `ACTION_STEP_FAILED`         | a concrete action step failed               | action execution                      |
| `ACTION_PARTIAL`             | action continued with mixed result          | receipt reporting                     |
| `RATE_LIMITED`               | store throttling or retry window hit        | action or request flow                |
| `USER_ABORTED`               | user stopped the run                        | action receipt                        |
| `STORAGE_UNAVAILABLE`        | runtime storage issue                       | runtime integration                   |
| `INTERNAL_ERROR`             | unexpected internal failure                 | last-resort code                      |
| `NOT_IMPLEMENTED`            | capability reserved but not yet implemented | explicit non-availability only        |

## Verified Scope Rules

`verifiedScopes` are not decoration. They are the boundary between engineering grouping and public honesty.

Examples:

- `store-albertsons` may have `verifiedScopes: ['safeway']`
- `store-kroger` may have `verifiedScopes: ['fred-meyer', 'qfc']`

Implications:

- internal package grouping may be family-level
- public claims must stay inside `verifiedScopes`
- release documents and Store listings must not overclaim beyond this field

## Package Boundary Rules

Allowed:

- `packages/store-*` may import:
  - `packages/contracts`
  - shared pure helpers from `packages/core` if those helpers are store-agnostic

Forbidden:

- `packages/store-*` importing `packages/ui`
- `packages/contracts` importing runtime or Chrome APIs
- adapters mutating global browser state during `matches` or `detect`

## Contract Compliance Checklist

An adapter is not considered valid until all of the following are true:

1. `matches` is cheap and deterministic
2. `detect` returns explicit capability states
3. every extractor output parses successfully
4. `runAction` returns a full receipt when supported
5. unsupported methods are omitted rather than faked
6. `verifiedScopes` truthfully bound public claim scope
