import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import {
  canonicalShopflowLiveProfileDirectory,
  canonicalShopflowLiveProfileName,
  legacyChromeUserDataDirDefault,
  legacyShopflowLiveProfileDirectory,
  legacyShopflowLiveProfileName,
  resolveShopflowCachePolicy,
  type ShopflowCachePolicy,
} from '../maintenance/cache-policy';
import { writeFileAtomically } from '../shared/write-file-atomically';

export const activeBrowserInstanceArtifactName = 'active-browser-instance.json';

export type ShopflowChromeMainProcess = {
  pid: number;
  command: string;
  userDataDir?: string;
  profileDirectory?: string;
  remoteDebuggingPort?: number;
};

export type ShopflowBrowserInstanceRecord = {
  pid: number;
  userDataDir: string;
  profileDirectory: string;
  profileName: string;
  cdpUrl: string;
  remoteDebuggingPort?: number;
  chromeExecutable: string;
  startedAt: string;
  source: 'shopflow-singleton';
};

export type ShopflowBrowserSeedConfig = {
  sourceUserDataDir: string;
  sourceProfileDirectory: string;
  sourceProfileName: string;
  targetUserDataDir: string;
  targetProfileDirectory: string;
  targetProfileName: string;
  backupDirectoryRoot: string;
};

type SourceOverrides = {
  sourceUserDataDir?: string;
  sourceProfileDirectory?: string;
  sourceProfileName?: string;
};

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

function timestampStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function parseChromeMainProcess(line: string) {
  const match = line.trim().match(/^(\d+)\s+(.*)$/);
  if (!match) {
    return undefined;
  }

  const pid = Number.parseInt(match[1], 10);
  const command = match[2];

  if (!Number.isFinite(pid)) {
    return undefined;
  }

  if (
    !/\/Contents\/MacOS\/(Google Chrome|Chromium|Chrome for Testing)$/i.test(
      chromeExecutableSegment(command)
    )
  ) {
    return undefined;
  }

  return {
    pid,
    command,
    userDataDir: matchArgument(command, '--user-data-dir'),
    profileDirectory: matchArgument(command, '--profile-directory'),
    remoteDebuggingPort: Number.parseInt(
      matchArgument(command, '--remote-debugging-port') ?? '',
      10
    ),
  } satisfies ShopflowChromeMainProcess;
}

export function collectChromeMainProcesses(processList: string) {
  return processList
    .split('\n')
    .map((line) => parseChromeMainProcess(line))
    .filter((processInfo): processInfo is ShopflowChromeMainProcess =>
      Boolean(processInfo)
    );
}

export function findDefaultChromeRootProcesses(
  processList: string,
  defaultUserDataDir: string
) {
  const absoluteDefaultRoot = resolve(defaultUserDataDir);
  return collectChromeMainProcesses(processList).filter((processInfo) => {
    if (!processInfo.userDataDir) {
      return true;
    }
    return resolve(processInfo.userDataDir) === absoluteDefaultRoot;
  });
}

export function findChromeProcessesUsingUserDataDir(
  processList: string,
  userDataDir: string
) {
  const absoluteUserDataDir = resolve(userDataDir);
  return collectChromeMainProcesses(processList).filter((processInfo) => {
    return processInfo.userDataDir
      ? resolve(processInfo.userDataDir) === absoluteUserDataDir
      : false;
  });
}

export function buildActiveBrowserInstanceRecordPath(artifactDirectory: string) {
  return resolve(artifactDirectory, activeBrowserInstanceArtifactName);
}

export function readActiveBrowserInstanceRecord(artifactDirectory: string) {
  const recordPath = buildActiveBrowserInstanceRecordPath(artifactDirectory);
  if (!existsSync(recordPath)) {
    return undefined;
  }

  try {
    return JSON.parse(
      readFileSync(recordPath, 'utf8')
    ) as ShopflowBrowserInstanceRecord;
  } catch {
    return undefined;
  }
}

export function writeActiveBrowserInstanceRecord(
  artifactDirectory: string,
  record: ShopflowBrowserInstanceRecord
) {
  const recordPath = buildActiveBrowserInstanceRecordPath(artifactDirectory);
  writeFileAtomically(recordPath, `${JSON.stringify(record, null, 2)}\n`);
  return recordPath;
}

export function removeActiveBrowserInstanceRecord(artifactDirectory: string) {
  const recordPath = buildActiveBrowserInstanceRecordPath(artifactDirectory);
  rmSync(recordPath, {
    force: true,
  });
}

