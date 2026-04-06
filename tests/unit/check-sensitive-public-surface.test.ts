import { describe, expect, it } from 'vitest';
import {
  collectPublicSurfaceFindings,
  createPublicSurfaceOps,
  scanGitHubTextSurface,
  type PublicSurfaceOps,
} from '../../tooling/verification/check-sensitive-public-surface';

function createOps(
  overrides: Partial<PublicSurfaceOps> = {}
): PublicSurfaceOps {
  const repoViews = {
    'xiaojiou176-open/shopflow-suite': {
      isPrivate: false,
      visibility: 'PUBLIC',
      url: 'https://github.com/xiaojiou176-open/shopflow-suite',
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
  it('flags when the private main repo unexpectedly becomes public', () => {
    const findings = collectPublicSurfaceFindings(
      createOps({
        viewRepo: (repo) =>
          repo === 'xiaojiou176-open/shopflow-suite'
            ? {
                isPrivate: true,
                visibility: 'PRIVATE',
                url: 'https://github.com/xiaojiou176-open/shopflow-suite',
              }
            : createOps().viewRepo(repo),
      })
    );

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'public-surface-unavailable',
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

  it('builds REST-backed public-surface ops without GraphQL-only assumptions', () => {
    const calls: string[][] = [];
    const ops = createPublicSurfaceOps(
      <T>(args: string[]) => {
        calls.push(args);

        if (args[1]?.includes('/issues?')) {
          return [
            { number: 1, title: 'issue-1' },
            { number: 2, title: 'pull-shadow', pull_request: { url: 'x' } },
          ] as T;
        }

        if (args[1]?.includes('/pulls?')) {
          return [{ number: 3, title: 'pull-1' }] as T;
        }

        if (args[1]?.includes('/releases?')) {
          return [{ tag_name: 'v1.0.0', name: 'release-1' }] as T;
        }

        return {
          private: true,
          visibility: 'private',
          html_url: 'https://github.com/xiaojiou176/shopflow-suite',
        } as T;
      },
      (repo) => `/tmp/${repo.replace('/', '-')}`
    );

    expect(ops.viewRepo('xiaojiou176-open/shopflow-suite')).toEqual({
      isPrivate: true,
      visibility: 'private',
      url: 'https://github.com/xiaojiou176/shopflow-suite',
    });
    expect(ops.listIssues('xiaojiou176/shopflow-public-packets')).toEqual([
      { number: 1, title: 'issue-1' },
    ]);
    expect(ops.listPulls('xiaojiou176/shopflow-public-packets')).toEqual([
      { number: 3, title: 'pull-1' },
    ]);
    expect(ops.listReleases('xiaojiou176/shopflow-public-packets')).toEqual([
      { tag_name: 'v1.0.0', name: 'release-1' },
    ]);
    expect(ops.cloneRepo('xiaojiou176/shopflow-public-packets')).toBe(
      '/tmp/xiaojiou176-shopflow-public-packets'
    );
    expect(calls.map((args) => args[1])).toEqual([
      'repos/xiaojiou176-open/shopflow-suite',
      'repos/xiaojiou176/shopflow-public-packets/issues?state=all&per_page=100',
      'repos/xiaojiou176/shopflow-public-packets/pulls?state=all&per_page=100',
      'repos/xiaojiou176/shopflow-public-packets/releases?per_page=100',
    ]);
  });
});
