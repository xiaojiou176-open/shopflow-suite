import { existsSync, lstatSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export const defaultShopflowCacheTtlDays = 3;
export const defaultShopflowCacheMaxBytes = 2_147_483_648;
export const shopflowCacheDirectoryDefault = '~/.cache/shopflow';
export const shopflowPnpmStoreDirectoryName = 'pnpm-store';
export const shopflowPlaywrightBrowserCacheDirectoryName = 'ms-playwright';
export const shopflowWebkitPlaywrightCacheDirectoryName = 'webkit-playwright';
export const shopflowTempCacheDirectoryName = 'tmp';
export const shopflowBrowserDirectoryName = 'browser';
export const shopflowChromeUserDataDirectoryName = 'chrome-user-data';
export const shopflowBrowserBackupsDirectoryName = 'backups';
export const canonicalShopflowLiveProfileDirectory = 'Profile 1';
export const canonicalShopflowLiveProfileName = 'shopflow';
export const legacyChromeUserDataDirDefault =
  '~/Library/Application Support/Google/Chrome';
export const legacyShopflowLiveProfileDirectory = 'Profile 19';
export const legacyShopflowLiveProfileName = 'ShopFlow';

export const externalCacheKeyValues = [
  'pnpm-store',
  'ms-playwright',
  'webkit-playwright',
  'tmp',
] as const;

export type ShopflowExternalCacheKey = (typeof externalCacheKeyValues)[number];

export type ShopflowCachePolicy = {
  cacheRoot: string;
  cacheRootLabel: string;
  ttlDays: number;
  ttlMs: number;
  maxBytes: number;
  pnpmStoreDir: string;
  msPlaywrightDir: string;
  webkitPlaywrightDir: string;
  tempDir: string;
  paths: Record<ShopflowExternalCacheKey, string>;
  browserRoot: string;
  browserRootLabel: string;
  browserUserDataDir: string;
  browserUserDataDirLabel: string;
  browserBackupsDir: string;
  browserBackupsDirLabel: string;
};

export type ShopflowExternalCacheDefinition = {
  key: ShopflowExternalCacheKey;
  path: string;
  label: string;
  retentionPolicy: string;
  notes: string;
};

export type ExternalCacheCleanupAction = {
  path: string;
  key: ShopflowExternalCacheKey;
  cleanupKind: 'ttl' | 'lru';
  reason: string;
  sizeBytes: number;
  lastActivityAt: string;
};

export type ExternalCacheCleanupPlan = {
  generatedAt: string;
  cacheRoot: string;
  apply: boolean;
  totalTrackedSizeBytes: number;
  totalReclaimableSizeBytes: number;
  remainingSizeBytes: number;
  actions: ExternalCacheCleanupAction[];
};

type ResolvePolicyOptions = {
  homeDir?: string;
};

type CleanupPlanOptions = {
  apply?: boolean;
  now?: number;
};

type ExternalCacheUnit = {
  path: string;
  key: ShopflowExternalCacheKey;
  sizeBytes: number;
  activityMs: number;
};

const externalCacheLruPriority: Record<ShopflowExternalCacheKey, number> = {
  tmp: 0,
  'webkit-playwright': 1,
  'ms-playwright': 2,
  'pnpm-store': 3,
};

function expandHomePath(value: string, homeDir: string) {
  if (value === '~') {
    return homeDir;
  }

  if (value.startsWith('~/')) {
    return resolve(homeDir, value.slice(2));
  }

  return resolve(value);
}

function labelHomePath(value: string, homeDir: string) {
  if (value === homeDir) {
    return '~';
  }

  if (value.startsWith(`${homeDir}/`)) {
    return `~/${value.slice(homeDir.length + 1)}`;
  }

  return value;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function listChildren(path: string) {
  return readdirSync(path, {
    withFileTypes: true,
  });
}

function sizeOfPath(path: string): number {
  try {
    if (!existsSync(path)) {
      return 0;
    }

    const stat = lstatSync(path);
    if (!stat.isDirectory()) {
      return stat.size;
    }

    let total = 0;
    const stack = [path];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || !existsSync(current)) {
        continue;
      }

      for (const entry of listChildren(current)) {
        const nextPath = join(current, entry.name);
        try {
          const nextStat = lstatSync(nextPath);
          if (entry.isDirectory()) {
            stack.push(nextPath);
            continue;
          }
          total += nextStat.size;
        } catch {
          continue;
        }
      }
    }

    return total;
  } catch {
    return 0;
  }
}

