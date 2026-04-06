# Builder Current-Scope Readiness

This page is the acceptance card for Shopflow's **builder-facing / current-scope
/ repo-local / read-only** productization line.

In plain language:

> this is the scorecard for the builder-facing room in the house.
> it is **not** the scorecard for every unfinished part of the whole house.

## What This Page Covers

This page answers:

- what the builder-facing current-scope line already does
- what still remains repo-side actionable inside that same line
- which repo-global brakes still exist, but should not be confused with this
  subline's own completion state
- whether git closeout is ready yet

It does **not** turn current-scope builder progress into:

- public API proof
- public MCP proof
- public-ready support proof
- signed store-release proof

## Builder-Facing Acceptance Matrix

| Line item                                                                                                     | Status     | Why it matters                                                                                                                                                 | Evidence anchor                                                                                                                                                                                                          | Next owner                                                                    |
| :------------------------------------------------------------------------------------------------------------ | :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- |
| Multi-app generated runtime payload emitters for `ext-albertsons`, `ext-amazon`, `ext-kroger`, and `ext-temu` | `done`     | current-scope builder truth is no longer a one-app special case                                                                                                | `tooling/builder/runtime-payloads.ts`, `pnpm builder:write-runtime-payloads -- --app <appId>`, `.runtime-cache/builder/*.json`                                                                                           | keep under L1 ownership when widening to more apps                            |
| Refreshable checked-in multi-app example rack                                                                 | `done`     | checked-in examples are now refreshable by script instead of hand-maintained JSON                                                                              | `tooling/builder/write-builder-example-rack.ts`, `pnpm builder:refresh-example-rack`, `docs/ecosystem/examples/*.json`                                                                                                   | maintainers run the refresh command when generated truth changes              |
| Multi-app outcome bundle consumption                                                                          | `done`     | builders can consume one read-only bundle that prefers generated runtime payloads and folds in release-artifact summaries                                      | `tooling/builder/write-builder-outcome-bundle.ts`, `packages/runtime/src/builder-outcome-bundle.ts`, `.runtime-cache/release-artifacts/*.json`                                                                           | keep current-scope/read-only boundary explicit                                |
| Provider-runtime seam visibility in builder-facing contract surfaces                                          | `done`     | builders can now see where external runtime acquisition begins without mistaking that seam for merchant live proof                                            | `packages/contracts/src/builder-integration-surface.ts`, `packages/contracts/src/provider-runtime-seam.ts`, `docs/adr/ADR-004-switchyard-provider-runtime-seam.md`, `docs/ecosystem/examples/builder-outcome-bundle.*.json` | keep the seam read-only and do not overclaim runtime hookup                   |
| Repo-local read-only CLI prototype                                                                            | `done`     | builders now have one local CLI-shaped wrapper around the same read-only surfaces, including the provider-runtime seam, without turning that convenience into a public CLI promise | `tooling/cli/read-only.ts`, `pnpm cli:read-only -- integration-surface`, `pnpm cli:read-only -- runtime-seam`, `tests/integration/read-only-cli.tooling.test.ts`, `packages/contracts/src/builder-integration-surface.ts` | keep repo-local only and do not overclaim public CLI commitment               |
| Agent-specific quickstarts and onboarding bundle                                                              | `done`     | Codex and Claude Code now have concrete repo-owned quickstarts, while OpenClaw now has a public-ready packet instead of a comparison-only placeholder | `packages/contracts/src/agent-integration-bundle.ts`, `pnpm cli:read-only -- agent-integration-bundle`, `pnpm cli:read-only -- agent-target-packet --target codex`, `docs/ecosystem/agent-quickstarts.md`, `docs/ecosystem/codex-quickstart.md`, `docs/ecosystem/claude-code-quickstart.md`, `docs/ecosystem/openclaw-comparison.md`, `docs/ecosystem/openclaw-public-ready-matrix.md` | keep agent onboarding repo-local, read-only, and below official-listing claims |
| Builder-facing docs and tooling truth sync                                                                    | `done`     | docs/tooling now describe the same multi-app example rack and refresh path as the code                                                                         | `tooling/README.md`, `docs/ecosystem/builder-start-here.md`, `docs/ecosystem/builder-read-models.md`, `docs/ecosystem/integration-recipes.md`, `docs/ecosystem/examples/README.md`, `docs/ecosystem/builder-surfaces.md` | L1 owns final wording                                                         |
| Ready-to-sync public copy expansion for this round's repo-local change                                        | `done`     | public-facing copy now acknowledges current-scope distribution packets without overclaiming official listing or reviewed live proof | `docs/ecosystem/public-copy.ready.md`, `docs/ecosystem/ready-to-sync-public-copy.md`, `docs/ecosystem/release-body.ready.md`, `docs/ecosystem/repo-description.ready.md`                                                 | keep copy aligned with official-surface-dependent claim boundaries |
| Widen the builder-facing example rack beyond the current four app set                                         | `not done` | more apps can still be added later, but Prompt 9 only requires a limited current-scope rack                                                                    | `docs/ecosystem/examples/README.md`, `tooling/builder/runtime-payloads.ts`                                                                                                                                               | future prompt, not a blocker for Prompt 9                                     |

## Repo-Side Still-Actionable Inside This Subline

These are still valuable, but they are **next-step expansion work**, not the
current builder-facing subline's blockers:

- widen generated runtime payload emitters beyond `ext-albertsons`,
  `ext-amazon`, `ext-kroger`, and `ext-temu`
- decide whether `ext-costco`, `ext-walmart`, `ext-weee`, `ext-target`, or
  `ext-shopping-suite` deserve current-scope example-rack coverage
- add stronger diff/audit helpers if example-rack refresh review becomes noisy
- keep plugin / skills / listing packets aligned with the new current-scope
  public-distribution contract as the official-surface matrix evolves

## Repo-Global Brakes That Still Exist

These remain real, but they are **not evidence that the builder-facing
current-scope subline failed**:

| Repo-global brake                                | Status          | Why it is not this subline's own blocker                                                                                    |
| :----------------------------------------------- | :-------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| `live receipt evidence bundles`                  | `external only` | reviewed live evidence is a public-claim gate, not a builder-facing read-only tooling prerequisite                          |
| `store-ready signed extension release artifacts` | `external only` | signed release packaging remains beyond current repo-local builder productization                                           |

## Closeout Readiness Summary

- Builder-facing line: **repo-side compressed**
- Strongest gate: **must stay trustworthy by fresh evidence; if it is red, this
  subline cannot be treated as closed**
- Git closeout: **ready for the current repo-owned baseline**, because the
  current local `main` is now landed on `origin/main`
