import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applyCleanupPlan,
  buildDiskFootprintReport,
  createCleanupPlan,
} from '../../tooling/maintenance/disk-artifacts';
import { resolveShopflowCachePolicy } from '../../tooling/maintenance/cache-policy';

const tempRoots: string[] = [];

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (root) {
      rmSync(root, {
        recursive: true,
        force: true,
      });
    }
  }
});

function writeSizedFile(path: string, size = 32) {
  mkdirSync(resolve(path, '..'), {
    recursive: true,
  });
  writeFileSync(path, 'x'.repeat(size));
}

function createSandboxRepo() {
  const root = mkdtempSync(join(tmpdir(), 'shopflow-disk-footprint-'));
  tempRoots.push(root);

  mkdirSync(resolve(root, 'apps', 'ext-temu'), { recursive: true });
  mkdirSync(resolve(root, 'apps', 'ext-kroger'), { recursive: true });
  writeSizedFile(resolve(root, 'package.json'), 16);
  writeSizedFile(
    resolve(root, '.runtime-cache', 'live-browser', 'diagnose-latest.json'),
    120
  );
  const staleJsonPath = resolve(
    root,
    '.runtime-cache',
    'live-browser',
    'diagnose-2026-03-20T01-00-00-000Z.json'
  );
  writeSizedFile(
    staleJsonPath,
    80
  );
  const staleTimestamp = Date.parse('2026-03-20T01:00:00.000Z') / 1000;
  utimesSync(staleJsonPath, staleTimestamp, staleTimestamp);
  writeSizedFile(
    resolve(
      root,
      '.runtime-cache',
      'live-browser',
      'open-live-browser-latest.json'
    ),
    90
  );
  for (let index = 0; index < 7; index += 1) {
    const bundleRoot = resolve(
      root,
      '.runtime-cache',
      'live-browser',
      'bundles',
      `trace-2026-04-0${index + 1}T01-00-00-000Z`
    );
    writeSizedFile(
      resolve(
        bundleRoot,
        'summary.json'
      ),
      40 + index
    );
    const bundleTimestamp = Date.parse(
      `2026-04-0${index + 1}T01:00:00.000Z`
    ) / 1000;
    utimesSync(bundleRoot, bundleTimestamp, bundleTimestamp);
  }
  writeSizedFile(resolve(root, '.runtime-cache', 'builder', 'payload.json'), 64);
  writeSizedFile(resolve(root, '.runtime-cache', 'cli', 'payload.json'), 64);
  writeSizedFile(resolve(root, '.runtime-cache', 'coverage', 'summary.json'), 64);
  writeSizedFile(resolve(root, '.runtime-cache', 'temp', 'orphan.tmp'), 64);
  writeSizedFile(resolve(root, '.runtime-cache', 'e2e-browser', 'leftover', 'lock'), 64);
  writeSizedFile(resolve(root, '.runtime-cache', 'verify-release-readiness.log'), 64);
  writeSizedFile(
    resolve(root, '.runtime-cache', 'release-artifacts', 'manifest.json'),
    64
  );
  writeSizedFile(
    resolve(root, 'apps', 'ext-temu', '.output', 'chrome-mv3', 'manifest.json'),
    64
  );
  writeSizedFile(
    resolve(root, 'apps', 'ext-temu', '.wxt', 'cache.json'),
    64
  );
  writeSizedFile(
    resolve(root, 'apps', 'ext-kroger', '.output', 'chrome-mv3', 'manifest.json'),
    64
  );
  writeSizedFile(resolve(root, 'coverage', 'index.html'), 64);
  writeSizedFile(resolve(root, 'test-results', 'result.json'), 64);
  writeSizedFile(resolve(root, 'playwright-report', 'index.html'), 64);
  writeSizedFile(resolve(root, 'node_modules', '.pnpm', 'lock'), 64);

  return root;
}

