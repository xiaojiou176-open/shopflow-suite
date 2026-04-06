import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  backupExistingShopflowBrowserRoot,
  buildDefaultShopflowBrowserSeedConfig,
  findChromeProcessesUsingUserDataDir,
  findDefaultChromeRootProcesses,
  removeSingletonArtifacts,
  rewriteChromeLocalStateForShopflowProfile,
  rewriteChromeProfilePreferences,
  copySeedProfileIntoTarget,
  writeActiveBrowserInstanceRecord,
} from './browser-profile';
import {
  buildSeedTargetVerification,
  buildPreflightReport,
  buildProbeReport,
  launchChromeWithRemoteDebugging,
  readChromeProcessList,
  resolveShopflowLiveSessionConfig,
  shopflowDetachedBrowserLaunchEnv,
  summarizeLiveTargetClassifications,
  waitForLiveBrowserLaunchVerification,
  writeLiveJsonArtifact,
} from './shared';
import {
  ensureShopflowCacheDirectories,
  resolveShopflowCachePolicy,
} from '../maintenance/cache-policy';
import { writeFileAtomically } from '../shared/write-file-atomically';

type ParsedArgs = {
  sourceUserDataDir?: string;
  sourceProfileDirectory?: string;
  sourceProfileName?: string;
  replaceExistingRoot: boolean;
};

function parseArgs(argv: string[]) {
  const parsed: ParsedArgs = {
    replaceExistingRoot: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === '--replace-existing-root') {
      parsed.replaceExistingRoot = true;
      continue;
    }

    if (!current.startsWith('--') || !next) {
      continue;
    }

    if (current === '--source-user-data-dir') {
      parsed.sourceUserDataDir = next;
      index += 1;
    } else if (current === '--source-profile-directory') {
      parsed.sourceProfileDirectory = next;
      index += 1;
    } else if (current === '--source-profile-name') {
      parsed.sourceProfileName = next;
      index += 1;
    }
  }

  return parsed;
}

function writeJson(targetPath: string, contents: string) {
  writeFileAtomically(targetPath, contents);
}

