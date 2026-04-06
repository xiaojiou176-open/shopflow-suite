import { describe, expect, it } from 'vitest';
import {
  classifyCapabilityResult,
  collectGitHubPlatformSecuritySummary,
  inferRepoSlugFromRemote,
  type GitHubPlatformSecurityOps,
} from '../../tooling/verification/github-platform-security';

describe('github platform security helpers', () => {
  it('infers the repo slug from ssh remotes', () => {
    expect(
      inferRepoSlugFromRemote('https://github.com/acme/shopflow-suite.git')
    ).toBe('acme/shopflow-suite');
  });

  it('classifies disabled feature endpoints without failing the closeout tree', () => {
    const disabled = classifyCapabilityResult('secret-scanning', {
      status: 1,
      stdout: '{"message":"Secret scanning is disabled on this repository.","status":"404"}',
      stderr: 'gh: Secret scanning is disabled on this repository. (HTTP 404)',
    });

    expect(disabled.status).toBe('disabled');
    expect(disabled.openAlertCount).toBeNull();
  });

  it('treats enabled alert endpoints with findings as blocking', () => {
    const enabledWithAlerts = classifyCapabilityResult('code-scanning', {
      status: 0,
      stdout: '[{"number":1},{"number":2}]',
      stderr: '',
    });

    expect(enabledWithAlerts.status).toBe('alerts-open');
    expect(enabledWithAlerts.openAlertCount).toBe(2);
  });

  it('collects a mixed capability summary from mocked gh responses', () => {
    const ops: GitHubPlatformSecurityOps = {
      runGit: () => ({
        status: 0,
        stdout: 'https://github.com/acme/shopflow-suite.git\n',
        stderr: '',
      }),
      runGh: (args) => {
        const endpoint = args[1];

        if (endpoint === 'repos/acme/shopflow-suite') {
          return {
            status: 0,
            stdout: '{"visibility":"PRIVATE","private":true}',
            stderr: '',
          };
        }

        if (endpoint.includes('/code-scanning/alerts')) {
          return {
            status: 1,
            stdout: '{"message":"Code scanning is not enabled for this repository.","status":"403"}',
            stderr:
              'gh: Code scanning is not enabled for this repository. Please enable code scanning in the repository settings. (HTTP 403)',
          };
        }

        if (endpoint.includes('/secret-scanning/alerts')) {
          return {
            status: 1,
            stdout: '{"message":"Secret scanning is disabled on this repository.","status":"404"}',
            stderr: 'gh: Secret scanning is disabled on this repository. (HTTP 404)',
          };
        }

        if (endpoint.includes('/dependabot/alerts')) {
          return {
            status: 0,
            stdout: '[]',
            stderr: '',
          };
        }

        return {
          status: 1,
          stdout: '{"message":"Vulnerability alerts are disabled.","status":"404"}',
          stderr: 'gh: Vulnerability alerts are disabled. (HTTP 404)',
        };
      },
    };

    const summary = collectGitHubPlatformSecuritySummary(ops);

    expect(summary.repoSlug).toBe('acme/shopflow-suite');
    expect(summary.visibility).toBe('PRIVATE');
    expect(summary.capabilities.map((entry) => entry.status)).toEqual([
      'disabled',
      'disabled',
      'enabled',
      'disabled',
    ]);
  });
});
