import {
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildActiveBrowserInstanceRecordPath,
  buildDefaultShopflowBrowserSeedConfig,
  collectChromeMainProcesses,
  findDefaultChromeRootProcesses,
  findChromeProcessesUsingUserDataDir,
  readActiveBrowserInstanceRecord,
  removeActiveBrowserInstanceRecord,
  removeSingletonArtifacts,
  writeActiveBrowserInstanceRecord,
  rewriteChromeLocalStateForShopflowProfile,
  rewriteChromeProfilePreferences,
} from '../../tooling/live/browser-profile';
import {
  canonicalShopflowLiveProfileDirectory,
  canonicalShopflowLiveProfileName,
  resolveShopflowCachePolicy,
} from '../../tooling/maintenance/cache-policy';

const tempRoots: string[] = [];
const fakeHomeDir = '/tmp/shopflow-home';
const fakeShopflowCacheDir = `${fakeHomeDir}/.cache/shopflow`;
const dedicatedUserDataDir = `${fakeShopflowCacheDir}/browser/chrome-user-data`;
const defaultChromeRoot = `${fakeHomeDir}/Library/Application Support/Google/Chrome`;

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (root) {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

describe('browser profile seed helpers', () => {
  it('rewrites Local State to a single Profile 1 / shopflow mapping', () => {
    const rewritten = rewriteChromeLocalStateForShopflowProfile(
      JSON.stringify({
        profile: {
          info_cache: {
            'Profile 19': {
              name: 'ShopFlow',
              gaia_name: 'Fixture User',
            },
            'Profile 7': {
              name: 'Other',
            },
          },
          last_used: 'Profile 19',
          last_active_profiles: ['Profile 19'],
          profiles_order: ['Profile 19', 'Profile 7'],
        },
      }),
      'Profile 19'
    );

    const parsed = JSON.parse(rewritten) as {
      profile: {
        info_cache: Record<string, { name: string; gaia_name?: string }>;
        last_used: string;
        last_active_profiles: string[];
        profiles_order: string[];
      };
    };

    expect(Object.keys(parsed.profile.info_cache)).toEqual(['Profile 1']);
    expect(parsed.profile.info_cache['Profile 1']).toEqual({
      name: 'shopflow',
      gaia_name: 'Fixture User',
    });
    expect(parsed.profile.last_used).toBe('Profile 1');
    expect(parsed.profile.last_active_profiles).toEqual(['Profile 1']);
    expect(parsed.profile.profiles_order).toEqual(['Profile 1']);
  });

  it('rewrites Preferences to the lower-case shopflow display name', () => {
    const rewritten = rewriteChromeProfilePreferences(
      JSON.stringify({
        profile: {
          name: 'ShopFlow',
        },
      })
    );

    expect(JSON.parse(rewritten)).toEqual({
      profile: {
        name: 'shopflow',
      },
    });
  });

  it('detects default-root Chrome processes separately from dedicated-root Chrome', () => {
    const processList = [
      '101 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      `102 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --user-data-dir=${dedicatedUserDataDir} --profile-directory=Profile 1`,
      `103 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --user-data-dir=${defaultChromeRoot} --profile-directory=Profile 19`,
    ].join('\n');

    expect(collectChromeMainProcesses(processList)).toHaveLength(3);
    expect(
      findDefaultChromeRootProcesses(
        processList,
        defaultChromeRoot
      ).map((processInfo) => processInfo.pid)
    ).toEqual([101, 103]);
  });

  it('filters Chrome processes by the exact requested user-data-dir', () => {
    const processList = [
      `101 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --user-data-dir=${dedicatedUserDataDir} --profile-directory=Profile 1`,
      `102 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --user-data-dir=${fakeShopflowCacheDir}/browser/other-root --profile-directory=Profile 1`,
      '103 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ].join('\n');

    expect(
      findChromeProcessesUsingUserDataDir(
        processList,
        dedicatedUserDataDir
      ).map((processInfo) => processInfo.pid)
    ).toEqual([101]);
  });

  it('removes singleton artifacts from the copied browser root', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'shopflow-browser-root-'));
    tempRoots.push(root);

    for (const name of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
      writeFileSync(resolve(root, name), 'lock');
    }

    const removed = removeSingletonArtifacts(root);

    expect(removed).toHaveLength(3);
    expect(existsSync(resolve(root, 'SingletonLock'))).toBe(false);
    expect(existsSync(resolve(root, 'SingletonCookie'))).toBe(false);
    expect(existsSync(resolve(root, 'SingletonSocket'))).toBe(false);
  });

  it('writes and reads the active browser instance record at the canonical artifact path', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'shopflow-browser-artifacts-'));
    tempRoots.push(root);

    const recordPath = writeActiveBrowserInstanceRecord(root, {
      pid: 43350,
      userDataDir: dedicatedUserDataDir,
      profileDirectory: 'Profile 1',
      profileName: 'shopflow',
      cdpUrl: 'http://127.0.0.1:9335',
      remoteDebuggingPort: 9335,
      chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      startedAt: '2026-04-05T14:03:12.801Z',
      source: 'shopflow-singleton',
    });

    expect(recordPath).toBe(buildActiveBrowserInstanceRecordPath(root));
    expect(readActiveBrowserInstanceRecord(root)).toEqual({
      pid: 43350,
      userDataDir: dedicatedUserDataDir,
      profileDirectory: 'Profile 1',
      profileName: 'shopflow',
      cdpUrl: 'http://127.0.0.1:9335',
      remoteDebuggingPort: 9335,
      chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      startedAt: '2026-04-05T14:03:12.801Z',
      source: 'shopflow-singleton',
    });
  });

  it('removes the active browser instance record when closeout clears the singleton state', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'shopflow-browser-artifacts-'));
    tempRoots.push(root);

    writeActiveBrowserInstanceRecord(root, {
      pid: 43350,
      userDataDir: dedicatedUserDataDir,
      profileDirectory: 'Profile 1',
      profileName: 'shopflow',
      cdpUrl: 'http://127.0.0.1:9335',
      remoteDebuggingPort: 9335,
      chromeExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      startedAt: '2026-04-05T14:03:12.801Z',
      source: 'shopflow-singleton',
    });

    removeActiveBrowserInstanceRecord(root);

    expect(readActiveBrowserInstanceRecord(root)).toBeUndefined();
  });

  it('builds seed defaults from the dedicated browser root and legacy source profile', () => {
    const policy = resolveShopflowCachePolicy({
      SHOPFLOW_CACHE_DIR: fakeShopflowCacheDir,
    });
    const config = buildDefaultShopflowBrowserSeedConfig({}, policy);

    expect(config.targetUserDataDir).toBe(dedicatedUserDataDir);
    expect(config.targetProfileDirectory).toBe(canonicalShopflowLiveProfileDirectory);
    expect(config.targetProfileName).toBe(canonicalShopflowLiveProfileName);
    expect(config.sourceProfileDirectory).toBe('Profile 19');
  });
});
