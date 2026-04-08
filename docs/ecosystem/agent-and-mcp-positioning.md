# Agent and MCP Positioning

## Purpose

This note keeps Shopflow's AI, agent, API, and MCP wording truthful.

In plain language:

> Shopflow is an operator runtime first. Any AI, agent, API, or MCP story must grow from that fact.

## What Shopflow Can Truthfully Claim Today

Shopflow already has:

- typed store-adapter contracts
- structured workflow state for readiness, degradation, and blocking causes
- structured operator decision briefs that explain why the app is in its
  current stage and which route to take next
- workflow-copilot briefs that summarize runnable now, claim gates, and the
  next operator move
- latest-output and latest-source routing in shared operator surfaces
- live-evidence capture state, review state, and claim-gate semantics
- review-bundle packaging plus submission-readiness reporting
- a concrete read-only builder snapshot assembled from those same runtime records
- a workflow decision brief surface that summarizes why a route is runnable, gated, or still waiting for context
- English-first public copy with shared locale catalogs that already support
  `en` and `zh-CN` for core shared surfaces

That means Shopflow can truthfully present itself as:

- a shopping operator control plane
- a contract-first runtime for store-specific workflows
- an agent-ready repo where builders can inspect typed workflow truth instead of scraping prose
- a repo with a today-ready read-model surface even before public API or MCP exist
- a repo where AI already shows up inside the operator flow instead of as a generic chat add-on

## What Shopflow Should Not Claim Today

Shopflow should not claim that it already is:

- a public MCP platform
- a public API service
- a hosted SaaS control plane
- a generic AI shopping assistant
- a write-capable autonomous system

## Ecosystem Fit Matrix

| Target | Placement | Truthful wording now | Must not claim now |
| :--- | :--- | :--- | :--- |
| `Codex` | front-door primary + public-distribution current-scope | strong builder fit because Shopflow already exposes typed contracts, workflow briefs, review tooling, read-only builder snapshots, and a plugin-level distribution bundle story | official integration or official listing where no official Codex public surface exists |
| `Claude Code` | front-door primary + public-distribution current-scope | strong builder fit for the same builder-facing reasons, now with a stronger skills-facing and plugin-level distribution path | official integration or official listing where no official Claude Code public surface exists |
| `MCP` | read-only distribution packet now; public transport later | today's runtime truth already supports a truthful capability packet and directory/listing prep, even though a public MCP server is still not shipped | current public MCP product or write-capable MCP |
| `OpenCode` | ecosystem secondary | useful comparison or later-facing integration path when CLI or skills packaging becomes explicit | main hero placement, official package |
| `OpenHands` | ecosystem secondary | useful comparison for agentic coding and workflow automation | main hero placement, official package |
| `OpenClaw` | public-ready secondary target + fallback install shell | public installation, discovery, and proof work are now in current scope, but canonical docs/proof stay in `shopflow-suite` and official-listing claims still depend on whether an official OpenClaw public surface really exists | fake official listing, second-canonical-repo drift, or overclaiming first-party integration without the real external surface |

## Today, Current-Scope Now, Later, No-Go, and Owner-Decision

### Today

- typed contracts and runtime truth
- operator-facing readiness and evidence guidance
- review-bundle and submission-readiness surfaces
- read-only builder snapshots assembled from existing runtime truth
- workflow decision briefs and workflow-copilot briefs

### Current-scope now

- keep the builder-facing integration substrate machine-readable and stable
- keep AI inside the operator workflow instead of in a generic assistant shell
- keep public surfaces English-first while product UI stays English-default with
  `zh-CN` support through shared locale catalogs
- keep new user-visible strings out of scattered bilingual literals
- push Codex, Claude Code, and OpenClaw through real public-distribution work:
  - starter bundles
  - sample config
  - install docs
  - proof loop
  - package / listing / catalog metadata
- use the official public surface when the target ecosystem actually has one
- otherwise use the strongest truthful public distribution surface that exists
- harden front door, install path, discoverability, and SEO for those routes

### Later

- read-only MCP transport
- read-only API transport
- generated client or thin SDK
- hosted runtime product

### No-go for current stage

- write-capable MCP
- hosted generic autonomy
- public wording that outruns reviewed live evidence

### Surface-dependent publication boundary

- official-listing language for ecosystems that may or may not expose an
  official public surface
- publisher slug / namespace / irreversible channel choices
- public API publication beyond the current repo-owned substrate

## Builder Guidance

If you are evaluating Shopflow as a builder:

1. Start from the contracts and verification bar
2. Start with [Builder Start Here](./builder-start-here.md) if you want the
   shortest truthful route map
3. Treat runtime and review artifacts as the current trusted integration surface
4. Use the builder snapshot read model when you need one joined view of
   detection, latest output, recent activity, and evidence queue state
5. Use workflow decision briefs and workflow-copilot briefs when you need
   builder-readable next-step and claim-gate context
6. Do not assume a public API, public MCP, or public CLI already exists
7. Expect future API / MCP / CLI work to stay read-only first
8. Use [Integration Recipes](./integration-recipes.md) when you want commands
   or import paths instead of only positioning language
9. Use [Agent Quickstarts](./agent-quickstarts.md) when you want the shortest
   Codex / Claude Code / OpenClaw entrypoint instead of the full matrix
