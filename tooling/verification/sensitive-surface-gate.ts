import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { spawnSync } from 'node:child_process';

export type SensitiveFinding = {
  ruleId: string;
  file: string;
  line: number | null;
  source: 'content' | 'path';
  excerpt: string;
  commit?: string;
};

type TextRule = {
  ruleId: string;
  regex: RegExp;
};

type HistoryIdentityRule = {
  ruleId: string;
  regex: RegExp;
};

const textRules: TextRule[] = [
  {
    ruleId: 'github-token',
    regex: /\bghp_[A-Za-z0-9]{20,}\b/g,
  },
  {
    ruleId: 'github-pat',
    regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  },
  {
    ruleId: 'openai-key',
    regex: /\bsk-[A-Za-z0-9]{20,}\b/g,
  },
  {
    ruleId: 'aws-access-key',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    ruleId: 'google-api-key',
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    ruleId: 'slack-token',
    regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
  },
  {
    ruleId: 'private-key-block',
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
  },
];

const emailPattern =
  /\b[A-Za-z0-9._%+-]+@(?!\d+x\.(?:jpg|jpeg|png|gif|svg|webp|avif)\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

const sensitiveFieldPattern =
  /(?:api[_-]?key(?:production)?|client[_-]?secret|access[_-]?token|private[_-]?key|password|passwd|token|secret)\s*["']?\s*[:=]\s*["']([A-Za-z0-9_-]{24,}|[a-f0-9]{32,})["']/i;

const blockedPathMatchers = [
  /(^|\/)\.env($|\.(?!example$)[^/]+$)/i,
  /(^|\/)logs?\//i,
  /(^|\/)(playwright-report|test-results|coverage)\//i,
  /(^|\/)(id_rsa|id_dsa|id_ed25519)$/i,
];

const blockedExtensions = new Set([
  '.log',
  '.har',
  '.sqlite',
  '.db',
  '.trace',
  '.bak',
  '.pem',
  '.p12',
  '.key',
  '.crt',
  '.cer',
]);

// Repo-local scrub list for author/committer metadata that must never remain in
// reachable Git history after a privacy cleanup.
const historyIdentityRules: HistoryIdentityRule[] = [
  {
    ruleId: 'personal-history-identity',
    regex: /\bYifeng(?:\[Terry\])?\s+Yu\b/i,
  },
  {
    ruleId: 'personal-history-identity',
    regex: /\bxiaojiou176\b/i,
  },
  {
    ruleId: 'personal-history-identity',
    regex: /\b(?:125581657\+)?xiaojiou176@users\.noreply\.github\.com\b/i,
  },
];

function runGit(args: string[]) {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  return result;
}

function isBinary(buffer: Buffer) {
  return buffer.includes(0);
}

function isPlaceholderValue(value: string) {
  return (
    /^0+$/.test(value) ||
    /^x+$/i.test(value) ||
    /(example|fixture|dummy|placeholder|sample|test)/i.test(value)
  );
}

function normalizeExcerpt(line: string) {
  return line.trim().slice(0, 180);
}

function scanAbsoluteUserPathLine(
  file: string,
  line: string,
  lineNumber: number,
  commit?: string
) {
  const matches = line.match(
    /(\/Users\/[^/\s]+|\/home\/[^/\s]+|[A-Za-z]:\\Users\\[^\\\s]+)/g
  );
  if (!matches) {
    return [];
  }

  if (matches.some((match) => match.includes('<name>'))) {
    return [];
  }

  return [
    {
      ruleId: 'absolute-user-path',
      file,
      line: lineNumber,
      source: 'content' as const,
      excerpt: normalizeExcerpt(line),
      commit,
    },
  ];
}

function scanEmailLine(
  file: string,
  line: string,
  lineNumber: number,
  commit?: string
) {
  const matches = line.match(emailPattern);
  if (!matches) {
    return [];
  }

  const assetLikeTlds = new Set([
    'jpg',
    'jpeg',
    'png',
    'gif',
    'svg',
    'webp',
    'avif',
    'js',
    'css',
    'html',
  ]);

  return matches
    .filter((match) => {
      const tld = match.split('.').at(-1)?.toLowerCase() ?? '';
      if (assetLikeTlds.has(tld)) {
        return false;
      }

      return !/@\d+x\.(?:jpg|jpeg|png|gif|svg|webp|avif)\b/i.test(line);
    })
    .map(() => ({
      ruleId: 'email-address',
      file,
      line: lineNumber,
      source: 'content' as const,
      excerpt: normalizeExcerpt(line),
      commit,
    }));
}

function scanSensitiveFieldLine(
  file: string,
  line: string,
  lineNumber: number,
  commit?: string
) {
  const match = line.match(sensitiveFieldPattern);
  if (!match) {
    return [];
  }

  const value = match[1] ?? '';
  if (isPlaceholderValue(value)) {
    return [];
  }

  return [
    {
      ruleId: 'high-entropy-sensitive-field',
      file,
      line: lineNumber,
      source: 'content' as const,
      excerpt: normalizeExcerpt(line),
      commit,
    },
  ];
}

export function scanTextContent(
  file: string,
  text: string,
  commit?: string
): SensitiveFinding[] {
  const findings: SensitiveFinding[] = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    for (const rule of textRules) {
      rule.regex.lastIndex = 0;
      if (!rule.regex.test(line)) {
        continue;
      }

      findings.push({
        ruleId: rule.ruleId,
        file,
        line: lineNumber,
        source: 'content',
        excerpt: normalizeExcerpt(line),
        commit,
      });
    }

    findings.push(...scanAbsoluteUserPathLine(file, line, lineNumber, commit));
    findings.push(...scanEmailLine(file, line, lineNumber, commit));
    findings.push(...scanSensitiveFieldLine(file, line, lineNumber, commit));
  });

  return findings;
}

