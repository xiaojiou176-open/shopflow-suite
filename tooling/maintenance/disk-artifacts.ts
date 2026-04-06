import {
  existsSync,
  lstatSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  isShopflowPersistentBrowserPath,
  classifyShopflowExternalCachePath,
  createShopflowExternalCacheCleanupActions,
  resolveShopflowCachePolicy,
  shopflowChromeUserDataDirectoryName,
  shopflowPlaywrightBrowserCacheDirectoryName,
  shopflowPnpmStoreDirectoryName,
  shopflowTempCacheDirectoryName,
  shopflowWebkitPlaywrightCacheDirectoryName,
  type ShopflowCachePolicy,
} from './cache-policy';

export const artifactCategoryValues = [
  'release-artifacts',
  'live-browser',
  'builder',
  'cli',
  'coverage',
  'temp',
  'logs',
  'build-output',
  'wxt-cache',
  'browser-state',
  'external-cache',
  'dependencies',
] as const;

export type ArtifactCategory = (typeof artifactCategoryValues)[number];

export const cleanupModeValues = [
  'runtime-cache',
  'build-output',
  'release-artifacts',
  'external-cache',
] as const;

export type CleanupMode = (typeof cleanupModeValues)[number];

export type DiskArtifactAuditEntry = {
  path: string;
  category: ArtifactCategory;
  exists: boolean;
  sizeBytes: number;
  retentionPolicy: string;
  recommendedAction: string;
  repoOwned: boolean;
  notes: string;
};

export type OutOfScopeArtifactEntry = {
  path: string;
  repoOwned: false;
  notes: string;
};

export type DiskFootprintReport = {
  generatedAt: string;
  repoRoot: string;
  totalTrackedSizeBytes: number;
  entries: DiskArtifactAuditEntry[];
  outOfScopePaths: OutOfScopeArtifactEntry[];
};

export type CleanupAction = {
  path: string;
  category: ArtifactCategory;
  reason: string;
  sizeBytes: number;
};

export type CleanupPlan = {
  generatedAt: string;
  repoRoot: string;
  mode: CleanupMode;
  apply: boolean;
  totalSizeBytes: number;
  actions: CleanupAction[];
};

type ArtifactDefinition = {
  path: string;
  category: ArtifactCategory;
  retentionPolicy: string;
  recommendedAction: string;
  notes: string;
  resolveTargets: (repoRoot: string) => string[];
};

type BuildReportOptions = {
  generatedAt?: string;
  pnpmStorePath?: string;
  cachePolicy?: ShopflowCachePolicy;
};

type CleanupPlanOptions = {
  apply?: boolean;
  now?: number;
  cachePolicy?: ShopflowCachePolicy;
};

type PathOwnership = {
  repoOwned: boolean;
  notes: string;
};

const liveBrowserTraceKeepCount = 5;
const liveBrowserTimestampedJsonMaxAgeMs = 7 * 24 * 60 * 60 * 1000;