async function main() {
  const policy = resolveShopflowCachePolicy(process.env);
  ensureShopflowCacheDirectories(policy);

  const parsedArgs = parseArgs(process.argv.slice(2));
  const config = buildDefaultShopflowBrowserSeedConfig(
    process.env,
    policy,
    parsedArgs
  );
  const processList = readChromeProcessList();
  const defaultRootProcesses = findDefaultChromeRootProcesses(
    processList,
    config.sourceUserDataDir
  );
  const targetRootProcesses = findChromeProcessesUsingUserDataDir(
    processList,
    config.targetUserDataDir
  );
  const blockers: string[] = [];
  const nextActions: string[] = [];

  if (defaultRootProcesses.length > 0) {
    blockers.push(
      `Default Chrome root is still active at ${config.sourceUserDataDir}.`
    );
    nextActions.push(
      'Close every real Chrome process still using the default Chrome root, then rerun `pnpm browser:seed-profile`.'
    );
  }

  if (targetRootProcesses.length > 0) {
    blockers.push(
      `Shopflow browser root is already active at ${config.targetUserDataDir}.`
    );
    nextActions.push(
      'Close the running Shopflow browser instance before reseeding the dedicated browser root.'
    );
  }

  const targetRootExists = existsSync(config.targetUserDataDir);
  if (targetRootExists && !parsedArgs.replaceExistingRoot) {
    blockers.push(
      `Dedicated Shopflow browser root already exists at ${config.targetUserDataDir}.`
    );
    nextActions.push(
      'Reuse the existing dedicated root with `pnpm open:live-browser`, `pnpm diagnose:live`, or `pnpm probe:live` instead of reseeding it.'
    );
    nextActions.push(
      'Only rerun `pnpm browser:seed-profile --replace-existing-root` when you intentionally want to replace the current dedicated browser root with a fresh copy.'
    );
  }

  if (blockers.length > 0) {
    const failureReport = {
      mode: 'shopflow_browser_seed_profile',
      checkedAt: new Date().toISOString(),
      source: config,
      replaceExistingRootRequested: parsedArgs.replaceExistingRoot,
      targetRootExists,
      defaultRootProcesses,
      targetRootProcesses,
      blockers,
      nextActions,
    };
    const artifacts = writeLiveJsonArtifact(
      {
        ...resolveShopflowLiveSessionConfig({
          SHOPFLOW_LIVE: '1',
          SHOPFLOW_LIVE_USER_DATA_DIR: config.targetUserDataDir,
          SHOPFLOW_LIVE_PROFILE_DIRECTORY: config.targetProfileDirectory,
          SHOPFLOW_LIVE_PROFILE_NAME: config.targetProfileName,
          SHOPFLOW_LIVE_ATTACH_MODE: 'browser',
          SHOPFLOW_LIVE_TARGETS:
            process.env.SHOPFLOW_LIVE_TARGETS ??
            'safeway-home,safeway-cart,safeway-manage,fred-meyer-coupons,qfc-search,temu-search',
        }),
        artifactDirectory: resolve('.runtime-cache', 'live-browser'),
      },
      'browser-seed',
      failureReport
    );

    process.stdout.write(
      `${JSON.stringify({ ...failureReport, artifacts }, null, 2)}\n`
    );
    process.exit(1);
  }

  const backupPath = backupExistingShopflowBrowserRoot(
    config.targetUserDataDir,
    config.backupDirectoryRoot
  );
  const copiedPaths = copySeedProfileIntoTarget(config);

  const rewrittenLocalState = rewriteChromeLocalStateForShopflowProfile(
    readFileSync(copiedPaths.targetLocalStatePath, 'utf8'),
    config.sourceProfileDirectory,
    config.targetProfileDirectory,
    config.targetProfileName
  );
  writeJson(copiedPaths.targetLocalStatePath, rewrittenLocalState);

  const preferencesPath = join(copiedPaths.targetProfilePath, 'Preferences');
  if (existsSync(preferencesPath)) {
    writeJson(
      preferencesPath,
      rewriteChromeProfilePreferences(
        readFileSync(preferencesPath, 'utf8'),
        config.targetProfileName
      )
    );
  }

  const removedSingletonArtifacts = removeSingletonArtifacts(config.targetUserDataDir);

  const liveConfig = resolveShopflowLiveSessionConfig({
    ...process.env,
    SHOPFLOW_LIVE: '1',
    SHOPFLOW_LIVE_USER_DATA_DIR: config.targetUserDataDir,
    SHOPFLOW_LIVE_PROFILE_DIRECTORY: config.targetProfileDirectory,
    SHOPFLOW_LIVE_PROFILE_NAME: config.targetProfileName,
    SHOPFLOW_LIVE_ATTACH_MODE: 'browser',
    SHOPFLOW_LIVE_TARGETS:
      process.env.SHOPFLOW_LIVE_TARGETS ??
      'safeway-home,safeway-cart,safeway-manage,fred-meyer-coupons,qfc-search,temu-search',
  });

  const previous = process.env[shopflowDetachedBrowserLaunchEnv];
  process.env[shopflowDetachedBrowserLaunchEnv] = '1';
  const launched = await (async () => {
    try {
      return await launchChromeWithRemoteDebugging(liveConfig);
    } finally {
      if (previous === undefined) {
        delete process.env[shopflowDetachedBrowserLaunchEnv];
      } else {
        process.env[shopflowDetachedBrowserLaunchEnv] = previous;
      }
    }
  })();
  const launchVerification = await waitForLiveBrowserLaunchVerification(
    liveConfig,
    launched.pid
  );
  const instanceRecordPath = writeActiveBrowserInstanceRecord(
    liveConfig.artifactDirectory,
    {
      pid: launched.pid,
      userDataDir: liveConfig.userDataDir,
      profileDirectory: liveConfig.profileDirectory,
      profileName: liveConfig.profileName,
      cdpUrl: liveConfig.cdpUrl,
      chromeExecutable: liveConfig.chromeExecutable,
      startedAt: new Date().toISOString(),
      source: 'shopflow-singleton',
    }
  );

  const preflight = await buildPreflightReport(liveConfig);
  const probe = await buildProbeReport(liveConfig);
  const targetClassificationSummary = summarizeLiveTargetClassifications(
    probe.targets
  );
  const seedTargetVerification = buildSeedTargetVerification(
    targetClassificationSummary
  );
  const launchBlockers: string[] = [];
  const launchNextActions: string[] = [];

  if (launchVerification.outcome !== 'listener_ready') {
    launchBlockers.push(
      'The seeded Shopflow browser root launched, but the requested CDP listener did not become reachable.'
    );
    launchNextActions.push(
      'Close the newly launched dedicated Chrome instance, confirm no conflicting Chrome owner is still attached to the dedicated root, then rerun `pnpm browser:seed-profile`.'
    );
  }

  launchBlockers.push(...seedTargetVerification.blockers);
  launchNextActions.push(...seedTargetVerification.nextActions);

  const report = {
    mode: 'shopflow_browser_seed_profile',
    checkedAt: new Date().toISOString(),
    source: {
      userDataDir: config.sourceUserDataDir,
      profileDirectory: config.sourceProfileDirectory,
      profileName: config.sourceProfileName,
    },
    target: {
      userDataDir: config.targetUserDataDir,
      profileDirectory: config.targetProfileDirectory,
      profileName: config.targetProfileName,
    },
    backupPath,
    copiedPaths,
    removedSingletonArtifacts,
    launched,
    launchVerification,
    instanceRecordPath,
    preflight,
    probe,
    targetClassificationSummary,
    seedTargetVerification,
    blockers: launchBlockers,
    nextActions:
      launchNextActions.length > 0
        ? launchNextActions
        : [
            'Seed succeeded. Keep using this dedicated root and attach to the singleton browser instance for all future live work.',
          ],
  };

  const artifacts = writeLiveJsonArtifact(
    liveConfig,
    'browser-seed',
    report
  );

  process.stdout.write(
    `${JSON.stringify({ ...report, artifacts }, null, 2)}\n`
  );

  if (launchBlockers.length > 0) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
