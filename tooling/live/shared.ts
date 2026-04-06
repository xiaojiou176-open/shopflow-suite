import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { request as httpRequest } from 'node:http';
import { chromium } from '@playwright/test';
import {
  canonicalShopflowLiveProfileDirectory,
  canonicalShopflowLiveProfileName,
  legacyChromeUserDataDirDefault,
  resolveShopflowCachePolicy,
} from '../maintenance/cache-policy';
import {
  buildActiveBrowserInstanceRecordPath,
  collectChromeMainProcesses,
  findDefaultChromeRootProcesses,
  findChromeProcessesUsingUserDataDir,
  removeActiveBrowserInstanceRecord,
  readActiveBrowserInstanceRecord,
  type ShopflowChromeMainProcess,
  type ShopflowBrowserInstanceRecord,
} from './browser-profile';
import {
  getLiveReceiptCapturePlans,
  type LiveReceiptCapturePlan,
  type StoreAppId,
} from '@shopflow/contracts';
import { writeFileAtomically } from '../shared/write-file-atomically';

export const shopflowLiveTargetIds = [
  'safeway-home',
  'safeway-cart',
  'safeway-manage',
  'fred-meyer-coupons',
  'qfc-search',
  'temu-search',
] as const;

export type ShopflowLiveTargetId = (typeof shopflowLiveTargetIds)[number];

export type ShopflowLiveAttachMode = 'auto' | 'browser' | 'page' | 'persistent';

export type ShopflowLiveTarget = {
  id: ShopflowLiveTargetId;
  appId: StoreAppId;
  label: string;
  verifiedScope: string;
  pageKind: string;
  url: string;
  captureIds: string[];
};

export type ShopflowLiveTargetObservation = {
  id: ShopflowLiveTargetId;
  label: string;
  requestedUrl: string;
  finalUrl?: string;
  title?: string;
  classification:
    | 'session_visible'
    | 'login_required'
    | 'deep_link_unstable'
    | 'public_or_unknown'
    | 'not_open';
  source: 'cdp-target' | 'existing-tab' | 'not-open';
  captureIds: string[];
  pageSignals?: {
    hasPasswordField: boolean;
    signInTextVisible: boolean;
  };
};

export type ShopflowLiveTargetClassificationSummary = {
  total: number;
  sessionVisible: number;
  loginRequired: number;
  deepLinkUnstable: number;
  publicOrUnknown: number;
  notOpen: number;
};

export type ShopflowSafewaySessionHealth =
  | 'healthy'
  | 'login_required'
  | 'not_open'
  | 'unknown';
export type ShopflowSafewayCaptureTargetState =
  | 'healthy'
  | 'login_required'
  | 'deep_link_unstable'
  | 'mixed'
  | 'unknown';
export type ShopflowSafewayDeepLinkState = 'stable' | 'unstable' | 'unknown';

export type ShopflowSafewayAssessment = {
  sessionHealth: ShopflowSafewaySessionHealth;
  captureTargetState: ShopflowSafewayCaptureTargetState;
  deepLinkState: ShopflowSafewayDeepLinkState;
};

export type ShopflowSeedTargetVerification = {
  blockers: string[];
  nextActions: string[];
};

export type ShopflowLiveSessionConfig = {
  enabled: boolean;
  userDataDir: string;
  profileDirectory: string;
  profileName: string;
  userDataDirLabel: string;
  attachModeRequested: ShopflowLiveAttachMode;
  cdpUrl: string;
  cdpPort: number;
  chromeExecutable: string;
  artifactDirectory: string;
  targets: ShopflowLiveTarget[];
};

export type ShopflowLiveLaunchVerificationOutcome =
  | 'listener_ready'
  | 'launch_exited_before_listener'
  | 'listener_unreachable';

export type ShopflowLiveLaunchVerification = {
  checkedAt: string;
  cdpUrl: string;
  attemptedPid?: number;
  listenerReachable: boolean;
  pidStillRunning?: boolean;
  observedTargetTabCount: number;
  outcome: ShopflowLiveLaunchVerificationOutcome;
};

export const defaultBrowserMainProcessBudget = 6;
export const defaultShopflowLiveCdpPort = 9335;
export const defaultShopflowLiveCdpUrl = `http://127.0.0.1:${defaultShopflowLiveCdpPort}`;
export const shopflowDetachedBrowserLaunchEnv = 'SHOPFLOW_LIVE_ALLOW_DETACHED_BROWSER';

export type ShopflowBrowserInstanceBudgetReport = {
  limit: number;
  browserMainProcessCount: number;
  blockedLaunch: boolean;
  browserMainProcessPids: number[];
  matchingRequestedRootPids: number[];
  matchingRequestedPortPids: number[];
};

export type ShopflowDebugChromeProcess = {
  pid: number;
  listening: boolean;
  remoteDebuggingPort?: number;
  userDataDir?: string;
  userDataDirLabel?: string;
  profileDirectory?: string;
};

export type ShopflowLivePreflightReport = {
  mode: 'shopflow_live_preflight';
  checkedAt: string;
  enabled: boolean;
  profile: {
    userDataDir: string;
    userDataDirExists: boolean;
    localStatePath: string;
    localStateExists: boolean;
    profileDirectory: string;
    profilePath: string;
    profilePathExists: boolean;
    profileName: string;
  };
  chrome: {
    executable: string;
    executableExists: boolean;
    cdpUrl: string;
    attachModeRequested: ShopflowLiveAttachMode;
  };
  targets: Array<{
    id: ShopflowLiveTargetId;
    label: string;
    url: string;
    captureIds: string[];
  }>;
  debugChrome: {
    listenerCount: number;
    processes: ShopflowDebugChromeProcess[];
  };
  singletonInstance: {
    recordPath: string;
    recordExists: boolean;
    running: boolean;
    pid?: number;
    userDataDir?: string;
    profileDirectory?: string;
    cdpUrl?: string;
    matchesRequestedProfile: boolean;
  };
  blockers: string[];
  nextActions: string[];
};

export type ShopflowLiveProbeReport = {
  mode: 'shopflow_live_probe';
  checkedAt: string;
  profile: {
    requestedUserDataDir: string;
    requestedProfileDirectory: string;
    requestedProfileName: string;
    requestedProfileMatchesActiveListener: boolean;
  };
  attach: {
    requestedMode: ShopflowLiveAttachMode;
    resolvedMode: Exclude<ShopflowLiveAttachMode, 'auto'>;
    cdpReachable: boolean;
    attachStatus:
      | 'attached'
      | 'attach_failed'
      | 'profile_mismatch'
      | 'existing-tabs-only';
  };
  debugChrome: {
    listenerCount: number;
    activeListener?: ShopflowDebugChromeProcess;
    processes: ShopflowDebugChromeProcess[];
  };
  singletonInstance: {
    recordPath: string;
    recordExists: boolean;
    running: boolean;
    pid?: number;
    matchesRequestedProfile: boolean;
  };
  cdp: {
    versionOk: boolean;
    targetCount: number;
    pageTargetCount: number;
    urls: string[];
  };
  sessionHealth: {
    safeway: ShopflowSafewaySessionHealth;
  };
  captureTargetState: {
    safeway: ShopflowSafewayCaptureTargetState;
  };
  deepLinkState: {
    safeway: ShopflowSafewayDeepLinkState;
  };
  observedTabs: ShopflowChromeTabSnapshot[];
  targets: ShopflowLiveTargetObservation[];
};

export type ShopflowLiveTraceBundle = {
  bundleDirectory: string;
  summaryPath: string;
  chromeTabsPath: string;
  chromeProcessesPath: string;
  cdpSummaryPath: string;
  screenshotManifestPath: string;
  consolePath: string;
  pageErrorsPath: string;
  requestFailedPath: string;
  networkPath: string;
  screenshotsDirectory: string;
  traceMode: 'snapshot-only' | 'cdp-passive';
  pageCount: number;
  attachError?: string;
};

export type ShopflowLiveTraceScreenshotEntry = {
  pageUrl?: string;
  title?: string;
  screenshotLabel: string;
  screenshotPath: string;
};

export type ShopflowLiveDiagnoseReport = {
  mode: 'shopflow_live_diagnose';
  checkedAt: string;
  blockers: string[];
  nextActions: string[];
  recommendations: {
    profileAlignment: {
      requestedUserDataDir: string;
      requestedProfileDirectory: string;
      requestedProfileName: string;
      activeListenerUserDataDir?: string;
      activeListenerProfileDirectory?: string;
      status: 'matched' | 'mismatch' | 'listener-unreachable';
    };
    commands: {
      diagnose: string;
      probe: string;
      openBrowser: string;
    };
  };
  preflight: ShopflowLivePreflightReport;
  probe: ShopflowLiveProbeReport;
};

