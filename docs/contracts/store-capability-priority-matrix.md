# Store Capability Priority Matrix

- Status: Accepted
- Date: 2026-03-29
- Owners: Shopflow Product + Contracts
- Related:
  - [ADR-001: Shopflow Repo Topology and Product Boundary](../adr/ADR-001-shopflow-repo-topology-and-product-boundary.md)
  - [ADR-002: Release Wave and Product Tiering](../adr/ADR-002-release-wave-and-product-tiering.md)
  - [Store Adapter Contract](./store-adapter-contract.md)

## Source of Truth for This Matrix

This matrix is built from the current shopping inventory already validated in the Terry workspace as migration input.

Current live inventory:

- Total scripts: `48`
- Shopping scripts: `25`
- AI export scripts: `4`
- Remaining scripts: `19`

This document only covers the `25` shopping scripts.

## Capability Role Definitions

### `流量型`

Capabilities that are easy to explain, easy to search for, and strong at getting people into a Store listing.

Typical examples:

- product extraction
- search result extraction on large commerce sites

### `差异化型`

Capabilities that make Shopflow feel more than "just another scraper".

Typical examples:

- Safeway Schedule & Save subscribe
- Safeway Schedule & Save cancel
- Temu non-local warehouse filter
- Target deals

### `支撑型`

Capabilities required for product completeness, family coherence, or retained utility, but not the first hook most users will install the app for.

Typical examples:

- family-scope product/search support that backs a differentiated app
- supplemental deal extraction that is useful but not the public headline

## App-Level Matrix

| App ID           | Public Product                   | Tier                     | Wave   | Verified Scope Today | Scripts | MVP Focus                                                      |
| :--------------- | :------------------------------- | :----------------------- | :----- | :------------------- | ------: | :------------------------------------------------------------- |
| `ext-albertsons` | `Shopflow for Albertsons Family` | Capability-heavy Product | Wave 1 | `Safeway`            |       5 | Safeway actions as headline, plus product/search/deals support |
| `ext-kroger`     | `Shopflow for Kroger Family`     | Capability-heavy Product | Wave 3 | `Fred Meyer + QFC`   |       6 | family grocery intelligence with product/search/deals          |
| `ext-amazon`     | `Shopflow for Amazon`            | Storefront Shell         | Wave 1 | `Amazon`             |       2 | high-acquisition product/search shell                          |
| `ext-costco`     | `Shopflow for Costco`            | Storefront Shell         | Wave 2 | `Costco`             |       2 | high-acquisition product/search shell                          |
| `ext-walmart`    | `Shopflow for Walmart`           | Storefront Shell         | Wave 2 | `Walmart`            |       2 | high-acquisition product/search shell                          |
| `ext-weee`       | `Shopflow for Weee`              | Storefront Shell         | Wave 3 | `Weee`               |       2 | focused product/search shell                                   |
| `ext-target`     | `Shopflow for Target`            | Storefront Shell         | Wave 1 | `Target`             |       3 | product/search plus strong deals hook                          |
| `ext-temu`       | `Shopflow for Temu`              | Storefront Shell         | Wave 2 | `Temu`               |       3 | product/search plus non-local warehouse differentiation        |

## Detailed Script-to-App Mapping

### `ext-albertsons` → `Shopflow for Albertsons Family`

Public claim boundary:

- public description must explicitly say `Currently verified on Safeway`

| Legacy Script ID                   | Source Category | Target Capability | Role     | Notes                                |
| :--------------------------------- | :-------------- | :---------------- | :------- | :----------------------------------- |
| `Safeway 批量 Schedule & Save`     | `utilities`     | `run_action`      | 差异化型 | primary headline workflow            |
| `Safeway 批量取消 Schedule & Save` | `utilities`     | `run_action`      | 差异化型 | paired with subscribe flow           |
| `Safeway 商品详情提取`             | `extractors`    | `extract_product` | 支撑型   | supports richer product story        |
| `Safeway 搜索结果提取`             | `searchers`     | `extract_search`  | 支撑型   | supports discovery flow              |
| `Safeway Deal 提取`                | `deals`         | `extract_deals`   | 支撑型   | useful but not the first public hook |

### `ext-kroger` → `Shopflow for Kroger Family`

Public claim boundary:

- public description must explicitly say `Currently verified on Fred Meyer + QFC`

