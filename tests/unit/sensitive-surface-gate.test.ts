import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  scanCurrentSurface,
  scanGitHistory,
  scanPathOnly,
  scanTextContent,
} from '../../tooling/verification/sensitive-surface-gate';

function createIsolatedGitEnv(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const envEntries = Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'));
  return Object.fromEntries([...envEntries, ...Object.entries(extra)]);
}

function runTempRepoGit(
  repoRoot: string,
  args: string[],
  extraEnv: NodeJS.ProcessEnv = {}
) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: createIsolatedGitEnv(extraEnv),
  });
}

function withTempGitRepo(run: (repoRoot: string) => void) {
  const repoRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-sensitive-gate-'));
  const originalCwd = process.cwd();

  try {
    mkdirSync(resolve(repoRoot, '.git-hooks'), { recursive: true });
    runTempRepoGit(repoRoot, ['init']);
    runTempRepoGit(repoRoot, ['config', 'user.name', 'Shopflow Test']);
    runTempRepoGit(repoRoot, ['config', 'user.email', ['shopflow', 'example.com'].join('@')]);
    runTempRepoGit(repoRoot, ['config', 'core.hooksPath', '.git-hooks']);
    run(repoRoot);
  } finally {
    process.chdir(originalCwd);
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

describe('sensitive surface gate', () => {
  it('flags user-specific absolute paths and emails in text content', () => {
    const findings = scanTextContent(
      'docs/example.md',
      [
        `path: ${['/Users', 'example-user', 'private', 'file.txt'].join('/')}`,
        `email: ${['owner', 'example.com'].join('@')}`,
      ].join('\n')
    );

    expect(findings.map((finding) => finding.ruleId)).toEqual(
      expect.arrayContaining(['absolute-user-path', 'email-address'])
    );
  });

  it('does not mistake retina asset suffixes for email addresses', () => {
    const findings = scanTextContent(
      'tests/fixtures/example.html',
      'srcset="/images/cold-brew-hero@2x.jpg 2x, /images/cold-brew-hero.jpg 1x"'
    );

    expect(findings).toEqual([]);
  });

  it('allows explicit fixture placeholders for sensitive-looking fields', () => {
    expect(
      scanTextContent(
        'tests/example.ts',
        'const apiKeyProduction = "0000000000000000000000000000000000000000";'
      )
    ).toEqual([]);
    expect(
      scanTextContent(
        'tests/example.ts',
        'const apiKeyProduction = "target-fixture-api-key";'
      )
    ).toEqual([]);
  });

  it('flags risky committed artifact paths', () => {
    expect(scanPathOnly('logs/live-session.log').map((item) => item.ruleId)).toEqual(
      expect.arrayContaining(['blocked-sensitive-extension', 'blocked-sensitive-path'])
    );
    expect(scanPathOnly('.env.local').map((item) => item.ruleId)).toEqual(
      expect.arrayContaining(['blocked-sensitive-path'])
    );
  });

  it(
    'scans a real worktree for tracked and non-ignored sensitive residue',
    { timeout: 15000 },
    () => {
    withTempGitRepo((repoRoot) => {
      mkdirSync(resolve(repoRoot, 'docs'), { recursive: true });
      mkdirSync(resolve(repoRoot, 'logs'), { recursive: true });

      const leakedPath = ['/Users', 'example-user', 'private', 'file.txt'].join('/');
      const leakedEmail = ['owner', 'real-domain.com'].join('@');

      writeFileSync(
        resolve(repoRoot, 'docs/current.md'),
        `path=${leakedPath}\ncontact=${leakedEmail}\n`
      );
      writeFileSync(resolve(repoRoot, '.env.local'), 'TOKEN=not-checked-in-yet\n');
      writeFileSync(resolve(repoRoot, 'logs/live-session.log'), 'trace\n');
      writeFileSync(resolve(repoRoot, 'docs/binary.bin'), Buffer.from([0, 1, 2, 3]));

      const findings = scanCurrentSurface(repoRoot);

      expect(findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ruleId: 'absolute-user-path' }),
          expect.objectContaining({ ruleId: 'email-address' }),
          expect.objectContaining({ ruleId: 'blocked-sensitive-path' }),
          expect.objectContaining({ ruleId: 'blocked-sensitive-extension' }),
        ])
      );
    });
    }
  );

  it(
    'scans reachable git history and keeps removed historical residue visible',
    { timeout: 15000 },
    () => {
    withTempGitRepo((repoRoot) => {
      mkdirSync(resolve(repoRoot, 'docs'), { recursive: true });

      writeFileSync(resolve(repoRoot, 'docs/clean.md'), 'clean\n');
      runTempRepoGit(repoRoot, ['add', '.']);
      runTempRepoGit(repoRoot, ['commit', '-m', 'clean']);

      const leakedPath = ['/Users', 'history-user', 'private', 'file.txt'].join('/');
      const leakedEmail = ['history-owner', 'real-domain.com'].join('@');
      const apiKey = [
        '9f36aeafbe60',
        '771e321a7cc9',
        '5a78140772ab',
        '3e96',
      ].join('');
      writeFileSync(
        resolve(repoRoot, 'docs/history.md'),
        `path=${leakedPath}\ncontact=${leakedEmail}\napiKeyProduction="${apiKey}"\n`
      );
      runTempRepoGit(repoRoot, ['add', '.']);
      runTempRepoGit(repoRoot, ['commit', '-m', 'introduce leak']);

      writeFileSync(resolve(repoRoot, 'docs/history.md'), 'clean again\n');
      runTempRepoGit(repoRoot, ['add', '.']);
      runTempRepoGit(repoRoot, ['commit', '-m', 'clean leak']);

      const findings = scanGitHistory(repoRoot);

      expect(findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ruleId: 'absolute-user-path' }),
          expect.objectContaining({ ruleId: 'email-address' }),
          expect.objectContaining({ ruleId: 'high-entropy-sensitive-field' }),
        ])
      );
      expect(findings.some((finding) => Boolean(finding.commit))).toBe(true);
    });
    }
  );

  it('flags scrubbed personal identity in reachable git metadata', () => {
    withTempGitRepo((repoRoot) => {
      mkdirSync(resolve(repoRoot, 'docs'), { recursive: true });
      const legacyName = ['Yi', 'feng', '[Ter', 'ry]', ' Yu'].join('');
      const legacyEmail = ['terry', 'private-mail.example'].join('@');

      writeFileSync(resolve(repoRoot, 'docs/identity.md'), 'identity history\n');
      runTempRepoGit(repoRoot, ['config', 'user.name', legacyName]);
      runTempRepoGit(repoRoot, ['config', 'user.email', legacyEmail]);
      runTempRepoGit(repoRoot, ['add', '.']);
      runTempRepoGit(repoRoot, ['commit', '-m', 'identity residue'], {
        GIT_AUTHOR_NAME: legacyName,
        GIT_AUTHOR_EMAIL: legacyEmail,
        GIT_COMMITTER_NAME: legacyName,
        GIT_COMMITTER_EMAIL: legacyEmail,
      });

      const findings = scanGitHistory(repoRoot);

      expect(findings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ruleId: 'personal-history-identity' }),
        ])
      );
      expect(findings.some((finding) => finding.excerpt.includes(legacyName))).toBe(
        true
      );
    });
  });

  it('allows the current public github noreply commit identity', () => {
    withTempGitRepo((repoRoot) => {
      mkdirSync(resolve(repoRoot, 'docs'), { recursive: true });
      const publicName = ['Yi', 'feng', '[Ter', 'ry]', ' Yu'].join('');
      const publicHandle = ['xiao', 'jiou', '176'].join('');
      const publicEmail = [
        `125581657+${publicHandle}`,
        ['users', 'noreply', 'github', 'com'].join('.'),
      ].join('@');
      const githubCommitterEmail = ['noreply', 'github.com'].join('@');

      writeFileSync(resolve(repoRoot, 'docs/identity.md'), 'public identity history\n');
      runTempRepoGit(repoRoot, ['add', '.']);
      runTempRepoGit(repoRoot, ['commit', '-m', 'public identity ok'], {
        GIT_AUTHOR_NAME: publicName,
        GIT_AUTHOR_EMAIL: publicEmail,
        GIT_COMMITTER_NAME: 'GitHub',
        GIT_COMMITTER_EMAIL: githubCommitterEmail,
      });

      const findings = scanGitHistory(repoRoot);

      expect(
        findings.some((finding) => finding.ruleId === 'personal-history-identity')
      ).toBe(false);
    });
  });
});