function activityMsForPath(path: string) {
  try {
    const stat = lstatSync(path);
    return Math.max(stat.atimeMs, stat.mtimeMs);
  } catch {
    return 0;
  }
}

function listImmediateUnits(
  root: string,
  key: ShopflowExternalCacheKey
): ExternalCacheUnit[] {
  if (!existsSync(root)) {
    return [];
  }

  return listChildren(root)
    .map((entry) => resolve(root, entry.name))
    .sort((left, right) => left.localeCompare(right))
    .map((path) => {
      const activityMs = activityMsForPath(path);
      if (activityMs === 0 && !existsSync(path)) {
        return undefined;
      }

      return {
        path,
        key,
        sizeBytes: sizeOfPath(path),
        activityMs,
      };
    })
    .filter((unit): unit is ExternalCacheUnit => unit !== undefined);
}

export function resolveShopflowCachePolicy(
  env: NodeJS.ProcessEnv = process.env,
  options: ResolvePolicyOptions = {}
): ShopflowCachePolicy {
  const homeDir = options.homeDir ?? homedir();
  const cacheRoot = expandHomePath(
    env.SHOPFLOW_CACHE_DIR || join(homeDir, '.cache', 'shopflow'),
    homeDir
  );
  const ttlDays = parsePositiveInteger(
    env.SHOPFLOW_CACHE_TTL_DAYS,
    defaultShopflowCacheTtlDays
  );
  const maxBytes = parsePositiveInteger(
    env.SHOPFLOW_CACHE_MAX_BYTES,
    defaultShopflowCacheMaxBytes
  );

  return {
    cacheRoot,
    cacheRootLabel: labelHomePath(cacheRoot, homeDir),
    ttlDays,
    ttlMs: ttlDays * 24 * 60 * 60 * 1000,
    maxBytes,
    pnpmStoreDir: resolve(cacheRoot, 'pnpm-store'),
    msPlaywrightDir: resolve(cacheRoot, shopflowPlaywrightBrowserCacheDirectoryName),
    webkitPlaywrightDir: resolve(
      cacheRoot,
      shopflowWebkitPlaywrightCacheDirectoryName
    ),
    tempDir: resolve(cacheRoot, shopflowTempCacheDirectoryName),
    paths: {
      'pnpm-store': resolve(cacheRoot, shopflowPnpmStoreDirectoryName),
      'ms-playwright': resolve(
        cacheRoot,
        shopflowPlaywrightBrowserCacheDirectoryName
      ),
      'webkit-playwright': resolve(
        cacheRoot,
        shopflowWebkitPlaywrightCacheDirectoryName
      ),
      tmp: resolve(cacheRoot, shopflowTempCacheDirectoryName),
    },
    browserRoot: resolve(cacheRoot, shopflowBrowserDirectoryName),
    browserRootLabel: `${labelHomePath(cacheRoot, homeDir)}/${shopflowBrowserDirectoryName}`,
    browserUserDataDir: resolve(
      cacheRoot,
      shopflowBrowserDirectoryName,
      shopflowChromeUserDataDirectoryName
    ),
    browserUserDataDirLabel: `${labelHomePath(cacheRoot, homeDir)}/${shopflowBrowserDirectoryName}/${shopflowChromeUserDataDirectoryName}`,
    browserBackupsDir: resolve(
      cacheRoot,
      shopflowBrowserDirectoryName,
      shopflowBrowserBackupsDirectoryName
    ),
    browserBackupsDirLabel: `${labelHomePath(cacheRoot, homeDir)}/${shopflowBrowserDirectoryName}/${shopflowBrowserBackupsDirectoryName}`,
  };
}

export function listShopflowExternalCacheDefinitions(
  policy: ShopflowCachePolicy
): ShopflowExternalCacheDefinition[] {
  return [
    {
      key: 'pnpm-store',
      path: policy.pnpmStoreDir,
      label: `${policy.cacheRootLabel}/pnpm-store`,
      retentionPolicy:
        'Rebuildable dependency download store. TTL/LRU prunes may remove it when stale or oversized.',
      notes:
        'Shopflow-owned pnpm download store namespace. This must not spill into another repo name.',
    },
    {
      key: 'ms-playwright',
      path: policy.msPlaywrightDir,
      label: `${policy.cacheRootLabel}/ms-playwright`,
      retentionPolicy:
        'Rebuildable Playwright browser download cache for Shopflow-owned local runs.',
      notes:
        'Used for Playwright browser binaries when local commands run under Shopflow cache governance.',
    },
    {
      key: 'webkit-playwright',
      path: policy.webkitPlaywrightDir,
      label: `${policy.cacheRootLabel}/webkit-playwright`,
      retentionPolicy:
        'Reserved Shopflow-owned WebKit browser cache namespace. Safe to prune when stale or oversized.',
      notes:
        'Keeps future Shopflow-owned WebKit browser artifacts in the same external cache family instead of machine-wide roots.',
    },
    {
      key: 'tmp',
      path: policy.tempDir,
      label: `${policy.cacheRootLabel}/tmp`,
      retentionPolicy:
        'Disposable temp spillway for Shopflow-owned local commands. Safe to prune aggressively.',
      notes:
        'Used as the governed external temp root for local command execution instead of uncontrolled machine-wide temp sprawl.',
    },
  ];
}