export function buildDefaultShopflowBrowserSeedConfig(
  env: NodeJS.ProcessEnv = process.env,
  policy: ShopflowCachePolicy = resolveShopflowCachePolicy(),
  overrides: SourceOverrides = {}
): ShopflowBrowserSeedConfig {
  return {
    sourceUserDataDir:
      overrides.sourceUserDataDir ||
      env.SHOPFLOW_BROWSER_SEED_SOURCE_USER_DATA_DIR ||
      resolve(legacyChromeUserDataDirDefault.replace(/^~\//, `${homedir()}/`)),
    sourceProfileDirectory:
      overrides.sourceProfileDirectory ||
      env.SHOPFLOW_BROWSER_SEED_SOURCE_PROFILE_DIRECTORY ||
      legacyShopflowLiveProfileDirectory,
    sourceProfileName:
      overrides.sourceProfileName ||
      env.SHOPFLOW_BROWSER_SEED_SOURCE_PROFILE_NAME ||
      legacyShopflowLiveProfileName,
    targetUserDataDir: policy.browserUserDataDir,
    targetProfileDirectory: canonicalShopflowLiveProfileDirectory,
    targetProfileName: canonicalShopflowLiveProfileName,
    backupDirectoryRoot: policy.browserBackupsDir,
  };
}

export function rewriteChromeLocalStateForShopflowProfile(
  sourceContents: string,
  sourceProfileDirectory: string,
  targetProfileDirectory = canonicalShopflowLiveProfileDirectory,
  targetProfileName = canonicalShopflowLiveProfileName
) {
  const parsed = JSON.parse(sourceContents) as Record<string, unknown>;
  const profileRoot = ((parsed.profile as Record<string, unknown> | undefined) ??=
    {}) as Record<string, unknown>;
  const infoCache = ((profileRoot.info_cache as Record<
    string,
    Record<string, unknown>
  > | undefined) ??= {}) as Record<string, Record<string, unknown>>;
  const sourceEntry = infoCache[sourceProfileDirectory] ?? {};

  profileRoot.info_cache = {
    [targetProfileDirectory]: {
      ...sourceEntry,
      name: targetProfileName,
    },
  };

  if ('last_used' in profileRoot) {
    profileRoot.last_used = targetProfileDirectory;
  }
  if (Array.isArray(profileRoot.last_active_profiles)) {
    profileRoot.last_active_profiles = [targetProfileDirectory];
  }
  if (Array.isArray(profileRoot.profiles_order)) {
    profileRoot.profiles_order = [targetProfileDirectory];
  }

  return `${JSON.stringify(parsed, null, 2)}\n`;
}

export function rewriteChromeProfilePreferences(
  sourceContents: string,
  targetProfileName = canonicalShopflowLiveProfileName
) {
  const parsed = JSON.parse(sourceContents) as Record<string, unknown>;
  const profileRoot = ((parsed.profile as Record<string, unknown> | undefined) ??=
    {}) as Record<string, unknown>;
  profileRoot.name = targetProfileName;
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

export function removeSingletonArtifacts(userDataDir: string) {
  const removed: string[] = [];
  if (!existsSync(userDataDir)) {
    return removed;
  }

  for (const entry of readdirSync(userDataDir, { withFileTypes: true })) {
    if (!entry.name.startsWith('Singleton')) {
      continue;
    }

    const targetPath = join(userDataDir, entry.name);
    rmSync(targetPath, {
      recursive: true,
      force: true,
    });
    removed.push(targetPath);
  }

  return removed.sort();
}

export function backupExistingShopflowBrowserRoot(
  targetUserDataDir: string,
  backupDirectoryRoot: string
) {
  if (!existsSync(targetUserDataDir)) {
    return undefined;
  }

  mkdirSync(backupDirectoryRoot, { recursive: true });
  const backupPath = resolve(
    backupDirectoryRoot,
    timestampStamp(),
    targetUserDataDir.split('/').pop() ?? 'chrome-user-data'
  );
  mkdirSync(resolve(backupPath, '..'), { recursive: true });
  renameSync(targetUserDataDir, backupPath);
  return backupPath;
}

export function copySeedProfileIntoTarget(config: ShopflowBrowserSeedConfig) {
  const sourceLocalStatePath = resolve(config.sourceUserDataDir, 'Local State');
  const sourceProfilePath = resolve(
    config.sourceUserDataDir,
    config.sourceProfileDirectory
  );
  const targetLocalStatePath = resolve(config.targetUserDataDir, 'Local State');
  const targetProfilePath = resolve(
    config.targetUserDataDir,
    config.targetProfileDirectory
  );

  if (!existsSync(sourceLocalStatePath)) {
    throw new Error(`Chrome Local State is missing: ${sourceLocalStatePath}`);
  }
  if (!existsSync(sourceProfilePath)) {
    throw new Error(`Chrome profile directory is missing: ${sourceProfilePath}`);
  }

  mkdirSync(config.targetUserDataDir, { recursive: true });
  cpSync(sourceLocalStatePath, targetLocalStatePath);
  cpSync(sourceProfilePath, targetProfilePath, {
    recursive: true,
  });

  return {
    sourceLocalStatePath,
    sourceProfilePath,
    targetLocalStatePath,
    targetProfilePath,
  };
}
