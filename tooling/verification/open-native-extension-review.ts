import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type BrowserContext } from '@playwright/test';
import { repoRoot, resolveFromRepo } from '../../tests/support/repo-paths';

const nativeReviewAppIds = [
  'ext-albertsons',
  'ext-amazon',
  'ext-costco',
  'ext-kroger',
  'ext-target',
  'ext-temu',
  'ext-walmart',
  'ext-weee',
  'ext-shopping-suite',
] as const;

type NativeReviewAppId = (typeof nativeReviewAppIds)[number];
type NativeReviewLocale = 'en' | 'zh-CN';

type NativeReviewOptions = {
  appId: NativeReviewAppId;
  locale: NativeReviewLocale;
  port: number;
  userDataDirRoot: string;
};

type CdpTarget = {
  id: string;
  type: string;
  url: string;
};

const startUrlByAppId: Record<NativeReviewAppId, string> = {
  'ext-albertsons': 'https://www.safeway.com/shop/cart',
  'ext-amazon': 'https://www.amazon.com/dp/shopflow-grinder',
  'ext-costco':
    'https://www.costco.com/shopflow-colombian-coffee.product.4000001234.html',
  'ext-kroger': 'https://www.fredmeyer.com/savings/coupons',
  'ext-target': 'https://www.target.com/pl/deals',
  'ext-temu': 'https://www.temu.com/search_result.html?search_key=desk%20lamp',
  'ext-walmart': 'https://www.walmart.com/search?q=granola',
  'ext-weee': 'https://www.sayweee.com/en/product/handmade-dumplings/2001',
  'ext-shopping-suite': 'chrome://newtab/',
};

function isNativeReviewAppId(value: string): value is NativeReviewAppId {
  return nativeReviewAppIds.includes(value as NativeReviewAppId);
}

function renderNativeReviewHelp() {
  return [
    'Shopflow native Chrome extension review',
    '',
    'Usage:',
    '  pnpm review:native-ui -- [options]',
    '',
    'Options:',
    `- --app <appId>       App to open in native Google Chrome. Allowed: ${nativeReviewAppIds.join(', ')}`,
    '- --locale <locale>   Locale route to open. Allowed: en, zh-CN',
    '- --port <number>     Remote debugging port for the temporary Chrome instance. Defaults to 9336',
    '- -h, --help          Show this help text.',
    '',
    'What it does:',
    '- launches a temporary native Google Chrome profile under .runtime-cache/native-extension-review/',
    '- loads the requested built extension bundle through real Chrome, not headless Chromium',
    '- opens popup + sidepanel review pages from the installed extension',
    '- for store apps, also opens the routed fixture merchant page so content-script state is present',
    '- for the Suite app, seeds the shared runtime review state before opening the Suite sidepanel',
    '',
    'Boundary:',
    '- isolated temporary Chrome profile only',
    '- no writes to your default Chrome root',
    '- intended for human visual review and screenshot-grade inspection',
    '',
  ].join('\n');
}

