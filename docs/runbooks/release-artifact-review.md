# Release Review Shelf Boundary

- Status: Public summary
- Date: 2026-04-18
- Related:
  - [Testing and Verification Bar](../contracts/testing-and-verification-bar.md)
  - [Live Receipt Evidence Boundary](./live-receipt-capture.md)
  - [ADR-002: Release Wave and Product Tiering](../adr/ADR-002-release-wave-and-product-tiering.md)

## Purpose

This page explains what the Shopflow **review shelf** means and what it does
**not** mean.

In plain language:

> the review shelf proves that reviewer-facing bundles and readiness materials
> exist.
> it does not mean the product is signed, store-ready, or public-claim-ready.

## Current Review Channels

Shopflow currently exposes two reviewer-facing channels:

- `store-review`
  - store app bundles for review and verification
- `internal-alpha-review`
  - the Suite internal-alpha bundle

These are review channels, not store-submission channels.

## What Review Artifacts Prove

The review shelf is meant to show:

- that a bundle exists for the app
- that the repo can package it consistently
- that a reviewer has a clear starting point
- that claim-gated versus internal-alpha boundaries are being described honestly

It is useful because it compresses repo-owned release-readiness truth into one
reader-facing shelf.

## What Review Artifacts Must Not Be Mistaken For

Review artifacts are **not**:

- signed production packages
- Chrome Web Store submissions
- proof that public support wording is already safe
- a replacement for reviewed live receipt evidence

## Public-Safe Review Order

1. open the latest release shelf
2. read the submission-readiness summary for the app
3. inspect the per-app review bundle and reviewer start path
4. decide whether the remaining blocker is:
   - still repo-owned packaging or parity drift
   - external live evidence
   - external signing or real submission work

In plain language:

> read the handoff card first, then inspect the bundle, then judge the outer
> blocker honestly.

## Required Boundary Rules

1. `Shopflow Suite` stays explicitly `internal-alpha-review`
2. store apps stay explicitly `store-review`
3. review shelf wording must stay below signed/store-ready/public-ready claims
4. reviewed live evidence and signed release work remain separate outer layers

## What This Page Intentionally Does Not Expose

This public page does **not** carry:

- maintainer-only packaging choreography
- repo-local artifact paths and reproduction commands
- CI implementation details for author-time workflows
- release-engineering repair procedures

Those details are kept off the public docs shelf so this page can stay focused
on reviewer-facing meaning instead of maintainer operations.