function resolveAppDirectories(repoRoot: string) {
  const appsRoot = resolve(repoRoot, 'apps');
  if (!existsSync(appsRoot)) {
    return [];
  }

  return readdirSync(appsRoot, {
    withFileTypes: true,
  })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function literalTargets(repoRoot: string, relativePath: string) {
  return [resolve(repoRoot, relativePath)];
}

function appScopedTargets(repoRoot: string, suffix: string) {
  return resolveAppDirectories(repoRoot).map((appId) =>
    resolve(repoRoot, 'apps', appId, suffix)
  );
}

function runtimeCacheRootLogTargets(repoRoot: string) {
  const runtimeCacheRoot = resolve(repoRoot, '.runtime-cache');
  if (!existsSync(runtimeCacheRoot)) {
    return [];
  }

  return readdirSync(runtimeCacheRoot, {
    withFileTypes: true,
  })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.log'))
    .map((entry) => resolve(runtimeCacheRoot, entry.name))
    .sort();
}

function artifactDefinitions(
  cachePolicy: ShopflowCachePolicy = resolveShopflowCachePolicy()
): ArtifactDefinition[] {
  return [
    {
      path: '.runtime-cache/release-artifacts',
      category: 'release-artifacts',
      retentionPolicy:
        'Keep until reviewer handoff is complete; delete only with explicit release-artifacts cleanup.',
      recommendedAction:
        'Run `pnpm cleanup:release-artifacts --apply` only after review bundles are no longer needed.',
      notes:
        'Repo-owned release bundles and submission-readiness summaries; do not mix with machine-wide caches.',
      resolveTargets: (root) => literalTargets(root, '.runtime-cache/release-artifacts'),
    },
    {
      path: '.runtime-cache/live-browser',
      category: 'live-browser',
      retentionPolicy:
        'Keep all `*-latest.json`, keep the newest 5 trace bundles, and keep timestamped JSON younger than 7 days.',
      recommendedAction:
        'Run `pnpm cleanup:runtime-cache --apply` to prune older live-browser breadcrumbs without deleting the current alias files.',
      notes:
        'Repo-local operator trace breadcrumbs for live-browser diagnosis; not the reviewed live evidence bundle.',
      resolveTargets: (root) => literalTargets(root, '.runtime-cache/live-browser'),
    },
    {
      path: `${cachePolicy.browserRootLabel}/${shopflowChromeUserDataDirectoryName}`,
      category: 'browser-state',
      retentionPolicy:
        'Persistent browser state. Keep until an explicit browser reset/reseed command says otherwise.',
      recommendedAction:
        'Do not delete this through `pnpm cleanup:external-cache`; only reset it with a dedicated browser-root command.',
      notes:
        'Shopflow-owned dedicated Chrome user-data root for live/dev/browser work. This is durable state, not disposable cache.',
      resolveTargets: () => [cachePolicy.browserUserDataDir],
    },
    {
      path: `${cachePolicy.cacheRootLabel}/${shopflowPnpmStoreDirectoryName}`,
      category: 'external-cache',
      retentionPolicy:
        'Shopflow-owned external cache. Prune stale or oversized entries automatically before cache-producing local commands.',
      recommendedAction:
        'Run `pnpm cleanup:external-cache --apply` to clear Shopflow-owned external caches under ~/.cache/shopflow.',
      notes:
        'Canonical Shopflow pnpm store path. It must not drift into another repo namespace.',
      resolveTargets: () => [cachePolicy.paths['pnpm-store']],
    },
    {
      path: `${cachePolicy.cacheRootLabel}/${shopflowPlaywrightBrowserCacheDirectoryName}`,
      category: 'external-cache',
      retentionPolicy:
        'Shopflow-owned external browser cache. Prune stale or oversized entries automatically before cache-producing local commands.',
      recommendedAction:
        'Run `pnpm cleanup:external-cache --apply` to clear Shopflow-owned external caches under ~/.cache/shopflow.',
      notes:
        'Canonical Playwright browser cache root for local Shopflow automation.',
      resolveTargets: () => [cachePolicy.paths['ms-playwright']],
    },
    {
      path: `${cachePolicy.cacheRootLabel}/${shopflowWebkitPlaywrightCacheDirectoryName}`,
      category: 'external-cache',
      retentionPolicy:
        'Reserved Shopflow-owned external browser cache root for future WebKit helpers.',
      recommendedAction:
        'Run `pnpm cleanup:external-cache --apply` to clear Shopflow-owned external caches under ~/.cache/shopflow.',
      notes:
        'Canonical future WebKit cache root. Keeping the path explicit prevents drift back to machine-wide caches.',
      resolveTargets: () => [cachePolicy.paths['webkit-playwright']],
    },
    {
      path: `${cachePolicy.cacheRootLabel}/${shopflowTempCacheDirectoryName}`,
      category: 'external-cache',
      retentionPolicy:
        'Disposable Shopflow-owned external temp cache. Prune stale or oversized entries automatically before cache-producing local commands.',
      recommendedAction:
        'Run `pnpm cleanup:external-cache --apply` to clear Shopflow-owned external caches under ~/.cache/shopflow.',
      notes:
        'Canonical external tmp root for Shopflow-owned local tooling residues.',
      resolveTargets: () => [cachePolicy.paths.tmp],
    },
    {
      path: '.runtime-cache/builder',
      category: 'builder',
      retentionPolicy: 'Rebuild on demand.',
      recommendedAction:
        'Safe to clear with `pnpm cleanup:runtime-cache --apply` when builder payloads are stale or bulky.',
      notes:
        'Generated builder read-model payloads and outcome bundles that can be regenerated from repo truth.',
      resolveTargets: (root) => literalTargets(root, '.runtime-cache/builder'),
    },
    {
      path: '.runtime-cache/cli',
      category: 'cli',
      retentionPolicy: 'Rebuild on demand.',
      recommendedAction:
        'Safe to clear with `pnpm cleanup:runtime-cache --apply` when repo-local CLI payloads are stale.',
      notes:
        'Repo-local read-only CLI payloads; these are convenience outputs, not public CLI state.',
      resolveTargets: (root) => literalTargets(root, '.runtime-cache/cli'),
    },
    {
      path: '.runtime-cache/coverage',
      category: 'coverage',
      retentionPolicy: 'Disposable after local verification.',
      recommendedAction:
        'Safe to clear with `pnpm cleanup:runtime-cache --apply` or the next `pnpm verify:coverage` run.',
      notes:
        'Coverage summaries produced by repo verification.',
      resolveTargets: (root) => literalTargets(root, '.runtime-cache/coverage'),
    },
    {
      path: '.runtime-cache/temp',
      category: 'temp',
      retentionPolicy: 'Disposable after the active local run ends.',
      recommendedAction:
        'Safe to clear with `pnpm cleanup:runtime-cache --apply`.',
      notes:
        'Ad hoc repo-local temp directory for maintenance flows.',
      resolveTargets: (root) => literalTargets(root, '.runtime-cache/temp'),
    },
    {
      path: '.runtime-cache/e2e-browser',
      category: 'temp',
      retentionPolicy:
        'Disposable after E2E completes; interrupted runs may leave residue for later cleanup.',
      recommendedAction:
        'Safe to clear with `pnpm cleanup:runtime-cache --apply`.',
      notes:
        'Repo-local Chromium user-data-dir root for extension smoke tests.',
      resolveTargets: (root) => literalTargets(root, '.runtime-cache/e2e-browser'),
    },
    {
      path: '.runtime-cache/*.log',
      category: 'logs',
      retentionPolicy: 'Keep only the current debugging window.',
      recommendedAction:
        'Safe to clear with `pnpm cleanup:runtime-cache --apply` once the current operator debugging session ends.',
      notes:
        'Repo-local verification and operator logs stored at the runtime-cache root.',
      resolveTargets: runtimeCacheRootLogTargets,
    },
    {
      path: 'apps/*/.output',
      category: 'build-output',
      retentionPolicy: 'Disposable after packaging or smoke verification.',
      recommendedAction:
        'Safe to clear with `pnpm cleanup:build-output --apply`.',
      notes:
        'Built extension directories and packaged zip outputs for each app.',
      resolveTargets: (root) => appScopedTargets(root, '.output'),
    },
    {
      path: 'apps/*/.wxt',
      category: 'wxt-cache',
      retentionPolicy: 'Disposable after build completion.',
      recommendedAction:
        'Safe to clear with `pnpm cleanup:build-output --apply`.',
      notes:
        'WXT build cache for per-app extension builds.',
      resolveTargets: (root) => appScopedTargets(root, '.wxt'),
    },
    {
      path: 'coverage',
      category: 'coverage',
      retentionPolicy: 'Disposable after local verification.',
      recommendedAction:
        'Safe to clear with `pnpm cleanup:build-output --apply`.',
      notes:
        'Root coverage output when generated outside `.runtime-cache/coverage`.',
      resolveTargets: (root) => literalTargets(root, 'coverage'),
    },
    {
      path: 'test-results',
      category: 'build-output',
      retentionPolicy: 'Disposable after local verification.',
      recommendedAction:
        'Safe to clear with `pnpm cleanup:build-output --apply`.',
      notes:
        'Playwright and test runner output directories.',
      resolveTargets: (root) => literalTargets(root, 'test-results'),
    },
    {
      path: 'playwright-report',
      category: 'build-output',
      retentionPolicy: 'Disposable after local verification.',
      recommendedAction:
        'Safe to clear with `pnpm cleanup:build-output --apply`.',
      notes:
        'Playwright HTML report output.',
      resolveTargets: (root) => literalTargets(root, 'playwright-report'),
    },
    {
      path: 'node_modules',
      category: 'dependencies',
      retentionPolicy:
        'Keep as repo-local dependency truth; rebuild only through `pnpm install` when intentionally resetting dependencies.',
      recommendedAction:
        'Do not treat as machine-wide residue; keep repo-local and remove only as an intentional dependency reset.',
      notes:
        'Repo-local dependency tree. Shared pnpm download cache remains out-of-scope.',
      resolveTargets: (root) => literalTargets(root, 'node_modules'),
    },
  ];
}

function formatRelativePath(repoRoot: string, absolutePath: string) {
  const rel = relative(repoRoot, absolutePath);
  if (rel === '') {
    return '.';
  }

  if (rel === '..' || rel.startsWith(`..${sep}`)) {
    return absolutePath;
  }

  return rel.split(sep).join('/');
}

function pathEqualsOrWithin(candidate: string, parent: string) {
  return candidate === parent || candidate.startsWith(`${parent}${sep}`);
}

function listChildren(path: string) {
  return readdirSync(path, {
    withFileTypes: true,
  });
}

function sizeOfPath(path: string): number {
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
    if (!current) {
      continue;
    }

    for (const entry of listChildren(current)) {
      const nextPath = join(current, entry.name);
      const nextStat = lstatSync(nextPath);
      if (entry.isDirectory()) {
        stack.push(nextPath);
        continue;
      }
      total += nextStat.size;
    }
  }

  return total;
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

export function resolvePnpmStorePath(cwd = process.cwd()) {
  try {
    const storePath = execFileSync('pnpm', ['store', 'path'], {
      cwd,
      encoding: 'utf8',
    }).trim();
    return storePath || undefined;
  } catch {
    return undefined;
  }
}

export function classifyDiskPath(
  repoRoot: string,
  candidatePath: string,
  options: { pnpmStorePath?: string; cachePolicy?: ShopflowCachePolicy } = {}
): PathOwnership {
  const absoluteRepoRoot = resolve(repoRoot);
  const absoluteCandidate = resolve(candidatePath);
  const homeRoot = homedir();
  const serenaRoot = resolve(absoluteRepoRoot, '.serena');
  const dockerRoot = resolve(homeRoot, 'Library', 'Containers', 'com.docker.docker');
  const libraryRoot = resolve(homeRoot, 'Library');
  const sharedCacheRoot = resolve(homeRoot, '.cache');
  const cachePolicy = options.cachePolicy ?? resolveShopflowCachePolicy();

  if (isShopflowPersistentBrowserPath(cachePolicy, absoluteCandidate)) {
    return {
      repoOwned: false,
      notes:
        'Shopflow dedicated browser root is persistent state and out-of-scope for generic cleanup. Use an explicit browser reset/reseed command instead.',
    };
  }

  const shopflowExternalKind = classifyShopflowExternalCachePath(
    cachePolicy,
    absoluteCandidate
  );
  const pnpmStorePath = options.pnpmStorePath
    ? resolve(options.pnpmStorePath)
    : undefined;

  if (shopflowExternalKind) {
    return {
      repoOwned: true,
      notes: `Shopflow-owned external ${shopflowExternalKind} cache path.`,
    };
  }

  if (pathEqualsOrWithin(absoluteCandidate, serenaRoot)) {
    return {
      repoOwned: false,
      notes:
        'Serena MCP workspace state under .serena is tool-local and out-of-scope for Shopflow cache governance.',
    };
  }

  if (pnpmStorePath && pathEqualsOrWithin(absoluteCandidate, pnpmStorePath)) {
    return {
      repoOwned: false,
      notes:
        'Shared pnpm download cache is machine-wide and out-of-scope for Shopflow repo-native cleanup.',
    };
  }

  if (
    absoluteCandidate === '/private/var/folders' ||
    pathEqualsOrWithin(absoluteCandidate, '/private/var/folders')
  ) {
    return {
      repoOwned: false,
      notes:
        'Darwin temp trees under /private/var/folders are machine-wide and out-of-scope for Shopflow repo-native cleanup.',
    };
  }

  if (pathEqualsOrWithin(absoluteCandidate, dockerRoot)) {
    return {
      repoOwned: false,
      notes:
        'Docker data roots are machine-wide and out-of-scope for Shopflow repo-native cleanup.',
    };
  }

  if (pathEqualsOrWithin(absoluteCandidate, sharedCacheRoot)) {
    return {
      repoOwned: false,
      notes:
        'Shared cache paths under ~/.cache are machine-wide and out-of-scope for Shopflow repo-native cleanup.',
    };
  }

  if (pathEqualsOrWithin(absoluteCandidate, libraryRoot)) {
    return {
      repoOwned: false,
      notes:
        'Paths under ~/Library are machine-wide and out-of-scope for Shopflow repo-native cleanup.',
    };
  }

  if (!pathEqualsOrWithin(absoluteCandidate, absoluteRepoRoot)) {
    return {
      repoOwned: false,
      notes:
        'Only repo-root descendants are eligible for Shopflow repo-native cleanup.',
    };
  }

  return {
    repoOwned: true,
    notes: 'Repo-local artifact path.',
  };
}

export function buildDiskFootprintReport(
  repoRoot: string,
  options: BuildReportOptions = {}
): DiskFootprintReport {
  const absoluteRepoRoot = resolve(repoRoot);
  const cachePolicy = options.cachePolicy ?? resolveShopflowCachePolicy();
  const definitions = artifactDefinitions(cachePolicy);
  const entries = definitions.map((definition) => {
    const targets = definition.resolveTargets(absoluteRepoRoot);
    const existingTargets = targets.filter((target) => existsSync(target));
    const sizeBytes = existingTargets.reduce(
      (total, target) => total + sizeOfPath(target),
      0
    );

    return {
      path: definition.path,
      category: definition.category,
      exists: existingTargets.length > 0,
      sizeBytes,
      retentionPolicy: definition.retentionPolicy,
      recommendedAction: definition.recommendedAction,
      repoOwned: true,
      notes: definition.notes,
    } satisfies DiskArtifactAuditEntry;
  });

  const outOfScopePaths: OutOfScopeArtifactEntry[] = [];
  const pnpmStorePath =
    options.pnpmStorePath ?? resolvePnpmStorePath(absoluteRepoRoot);

  if (pnpmStorePath) {
    const ownership = classifyDiskPath(absoluteRepoRoot, pnpmStorePath, {
      pnpmStorePath,
      cachePolicy,
    });
    if (!ownership.repoOwned) {
      outOfScopePaths.push({
        path: pnpmStorePath,
        repoOwned: false,
        notes: ownership.notes,
      });
    }
  }

  const totalTrackedSizeBytes = entries.reduce(
    (total, entry) => total + entry.sizeBytes,
    0
  );

  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    repoRoot: absoluteRepoRoot,
    totalTrackedSizeBytes,
    entries,
    outOfScopePaths,
  };
}

