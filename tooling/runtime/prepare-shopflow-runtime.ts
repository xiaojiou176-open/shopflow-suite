import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  applyShopflowExternalCacheCleanupActions,
  buildShopflowCacheEnvironment,
  createShopflowExternalCacheCleanupActions,
  ensureShopflowCacheDirectories,
  resolveShopflowCachePolicy,
} from '../maintenance/cache-policy';

function maybePrunePnpmStore() {
  try {
    execFileSync('pnpm', ['store', 'prune'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
  } catch {
    // Keep the runtime bootstrap best-effort. The directory-level Shopflow
    // cleanup pass still enforces TTL/cap on the Shopflow-owned cache root.
  }
}

async function ensurePlaywrightChromiumAvailable(
  envMap: ReturnType<typeof buildShopflowCacheEnvironment>
) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = envMap.PLAYWRIGHT_BROWSERS_PATH;
  const { chromium } = await import('@playwright/test');
  let executablePath = chromium.executablePath();

  if (!existsSync(executablePath)) {
    execFileSync('pnpm', ['exec', 'playwright', 'install', 'chromium'], {
      env: {
        ...process.env,
        ...envMap,
      },
      stdio: 'inherit',
      encoding: 'utf8',
    });
    executablePath = chromium.executablePath();
  }

  return executablePath;
}

async function main() {
  const policy = resolveShopflowCachePolicy(process.env);
  ensureShopflowCacheDirectories(policy);
  maybePrunePnpmStore();

  const actions = createShopflowExternalCacheCleanupActions(policy);
  const applied = applyShopflowExternalCacheCleanupActions(policy, actions);
  const envMap = buildShopflowCacheEnvironment(policy);
  const chromiumExecutable = await ensurePlaywrightChromiumAvailable(envMap);

  process.stdout.write(
    [
      `Shopflow runtime cache prepared at ${policy.cacheRoot}`,
      `pnpm store: ${envMap.PNPM_STORE_DIR}`,
      `playwright browsers: ${envMap.PLAYWRIGHT_BROWSERS_PATH}`,
      `playwright chromium executable: ${chromiumExecutable}`,
      `tmp root: ${envMap.TMPDIR}`,
      `removed external cache items: ${applied.length}`,
    ].join('\n') + '\n'
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