export type ShopflowLiveCloseBrowserReport = {
  mode: 'shopflow_live_close_browser';
  checkedAt: string;
  requestedProfile: {
    userDataDir: string;
    profileDirectory: string;
    profileName: string;
    cdpUrl: string;
  };
  singletonInstance: {
    recordPath: string;
    recordExists: boolean;
    pid?: number;
    cdpUrl?: string;
    runningBefore: boolean;
    listenerReachableBefore: boolean;
    listenerReachableAfter: boolean;
    pidRunningAfter: boolean;
    strategy:
      | 'stale-record'
      | 'cdp-browser-close'
      | 'sigterm'
      | 'sigkill'
      | 'no-op'
      | 'failed';
    forceFallbackUsed: boolean;
    recordRemoved: boolean;
  };
  closeAttempt: {
    cdpRequested: boolean;
    cdpClosed: boolean;
    sigtermSent: boolean;
    sigkillSent: boolean;
    pidExited: boolean;
    listenerReachableAfterClose: boolean;
    outcome:
      | 'already_stopped'
      | 'closed_via_cdp'
      | 'terminated'
      | 'force_killed'
      | 'close_failed';
  };
  blockers: string[];
  nextActions: string[];
};

export type ShopflowLiveBrowserCloseRequest = {
  attempted: boolean;
  succeeded: boolean;
  error?: string;
};

export type ShopflowLiveSingletonState = {
  recordPath: string;
  record?: ShopflowBrowserInstanceRecord;
  running: boolean;
  runningPid?: number;
  matchesRequestedProfile: boolean;
  verifiedProcess?: ShopflowChromeMainProcess;
};

const defaultChromeUserDataDir = resolveShopflowCachePolicy().browserUserDataDir;
const defaultChromeUserDataDirLabel =
  resolveShopflowCachePolicy().browserUserDataDirLabel;
const legacyChromeUserDataDir = join(
  homedir(),
  'Library',
  'Application Support',
  'Google',
  'Chrome'
);
const defaultChromeExecutable =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function readChromeProfileDisplayName(
  userDataDir: string,
  profileDirectory: string
) {
  try {
    const localStatePath = join(userDataDir, 'Local State');
    if (!existsSync(localStatePath)) {
      return undefined;
    }

    const parsed = JSON.parse(readFileSync(localStatePath, 'utf8')) as {
      profile?: {
        info_cache?: Record<string, { name?: string }>;
      };
    };

    const displayName = parsed.profile?.info_cache?.[profileDirectory]?.name;
    return typeof displayName === 'string' && displayName.trim()
      ? displayName
      : undefined;
  } catch {
    return undefined;
  }
}

function captureIdsFor(
  appId: StoreAppId,
  predicate: (plan: LiveReceiptCapturePlan) => boolean
) {
  return getLiveReceiptCapturePlans(appId)
    .filter(predicate)
    .map((plan) => plan.captureId);
}

export function buildCanonicalMerchantTargets(): ShopflowLiveTarget[] {
  return [
    {
      id: 'safeway-home',
      appId: 'ext-albertsons',
      label: 'Safeway home',
      verifiedScope: 'safeway',
      pageKind: 'session-health',
      url: 'https://www.safeway.com/',
      captureIds: [],
    },
    {
      id: 'safeway-cart',
      appId: 'ext-albertsons',
      label: 'Safeway cart',
      verifiedScope: 'safeway',
      pageKind: 'cart',
      url: 'https://www.safeway.com/shop/cart',
      captureIds: captureIdsFor(
        'ext-albertsons',
        (plan) => plan.captureId === 'safeway-subscribe-live-receipt'
      ),
    },
    {
      id: 'safeway-manage',
      appId: 'ext-albertsons',
      label: 'Safeway Schedule & Save manage',
      verifiedScope: 'safeway',
      pageKind: 'manage',
      url: 'https://www.safeway.com/schedule-and-save/manage',
      captureIds: captureIdsFor(
        'ext-albertsons',
        (plan) => plan.captureId === 'safeway-cancel-live-receipt'
      ),
    },
    {
      id: 'fred-meyer-coupons',
      appId: 'ext-kroger',
      label: 'Fred Meyer coupons',
      verifiedScope: 'fred-meyer',
      pageKind: 'deal',
      url: 'https://www.fredmeyer.com/pr/weekly-digital-deals',
      captureIds: captureIdsFor(
        'ext-kroger',
        (plan) => plan.captureId === 'fred-meyer-verified-scope-live-receipt'
      ),
    },
    {
      id: 'qfc-search',
      appId: 'ext-kroger',
      label: 'QFC search',
      verifiedScope: 'qfc',
      pageKind: 'search',
      url: 'https://www.qfc.com/search?query=kombucha',
      captureIds: captureIdsFor(
        'ext-kroger',
        (plan) => plan.captureId === 'qfc-verified-scope-live-receipt'
      ),
    },
    {
      id: 'temu-search',
      appId: 'ext-temu',
      label: 'Temu warehouse search',
      verifiedScope: 'temu',
      pageKind: 'search',
      url: 'https://www.temu.com/search_result.html?search_key=warehouse',
      captureIds: captureIdsFor(
        'ext-temu',
        (plan) => plan.captureId === 'temu-filter-live-receipt'
      ),
    },
  ];
}

export function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseTargetIds(value: string | undefined) {
  if (!value?.trim()) {
    return [...shopflowLiveTargetIds];
  }

  const requested = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const targetIds = shopflowLiveTargetIds.filter((targetId) =>
    requested.includes(targetId)
  );

  const needsSafewayHealth =
    targetIds.includes('safeway-cart') || targetIds.includes('safeway-manage');
  if (needsSafewayHealth && !targetIds.includes('safeway-home')) {
    return ['safeway-home', ...targetIds];
  }

  return targetIds;
}

export function resolveShopflowLiveSessionConfig(
  env: NodeJS.ProcessEnv = process.env
): ShopflowLiveSessionConfig {
  const requestedTargetIds = parseTargetIds(env.SHOPFLOW_LIVE_TARGETS);
  const targets = buildCanonicalMerchantTargets().filter((target) =>
    requestedTargetIds.includes(target.id)
  );
  const cdpUrl = env.SHOPFLOW_LIVE_CDP_URL || defaultShopflowLiveCdpUrl;
  const userDataDir = env.SHOPFLOW_LIVE_USER_DATA_DIR || defaultChromeUserDataDir;
  const profileDirectory =
    env.SHOPFLOW_LIVE_PROFILE_DIRECTORY || canonicalShopflowLiveProfileDirectory;
  const detectedProfileName = readChromeProfileDisplayName(
    userDataDir,
    profileDirectory
  );

  return {
    enabled: env.SHOPFLOW_LIVE === '1',
    userDataDir,
    profileDirectory,
    profileName:
      env.SHOPFLOW_LIVE_PROFILE_NAME ||
      detectedProfileName ||
      canonicalShopflowLiveProfileName,
    userDataDirLabel:
      env.SHOPFLOW_LIVE_USER_DATA_DIR || defaultChromeUserDataDirLabel,
    attachModeRequested:
      (env.SHOPFLOW_LIVE_ATTACH_MODE as ShopflowLiveAttachMode | undefined) ||
      'auto',
    cdpUrl,
    cdpPort: parsePositiveInt(new URL(cdpUrl).port, defaultShopflowLiveCdpPort),
    chromeExecutable:
      env.SHOPFLOW_LIVE_CHROME_EXECUTABLE || defaultChromeExecutable,
    artifactDirectory: resolve('.runtime-cache', 'live-browser'),
    targets,
  };
}

export function buildShopflowLiveCommand(
  config: ShopflowLiveSessionConfig,
  script: string,
  overrides: Partial<Record<string, string>> = {}
) {
  const envMap: Record<string, string> = {
    SHOPFLOW_LIVE: '1',
    SHOPFLOW_LIVE_USER_DATA_DIR: config.userDataDir,
    SHOPFLOW_LIVE_PROFILE_DIRECTORY: config.profileDirectory,
    SHOPFLOW_LIVE_PROFILE_NAME: config.profileName,
    SHOPFLOW_LIVE_ATTACH_MODE: config.attachModeRequested,
    SHOPFLOW_LIVE_CDP_URL: config.cdpUrl,
  };

  if (config.targets.length > 0) {
    envMap.SHOPFLOW_LIVE_TARGETS = config.targets
      .map((target) => target.id)
      .join(',');
  }
  if (script === 'open:live-browser') {
    envMap[shopflowDetachedBrowserLaunchEnv] = '1';
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === 'string') {
      envMap[key] = value;
    }
  }

  const envParts = Object.entries(envMap).map(
    ([key, value]) => `${key}=${JSON.stringify(value)}`
  );

  return `${envParts.join(' ')} pnpm ${script}`;
}