function parseNativeReviewArgs(argv: string[]): NativeReviewOptions | { help: true } {
  const options: NativeReviewOptions = {
    appId: 'ext-albertsons',
    locale: 'en',
    port: 9336,
    userDataDirRoot: resolveFromRepo('.runtime-cache/native-extension-review'),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '-h' || arg === '--help') {
      return { help: true };
    }

    if (arg === '--app') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --app');
      }
      if (!isNativeReviewAppId(value)) {
        throw new Error(
          `Unknown --app value: ${value}. Allowed values: ${nativeReviewAppIds.join(', ')}`
        );
      }
      options.appId = value;
      index += 1;
      continue;
    }

    if (arg === '--locale') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --locale');
      }
      if (value !== 'en' && value !== 'zh-CN') {
        throw new Error('Unknown --locale value. Allowed values: en, zh-CN');
      }
      options.locale = value;
      index += 1;
      continue;
    }

    if (arg === '--port') {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error('Missing or invalid integer value after --port');
      }
      options.port = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function ensureBuild(appId: NativeReviewAppId) {
  execFileSync('pnpm', ['--filter', `@shopflow/${appId}`, 'build'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
}

async function waitForTargets(port: number, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) {
        return (await response.json()) as CdpTarget[];
      }
    } catch {
      // ignore and retry
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for Chrome CDP targets on port ${port}.`);
}

async function waitForExtensionId(port: number, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const targets = await waitForTargets(port, 2_000);
    const extensionTarget = targets.find(
      (target) =>
        (target.type === 'service_worker' || target.type === 'background_page') &&
        target.url.startsWith('chrome-extension://') &&
        /\/background\.(js|html)$/i.test(target.url)
    );

    if (extensionTarget) {
      return extensionTarget.url.split('/')[2]!;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return undefined;
}

async function resolveInstalledExtensionIdFromSecurePreferences(
  userDataDir: string,
  bundleDir: string,
  timeoutMs = 10_000
) {
  const securePreferencesPath = resolve(
    userDataDir,
    'Default',
    'Secure Preferences'
  );
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (existsSync(securePreferencesPath)) {
      const raw = readFileSync(securePreferencesPath, 'utf8');
      const parsed = JSON.parse(raw) as {
        extensions?: {
          settings?: Record<string, { path?: string }>;
        };
      };

      const matchedEntry = Object.entries(
        parsed.extensions?.settings ?? {}
      ).find(([, value]) => value.path === bundleDir);

      if (matchedEntry) {
        return matchedEntry[0];
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return undefined;
}

function createLocaleUrl(
  extensionId: string,
  pageName: 'popup' | 'sidepanel',
  locale: NativeReviewLocale
) {
  return locale === 'en'
    ? `chrome-extension://${extensionId}/${pageName}.html`
    : `chrome-extension://${extensionId}/${pageName}.html?locale=${locale}`;
}

async function seedSuiteReviewState(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    await chrome.storage.local.clear();
    await chrome.storage.local.set({
      'shopflow.siteDetection.ext-albertsons': {
        appId: 'ext-albertsons',
        url: 'https://www.safeway.com/shop/cart',
        updatedAt: '2026-03-30T19:10:00.000Z',
        detection: {
          storeId: 'albertsons',
          verifiedScopes: ['safeway'],
          matchedHost: 'www.safeway.com',
          pageKind: 'cart',
          confidence: 0.95,
          capabilityStates: [
            { capability: 'run_action', status: 'ready' },
            { capability: 'export_data', status: 'blocked' },
          ],
        },
      },
      'shopflow.recentActivity': [
        {
          id: 'ext-albertsons:https://www.safeway.com/shop/cart',
          appId: 'ext-albertsons',
          label: 'www.safeway.com · cart',
          summary: '1 ready capability on the latest detected page.',
          timestampLabel: '7:10 PM',
          href: 'https://www.safeway.com/shop/cart',
        },
      ],
      'shopflow.latestOutput.ext-albertsons': {
        appId: 'ext-albertsons',
        storeId: 'albertsons',
        kind: 'product',
        pageUrl: 'https://www.safeway.com/shop/product-details/grapes',
        capturedAt: '2026-03-30T19:08:00.000Z',
        headline: 'Safeway Green Grapes',
        summary: 'Captured product details with price $4.99.',
        previewLines: ['Price: $4.99', 'SKU: 12345'],
      },
      'shopflow.liveEvidence.ext-albertsons': [
        {
          captureId: 'safeway-subscribe-live-receipt',
          appId: 'ext-albertsons',
          storeId: 'albertsons',
          verifiedScope: 'safeway',
          pageKind: 'cart',
          actionKind: 'schedule_save_subscribe',
          status: 'captured',
          summary:
            'Safeway subscribe live receipt bundle is captured and waiting for explicit review.',
          updatedAt: '2026-03-30T19:10:00.000Z',
          capturedAt: '2026-03-30T19:10:00.000Z',
          screenshotLabel: 'safeway-cart-proof.png',
        },
      ],
    });
  });
}

