# Live Receipt Evidence Boundary

- Status: Public summary
- Date: 2026-04-18
- Related:
  - [Testing and Verification Bar](../contracts/testing-and-verification-bar.md)
  - [Shopflow Brand and Claim Boundary](../branding/shopflow-brand-and-claim-boundary.md)

## Purpose

This page explains what Shopflow means by **live receipt evidence** and why it
still matters after repo verification is already green.

In plain language:

> repo verification proves the product path is real.
> live receipt evidence is the extra layer that proves a claim-gated workflow
> was actually observed on a real merchant session.

## What the Repo Already Proves

Today the repo can already prove:

- fixture-backed workflow semantics
- contract, integration, and E2E behavior
- review-bundle packaging and reviewer handoff
- claim-boundary wording on the extension surfaces

That is why Shopflow can honestly say `repo-verified`.

## What the Repo Does Not Prove by Itself

The repo still cannot prove these things by code alone:

- that a real merchant session exposed the required live state
- that a live capture was reviewed and accepted as evidence
- that a claim-gated workflow is safe to promote into broader public wording

That missing layer is why `repo-verified` and `public-claim-ready` are not the
same state.

## Current Claim-Gated Flows

The most important live-evidence lines today are still:

- `Shopflow for Albertsons Family`
  - Safeway Schedule & Save subscribe / cancel proof
- `Shopflow for Temu`
  - warehouse-filter proof when public wording depends on it

These lines can stay claim-gated even when the repo-side review shelf is
otherwise complete.

## Public-Safe Review Sequence

1. confirm the repo-owned verification lane is green
2. inspect the review shelf and reviewer start path
3. perform the real merchant capture outside version control
4. review that capture as `reviewed`, `rejected`, or still `blocked`
5. only then reconsider whether public wording can be raised

In plain language:

> first prove the repo.
> then prove the live claim.

## What This Page Intentionally Does Not Expose

This public page does **not** carry:

- maintainer-only browser/profile command choreography
- repo-local artifact paths and trace-bundle internals
- operator JSON templates or review-input mechanics
- host/browser troubleshooting procedures

Those procedures are maintained off the public docs shelf so the public-facing
docs stay focused on product truth and claim boundaries.