export function getShopflowLiveSingletonState(
  config: ShopflowLiveSessionConfig,
  processList = readChromeProcessList()
): ShopflowLiveSingletonState {
  const recordPath = buildActiveBrowserInstanceRecordPath(config.artifactDirectory);
  const record = readActiveBrowserInstanceRecord(config.artifactDirectory);
  const matchingProcesses = findChromeProcessesUsingUserDataDir(processList, config.userDataDir);
  const verifiedProcess = record
    ? findRecordedChromeProcess(record, processList)
    : undefined;
  const running = record
    ? Boolean(verifiedProcess)
    : Boolean(matchingProcesses[0]);
  const matchesRequestedProfile = Boolean(
    record &&
      record.userDataDir === config.userDataDir &&
      record.profileDirectory === config.profileDirectory &&
      record.profileName === config.profileName
  );

  return {
    recordPath,
    record,
    running,
    runningPid: record
      ? verifiedProcess?.pid
      : running
        ? matchingProcesses[0]?.pid
        : undefined,
    matchesRequestedProfile,
    verifiedProcess,
  };
}

function recordOwnsRequestedProfile(
  config: ShopflowLiveSessionConfig,
  record: ShopflowBrowserInstanceRecord
) {
  return (
    record.userDataDir === config.userDataDir &&
    record.profileDirectory === config.profileDirectory &&
    record.profileName === config.profileName
  );
}

function recordedChromeProcessMatches(
  processInfo: ShopflowChromeMainProcess,
  record: ShopflowBrowserInstanceRecord
) {
  const recordedExecutable = resolve(record.chromeExecutable);
  const recordedUserDataDir = resolve(record.userDataDir);
  const recordedPort = record.remoteDebuggingPort;

  if (processInfo.pid !== record.pid) {
    return false;
  }
  if (!processInfo.userDataDir || resolve(processInfo.userDataDir) !== recordedUserDataDir) {
    return false;
  }
  if (processInfo.profileDirectory !== record.profileDirectory) {
    return false;
  }
  if (typeof recordedPort === 'number' && processInfo.remoteDebuggingPort !== recordedPort) {
    return false;
  }

  const executable = processInfo.command.split(/\s--/)[0]?.trim() ?? '';
  return resolve(executable) === recordedExecutable;
}

function findRecordedChromeProcess(
  record: ShopflowBrowserInstanceRecord,
  processList: string
) {
  return collectChromeMainProcesses(processList).find((processInfo) =>
    recordedChromeProcessMatches(processInfo, record)
  );
}

export function readChromeProcessList() {
  try {
    return execFileSync('ps', ['-ax', '-ww', '-o', 'pid=,command='], {
      encoding: 'utf8',
    });
  } catch {
    return '';
  }
}

export function readListeningPids(port: number) {
  try {
    const output = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], {
      encoding: 'utf8',
    });
    return output
      .split('\n')
      .slice(1)
      .map((line) => line.trim().split(/\s+/)[1])
      .filter(Boolean)
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value));
  } catch {
    return [];
  }
}

export function countBrowserMainProcesses(processList: string) {
  return processList
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const match = line.match(/^(\d+)\s+(.*)$/);
      if (!match) {
        return false;
      }

      const command = match[2];
      return /\/Contents\/MacOS\/(Google Chrome|Chromium|Chrome for Testing)$/i.test(
        chromeExecutableSegment(command)
      );
    }).length;
}

export function shouldDeferDebugChromeLaunch(
  processList: string,
  budget = defaultBrowserMainProcessBudget
) {
  return countBrowserMainProcesses(processList) > budget;
}

export function buildBrowserInstanceBudgetReport(
  processList: string,
  userDataDir: string,
  cdpPort: number,
  budget = defaultBrowserMainProcessBudget
): ShopflowBrowserInstanceBudgetReport {
  const chromeMainProcesses = collectChromeMainProcesses(processList);
  const matchingRequestedRootProcesses = findChromeProcessesUsingUserDataDir(
    processList,
    userDataDir
  );
  const matchingRequestedPortProcesses = chromeMainProcesses.filter(
    (processInfo) => processInfo.remoteDebuggingPort === cdpPort
  );

  return {
    limit: budget,
    browserMainProcessCount: chromeMainProcesses.length,
    blockedLaunch: chromeMainProcesses.length > budget,
    browserMainProcessPids: chromeMainProcesses.map((processInfo) => processInfo.pid),
    matchingRequestedRootPids: matchingRequestedRootProcesses.map(
      (processInfo) => processInfo.pid
    ),
    matchingRequestedPortPids: matchingRequestedPortProcesses.map(
      (processInfo) => processInfo.pid
    ),
  };
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function chromeExecutableSegment(command: string) {
  return command.split(/\s--/)[0]?.trim() ?? command;
}

function matchArgument(command: string, flag: string) {
  const escapedFlag = escapeForRegExp(flag);
  const match = command.match(
    new RegExp(
      `${escapedFlag}=(?:"([^"]*)"|'([^']*)'|(.+?))(?=\\s--[\\w-]+(?:=|\\b)|\\shttps?:\\/\\/|$)`
    )
  );
  return match?.[1]?.trim() ?? match?.[2]?.trim() ?? match?.[3]?.trim();
}

export function collectChromeDebugProcesses(
  processList: string,
  listeningPids: readonly number[],
  expectedPort: number
): ShopflowDebugChromeProcess[] {
  return processList
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const match = line.match(/^(\d+)\s+(.*)$/);
      if (!match) {
        return [];
      }

      const pid = Number.parseInt(match[1], 10);
      const command = match[2];
      if (!Number.isFinite(pid)) {
        return [];
      }

      if (
        !/\/Contents\/MacOS\/(Google Chrome|Chromium|Chrome for Testing)$/i.test(
          chromeExecutableSegment(command)
        )
      ) {
        return [];
      }

      const remoteDebuggingPort = parsePositiveInt(
        matchArgument(command, '--remote-debugging-port'),
        0
      );

      if (remoteDebuggingPort !== expectedPort && !listeningPids.includes(pid)) {
        return [];
      }

      const userDataDir = matchArgument(command, '--user-data-dir');
      const profileDirectory = matchArgument(command, '--profile-directory');

      return [
        {
          pid,
          listening: listeningPids.includes(pid),
          remoteDebuggingPort:
            remoteDebuggingPort > 0 ? remoteDebuggingPort : undefined,
          userDataDir,
          userDataDirLabel: userDataDir ? userDataDir.replace(homedir(), '~') : undefined,
          profileDirectory,
        },
      ];
    });
}

