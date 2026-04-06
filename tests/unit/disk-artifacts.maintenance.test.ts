import { describe, expect, it } from 'vitest';
import {
  artifactCategoryValues,
  classifyDiskPath,
  createCleanupPlan,
} from '../../tooling/maintenance/disk-artifacts';
import { resolveShopflowCachePolicy } from '../../tooling/maintenance/cache-policy';
import { repoRoot } from '../support/repo-paths';

const fakeHomeDir = '/tmp/shopflow-home';
const fakeShopflowCacheDir = `${fakeHomeDir}/.cache/shopflow`;
const defaultChromeRoot = `${fakeHomeDir}/Library/Application Support/Google/Chrome`;

describe('disk artifact maintenance', () => {
  it('keeps the artifact category contract explicit', () => {
    expect(artifactCategoryValues).toEqual([
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
    ]);
  });

  it('treats repo-local dependency roots as in-scope repo paths', () => {
    const ownership = classifyDiskPath(
      repoRoot,
      `${repoRoot}/node_modules`
    );

    expect(ownership.repoOwned).toBe(true);
    expect(ownership.notes).toMatch(/repo-local artifact path/i);
  });

  it('marks darwin temp and machine-wide cache paths as out-of-scope', () => {
    const cachePolicy = resolveShopflowCachePolicy({
      SHOPFLOW_CACHE_DIR: fakeShopflowCacheDir,
    });

    expect(
      classifyDiskPath(repoRoot, '/private/var/folders/fake-cache').repoOwned
    ).toBe(false);
    expect(
      classifyDiskPath(
        repoRoot,
        `${fakeShopflowCacheDir}/pnpm-store/v10`,
        {
          cachePolicy,
        }
      ).repoOwned
    ).toBe(true);
    expect(
      classifyDiskPath(repoRoot, `${fakeHomeDir}/.cache/shared-runner`, {
        cachePolicy,
      }).repoOwned
    ).toBe(false);
    expect(
      classifyDiskPath(
        repoRoot,
        `${fakeShopflowCacheDir}/browser/chrome-user-data/Profile 1`,
        {
          cachePolicy,
        }
      ).repoOwned
    ).toBe(false);
    expect(
      classifyDiskPath(
        repoRoot,
        `${repoRoot}/.serena/session-cache`,
        {
          cachePolicy,
        }
      ).repoOwned
    ).toBe(false);
    expect(
      classifyDiskPath(
        repoRoot,
        defaultChromeRoot
      ).repoOwned
    ).toBe(false);
  });

  it('never schedules release artifacts inside runtime-cache cleanup', () => {
    const plan = createCleanupPlan(repoRoot, 'runtime-cache', {
      now: Date.parse('2026-04-04T12:00:00.000Z'),
    });

    expect(
      plan.actions.some((action) =>
        action.path.endsWith('.runtime-cache/release-artifacts')
      )
    ).toBe(false);
  });

  it('adds a dedicated external-cache cleanup mode', () => {
    const cachePolicy = resolveShopflowCachePolicy({
      SHOPFLOW_CACHE_DIR: '/tmp/shopflow-external-cache-unit',
    });
    const plan = createCleanupPlan(repoRoot, 'external-cache', {
      now: Date.parse('2026-04-04T12:00:00.000Z'),
      cachePolicy,
    });

    expect(plan.mode).toBe('external-cache');
    expect(Array.isArray(plan.actions)).toBe(true);
  });
});
