import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  formatFindings,
  scanCurrentSurface,
  scanGitHistory,
  scanTextContent,
  type SensitiveFinding,
} from './sensitive-surface-gate';

const privateRepos = ['xiaojiou176/shopflow-suite'] as const;
const publicRepos = [
  'xiaojiou176/shopflow-public-packets',
  'xiaojiou176/shopflow-openclaw-plugin',
] as const;

type RepoView = {
  isPrivate: boolean;
  visibility: string;
  url: string;
};

type GitHubTextRecord = {
  number?: number;
  title?: string;
  body?: string;
  url?: string;
  tag_name?: string;
  name?: string;
  html_url?: string;
  pull_request?: { url?: string };
};

export type PublicSurfaceOps = {
  viewRepo: (repo: string) => RepoView;
  cloneRepo: (repo: string) => string;
  scanCurrent: (cwd: string) => SensitiveFinding[];
  scanHistory: (cwd: string) => SensitiveFinding[];
  listIssues: (repo: string) => GitHubTextRecord[];
  listPulls: (repo: string) => GitHubTextRecord[];
  listReleases: (repo: string) => GitHubTextRecord[];
  cleanupClone: (cwd: string) => void;
};

export function runGhJson<T>(args: string[]) {
  const tokenResult = spawnSync('gh', ['auth', 'token'], {
    encoding: 'utf8',
  });
  const ghToken =
    process.env.GH_TOKEN ||
    process.env.GITHUB_TOKEN ||
    (tokenResult.status === 0 ? tokenResult.stdout.trim() : '');
  const result = spawnSync('gh', args, {
    encoding: 'utf8',
    env: ghToken
      ? {
          ...process.env,
          GH_TOKEN: ghToken,
          GITHUB_TOKEN: ghToken,
        }
      : process.env,
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `GitHub CLI call failed: gh ${args.join(' ')}`);
  }

  return JSON.parse(result.stdout) as T;
}

export function clonePublicRepo(repo: string) {
  const cloneRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-public-scan-'));
  const cloneResult = spawnSync(
    'git',
    ['clone', '--quiet', `https://github.com/${repo}`, cloneRoot],
    {
      encoding: 'utf8',
    }
  );

  if (cloneResult.status !== 0) {
    rmSync(cloneRoot, { recursive: true, force: true });
    throw new Error(
      cloneResult.stderr || `Failed to clone public repo https://github.com/${repo}`
    );
  }

  return cloneRoot;
}

export function scanGitHubTextSurface(
  surface: string,
  textItems: Array<{ path: string; content: string }>
) {
  const findings: SensitiveFinding[] = [];

  for (const item of textItems) {
    findings.push(...scanTextContent(`${surface}:${item.path}`, item.content));
  }

  return findings;
}

export function createPublicSurfaceOps(
  ghJson = runGhJson,
  cloneRepo = clonePublicRepo
): PublicSurfaceOps {
  return {
    viewRepo: (repo) => {
      const repoView = ghJson<{
        private: boolean;
        visibility: string;
        html_url: string;
      }>(['api', `repos/${repo}`]);

      return {
        isPrivate: repoView.private,
        visibility: repoView.visibility,
        url: repoView.html_url,
      };
    },
    cloneRepo,
    scanCurrent: (cwd) => {
      const originalCwd = process.cwd();
      try {
        process.chdir(cwd);
        return scanCurrentSurface();
      } finally {
        process.chdir(originalCwd);
      }
    },
    scanHistory: (cwd) => {
      const originalCwd = process.cwd();
      try {
        process.chdir(cwd);
        return scanGitHistory();
      } finally {
        process.chdir(originalCwd);
      }
    },
    listIssues: (repo) =>
      ghJson<GitHubTextRecord[]>([
        'api',
        `repos/${repo}/issues?state=all&per_page=100`,
      ]).filter((issue) => !issue.pull_request),
    listPulls: (repo) =>
      ghJson<GitHubTextRecord[]>([
        'api',
        `repos/${repo}/pulls?state=all&per_page=100`,
      ]),
    listReleases: (repo) =>
      ghJson<GitHubTextRecord[]>(['api', `repos/${repo}/releases?per_page=100`]),
    cleanupClone: (cwd) => {
      rmSync(cwd, { recursive: true, force: true });
    },
  };
}

export const defaultOps: PublicSurfaceOps = createPublicSurfaceOps();

export function collectPublicSurfaceFindings(
  ops: PublicSurfaceOps = defaultOps
) {
  const findings: SensitiveFinding[] = [];

  for (const repo of privateRepos) {
    const repoView = ops.viewRepo(repo);

    if (!repoView.isPrivate) {
      findings.push({
        ruleId: 'unexpected-public-repo',
        file: repoView.url,
        line: null,
        source: 'path',
        excerpt: `Expected ${repo} to stay private, but visibility is ${repoView.visibility}.`,
      });
    }
  }

  for (const repo of publicRepos) {
    const repoView = ops.viewRepo(repo);

    if (repoView.isPrivate || repoView.visibility.toUpperCase() !== 'PUBLIC') {
      findings.push({
        ruleId: 'public-surface-unavailable',
        file: repoView.url,
        line: null,
        source: 'path',
        excerpt: `Expected ${repo} to be public, but visibility is ${repoView.visibility}.`,
      });
      continue;
    }

    const cloneRoot = ops.cloneRepo(repo);

    try {
      findings.push(...ops.scanCurrent(cloneRoot));
      findings.push(...ops.scanHistory(cloneRoot));
    } finally {
      ops.cleanupClone(cloneRoot);
    }

    const issues = ops.listIssues(repo);
    const pulls = ops.listPulls(repo);
    const releases = ops.listReleases(repo);

    findings.push(
      ...scanGitHubTextSurface(repo, [
        ...issues.map((issue) => ({
          path: `issue-${issue.number}`,
          content: `${issue.title}\n${issue.body ?? ''}\n${issue.url}`,
        })),
        ...pulls.map((pull) => ({
          path: `pr-${pull.number}`,
          content: `${pull.title}\n${pull.body ?? ''}\n${pull.url}`,
        })),
        ...releases.map((release) => ({
          path: `release-${release.tag_name ?? 'untagged'}`,
          content: `${release.name ?? ''}\n${release.body ?? ''}\n${release.html_url}`,
        })),
      ])
    );
  }

  return findings;
}

async function main() {
  const findings = collectPublicSurfaceFindings();

  if (findings.length > 0) {
    console.error(formatFindings(findings, 'Sensitive public-surface gate'));
    process.exit(1);
  }

  process.stdout.write('Sensitive public-surface gate: no findings\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