| Legacy Script ID         | Source Category | Target Capability | Role   | Notes                 |
| :----------------------- | :-------------- | :---------------- | :----- | :-------------------- |
| `FredMeyer 商品详情提取` | `extractors`    | `extract_product` | 支撑型 | family coverage input |
| `FredMeyer 搜索结果提取` | `searchers`     | `extract_search`  | 支撑型 | family coverage input |
| `FredMeyer Deal 提取`    | `deals`         | `extract_deals`   | 支撑型 | family completeness   |
| `QFC 商品详情提取`       | `extractors`    | `extract_product` | 支撑型 | family coverage input |
| `QFC 搜索结果提取`       | `searchers`     | `extract_search`  | 支撑型 | family coverage input |
| `QFC Deal 提取`          | `deals`         | `extract_deals`   | 支撑型 | family completeness   |

### `ext-amazon` → `Shopflow for Amazon`

| Legacy Script ID      | Source Category | Target Capability | Role   | Notes                             |
| :-------------------- | :-------------- | :---------------- | :----- | :-------------------------------- |
| `Amazon 商品详情提取` | `extractors`    | `extract_product` | 流量型 | strong search-friendly entrypoint |
| `Amazon 搜索结果提取` | `searchers`     | `extract_search`  | 流量型 | strong search-friendly entrypoint |

### `ext-costco` → `Shopflow for Costco`

| Legacy Script ID      | Source Category | Target Capability | Role   | Notes                  |
| :-------------------- | :-------------- | :---------------- | :----- | :--------------------- |
| `Costco 商品详情提取` | `extractors`    | `extract_product` | 流量型 | clean storefront shell |
| `Costco 搜索结果提取` | `searchers`     | `extract_search`  | 流量型 | clean storefront shell |

### `ext-walmart` → `Shopflow for Walmart`

| Legacy Script ID       | Source Category | Target Capability | Role   | Notes                       |
| :--------------------- | :-------------- | :---------------- | :----- | :-------------------------- |
| `Walmart 商品详情提取` | `extractors`    | `extract_product` | 流量型 | high-volume commercial host |
| `Walmart 搜索结果提取` | `searchers`     | `extract_search`  | 流量型 | high-volume commercial host |

### `ext-weee` → `Shopflow for Weee`

| Legacy Script ID    | Source Category | Target Capability | Role   | Notes                                        |
| :------------------ | :-------------- | :---------------- | :----- | :------------------------------------------- |
| `Weee 商品详情提取` | `extractors`    | `extract_product` | 流量型 | narrower but still host-specific acquisition |
| `Weee 搜索结果提取` | `searchers`     | `extract_search`  | 流量型 | narrower but still host-specific acquisition |

### `ext-target` → `Shopflow for Target`

| Legacy Script ID      | Source Category | Target Capability | Role     | Notes                                    |
| :-------------------- | :-------------- | :---------------- | :------- | :--------------------------------------- |
| `Target 商品详情提取` | `extractors`    | `extract_product` | 流量型   | strong general acquisition               |
| `Target 搜索结果提取` | `searchers`     | `extract_search`  | 流量型   | strong general acquisition               |
| `Target Deal 提取`    | `deals`         | `extract_deals`   | 差异化型 | primary differentiation for Target shell |

### `ext-temu` → `Shopflow for Temu`

| Legacy Script ID    | Source Category | Target Capability | Role     | Notes                        |
| :------------------ | :-------------- | :---------------- | :------- | :--------------------------- |
| `Temu 筛选非本地仓` | `filters`       | `run_action`      | 差异化型 | strongest Temu-specific hook |
| `Temu 商品详情提取` | `extractors`    | `extract_product` | 流量型   | acquisition support          |
| `Temu 搜索结果提取` | `searchers`     | `extract_search`  | 流量型   | acquisition support          |

## Totals Check

| App              | Script Count |
| :--------------- | -----------: |
| `ext-albertsons` |            5 |
| `ext-kroger`     |            6 |
| `ext-amazon`     |            2 |
| `ext-costco`     |            2 |
| `ext-walmart`    |            2 |
| `ext-weee`       |            2 |
| `ext-target`     |            3 |
| `ext-temu`       |            3 |
| **Total**        |       **25** |

## MVP Scope Per App

### Wave 1 MVP

- `ext-albertsons`
  - must support product, search, deals, and Safeway action workflows
- `ext-amazon`
  - must support product + search
- `ext-target`
  - must support product + search + deals

### Wave 2 MVP

- `ext-costco`
  - product + search
- `ext-walmart`
  - product + search
- `ext-temu`
  - product + search + non-local warehouse filter

### Wave 3 MVP

- `ext-kroger`
  - product + search + deals
- `ext-weee`
  - product + search
- `ext-shopping-suite`
  - capability navigator + unified entry shell only

## Hard Rules

1. Every one of the `25` shopping scripts stays in final scope
2. Wave ordering must not silently demote or drop lower-priority apps
3. Public claims must stay inside today's verified scope
4. Differentiation must come from real capabilities, not from marketing-only app shells
