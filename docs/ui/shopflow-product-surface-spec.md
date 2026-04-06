# Shopflow Product Surface Spec

- Status: Accepted
- Date: 2026-03-29
- Owners: Shopflow Product Surface
- Related:
  - [ADR-001: Shopflow Repo Topology and Product Boundary](../adr/ADR-001-shopflow-repo-topology-and-product-boundary.md)
  - [Store Adapter Contract](../contracts/store-adapter-contract.md)
  - [Testing and Verification Bar](../contracts/testing-and-verification-bar.md)

## Purpose

This document defines the responsibilities and boundaries of Shopflow's four UI surfaces:

- Side Panel
- Popup
- Content UI
- Options

It also locks the information architecture for the Shopflow home surface.

In plain language:

> this is the floor plan for the front desk.

## Surface Hierarchy

Shopflow has one primary surface and three supporting surfaces.

| Surface    | Role                             | Priority  |
| :--------- | :------------------------------- | :-------- |
| Side Panel | primary application surface      | Primary   |
| Popup      | quick router and summary surface | Secondary |
| Content UI | thin inline page augmentation    | Secondary |
| Options    | settings and policy surface      | Secondary |

## Current Repo Materialization Note

Current repo-owned alpha truth in this lane:

- store-app Side Panel home surfaces are materialized
- store-app Popup launcher surfaces are materialized
- `ext-shopping-suite` Popup and Side Panel alpha shells are materialized

Not yet repo-verified as materialized product surfaces in this lane:

- store-app Content UI surfaces
- store-app Options surfaces

Therefore:

> treat Content UI and Options as locked responsibilities first, not as already-shipped Shopflow surfaces.

## Product Language and Locale Rules

Public-facing Shopflow surfaces must stay:

- English-first

Product UI must stay:

- English-default
- compatible with `zh-CN` through shared locale catalogs

Current repo truth may claim:

- core shared surfaces already resolve `en` and `zh-CN`
- core user-visible surfaces are on an English-first locale track
- core shell surfaces now expose a minimal user-visible language route toggle

Current repo truth must **not** claim:

- a full product-wide language settings system is already shipped
- full bilingual product polish is already complete

Hard rule:

> New user-visible strings must route through shared locale catalogs.
> Scattered bilingual literals are product-surface drift.

## Product Surface Rules

1. **Main product lives in Side Panel**
2. **Popup is not a second main app**
3. **Content UI stays thin**
4. **Options owns settings and policy explanation, not operational work**
5. **All surfaces must consume capability truth from runtime/view-model, not raw DOM guessing**

## 1. Side Panel

### Purpose

The Side Panel is the main Shopflow app surface.

It exists to:

- identify the current site
- identify the current page kind
- show which capabilities are available right now
- trigger primary actions
- show recent results and recent activity
- provide navigation to deeper product views

### Side Panel Must Do

- act as the main user-facing control console
- render only the capabilities actually declared by the active adapter
- surface permission, unsupported, partial, and error states honestly
- host the primary navigation model
- when no fresher source page is recorded but a latest captured page exists, route operators back to that captured page instead of falling back to summary-only guidance

### Side Panel Must Not Do

- guess support directly from DOM outside the runtime/view-model layer
- hide adapter uncertainty behind overconfident buttons
- become a dumping ground for every experimental view

### Core Sections on the Home Surface

The Shopflow home surface must always be organized into these seven sections:

1. `Top Brand Bar`
2. `Readiness Summary`
3. `Current Site Summary`
4. `Capability Grid`
5. `Quick Actions`
6. `Recent Activity`
7. `Secondary Navigation`

## 2. Popup

### Purpose

Popup is a lightweight launcher and status router.

### Popup Must Do

- identify the current site quickly
- show a one-line capability summary
- provide an obvious `Open Side Panel` action
- show recent status at a glance
- when recent activity already has a known source page, allow a direct jump back to that latest page
- when both the latest source page and the latest captured page are known, keep those two routes separate so popup can send operators back to the real merchant page without hiding the captured-page preview route
- when the app is still claim-gated, route the secondary popup CTA into the Side Panel evidence section instead of leaving operators at a generic summary
- the primary popup CTA must route to a real Side Panel surface, not behave like a decorative button
- when popup routes to a Side Panel section, the CTA copy should name that destination clearly enough that operators know what will open

### Popup Must Not Do

- become a full operational console
- duplicate all Side Panel pages
- become the primary place for multi-step workflows

### Popup Content Budget

Allowed:

- site badge
- page status summary
- one primary CTA
- one or two secondary quick actions
- recent status pill
- one direct jump back to the latest known source page when that route is already known

Forbidden:

- complex tables
- large settings forms
- full result explorers
- long action history

## 3. Content UI

### Purpose

Content UI exists to add thin, contextual assistance inside the merchant page.

### Content UI Must Do

- show lightweight inline CTA points
- show highlights, badges, or small affordances
- help users discover what Shopflow can do on the current page

### Content UI Must Not Do

- host the full product shell
- become the main place for settings or logs
- embed heavy application pages into merchant DOM

### Isolation Rule

If Content UI mounts substantial React UI, it must use Shadow DOM isolation.

Why:

- merchant pages are hostile styling environments
- isolation keeps Shopflow UI from colliding with page styles and layout

## 4. Options

### Purpose

Options is the settings and policy explanation surface.

### Options Must Do

- explain permissions
- own persistent settings
- explain support policy and limits
- provide help or FAQ links

### Options Must Not Do

- become the primary operational surface
- duplicate Side Panel control flows

## Home Surface Information Architecture

### A. Top Brand Bar

Purpose:

- identify Shopflow
- communicate current app state at a glance

Contents:

- logo / wordmark
- app title `Shopflow`
- short subtitle
- status pill such as `Live`, `Ready`, `Unsupported`, `Error`

### B. Current Site Summary

Purpose:

- tell users where they are and what kind of page this is

Contents:

- current site name
- matched host
- page kind
- capability badges
- permission or unsupported warnings if needed

### B.1. Readiness Summary

Purpose:

- tell operators whether the current page is runnable now, limited, or still claim-gated
- separate repo-readiness from public-claim readiness before deeper detail cards

Contents:

- readiness label
- one-sentence operational summary
- latest output preview when shared runtime already knows the freshest supported result summary
- when a shared latest-output record exists, the preview should show the actual captured headline and detail lines before falling back to generic runnable-capability copy
- verified-scope or claim-boundary cue when needed
- next-step hint when evidence review or operator action is still blocking public wording
- when the next route is already known, pair the operator-next-step hint with a real route CTA instead of leaving it as text-only guidance
- a compact “what is runnable now vs what still needs attention” snapshot

### C. Capability Grid

Purpose:

- answer the most important question:
  - what can this page do right now?

Canonical capability cards:

- `Extract Product`
- `Extract Search Results`
- `Find Deals`
- `Run Actions`

Rules:

- cards must reflect `ready / unavailable / permission-needed / unsupported-page / coming-soon`
- unavailable cards must explain why

### D. Quick Actions

Purpose:

- provide the most obvious next step for the current page

Rules:

- show no more than `2-4` action choices
- one primary action may be visually dominant
- labels must read like actions, not menu nouns
- when no execution surface exists inside the home page itself, pair capability labels with real route buttons derived from shared runtime context instead of rendering decorative action buttons
- when nothing is runnable, the empty state must point back to an operator next step instead of sounding like a silent dead end

Examples:

- `Extract product`
- `Capture results`
- `Run action`
- `Copy structured data`

### E. Recent Activity

Purpose:

- prove that the app is alive and has recent outputs

Rules:

- show at most `3` recent activity items
- keep it lightweight
- reflect real runtime context instead of a static placeholder panel
- when the source page URL is known, allow a direct jump back to that page instead of forcing operators to manually retrace the path

### E.1 Evidence Routing

When an evidence item still needs capture, review, or recapture and the current
or latest source page is already known, the surface may expose a direct route
back to that source page.

Why:

- operators should not have to manually reconstruct the merchant path before
  they can act on the next evidence step
- the route must still come from shared runtime context, not from a second
  suite-only state system
- support jumping to the related result surface where appropriate
- keep timestamp context visible so operators can tell whether the app is alive now or merely has stale history

### F. Secondary Navigation

Purpose:

- route the operator from the current page into the next correct surface without turning the home page into a full dashboard maze

Rules:

- each navigation item must explain why it matters before asking the operator to click
- prefer support-state, claim-gate, and recent-activity routing over generic menu nouns
- navigation copy must stay inside repo-truth and must not imply public-ready support
- navigation items should be real routes or anchors, not dead buttons pretending to be navigation

## Suite Internal Alpha Surface

`Shopflow Suite` is an internal control-plane lobby.

It must:

