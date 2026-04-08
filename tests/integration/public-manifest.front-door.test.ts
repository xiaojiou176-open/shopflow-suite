import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveFromRepo } from '../support/repo-paths';

function readJson(path: string) {
  return JSON.parse(readFileSync(resolveFromRepo(path), 'utf8'));
}

function readText(path: string) {
  return readFileSync(resolveFromRepo(path), 'utf8');
}

describe('public manifest and front door', () => {
  it('keeps the root public manifest aligned with the canonical repo and MCP v1', () => {
    const manifest = readJson('public-manifest.json');
    const rootPackage = readJson('package.json');

    expect(manifest.name).toBe(rootPackage.name);
    expect(manifest.version).toBe(rootPackage.version);
    expect(manifest.license).toBe('MIT');
    expect(manifest.canonicalRepoUrl).toBe(
      'https://github.com/xiaojiou176-open/shopflow-suite'
    );
    expect(manifest.homepageUrl).toBe(
      'https://xiaojiou176-open.github.io/shopflow-suite/'
    );
    expect(manifest.productShape).toBe(
      'public canonical monorepo with read-only stdio MCP surface'
    );
    expect(manifest.mcp).toMatchObject({
      status: 'live-repo-local-stdio',
      transport: 'stdio',
      auth: 'none',
      package: {
        name: '@shopflow/mcp-server',
        version: '0.1.0',
        bin: 'shopflow-mcp',
      },
      quickstart: 'docs/ecosystem/mcp-quickstart.md',
    });
    expect(manifest.mcp.tools.map((tool: { name: string }) => tool.name)).toEqual([
      'get_integration_surface',
      'get_runtime_seam',
      'get_submission_readiness',
      'get_public_distribution_bundle',
    ]);
  });

  it('keeps README, docs front door, and Pages index aligned on the new MCP entry', () => {
    const readme = readText('README.md');
    const docsReadme = readText('docs/README.md');
    const docsIndex = readText('docs/index.md');
    const mcpQuickstart = readText('docs/ecosystem/mcp-quickstart.md');

    expect(readme).toContain('./docs/assets/shopflow-front-door.svg');
    expect(docsReadme).toContain('./assets/shopflow-front-door.svg');
    expect(docsIndex).toContain('./assets/shopflow-front-door.svg');
    expect(readme).toContain('pnpm mcp:stdio');
    expect(docsReadme).toContain('pnpm mcp:stdio');
    expect(docsIndex).toContain('./ecosystem/mcp-quickstart.md');
    expect(mcpQuickstart).toContain('read-only stdio MCP');
    expect(mcpQuickstart).toContain('get_integration_surface');
    expect(mcpQuickstart).toContain('get_runtime_seam');
    expect(mcpQuickstart).toContain('get_submission_readiness');
    expect(mcpQuickstart).toContain('get_public_distribution_bundle');
  });
});
