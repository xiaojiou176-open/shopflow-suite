import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, expect, type BrowserContext, type Page } from '@playwright/test';
import { resolveFromRepo as repoPath } from '../../support/repo-paths';

export const extensionAppConfig = {
  'ext-albertsons': {
    bundleDir: 'apps/ext-albertsons/.output/chrome-mv3',
    fixturePath: 'tests/fixtures/albertsons/action/cart-page.html',
    url: 'https://www.safeway.com/shop/cart',
    datasetKey: 'shopflowAlbertsonsState',
  },
  'ext-amazon': {
    bundleDir: 'apps/ext-amazon/.output/chrome-mv3',
    fixturePath: 'tests/fixtures/amazon/product/product-page.html',
    url: 'https://www.amazon.com/dp/shopflow-grinder',
    datasetKey: 'shopflowAmazonState',
  },
  'ext-target': {
    bundleDir: 'apps/ext-target/.output/chrome-mv3',
    fixturePath: 'tests/fixtures/target/deal/deal-page.html',
    url: 'https://www.target.com/pl/deals',
    datasetKey: 'shopflowTargetState',
  },
  'ext-costco': {
    bundleDir: 'apps/ext-costco/.output/chrome-mv3',
    fixturePath: 'tests/fixtures/costco/product/product-page.html',
    url: 'https://www.costco.com/shopflow-colombian-coffee.product.4000001234.html',
    datasetKey: 'shopflowCostcoState',
  },
  'ext-kroger': {
    bundleDir: 'apps/ext-kroger/.output/chrome-mv3',
    fixturePath: 'tests/fixtures/kroger/deal/deal-page.html',
    url: 'https://www.fredmeyer.com/savings/coupons',
    datasetKey: 'shopflowKrogerState',
  },
  'ext-walmart': {
    bundleDir: 'apps/ext-walmart/.output/chrome-mv3',
    fixturePath: 'tests/fixtures/walmart/search/search-page.html',
    url: 'https://www.walmart.com/search?q=granola',
    datasetKey: 'shopflowWalmartState',
  },
  'ext-weee': {
    bundleDir: 'apps/ext-weee/.output/chrome-mv3',
    fixturePath: 'tests/fixtures/weee/product/product-page.html',
    url: 'https://www.sayweee.com/en/product/handmade-dumplings/2001',
    datasetKey: 'shopflowWeeeState',
  },
  'ext-temu': {
    bundleDir: 'apps/ext-temu/.output/chrome-mv3',
    fixturePath: 'tests/fixtures/temu/action/pre-filter.html',
    url: 'https://www.temu.com/search_result.html?search_key=desk%20lamp',
    datasetKey: 'shopflowTemuState',
  },
  'ext-shopping-suite': {
    bundleDir: 'apps/ext-shopping-suite/.output/chrome-mv3',
    fixturePath: '',
    url: 'about:blank',
    datasetKey: '',
  },
} as const;

export type ExtensionAppId = keyof typeof extensionAppConfig;

export function resolveExtensionBrowserTempRoot() {
  return resolveFromRepo('.runtime-cache/e2e-browser');
}

export function createExtensionTestUserDataDir(appId: ExtensionAppId) {
  const tempRoot = resolveExtensionBrowserTempRoot();
  mkdirSync(tempRoot, { recursive: true });
  return mkdtempSync(resolve(tempRoot, `${appId}-`));
}

