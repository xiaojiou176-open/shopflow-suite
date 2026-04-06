# ADR-004: Switchyard Provider Runtime Seam

- Status: Accepted
- Date: 2026-04-03
- Owners: Shopflow Product + Runtime
- Related:
  - [ADR-003: Builder Integration Surface and Product Language Boundary](./ADR-003-builder-integration-surface-and-product-language-boundary.md)
  - [Live Receipt Capture Runbook](../runbooks/live-receipt-capture.md)

## Context

Shopflow already owns:

- storefront truth
- verified-scope wording
- operator workflow
- evidence ledger semantics
- builder read models

But Shopflow does **not** currently ship:

- a provider runtime
- BYOK orchestration
- web-login acquisition
- auth/session routing across AI providers

Those responsibilities belong to a different layer than merchant live evidence.

## Decision

Shopflow will keep its own product truth and workflow truth, while treating
`Switchyard` as the future external provider runtime seam.

In plain language:

> Shopflow keeps the shopping desk.
> Switchyard can become the shared power strip.

### Shopflow keeps

- storefront truth and verified-scope boundaries
- operator workflow, reviewed-packet discipline, and release-readiness logic
- builder read models and workflow briefs

### Switchyard may own

- BYOK
- web-login acquisition
- auth/session handling
- provider routing

### Hard boundaries

1. Switchyard must not be described as merchant live-evidence proof.
2. Shopflow must not regrow a second long-term provider runtime inside its own
   product surface.
3. The first implementation slice is a thin route/contract seam only, not a
   full runtime integration.

## First Implementation Slice

This ADR is only considered landed when the same change set contains:

- a read-only seam contract under `packages/contracts`
- a thin route builder under `packages/core`
- tests that prove the seam builds current `Switchyard` acquisition routes

That first slice is intentionally narrow.
It creates a clean connection point without pretending the full provider lane is
already in use by Shopflow.