function listRuntimeCacheRootLogActions(repoRoot: string): CleanupAction[] {
  return runtimeCacheRootLogTargets(repoRoot).map((path) => ({
    path,
    category: 'logs',
    reason: 'Remove repo-local runtime-cache root log.',
    sizeBytes: sizeOfPath(path),
  }));
}

function listLiveBrowserJsonCleanupActions(repoRoot: string, now: number) {
  const liveBrowserRoot = resolve(repoRoot, '.runtime-cache/live-browser');
  if (!existsSync(liveBrowserRoot)) {
    return [];
  }

  return listChildren(liveBrowserRoot)
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith('.json') &&
        !entry.name.endsWith('-latest.json')
    )
    .map((entry) => resolve(liveBrowserRoot, entry.name))
    .filter((path) => now - statSync(path).mtimeMs > liveBrowserTimestampedJsonMaxAgeMs)
    .sort()
    .map((path) => ({
      path,
      category: 'live-browser' as const,
      reason:
        'Prune timestamped live-browser JSON older than the 7-day retention window.',
      sizeBytes: sizeOfPath(path),
    }));
}

function listLiveBrowserBundleCleanupActions(repoRoot: string) {
  const bundlesRoot = resolve(repoRoot, '.runtime-cache/live-browser/bundles');
  if (!existsSync(bundlesRoot)) {
    return [];
  }

  return listChildren(bundlesRoot)
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('trace-'))
    .map((entry) => resolve(bundlesRoot, entry.name))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)
    .slice(liveBrowserTraceKeepCount)
    .map((path) => ({
      path,
      category: 'live-browser' as const,
      reason: `Prune live-browser trace bundles older than the newest ${liveBrowserTraceKeepCount}.`,
      sizeBytes: sizeOfPath(path),
    }));
}

