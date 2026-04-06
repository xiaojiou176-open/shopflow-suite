import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildBrowserInstanceBudgetReport,
  buildSafewayAssessment,
  buildSeedTargetVerification,
  buildCanonicalMerchantTargets,
  buildShopflowLiveCommand,
  buildDiagnoseReport,
  buildPreflightReport,
  classifyLiveTargetObservation,
  classifyLiveBrowserLaunchOutcome,
  closeShopflowLiveBrowser,
  collectChromeDebugProcesses,
  countBrowserMainProcesses,
  defaultShopflowLiveCdpPort,
  defaultShopflowLiveCdpUrl,
  getShopflowLiveSingletonState,
  launchChromeWithRemoteDebugging,
  openUrlsInExistingChrome,
  shopflowDetachedBrowserLaunchEnv,
  resolveShopflowLiveSessionConfig,
  shouldDeferDebugChromeLaunch,
  writeLiveTraceBundle,
} from '../../tooling/live/shared';
import {
  executeCloseLiveBrowser,
  requestBrowserCloseOverCdp,
  signalProcess,
  waitForProcessExit,
} from '../../tooling/live/close-live-browser';
import {
  canonicalShopflowLiveProfileDirectory,
  canonicalShopflowLiveProfileName,
  resolveShopflowCachePolicy,
} from '../../tooling/maintenance/cache-policy';
import { writeActiveBrowserInstanceRecord } from '../../tooling/live/browser-profile';

