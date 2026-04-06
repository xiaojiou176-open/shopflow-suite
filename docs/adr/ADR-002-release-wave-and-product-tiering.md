# ADR-002: Release Wave and Product Tiering

- Status: Accepted
- Date: 2026-03-29
- Owners: Shopflow Product Architecture
- Related:
  - [ADR-001: Shopflow Repo Topology and Product Boundary](./ADR-001-shopflow-repo-topology-and-product-boundary.md)
  - [Store Capability Priority Matrix](../contracts/store-capability-priority-matrix.md)
  - [Testing and Verification Bar](../contracts/testing-and-verification-bar.md)

## Context

Shopflow will eventually ship:

- `8` Store apps
- `1` Suite app

But "architecture scope" and "release sequence" are not the same thing.

If all `8+1` products are launched together on day one, the team inherits:

- `9` listing surfaces
- `9` screenshot sets
- `9` review and feedback surfaces
- `9` permission narratives
- `9` bug funnels

That is not growth. That is release-surface explosion.

We therefore need two decisions:

1. Which apps are primarily thin distribution shells vs heavier differentiated products?
2. In what order should they ship so that all planned apps still get built, without creating early operational chaos?

## Definitions

### Storefront Shell

A Storefront Shell is a host-specific or store-specific entrypoint whose primary job is:

- acquisition
- search visibility
- clear host-specific permissions
- narrow first-use value proposition

Characteristics:

- UI mostly shared with the broader Shopflow system
- business logic mostly comes from shared packages + adapter packages
- capability surface is intentionally focused

### Capability-heavy Product

A Capability-heavy Product is an app whose value is not just "this site is supported", but "this app owns a meaningfully differentiated workflow".

Characteristics:

- stronger workflow depth
- more release risk
- more public claim sensitivity
- more verification burden

## Tier Decision

| App                  | Public Product                   | Tier                     | Why                                                                                                              |
| :------------------- | :------------------------------- | :----------------------- | :--------------------------------------------------------------------------------------------------------------- |
| `ext-albertsons`     | `Shopflow for Albertsons Family` | Capability-heavy Product | Action-heavy due to Schedule & Save subscribe/cancel flow; public claim must stay tied to Safeway verified scope |
| `ext-kroger`         | `Shopflow for Kroger Family`     | Capability-heavy Product | Family-scope packaging plus mixed product/search/deal capability across Fred Meyer + QFC                         |
| `ext-amazon`         | `Shopflow for Amazon`            | Storefront Shell         | Strong acquisition surface, narrow promise, read-heavy entrypoint                                                |
| `ext-costco`         | `Shopflow for Costco`            | Storefront Shell         | Clear host-specific extractor/search shell                                                                       |
| `ext-walmart`        | `Shopflow for Walmart`           | Storefront Shell         | Clear host-specific extractor/search shell                                                                       |
| `ext-weee`           | `Shopflow for Weee`              | Storefront Shell         | Narrow host-specific shell with low release complexity                                                           |
| `ext-target`         | `Shopflow for Target`            | Storefront Shell         | Read-heavy shell with a differentiated deals hook, but still mostly storefront-shaped                            |
| `ext-temu`           | `Shopflow for Temu`              | Storefront Shell         | Read-heavy shell with one differentiated filter workflow                                                         |
| `ext-shopping-suite` | `Shopflow Suite`                 | Capability-heavy Product | Composition shell, capability navigator, cross-store entrypoint                                                  |

## Family Naming Decision

We will use family naming publicly, with an explicit verified-scope clause.

Approved public naming pattern:

- `Shopflow for Albertsons Family`
  - public description must say: `Currently verified on Safeway.`
- `Shopflow for Kroger Family`
  - public description must say: `Currently verified on Fred Meyer + QFC.`

Why this is the right compromise:

- It preserves the intended `8` Store storefront structure
- It allows future family expansion without renaming the app family
- It avoids falsely claiming family-wide verification before evidence exists

Rejected alternative:

- Hiding family language entirely until every banner is verified

Reason rejected:

- It weakens the long-term product structure unnecessarily
- It creates avoidable naming churn later

## Release Waves

All `8` Store apps and `1` Suite app remain in scope.

Waves define release order only. They do not define omission.

### Wave 1

Apps:

- `ext-albertsons` / `Shopflow for Albertsons Family`
- `ext-amazon` / `Shopflow for Amazon`
- `ext-target` / `Shopflow for Target`

Why:

- `Albertsons` gives the strongest differentiated action workflow
- `Amazon` gives the strongest acquisition hook
- `Target` balances acquisition with richer deal-based product storytelling

Wave 1 objective:

- validate the new repo topology
- validate adapter contract quality
- validate one action-heavy product plus two read-heavy products
- validate Store listing process without `8+1` simultaneous operations

Wave 1 exit criteria:

- all three apps pass the minimum verification bar
- family-scope wording for Albertsons is evidence-safe
- no unresolved contract drift between shared layers and adapters

### Wave 2

Apps:

- `ext-costco`
- `ext-walmart`
- `ext-temu`

Why:

- expands acquisition coverage
- adds one more differentiated feature path via Temu filter logic
- keeps release complexity manageable while reusing the now-proven architecture

Wave 2 objective:

- prove that Wave 1 architecture scales cleanly to additional shell apps
- validate that the permission and listing model stays narrow and repeatable

Wave 2 exit criteria:

- three additional storefront shells ship without shared-layer drift
- Temu differentiated workflow passes release bar
- no app-specific workaround mutates shared contracts incorrectly

### Wave 3

Apps:

- `ext-kroger`
- `ext-weee`
- `ext-shopping-suite`

Why:

- `Kroger Family` is valuable but requires stricter verified-scope discipline
- `Weee` is lower launch urgency than Wave 1 and Wave 2 shells
- `Shopflow Suite` should ship after base store apps prove the architecture

Wave 3 objective:

- complete the planned Store coverage
- introduce Suite only after store adapters and shared UI surfaces are stable

Wave 3 exit criteria:

- Kroger public claims remain bounded to verified scopes
- Weee shell proves low-friction reuse
- Suite ships as a composition shell, not as a second logic plane

## What Must Not Happen

1. Do not ship all `8+1` apps on day one
2. Do not ship `Shopflow Suite` before store apps prove the architecture
3. Do not let Wave ordering silently drop "lower-priority" apps from total scope
4. Do not market family-wide support beyond verified scope
5. Do not treat Storefront Shells and Capability-heavy Products as having the same release burden

## Ongoing Product Rule

For any future expansion:

- new host-specific shell apps default to `Storefront Shell`
- any app with multi-step differentiated workflow, family-level claim surface, or broad orchestration defaults to `Capability-heavy Product`

If an app's classification changes, this ADR must be updated in the same change set as the new release plan.