function cleanupPlanForRuntimeCache(repoRoot: string, now: number) {
  const rootTargets = [
    {
      path: resolve(repoRoot, '.runtime-cache/coverage'),
      category: 'coverage' as const,
      reason: 'Remove repo-local coverage output under .runtime-cache.',
    },
    {
      path: resolve(repoRoot, '.runtime-cache/temp'),
      category: 'temp' as const,
      reason: 'Remove repo-local maintenance temp files.',
    },
    {
      path: resolve(repoRoot, '.runtime-cache/builder'),
      category: 'builder' as const,
      reason: 'Remove generated builder payloads that can be rebuilt on demand.',
    },
    {
      path: resolve(repoRoot, '.runtime-cache/cli'),
      category: 'cli' as const,
      reason: 'Remove repo-local read-only CLI payloads that can be rebuilt on demand.',
    },
    {
      path: resolve(repoRoot, '.runtime-cache/e2e-browser'),
      category: 'temp' as const,
      reason: 'Remove repo-local E2E Chromium profile residues.',
    },
  ]
    .filter((entry) => existsSync(entry.path))
    .map((entry) => ({
      ...entry,
      sizeBytes: sizeOfPath(entry.path),
    }));

  return [
    ...rootTargets,
    ...listRuntimeCacheRootLogActions(repoRoot),
    ...listLiveBrowserBundleCleanupActions(repoRoot),
    ...listLiveBrowserJsonCleanupActions(repoRoot, now),
  ].sort((left, right) => left.path.localeCompare(right.path));
}

