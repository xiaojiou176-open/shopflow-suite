import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  function createMockPage(url: string) {
    let currentUrl = url;

    return {
      setViewportSize: vi.fn(async () => undefined),
      emulateMedia: vi.fn(async () => undefined),
      goto: vi.fn(async (nextUrl: string) => {
        currentUrl = nextUrl;
      }),
      waitForLoadState: vi.fn(async () => undefined),
      waitForTimeout: vi.fn(async () => undefined),
      url: vi.fn(() => currentUrl),
      evaluate: vi.fn(async () => undefined),
      getByText: vi.fn(() => ({
        waitFor: vi.fn(async () => undefined),
      })),
      locator: vi.fn(() => ({
        waitFor: vi.fn(async () => undefined),
        screenshot: vi.fn(async ({ path }: { path: string }) => {
          writeFileSync(path, 'mock-image');
        }),
      })),
      close: vi.fn(async () => undefined),
    };
  }

  const merchantPage = {
    close: vi.fn(async () => undefined),
  };

  const launchExtensionApp = vi.fn(async (appId: string) => ({
    context: { appId },
    extensionId: `${appId}-extension`,
    cleanup: vi.fn(async () => undefined),
  }));
  const openFixturePage = vi.fn(async () => merchantPage);
  const waitForDetectionDataset = vi.fn(async () => undefined);
  const openExtensionPage = vi.fn(
    async (_context: unknown, extensionId: string, pageName: 'popup' | 'sidepanel') =>
      createMockPage(`chrome-extension://${extensionId}/${pageName}.html`)
  );
  return {
    launchExtensionApp,
    merchantPage,
    openFixturePage,
    waitForDetectionDataset,
    openExtensionPage,
  };
});

vi.mock('../../tests/e2e/support/extension-smoke', () => ({
  launchExtensionApp: mocks.launchExtensionApp,
  openExtensionPage: mocks.openExtensionPage,
  openFixturePage: mocks.openFixturePage,
  waitForDetectionDataset: mocks.waitForDetectionDataset,
}));

describe('ui surface capture execution', () => {
  const cleanupPaths: string[] = [];

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    for (const target of cleanupPaths.splice(0)) {
      rmSync(target, { recursive: true, force: true });
    }
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it(
    'captures popup, sidepanel, and suite artifacts into the requested output root',
    { timeout: 20_000 },
    async () => {
      const { captureUiSurfaces, setUiSurfaceBuildExecutorForTests } = await import(
        '../../tooling/verification/capture-ui-surfaces'
      );
      const outputRoot = mkdtempSync(join(tmpdir(), 'shopflow-ui-capture-'));
      cleanupPaths.push(outputRoot);
      const execFileSyncMock = vi.fn(() => undefined);
      setUiSurfaceBuildExecutorForTests(
        execFileSyncMock as typeof import('node:child_process').execFileSync
      );

      const result = await captureUiSurfaces({
        appId: 'ext-albertsons',
        locale: 'en',
        outputRoot,
        runId: '2026-04-12T20-50-00.000Z',
      });

      expect(mocks.launchExtensionApp).toHaveBeenCalledTimes(2);
      expect(mocks.openFixturePage).toHaveBeenCalledTimes(1);
      expect(mocks.waitForDetectionDataset).toHaveBeenCalledWith(
        mocks.merchantPage,
        'ext-albertsons',
        'cart'
      );
      expect(execFileSyncMock).toHaveBeenCalled();
      expect(result.plan.map((entry) => entry.surface)).toEqual([
        'popup',
        'sidepanel',
        'suite',
      ]);
      expect(
        existsSync(join(outputRoot, 'ext-albertsons.popup.latest.png'))
      ).toBe(true);
      expect(
        existsSync(join(outputRoot, 'ext-albertsons.sidepanel.latest.png'))
      ).toBe(true);
      expect(
        existsSync(join(outputRoot, 'ext-shopping-suite.sidepanel.latest.png'))
      ).toBe(true);

      const manifest = JSON.parse(readFileSync(result.manifestPath, 'utf8')) as {
        runId: string;
        captures: Array<{ surface: string; latestAliasPath: string }>;
      };

      expect(manifest.runId).toBe('2026-04-12T20-50-00.000Z');
      expect(manifest.captures).toHaveLength(3);
      expect(
        manifest.captures.some((entry) =>
          entry.latestAliasPath.endsWith('ext-albertsons.popup.latest.png')
        )
      ).toBe(true);
      setUiSurfaceBuildExecutorForTests();
    }
  );

  it(
    'prints a JSON report from the CLI entrypoint for locale overrides',
    { timeout: 20_000 },
    async () => {
      const { uiSurfaceCaptureMain, setUiSurfaceBuildExecutorForTests } = await import(
        '../../tooling/verification/capture-ui-surfaces'
      );
      const outputRoot = mkdtempSync(join(tmpdir(), 'shopflow-ui-capture-main-'));
      cleanupPaths.push(outputRoot);
      const execFileSyncMock = vi.fn(() => undefined);
      setUiSurfaceBuildExecutorForTests(
        execFileSyncMock as typeof import('node:child_process').execFileSync
      );

      const stdoutSpy = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation(() => true);

      await uiSurfaceCaptureMain([
        '--app',
        'ext-kroger',
        '--locale',
        'zh-CN',
        '--output',
        outputRoot,
      ]);

      expect(stdoutSpy).toHaveBeenCalled();
      const lastPayload = stdoutSpy.mock.calls.at(-1)?.[0];
      expect(typeof lastPayload).toBe('string');
      const report = JSON.parse(String(lastPayload)) as {
        appId: string;
        locale: string;
        captures: Array<{ path: string }>;
      };

      expect(report.appId).toBe('ext-kroger');
      expect(report.locale).toBe('zh-CN');
      expect(report.captures).toHaveLength(3);
      expect(
        report.captures.some((entry) => entry.path.endsWith('.popup.zh-CN.png'))
      ).toBe(true);
      expect(execFileSyncMock).toHaveBeenCalled();
      setUiSurfaceBuildExecutorForTests();
    }
  );
});
