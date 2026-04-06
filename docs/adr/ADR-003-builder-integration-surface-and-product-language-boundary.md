# ADR-003: Builder Integration Surface and Product Language Boundary

- Status: Accepted
- Date: 2026-04-01
- Owners: Shopflow Product + Ecosystem
- Related:
  - [ADR-001: Shopflow Repo Topology and Product Boundary](./ADR-001-shopflow-repo-topology-and-product-boundary.md)
  - [ADR-002: Release Wave and Product Tiering](./ADR-002-release-wave-and-product-tiering.md)
  - [Shopflow Product Surface Spec](../ui/shopflow-product-surface-spec.md)
  - [Agent and MCP Positioning](../ecosystem/agent-and-mcp-positioning.md)
  - [Builder Read Models](../ecosystem/builder-read-models.md)

## Context

Shopflow's original contract already locked the repo into a shopping-only,
Chrome-first `8+1` extension family with one engineering source of truth.

That solved the product-shape problem, but it left four newer questions only
partially answered:

1. Which builder-facing surfaces are already real today?
2. Which integration surfaces are worth moving into current-scope now?
3. How should Shopflow talk about AI, agents, API, MCP, CLI, SDK, skills, and
   marketplace paths without overclaiming?
4. What language policy keeps public copy and product UI systematic instead of
   drifting into scattered bilingual literals?

The repo now already contains:

- typed contracts
- read-only runtime truth
- builder snapshots
- operator decision briefs
- workflow-copilot briefs
- English-first locale catalogs with `zh-CN` overrides for core shared surfaces

At the same time, the repo still does **not** contain:

- a public API transport
- a public MCP surface
- a generated SDK
- official marketplace packages for external AI coding ecosystems

We therefore need a formal contract that upgrades the stronger product vision
without rewriting future aspirations as today-ready product truth.

## Decision

### 1. Shopflow remains an operator runtime first

Shopflow's category stays:

- shopping extension family
- contract-first operator runtime

It does **not** become, by wording alone:

- a generic AI shopping assistant
- a hosted shopping SaaS
- a write-capable MCP hub

In plain language:

> AI and builder integration must grow from the existing shopping runtime truth.
> They must not replace the repo's real product category.

### 2. AI must stay inside the real workflow

Current AI-facing truth in this repo is not a floating chat panel.

Current-scope AI must remain anchored to:

- workflow decision briefs
- workflow copilot briefs
- operator next-step assistance
- evidence and claim-boundary explanation

That means:

- AI may explain readiness, routing, blockers, evidence state, and next move
- AI may help builders consume typed runtime truth
- AI must not be presented as generic autonomous shopping execution

### 3. API substrate first means machine-readable read models first

For Shopflow, `API substrate first` means:

- keep typed contracts stable
- keep read-only runtime truth stable
- keep builder-facing examples stable
- make future API / MCP / CLI / SDK surfaces easier to add later

It does **not** mean:

- a public HTTP API already exists today
- a public MCP already exists today
- a generated SDK already exists today

The substrate sequence is therefore:

1. typed contracts and read-only runtime truth
2. builder-facing docs and examples
3. future read-only API / MCP transport
4. future CLI wrapper or thin SDK

### 4. Product language policy is now a contract, not just a copy preference

Public-facing surfaces must be:

- English-first

Product UI must be:

- English-default
- compatible with `zh-CN` through shared locale catalogs

Current repo truth may say:

- core user-visible surfaces run on an English-first locale track
- shared locale catalogs already support `en` and `zh-CN`
- core shell surfaces now expose a minimal user-visible language route toggle

Current repo truth must **not** say:

- a full product-wide language settings system is already shipped
- full bilingual product polish is already complete

Hard rule:

> New user-visible strings must route through shared locale catalogs.
> Scattered bilingual literals are contract drift.

### 5. Shopflow now uses five honest integration buckets

#### Today

- typed store-adapter contracts and verified-scope boundaries
- read-only runtime truth for detection, latest output, recent activity, and
  evidence queue state
- workflow decision briefs and workflow-copilot briefs
- review-bundle and submission-readiness artifacts
- English-first public copy and builder-facing read models

#### Current-scope now

- keep the builder-facing integration substrate explicit and machine-readable
- keep AI in the operator workflow rather than in a generic assistant shell
- keep public surfaces English-first while product UI remains English-default
  with `zh-CN` support through locale catalogs
- keep builder-facing wording clear enough that Codex / Claude Code style
  builders can understand the repo truth without pretending official
  integrations already exist

#### Later

- read-only MCP surface backed by the same runtime truth
- read-only public API transport
- generated client or thin SDK
- CLI wrapper or skills pack built on the same read models

#### No-go for the current stage

- write-capable MCP
- hosted SaaS control plane
- generic autonomous shopping assistant
- public wording that outruns reviewed live evidence

#### Owner-decision

- official marketplace or plugin packaging for external AI coding ecosystems
- public CLI commitments
- public skills distribution commitments
- public API publication beyond the current repo-owned substrate

### 6. Ecosystem binding is now explicit

Shopflow may use the following truthful binding matrix:

| Target | Placement | Truthful wording now | Must not claim now |
| :--- | :--- | :--- | :--- |
| `Codex` | front-door primary example | strong builder fit because Shopflow already exposes typed contracts, workflow briefs, read-only builder snapshots, and path-bounded repo surfaces | official integration, official plugin, marketplace package |
| `Claude Code` | front-door primary example | strong builder fit for the same builder-facing reasons | official integration, official plugin, shipped skills pack |
| `OpenCode` | ecosystem secondary | useful comparison or later-facing integration path when CLI/skills packaging becomes explicit | main hero binding, official package |
| `OpenHands` | ecosystem secondary | useful comparison for agentic coding and automation | main hero binding, official package |
| `OpenClaw` | comparison-only | comparison context only, not a main front-door fit | first-class front-door placement, official integration |

`MCP` is not treated as a brand binding in this matrix.
It remains a future read-only surface category that may later grow from the
same runtime truth.

## Consequences

### Positive

- Shopflow can upgrade its builder-facing story without pretending the repo is
  already a public API or MCP platform
- English-first public copy and systematic locale routing become shared rules
  instead of isolated copy decisions
- AI relevance is now grounded in real workflow objects that already exist in
  the repo
- later/no-go/owner-decision boundaries become easier to enforce across README,
  docs hub, public copy, and release notes

### Negative

- README and ecosystem docs must now carry more precise bucket language
- future builders may still ask for public API / MCP / SDK surfaces that the
  repo does not yet ship
- marketplace/plugin/skills paths cannot be silently invented; they must wait
  for owner decisions and external ecosystem confirmation

## Hard Rules

1. Do not move public API / MCP / SDK into `today` without fresh repo-owned
   evidence of those surfaces.
2. Do not claim a broader language settings system until it actually exists beyond the minimal shell-level route toggle.
3. Do not add new user-visible strings outside shared locale catalogs.
4. Do not use AI wording that turns Shopflow into a generic assistant product.
5. Do not let ecosystem/platform wording outrun adapter truth, operator truth,
   or verified-scope boundaries.

## Required Follow-up

This ADR is only complete when the same change set also updates:

- `README.md`
- `docs/README.md`
- `docs/ecosystem/agent-and-mcp-positioning.md`
- `docs/ui/shopflow-product-surface-spec.md`
- `CHANGELOG.md`
