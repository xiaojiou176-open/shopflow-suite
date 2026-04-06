import { defineConfig } from '@playwright/test';
import { resolveShopflowCachePolicy } from './tooling/maintenance/cache-policy';

process.env.PLAYWRIGHT_BROWSERS_PATH ??=
  resolveShopflowCachePolicy().paths['ms-playwright'];

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: '.runtime-cache/temp/playwright-test-results',
  // Release-readiness replays the full extension smoke lane after hygiene,
  // coverage, and rebuild steps. A wider budget keeps persistent-context
  // extension boot from timing out before the actual assertions run. The
  // current serial lane can spend substantial time on extension startup after
  // coverage and multi-wave rebuilds, so the browser-test budget must reflect
  // that end-to-end load instead of only the isolated smoke path.
  timeout: 180_000,
  // Extension smoke launches multiple persistent Chromium contexts.
  // Serializing workers keeps the release gate stable instead of letting
  // parallel extension boot race the same local/browser resources.
  workers: 1,
  use: {
    headless: true,
  },
});
