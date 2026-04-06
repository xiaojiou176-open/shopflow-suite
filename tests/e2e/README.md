# E2E Smoke

This directory is the browser-level smoke home for Shopflow.

Current status:

- Playwright is wired at the repo root.
- Routed-fixture smoke now exists for **Wave 1 + Wave 2 + Wave 3** apps, plus the Suite internal alpha shell.
- Shared browser helpers live in `tests/e2e/support/extension-smoke.ts`.

Current smoke coverage proves:

- extension loads
- popup opens
- side panel opens
- current page detection renders honestly
- capability gating stays inside adapter truth

Important boundary:

- routed fixtures are **repo verification**, not live proof
- action-heavy public claims still require live receipt evidence
- Suite smoke must stay internal-only and must not pretend to be a second logic plane
