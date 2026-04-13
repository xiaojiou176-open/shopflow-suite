# Builder Surfaces

This page explains which Shopflow surfaces are **real today**, which are
**future-facing**, and which still should **not** be claimed.

If you are trying to decide where to start, use
[Builder Start Here](./builder-start-here.md). If you already know you need a
concrete read-only flow, use [Integration Recipes](./integration-recipes.md).
If you want the checked-in sample payloads before reading longer pages, use
[Builder Examples Index](./examples/README.md).

## Today

The truthful builder-facing surfaces that exist today are:

- typed store-adapter contracts in `@shopflow/contracts`
- one read-only provider-runtime seam contract that names the Shopflow versus
  external runtime ownership split
- runtime read models for:
  - latest output
  - recent activity
  - evidence capture state
- operator decision briefs that summarize:
  - current stage
  - why the app is in that stage
  - the next route to take
- workflow-copilot briefs that summarize runnable-now, claim-gate, and next-step truth
- review-bundle and submission-readiness artifacts
- one repo-local runtime payload writer for supported current-scope apps
- one repo-local read-only outcome bundle command that joins the integration surface, prefers generated runtime payload files when they exist, falls back to checked-in examples when they do not, and folds in generated release-artifact summaries
- one repo-local read-only CLI prototype that wraps the same read-only surfaces for local consumption
- one repo-local read-only stdio MCP transport over the same core repo-truth surfaces

### Example: Operator Decision Brief

```json
{
  "surfaceId": "operator-decision-brief",
  "schemaVersion": "shopflow.operator-decision-brief.v1",
  "readOnly": true,
  "appTitle": "Shopflow for Albertsons Family",
  "stage": "claim-gated",
  "summary": "2 packets still need capture or recapture. Public wording stays blocked until a reviewable packet exists.",
  "whyNow": [
    "www.safeway.com · cart",
    "Open supported workflow is runnable right now.",
    "2 packets still need capture or recapture. Public wording stays blocked until a reviewable packet exists."
  ],
  "nextStep": "Reconfirm repo verification is green before opening a live Safeway cart session.",
  "primaryRouteLabel": "Open supported workflow",
  "primaryRouteHref": "https://www.safeway.com/shop/cart",
  "primaryRouteOrigin": "evidence-source",
  "claimBoundary": "Currently verified on Safeway. Public wording stays gated until live receipt review is complete."
}
```

This inline example is intentionally aligned with the checked-in payload at
[`docs/ecosystem/examples/operator-decision-brief.ext-albertsons.json`](./examples/operator-decision-brief.ext-albertsons.json).

What this means in plain language:

> Shopflow already has a structured, machine-readable explanation layer for
> real operator decisions. That is useful for builders today even before any
> public API or MCP exists.

That now also includes a repo-local bundle command:

```bash
pnpm builder:write-outcome-bundle
```

This command is:

- read-only
- repo-local
- truthful current-scope tooling

It is **not**:

- a public CLI commitment
- a public API transport
- a public HTTP MCP surface

The same current-scope truth now also has a repo-local CLI-shaped wrapper:

```bash
pnpm cli:read-only -- agent-integration-bundle
pnpm cli:read-only -- agent-target-packet --target codex
pnpm cli:read-only -- agent-target-packet --target claude-code
pnpm cli:read-only -- agent-target-packet --target openclaw
pnpm cli:read-only -- integration-surface
pnpm cli:read-only -- runtime-seam
```

This wrapper is still:

- repo-local
- read-only
- current-scope convenience only

It is **still not**:

- a public CLI commitment
- a public SDK surface
- marketplace packaging

The outcome bundle also points to the ready-to-sync copy packet and the
paste-ready snippets, so builders do not have to guess which current-scope
artifact is for machine consumption versus external copy sync.
When the repo already produced release artifacts, the bundle also folds in the
current app's manifest and submission-readiness summary instead of only hanging
path labels.
The checked-in example rack now also covers `ext-albertsons`, `ext-amazon`,
`ext-kroger`, and `ext-temu`, and maintainers can refresh that rack with
`pnpm builder:refresh-example-rack` instead of hand-editing JSON.
The same repo-local surface now also includes an agent-onboarding bundle for
Codex / Claude Code plus an OpenClaw comparison packet, and now also exposes a
smaller target-specific handoff packet when one ecosystem needs a shorter route
than the full onboarding bundle, while still keeping all of those below
official integration or marketplace-claim territory.

## Later

These are plausible next surfaces, but they are **not current product
capabilities**:

- read-only public API contract
- public HTTP MCP transport
- generated client or thin TypeScript SDK

## No-Go for the Current Stage

These should **not** be presented as current-scope:

- write-capable MCP
- hosted SaaS control plane
- generic autonomous shopping agent
- public API platform wording that outruns the repo's actual surfaces