export function ensureShopflowCacheDirectories(policy: ShopflowCachePolicy) {
  mkdirSync(policy.cacheRoot, { recursive: true });
  for (const definition of listShopflowExternalCacheDefinitions(policy)) {
    mkdirSync(definition.path, { recursive: true });
  }
  mkdirSync(policy.browserRoot, { recursive: true });
  mkdirSync(policy.browserBackupsDir, { recursive: true });
}

export function isShopflowExternalCachePath(
  candidatePath: string,
  policy: ShopflowCachePolicy
) {
  return Boolean(classifyShopflowExternalCachePath(policy, candidatePath));
}

export function classifyShopflowExternalCachePath(
  policy: ShopflowCachePolicy,
  candidatePath: string
) {
  const absoluteCandidate = resolve(candidatePath);
  const entry = Object.entries(policy.paths).find(([, path]) => {
    return absoluteCandidate === path || absoluteCandidate.startsWith(`${path}/`);
  });

  return entry?.[0] as ShopflowExternalCacheKey | undefined;
}

export function isShopflowPersistentBrowserPath(
  policy: ShopflowCachePolicy,
  candidatePath: string
) {
  const absoluteCandidate = resolve(candidatePath);
  return (
    absoluteCandidate === policy.browserUserDataDir ||
    absoluteCandidate.startsWith(`${policy.browserUserDataDir}/`) ||
    absoluteCandidate === policy.browserBackupsDir ||
    absoluteCandidate.startsWith(`${policy.browserBackupsDir}/`)
  );
}

export function buildShopflowCacheEnvironment(
  policy: ShopflowCachePolicy,
  env: NodeJS.ProcessEnv = process.env
) {
  return {
    ...env,
    SHOPFLOW_CACHE_DIR: policy.cacheRoot,
    SHOPFLOW_CACHE_TTL_DAYS: String(policy.ttlDays),
    SHOPFLOW_CACHE_MAX_BYTES: String(policy.maxBytes),
    SHOPFLOW_CACHE_PNPM_STORE_DIR: policy.pnpmStoreDir,
    SHOPFLOW_CACHE_MS_PLAYWRIGHT_DIR: policy.msPlaywrightDir,
    SHOPFLOW_CACHE_WEBKIT_PLAYWRIGHT_DIR: policy.webkitPlaywrightDir,
    SHOPFLOW_CACHE_TMP_DIR: policy.tempDir,
    SHOPFLOW_BROWSER_ROOT: policy.browserRoot,
    SHOPFLOW_BROWSER_USER_DATA_DIR: policy.browserUserDataDir,
    SHOPFLOW_BROWSER_BACKUPS_DIR: policy.browserBackupsDir,
    PNPM_STORE_DIR: policy.pnpmStoreDir,
    npm_config_store_dir: policy.pnpmStoreDir,
    PLAYWRIGHT_BROWSERS_PATH: policy.msPlaywrightDir,
    TMPDIR: policy.tempDir,
    TMP: policy.tempDir,
    TEMP: policy.tempDir,
  };
}

