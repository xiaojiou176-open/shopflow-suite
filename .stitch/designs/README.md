# Shopflow UIUX Endgame Artifacts

## Status

- source of truth: `.stitch/DESIGN.md`
- artifact mode: repo-local fallback
- reason: Stitch MCP auth was unavailable in this run, so the high-fidelity artifacts were produced from the repo itself and stored here

## Artifact Sets

### Before

- `before/ext-albertsons.popup.before.png`
- `before/ext-albertsons.sidepanel.before.png`
- `before/ext-shopping-suite.sidepanel.before.png`

### After

- `after/ext-albertsons.popup.after.png`
- `after/ext-albertsons.sidepanel.after.png`
- `after/ext-shopping-suite.sidepanel.after.png`

### Matrix / R3

- `matrix/r3/ext-albertsons.popup.en.png`
- `matrix/r3/ext-albertsons.sidepanel.en.png`
- `matrix/r3/ext-kroger.sidepanel.en.png`
- `matrix/r3/ext-temu.popup.en.png`
- `matrix/r3/ext-albertsons.popup.zh-CN.png`
- `matrix/r3/ext-albertsons.sidepanel.zh-CN.png`
- `matrix/r3/ext-shopping-suite.sidepanel.zh-CN.png`

## What Changed

- popup now behaves like a route-first launcher instead of a mini sidepanel
- sidepanel now puts readiness, operator route, claim boundary, and proof at the top before deeper evidence detail
- suite now opens like a concierge lobby, with deeper rollout / evidence / scope sections moved behind progressive disclosure

## Evidence Note

These after artifacts correspond to the same run that passed:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm exec vitest run tests/unit/popup-launcher.test.ts tests/unit/side-panel-home-page.test.tsx tests/unit/suite-alpha-page.test.tsx tests/integration/ui-surface-capture.tooling.test.ts`
- `pnpm capture:ui-surfaces`
- `pnpm exec playwright test tests/e2e/ext-albertsons.smoke.spec.ts tests/e2e/ext-shopping-suite.smoke.spec.ts`

These R3 matrix artifacts correspond to the newer matrix/quality lane:

- `pnpm exec vitest run tests/integration/ui-surface-matrix.tooling.test.ts`
- `pnpm capture:ui-matrix`
- `pnpm exec playwright test tests/e2e/ui-surface-quality.spec.ts`
