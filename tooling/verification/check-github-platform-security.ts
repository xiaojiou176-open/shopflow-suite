import {
  collectGitHubPlatformSecuritySummary,
  formatGitHubPlatformSecuritySummary,
  hasBlockingGitHubPlatformSecurityFinding,
  writeGitHubPlatformSecuritySummary,
} from './github-platform-security';

function main() {
  const summary = collectGitHubPlatformSecuritySummary();
  process.stdout.write(formatGitHubPlatformSecuritySummary(summary));
  writeGitHubPlatformSecuritySummary(summary);

  if (hasBlockingGitHubPlatformSecurityFinding(summary)) {
    process.exit(1);
  }
}

main();
