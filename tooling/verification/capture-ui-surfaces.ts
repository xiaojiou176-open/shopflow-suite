import { copyFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Page } from '@playwright/test';
import { storeCatalog } from '@shopflow/contracts';
import {
  launchExtensionApp,
  openExtensionPage,
  openFixturePage,
  waitForDetectionDataset,
  type ExtensionAppId,
} from '../../tests/e2e/support/extension-smoke';
import { repoRoot, resolveFromRepo } from '../../tests/support/repo-paths';
import { withRepoProcessLock } from '../shared/with-repo-process-lock';
import { writeFileAtomically } from '../shared/write-file-atomically';

export const uiCaptureStoreAppIdValues = [
  'ext-albertsons',
  'ext-amazon',
  'ext-costco',
  'ext-kroger',
  'ext-target',
  'ext-temu',
  'ext-walmart',
  'ext-weee',
] as const;
export type UiCaptureStoreAppId = (typeof uiCaptureStoreAppIdValues)[number];

export const uiCaptureLocaleValues = ['en', 'zh-CN'] as const;
export type UiCaptureLocale = (typeof uiCaptureLocaleValues)[number];

export const uiCaptureSurfaceValues = ['popup', 'sidepanel', 'suite'] as const;
export type UiCaptureSurface = (typeof uiCaptureSurfaceValues)[number];

type CaptureViewport = {
  width: number;
  height: number;
};

export type UiSurfaceCaptureOptions = {
  appId: UiCaptureStoreAppId;
  locale: UiCaptureLocale;
  outputRoot: string;
  runId: string;
};

export type UiSurfaceCaptureEntry = {
  surface: UiCaptureSurface;
  appId: UiCaptureStoreAppId | 'ext-shopping-suite';
  pageName: 'popup' | 'sidepanel';
  fileName: string;
  path: string;
  latestAliasPath: string;
  viewport: CaptureViewport;
};

export type UiSurfaceCaptureManifest = {
  generatedAt: string;
  appId: UiCaptureStoreAppId;
  locale: UiCaptureLocale;
  outputRoot: string;
  runId: string;
  runDirectory: string;
  captures: Array<{
    surface: UiCaptureSurface;
    appId: UiCaptureStoreAppId | 'ext-shopping-suite';
    pageName: 'popup' | 'sidepanel';
    path: string;
    latestAliasPath: string;
    viewport: CaptureViewport;
  }>;
};

const defaultUiCaptureOutputRoot = resolveFromRepo(
  '.runtime-cache/ui-surface-captures'
);

const extensionDetectionKindByAppId: Record<UiCaptureStoreAppId, string> = {
  'ext-albertsons': 'cart',
  'ext-amazon': 'product',
  'ext-costco': 'product',
  'ext-kroger': 'deal',
  'ext-target': 'deal',
  'ext-temu': 'search',
  'ext-walmart': 'search',
  'ext-weee': 'product',
};

const viewportBySurface: Record<UiCaptureSurface, CaptureViewport> = {
  popup: {
    width: 392,
    height: 760,
  },
  sidepanel: {
    width: 430,
    height: 1280,
  },
  suite: {
    width: 430,
    height: 1680,
  },
};

let uiSurfaceBuildExecutor: typeof execFileSync = execFileSync;

export function setUiSurfaceBuildExecutorForTests(
  nextExecutor?: typeof execFileSync
) {
  uiSurfaceBuildExecutor = nextExecutor ?? execFileSync;
}

function toRunId(date = new Date()) {
  return date.toISOString().replace(/[:]/g, '-');
}

function isStoreAppId(value: string): value is UiCaptureStoreAppId {
  return uiCaptureStoreAppIdValues.includes(value as UiCaptureStoreAppId);
}

function isLocale(value: string): value is UiCaptureLocale {
  return uiCaptureLocaleValues.includes(value as UiCaptureLocale);
}