export async function launchExtensionApp(appId: ExtensionAppId) {
  const bundleDir = resolveFromRepo(extensionAppConfig[appId].bundleDir);
  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const userDataDir = createExtensionTestUserDataDir(appId);
    let context: BrowserContext | undefined;

    try {
      context = await chromium.launchPersistentContext(userDataDir, {
        channel: 'chromium',
        headless: true,
        args: [
          `--disable-extensions-except=${bundleDir}`,
          `--load-extension=${bundleDir}`,
        ],
      });

      const serviceWorker = await waitForServiceWorker(context);
      const extensionId = serviceWorker.url().split('/')[2];
      const launchedContext = context;
      // Prewarm every user-facing extension surface the smoke tests open.
      // Under the full release-readiness lane, Chromium can expose the service
      // worker before popup and sidepanel HTML both become consistently
      // reachable, so bootstrap both surfaces before entering the fixture path.
      for (const pageName of ['popup', 'sidepanel'] as const) {
        const bootstrapPage = await openExtensionPage(
          launchedContext,
          extensionId,
          pageName
        );
        await bootstrapPage.close();
      }
      return {
        context: launchedContext,
        extensionId,
        async cleanup() {
          await launchedContext.close();
          rmSync(userDataDir, { recursive: true, force: true });
        },
      };
    } catch (error) {
      lastError = error;
      if (context) {
        await context.close().catch(() => undefined);
      }
      rmSync(userDataDir, { recursive: true, force: true });

      if (attempt === 3) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to launch extension app: ${appId}`);
}

async function waitForServiceWorker(
  context: BrowserContext,
  timeoutMs = 15_000
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const [serviceWorker] = context.serviceWorkers();
    if (serviceWorker) {
      return serviceWorker;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error('Timed out waiting for extension service worker');
}

export async function openFixturePage(
  context: BrowserContext,
  appId: ExtensionAppId
) {
  const { fixturePath, url } = extensionAppConfig[appId];
  return openCustomFixturePage(context, fixturePath, url);
}

export async function openCustomFixturePage(
  context: BrowserContext,
  fixturePath: string,
  url: string
) {
  if (!fixturePath || !url || url === 'about:blank') {
    throw new Error('A routed fixture page requires both fixturePath and url.');
  }
  const html = readFileSync(resolveFromRepo(fixturePath), 'utf8');
  const page = await context.newPage();

  await page.route(url, async (route) => {
    await route.fulfill({
      body: html,
      contentType: 'text/html',
    });
  });

  await page.goto(url);
  return page;
}

export async function waitForDetectionDataset(
  page: Page,
  appId: ExtensionAppId,
  expectedValue: string
) {
  const datasetKey = extensionAppConfig[appId].datasetKey;
  if (!datasetKey) {
    throw new Error(`${appId} does not define a detection dataset key.`);
  }

  await expect
    .poll(
      async () => {
        return await page.evaluate((key) => {
          return document.documentElement.dataset[key as keyof DOMStringMap];
        }, datasetKey);
      },
      {
        // The full release-readiness lane rebuilds every wave after hygiene and
        // coverage, which can delay extension boot and content-script dataset
        // hydration well beyond the isolated-smoke budget. Use a wider budget
        // here so full-lane verification measures repo behavior instead of
        // timing out during repeated cold-start extension boot.
        timeout: 60_000,
      }
    )
    .toBe(expectedValue);
}

export async function openExtensionPage(
  context: BrowserContext,
  extensionId: string,
  pageName: 'popup' | 'sidepanel'
) {
  const targetUrl = `chrome-extension://${extensionId}/${pageName}.html`;
  let lastError: unknown;
  let page = await context.newPage();

  // Chromium can expose the extension service worker before extension pages
  // are consistently reachable. Full release-readiness runs rebuild multiple
  // waves first, so popup/sidepanel HTML can lag behind service-worker
  // readiness. Use a wider retry budget here to reduce cold-start flakes
  // without hiding real extension page failures.
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      await page.goto(targetUrl, { timeout: 1_000 });
      return page;
    } catch (error) {
      lastError = error;

      if (
        !(error instanceof Error) ||
        !(
          error.message.includes('ERR_FILE_NOT_FOUND') ||
          error.message.includes('Timeout')
        ) ||
        attempt === 59
      ) {
        throw error;
      }

      await page.waitForTimeout(250);
      await page.close();
      page = await context.newPage();
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to open extension page: ${targetUrl}`);

  return page;
}

function resolveFromRepo(relativePath: string) {
  return repoPath(relativePath);
}
