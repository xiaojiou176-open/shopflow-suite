import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveFromRepo } from '../support/repo-paths';

const pagesBaseUrl = new URL('https://xiaojiou176-open.github.io/shopflow-suite/');

function readJson(path: string) {
  return JSON.parse(readFileSync(resolveFromRepo(path), 'utf8'));
}

function readText(path: string) {
  return readFileSync(resolveFromRepo(path), 'utf8');
}

function findMarkdownLink(markdown: string, label: string) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = markdown.match(
    new RegExp(`\\[${escapedLabel}\\]\\(([^)]+)\\)`)
  );

  expect(match, `expected markdown link for "${label}"`).not.toBeNull();

  return match![1];
}

function expectPagesSafeFirstHop(markdown: string, label: string) {
  const href = findMarkdownLink(markdown, label);

  if (href.startsWith('https://github.com/xiaojiou176-open/shopflow-suite')) {
    expect(href).toMatch(/^https:\/\/github\.com\/xiaojiou176-open\/shopflow-suite/);
    return;
  }

  const resolved = new URL(href, pagesBaseUrl);

  expect(href).not.toMatch(/(^|\/)\.\.\//);
  expect(href).not.toMatch(/\.md([?#].*)?$/i);
  expect(resolved.pathname).toMatch(/^\/shopflow-suite(?:\/|$)/);
  expect(resolved.pathname).not.toMatch(/\.md$/i);
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
    const distribution = readText('DISTRIBUTION.md');
    const mcpQuickstart = readText('docs/ecosystem/mcp-quickstart.md');

    expect(readme).toContain('./docs/assets/shopflow-front-door.svg');
    expect(readme).toContain('./DISTRIBUTION.md');
    expect(docsReadme).toContain('./assets/shopflow-front-door.svg');
    expect(docsReadme).toContain('Product boundary');
    expect(docsReadme).toContain('Verification bar');
    expect(docsReadme).toContain('Distribution truth on GitHub');
    expect(docsIndex).toContain('./assets/shopflow-front-door.svg');
    expect(docsIndex).toContain(
      'many storefront doors, one kitchen, one truthful review shelf.'
    );
    expect(docsIndex).toContain('See the product boundary');
    expect(docsIndex).toContain('See the product feel');
    expect(docsIndex).toContain('See the verification boundary');
    expect(docsIndex).toContain('Distribution truth on GitHub');
    expect(docsIndex).toContain('Canonical README on GitHub');
    expect(docsIndex).toContain('## Need the product feel or the support desk?');
    expect(docsIndex).toContain('Release Artifact Review Runbook');
    expect(docsIndex).toContain('Open an issue');
    expect(docsIndex).toContain('Contributing on GitHub');
    expect(distribution).toContain('## Exact receipts now');
    expect(distribution).toContain('## Ready but not live yet');
    expect(distribution).toContain('## Not published yet');
    expect(distribution).toContain('## Manual later');
    expect(distribution).toContain(
      'https://clawhub.ai/xiaojiou176/shopflow-read-only-packet'
    );
    expect(distribution).toContain(
      'https://github.com/OpenHands/extensions/pull/161'
    );
    expect(distribution).toContain('count: 0');
    expect(readme).toContain('pnpm mcp:stdio');
    expect(docsReadme).toContain('pnpm mcp:stdio');
    expect(docsReadme).toContain('Builder side door');
    expect(docsIndex).toContain('Builder Start Here');
    expect(docsIndex).toContain('Evidence and submission readiness');
    expect(mcpQuickstart).toContain('read-only stdio MCP');
    expect(mcpQuickstart).toContain('get_integration_surface');
    expect(mcpQuickstart).toContain('get_runtime_seam');
    expect(mcpQuickstart).toContain('get_submission_readiness');
    expect(mcpQuickstart).toContain('get_public_distribution_bundle');
  });

  it('keeps the public first-hop CTAs Pages-safe instead of sending readers to raw markdown or 404 paths', () => {
    const docsReadme = readText('docs/README.md');
    const docsIndex = readText('docs/index.md');

    expectPagesSafeFirstHop(docsReadme, 'Product boundary');
    expectPagesSafeFirstHop(docsReadme, 'Verification bar');
    expectPagesSafeFirstHop(docsReadme, 'Builder side door');
    expectPagesSafeFirstHop(docsReadme, 'Public repo README');
    expectPagesSafeFirstHop(docsReadme, 'Distribution truth on GitHub');
    expectPagesSafeFirstHop(docsReadme, 'Evidence scorecard');

    expectPagesSafeFirstHop(docsIndex, 'See the product boundary');
    expectPagesSafeFirstHop(docsIndex, 'See the product feel');
    expectPagesSafeFirstHop(docsIndex, 'See the verification boundary');
    expectPagesSafeFirstHop(docsIndex, 'Open the latest review shelf');
    expectPagesSafeFirstHop(docsIndex, 'Builder Start Here');
    expectPagesSafeFirstHop(docsIndex, 'Evidence and submission readiness');
    expectPagesSafeFirstHop(docsIndex, 'Distribution truth on GitHub');
    expectPagesSafeFirstHop(docsIndex, 'Canonical README on GitHub');
    expectPagesSafeFirstHop(docsIndex, 'Shopflow Product Surface Spec');
    expectPagesSafeFirstHop(docsIndex, 'Release Artifact Review Runbook');
    expectPagesSafeFirstHop(docsIndex, 'Live Receipt Capture Runbook');
    expectPagesSafeFirstHop(docsIndex, 'Open an issue');
    expectPagesSafeFirstHop(docsIndex, 'Contributing on GitHub');
    expectPagesSafeFirstHop(
      docsIndex,
      'ADR-001: Repo Topology and Product Boundary'
    );
    expectPagesSafeFirstHop(docsIndex, 'Testing and Verification Bar');
    expectPagesSafeFirstHop(
      docsIndex,
      'Evidence and Submission Current-Scope Readiness'
    );
    expectPagesSafeFirstHop(docsIndex, 'Agent Quickstarts');
    expectPagesSafeFirstHop(docsIndex, 'Integration Recipes');
    expectPagesSafeFirstHop(docsIndex, 'MCP Quickstart');
  });
});
