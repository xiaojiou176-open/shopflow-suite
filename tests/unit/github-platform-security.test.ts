import { describe, expect, it } from 'vitest';
import {
  classifyCapabilityResult,
  collectGitHubPlatformSecuritySummary,
  formatGitHubPlatformSecuritySummary,
  hasBlockingGitHubPlatformSecurityFinding,
  inferRepoSlugFromRemote,
  writeGitHubPlatformSecuritySummary,
  type GitHubPlatformSecurityOps,
} from '../../tooling/verification/github-platform-security';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

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

  it('classifies enabled alert endpoints with zero findings as clean', () => {
    const enabledWithoutAlerts = classifyCapabilityResult('dependabot-alerts', {
      status: 0,
      stdout: '[]',
      stderr: '',
    });

    expect(enabledWithoutAlerts.status).toBe('enabled');
    expect(enabledWithoutAlerts.openAlertCount).toBe(0);
  });

  it('treats integration-restricted alert endpoints as platform-pending instead of code failure', () => {
    const restricted = classifyCapabilityResult('dependabot-alerts', {
      status: 1,
      stdout: '{"message":"Resource not accessible by integration","status":"403"}',
      stderr: 'gh: Resource not accessible by integration (HTTP 403)',
    });

    expect(restricted.status).toBe('platform-pending');
    expect(restricted.openAlertCount).toBeNull();
  });

  it('classifies unexpected errors without pretending the platform is disabled', () => {
    const unexpected = classifyCapabilityResult('code-scanning', {
      status: 1,
      stdout: '{"message":"boom","status":"500"}',
      stderr: 'gh: boom (HTTP 500)',
    });

    expect(unexpected.status).toBe('unexpected-error');
  });

  it('collects a mixed capability summary from mocked gh responses', () => {
    const previousRepo = process.env.GITHUB_REPOSITORY;
    delete process.env.GITHUB_REPOSITORY;
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
    if (previousRepo === undefined) {
      delete process.env.GITHUB_REPOSITORY;
    } else {
      process.env.GITHUB_REPOSITORY = previousRepo;
    }

    expect(summary.repoSlug).toBe('acme/shopflow-suite');
    expect(summary.visibility).toBe('PRIVATE');
    expect(summary.capabilities.map((entry) => entry.status)).toEqual([
      'disabled',
      'disabled',
      'enabled',
      'disabled',
    ]);
  });

  it('formats and writes a markdown summary without inventing blockers', () => {
    const summary = {
      repoSlug: 'acme/shopflow-suite',
      visibility: 'PRIVATE',
      isPrivate: true,
      capabilities: [
        {
          capability: 'secret-scanning' as const,
          status: 'disabled' as const,
          message: 'disabled',
          openAlertCount: null,
        },
        {
          capability: 'dependabot-alerts' as const,
          status: 'alerts-open' as const,
          message: '2 open alert(s)',
          openAlertCount: 2,
        },
      ],
    };

    const formatted = formatGitHubPlatformSecuritySummary(summary);
    expect(formatted).toContain('GitHub platform security summary for acme/shopflow-suite');
    expect(hasBlockingGitHubPlatformSecurityFinding(summary)).toBe(true);

    const tempDir = mkdtempSync('github-platform-summary-');
    const summaryPath = join(tempDir, 'summary.md');
    process.env.GITHUB_STEP_SUMMARY = summaryPath;
    writeGitHubPlatformSecuritySummary(summary);
    delete process.env.GITHUB_STEP_SUMMARY;

    const written = readFileSync(summaryPath, 'utf8');
    expect(written).toContain('dependabot-alerts');
    expect(written).toContain('secret-scanning');
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns null when the remote is not a GitHub slug', () => {
    expect(inferRepoSlugFromRemote('ssh://example.invalid/repo.git')).toBeNull();
  });
});
