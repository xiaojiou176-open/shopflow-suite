# Shopflow Brand and Claim Boundary

- Status: Accepted
- Date: 2026-03-29
- Owners: Shopflow Brand + Product
- Related:
  - [ADR-002: Release Wave and Product Tiering](../adr/ADR-002-release-wave-and-product-tiering.md)
  - [Store Adapter Contract](../contracts/store-adapter-contract.md)
  - [Testing and Verification Bar](../contracts/testing-and-verification-bar.md)

## Purpose

This document defines:

- the Shopflow brand family
- the official naming system
- the public-claim boundary for store and family apps

In plain language:

> this is the rulebook for what we call things and what we are allowed to promise.

## Brand Decision

The formal product and brand name is:

- `Shopflow`

The formal primary repository name is:

- `shopflow-suite`

## Brand Architecture

### Umbrella Brand

- `Shopflow`

### Store App Naming Pattern

Approved pattern:

- `Shopflow for <Store Name>`
- `Shopflow for <Family Name>`

Examples:

- `Shopflow for Amazon`
- `Shopflow for Costco`
- `Shopflow for Walmart`
- `Shopflow for Weee`
- `Shopflow for Target`
- `Shopflow for Temu`
- `Shopflow for Albertsons Family`
- `Shopflow for Kroger Family`

### Suite Naming

Approved name:

- `Shopflow Suite`

## Canonical Product Naming Table

| App ID               | Approved Public Name             | Verified-Scope Clause Required? |
| :------------------- | :------------------------------- | :-----------------------------: |
| `ext-albertsons`     | `Shopflow for Albertsons Family` |               Yes               |
| `ext-kroger`         | `Shopflow for Kroger Family`     |               Yes               |
| `ext-amazon`         | `Shopflow for Amazon`            |               No                |
| `ext-costco`         | `Shopflow for Costco`            |               No                |
| `ext-walmart`        | `Shopflow for Walmart`           |               No                |
| `ext-weee`           | `Shopflow for Weee`              |               No                |
| `ext-target`         | `Shopflow for Target`            |               No                |
| `ext-temu`           | `Shopflow for Temu`              |               No                |
| `ext-shopping-suite` | `Shopflow Suite`                 |               N/A               |

## Verified Scope Rule

Family naming is allowed publicly, but family-wide support is not assumed.

Approved first-phase claim wording:

- `Shopflow for Albertsons Family`
  - must include: `Currently verified on Safeway.`
- `Shopflow for Kroger Family`
  - must include: `Currently verified on Fred Meyer + QFC.`

This means:

- family framing is a product structure
- verified scope is a truth boundary

Both are required. Neither replaces the other.

## Claim States

All public claims must map to one of these states:

| State                | Meaning                                                                                     |
| :------------------- | :------------------------------------------------------------------------------------------ |
| `planned`            | intended future support, not public release copy                                            |
| `repo-verified`      | code and automated verification exist, but public claim may still require stronger evidence |
| `public-claim-ready` | release and public wording may state support within verified scope                          |

No Store listing or public README copy may leap from `planned` to public claim without the verification bar.

## Copy Rules

### Allowed

- `Currently verified on Safeway`
- `Supports product extraction on Amazon pages`
- `Supports product, search, and deals on currently verified Target surfaces`
- `Shopflow Suite helps you discover available capabilities across supported stores`

### Forbidden

- `Supports the entire Albertsons family` without verified-scope evidence
- `Supports all Kroger sites` without verified-scope evidence
- `Official` wording
- store-brand impersonation wording
- any claim that outruns live evidence for action-heavy products

## Listing Description Rules

Every Store listing must:

1. state the store or family clearly
2. state the currently verified scope if family naming is used
3. name only supported capabilities
4. avoid implying universal support across the family or the broader web

### Example

Good:

- `Shopflow for Albertsons Family`
- `Currently verified on Safeway. Supports product search, deal discovery, and Schedule & Save workflows on verified surfaces.`

Bad:

- `The official Albertsons automation suite for all Albertsons stores.`

## Screenshot and Visual Proof Rules

Store screenshots must reflect the named product scope.

Rules:

1. screenshots must come from the actual named store or verified scope
2. family-level screenshots must not imply broader validation than exists
3. Suite screenshots must show navigation or aggregation behavior, not pretend to be a fully unified super-app if that is not yet true

## GitHub and Store Relationship

Store listings may be multiple.

The code source of truth remains one repository:

- `shopflow-suite`

This means:

- Chrome Store is the multi-door storefront layer
- GitHub is the single-source engineering and brand trust layer

## Naming Rules for Internal vs Public Surfaces

Internal:

- `store-albertsons`
- `store-kroger`

Public:

- `Shopflow for Albertsons Family`
- `Shopflow for Kroger Family`

Why both exist:

- internal naming serves architecture
- public naming serves product packaging

## Prohibited Naming Patterns

Do not use:

- `terry-tampermonkey-*`
- `chrome-*` as the core product brand
- `official-*`
- exact store-brand mimicry intended to imply first-party ownership

## Brand Guardrails

1. Shopflow is the umbrella brand
2. Store apps are children of the umbrella brand
3. Suite is the flagship umbrella app
4. verified scope must appear wherever family naming might otherwise overclaim