function cleanupPlanForBuildOutput(repoRoot: string) {
  const appActions = resolveAppDirectories(repoRoot).flatMap((appId) => {
    const targets = [
      {
        path: resolve(repoRoot, 'apps', appId, '.output'),
        category: 'build-output' as const,
        reason: `Remove built extension output for ${appId}.`,
      },
      {
        path: resolve(repoRoot, 'apps', appId, '.wxt'),
        category: 'wxt-cache' as const,
        reason: `Remove WXT cache for ${appId}.`,
      },
    ];

    return targets
      .filter((entry) => existsSync(entry.path))
      .map((entry) => ({
        ...entry,
        sizeBytes: sizeOfPath(entry.path),
      }));
  });

  const rootActions = [
    {
      path: resolve(repoRoot, 'coverage'),
      category: 'coverage' as const,
      reason: 'Remove root coverage output.',
    },
    {
      path: resolve(repoRoot, 'test-results'),
      category: 'build-output' as const,
      reason: 'Remove root test-results output.',
    },
    {
      path: resolve(repoRoot, 'playwright-report'),
      category: 'build-output' as const,
      reason: 'Remove Playwright HTML report output.',
    },
  ]
    .filter((entry) => existsSync(entry.path))
    .map((entry) => ({
      ...entry,
      sizeBytes: sizeOfPath(entry.path),
    }));

  return [...appActions, ...rootActions].sort((left, right) =>
    left.path.localeCompare(right.path)
  );
}

