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
    const diskRunbook = readRepoFile('docs/runbooks/disk-footprint-governance.md');
    const toolingReadme = readRepoFile('tooling/README.md');
    const agents = readRepoFile('AGENTS.md');

    for (const content of [readme, docsReadme, diskRunbook, toolingReadme, agents]) {
      expect(content).toContain('~/.cache/shopflow');
      expect(content).toContain('.runtime-cache');
    }

    for (const content of [readme, diskRunbook, toolingReadme]) {
      expect(content).toContain('browser/chrome-user-data');
    }
  });

  it('keeps hosted CI and canonical live profile wording aligned', () => {
    const readme = readRepoFile('README.md');
    const diskRunbook = readRepoFile('docs/runbooks/disk-footprint-governance.md');
    const liveRunbook = readRepoFile('docs/runbooks/live-receipt-capture.md');
    const workflow = readRepoFile('.github/workflows/ci.yml');
    const npmrc = readRepoFile('.npmrc');

    expect(readme).toContain('Profile 1');
    expect(readme).toContain('shopflow');
    expect(readme).toContain('~/.cache/shopflow/browser/chrome-user-data');
    expect(diskRunbook).toContain('ubuntu-latest');
    expect(diskRunbook).toContain('self-hosted');
    expect(liveRunbook).toContain('Profile 1');
    expect(liveRunbook).toContain('shopflow');
    expect(liveRunbook).toContain('browser:seed-profile');
    expect(workflow).toContain('ubuntu-latest');
    expect(workflow).not.toContain('self-hosted');
    expect(npmrc).toContain('.cache/shopflow/pnpm-store');
    expect(npmrc).not.toContain('movi-shared-runners');
  });
});
