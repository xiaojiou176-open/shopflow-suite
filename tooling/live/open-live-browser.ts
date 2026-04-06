import {
  buildBrowserInstanceBudgetReport,
  buildShopflowLiveCommand,
  getShopflowLiveSingletonState,
  launchChromeWithRemoteDebugging,
  openUrlsInExistingChrome,
  readChromeProcessList,
  resolveShopflowLiveSessionConfig,
  shopflowDetachedBrowserLaunchEnv,
  waitForLiveBrowserLaunchVerification,
  writeLiveJsonArtifact,
} from './shared';
import { writeActiveBrowserInstanceRecord } from './browser-profile';

const config = resolveShopflowLiveSessionConfig(process.env);
const processList = readChromeProcessList();
const browserInstanceBudget = buildBrowserInstanceBudgetReport(
  processList,
  config.userDataDir,
  config.cdpPort
);
const singletonInstance = getShopflowLiveSingletonState(config, processList);

const openedInExistingChrome = singletonInstance.running
  ? await openUrlsInExistingChrome(
      config.cdpUrl,
      config.targets.map((target) => target.url)
    )
  : false;
const blockedByBrowserBudget =
  !openedInExistingChrome && browserInstanceBudget.blockedLaunch;
const launchDetachedShopflowBrowser = async () => {
  const previous = process.env[shopflowDetachedBrowserLaunchEnv];
  process.env[shopflowDetachedBrowserLaunchEnv] = '1';

  try {
    return await launchChromeWithRemoteDebugging(config);
  } finally {
    if (previous === undefined) {
      delete process.env[shopflowDetachedBrowserLaunchEnv];
    } else {
      process.env[shopflowDetachedBrowserLaunchEnv] = previous;
    }
  }
};
const launched = openedInExistingChrome || blockedByBrowserBudget
  ? undefined
  : await launchDetachedShopflowBrowser();
const launchVerification = launched
  ? await waitForLiveBrowserLaunchVerification(config, launched.pid)
  : undefined;

const nextActions = [];

if (blockedByBrowserBudget) {
  nextActions.push(
    `Refusing to launch a new debug browser because ${browserInstanceBudget.browserMainProcessCount} browser main processes are already running. Wait for other workers to release resources first.`
  );
  nextActions.push(buildShopflowLiveCommand(config, 'diagnose:live'));
} else if (openedInExistingChrome) {
  nextActions.push(
    'Reused the existing Shopflow singleton Chrome instance instead of launching a second copy of the same browser root.'
  );
  nextActions.push(
    buildShopflowLiveCommand(config, 'probe:live', {
      SHOPFLOW_LIVE_ATTACH_MODE:
        config.attachModeRequested === 'browser' ? 'browser' : 'auto',
    })
  );
} else if (launchVerification?.outcome === 'listener_ready') {
  nextActions.push(
    buildShopflowLiveCommand(config, 'probe:live', {
      SHOPFLOW_LIVE_ATTACH_MODE: 'browser',
    })
  );
} else if (
  launchVerification?.outcome === 'launch_exited_before_listener' ||
  launchVerification?.outcome === 'listener_unreachable'
) {
  nextActions.push(
    'The remote-debuggable launch did not make the requested CDP listener reachable yet. Close competing Chrome ownership for the requested profile, then retry the browser attach lane.'
  );
  nextActions.push(
    buildShopflowLiveCommand(config, 'diagnose:live', {
      SHOPFLOW_LIVE_ATTACH_MODE: 'browser',
    })
  );
} else {
  nextActions.push('Complete any visible merchant sign-in flow in the requested profile if needed.');
  nextActions.push(
    buildShopflowLiveCommand(config, 'probe:live', {
      SHOPFLOW_LIVE_ATTACH_MODE:
        config.attachModeRequested === 'browser' ? 'browser' : 'auto',
    })
  );
}

const instancePid =
  launched?.pid ??
  singletonInstance.record?.pid ??
  singletonInstance.runningPid;
const instanceRecordPath =
  instancePid && (launched || openedInExistingChrome)
    ? writeActiveBrowserInstanceRecord(config.artifactDirectory, {
        pid: instancePid,
        userDataDir: config.userDataDir,
        profileDirectory: config.profileDirectory,
        profileName: config.profileName,
        cdpUrl: config.cdpUrl,
        remoteDebuggingPort: config.cdpPort,
        chromeExecutable: config.chromeExecutable,
        startedAt: new Date().toISOString(),
        source: 'shopflow-singleton',
      })
    : undefined;

const report = {
  mode: 'shopflow_live_open_browser',
  checkedAt: new Date().toISOString(),
  openedInExistingChrome,
  launched,
  launchVerification,
  singletonInstance: {
    recordPath: singletonInstance.recordPath,
    recordExists: Boolean(singletonInstance.record),
    running: singletonInstance.running,
    matchesRequestedProfile: singletonInstance.matchesRequestedProfile,
    reusedExistingInstance: openedInExistingChrome,
    instanceRecordPath,
  },
  requestedProfile: {
    userDataDir: config.userDataDir,
    profileDirectory: config.profileDirectory,
    profileName: config.profileName,
  },
  browserInstanceBudget,
  nextActions,
};

const artifacts = writeLiveJsonArtifact(config, 'open-live-browser', report);

process.stdout.write(
  `${JSON.stringify(
    {
      ...report,
      artifacts,
    },
    null,
    2
  )}\n`
);