export function scanPathOnly(file: string, commit?: string): SensitiveFinding[] {
  const findings: SensitiveFinding[] = [];
  const ext = extname(file).toLowerCase();
  const base = basename(file);

  if (blockedExtensions.has(ext)) {
    findings.push({
      ruleId: 'blocked-sensitive-extension',
      file,
      line: null,
      source: 'path',
      excerpt: file,
      commit,
    });
  }

  if (base === '.env') {
    findings.push({
      ruleId: 'blocked-env-file',
      file,
      line: null,
      source: 'path',
      excerpt: file,
      commit,
    });
  }

  for (const matcher of blockedPathMatchers) {
    if (!matcher.test(file)) {
      continue;
    }

    findings.push({
      ruleId: 'blocked-sensitive-path',
      file,
      line: null,
      source: 'path',
      excerpt: file,
      commit,
    });
    break;
  }

  return findings;
}

function dedupeFindings(findings: SensitiveFinding[]) {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = [
      finding.ruleId,
      finding.commit ?? '',
      finding.file,
      finding.line ?? '',
      finding.excerpt,
    ].join('::');

    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function listCurrentSurfaceFiles() {
  const result = runGit(['ls-files', '--cached', '--others', '--exclude-standard', '-z']);
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Failed to list repo files.');
  }

  return result.stdout
    .split('\0')
    .map((file) => file.trim())
    .filter(Boolean);
}

export function scanCurrentSurface(): SensitiveFinding[] {
  const findings: SensitiveFinding[] = [];

  for (const file of listCurrentSurfaceFiles()) {
    findings.push(...scanPathOnly(file));

    const buffer = readFileSync(file);
    if (isBinary(buffer)) {
      continue;
    }

    findings.push(...scanTextContent(file, buffer.toString('utf8')));
  }

  return dedupeFindings(findings);
}

function listHistoryTrackedPaths() {
  const result = runGit(['log', '--all', '--name-only', '--pretty=format:']);
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Failed to list history paths.');
  }

  return Array.from(
    new Set(
      result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    )
  );
}

function batch<T>(items: T[], size: number) {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function runHistoryContentScan(
  pattern: string,
  ruleId: string,
  options: { ignoreCase?: boolean } = {}
) {
  const commitsResult = runGit(['rev-list', '--all']);
  if (commitsResult.status !== 0) {
    throw new Error(commitsResult.stderr || 'Failed to list git history.');
  }

  const commits = commitsResult.stdout
    .split(/\r?\n/)
    .map((commit) => commit.trim())
    .filter(Boolean);

  const findings: SensitiveFinding[] = [];

  for (const chunk of batch(commits, 64)) {
    const grepArgs = ['grep', '-nI', '-P'];
    if (options.ignoreCase) {
      grepArgs.push('-i');
    }
    grepArgs.push('-e', pattern, ...chunk, '--');

    const grepResult = runGit(grepArgs);
    if (grepResult.status !== 0 && grepResult.status !== 1) {
      throw new Error(grepResult.stderr || `Failed history grep for ${ruleId}.`);
    }

    const lines = grepResult.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      const firstColon = line.indexOf(':');
      const secondColon = line.indexOf(':', firstColon + 1);
      const thirdColon = line.indexOf(':', secondColon + 1);
      if (firstColon === -1 || secondColon === -1 || thirdColon === -1) {
        continue;
      }

      const commit = line.slice(0, firstColon);
      const file = line.slice(firstColon + 1, secondColon);
      const lineNumber = Number.parseInt(
        line.slice(secondColon + 1, thirdColon),
        10
      );
      const excerpt = normalizeExcerpt(line.slice(thirdColon + 1));

      findings.push({
        ruleId,
        file,
        line: Number.isFinite(lineNumber) ? lineNumber : null,
        source: 'content',
        excerpt,
        commit,
      });
    }
  }

  return findings;
}

