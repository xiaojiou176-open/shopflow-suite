import { appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

export type GitHubPlatformCapabilityName =
  | 'code-scanning'
  | 'secret-scanning'
  | 'dependabot-alerts'
  | 'vulnerability-alerts';

export type GitHubPlatformCapabilityStatus =
  | 'enabled'
  | 'disabled'
  | 'alerts-open'
  | 'unexpected-error';

export type GitHubPlatformCapabilityResult = {
  capability: GitHubPlatformCapabilityName;
  status: GitHubPlatformCapabilityStatus;
  message: string;
  openAlertCount: number | null;
};

export type GitHubPlatformSecuritySummary = {
  repoSlug: string;
  visibility: string;
  isPrivate: boolean;
  capabilities: GitHubPlatformCapabilityResult[];
};

export type CommandResult = {
  status: number;
  stdout: string;
  stderr: string;
};

export type GitHubPlatformSecurityOps = {
  runGh: (args: string[]) => CommandResult;
  runGit: (args: string[]) => CommandResult;
};

export const defaultOps: GitHubPlatformSecurityOps = {
  runGh: (args) => {
    const result = spawnSync('gh', args, {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    return {
      status: result.status ?? 1,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
    };
  },
  runGit: (args) => {
    const result = spawnSync('git', args, {
      cwd: process.cwd(),
      encoding: 'utf8',
    });

    return {
      status: result.status ?? 1,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
    };
  },
};

const capabilityDefinitions: Array<{
  capability: GitHubPlatformCapabilityName;
  endpoint: (repoSlug: string) => string;
}> = [
  {
    capability: 'code-scanning',
    endpoint: (repoSlug) =>
      `repos/${repoSlug}/code-scanning/alerts?state=open&per_page=100`,
  },
  {
    capability: 'secret-scanning',
    endpoint: (repoSlug) =>
      `repos/${repoSlug}/secret-scanning/alerts?state=open&per_page=100`,
  },
  {
    capability: 'dependabot-alerts',
    endpoint: (repoSlug) =>
      `repos/${repoSlug}/dependabot/alerts?state=open&per_page=100`,
  },
  {
    capability: 'vulnerability-alerts',
    endpoint: (repoSlug) => `repos/${repoSlug}/vulnerability-alerts`,
  },
];

function normalizeMessage(result: CommandResult) {
  return `${result.stderr}\n${result.stdout}`.trim();
}

export function inferRepoSlugFromRemote(remoteUrl: string) {
  const trimmed = remoteUrl.trim();

  const sshMatch = trimmed.match(/^git@github\.com:([^/]+\/[^/.]+)(?:\.git)?$/);
  if (sshMatch) {
    return sshMatch[1];
  }

  const httpsMatch = trimmed.match(
    /^https:\/\/github\.com\/([^/]+\/[^/.]+)(?:\.git)?$/
  );
  if (httpsMatch) {
    return httpsMatch[1];
  }

  return null;
}

function classifyDisabledCapability(
  capability: GitHubPlatformCapabilityName,
  result: CommandResult
) {
  const message = normalizeMessage(result);

  if (
    capability === 'code-scanning' &&
    /code scanning is not enabled/i.test(message)
  ) {
    return {
      capability,
      status: 'disabled',
      message,
      openAlertCount: null,
    } satisfies GitHubPlatformCapabilityResult;
  }

  if (
    capability === 'secret-scanning' &&
    /secret scanning is disabled/i.test(message)
  ) {
    return {
      capability,
      status: 'disabled',
      message,
      openAlertCount: null,
    } satisfies GitHubPlatformCapabilityResult;
  }

  if (
    capability === 'dependabot-alerts' &&
    /dependabot alerts are disabled/i.test(message)
  ) {
    return {
      capability,
      status: 'disabled',
      message,
      openAlertCount: null,
    } satisfies GitHubPlatformCapabilityResult;
  }

  if (
    capability === 'vulnerability-alerts' &&
    /vulnerability alerts are disabled/i.test(message)
  ) {
    return {
      capability,
      status: 'disabled',
      message,
      openAlertCount: null,
    } satisfies GitHubPlatformCapabilityResult;
  }

  return null;
}

export function classifyCapabilityResult(
  capability: GitHubPlatformCapabilityName,
  result: CommandResult
): GitHubPlatformCapabilityResult {
  if (result.status === 0) {
    if (capability === 'vulnerability-alerts') {
      return {
        capability,
        status: 'enabled',
        message: 'enabled',
        openAlertCount: null,
      };
    }

    const parsed = JSON.parse(result.stdout || '[]') as unknown[];
    const openAlertCount = Array.isArray(parsed) ? parsed.length : 0;

    return {
      capability,
      status: openAlertCount > 0 ? 'alerts-open' : 'enabled',
      message:
        openAlertCount > 0
          ? `${openAlertCount} open alert(s)`
          : 'enabled with 0 open alerts',
      openAlertCount,
    };
  }

  const disabled = classifyDisabledCapability(capability, result);
  if (disabled) {
    return disabled;
  }

  return {
    capability,
    status: 'unexpected-error',
    message: normalizeMessage(result),
    openAlertCount: null,
  };
}

function getRepoSlug(ops: GitHubPlatformSecurityOps) {
  const repoFromEnv = process.env.GITHUB_REPOSITORY?.trim();
  if (repoFromEnv) {
    return repoFromEnv;
  }

  const remote = ops.runGit(['remote', 'get-url', 'origin']);
  if (remote.status !== 0) {
    throw new Error(normalizeMessage(remote) || 'Failed to read origin remote URL.');
  }

  const repoSlug = inferRepoSlugFromRemote(remote.stdout);
  if (!repoSlug) {
    throw new Error(`Could not infer repo slug from origin URL: ${remote.stdout.trim()}`);
  }

  return repoSlug;
}

export function collectGitHubPlatformSecuritySummary(
  ops: GitHubPlatformSecurityOps = defaultOps
): GitHubPlatformSecuritySummary {
  const repoSlug = getRepoSlug(ops);

  const repoView = ops.runGh([
    'api',
    `repos/${repoSlug}`,
    '--jq',
    '{visibility:.visibility, private:.private}',
  ]);

  if (repoView.status !== 0) {
    throw new Error(
      normalizeMessage(repoView) || `Failed to read repository metadata for ${repoSlug}.`
    );
  }

  const repoMetadata = JSON.parse(repoView.stdout) as {
    visibility: string;
    private: boolean;
  };

  const capabilities = capabilityDefinitions.map(({ capability, endpoint }) =>
    classifyCapabilityResult(capability, ops.runGh(['api', endpoint(repoSlug)]))
  );

  return {
    repoSlug,
    visibility: repoMetadata.visibility,
    isPrivate: repoMetadata.private,
    capabilities,
  };
}

export function formatGitHubPlatformSecuritySummary(
  summary: GitHubPlatformSecuritySummary
) {
  const lines = [
    `GitHub platform security summary for ${summary.repoSlug}`,
    `- visibility: ${summary.visibility}`,
  ];

  for (const capability of summary.capabilities) {
    const countSuffix =
      capability.openAlertCount === null
        ? ''
        : ` (${capability.openAlertCount} open alert${capability.openAlertCount === 1 ? '' : 's'})`;
    lines.push(
      `- ${capability.capability}: ${capability.status}${countSuffix} :: ${capability.message}`
    );
  }

  return `${lines.join('\n')}\n`;
}

export function writeGitHubPlatformSecuritySummary(
  summary: GitHubPlatformSecuritySummary
) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }

  const markdown = [
    `## GitHub platform security summary`,
    ``,
    `| capability | status | details |`,
    `| :--- | :--- | :--- |`,
    ...summary.capabilities.map((capability) => {
      const details =
        capability.openAlertCount === null
          ? capability.message
          : `${capability.message} (${capability.openAlertCount} open alert${capability.openAlertCount === 1 ? '' : 's'})`;
      return `| \`${capability.capability}\` | \`${capability.status}\` | ${details.replace(/\n+/g, ' ')} |`;
    }),
    ``,
    `Repo visibility: \`${summary.visibility}\``,
    ``,
  ].join('\n');
  appendFileSync(summaryPath, markdown, 'utf8');
}

export function hasBlockingGitHubPlatformSecurityFinding(
  summary: GitHubPlatformSecuritySummary
) {
  return summary.capabilities.some(
    (capability) =>
      capability.status === 'alerts-open' ||
      capability.status === 'unexpected-error'
  );
}
