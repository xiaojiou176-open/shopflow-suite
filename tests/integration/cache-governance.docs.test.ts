import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveFromRepo } from '../support/repo-paths';

function readRepoFile(path: string) {
  return readFileSync(resolveFromRepo(path), 'utf8');
}

describe('cache and runtime governance docs coherence', () => {
  it('keeps cache boundary language aligned across primary docs', () => {
    const readme = readRepoFile('README.md');
    const docsReadme = readRepoFile('docs/README.md');
    const toolingReadme = readRepoFile('tooling/README.md');
    const agents = readRepoFile('AGENTS.md');

    for (const content of [toolingReadme, agents]) {
      expect(content).toContain('~/.cache/shopflow');
      expect(content).toContain('.runtime-cache');
    }

    expect(readme).not.toContain('~/.cache/shopflow');
    expect(readme).not.toContain('.runtime-cache/live-browser');
    expect(docsReadme).not.toContain('~/.cache/shopflow');
    expect(docsReadme).not.toContain('browser/chrome-user-data');
    expect(docsReadme).toContain('MCP Quickstart');

    for (const content of [toolingReadme, agents]) {
      expect(content).toContain('browser/chrome-user-data');
    }

    expect(readme).not.toContain('browser/chrome-user-data');
  });

  it('keeps hosted CI and canonical live profile wording aligned', () => {
    const readme = readRepoFile('README.md');
    const agents = readRepoFile('AGENTS.md');
    const liveRunbook = readRepoFile('docs/runbooks/live-receipt-capture.md');
    const workflow = readRepoFile('.github/workflows/ci.yml');
    const npmrc = readRepoFile('.npmrc');

    expect(readme).toContain('## Verification Boundary');
    expect(readme).toContain('repo-owned verification');
    expect(readme).toContain('reviewed live evidence');
    expect(readme).not.toContain('Profile 1');
    expect(readme).not.toContain('~/.cache/shopflow/browser/chrome-user-data');
    expect(readme).not.toContain('pnpm operator-capture-packet:live');
    expect(agents).toContain('ubuntu-latest');
    expect(agents).toContain('self-hosted');
    expect(liveRunbook).toContain('Live Receipt Evidence Boundary');
    expect(liveRunbook).toContain('repo-verified');
    expect(liveRunbook).toContain('public-claim-ready');
    expect(liveRunbook).not.toContain('Profile 1');
    expect(liveRunbook).not.toContain('browser:seed-profile');
    expect(workflow).toContain('ubuntu-latest');
    expect(workflow).not.toContain('self-hosted');
    expect(npmrc).toContain('.cache/shopflow/pnpm-store');
    expect(npmrc).not.toContain('movi-shared-runners');
  });
});