- start with a short “Start here” section that tells operators what to inspect first
- keep internal-alpha guardrails explicit
- present claim-readiness counts as routing signals, not launch promises
- make claim-readiness board cards point to real in-page sections such as rollout map, evidence gates, or alpha guardrails instead of stopping at count-only status tiles
- show rollout map, evidence gates, and verified-scope navigation in one place
- make evidence-gate cards route into the matching verified-scope clause, rollout row, and best-available store route when shared runtime context already knows the next useful page
- let operators inspect per-app latest detection, recent activity, and evidence queue summaries from shared runtime storage
- provide a best-available operator route for each app, preferring latest source page and falling back to the shared default host when no fresher route exists yet
- make the per-app operator next-step card expose that same best-available route instead of stopping at text-only guidance
- let verified-scope clauses deep-link to the matching rollout row so operators can move from wording boundaries into the correct store shell route without guessing
- group evidence queue items into triage buckets so operators can immediately see what needs capture, what is waiting for review, and what is already reviewed
- allow the top `Start here` guidance to deep-link into real in-page anchors such as the claim readiness board, rollout map, and verified-scope navigator
- when the Suite popup offers primary and secondary CTAs, the primary route should open the rollout map first and the secondary route should open the claim readiness board

It must not:

- become a second workflow engine
- replace store-app execution surfaces
- imply that repo-verified status equals public-claim-ready status

Purpose:

- route to deeper surfaces without turning the home screen into a dashboard maze

Canonical destinations:

- `Search`
- `Results`
- `Actions`
- `History`
- `Settings`

## Home Surface States

The home surface must support at least these six states:

| State               | Meaning                                               | Required UX Behavior                             |
| :------------------ | :---------------------------------------------------- | :----------------------------------------------- |
| `loading`           | app is detecting site/page/capabilities               | skeleton + loading text                          |
| `supported_ready`   | supported page with runnable capabilities             | capability cards active, primary CTA visible     |
| `supported_partial` | store supported but only some capabilities available  | partial cards active, unavailable reasons shown  |
| `unsupported_site`  | site not supported                                    | honest unsupported state, route to help/settings |
| `permission_needed` | support exists but host/browser permission is missing | permission card plus grant action                |
| `error`             | runtime or adapter failure                            | error summary plus retry or logs route           |

## UI Layering Rule

Shopflow UI must follow this layering model:

- `tokens`
- `primitives`
- `patterns`
- `features`
- `pages`

Rules:

1. `primitives` must not depend on `features`
2. `patterns` must not depend on `pages`
3. `features` may depend on `patterns + primitives`
4. `pages` compose other layers but should not re-implement primitive styling
5. deep UI layers must consume props or schema-safe view-models, not raw browser data

## Canonical Home View Model

The home page must not consume ad-hoc raw runtime blobs.

It should consume a shaped view-model such as:

```ts
type SidePanelHomeViewModel = {
  appTitle: string;
  appStatus: 'live' | 'idle' | 'unsupported' | 'error';
  site: {
    siteId: string;
    siteName: string;
    host: string;
    pageKind: 'product' | 'search' | 'deal' | 'cart' | 'manage' | 'unknown';
    urlLabel: string;
  };
  capabilities: Array<{
    id:
      | 'extract_product'
      | 'extract_search'
      | 'extract_deals'
      | 'run_action'
      | 'export_data';
    label: string;
    description: string;
    status:
      | 'ready'
      | 'unsupported_page'
      | 'permission_needed'
      | 'not_implemented'
      | 'degraded'
      | 'blocked';
    reason?: string;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    variant: 'primary' | 'secondary' | 'ghost';
    disabled?: boolean;
  }>;
  recentActivities: Array<{
    id: string;
    label: string;
    timestampLabel: string;
    href?: string;
  }>;
};
```

## Design Direction

Shopflow should feel like:

- clean
- restrained
- tool-like
- lightly professional

It should not feel like:

- a heavy SaaS dashboard
- a flashy cyber UI
- a cluttered settings wall

Short version:

> Shopflow should feel like a shopping copilot, not like a noisy admin console.

## Surface Ownership Summary

| Surface    | Owns                                                                     | Must Not Own                                    |
| :--------- | :----------------------------------------------------------------------- | :---------------------------------------------- |
| Side Panel | capability rendering, primary action launch, recent activity, navigation | raw DOM probing, duplicate settings systems     |
| Popup      | route-in, quick summary, one primary CTA                                 | heavy operational workflows                     |
| Content UI | inline CTA, highlight, badge, lightweight affordance                     | main app shell, full settings, large dashboards |
| Options    | settings, permissions, policy explanation                                | main operational workflows                      |
