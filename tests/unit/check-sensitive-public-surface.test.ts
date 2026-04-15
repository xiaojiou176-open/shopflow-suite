import { describe, expect, it } from 'vitest';
import {
  collectPublicSurfaceFindings,
  createPublicSurfaceOps,
  runGhJsonWith,
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
          repo === 'xiaojiou176-open/shopflow-suite'
            ? [
                {
                  number: 12,
                  title: 'Leak report',
                  body: `owner path ${leakedPath}`,
                  url: 'https://github.com/xiaojiou176-open/shopflow-suite/issues/12',
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
            'xiaojiou176-open/shopflow-suite:issue-12'
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
    expect(ops.listIssues('xiaojiou176-open/shopflow-suite')).toEqual([
      { number: 1, title: 'issue-1' },
    ]);
    expect(ops.listPulls('xiaojiou176-open/shopflow-suite')).toEqual([
      { number: 3, title: 'pull-1' },
    ]);
    expect(ops.listReleases('xiaojiou176-open/shopflow-suite')).toEqual([
      { tag_name: 'v1.0.0', name: 'release-1' },
    ]);
    expect(ops.cloneRepo('xiaojiou176-open/shopflow-suite')).toBe(
      '/tmp/xiaojiou176-open-shopflow-suite'
    );
    expect(calls.map((args) => args[1])).toEqual([
      'repos/xiaojiou176-open/shopflow-suite',
      'repos/xiaojiou176-open/shopflow-suite/issues?state=all&per_page=100',
      'repos/xiaojiou176-open/shopflow-suite/pulls?state=all&per_page=100',
      'repos/xiaojiou176-open/shopflow-suite/releases?per_page=100',
    ]);
  });

  it('raises gh maxBuffer so large pull-history payloads do not trip default spawnSync limits', () => {
    const calls: Array<{
      command: string;
      args: string[];
      options: Parameters<typeof import('node:child_process').spawnSync>[2];
    }> = [];
    const ghJson = runGhJsonWith<{ ok: true }>(
      ['api', 'repos/xiaojiou176-open/shopflow-suite/pulls?state=all&per_page=100'],
      (command, args, options) => {
        calls.push({ command, args, options });

        if (args[0] === 'auth') {
          return {
            status: 0,
            stdout: 'token-123\n',
            stderr: '',
            signal: null,
            output: [],
            pid: 1,
          } as ReturnType<typeof import('node:child_process').spawnSync>;
        }

        return {
          status: 0,
          stdout: JSON.stringify({ ok: true }),
          stderr: '',
          signal: null,
          output: [],
          pid: 2,
        } as ReturnType<typeof import('node:child_process').spawnSync>;
      }
    );

    expect(ghJson).toEqual({ ok: true });
    expect(calls).toHaveLength(2);
    expect(calls[0]?.options?.maxBuffer).toBe(8 * 1024 * 1024);
    expect(calls[1]?.options?.maxBuffer).toBe(8 * 1024 * 1024);
    expect(calls[1]?.options?.env).toMatchObject({
      GH_TOKEN: 'token-123',
      GITHUB_TOKEN: 'token-123',
    });
  });

  it('reports an explicit ENOBUFS hint when gh output still exceeds the configured buffer', () => {
    expect(() =>
      runGhJsonWith(
        ['api', 'repos/xiaojiou176-open/shopflow-suite/pulls?state=all&per_page=100'],
        (_command, args) => {
          if (args[0] === 'auth') {
            return {
              status: 0,
              stdout: 'token-123\n',
              stderr: '',
              signal: null,
              output: [],
              pid: 1,
            } as ReturnType<typeof import('node:child_process').spawnSync>;
          }

          return {
            status: null,
            stdout: '',
            stderr: '',
            signal: 'SIGTERM',
            output: [],
            pid: 2,
            error: Object.assign(new Error('spawnSync gh ENOBUFS'), {
              code: 'ENOBUFS',
            }),
          } as ReturnType<typeof import('node:child_process').spawnSync>;
        }
      )
    ).toThrow(/exceeded the 8388608 byte buffer/i);
  });
});