function ensureUiCaptureBuild(appId: UiCaptureStoreAppId | 'ext-shopping-suite') {
  uiSurfaceBuildExecutor('pnpm', ['--filter', `@shopflow/${appId}`, 'build'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
}

function normalizeOutputRoot(value?: string) {
  if (!value) {
    return defaultUiCaptureOutputRoot;
  }

  return resolve(repoRoot, value);
}

export function renderUiSurfaceCaptureHelp() {
  return [
    'Shopflow UI surface capture',
    '',
    'Usage:',
    '  pnpm capture:ui-surfaces -- [options]',
    '',
    'Options:',
    `- --app <appId>       Store app to capture for popup + sidepanel. Allowed: ${uiCaptureStoreAppIdValues.join(', ')}`,
    `- --locale <locale>   Locale route to capture. Allowed: ${uiCaptureLocaleValues.join(', ')}`,
    '- --output <path>     Repo-relative output root. Defaults to .runtime-cache/ui-surface-captures',
    '- -h, --help          Show this help text.',
    '',
    'What it captures:',
    '- popup for the selected store app',
    '- sidepanel for the selected store app',
    '- suite sidepanel with seeded shared runtime state',
    '',
    'Artifacts:',
    '- timestamped PNGs under .runtime-cache/ui-surface-captures/<run-id>/',
    '- *.latest.png aliases in the output root',
    '- ui-surface-capture-manifest-<run-id>.json and ui-surface-capture-manifest-latest.json',
    '',
    'Boundary:',
    '- headless Playwright only',
    '- repo verification only, not live merchant proof',
    '- uses routed fixtures for store surfaces and seeded shared storage for the Suite surface',
    '',
  ].join('\n');
}

export function parseUiSurfaceCaptureArgs(
  argv: string[]
): UiSurfaceCaptureOptions | { help: true } {
  const options: UiSurfaceCaptureOptions = {
    appId: 'ext-albertsons',
    locale: 'en',
    outputRoot: defaultUiCaptureOutputRoot,
    runId: toRunId(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '-h' || arg === '--help') {
      return {
        help: true,
      };
    }

    if (arg === '--app') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --app');
      }
      if (!isStoreAppId(value)) {
        throw new Error(
          `Unknown --app value: ${value}. Allowed values: ${uiCaptureStoreAppIdValues.join(', ')}`
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
      if (!isLocale(value)) {
        throw new Error(
          `Unknown --locale value: ${value}. Allowed values: ${uiCaptureLocaleValues.join(', ')}`
        );
      }
      options.locale = value;
      index += 1;
      continue;
    }

    if (arg === '--output') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --output');
      }
      options.outputRoot = normalizeOutputRoot(value);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

export function buildUiSurfaceCapturePlan(
  options: UiSurfaceCaptureOptions
): UiSurfaceCaptureEntry[] {
  const runDirectory = resolve(options.outputRoot, options.runId);
  const localeSuffix = options.locale === 'en' ? 'en' : 'zh-CN';

  return [
    {
      surface: 'popup',
      appId: options.appId,
      pageName: 'popup',
      fileName: `${options.appId}.popup.${localeSuffix}.png`,
      path: resolve(runDirectory, `${options.appId}.popup.${localeSuffix}.png`),
      latestAliasPath: resolve(
        options.outputRoot,
        `${options.appId}.popup.latest.png`
      ),
      viewport: viewportBySurface.popup,
    },
    {
      surface: 'sidepanel',
      appId: options.appId,
      pageName: 'sidepanel',
      fileName: `${options.appId}.sidepanel.${localeSuffix}.png`,
      path: resolve(
        runDirectory,
        `${options.appId}.sidepanel.${localeSuffix}.png`
      ),
      latestAliasPath: resolve(
        options.outputRoot,
        `${options.appId}.sidepanel.latest.png`
      ),
      viewport: viewportBySurface.sidepanel,
    },
    {
      surface: 'suite',
      appId: 'ext-shopping-suite',
      pageName: 'sidepanel',
      fileName: `ext-shopping-suite.sidepanel.${localeSuffix}.png`,
      path: resolve(
        runDirectory,
        `ext-shopping-suite.sidepanel.${localeSuffix}.png`
      ),
      latestAliasPath: resolve(
        options.outputRoot,
        'ext-shopping-suite.sidepanel.latest.png'
      ),
      viewport: viewportBySurface.suite,
    },
  ];
}

function getStoreTitle(appId: UiCaptureStoreAppId) {
  const entry = Object.values(storeCatalog).find(
    (catalogEntry) => catalogEntry.appId === appId
  );
  if (!entry) {
    throw new Error(`Unable to resolve public title for ${appId}.`);
  }
  return entry.publicName;
}

async function preparePageForCapture(
  page: Page,
  viewport: CaptureViewport,
  locale: UiCaptureLocale
) {
  await page.setViewportSize(viewport);
  await page.emulateMedia({
    reducedMotion: 'reduce',
  });

  if (locale !== 'en') {
    const currentUrl = new URL(page.url());
    currentUrl.searchParams.set('locale', locale);
    await page.goto(currentUrl.toString());
  }

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(150);
}

async function capturePageMain(page: Page, targetPath: string) {
  mkdirSync(dirname(targetPath), {
    recursive: true,
  });
  await page.locator('main').screenshot({
    path: targetPath,
  });
}

async function seedSuiteSurfaceState(page: Page) {
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

async function captureStorePopupAndSidepanel(
  options: UiSurfaceCaptureOptions,
  plan: UiSurfaceCaptureEntry[]
) {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    options.appId
  );
  const title = getStoreTitle(options.appId);

  try {
    const merchantPage = await openFixturePage(
      context,
      options.appId as ExtensionAppId
    );
    await waitForDetectionDataset(
      merchantPage,
      options.appId as ExtensionAppId,
      extensionDetectionKindByAppId[options.appId]
    );

    const popupPlan = plan.find((entry) => entry.surface === 'popup');
    if (!popupPlan) {
      throw new Error('Missing popup capture plan entry.');
    }
    const popup = await openExtensionPage(context, extensionId, 'popup');
    await preparePageForCapture(popup, popupPlan.viewport, options.locale);
    await popup.getByText(title).waitFor();
    await popup.locator('#popup-primary-route').waitFor();
    await popup.locator('#popup-secondary-route').waitFor();
    await capturePageMain(popup, popupPlan.path);
    await popup.close();

    const sidePanelPlan = plan.find((entry) => entry.surface === 'sidepanel');
    if (!sidePanelPlan) {
      throw new Error('Missing sidepanel capture plan entry.');
    }
    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await preparePageForCapture(sidePanel, sidePanelPlan.viewport, options.locale);
    await sidePanel.getByText(title).waitFor();
    await sidePanel.locator('#readiness-summary').waitFor();
    await capturePageMain(sidePanel, sidePanelPlan.path);
    await sidePanel.close();
    await merchantPage.close();
  } finally {
    await cleanup();
  }
}

async function captureSuiteSurface(
  options: UiSurfaceCaptureOptions,
  plan: UiSurfaceCaptureEntry[]
) {
  const { context, extensionId, cleanup } =
    await launchExtensionApp('ext-shopping-suite');

  try {
    const suitePlan = plan.find((entry) => entry.surface === 'suite');
    if (!suitePlan) {
      throw new Error('Missing suite capture plan entry.');
    }
    const suitePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await preparePageForCapture(suitePanel, suitePlan.viewport, options.locale);
    await seedSuiteSurfaceState(suitePanel);
    await suitePanel.getByText('Shopflow Suite').waitFor();
    await suitePanel.locator('#priority-routes').waitFor();
    await capturePageMain(suitePanel, suitePlan.path);
    await suitePanel.close();
  } finally {
    await cleanup();
  }
}

function copyLatestAlias(sourcePath: string, latestAliasPath: string) {
  mkdirSync(dirname(latestAliasPath), {
    recursive: true,
  });
  copyFileSync(sourcePath, latestAliasPath);
}

function writeCaptureManifest(
  options: UiSurfaceCaptureOptions,
  plan: UiSurfaceCaptureEntry[]
) {
  const manifest: UiSurfaceCaptureManifest = {
    generatedAt: new Date().toISOString(),
    appId: options.appId,
    locale: options.locale,
    outputRoot: relative(repoRoot, options.outputRoot) || '.',
    runId: options.runId,
    runDirectory:
      relative(repoRoot, resolve(options.outputRoot, options.runId)) || '.',
    captures: plan.map((entry) => ({
      surface: entry.surface,
      appId: entry.appId,
      pageName: entry.pageName,
      path: relative(repoRoot, entry.path),
      latestAliasPath: relative(repoRoot, entry.latestAliasPath),
      viewport: entry.viewport,
    })),
  };

  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  const manifestPath = resolve(
    options.outputRoot,
    `ui-surface-capture-manifest.${options.runId}.json`
  );
  const latestManifestPath = resolve(
    options.outputRoot,
    'ui-surface-capture-manifest-latest.json'
  );

  writeFileAtomically(manifestPath, serialized);
  writeFileAtomically(latestManifestPath, serialized);

  return manifestPath;
}

export async function captureUiSurfaces(
  options: UiSurfaceCaptureOptions
) {
  return withRepoProcessLock('ui-surface-capture', async () => {
    mkdirSync(resolve(options.outputRoot, options.runId), {
      recursive: true,
    });

    ensureUiCaptureBuild(options.appId);
    ensureUiCaptureBuild('ext-shopping-suite');

    const plan = buildUiSurfaceCapturePlan(options);
    await captureStorePopupAndSidepanel(options, plan);
    await captureSuiteSurface(options, plan);

    for (const entry of plan) {
      copyLatestAlias(entry.path, entry.latestAliasPath);
    }

    const manifestPath = writeCaptureManifest(options, plan);

    return {
      plan,
      manifestPath,
    };
  });
}

export async function uiSurfaceCaptureMain(argv = process.argv.slice(2)) {
  const parsed = parseUiSurfaceCaptureArgs(argv);
  if ('help' in parsed && parsed.help) {
    process.stdout.write(`${renderUiSurfaceCaptureHelp()}\n`);
    return;
  }

  const result = await captureUiSurfaces(parsed);
  const report = {
    generatedAt: new Date().toISOString(),
    appId: parsed.appId,
    locale: parsed.locale,
    outputRoot: relative(repoRoot, parsed.outputRoot) || '.',
    manifestPath: relative(repoRoot, result.manifestPath),
    captures: result.plan.map((entry) => ({
      surface: entry.surface,
      appId: entry.appId,
      path: relative(repoRoot, entry.path),
      latestAliasPath: relative(repoRoot, entry.latestAliasPath),
    })),
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  uiSurfaceCaptureMain().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
