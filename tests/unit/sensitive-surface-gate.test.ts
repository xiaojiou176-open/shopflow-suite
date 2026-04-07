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

function withTempGitRepo(run: (repoRoot: string) => void) {
  const repoRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-sensitive-gate-'));
  const originalCwd = process.cwd();

  try {
    execFileSync('git', ['init'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    execFileSync('git', ['config', 'user.name', 'Shopflow Test'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    execFileSync('git', ['config', 'user.email', ['shopflow', 'example.com'].join('@')], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
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

      process.chdir(repoRoot);
      const findings = scanCurrentSurface();

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
      execFileSync('git', ['add', '.'], { cwd: repoRoot, encoding: 'utf8' });
      execFileSync('git', ['commit', '-m', 'clean'], {
        cwd: repoRoot,
        encoding: 'utf8',
      });

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
      execFileSync('git', ['add', '.'], { cwd: repoRoot, encoding: 'utf8' });
      execFileSync('git', ['commit', '-m', 'introduce leak'], {
        cwd: repoRoot,
        encoding: 'utf8',
      });

      writeFileSync(resolve(repoRoot, 'docs/history.md'), 'clean again\n');
      execFileSync('git', ['add', '.'], { cwd: repoRoot, encoding: 'utf8' });
      execFileSync('git', ['commit', '-m', 'clean leak'], {
        cwd: repoRoot,
        encoding: 'utf8',
      });

      process.chdir(repoRoot);
      const findings = scanGitHistory();

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
      const legacyHandle = ['xiao', 'jiou', '176'].join('');
      const legacyEmail = [
        `125581657+${legacyHandle}`,
        ['users', 'noreply', 'github', 'com'].join('.'),
      ].join('@');

      writeFileSync(resolve(repoRoot, 'docs/identity.md'), 'identity history\n');
      execFileSync('git', ['config', 'user.name', legacyName], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      execFileSync('git', ['config', 'user.email', legacyEmail], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      execFileSync('git', ['add', '.'], { cwd: repoRoot, encoding: 'utf8' });
      execFileSync('git', ['commit', '-m', 'identity residue'], {
        cwd: repoRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: legacyName,
          GIT_AUTHOR_EMAIL: legacyEmail,
          GIT_COMMITTER_NAME: legacyName,
          GIT_COMMITTER_EMAIL: legacyEmail,
        },
      });

      process.chdir(repoRoot);
      const findings = scanGitHistory();

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
});
