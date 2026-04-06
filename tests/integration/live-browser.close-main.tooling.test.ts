import { afterEach, describe, expect, it, vi } from 'vitest';
const closeReport = {
  mode: 'shopflow_live_close_browser',
  checkedAt: '2026-04-05T07:10:00.000Z',
  requestedProfile: {
    userDataDir: '/tmp/shopflow-live',
    profileDirectory: 'Profile 1',
    profileName: 'shopflow',
    cdpUrl: 'http://127.0.0.1:9335',
  },
  singletonInstance: {
    recordPath: '/tmp/shopflow-live/active-browser-instance.json',
    recordExists: true,
    runningBefore: true,
    listenerReachableBefore: true,
    listenerReachableAfter: false,
    pidRunningAfter: false,
    strategy: 'cdp-browser-close' as const,
    forceFallbackUsed: false,
    recordRemoved: true,
  },
  closeAttempt: {
    cdpRequested: true,
    cdpClosed: true,
    sigtermSent: false,
    sigkillSent: false,
    pidExited: true,
    listenerReachableAfterClose: false,
    outcome: 'closed_via_cdp' as const,
  },
  blockers: [] as string[],
  nextActions: ['Shopflow singleton browser closed cleanly.'],
};

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('close-live-browser main entrypoint', () => {
  it('prints the close report and artifacts when the recorded singleton closes cleanly', async () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    vi.doMock('../../tooling/live/shared', () => ({
      closeShopflowLiveBrowser: vi.fn(async () => closeReport),
      readChromeProcessList: vi.fn(() => '2468 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
      resolveShopflowLiveSessionConfig: vi.fn(() => ({
        artifactDirectory: '/tmp/shopflow-live',
      })),
      writeLiveJsonArtifact: vi.fn(() => ({
        summaryPath: '/tmp/shopflow-live/close-live-browser-latest.json',
      })),
    }));

    const { closeLiveBrowserMain } = await import('../../tooling/live/close-live-browser');
    await closeLiveBrowserMain();

    expect(stdout).toHaveBeenCalledTimes(1);
    const printed = stdout.mock.calls[0]?.[0];
    expect(typeof printed).toBe('string');
    const parsed = JSON.parse(String(printed));
    expect(parsed.closeAttempt.outcome).toBe('closed_via_cdp');
    expect(parsed.artifacts.summaryPath).toBe(
      '/tmp/shopflow-live/close-live-browser-latest.json'
    );
  });

  it('exits with code 1 when close-live-browser still reports blockers', async () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);
    const exitError = new Error('process.exit(1)');
    const exit = vi
      .spyOn(process, 'exit')
      .mockImplementation(((code?: string | number | null | undefined) => {
        throw code === 1 ? exitError : new Error(`unexpected exit ${String(code)}`);
      }) as never);

    vi.doMock('../../tooling/live/shared', () => ({
      closeShopflowLiveBrowser: vi.fn(async () => ({
        ...closeReport,
        blockers: ['listener still active'],
      })),
      readChromeProcessList: vi.fn(() => ''),
      resolveShopflowLiveSessionConfig: vi.fn(() => ({
        artifactDirectory: '/tmp/shopflow-live',
      })),
      writeLiveJsonArtifact: vi.fn(() => ({
        summaryPath: '/tmp/shopflow-live/close-live-browser-latest.json',
      })),
    }));

    const { closeLiveBrowserMain } = await import('../../tooling/live/close-live-browser');

    await expect(closeLiveBrowserMain()).rejects.toBe(exitError);
    expect(exit).toHaveBeenCalledWith(1);
    expect(stdout).toHaveBeenCalledTimes(1);
  });

  it('writes a readable error packet to stderr when the CLI helper catches an exception', async () => {
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    const exitError = new Error('process.exit(1)');
    const exit = vi
      .spyOn(process, 'exit')
      .mockImplementation(((code?: string | number | null | undefined) => {
        throw code === 1 ? exitError : new Error(`unexpected exit ${String(code)}`);
      }) as never);

    const { handleCloseLiveBrowserError } = await import(
      '../../tooling/live/close-live-browser'
    );

    expect(() =>
      handleCloseLiveBrowserError(new Error('boom'))
    ).toThrow(exitError);
    expect(stderr).toHaveBeenCalled();
    expect(String(stderr.mock.calls[0]?.[0])).toContain('boom');
    expect(exit).toHaveBeenCalledWith(1);
  });
});