async function probeJson(url: string, pathname: string) {
  return new Promise<{
    ok: boolean;
    statusCode?: number;
    parsed?: unknown;
    error?: string;
  }>((resolveProbe) => {
    try {
      const endpoint = new URL(pathname, url);
      const request = httpRequest(
        endpoint,
        {
          method: 'GET',
          timeout: 1200,
        },
        (response) => {
          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf8');
            try {
              resolveProbe({
                ok: response.statusCode === 200,
                statusCode: response.statusCode,
                parsed: JSON.parse(body),
              });
            } catch {
              resolveProbe({
                ok: false,
                statusCode: response.statusCode,
                error: `invalid_json:${pathname}`,
              });
            }
          });
        }
      );
      request.on('error', (error) => {
        resolveProbe({ ok: false, error: error.message });
      });
      request.on('timeout', () => {
        request.destroy(new Error(`timeout:${pathname}`));
      });
      request.end();
    } catch (error) {
      resolveProbe({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

export async function probeCdpVersion(url: string) {
  return probeJson(url, '/json/version');
}

export async function probeCdpTargets(url: string) {
  return probeJson(url, '/json/list');
}

export type ShopflowChromeTabSnapshot = {
  url: string;
  title: string;
};

function buildObservedCdpTabs(
  candidates: Array<{ title?: string; url?: string; type?: string }>
) {
  return candidates
    .filter((candidate) => candidate.type === 'page')
    .map((candidate) => ({
      url: candidate.url ?? '',
      title: candidate.title ?? '',
    }))
    .filter((entry) => entry.url.startsWith('http'));
}

function isPidRunning(pid: number) {
  if (!Number.isFinite(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function hostFor(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

function pathnameFor(url: string) {
  try {
    return new URL(url).pathname;
  } catch {
    return '';
  }
}

export function classifyLiveTargetObservation(
  target: ShopflowLiveTarget,
  finalUrl?: string,
  title = '',
  pageSignals?: ShopflowLiveTargetObservation['pageSignals']
): ShopflowLiveTargetObservation['classification'] {
  if (!finalUrl) {
    return 'not_open';
  }

  const targetHost = hostFor(target.url);
  const finalHost = hostFor(finalUrl);
  if (!targetHost || !finalHost || targetHost !== finalHost) {
    return 'public_or_unknown';
  }

  const lower = `${finalUrl} ${title}`.toLowerCase();
  if (pageSignals?.hasPasswordField || pageSignals?.signInTextVisible) {
    return 'login_required';
  }
  if (/(404|page not found|access denied)/i.test(lower)) {
    return 'public_or_unknown';
  }
  if (
    /(sign[\s-]?in|login|log[\s-]?in|challenge|captcha|verify|account\/signin|auth)/i.test(
      lower
    )
  ) {
    return 'login_required';
  }
  if (
    target.pageKind !== 'session-health' &&
    pathnameFor(finalUrl) !== pathnameFor(target.url)
  ) {
    return 'public_or_unknown';
  }

  return 'session_visible';
}

export function summarizeLiveTargetClassifications(
  targets: readonly ShopflowLiveTargetObservation[]
): ShopflowLiveTargetClassificationSummary {
  return targets.reduce<ShopflowLiveTargetClassificationSummary>(
    (summary, target) => {
      summary.total += 1;
      switch (target.classification) {
        case 'session_visible':
          summary.sessionVisible += 1;
          break;
        case 'login_required':
          summary.loginRequired += 1;
          break;
        case 'deep_link_unstable':
          summary.deepLinkUnstable += 1;
          break;
        case 'public_or_unknown':
          summary.publicOrUnknown += 1;
          break;
        case 'not_open':
          summary.notOpen += 1;
          break;
      }
      return summary;
    },
    {
      total: 0,
      sessionVisible: 0,
      loginRequired: 0,
      deepLinkUnstable: 0,
      publicOrUnknown: 0,
      notOpen: 0,
    }
  );
}

export function buildSeedTargetVerification(
  summary: ShopflowLiveTargetClassificationSummary
): ShopflowSeedTargetVerification {
  const blockers: string[] = [];
  const nextActions: string[] = [];

  if (summary.total > 0 && summary.notOpen === summary.total) {
    blockers.push(
      'The seeded Shopflow browser root became attachable, but none of the canonical merchant targets opened inside the migrated profile.'
    );
    nextActions.push(
      'Verify that the migrated dedicated root still owns the seeded merchant tabs, then rerun `pnpm browser:seed-profile` after closing the broken dedicated instance.'
    );
  }

  if (summary.total > 0 && summary.sessionVisible === 0) {
    blockers.push(
      'The seeded Shopflow browser root is attachable, but none of the canonical merchant targets currently prove a preserved signed-in merchant session.'
    );
    nextActions.push(
      'Treat this seed as incomplete until at least one canonical merchant target reports `session_visible` under the dedicated root, then rerun `pnpm browser:seed-profile`.'
    );
  }

  return {
    blockers,
    nextActions,
  };
}

function findMatchingTab(
  target: ShopflowLiveTarget,
  tabs: readonly ShopflowChromeTabSnapshot[]
) {
  const requested = new URL(target.url);

  return [...tabs]
    .filter((tab) => hostFor(tab.url) === requested.host)
    .sort((left, right) => scoreMatchingTab(target, right) - scoreMatchingTab(target, left))[0];
}

function countObservedTargetTabs(
  targets: readonly ShopflowLiveTarget[],
  tabs: readonly ShopflowChromeTabSnapshot[]
) {
  return targets.reduce(
    (count, target) => count + (findMatchingTab(target, tabs) ? 1 : 0),
    0
  );
}

export function classifyLiveBrowserLaunchOutcome(input: {
  listenerReachable: boolean;
  pidStillRunning?: boolean;
  observedTargetTabCount: number;
}): ShopflowLiveLaunchVerificationOutcome {
  if (input.listenerReachable) {
    return 'listener_ready';
  }
  if (input.pidStillRunning === false) {
    return 'launch_exited_before_listener';
  }
  return 'listener_unreachable';
}

function scoreMatchingTab(target: ShopflowLiveTarget, tab: ShopflowChromeTabSnapshot) {
  return scoreMatchingUrlAndTitle(target, tab.url, tab.title);
}

function scoreMatchingUrlAndTitle(
  target: ShopflowLiveTarget,
  candidateUrl: string,
  candidateTitle = ''
) {
  try {
    const requested = new URL(target.url);
    const candidate = new URL(candidateUrl);
    let score = 0;

    if (candidate.host === requested.host) {
      score += 20;
    }
    if (candidate.pathname === requested.pathname) {
      score += 50;
    }
    if (candidate.toString().startsWith(target.url)) {
      score += 40;
    }

    const lower = `${candidateUrl} ${candidateTitle}`.toLowerCase();
    if (/(sign[\s-]?in|login|log[\s-]?in|account\/sign-in)/i.test(lower)) {
      score += 10;
    }
    if (/(404|page not found|access denied)/i.test(lower)) {
      score += 5;
    }

    return score;
  } catch {
    return 0;
  }
}

function findMatchingCdpTarget(
  target: ShopflowLiveTarget,
  candidates: Array<{ title?: string; url?: string; type?: string }>
) {
  return [...candidates]
    .filter((candidate) => hostFor(candidate.url ?? '') === hostFor(target.url))
    .sort(
      (left, right) =>
        scoreMatchingUrlAndTitle(target, right.url ?? '', right.title ?? '') -
        scoreMatchingUrlAndTitle(target, left.url ?? '', left.title ?? '')
    )[0];
}

async function collectPageSignals(
  config: ShopflowLiveSessionConfig,
  targets: readonly ShopflowLiveTarget[]
) {
  const signals: Partial<
    Record<ShopflowLiveTargetId, NonNullable<ShopflowLiveTargetObservation['pageSignals']>>
  > = {};

  if (targets.length === 0) {
    return signals;
  }

  const readPageUrl = (page: { url(): string }) => {
    try {
      return page.url();
    } catch {
      return '';
    }
  };

  const readPageTitle = async (page: { title(): Promise<string> }) => {
    try {
      return await page.title();
    } catch {
      return '';
    }
  };

  let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | undefined;

  try {
    browser = await chromium.connectOverCDP(config.cdpUrl);
    const pages = browser.contexts().flatMap((context) => context.pages());
    const pageCandidates = await Promise.all(
      pages.map(async (page) => ({
        page,
        url: readPageUrl(page),
        title: await readPageTitle(page),
      }))
    );

    for (const target of targets) {
      const pageCandidate = [...pageCandidates]
        .sort(
          (left, right) =>
            scoreMatchingUrlAndTitle(target, right.url, right.title) -
            scoreMatchingUrlAndTitle(target, left.url, left.title)
        )[0];
      const page = pageCandidate?.page;

      if (!pageCandidate || !page || hostFor(pageCandidate.url) !== hostFor(target.url)) {
        continue;
      }

      try {
        signals[target.id] = await page.evaluate(() => {
          const text = (document.body?.innerText || '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
          return {
            hasPasswordField: Boolean(document.querySelector('input[type="password"]')),
            signInTextVisible: /sign in|log in|login|re sign in|welcome back|verify|challenge|captcha|登录/.test(
              text
            ),
          };
        });
      } catch {
        continue;
      }
    }
  } catch {
    return signals;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore close failure while collecting best-effort page signals
      }
    }
  }

  return signals;
}

export function buildSafewayAssessment(
  observations: readonly ShopflowLiveTargetObservation[]
): {
  observations: ShopflowLiveTargetObservation[];
  safewayAssessment: ShopflowSafewayAssessment;
} {
  const nextObservations = observations.map((target) => ({ ...target }));
  const homeTarget = nextObservations.find((target) => target.id === 'safeway-home');
  const deepLinkTargets = nextObservations.filter(
    (target): target is ShopflowLiveTargetObservation & {
      id: 'safeway-cart' | 'safeway-manage';
    } => target.id === 'safeway-cart' || target.id === 'safeway-manage'
  );

  const sessionHealth: ShopflowSafewaySessionHealth =
    homeTarget?.classification === 'session_visible'
      ? 'healthy'
      : homeTarget?.classification === 'login_required'
        ? 'login_required'
        : homeTarget?.classification === 'not_open'
          ? 'not_open'
          : 'unknown';

  if (sessionHealth === 'healthy') {
    for (const target of deepLinkTargets) {
      if (
        target.classification === 'public_or_unknown' &&
        target.finalUrl &&
        hostFor(target.finalUrl) === hostFor(target.requestedUrl)
      ) {
        target.classification = 'deep_link_unstable';
      }
    }
  }

  const deepLinkState: ShopflowSafewayDeepLinkState =
    deepLinkTargets.every((target) => target.classification === 'session_visible')
      ? 'stable'
      : deepLinkTargets.some((target) => target.classification === 'deep_link_unstable')
        ? 'unstable'
        : 'unknown';

  let captureTargetState: ShopflowSafewayCaptureTargetState;
  if (sessionHealth === 'login_required') {
    captureTargetState = 'login_required';
  } else if (
    deepLinkTargets.some((target) => target.classification === 'login_required')
  ) {
    captureTargetState = 'login_required';
  } else if (
    deepLinkTargets.some((target) => target.classification === 'deep_link_unstable')
  ) {
    captureTargetState = 'deep_link_unstable';
  } else if (
    deepLinkTargets.length > 0 &&
    deepLinkTargets.every((target) => target.classification === 'session_visible')
  ) {
    captureTargetState = 'healthy';
  } else if (
    deepLinkTargets.some(
      (target) =>
        target.classification === 'public_or_unknown' ||
        target.classification === 'not_open'
    )
  ) {
    captureTargetState = 'mixed';
  } else {
    captureTargetState = 'unknown';
  }

  return {
    observations: nextObservations,
    safewayAssessment: {
      sessionHealth,
      captureTargetState,
      deepLinkState,
    },
  };
}

export async function buildPreflightReport(
  config: ShopflowLiveSessionConfig
): Promise<ShopflowLivePreflightReport> {
  const processList = readChromeProcessList();
  const localStatePath = join(config.userDataDir, 'Local State');
  const profilePath = join(config.userDataDir, config.profileDirectory);
  const processes = collectChromeDebugProcesses(
    processList,
    readListeningPids(config.cdpPort),
    config.cdpPort
  );
  const defaultRootProcesses = findDefaultChromeRootProcesses(
    processList,
    legacyChromeUserDataDir
  ).filter((processInfo) => {
    return !processInfo.userDataDir || resolve(processInfo.userDataDir) !== resolve(config.userDataDir);
  });
  const singletonInstance = getShopflowLiveSingletonState(config);
  const blockers: string[] = [];

  if (!config.enabled) {
    blockers.push('Set SHOPFLOW_LIVE=1 before using the live browser lane.');
  }
  if (!existsSync(config.chromeExecutable)) {
    blockers.push(`Chrome executable is missing: ${config.chromeExecutable}`);
  }
  if (!existsSync(config.userDataDir)) {
    blockers.push(`Chrome user-data-dir is missing: ${config.userDataDir}`);
  }
  if (!existsSync(localStatePath)) {
    blockers.push(`Chrome Local State is missing: ${localStatePath}`);
  }
  if (!existsSync(profilePath)) {
    blockers.push(`Requested Chrome profile directory is missing: ${profilePath}`);
  }
  if (config.targets.length === 0) {
    blockers.push('No live merchant targets are selected.');
  }
  if (
    resolve(config.userDataDir) !== resolve(legacyChromeUserDataDir) &&
    defaultRootProcesses.length > 0
  ) {
    blockers.push(
      `Default Chrome root is still active at ${legacyChromeUserDataDirDefault}; close it before relying on the dedicated Shopflow singleton lane.`
    );
  }
  if (
    singletonInstance.record &&
    singletonInstance.record.userDataDir !== config.userDataDir
  ) {
    blockers.push(
      `Singleton instance record points at a different user-data-dir than the requested Shopflow browser root.`
    );
  }

  const nextActions = blockers.length
    ? [
        !existsSync(localStatePath) || !existsSync(profilePath)
          ? 'Seed the dedicated Shopflow browser root with `pnpm browser:seed-profile`, then rerun `pnpm preflight:live`.'
          : 'Repair the listed profile or Chrome prerequisites, then rerun `pnpm preflight:live`.',
      ]
    : [
        'Preflight passed. Continue with `pnpm diagnose:live` to inspect the current browser/profile/session state.',
      ];

  return {
    mode: 'shopflow_live_preflight',
    checkedAt: new Date().toISOString(),
    enabled: config.enabled,
    profile: {
      userDataDir: config.userDataDir,
      userDataDirExists: existsSync(config.userDataDir),
      localStatePath,
      localStateExists: existsSync(localStatePath),
      profileDirectory: config.profileDirectory,
      profilePath,
      profilePathExists: existsSync(profilePath),
      profileName: config.profileName,
    },
    chrome: {
      executable: config.chromeExecutable,
      executableExists: existsSync(config.chromeExecutable),
      cdpUrl: config.cdpUrl,
      attachModeRequested: config.attachModeRequested,
    },
    targets: config.targets.map((target) => ({
      id: target.id,
      label: target.label,
      url: target.url,
      captureIds: target.captureIds,
    })),
    debugChrome: {
      listenerCount: processes.filter((processInfo) => processInfo.listening).length,
      processes,
    },
    singletonInstance: {
      recordPath: singletonInstance.recordPath,
      recordExists: Boolean(singletonInstance.record),
      running: singletonInstance.running,
      pid: singletonInstance.record?.pid,
      userDataDir: singletonInstance.record?.userDataDir,
      profileDirectory: singletonInstance.record?.profileDirectory,
      cdpUrl: singletonInstance.record?.cdpUrl,
      matchesRequestedProfile: singletonInstance.matchesRequestedProfile,
    },
    blockers,
    nextActions,
  };
}

export async function buildProbeReport(
  config: ShopflowLiveSessionConfig
): Promise<ShopflowLiveProbeReport> {
  const processList = readChromeProcessList();
  const version = await probeCdpVersion(config.cdpUrl);
  const cdpReachable = version.ok;
  const targetsResponse = cdpReachable ? await probeCdpTargets(config.cdpUrl) : undefined;
  const cdpTargets = Array.isArray(targetsResponse?.parsed)
    ? (targetsResponse?.parsed as Array<{ title?: string; url?: string; type?: string }>)
    : [];
  const observedTabs = buildObservedCdpTabs(cdpTargets);
  const processes = collectChromeDebugProcesses(
    processList,
    readListeningPids(config.cdpPort),
    config.cdpPort
  );
  const singletonInstance = getShopflowLiveSingletonState(config);
  const activeListener = processes.find((processInfo) => processInfo.listening);
  const requestedProfileMatchesActiveListener =
    Boolean(activeListener?.userDataDir) &&
    Boolean(activeListener?.profileDirectory) &&
    activeListener?.userDataDir === config.userDataDir &&
    activeListener?.profileDirectory === config.profileDirectory;
  const resolvedMode: Exclude<ShopflowLiveAttachMode, 'auto'> =
    config.attachModeRequested === 'auto'
      ? cdpReachable
        ? 'browser'
        : 'page'
      : config.attachModeRequested;
  const attachStatus = !cdpReachable && resolvedMode === 'browser'
    ? 'attach_failed'
    : activeListener && !requestedProfileMatchesActiveListener
      ? 'profile_mismatch'
      : cdpReachable
        ? 'attached'
        : 'existing-tabs-only';
  const pageSignals = cdpReachable
    ? await collectPageSignals(config, config.targets)
    : {};

  const rawObservations = config.targets.map((target) => {
    const cdpMatch = findMatchingCdpTarget(target, cdpTargets);
    const finalUrl = cdpMatch?.url;
    const title = cdpMatch?.title ?? '';
    const targetPageSignals = pageSignals[target.id];

    return {
      id: target.id,
      label: target.label,
      requestedUrl: target.url,
      finalUrl,
      title,
      classification: classifyLiveTargetObservation(
        target,
        finalUrl,
        title,
        targetPageSignals
      ),
      source: cdpMatch ? 'cdp-target' : 'not-open',
      captureIds: target.captureIds,
      pageSignals: targetPageSignals,
    } satisfies ShopflowLiveTargetObservation;
  });
  const { observations, safewayAssessment } = buildSafewayAssessment(
    rawObservations
  );

  return {
    mode: 'shopflow_live_probe',
    checkedAt: new Date().toISOString(),
    profile: {
      requestedUserDataDir: config.userDataDir,
      requestedProfileDirectory: config.profileDirectory,
      requestedProfileName: config.profileName,
      requestedProfileMatchesActiveListener,
    },
    attach: {
      requestedMode: config.attachModeRequested,
      resolvedMode,
      cdpReachable,
      attachStatus,
    },
    debugChrome: {
      listenerCount: processes.filter((processInfo) => processInfo.listening).length,
      activeListener,
      processes,
    },
    singletonInstance: {
      recordPath: singletonInstance.recordPath,
      recordExists: Boolean(singletonInstance.record),
      running: singletonInstance.running,
      pid: singletonInstance.record?.pid,
      matchesRequestedProfile: singletonInstance.matchesRequestedProfile,
    },
    cdp: {
      versionOk: cdpReachable,
      targetCount: cdpTargets.length,
      pageTargetCount: cdpTargets.filter((target) => target.type === 'page').length,
      urls: cdpTargets
        .map((target) => target.url)
        .filter((url): url is string => Boolean(url))
        .slice(0, 12),
    },
    sessionHealth: {
      safeway: safewayAssessment.sessionHealth,
    },
    captureTargetState: {
      safeway: safewayAssessment.captureTargetState,
    },
    deepLinkState: {
      safeway: safewayAssessment.deepLinkState,
    },
    observedTabs,
    targets: observations,
  };
}

export function buildDiagnoseReport(
  config: ShopflowLiveSessionConfig,
  preflight: ShopflowLivePreflightReport,
  probe: ShopflowLiveProbeReport
): ShopflowLiveDiagnoseReport {
  const blockers = [...preflight.blockers];
  const commands = {
    diagnose: buildShopflowLiveCommand(config, 'diagnose:live'),
    probe: buildShopflowLiveCommand(config, 'probe:live'),
    openBrowser: buildShopflowLiveCommand(config, 'open:live-browser', {
      SHOPFLOW_LIVE_ATTACH_MODE: 'browser',
    }),
  };

  if (probe.attach.attachStatus === 'attach_failed') {
    blockers.push(`CDP is not reachable at ${config.cdpUrl}.`);
  }
  if (probe.attach.attachStatus === 'profile_mismatch') {
    blockers.push(
      `Active debug listener does not match requested profile ${config.profileDirectory}.`
    );
  }
  if (!probe.singletonInstance.recordExists) {
    blockers.push(
      'No Shopflow singleton browser instance record exists for the requested dedicated browser root.'
    );
  }
  if (probe.singletonInstance.recordExists && !probe.singletonInstance.running) {
    blockers.push(
      'The Shopflow singleton browser instance record exists, but that recorded instance is not currently running or can no longer be re-verified against the current process table.'
    );
  }
  if (probe.targets.some((target) => target.classification === 'login_required')) {
    blockers.push('One or more merchant targets still require a real sign-in step.');
  }
  if (
    probe.captureTargetState.safeway === 'deep_link_unstable' ||
    probe.targets.some((target) => target.classification === 'deep_link_unstable')
  ) {
    blockers.push(
      'Safeway session health looks alive, but one or more Safeway deep-link targets are unstable.'
    );
  }
  if (probe.targets.every((target) => target.classification === 'not_open')) {
    blockers.push('No requested merchant targets are open in the current session.');
  }

  const nextActions: string[] = [];

  if (preflight.blockers.length > 0) {
    nextActions.push(...preflight.nextActions);
  }

  if (probe.attach.attachStatus === 'attach_failed') {
    nextActions.push(
      `Use ${buildShopflowLiveCommand(
        config,
        'open:live-browser',
        {
          SHOPFLOW_LIVE_ATTACH_MODE: 'browser',
        }
      )} to start or refresh the dedicated Shopflow Chrome session, then rerun \`pnpm probe:live\`.`
    );
    nextActions.push(
      'Shopflow no longer inspects arbitrary host Chrome tabs outside the recorded singleton/CDP lane, so a missing listener must be fixed by relaunching or reattaching the dedicated Shopflow browser root.'
    );
  }

  if (probe.attach.attachStatus === 'profile_mismatch') {
    nextActions.push(
      `Align SHOPFLOW_LIVE_USER_DATA_DIR / SHOPFLOW_LIVE_PROFILE_DIRECTORY with the active debug listener, then rerun \`pnpm probe:live\`.`
    );
  }

  if (probe.targets.some((target) => target.classification === 'not_open')) {
    nextActions.push(
      `Use ${buildShopflowLiveCommand(config, 'open:live-browser')} to open the missing merchant targets in the requested profile before retrying the probe.`
    );
  }

  if (!probe.singletonInstance.recordExists || !probe.singletonInstance.running) {
    nextActions.push(
      `Seed or relaunch the dedicated Shopflow browser root, then rerun ${buildShopflowLiveCommand(
        config,
        'open:live-browser',
        {
          SHOPFLOW_LIVE_ATTACH_MODE: 'browser',
        }
      )}.`
    );
  }

  if (probe.targets.some((target) => target.classification === 'login_required')) {
    nextActions.push(
      'Continue the visible merchant sign-in flow in the requested profile, then rerun `pnpm probe:live`.'
    );
  }
  if (probe.captureTargetState.safeway === 'deep_link_unstable') {
    nextActions.push(
      'Safeway looks signed in at the `safeway-home` session-health layer, but the cart/manage deep links are unstable. Continue from the Safeway homepage in the same profile, then navigate back to cart/manage before rerunning `pnpm probe:live`.'
    );
  }

  if (nextActions.length === 0) {
    nextActions.push(
      'Diagnose passed. The next repo-owned move is to collect a live probe artifact and continue toward the reviewed packet outside version control.'
    );
  }

  return {
    mode: 'shopflow_live_diagnose',
    checkedAt: new Date().toISOString(),
    blockers,
    nextActions,
    recommendations: {
      profileAlignment: {
        requestedUserDataDir: config.userDataDir,
        requestedProfileDirectory: config.profileDirectory,
        requestedProfileName: config.profileName,
        activeListenerUserDataDir: probe.debugChrome.activeListener?.userDataDir,
        activeListenerProfileDirectory:
          probe.debugChrome.activeListener?.profileDirectory,
        status:
          probe.attach.attachStatus === 'profile_mismatch'
            ? 'mismatch'
            : probe.profile.requestedProfileMatchesActiveListener
              ? 'matched'
              : 'listener-unreachable',
      },
      commands,
    },
    preflight,
    probe,
  };
}

export function writeLiveJsonArtifact(
  config: ShopflowLiveSessionConfig,
  stem: string,
  payload: unknown
) {
  mkdirSync(config.artifactDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const timestampedPath = resolve(config.artifactDirectory, `${stem}-${timestamp}.json`);
  const latestPath = resolve(config.artifactDirectory, `${stem}-latest.json`);
  const serialized = `${JSON.stringify(payload, null, 2)}\n`;

  writeFileAtomically(timestampedPath, serialized);
  writeFileAtomically(latestPath, serialized);

  return {
    timestampedPath,
    latestPath,
  };
}

function writeNdjsonFile(targetPath: string, records: unknown[]) {
  const contents =
    records.map((record) => JSON.stringify(record)).join('\n') +
    (records.length > 0 ? '\n' : '');
  writeFileAtomically(targetPath, contents);
}

function sanitizeTraceUrl(url: string | undefined) {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

export async function writeLiveTraceBundle(
  config: ShopflowLiveSessionConfig,
  probe: ShopflowLiveProbeReport
): Promise<ShopflowLiveTraceBundle> {
  const timestamp = probe.checkedAt.replace(/[:.]/g, '-');
  const bundleDirectory = resolve(
    config.artifactDirectory,
    'bundles',
    `trace-${timestamp}`
  );
  const screenshotsDirectory = resolve(bundleDirectory, 'screenshots');
  mkdirSync(bundleDirectory, { recursive: true });
  mkdirSync(screenshotsDirectory, { recursive: true });

  const summaryPath = resolve(bundleDirectory, 'summary.json');
  const chromeTabsPath = resolve(bundleDirectory, 'chrome-tabs.json');
  const chromeProcessesPath = resolve(bundleDirectory, 'chrome-processes.json');
  const cdpSummaryPath = resolve(bundleDirectory, 'cdp-summary.json');
  const screenshotManifestPath = resolve(bundleDirectory, 'screenshots.json');
  const consolePath = resolve(bundleDirectory, 'console.ndjson');
  const pageErrorsPath = resolve(bundleDirectory, 'pageerrors.ndjson');
  const requestFailedPath = resolve(bundleDirectory, 'requestfailed.ndjson');
  const networkPath = resolve(bundleDirectory, 'network.ndjson');

  const consoleEvents: Array<Record<string, unknown>> = [];
  const pageErrors: Array<Record<string, unknown>> = [];
  const requestFailed: Array<Record<string, unknown>> = [];
  const networkEvents: Array<Record<string, unknown>> = [];
  const screenshotEntries: ShopflowLiveTraceScreenshotEntry[] = [];
  let traceMode: ShopflowLiveTraceBundle['traceMode'] = 'snapshot-only';
  let pageCount = 0;
  let attachError: string | undefined;

  if (probe.attach.cdpReachable) {
    try {
      traceMode = 'cdp-passive';
      const browser = await chromium.connectOverCDP(config.cdpUrl);
      const contexts = browser.contexts();
      const pages = contexts.flatMap((context) => context.pages());
      pageCount = pages.length;

      for (const page of pages) {
        page.on('console', (message) => {
          consoleEvents.push({
            pageUrl: sanitizeTraceUrl(page.url()),
            type: message.type(),
            text: message.text(),
          });
        });
        page.on('pageerror', (error) => {
          pageErrors.push({
            pageUrl: sanitizeTraceUrl(page.url()),
            message: error.message,
          });
        });
        page.on('requestfailed', (request) => {
          requestFailed.push({
            pageUrl: sanitizeTraceUrl(page.url()),
            url: sanitizeTraceUrl(request.url()),
            method: request.method(),
            resourceType: request.resourceType(),
            failureText: request.failure()?.errorText,
          });
        });
      }

      await new Promise((resolveDelay) => setTimeout(resolveDelay, 750));

      for (const [index, page] of pages.entries()) {
        try {
          const resources = await page.evaluate(() =>
            performance
              .getEntriesByType('resource')
              .map((entry) => {
                const resource = entry as PerformanceResourceTiming;
                return {
                  name: resource.name,
                  initiatorType: resource.initiatorType,
                  duration: resource.duration,
                  transferSize: resource.transferSize,
                  nextHopProtocol: resource.nextHopProtocol,
                };
              })
          );

          networkEvents.push(
            ...resources.map((resource) => ({
              pageUrl: sanitizeTraceUrl(page.url()),
              url: sanitizeTraceUrl(resource.name),
              initiatorType: resource.initiatorType,
              duration: resource.duration,
              transferSize: resource.transferSize,
              nextHopProtocol: resource.nextHopProtocol,
            }))
          );

          const screenshotPath = resolve(
            screenshotsDirectory,
            `page-${index + 1}.png`
          );
          await page.screenshot({
            path: screenshotPath,
            fullPage: false,
          });
          screenshotEntries.push({
            pageUrl: sanitizeTraceUrl(page.url()),
            title: await page.title().catch(() => undefined),
            screenshotLabel: `page-${index + 1}.png`,
            screenshotPath,
          });
        } catch (error) {
          pageErrors.push({
            pageUrl: sanitizeTraceUrl(page.url()),
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }

      await browser.close();
    } catch (error) {
      attachError = error instanceof Error ? error.message : String(error);
      traceMode = 'snapshot-only';
    }
  }

  writeFileAtomically(
    summaryPath,
    `${JSON.stringify(
      {
        checkedAt: probe.checkedAt,
        attach: probe.attach,
        sessionHealth: probe.sessionHealth,
        captureTargetState: probe.captureTargetState,
        deepLinkState: probe.deepLinkState,
        targets: probe.targets,
        traceMode,
        pageCount,
        attachError,
      },
      null,
      2
    )}\n`
  );
  writeFileAtomically(
    chromeTabsPath,
    `${JSON.stringify(probe.observedTabs, null, 2)}\n`
  );
  writeFileAtomically(
    chromeProcessesPath,
    `${JSON.stringify(probe.debugChrome.processes, null, 2)}\n`
  );
  writeFileAtomically(cdpSummaryPath, `${JSON.stringify(probe.cdp, null, 2)}\n`);
  writeFileAtomically(
    screenshotManifestPath,
    `${JSON.stringify(screenshotEntries, null, 2)}\n`
  );
  writeNdjsonFile(consolePath, consoleEvents);
  writeNdjsonFile(pageErrorsPath, pageErrors);
  writeNdjsonFile(requestFailedPath, requestFailed);
  writeNdjsonFile(networkPath, networkEvents);

  return {
    bundleDirectory,
    summaryPath,
    chromeTabsPath,
    chromeProcessesPath,
    cdpSummaryPath,
    screenshotManifestPath,
    consolePath,
    pageErrorsPath,
    requestFailedPath,
    networkPath,
    screenshotsDirectory,
    traceMode,
    pageCount,
    attachError,
  };
}

async function openUrlViaCdp(cdpUrl: string, targetUrl: string) {
  return new Promise<boolean>((resolveOpen) => {
    try {
      const endpoint = new URL(`/json/new?${encodeURIComponent(targetUrl)}`, cdpUrl);
      const request = httpRequest(
        endpoint,
        {
          method: 'PUT',
          timeout: 2000,
        },
        (response) => {
          response.resume();
          resolveOpen(
            typeof response.statusCode === 'number' &&
              response.statusCode >= 200 &&
              response.statusCode < 300
          );
        }
      );
      request.on('error', () => resolveOpen(false));
      request.on('timeout', () => {
        request.destroy(new Error('timeout:/json/new'));
      });
      request.end();
    } catch {
      resolveOpen(false);
    }
  });
}

export async function openUrlsInExistingChrome(
  cdpUrl: string,
  urls: readonly string[],
  openUrl = openUrlViaCdp,
  probeVersion = probeCdpVersion
) {
  if (urls.length === 0) {
    return false;
  }

  const version = await probeVersion(cdpUrl);
  if (!version.ok) {
    return false;
  }

  for (const url of urls) {
    const opened = await openUrl(cdpUrl, url);
    if (!opened) {
      return false;
    }
  }

  return true;
}

async function requestBrowserCloseViaCdp(
  cdpUrl: string,
  probeVersion = probeCdpVersion,
  socketFactory: (url: string) => WebSocket = (url) => new WebSocket(url)
) {
  const version = await probeVersion(cdpUrl);
  const parsed =
    version.ok && version.parsed && typeof version.parsed === 'object'
      ? (version.parsed as { webSocketDebuggerUrl?: string })
      : undefined;
  const websocketUrl = parsed?.webSocketDebuggerUrl;

  if (!version.ok || typeof websocketUrl !== 'string' || websocketUrl.length === 0) {
    return {
      attempted: false,
      succeeded: false,
      error: version.error ?? 'cdp_unreachable',
    } satisfies ShopflowLiveBrowserCloseRequest;
  }

  return new Promise<ShopflowLiveBrowserCloseRequest>((resolveClose) => {
    let settled = false;
    const socket = socketFactory(websocketUrl);
    const timer = setTimeout(
      () =>
        finish({
          attempted: true,
          succeeded: false,
          error: 'browser_close_timeout',
        }),
      1500
    );

    function finish(result: ShopflowLiveBrowserCloseRequest) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        // ignore cleanup failure
      }
      resolveClose(result);
    }

    socket.addEventListener('open', () => {
      try {
        socket.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      } catch {
        finish({
          attempted: true,
          succeeded: false,
          error: 'browser_close_send_failed',
        });
      }
    });
    socket.addEventListener('message', () =>
      finish({ attempted: true, succeeded: true })
    );
    socket.addEventListener('close', () =>
      finish({ attempted: true, succeeded: true })
    );
    socket.addEventListener('error', () =>
      finish({
        attempted: true,
        succeeded: false,
        error: 'browser_close_socket_error',
      })
    );
  });
}

export async function requestBrowserCloseOverCdp(
  cdpUrl: string,
  probeVersion = probeCdpVersion,
  socketFactory: (url: string) => WebSocket = (url) => new WebSocket(url)
) {
  return requestBrowserCloseViaCdp(cdpUrl, probeVersion, socketFactory);
}

export function signalProcess(
  pid: number,
  signal: NodeJS.Signals = 'SIGTERM'
) {
  if (
    !Number.isFinite(pid) ||
    pid <= 0 ||
    (signal !== 'SIGTERM' && signal !== 'SIGKILL')
  ) {
    return false;
  }

  try {
    process.kill(pid, signal);
    return true;
  } catch {
    return false;
  }
}

export async function waitForProcessExit(
  pid: number,
  isRunning = isPidRunning,
  attempts = 10,
  delayMs = 300
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (!isRunning(pid)) {
      return true;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
  }
  return !isRunning(pid);
}

async function waitForPidAndListenerExit(
  pid: number,
  cdpUrl: string,
  timeoutMs = 2000,
  pollMs = 150,
  isRunning = isPidRunning,
  probeVersion = probeCdpVersion
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const pidRunning = isRunning(pid);
    const listenerReachable = (await probeVersion(cdpUrl)).ok;
    if (!pidRunning && !listenerReachable) {
      return true;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, pollMs));
  }

  return !isRunning(pid) && !(await probeVersion(cdpUrl)).ok;
}

export async function closeShopflowLiveBrowser(
  config: ShopflowLiveSessionConfig,
  processList = readChromeProcessList(),
  deps: {
    probeVersion?: typeof probeCdpVersion;
    socketFactory?: (url: string) => WebSocket;
    isRunning?: typeof isPidRunning;
    sendSignal?: (pid: number, signal?: NodeJS.Signals | number) => void;
    processList?: string;
  } = {}
): Promise<ShopflowLiveCloseBrowserReport> {
  const singletonInstance = getShopflowLiveSingletonState(config, processList);
  return executeCloseLiveBrowserRecord(
    config,
    singletonInstance.record,
    singletonInstance.recordPath,
    singletonInstance.running,
    {
      ...deps,
      processList,
    }
  );
}

export async function executeCloseLiveBrowserRecord(
  config: ShopflowLiveSessionConfig,
  record: ShopflowBrowserInstanceRecord | undefined,
  recordPath: string,
  runningBefore: boolean,
  deps: {
    probeVersion?: typeof probeCdpVersion;
    socketFactory?: (url: string) => WebSocket;
    isRunning?: typeof isPidRunning;
    sendSignal?: (pid: number, signal?: NodeJS.Signals | number) => void;
    processList?: string;
  } = {}
): Promise<ShopflowLiveCloseBrowserReport> {
  const probeVersion = deps.probeVersion ?? probeCdpVersion;
  const isRunning = deps.isRunning ?? isPidRunning;
  const processList = deps.processList ?? readChromeProcessList();
  const sendSignal =
    deps.sendSignal ??
    ((pid: number, signal?: NodeJS.Signals | number) => {
      if (
        !Number.isFinite(pid) ||
        pid <= 0 ||
        (signal !== 'SIGTERM' && signal !== 'SIGKILL')
      ) {
        return;
      }
      signalProcess(pid, signal);
    });

  if (!record) {
    return {
      mode: 'shopflow_live_close_browser',
      checkedAt: new Date().toISOString(),
      requestedProfile: {
        userDataDir: config.userDataDir,
        profileDirectory: config.profileDirectory,
        profileName: config.profileName,
        cdpUrl: config.cdpUrl,
      },
      singletonInstance: {
        recordPath,
        recordExists: false,
        runningBefore: false,
        listenerReachableBefore: false,
        listenerReachableAfter: false,
        pidRunningAfter: false,
        strategy: 'no-op',
        forceFallbackUsed: false,
        recordRemoved: false,
      },
      closeAttempt: {
        cdpRequested: false,
        cdpClosed: false,
        sigtermSent: false,
        sigkillSent: false,
        pidExited: true,
        listenerReachableAfterClose: false,
        outcome: 'already_stopped',
      },
      blockers: [],
      nextActions: [
        'No Shopflow singleton record exists, so there is no dedicated live browser instance to close.',
      ],
    };
  }

  const listenerReachableBefore = (await probeVersion(record.cdpUrl)).ok;
  const verifiedProcess = findRecordedChromeProcess(record, processList);
  const recordMatchesRequestedProfile = recordOwnsRequestedProfile(config, record);
  const safeRecordedProcess =
    verifiedProcess && recordMatchesRequestedProfile ? verifiedProcess : undefined;
  let strategy: ShopflowLiveCloseBrowserReport['singletonInstance']['strategy'] = 'no-op';
  let forceFallbackUsed = false;
  let cdpRequested = false;
  let cdpClosed = false;
  let sigtermSent = false;
  let sigkillSent = false;
  let recordRemoved = false;

  if (!runningBefore && !listenerReachableBefore) {
    removeActiveBrowserInstanceRecord(config.artifactDirectory);
    recordRemoved = true;
    strategy = 'stale-record';
  } else if (!safeRecordedProcess) {
    strategy = 'failed';
  } else {
    const closeResult = await requestBrowserCloseViaCdp(
      record.cdpUrl,
      probeVersion,
      deps.socketFactory
    );
    cdpRequested = closeResult.attempted;
    cdpClosed = closeResult.succeeded;
    if (cdpClosed) {
      strategy = 'cdp-browser-close';
    }

    let fullyClosed = runningBefore
      ? await waitForPidAndListenerExit(
          safeRecordedProcess.pid,
          record.cdpUrl,
          2000,
          150,
          isRunning,
          probeVersion
        )
      : !(await probeVersion(record.cdpUrl)).ok;

    if (!fullyClosed && runningBefore) {
      sendSignal(safeRecordedProcess.pid, 'SIGTERM');
      sigtermSent = true;
      strategy = 'sigterm';
      fullyClosed = await waitForPidAndListenerExit(
        safeRecordedProcess.pid,
        record.cdpUrl,
        2000,
        150,
        isRunning,
        probeVersion
      );
    }

    if (!fullyClosed && runningBefore) {
      sendSignal(safeRecordedProcess.pid, 'SIGKILL');
      sigkillSent = true;
      forceFallbackUsed = true;
      strategy = 'sigkill';
      fullyClosed = await waitForPidAndListenerExit(
        safeRecordedProcess.pid,
        record.cdpUrl,
        1500,
        150,
        isRunning,
        probeVersion
      );
    }

    if (fullyClosed) {
      removeActiveBrowserInstanceRecord(config.artifactDirectory);
      recordRemoved = true;
    } else {
      strategy = 'failed';
    }
  }

  const pidRunningAfter = safeRecordedProcess
    ? isRunning(safeRecordedProcess.pid)
    : false;
  const listenerReachableAfter = (await probeVersion(record.cdpUrl)).ok;
  const blockers: string[] = [];
  const nextActions: string[] = [];

  if (!recordRemoved && !safeRecordedProcess) {
    blockers.push(
      'Refusing to close because the recorded singleton can no longer be re-verified as the Shopflow-owned Chrome process for the requested dedicated profile.'
    );
    nextActions.push(
      'Relaunch the dedicated Shopflow browser root with `pnpm open:live-browser` so the repo can record and re-verify a fresh singleton before attempting another close.'
    );
  } else if (!recordRemoved && (pidRunningAfter || listenerReachableAfter)) {
    blockers.push(
      'The Shopflow singleton browser did not close cleanly; the recorded PID or listener is still active.'
    );
    nextActions.push(
      'Inspect the dedicated Shopflow singleton manually, then rerun `pnpm close:live-browser` before attempting another reopen.'
    );
  } else {
    nextActions.push(
      'Shopflow singleton browser closed cleanly. Use `pnpm open:live-browser` to relaunch the dedicated root when needed.'
    );
  }

  return {
    mode: 'shopflow_live_close_browser',
    checkedAt: new Date().toISOString(),
    requestedProfile: {
      userDataDir: config.userDataDir,
      profileDirectory: config.profileDirectory,
      profileName: config.profileName,
      cdpUrl: config.cdpUrl,
    },
    singletonInstance: {
      recordPath,
      recordExists: true,
      pid: record.pid,
      cdpUrl: record.cdpUrl,
      runningBefore,
      listenerReachableBefore,
      listenerReachableAfter,
      pidRunningAfter,
      strategy,
      forceFallbackUsed,
      recordRemoved,
    },
    closeAttempt: {
      cdpRequested,
      cdpClosed,
      sigtermSent,
      sigkillSent,
      pidExited: !pidRunningAfter,
      listenerReachableAfterClose: listenerReachableAfter,
      outcome:
        strategy === 'stale-record' || (recordRemoved && strategy === 'no-op')
          ? 'already_stopped'
          : strategy === 'cdp-browser-close' && recordRemoved
            ? 'closed_via_cdp'
            : strategy === 'sigterm' && recordRemoved
              ? 'terminated'
              : strategy === 'sigkill' && recordRemoved
                ? 'force_killed'
                : 'close_failed',
    },
    blockers,
    nextActions,
  };
}

export async function launchChromeWithRemoteDebugging(
  config: ShopflowLiveSessionConfig
) {
  if (process.env[shopflowDetachedBrowserLaunchEnv] !== '1') {
    throw new Error(
      `Detached Shopflow live browser launch now requires ${shopflowDetachedBrowserLaunchEnv}=1.`
    );
  }

  const startUrls =
    config.targets.length > 0
      ? config.targets.map((target) => target.url)
      : ['https://www.safeway.com/shop/cart'];

  const child = spawn(
    config.chromeExecutable,
    [
      `--remote-debugging-port=${config.cdpPort}`,
      `--user-data-dir=${config.userDataDir}`,
      `--profile-directory=${config.profileDirectory}`,
      ...startUrls,
    ],
    {
      detached: true,
      stdio: 'ignore',
    }
  );
  child.unref();

  return {
    pid: child.pid,
    startUrls,
  };
}

export async function waitForLiveBrowserLaunchVerification(
  config: ShopflowLiveSessionConfig,
  attemptedPid?: number
): Promise<ShopflowLiveLaunchVerification> {
  let listenerReachable = false;
  let observedTargetTabCount = 0;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const version = await probeCdpVersion(config.cdpUrl);
    if (version.ok) {
      listenerReachable = true;
      const targets = await probeCdpTargets(config.cdpUrl);
      const cdpTargets = Array.isArray(targets?.parsed)
        ? (targets.parsed as Array<{ title?: string; url?: string; type?: string }>)
        : [];
      observedTargetTabCount = countObservedTargetTabs(
        config.targets,
        buildObservedCdpTabs(cdpTargets)
      );
      break;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 300));
  }

  const pidStillRunning =
    typeof attemptedPid === 'number' ? isPidRunning(attemptedPid) : undefined;

  return {
    checkedAt: new Date().toISOString(),
    cdpUrl: config.cdpUrl,
    attemptedPid,
    listenerReachable,
    pidStillRunning,
    observedTargetTabCount,
    outcome: classifyLiveBrowserLaunchOutcome({
      listenerReachable,
      pidStillRunning,
      observedTargetTabCount,
    }),
  };
}