async function openStoreReviewPages(
  context: BrowserContext,
  extensionId: string,
  locale: NativeReviewLocale
) {
  const popupPage = await context.newPage();
  await popupPage.goto(createLocaleUrl(extensionId, 'popup', locale));
  const sidepanelPage = await context.newPage();
  await sidepanelPage.goto(createLocaleUrl(extensionId, 'sidepanel', locale));

  return {
    popupUrl: popupPage.url(),
    sidepanelUrl: sidepanelPage.url(),
  };
}

async function openSuiteReviewPages(
  context: BrowserContext,
  extensionId: string,
  locale: NativeReviewLocale
) {
  const popupPage = await context.newPage();
  await popupPage.goto(createLocaleUrl(extensionId, 'popup', locale));
  const sidepanelPage = await context.newPage();
  await sidepanelPage.goto(createLocaleUrl(extensionId, 'sidepanel', locale));
  await seedSuiteReviewState(sidepanelPage);
  await sidepanelPage.reload();

  return {
    popupUrl: popupPage.url(),
    sidepanelUrl: sidepanelPage.url(),
  };
}

export async function openNativeExtensionReview(
  options: NativeReviewOptions
) {
  mkdirSync(options.userDataDirRoot, { recursive: true });
  ensureBuild(options.appId);
  if (options.appId !== 'ext-shopping-suite') {
    ensureBuild('ext-shopping-suite');
  }

  const userDataDir = mkdtempSync(
    resolve(options.userDataDirRoot, `${options.appId}-`)
  );
  const bundleDir = resolve(repoRoot, `apps/${options.appId}/.output/chrome-mv3`);
  const args = [
    '-na',
    'Google Chrome',
    '--args',
    `--remote-debugging-port=${options.port}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-background-networking',
    '--disable-component-update',
    `--disable-extensions-except=${bundleDir}`,
    `--load-extension=${bundleDir}`,
    startUrlByAppId[options.appId],
  ];

  execFileSync('open', args, { cwd: repoRoot, stdio: 'ignore' });

  const extensionId =
    (await resolveInstalledExtensionIdFromSecurePreferences(
      userDataDir,
      bundleDir
    )) ?? (await waitForExtensionId(options.port));
  let opened:
    | {
        popupUrl: string;
        sidepanelUrl: string;
      }
    | undefined;
  let warning: string | undefined;

  if (extensionId) {
    try {
      const browser = await chromium.connectOverCDP(
        `http://127.0.0.1:${options.port}`
      );
      const context = browser.contexts()[0];

      if (!context) {
        warning =
          'Chrome CDP connected, but no persistent browser context was found for automatic popup/sidepanel opening.';
      } else {
        opened =
          options.appId === 'ext-shopping-suite'
            ? await openSuiteReviewPages(context, extensionId, options.locale)
            : await openStoreReviewPages(context, extensionId, options.locale);
      }
    } catch (error) {
      warning =
        error instanceof Error ? error.message : 'Failed to open review pages automatically.';
    }
  } else {
    warning =
      'Chrome launched, but the Shopflow unpacked bundle did not register as an installed extension in this native Google Chrome launch mode. Current stable Chrome appears to ignore or sandbox `--load-extension` here, so continue with manual chrome://extensions loading or the repo-owned Playwright/Chrome-for-Testing review lanes.';
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        appId: options.appId,
        locale: options.locale,
        extensionId,
        port: options.port,
        userDataDir,
        bundleDir: basename(bundleDir),
        startUrl: startUrlByAppId[options.appId],
        opened,
        warning,
      },
      null,
      2
    )}\n`
  );
}

export async function nativeExtensionReviewMain(argv: string[]) {
  const parsed = parseNativeReviewArgs(argv);
  if ('help' in parsed) {
    process.stdout.write(`${renderNativeReviewHelp()}\n`);
    return;
  }

  await openNativeExtensionReview(parsed);
}

const executedAsScript =
  process.argv[1] != null &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (executedAsScript) {
  await nativeExtensionReviewMain(process.argv.slice(2));
}

export {
  parseNativeReviewArgs,
  renderNativeReviewHelp,
};