describe('live browser tooling', () => {
  const fakeHomeDir = homedir();
  const dedicatedUserDataDir =
    `${fakeHomeDir}/.cache/shopflow/browser/chrome-user-data`;
  const dedicatedUserDataDirLabel = dedicatedUserDataDir.replace(
    fakeHomeDir,
    '~'
  );
  const recordedChromeProcessList = (pid: number) =>
    `${pid} /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=${defaultShopflowLiveCdpPort} --user-data-dir=${dedicatedUserDataDir} --profile-directory=Profile 1 --no-first-run`;

  it('builds the canonical merchant targets from current live receipt plans', () => {
    const targets = buildCanonicalMerchantTargets();

    expect(targets.map((target) => target.id)).toEqual([
      'safeway-home',
      'safeway-cart',
      'safeway-manage',
      'fred-meyer-coupons',
      'qfc-search',
      'temu-search',
    ]);
    expect(
      targets.find((target) => target.id === 'safeway-home')?.captureIds
    ).toEqual([]);
    expect(
      targets.find((target) => target.id === 'safeway-cart')?.captureIds
    ).toEqual(['safeway-subscribe-live-receipt']);
    expect(
      targets.find((target) => target.id === 'safeway-manage')?.captureIds
    ).toEqual(['safeway-cancel-live-receipt']);
    expect(
      targets.find((target) => target.id === 'fred-meyer-coupons')?.captureIds
    ).toEqual(['fred-meyer-verified-scope-live-receipt']);
    expect(targets.find((target) => target.id === 'qfc-search')?.captureIds).toEqual([
      'qfc-verified-scope-live-receipt',
    ]);
    expect(targets.find((target) => target.id === 'temu-search')?.captureIds).toEqual([
      'temu-filter-live-receipt',
    ]);
  });

  it('keeps the Shopflow live env contract path-bounded and target-aware', () => {
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
      SHOPFLOW_LIVE_USER_DATA_DIR: '/tmp/shopflow-live',
      SHOPFLOW_LIVE_PROFILE_DIRECTORY: 'Profile 11',
      SHOPFLOW_LIVE_PROFILE_NAME: 'Merchant Live',
      SHOPFLOW_LIVE_ATTACH_MODE: 'page',
      SHOPFLOW_LIVE_CDP_URL: 'http://127.0.0.1:9555',
      SHOPFLOW_LIVE_TARGETS: 'qfc-search,temu-search',
    });

    expect(config.enabled).toBe(true);
    expect(config.userDataDir).toBe('/tmp/shopflow-live');
    expect(config.profileDirectory).toBe('Profile 11');
    expect(config.profileName).toBe('Merchant Live');
    expect(config.attachModeRequested).toBe('page');
    expect(config.cdpPort).toBe(9555);
    expect(config.targets.map((target) => target.id)).toEqual([
      'qfc-search',
      'temu-search',
    ]);
  });

  it('auto-includes safeway-home when only deep-link targets are requested', () => {
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
      SHOPFLOW_LIVE_TARGETS: 'safeway-cart,safeway-manage',
    });

    expect(config.targets.map((target) => target.id)).toEqual([
      'safeway-home',
      'safeway-cart',
      'safeway-manage',
    ]);
  });

  it('defaults the live profile contract to Profile 1 / shopflow under the dedicated browser root', () => {
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
    });

    expect(config.profileDirectory).toBe(canonicalShopflowLiveProfileDirectory);
    expect(config.profileName).toBe(canonicalShopflowLiveProfileName);
    expect(config.userDataDir).toBe(resolveShopflowCachePolicy().browserUserDataDir);
    expect(config.cdpUrl).toBe(defaultShopflowLiveCdpUrl);
    expect(config.cdpPort).toBe(defaultShopflowLiveCdpPort);
  });

  it('derives the profile display name from Chrome Local State when no env override is provided', () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-live-profile-'));
    writeFileSync(
      resolve(tempRoot, 'Local State'),
      JSON.stringify({
        profile: {
          info_cache: {
            'Profile 1': {
              name: 'shopflow',
            },
          },
        },
      })
    );

    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
      SHOPFLOW_LIVE_USER_DATA_DIR: tempRoot,
      SHOPFLOW_LIVE_PROFILE_DIRECTORY: 'Profile 1',
    });

    expect(config.profileName).toBe('shopflow');

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('opens URLs only through the requested singleton CDP endpoint', async () => {
    const openedUrls: string[] = [];
    const opened = await openUrlsInExistingChrome(
      defaultShopflowLiveCdpUrl,
      ['https://www.safeway.com/shop/cart', 'https://www.qfc.com/search?query=kombucha'],
      async (_cdpUrl, targetUrl) => {
        openedUrls.push(targetUrl);
        return true;
      },
      async () => ({ ok: true, statusCode: 200, parsed: {} })
    );

    expect(opened).toBe(true);
    expect(openedUrls).toEqual([
      'https://www.safeway.com/shop/cart',
      'https://www.qfc.com/search?query=kombucha',
    ]);
  });

  it('refuses singleton reuse when the requested CDP endpoint is not reachable', async () => {
    const opened = await openUrlsInExistingChrome(
      defaultShopflowLiveCdpUrl,
      ['https://www.safeway.com/shop/cart'],
      async () => true,
      async () => ({ ok: false, error: 'connection refused' })
    );

    expect(opened).toBe(false);
  });

  it('classifies visible merchant tabs without overclaiming login state', () => {
    const target = buildCanonicalMerchantTargets().find(
      (entry) => entry.id === 'temu-search'
    );

    expect(target).toBeDefined();

    expect(
      classifyLiveTargetObservation(
        target!,
        'https://www.temu.com/search_result.html?search_key=warehouse',
        'Temu search'
      )
    ).toBe('session_visible');
    expect(
      classifyLiveTargetObservation(
        target!,
        'https://www.temu.com/access-denied.html',
        'Access Denied'
      )
    ).toBe('public_or_unknown');
    expect(
      classifyLiveTargetObservation(
        target!,
        'https://www.temu.com/login.html',
        'Sign In'
      )
    ).toBe('login_required');
    expect(classifyLiveTargetObservation(target!, undefined, '')).toBe('not_open');
  });

  it('treats healthy Safeway homepage plus unstable cart/manage routes as deep-link unstable', () => {
    const { observations, safewayAssessment } = buildSafewayAssessment([
      {
        id: 'safeway-home',
        label: 'Safeway home',
        requestedUrl: 'https://www.safeway.com/',
        finalUrl: 'https://www.safeway.com/',
        title: 'Safeway Home',
        classification: 'session_visible',
        source: 'cdp-target',
        captureIds: [],
      },
      {
        id: 'safeway-cart',
        label: 'Safeway cart',
        requestedUrl: 'https://www.safeway.com/shop/cart',
        finalUrl: 'https://www.safeway.com/shop/cart',
        title: '404 | Safeway',
        classification: 'public_or_unknown',
        source: 'cdp-target',
        captureIds: ['safeway-subscribe-live-receipt'],
      },
      {
        id: 'safeway-manage',
        label: 'Safeway Schedule & Save manage',
        requestedUrl: 'https://www.safeway.com/schedule-and-save/manage',
        finalUrl: 'https://www.safeway.com/',
        title: 'Safeway Home',
        classification: 'public_or_unknown',
        source: 'cdp-target',
        captureIds: ['safeway-cancel-live-receipt'],
      },
    ]);

    expect(observations.find((entry) => entry.id === 'safeway-cart')?.classification).toBe(
      'deep_link_unstable'
    );
    expect(
      observations.find((entry) => entry.id === 'safeway-manage')?.classification
    ).toBe('deep_link_unstable');
    expect(safewayAssessment.sessionHealth).toBe('healthy');
    expect(safewayAssessment.captureTargetState).toBe('deep_link_unstable');
    expect(safewayAssessment.deepLinkState).toBe('unstable');
  });

  it('treats a Safeway homepage sign-in challenge as login_required for the capture lane', () => {
    const { observations, safewayAssessment } = buildSafewayAssessment([
      {
        id: 'safeway-home',
        label: 'Safeway home',
        requestedUrl: 'https://www.safeway.com/',
        finalUrl: 'https://www.safeway.com/account/sign-in',
        title: 'Re Sign In',
        classification: 'login_required',
        source: 'cdp-target',
        captureIds: [],
      },
      {
        id: 'safeway-cart',
        label: 'Safeway cart',
        requestedUrl: 'https://www.safeway.com/shop/cart',
        finalUrl: 'https://www.safeway.com/shop/cart',
        title: '404 | Safeway',
        classification: 'public_or_unknown',
        source: 'cdp-target',
        captureIds: ['safeway-subscribe-live-receipt'],
      },
      {
        id: 'safeway-manage',
        label: 'Safeway Schedule & Save manage',
        requestedUrl: 'https://www.safeway.com/schedule-and-save/manage',
        finalUrl: 'https://www.safeway.com/',
        title: 'Safeway Home',
        classification: 'public_or_unknown',
        source: 'cdp-target',
        captureIds: ['safeway-cancel-live-receipt'],
      },
    ]);

    expect(observations.find((entry) => entry.id === 'safeway-home')?.classification).toBe(
      'login_required'
    );
    expect(safewayAssessment.sessionHealth).toBe('login_required');
    expect(safewayAssessment.captureTargetState).toBe('login_required');
    expect(safewayAssessment.deepLinkState).toBe('unknown');
  });

  it('keeps quoted Chrome launch arguments intact when collecting debug processes', () => {
    const processes = collectChromeDebugProcesses(
      [
        `47004 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=${defaultShopflowLiveCdpPort} --user-data-dir="${dedicatedUserDataDir}" --profile-directory="Profile 1"`,
      ].join('\n'),
      [47004],
      defaultShopflowLiveCdpPort
    );

    expect(processes).toEqual([
      {
        pid: 47004,
        listening: true,
        remoteDebuggingPort: defaultShopflowLiveCdpPort,
        userDataDir: dedicatedUserDataDir,
        userDataDirLabel: dedicatedUserDataDirLabel,
        profileDirectory: 'Profile 1',
      },
    ]);
  });

  it(
    'builds diagnose blockers when merchant targets are missing or still gated by login',
    async () => {
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
      SHOPFLOW_LIVE_ATTACH_MODE: 'page',
      SHOPFLOW_LIVE_TARGETS: 'temu-search',
    });

    const preflight = await buildPreflightReport(config);
    const probe = {
      mode: 'shopflow_live_probe' as const,
      checkedAt: '2026-04-03T18:15:44.170Z',
      profile: {
        requestedUserDataDir: config.userDataDir,
        requestedProfileDirectory: config.profileDirectory,
        requestedProfileName: config.profileName,
        requestedProfileMatchesActiveListener: false,
      },
      attach: {
        requestedMode: 'page' as const,
        resolvedMode: 'page' as const,
        cdpReachable: false,
        attachStatus: 'existing-tabs-only' as const,
      },
      debugChrome: {
        listenerCount: 0,
        processes: [],
      },
      singletonInstance: {
        recordPath: '/tmp/shopflow-live/active-browser-instance.json',
        recordExists: false,
        running: false,
        matchesRequestedProfile: false,
      },
      cdp: {
        versionOk: false,
        targetCount: 0,
        pageTargetCount: 0,
        urls: [],
      },
      observedTabs: [],
      sessionHealth: {
        safeway: 'not_open' as const,
      },
      captureTargetState: {
        safeway: 'unknown' as const,
      },
      deepLinkState: {
        safeway: 'unknown' as const,
      },
      targets: [
        {
          id: 'temu-search' as const,
          label: 'Temu warehouse search',
          requestedUrl: 'https://www.temu.com/search_result.html?search_key=warehouse',
          finalUrl: 'https://www.temu.com/login.html',
          title: 'Sign In',
          classification: 'login_required' as const,
          source: 'cdp-target' as const,
          captureIds: ['temu-filter-live-receipt'],
        },
      ],
    };
    const diagnose = buildDiagnoseReport(config, preflight, probe);

    expect(diagnose.blockers).toEqual(
      expect.arrayContaining([
        'One or more merchant targets still require a real sign-in step.',
      ])
    );
    expect(diagnose.nextActions.join(' ')).toMatch(/probe:live/);
    expect(diagnose.recommendations.commands.probe).toMatch(/pnpm probe:live/);
    expect(diagnose.recommendations.profileAlignment.status).toBe(
      'listener-unreachable'
    );
    },
    20000
  );

  it(
    'explains when attach failed and the dedicated Shopflow browser must be relaunched',
    async () => {
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
      SHOPFLOW_LIVE_ATTACH_MODE: 'browser',
      SHOPFLOW_LIVE_TARGETS: 'qfc-search',
    });

    const preflight = await buildPreflightReport(config);
    const probe = {
      mode: 'shopflow_live_probe' as const,
      checkedAt: '2026-04-03T19:24:22.439Z',
      profile: {
        requestedUserDataDir: config.userDataDir,
        requestedProfileDirectory: config.profileDirectory,
        requestedProfileName: config.profileName,
        requestedProfileMatchesActiveListener: false,
      },
      attach: {
        requestedMode: 'browser' as const,
        resolvedMode: 'browser' as const,
        cdpReachable: false,
        attachStatus: 'attach_failed' as const,
      },
      debugChrome: {
        listenerCount: 0,
        processes: [],
      },
      singletonInstance: {
        recordPath: '/tmp/shopflow-live/active-browser-instance.json',
        recordExists: false,
        running: false,
        matchesRequestedProfile: false,
      },
      cdp: {
        versionOk: false,
        targetCount: 0,
        pageTargetCount: 0,
        urls: [],
      },
      sessionHealth: {
        safeway: 'not_open' as const,
      },
      captureTargetState: {
        safeway: 'unknown' as const,
      },
      deepLinkState: {
        safeway: 'unknown' as const,
      },
      observedTabs: [],
      targets: [
        {
          id: 'qfc-search' as const,
          label: 'QFC search',
          requestedUrl: 'https://www.qfc.com/search?query=kombucha',
          finalUrl: 'https://www.qfc.com/search?query=kombucha',
          title: 'www.qfc.com',
          classification: 'session_visible' as const,
          source: 'cdp-target' as const,
          captureIds: ['qfc-verified-scope-live-receipt'],
        },
      ],
    };
    const diagnose = buildDiagnoseReport(config, preflight, probe);

    expect(diagnose.blockers).toEqual(
      expect.arrayContaining([
        `CDP is not reachable at ${defaultShopflowLiveCdpUrl}.`,
      ])
    );
    expect(diagnose.nextActions.join(' ')).toContain(
      'dedicated Shopflow Chrome session'
    );
    expect(diagnose.nextActions.join(' ')).toContain(
      'no longer inspects arbitrary host Chrome tabs'
    );
    expect(diagnose.recommendations.commands.openBrowser).toContain(
      'SHOPFLOW_LIVE_ATTACH_MODE="browser"'
    );
    expect(diagnose.recommendations.profileAlignment.requestedProfileDirectory).toBe(
      canonicalShopflowLiveProfileDirectory
    );
    },
    20000
  );

  it(
    'explains when Safeway is signed in but the deep links are unstable',
    async () => {
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
      SHOPFLOW_LIVE_ATTACH_MODE: 'browser',
      SHOPFLOW_LIVE_TARGETS: 'safeway-cart,safeway-manage',
    });

    const preflight = await buildPreflightReport(config);
    const probe = {
      mode: 'shopflow_live_probe' as const,
      checkedAt: '2026-04-05T03:24:22.439Z',
      profile: {
        requestedUserDataDir: config.userDataDir,
        requestedProfileDirectory: config.profileDirectory,
        requestedProfileName: config.profileName,
        requestedProfileMatchesActiveListener: true,
      },
      attach: {
        requestedMode: 'browser' as const,
        resolvedMode: 'browser' as const,
        cdpReachable: true,
        attachStatus: 'attached' as const,
      },
      debugChrome: {
        listenerCount: 1,
        processes: [],
      },
      singletonInstance: {
        recordPath: '/tmp/shopflow-live/active-browser-instance.json',
        recordExists: true,
        running: true,
        matchesRequestedProfile: true,
      },
      cdp: {
        versionOk: true,
        targetCount: 3,
        pageTargetCount: 3,
        urls: [
          'https://www.safeway.com/',
          'https://www.safeway.com/shop/cart',
          'https://www.safeway.com/schedule-and-save/manage',
        ],
      },
      sessionHealth: {
        safeway: 'healthy' as const,
      },
      captureTargetState: {
        safeway: 'deep_link_unstable' as const,
      },
      deepLinkState: {
        safeway: 'unstable' as const,
      },
      observedTabs: [
        {
          url: 'https://www.safeway.com/',
          title: 'Safeway Home',
        },
      ],
      targets: [
        {
          id: 'safeway-home' as const,
          label: 'Safeway home',
          requestedUrl: 'https://www.safeway.com/',
          finalUrl: 'https://www.safeway.com/',
          title: 'Safeway Home',
          classification: 'session_visible' as const,
          source: 'cdp-target' as const,
          captureIds: [],
        },
        {
          id: 'safeway-cart' as const,
          label: 'Safeway cart',
          requestedUrl: 'https://www.safeway.com/shop/cart',
          finalUrl: 'https://www.safeway.com/',
          title: 'Safeway Home',
          classification: 'deep_link_unstable' as const,
          source: 'cdp-target' as const,
          captureIds: ['safeway-subscribe-live-receipt'],
        },
        {
          id: 'safeway-manage' as const,
          label: 'Safeway Schedule & Save manage',
          requestedUrl: 'https://www.safeway.com/schedule-and-save/manage',
          finalUrl: 'https://www.safeway.com/',
          title: 'Safeway Home',
          classification: 'deep_link_unstable' as const,
          source: 'cdp-target' as const,
          captureIds: ['safeway-cancel-live-receipt'],
        },
      ],
    };
    const diagnose = buildDiagnoseReport(config, preflight, probe);

    expect(diagnose.blockers).toEqual(
      expect.arrayContaining([
        'Safeway session health looks alive, but one or more Safeway deep-link targets are unstable.',
      ])
    );
    expect(diagnose.nextActions.join(' ')).toContain('Safeway homepage');
    expect(diagnose.nextActions.join(' ')).toContain('cart/manage');
    },
    20000
  );

  it('writes a snapshot-first live trace bundle even when CDP is unavailable', async () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-live-trace-'));
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
      SHOPFLOW_LIVE_USER_DATA_DIR: '/tmp/shopflow-live',
      SHOPFLOW_LIVE_PROFILE_DIRECTORY: canonicalShopflowLiveProfileDirectory,
      SHOPFLOW_LIVE_PROFILE_NAME: canonicalShopflowLiveProfileName,
      SHOPFLOW_LIVE_ATTACH_MODE: 'page',
      SHOPFLOW_LIVE_CDP_URL: 'http://127.0.0.1:9555',
      SHOPFLOW_LIVE_TARGETS: 'temu-search',
    });
    config.artifactDirectory = tempRoot;

    const traceBundle = await writeLiveTraceBundle(config, {
      mode: 'shopflow_live_probe',
      checkedAt: '2026-04-03T18:15:44.170Z',
      profile: {
        requestedUserDataDir: config.userDataDir,
        requestedProfileDirectory: config.profileDirectory,
        requestedProfileName: config.profileName,
        requestedProfileMatchesActiveListener: false,
      },
      attach: {
        requestedMode: 'page',
        resolvedMode: 'page',
        cdpReachable: false,
        attachStatus: 'existing-tabs-only',
      },
      debugChrome: {
        listenerCount: 0,
        processes: [],
      },
      singletonInstance: {
        recordPath: '/tmp/shopflow-live/active-browser-instance.json',
        recordExists: false,
        running: false,
        matchesRequestedProfile: false,
      },
      cdp: {
        versionOk: false,
        targetCount: 0,
        pageTargetCount: 0,
        urls: [],
      },
      sessionHealth: {
        safeway: 'not_open' as const,
      },
      captureTargetState: {
        safeway: 'unknown' as const,
      },
      deepLinkState: {
        safeway: 'unknown' as const,
      },
      observedTabs: [
        {
          url: 'https://www.temu.com/login.html',
          title: 'Temu | 登录',
        },
      ],
      targets: [
        {
          id: 'temu-search',
          label: 'Temu warehouse search',
          requestedUrl: 'https://www.temu.com/search_result.html?search_key=warehouse',
          finalUrl: 'https://www.temu.com/login.html',
          title: 'Temu | 登录',
          classification: 'login_required',
          source: 'cdp-target',
          captureIds: ['temu-filter-live-receipt'],
        },
      ],
    });

    expect(traceBundle.traceMode).toBe('snapshot-only');
    expect(existsSync(traceBundle.summaryPath)).toBe(true);
    expect(existsSync(traceBundle.chromeTabsPath)).toBe(true);
    expect(existsSync(traceBundle.chromeProcessesPath)).toBe(true);
    expect(existsSync(traceBundle.cdpSummaryPath)).toBe(true);
    expect(existsSync(traceBundle.screenshotManifestPath)).toBe(true);
    expect(readFileSync(traceBundle.chromeTabsPath, 'utf8')).toContain(
      'https://www.temu.com/login.html'
    );
    expect(
      JSON.parse(readFileSync(traceBundle.screenshotManifestPath, 'utf8'))
    ).toEqual([]);

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('deduplicates env overrides in generated live browser commands', () => {
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
      SHOPFLOW_LIVE_ATTACH_MODE: 'auto',
      SHOPFLOW_LIVE_TARGETS: 'temu-search',
    });

    const command = buildShopflowLiveCommand(config, 'diagnose:live', {
      SHOPFLOW_LIVE_ATTACH_MODE: 'browser',
    });

    expect(command.match(/SHOPFLOW_LIVE_ATTACH_MODE=/g)).toHaveLength(1);
    expect(command).toContain('SHOPFLOW_LIVE_ATTACH_MODE="browser"');
  });

  it('classifies launch verification outcomes without overclaiming a live attach', () => {
    expect(
      classifyLiveBrowserLaunchOutcome({
        listenerReachable: true,
        pidStillRunning: true,
        observedTargetTabCount: 0,
      })
    ).toBe('listener_ready');

    expect(
      classifyLiveBrowserLaunchOutcome({
        listenerReachable: false,
        pidStillRunning: false,
        observedTargetTabCount: 2,
      })
    ).toBe('launch_exited_before_listener');

    expect(
      classifyLiveBrowserLaunchOutcome({
        listenerReachable: false,
        pidStillRunning: false,
        observedTargetTabCount: 0,
      })
    ).toBe('launch_exited_before_listener');

    expect(
      classifyLiveBrowserLaunchOutcome({
        listenerReachable: false,
        pidStillRunning: true,
        observedTargetTabCount: 0,
      })
    ).toBe('listener_unreachable');
  });

  it('keeps Chrome debug process parsing honest when flag values contain spaces', () => {
    const processes = collectChromeDebugProcesses(
      [
        `47004 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=${defaultShopflowLiveCdpPort} --user-data-dir=${dedicatedUserDataDir} --profile-directory=Profile 1 --no-first-run`,
      ].join('\n'),
      [47004],
      defaultShopflowLiveCdpPort
    );

    expect(processes).toEqual([
      expect.objectContaining({
        pid: 47004,
        listening: true,
        remoteDebuggingPort: defaultShopflowLiveCdpPort,
        userDataDir: dedicatedUserDataDir,
        profileDirectory: 'Profile 1',
      }),
    ]);
  });

  it('refuses new debug launches when the machine is already over the browser instance budget', () => {
    const processList = [
      '101 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      `102 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --profile-directory=Profile 1 --user-data-dir=${dedicatedUserDataDir}`,
      `103 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=${defaultShopflowLiveCdpPort}`,
      '104 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=9333',
      '105 /Applications/Google Chrome.app/Contents/MacOS/Chromium --remote-debugging-port=0',
      '106 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --user-data-dir=/tmp/shopflow-live',
      '107 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=9444',
      '201 /Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.framework/Versions/146/Helpers/Google Chrome Helper.app/Contents/MacOS/Google Chrome Helper --type=renderer',
    ].join('\n');

    expect(countBrowserMainProcesses(processList)).toBe(7);
    expect(shouldDeferDebugChromeLaunch(processList)).toBe(true);
  });

  it('can report the browser main-process PIDs that already match the requested Shopflow root and port when the budget blocks a new launch', () => {
    const processList = [
      '101 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      `102 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --profile-directory=Profile 1 --user-data-dir=${dedicatedUserDataDir}`,
      `103 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=${defaultShopflowLiveCdpPort}`,
      '104 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=9333',
      '105 /Applications/Google Chrome.app/Contents/MacOS/Chromium --remote-debugging-port=0',
      '106 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --user-data-dir=/tmp/shopflow-live',
      '107 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=9444',
      '201 /Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.framework/Versions/146/Helpers/Google Chrome Helper.app/Contents/MacOS/Google Chrome Helper --type=renderer',
    ].join('\n');

    const budgetReport = buildBrowserInstanceBudgetReport(
      processList,
      dedicatedUserDataDir,
      defaultShopflowLiveCdpPort
    );

    expect(budgetReport.limit).toBe(6);
    expect(budgetReport.browserMainProcessCount).toBe(7);
    expect(budgetReport.blockedLaunch).toBe(true);
    expect(budgetReport.browserMainProcessPids).toEqual([
      101,
      102,
      103,
      104,
      105,
      106,
      107,
    ]);
    expect(budgetReport.matchingRequestedRootPids).toEqual([102]);
    expect(budgetReport.matchingRequestedPortPids).toEqual([103]);
  });

  it('treats a seed as incomplete when no canonical merchant target proves a preserved session', () => {
    expect(
      buildSeedTargetVerification({
        total: 5,
        sessionVisible: 0,
        loginRequired: 0,
        publicOrUnknown: 0,
        notOpen: 5,
      }).blockers
    ).toEqual(
      expect.arrayContaining([
        'The seeded Shopflow browser root became attachable, but none of the canonical merchant targets opened inside the migrated profile.',
        'The seeded Shopflow browser root is attachable, but none of the canonical merchant targets currently prove a preserved signed-in merchant session.',
      ])
    );
  });

  it('accepts a seed once at least one canonical merchant target stays session-visible', () => {
    expect(
      buildSeedTargetVerification({
        total: 5,
        sessionVisible: 1,
        loginRequired: 2,
        publicOrUnknown: 1,
        notOpen: 1,
      }).blockers
    ).toEqual([]);
  });

  it('waits for a process to exit without touching the real process table', async () => {
    let checks = 0;
    const exited = await waitForProcessExit(
      1234,
      () => {
        checks += 1;
        return checks < 3;
      },
      5,
      1
    );

    expect(exited).toBe(true);
    expect(checks).toBeGreaterThanOrEqual(3);
  });

  it('reports a clean error when Browser.close cannot discover a websocket endpoint', async () => {
    const result = await requestBrowserCloseOverCdp(
      defaultShopflowLiveCdpUrl,
      async () => ({ ok: false, error: 'cdp_unreachable' })
    );

    expect(result).toEqual({
      attempted: false,
      succeeded: false,
      error: 'cdp_unreachable',
    });
  });

  it('removes the singleton record when Browser.close succeeds over the recorded Shopflow CDP endpoint', async () => {
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
    });
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-live-close-'));
    config.artifactDirectory = tempRoot;
    writeActiveBrowserInstanceRecord(tempRoot, {
      pid: 1234,
      userDataDir: dedicatedUserDataDir,
      profileDirectory: 'Profile 1',
      profileName: 'shopflow',
      cdpUrl: defaultShopflowLiveCdpUrl,
      remoteDebuggingPort: defaultShopflowLiveCdpPort,
      chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      startedAt: '2026-04-05T00:00:00.000Z',
      source: 'shopflow-singleton',
    });

    let listenerReachable = true;

    class SuccessfulCloseSocket extends EventTarget {
      close() {}

      send() {
        listenerReachable = false;
        queueMicrotask(() => this.dispatchEvent(new Event('message')));
      }
    }

    const execution = await executeCloseLiveBrowser(
      config,
      {
        pid: 1234,
        userDataDir: dedicatedUserDataDir,
        profileDirectory: 'Profile 1',
        profileName: 'shopflow',
        cdpUrl: defaultShopflowLiveCdpUrl,
        remoteDebuggingPort: defaultShopflowLiveCdpPort,
        chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        startedAt: '2026-04-05T00:00:00.000Z',
        source: 'shopflow-singleton',
      },
      resolve(tempRoot, 'active-browser-instance.json'),
      true,
      {
        probeVersion: async () => ({
          ok: listenerReachable,
          parsed: listenerReachable
            ? { webSocketDebuggerUrl: 'ws://127.0.0.1:9335/devtools/browser/shopflow' }
            : undefined,
        }),
        socketFactory: () => {
          const socket = new SuccessfulCloseSocket() as unknown as WebSocket;
          queueMicrotask(() => socket.dispatchEvent(new Event('open')));
          return socket;
        },
        isRunning: () => false,
        processList: recordedChromeProcessList(1234),
      }
    );

    expect(execution.singletonInstance.strategy).toBe('cdp-browser-close');
    expect(execution.closeAttempt.cdpRequested).toBe(true);
    expect(execution.closeAttempt.cdpClosed).toBe(true);
    expect(execution.singletonInstance.recordRemoved).toBe(true);
    expect(execution.blockers).toEqual([]);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('returns false when signalProcess cannot signal the requested pid', () => {
    expect(signalProcess(-1, 'SIGTERM')).toBe(false);
  });

  it('refuses to close when the recorded singleton can no longer be re-verified', async () => {
    const signalCalls: Array<{ pid: number; signal: NodeJS.Signals }> = [];
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
    });
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-live-close-'));
    config.artifactDirectory = tempRoot;
    writeActiveBrowserInstanceRecord(tempRoot, {
      pid: 1234,
      userDataDir: dedicatedUserDataDir,
      profileDirectory: 'Profile 1',
      profileName: 'shopflow',
      cdpUrl: defaultShopflowLiveCdpUrl,
      remoteDebuggingPort: defaultShopflowLiveCdpPort,
      chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      startedAt: '2026-04-05T00:00:00.000Z',
      source: 'shopflow-singleton',
    });
    const execution = await executeCloseLiveBrowser(
      config,
      {
        pid: 1234,
        userDataDir: dedicatedUserDataDir,
        profileDirectory: 'Profile 1',
        profileName: 'shopflow',
        cdpUrl: defaultShopflowLiveCdpUrl,
        remoteDebuggingPort: defaultShopflowLiveCdpPort,
        chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        startedAt: '2026-04-05T00:00:00.000Z',
        source: 'shopflow-singleton',
      },
      resolve(tempRoot, 'active-browser-instance.json'),
      true,
      {
        probeVersion: async () => ({ ok: true }),
        isRunning: () => true,
        sendSignal: (pid, signal) => {
          signalCalls.push({ pid, signal: signal as NodeJS.Signals });
        },
        processList:
          '1234 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=9777 --user-data-dir=/tmp/other-root --profile-directory=Other --no-first-run',
      }
    );

    expect(execution.singletonInstance.strategy).toBe('failed');
    expect(execution.blockers).toEqual(
      expect.arrayContaining([
        'Refusing to close because the recorded singleton can no longer be re-verified as the Shopflow-owned Chrome process for the requested dedicated profile.',
      ])
    );
    expect(signalCalls).toEqual([]);
    expect(execution.singletonInstance.recordRemoved).toBe(false);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('removes stale singleton records without touching other repos', async () => {
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
    });
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-live-close-'));
    config.artifactDirectory = tempRoot;
    writeActiveBrowserInstanceRecord(tempRoot, {
      pid: 1234,
      userDataDir: dedicatedUserDataDir,
      profileDirectory: 'Profile 1',
      profileName: 'shopflow',
      cdpUrl: defaultShopflowLiveCdpUrl,
      remoteDebuggingPort: defaultShopflowLiveCdpPort,
      chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      startedAt: '2026-04-05T00:00:00.000Z',
      source: 'shopflow-singleton',
    });
    const execution = await executeCloseLiveBrowser(
      config,
      {
        pid: 1234,
        userDataDir: dedicatedUserDataDir,
        profileDirectory: 'Profile 1',
        profileName: 'shopflow',
        cdpUrl: defaultShopflowLiveCdpUrl,
        remoteDebuggingPort: defaultShopflowLiveCdpPort,
        chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        startedAt: '2026-04-05T00:00:00.000Z',
        source: 'shopflow-singleton',
      },
      resolve(tempRoot, 'active-browser-instance.json'),
      false,
      {
        isRunning: () => false,
        probeVersion: async () => ({ ok: false }),
      }
    );

    expect(execution.singletonInstance.strategy).toBe('stale-record');
    expect(execution.singletonInstance.recordRemoved).toBe(true);
    expect(execution.blockers).toEqual([]);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('closes the recorded singleton through the shared wrapper when the record still matches the requested profile', async () => {
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
    });
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-live-close-'));
    config.artifactDirectory = tempRoot;
    writeActiveBrowserInstanceRecord(tempRoot, {
      pid: 2468,
      userDataDir: dedicatedUserDataDir,
      profileDirectory: 'Profile 1',
      profileName: 'shopflow',
      cdpUrl: defaultShopflowLiveCdpUrl,
      remoteDebuggingPort: defaultShopflowLiveCdpPort,
      chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      startedAt: '2026-04-05T00:00:00.000Z',
      source: 'shopflow-singleton',
    });

    let listenerReachable = true;

    class WrapperCloseSocket extends EventTarget {
      close() {}

      send() {
        listenerReachable = false;
        queueMicrotask(() => this.dispatchEvent(new Event('message')));
      }
    }

    const execution = await closeShopflowLiveBrowser(
      config,
      recordedChromeProcessList(2468),
      {
        probeVersion: async () => ({
          ok: listenerReachable,
          parsed: listenerReachable
            ? { webSocketDebuggerUrl: 'ws://127.0.0.1:9335/devtools/browser/shopflow' }
            : undefined,
        }),
        socketFactory: () => {
          const socket = new WrapperCloseSocket() as unknown as WebSocket;
          queueMicrotask(() => socket.dispatchEvent(new Event('open')));
          return socket;
        },
        isRunning: () => false,
      }
    );

    expect(execution.singletonInstance.strategy).toBe('cdp-browser-close');
    expect(execution.closeAttempt.outcome).toBe('closed_via_cdp');
    expect(execution.blockers).toEqual([]);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('reports the recorded singleton state only when the recorded pid still matches the requested profile', () => {
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
    });
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-live-singleton-'));
    config.artifactDirectory = tempRoot;
    const recordPath = writeActiveBrowserInstanceRecord(tempRoot, {
      pid: 9753,
      userDataDir: dedicatedUserDataDir,
      profileDirectory: 'Profile 1',
      profileName: 'shopflow',
      cdpUrl: defaultShopflowLiveCdpUrl,
      remoteDebuggingPort: defaultShopflowLiveCdpPort,
      chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      startedAt: '2026-04-05T00:00:00.000Z',
      source: 'shopflow-singleton',
    });

    const singleton = getShopflowLiveSingletonState(
      config,
      recordedChromeProcessList(9753)
    );

    expect(singleton.recordPath).toBe(recordPath);
    expect(singleton.record).toBeDefined();
    expect(singleton.running).toBe(true);
    expect(singleton.runningPid).toBe(9753);
    expect(singleton.matchesRequestedProfile).toBe(true);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('launches a debug browser command through the configured executable without touching the host Chrome root', async () => {
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
      SHOPFLOW_LIVE_TARGETS: 'qfc-search',
      SHOPFLOW_LIVE_CHROME_EXECUTABLE: '/usr/bin/true',
    });
    const previous = process.env[shopflowDetachedBrowserLaunchEnv];
    process.env[shopflowDetachedBrowserLaunchEnv] = '1';

    try {
      const launched = await launchChromeWithRemoteDebugging(config);

      expect(typeof launched.pid).toBe('number');
      expect(launched.pid).toBeGreaterThan(0);
      expect(launched.startUrls).toEqual([
        'https://www.qfc.com/search?query=kombucha',
      ]);
    } finally {
      if (previous === undefined) {
        delete process.env[shopflowDetachedBrowserLaunchEnv];
      } else {
        process.env[shopflowDetachedBrowserLaunchEnv] = previous;
      }
    }
  });

  it('prefers Browser.close, then SIGTERM, then force fallback for close-live-browser', async () => {
    const signalCalls: Array<{ pid: number; signal: NodeJS.Signals }> = [];
    let terminated = false;
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
    });
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-live-close-'));
    config.artifactDirectory = tempRoot;
    writeActiveBrowserInstanceRecord(tempRoot, {
      pid: 1234,
      userDataDir: dedicatedUserDataDir,
      profileDirectory: 'Profile 1',
      profileName: 'shopflow',
      cdpUrl: defaultShopflowLiveCdpUrl,
      remoteDebuggingPort: defaultShopflowLiveCdpPort,
      chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      startedAt: '2026-04-05T00:00:00.000Z',
      source: 'shopflow-singleton',
    });
    const execution = await executeCloseLiveBrowser(
      config,
      {
        pid: 1234,
        userDataDir: dedicatedUserDataDir,
        profileDirectory: 'Profile 1',
        profileName: 'shopflow',
        cdpUrl: defaultShopflowLiveCdpUrl,
        remoteDebuggingPort: defaultShopflowLiveCdpPort,
        chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        startedAt: '2026-04-05T00:00:00.000Z',
        source: 'shopflow-singleton',
      },
      resolve(tempRoot, 'active-browser-instance.json'),
      true,
      {
        probeVersion: async () => ({ ok: false }),
        isRunning: () => !terminated,
        sendSignal: (pid, signal) => {
          signalCalls.push({ pid, signal: signal as NodeJS.Signals });
          terminated = true;
        },
        processList: recordedChromeProcessList(1234),
      }
    );

    expect(execution.singletonInstance.strategy).toBe('sigterm');
    expect(signalCalls).toEqual([{ pid: 1234, signal: 'SIGTERM' }]);
    expect(execution.singletonInstance.recordRemoved).toBe(true);
    expect(execution.blockers).toEqual([]);
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it(
    'uses a final force fallback only on the recorded Shopflow singleton pid',
    async () => {
    const signalCalls: Array<{ pid: number; signal: NodeJS.Signals }> = [];
    let terminated = false;
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
    });
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-live-close-'));
    config.artifactDirectory = tempRoot;
    writeActiveBrowserInstanceRecord(tempRoot, {
      pid: 4321,
      userDataDir: dedicatedUserDataDir,
      profileDirectory: 'Profile 1',
      profileName: 'shopflow',
      cdpUrl: defaultShopflowLiveCdpUrl,
      remoteDebuggingPort: defaultShopflowLiveCdpPort,
      chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      startedAt: '2026-04-05T00:00:00.000Z',
      source: 'shopflow-singleton',
    });
    const execution = await executeCloseLiveBrowser(
      config,
      {
        pid: 4321,
        userDataDir: dedicatedUserDataDir,
        profileDirectory: 'Profile 1',
        profileName: 'shopflow',
        cdpUrl: defaultShopflowLiveCdpUrl,
        remoteDebuggingPort: defaultShopflowLiveCdpPort,
        chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        startedAt: '2026-04-05T00:00:00.000Z',
        source: 'shopflow-singleton',
      },
      resolve(tempRoot, 'active-browser-instance.json'),
      true,
      {
        probeVersion: async () => ({ ok: false, error: 'cdp_unreachable' }),
        isRunning: () => !terminated,
        sendSignal: (pid, signal) => {
          signalCalls.push({ pid, signal: signal as NodeJS.Signals });
          if (signal === 'SIGKILL') {
            terminated = true;
          }
        },
        processList: recordedChromeProcessList(4321),
      }
    );

    expect(signalCalls).toEqual([
      { pid: 4321, signal: 'SIGTERM' },
      { pid: 4321, signal: 'SIGKILL' },
    ]);
    expect(execution.singletonInstance.forceFallbackUsed).toBe(true);
    expect(execution.singletonInstance.strategy).toBe('sigkill');
    expect(execution.singletonInstance.recordRemoved).toBe(true);
    expect(execution.blockers).toEqual([]);
    rmSync(tempRoot, { recursive: true, force: true });
    },
    10000
  );

  it('reports a safe no-op when no Shopflow singleton record exists to close', async () => {
    const config = resolveShopflowLiveSessionConfig({
      SHOPFLOW_LIVE: '1',
    });
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-live-close-'));
    config.artifactDirectory = tempRoot;

    const report = await closeShopflowLiveBrowser(config, '', {
      probeVersion: async () => ({ ok: false, error: 'cdp_unreachable' }),
      processList: '',
    });

    expect(report.singletonInstance.recordExists).toBe(false);
    expect(report.singletonInstance.strategy).toBe('no-op');
    expect(report.closeAttempt.outcome).toBe('already_stopped');
    expect(report.blockers).toEqual([]);
    expect(report.nextActions.join(' ')).toContain(
      'no dedicated live browser instance to close'
    );
    rmSync(tempRoot, { recursive: true, force: true });
  });

});