function cleanupPlanForReleaseArtifacts(repoRoot: string) {
  const releaseArtifactsRoot = resolve(repoRoot, '.runtime-cache/release-artifacts');
  if (!existsSync(releaseArtifactsRoot)) {
    return [];
  }

  return [
    {
      path: releaseArtifactsRoot,
      category: 'release-artifacts' as const,
      reason:
        'Remove staged review bundles and submission-readiness outputs after reviewer handoff is no longer needed.',
      sizeBytes: sizeOfPath(releaseArtifactsRoot),
    },
  ];
}

function cleanupPlanForExternalCache(cachePolicy: ShopflowCachePolicy, now: number) {
  return createShopflowExternalCacheCleanupActions(cachePolicy, now).map(
    (action) => ({
      path: action.path,
      category: 'external-cache' as const,
      reason: action.reason,
      sizeBytes: action.sizeBytes,
    })
  );
}

export function createCleanupPlan(
  repoRoot: string,
  mode: CleanupMode,
  options: CleanupPlanOptions = {}
): CleanupPlan {
  const absoluteRepoRoot = resolve(repoRoot);
  const now = options.now ?? Date.now();
  const cachePolicy = options.cachePolicy ?? resolveShopflowCachePolicy();
  const actions =
    mode === 'runtime-cache'
      ? cleanupPlanForRuntimeCache(absoluteRepoRoot, now)
      : mode === 'build-output'
        ? cleanupPlanForBuildOutput(absoluteRepoRoot)
        : mode === 'release-artifacts'
          ? cleanupPlanForReleaseArtifacts(absoluteRepoRoot)
          : cleanupPlanForExternalCache(cachePolicy, now);

  return {
    generatedAt: new Date(now).toISOString(),
    repoRoot: absoluteRepoRoot,
    mode,
    apply: options.apply ?? false,
    totalSizeBytes: actions.reduce((total, action) => total + action.sizeBytes, 0),
    actions,
  };
}