function scanHistoryIdentityMetadata() {
  const result = runGit([
    'log',
    '--all',
    '--format=%H%x09%an%x09%ae%x09%cn%x09%ce',
  ]);
  if (result.status !== 0) {
    throw new Error(result.stderr || 'Failed to scan git identity metadata.');
  }

  const findings: SensitiveFinding[] = [];
  const lines = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const [commit, authorName, authorEmail, committerName, committerEmail] =
      line.split('\t');
    if (!commit || !authorName || !authorEmail || !committerName || !committerEmail) {
      continue;
    }

    const identityText = `${authorName} <${authorEmail}> | ${committerName} <${committerEmail}>`;
    for (const rule of historyIdentityRules) {
      rule.regex.lastIndex = 0;
      if (!rule.regex.test(identityText)) {
        continue;
      }

      findings.push({
        ruleId: rule.ruleId,
        file: 'git-metadata',
        line: null,
        source: 'content',
        excerpt: identityText,
        commit,
      });
    }
  }

  return findings;
}

export function scanGitHistory(): SensitiveFinding[] {
  const findings: SensitiveFinding[] = [];

  for (const file of listHistoryTrackedPaths()) {
    findings.push(...scanPathOnly(file));
  }

  for (const rule of textRules) {
    findings.push(...runHistoryContentScan(rule.regex.source, rule.ruleId));
  }

  findings.push(
    ...runHistoryContentScan(
      String.raw`(\/Users\/[^/\s]+|\/home\/[^/\s]+|[A-Za-z]:\\Users\\[^\\\s]+)`,
      'absolute-user-path'
    ).filter((finding) => !finding.excerpt.includes('<name>'))
  );

  findings.push(
    ...runHistoryContentScan(
      emailPattern.source,
      'email-address'
    ).filter((finding) => {
      const assetLikeTlds = new Set([
        'jpg',
        'jpeg',
        'png',
        'gif',
        'svg',
        'webp',
        'avif',
        'js',
        'css',
        'html',
      ]);
      const tokens = finding.excerpt.match(emailPattern);
      const tld = tokens?.[0]?.split('.').at(-1)?.toLowerCase() ?? '';
      if (assetLikeTlds.has(tld)) {
        return false;
      }

      return true;
    })
  );

  findings.push(
    ...runHistoryContentScan(
      sensitiveFieldPattern.source,
      'high-entropy-sensitive-field',
      {
        ignoreCase: sensitiveFieldPattern.flags.includes('i'),
      }
    ).filter((finding) => {
      const valueMatch = finding.excerpt.match(
        /["']([A-Za-z0-9_-]{24,}|[a-f0-9]{32,})["']/i
      );
      const value = valueMatch?.[1] ?? '';
      return !isPlaceholderValue(value);
    })
  );

  findings.push(...scanHistoryIdentityMetadata());

  return dedupeFindings(findings);
}

export function formatFindings(findings: SensitiveFinding[], label: string) {
  if (findings.length === 0) {
    return `${label}: no findings`;
  }

  const lines = [`${label}: ${findings.length} finding(s)`];
  for (const finding of findings.slice(0, 50)) {
    const location = finding.commit
      ? `${finding.commit}:${finding.file}:${finding.line ?? 0}`
      : `${finding.file}:${finding.line ?? 0}`;
    lines.push(`- [${finding.ruleId}] ${location} :: ${finding.excerpt}`);
  }

  if (findings.length > 50) {
    lines.push(`- ... ${findings.length - 50} more finding(s) omitted`);
  }

  return lines.join('\n');
}
