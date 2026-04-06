# Dependency and Reuse Policy

- Status: Accepted
- Date: 2026-03-29
- Owners: Shopflow Engineering
- Related:
  - [ADR-001: Shopflow Repo Topology and Product Boundary](../adr/ADR-001-shopflow-repo-topology-and-product-boundary.md)
  - [Shopflow Product Surface Spec](../ui/shopflow-product-surface-spec.md)
  - [Testing and Verification Bar](../contracts/testing-and-verification-bar.md)

## Purpose

This document defines how Shopflow uses external dependencies, examples, and reusable OSS material.

It answers:

- what we install as a dependency
- what we may vendor as local code
- what we may only use as a reference

In plain language:

> this is the buying policy for the kitchen.

## Reuse Modes

| Mode             | Meaning                                                               |
| :--------------- | :-------------------------------------------------------------------- |
| `dependency`     | install and update through package management                         |
| `vendor`         | copy code into the repo and own it locally                            |
| `reference-only` | study or reimplement ideas, but do not copy wholesale into production |

## General Rules

1. Prefer stable, small, well-scoped dependencies over large framework piles
2. Prefer one solution per problem domain
3. Do not vendor frameworks when dependency use is the correct model
4. Do not treat sample repos as runtime source of truth
5. Any vendored code must become locally owned and reviewable

## Decision Matrix

| Item                                            | Role                                                        | Approved Mode                                        | Notes                                                            |
| :---------------------------------------------- | :---------------------------------------------------------- | :--------------------------------------------------- | :--------------------------------------------------------------- |
| `WXT`                                           | extension framework and build system                        | `dependency`                                         | never vendor the framework                                       |
| `@wxt-dev/module-react`                         | React integration for WXT                                   | `dependency`                                         | normal module dependency                                         |
| `webextension-polyfill`                         | browser API compatibility layer                             | `dependency`                                         | do not vendor                                                    |
| `webext-bridge` or `@webext-core/proxy-service` | cross-context messaging wrapper                             | `dependency`                                         | choose one, not both                                             |
| `webext-dynamic-content-scripts`                | optional host-permission content-script registration helper | `dependency`                                         | optional, only if needed                                         |
| `GoogleChrome/chrome-extensions-samples`        | API usage examples                                          | `reference-only`                                     | never treat as app skeleton                                      |
| `WXT official examples`                         | scaffold and entrypoint examples                            | `reference-only`, with narrow bootstrap copy allowed | small targeted bootstrap copy is allowed if normalized and cited |
| `shadcn/ui` generated component code            | local UI primitive starting point                           | `vendor`                                             | copied code becomes local-owned UI code                          |
| `Radix primitives`                              | accessible UI primitives                                    | `dependency`                                         | do not vendor                                                    |

## Policy by Requested Item

### 1. WXT

Approved mode:

- `dependency`

Why:

- WXT is a framework, not a snippet set
- vendoring it would create a fake fork and a maintenance nightmare

Rules:

- install via package management
- use WXT official docs and examples for project structure
- do not copy framework internals into Shopflow

### 2. webextension-polyfill

Approved mode:

- `dependency`

Why:

- it is a compatibility layer, not product code
- the value comes from using the maintained library as-is

Rules:

- internal code may prefer `browser.*` semantics if this path is adopted
- do not vendor the library

### 3. webext-bridge / @webext-core/proxy-service

Approved mode:

- `dependency`

Why:

- messaging is foundational and must stay singular

Rules:

1. choose one
2. do not run two message abstraction systems at once
3. do not build a second homegrown event bus on top unless there is a proven gap

### 4. GoogleChrome/chrome-extensions-samples

Approved mode:

- `reference-only`

Why:

- it is an API cookbook, not a product architecture template

Allowed use:

- inspect the smallest correct usage of a Chrome extension API
- manually reproduce or adapt small patterns

Forbidden use:

- subtree the repo into Shopflow
- clone its structure as your app architecture
- treat examples as current Shopflow contracts

### 5. WXT Official Examples

Approved mode:

- `reference-only`
- narrow targeted bootstrap copy allowed

Why:

- examples are useful for entrypoints, side panel wiring, and baseline structure
- they still are not Shopflow's business architecture

Allowed use:

- borrow the initial side panel or entrypoint skeleton
- adapt small setup files into Shopflow

Conditions for narrow bootstrap copy:

1. copied code must be small and purposeful
2. copied code must be normalized to Shopflow naming and file layout
3. copied code must stop being "external truth" once committed

Forbidden:

- keeping entire example folders as living app structure
- treating example code as exempt from local standards

### 6. shadcn/ui

Approved mode:

- `vendor`

Why:

- shadcn's open-code model is explicitly designed for local ownership
- Shopflow needs a locally controlled design system

Rules:

1. copy only the primitives actually needed
2. once copied, the component becomes Shopflow-owned code
3. do not preserve a giant unused component zoo
4. wrap copied primitives into Shopflow product components in `packages/ui`

## Dependency Selection Rules

### Allowed by Default

- WXT
- React
- Tailwind
- Radix
- Zod
- webextension-polyfill
- one messaging wrapper
- Vitest
- Playwright

### Optional, Add Only When Needed

- dynamic content script helpers
- task graph acceleration tools
- icon-generation helpers

### Avoid by Default

- heavyweight global state libraries
- multiple messaging layers
- remote-code execution schemes
- full repo templates copied wholesale

## No Remote Code Rule

Shopflow must not depend on remotely executed business code.

Implications:

- third-party dependencies must be bundled locally
- no runtime-downloaded executable JS
- no CDN-loaded business logic for extension execution

## Vendor Provenance Rule

If code is vendored:

1. it must be intentionally selected
2. it must be owned locally after copy
3. it must be reviewed to Shopflow standards
4. the repo must not depend on the external upstream repo layout continuing to match

## What Must Not Happen

1. Do not vendor WXT itself
2. Do not vendor `webextension-polyfill`
3. Do not vendor `webext-bridge`
4. Do not keep external sample repos inside Shopflow as pseudo-source-of-truth
5. Do not use sample code to bypass local contract standards
6. Do not mix multiple overlapping runtime abstractions for the same job

## Recommended Reuse Strategy

### Foundation

- install `WXT`
- install `@wxt-dev/module-react`
- install `webextension-polyfill`
- install one messaging wrapper

### Examples

- study WXT official examples first
- study Chrome official samples second for API specifics

### UI

- copy a minimal set of shadcn-based primitives
- build Shopflow-owned product components on top

### Runtime

- keep runtime logic local
- use examples for patterns, not for truth