describe('disk footprint tooling', () => {
  it('builds a stable repo-local audit report and keeps machine-wide caches out of scope', () => {
    const root = createSandboxRepo();
    const cacheRoot = mkdtempSync(join(tmpdir(), 'shopflow-external-cache-'));
    tempRoots.push(cacheRoot);
    const cachePolicy = resolveShopflowCachePolicy({
      SHOPFLOW_CACHE_DIR: cacheRoot,
    });
    writeSizedFile(resolve(cachePolicy.paths['pnpm-store'], 'v10', 'files.db'), 64);
    writeSizedFile(
      resolve(cachePolicy.paths['ms-playwright'], 'chromium-123', 'browser.json'),
      64
    );
    const report = buildDiskFootprintReport(root, {
      generatedAt: '2026-04-04T12:00:00.000Z',
      pnpmStorePath: cachePolicy.paths['pnpm-store'],
      cachePolicy,
    });

    expect(report.generatedAt).toBe('2026-04-04T12:00:00.000Z');
    expect(report.repoRoot).toBe(root);
    expect(report.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '.runtime-cache/live-browser',
          category: 'live-browser',
          exists: true,
          repoOwned: true,
        }),
        expect.objectContaining({
          path: 'apps/*/.output',
          category: 'build-output',
          exists: true,
          repoOwned: true,
        }),
        expect.objectContaining({
          path: 'node_modules',
          category: 'dependencies',
          exists: true,
          repoOwned: true,
        }),
        expect.objectContaining({
          path: expect.stringMatching(/pnpm-store$/),
          category: 'external-cache',
          exists: true,
          repoOwned: true,
        }),
      ])
    );
    expect(report.outOfScopePaths).toEqual([]);
  });

  it('keeps dry-run cleanup non-mutating and applies only repo-local deletions when requested', () => {
    const root = createSandboxRepo();
    const runtimePlan = createCleanupPlan(root, 'runtime-cache', {
      now: Date.parse('2026-04-04T12:00:00.000Z'),
    });

    expect(runtimePlan.actions.map((action) => action.path)).toEqual(
      expect.arrayContaining([
        resolve(root, '.runtime-cache', 'builder'),
        resolve(root, '.runtime-cache', 'cli'),
        resolve(root, '.runtime-cache', 'coverage'),
        resolve(root, '.runtime-cache', 'temp'),
        resolve(root, '.runtime-cache', 'e2e-browser'),
        resolve(root, '.runtime-cache', 'verify-release-readiness.log'),
      ])
    );
    expect(
      runtimePlan.actions.some((action) =>
        action.path.endsWith('.runtime-cache/release-artifacts')
      )
    ).toBe(false);
    expect(
      runtimePlan.actions.filter((action) =>
        action.path.includes(`${join('.runtime-cache', 'live-browser', 'bundles')}`)
      )
    ).toHaveLength(2);

    expect(existsSync(resolve(root, '.runtime-cache', 'builder'))).toBe(true);

    applyCleanupPlan(runtimePlan);

    expect(existsSync(resolve(root, '.runtime-cache', 'builder'))).toBe(false);
    expect(existsSync(resolve(root, '.runtime-cache', 'cli'))).toBe(false);
    expect(existsSync(resolve(root, '.runtime-cache', 'coverage'))).toBe(false);
    expect(existsSync(resolve(root, '.runtime-cache', 'temp'))).toBe(false);
    expect(existsSync(resolve(root, '.runtime-cache', 'e2e-browser'))).toBe(false);
    expect(
      existsSync(resolve(root, '.runtime-cache', 'release-artifacts'))
    ).toBe(true);
    expect(
      existsSync(resolve(root, '.runtime-cache', 'live-browser', 'diagnose-latest.json'))
    ).toBe(true);
    expect(
      existsSync(
        resolve(
          root,
          '.runtime-cache',
          'live-browser',
          'diagnose-2026-03-20T01-00-00-000Z.json'
        )
      )
    ).toBe(false);
  });

  it('cleans build outputs and release artifacts with separate plans', () => {
    const root = createSandboxRepo();
    const buildPlan = createCleanupPlan(root, 'build-output', {
      now: Date.parse('2026-04-04T12:00:00.000Z'),
    });
    const releasePlan = createCleanupPlan(root, 'release-artifacts', {
      now: Date.parse('2026-04-04T12:00:00.000Z'),
    });

    expect(buildPlan.actions.map((action) => action.path)).toEqual(
      expect.arrayContaining([
        resolve(root, 'apps', 'ext-temu', '.output'),
        resolve(root, 'apps', 'ext-temu', '.wxt'),
        resolve(root, 'coverage'),
        resolve(root, 'test-results'),
        resolve(root, 'playwright-report'),
      ])
    );
    expect(releasePlan.actions).toEqual([
      expect.objectContaining({
        path: resolve(root, '.runtime-cache', 'release-artifacts'),
        category: 'release-artifacts',
      }),
    ]);
  });

  it('refuses to apply an out-of-scope machine-wide deletion even if a bad plan is injected', () => {
    const root = createSandboxRepo();
    const plan = createCleanupPlan(root, 'release-artifacts', {
      now: Date.parse('2026-04-04T12:00:00.000Z'),
    });
    plan.actions.push({
      path: '/private/var/folders/bad-residue',
      category: 'temp',
      reason: 'bad test injection',
      sizeBytes: 1,
    });

    expect(() => applyCleanupPlan(plan)).toThrow(/Refusing to delete out-of-scope path/);
  });

  it('prunes Shopflow-owned external caches by ttl first and then by size cap', () => {
    const root = createSandboxRepo();
    const cacheRoot = mkdtempSync(join(tmpdir(), 'shopflow-external-cache-'));
    tempRoots.push(cacheRoot);
    const cachePolicy = resolveShopflowCachePolicy({
      SHOPFLOW_CACHE_DIR: cacheRoot,
      SHOPFLOW_CACHE_TTL_DAYS: '3',
      SHOPFLOW_CACHE_MAX_BYTES: '110',
    });

    const stalePnpmPath = resolve(
      cachePolicy.paths['pnpm-store'],
      'v10',
      'stale-store'
    );
    const recentPlaywrightPath = resolve(
      cachePolicy.paths['ms-playwright'],
      'chromium-123',
      'browser.bin'
    );
    const recentTempPath = resolve(cachePolicy.paths.tmp, 'session-trace', 'trace.json');

    writeSizedFile(stalePnpmPath, 70);
    writeSizedFile(recentTempPath, 60);
    writeSizedFile(recentPlaywrightPath, 80);

    const staleTimestamp = Date.parse('2026-03-20T01:00:00.000Z') / 1000;
    utimesSync(resolve(cachePolicy.paths['pnpm-store'], 'v10'), staleTimestamp, staleTimestamp);
    utimesSync(stalePnpmPath, staleTimestamp, staleTimestamp);

    const plan = createCleanupPlan(root, 'external-cache', {
      now: Date.parse('2026-04-04T12:00:00.000Z'),
      cachePolicy,
    });

    expect(plan.actions.map((action) => action.path)).toEqual(
      expect.arrayContaining([resolve(cachePolicy.paths['pnpm-store'], 'v10')])
    );
    expect(plan.actions).toHaveLength(2);

    applyCleanupPlan(plan, { cachePolicy });

    expect(existsSync(resolve(cachePolicy.paths['pnpm-store'], 'v10'))).toBe(false);
    const remainingBytes =
      Number(existsSync(resolve(cachePolicy.paths.tmp, 'session-trace'))) * 60 +
      Number(
        existsSync(resolve(cachePolicy.paths['ms-playwright'], 'chromium-123'))
      ) *
        80;
    expect(remainingBytes).toBeLessThanOrEqual(110);
  });
});