export function createExternalCacheCleanupPlan(
  policy: ShopflowCachePolicy,
  options: CleanupPlanOptions = {}
): ExternalCacheCleanupPlan {
  const now = options.now ?? Date.now();
  const definitions = listShopflowExternalCacheDefinitions(policy);
  const units = definitions.flatMap((definition) =>
    listImmediateUnits(definition.path, definition.key)
  );
  const totalTrackedSizeBytes = definitions.reduce(
    (total, definition) => total + sizeOfPath(definition.path),
    0
  );

  const actions: ExternalCacheCleanupAction[] = [];
  const prunedPaths = new Set<string>();
  let remainingSizeBytes = totalTrackedSizeBytes;

  for (const unit of units) {
    if (now - unit.activityMs <= policy.ttlMs) {
      continue;
    }

    prunedPaths.add(unit.path);
    remainingSizeBytes -= unit.sizeBytes;
    actions.push({
      path: unit.path,
      key: unit.key,
      cleanupKind: 'ttl',
      reason: `Prune Shopflow external cache content older than the ${policy.ttlDays}-day TTL.`,
      sizeBytes: unit.sizeBytes,
      lastActivityAt: new Date(unit.activityMs).toISOString(),
    });
  }

  const lruCandidates = units
    .filter((unit) => !prunedPaths.has(unit.path))
    .sort((left, right) => {
      if (left.activityMs !== right.activityMs) {
        return left.activityMs - right.activityMs;
      }
      if (externalCacheLruPriority[left.key] !== externalCacheLruPriority[right.key]) {
        return externalCacheLruPriority[left.key] - externalCacheLruPriority[right.key];
      }
      return left.path.localeCompare(right.path);
    });

  for (const unit of lruCandidates) {
    if (remainingSizeBytes <= policy.maxBytes) {
      break;
    }

    prunedPaths.add(unit.path);
    remainingSizeBytes -= unit.sizeBytes;
    actions.push({
      path: unit.path,
      key: unit.key,
      cleanupKind: 'lru',
      reason: `Prune the least-recently-active Shopflow external cache content until total size falls below ${policy.maxBytes} bytes.`,
      sizeBytes: unit.sizeBytes,
      lastActivityAt: new Date(unit.activityMs).toISOString(),
    });
  }

  return {
    generatedAt: new Date(now).toISOString(),
    cacheRoot: policy.cacheRoot,
    apply: options.apply ?? false,
    totalTrackedSizeBytes,
    totalReclaimableSizeBytes: actions.reduce(
      (total, action) => total + action.sizeBytes,
      0
    ),
    remainingSizeBytes,
    actions,
  };
}

export function createShopflowExternalCacheCleanupActions(
  policy: ShopflowCachePolicy,
  now = Date.now()
) {
  return createExternalCacheCleanupPlan(policy, { now }).actions;
}

export function applyExternalCacheCleanupPlan(plan: ExternalCacheCleanupPlan) {
  const applied: ExternalCacheCleanupAction[] = [];
  for (const action of plan.actions) {
    rmSync(action.path, {
      recursive: true,
      force: true,
    });
    applied.push(action);
  }

  return applied;
}

export function applyShopflowExternalCacheCleanupActions(
  policy: ShopflowCachePolicy,
  actions: ExternalCacheCleanupAction[]
) {
  return applyExternalCacheCleanupPlan({
    generatedAt: new Date().toISOString(),
    cacheRoot: policy.cacheRoot,
    apply: true,
    totalTrackedSizeBytes: actions.reduce(
      (total, action) => total + action.sizeBytes,
      0
    ),
    totalReclaimableSizeBytes: actions.reduce(
      (total, action) => total + action.sizeBytes,
      0
    ),
    remainingSizeBytes: 0,
    actions,
  });
}

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  const units = ['KiB', 'MiB', 'GiB', 'TiB'];
  let value = sizeBytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

export function formatExternalCacheCleanupPlan(plan: ExternalCacheCleanupPlan) {
  const lines = [
    'Shopflow external cache cleanup plan',
    `Generated at: ${plan.generatedAt}`,
    `Apply mode: ${plan.apply ? 'yes' : 'no (dry-run)'}`,
    `Cache root: ${plan.cacheRoot}`,
    `Tracked size: ${plan.totalTrackedSizeBytes} (${formatBytes(plan.totalTrackedSizeBytes)})`,
    `Reclaimable size: ${plan.totalReclaimableSizeBytes} (${formatBytes(plan.totalReclaimableSizeBytes)})`,
    `Remaining size after plan: ${plan.remainingSizeBytes} (${formatBytes(plan.remainingSizeBytes)})`,
    `Planned removals: ${plan.actions.length}`,
  ];

  if (plan.actions.length === 0) {
    lines.push('No Shopflow-owned external cache entries need pruning right now.');
    return `${lines.join('\n')}\n`;
  }

  lines.push('');
  for (const action of plan.actions) {
    lines.push(
      `- [${action.key}] ${action.path}`,
      `  cleanupKind: ${action.cleanupKind}`,
      `  sizeBytes: ${action.sizeBytes} (${formatBytes(action.sizeBytes)})`,
      `  lastActivityAt: ${action.lastActivityAt}`,
      `  reason: ${action.reason}`
    );
  }

  return `${lines.join('\n')}\n`;
}
