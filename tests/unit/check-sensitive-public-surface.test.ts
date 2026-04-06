import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  collectPublicSurfaceFindings,
  defaultOps,
  scanGitHubTextSurface,
  type PublicSurfaceOps,
} from '../../tooling/verification/check-sensitive-public-surface';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';

vi.mock('node:child_process', async () => {
  const actual =
    await vi.importActual<typeof import('node:child_process')>('node:child_process');
  return {
    ...actual,
    spawnSync: vi.fn(),
  };
});

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    mkdtempSync: vi.fn(),
  };
});

function createOps(
  overrides: Partial<PublicSurfaceOps> = {}
): PublicSurfaceOps {
  const repoViews = {
    'xiaojiou176/shopflow-suite': {
      isPrivate: true,
      visibility: 'PRIVATE',
      url: 'https://github.com/xiaojiou176/shopflow-suite',
    },
    'xiaojiou176/shopflow-public-packets': {
      isPrivate: false,
      visibility: 'PUBLIC',
      url: 'https://github.com/xiaojiou176/shopflow-public-packets',
    },
    'xiaojiou176/shopflow-openclaw-plugin': {
      isPrivate: false,
      visibility: 'PUBLIC',
      url: 'https://github.com/xiaojiou176/shopflow-openclaw-plugin',
    },
  } as const;

  return {
    viewRepo: (repo) => repoViews[repo as keyof typeof repoViews],
    cloneRepo: (repo) => `/tmp/${repo.replace('/', '-')}`,
    scanCurrent: () => [],
    scanHistory: () => [],
    listIssues: () => [],
    listPulls: () => [],
    listReleases: () => [],
    cleanupClone: () => {},
    ...overrides,
  };
}

describe('sensitive public-surface gate', () => {
  beforeEach(() => {
    vi.mocked(spawnSync).mockReset();
    vi.mocked(mkdtempSync).mockReset();
  });

  it('flags when the private main repo unexpectedly becomes public', () => {
    const findings = collectPublicSurfaceFindings(
      createOps({
        viewRepo: (repo) =>
          repo === 'xiaojiou176/shopflow-suite'
            ? {
                isPrivate: false,
                visibility: 'PUBLIC',
                url: 'https://github.com/xiaojiou176/shopflow-suite',
              }
            : createOps().viewRepo(repo),
      })
    );

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'unexpected-public-repo',
        }),
      ])
    );
  });

  it('flags sensitive text that appears in a public issue body', () => {
    const leakedPath = ['/Users', 'example-user', 'private', 'file.txt'].join('/');
    const findings = collectPublicSurfaceFindings(
      createOps({
        listIssues: (repo) =>
          repo === 'xiaojiou176/shopflow-public-packets'
            ? [
                {
                  number: 12,
                  title: 'Leak report',
                  body: `owner path ${leakedPath}`,
                  url: 'https://github.com/xiaojiou176/shopflow-public-packets/issues/12',
                },
              ]
            : [],
      })
    );

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'absolute-user-path',
          file: expect.stringContaining(
            'xiaojiou176/shopflow-public-packets:issue-12'
          ),
        }),
      ])
    );
  });

  it('stays clean when repo views, clones, and public text surfaces are clean', () => {
    expect(collectPublicSurfaceFindings(createOps())).toEqual([]);
  });

  it('parses GitHub text surfaces through the shared scanner', () => {
    const findings = scanGitHubTextSurface('repo', [
      {
        path: 'issue-5',
        content: `contact ${['owner', 'real-domain.com'].join('@')}`,
      },
    ]);

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'email-address',
          file: 'repo:issue-5',
        }),
      ])
    );
  });

  it('runs default gh-backed repo view calls through spawnSync', () => {
    vi.mocked(spawnSync).mockReturnValue({
      status: 0,
      stdout: JSON.stringify({
        isPrivate: true,
        visibility: 'PRIVATE',
        url: 'https://github.com/xiaojiou176/shopflow-suite',
      }),
      stderr: '',
    } as ReturnType<typeof spawnSync>);

    expect(defaultOps.viewRepo('xiaojiou176/shopflow-suite')).toEqual({
      isPrivate: true,
      visibility: 'PRIVATE',
      url: 'https://github.com/xiaojiou176/shopflow-suite',
    });
  });

  it('runs default GitHub list calls through spawnSync', () => {
    vi.mocked(spawnSync).mockReturnValue({
      status: 0,
      stdout: JSON.stringify([]),
      stderr: '',
    } as ReturnType<typeof spawnSync>);

    expect(defaultOps.listIssues('xiaojiou176/shopflow-public-packets')).toEqual([]);
    expect(defaultOps.listPulls('xiaojiou176/shopflow-public-packets')).toEqual([]);
    expect(defaultOps.listReleases('xiaojiou176/shopflow-public-packets')).toEqual([]);
  });

  it('creates the default public clone through git clone', () => {
    vi.mocked(mkdtempSync).mockReturnValue('/tmp/shopflow-public-clone');
    vi.mocked(spawnSync).mockReturnValue({
      status: 0,
      stdout: '',
      stderr: '',
    } as ReturnType<typeof spawnSync>);

    const cloneRoot = defaultOps.cloneRepo('xiaojiou176/shopflow-public-packets');

    expect(cloneRoot).toContain('shopflow-public-scan-');
    rmSync(cloneRoot, { recursive: true, force: true });
  });
});