export function applyCleanupPlan(
  plan: CleanupPlan,
  options: { pnpmStorePath?: string; cachePolicy?: ShopflowCachePolicy } = {}
) {
  const applied: CleanupAction[] = [];

  for (const action of plan.actions) {
    const ownership = classifyDiskPath(plan.repoRoot, action.path, {
      pnpmStorePath: options.pnpmStorePath,
      cachePolicy: options.cachePolicy,
    });

    if (!ownership.repoOwned) {
      throw new Error(
        `Refusing to delete out-of-scope path ${action.path}: ${ownership.notes}`
      );
    }

    rmSync(action.path, {
      recursive: true,
      force: true,
    });
    applied.push(action);
  }

  return applied;
}

export function formatDiskFootprintReport(report: DiskFootprintReport) {
  const lines = [
    'Shopflow repo + external cache disk footprint audit',
    `Generated at: ${report.generatedAt}`,
    `Repo root: ${report.repoRoot}`,
    `Total tracked size: ${formatBytes(report.totalTrackedSizeBytes)}`,
    '',
  ];

  for (const entry of report.entries) {
    lines.push(
      `- [${entry.category}] ${entry.path}`,
      `  exists: ${entry.exists ? 'yes' : 'no'}`,
      `  sizeBytes: ${entry.sizeBytes} (${formatBytes(entry.sizeBytes)})`,
      `  retentionPolicy: ${entry.retentionPolicy}`,
      `  recommendedAction: ${entry.recommendedAction}`,
      `  repoOwned: ${entry.repoOwned ? 'true' : 'false'}`,
      `  notes: ${entry.notes}`
    );
  }

  if (report.outOfScopePaths.length > 0) {
    lines.push('', 'Out-of-scope machine-wide paths:');
    for (const entry of report.outOfScopePaths) {
      lines.push(`- ${entry.path}`, `  notes: ${entry.notes}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

export function formatCleanupPlan(plan: CleanupPlan) {
  const lines = [
    `Shopflow cleanup plan (${plan.mode})`,
    `Generated at: ${plan.generatedAt}`,
    `Apply mode: ${plan.apply ? 'yes' : 'no (dry-run)'}`,
    `Repo root: ${plan.repoRoot}`,
    `Planned removals: ${plan.actions.length}`,
    `Total reclaimable size: ${formatBytes(plan.totalSizeBytes)}`,
  ];

  if (plan.actions.length === 0) {
    lines.push(
      plan.mode === 'external-cache'
        ? 'No matching Shopflow-owned external cache artifacts to remove.'
        : 'No matching repo-local artifacts to remove.'
    );
    return `${lines.join('\n')}\n`;
  }

  lines.push('');
  for (const action of plan.actions) {
    lines.push(
      `- [${action.category}] ${formatRelativePath(plan.repoRoot, action.path)}`,
      `  sizeBytes: ${action.sizeBytes} (${formatBytes(action.sizeBytes)})`,
      `  reason: ${action.reason}`
    );
  }

  return `${lines.join('\n')}\n`;
}
