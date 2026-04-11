import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { builderIntegrationSurface } from '../../packages/contracts/src/builder-integration-surface';
import { resolveFromRepo } from '../support/repo-paths';

function readRepoFile(path: string) {
  return readFileSync(resolveFromRepo(path), 'utf8');
}

describe('builder discoverability docs coherence', () => {
  it('keeps builder-facing docs and example entrypoints real', () => {
    const declaredPaths = new Set<string>([
      'docs/ecosystem/agent-quickstarts.md',
      'docs/ecosystem/agent-distribution-artifacts.md',
      'docs/ecosystem/codex-quickstart.md',
      'docs/ecosystem/claude-code-quickstart.md',
      'docs/ecosystem/openclaw-comparison.md',
      'docs/ecosystem/builder-start-here.md',
      'docs/ecosystem/integration-recipes.md',
      'docs/ecosystem/ready-to-sync-artifacts.md',
      'docs/ecosystem/builder-current-scope-readiness.md',
      'docs/ecosystem/evidence-submission-current-scope-readiness.md',
      'docs/ecosystem/examples/README.md',
      ...builderIntegrationSurface.surfaceCatalog.flatMap((entry) =>
        entry.entrypoints
          .filter(
            (entrypoint) =>
              entrypoint.kind === 'docs' || entrypoint.kind === 'example-json'
          )
          .map((entrypoint) => entrypoint.value)
      ),
    ]);

    for (const relativePath of declaredPaths) {
      expect(existsSync(resolveFromRepo(relativePath))).toBe(true);
    }
  });

  it('keeps the docs front door wired to the current builder entry pages', () => {
    const docsReadme = readRepoFile('docs/README.md');

    expect(docsReadme).toContain('Search-Intent Redirects');
    expect(docsReadme).toContain('Shopflow Codex plugin');
    expect(docsReadme).toContain('Shopflow Claude Code skills');
    expect(docsReadme).toContain('Shopflow OpenCode packet');
    expect(docsReadme).toContain('Shopflow OpenHands packet');
    expect(docsReadme).toContain('Shopflow MCP');
    expect(docsReadme).toContain('Shopflow OpenClaw');
    expect(docsReadme).toContain('./ecosystem/builder-start-here.md');
    expect(docsReadme).toContain('./ecosystem/agent-quickstarts.md');
    expect(docsReadme).toContain('./ecosystem/agent-distribution-artifacts.md');
    expect(docsReadme).toContain('./ecosystem/integration-recipes.md');
    expect(docsReadme).toContain('./ecosystem/examples/README.md');
    expect(docsReadme).toContain(
      './ecosystem/public-mcp-capability-map.ready.md'
    );
    expect(docsReadme).toContain('./ecosystem/public-skills-catalog.ready.md');
    expect(docsReadme).toContain(
      './ecosystem/plugin-marketplace-metadata.ready.md'
    );
    expect(docsReadme).toContain('./ecosystem/ready-to-sync-artifacts.md');
    expect(docsReadme).toContain(
      './ecosystem/builder-current-scope-readiness.md'
    );
    expect(docsReadme).toContain(
      './ecosystem/evidence-submission-current-scope-readiness.md'
    );
    expect(docsReadme).toContain(
      'pnpm cli:read-only -- agent-integration-bundle'
    );
    expect(docsReadme).toContain(
      'pnpm cli:read-only -- public-mcp-capability-map'
    );
    expect(docsReadme).toContain('pnpm cli:read-only -- public-skills-catalog');
    expect(docsReadme).toContain(
      'pnpm cli:read-only -- plugin-marketplace-metadata'
    );
    expect(docsReadme).toContain('pnpm cli:read-only -- runtime-seam');
    expect(docsReadme).toContain(
      'pnpm cli:read-only -- agent-target-packet --target opencode'
    );
    expect(docsReadme).toContain(
      'pnpm cli:read-only -- agent-target-packet --target openhands'
    );
  });

  it('keeps Codex and Claude quickstarts honest about official listing status', () => {
    const codexQuickstart = readRepoFile('docs/ecosystem/codex-quickstart.md');
    const claudeQuickstart = readRepoFile(
      'docs/ecosystem/claude-code-quickstart.md'
    );

    expect(codexQuickstart).toContain('official listing still unconfirmed');
    expect(codexQuickstart).not.toContain('official listing already confirmed');
    expect(claudeQuickstart).toContain('official listing still unconfirmed');
    expect(claudeQuickstart).not.toContain(
      'official listing already confirmed'
    );
  });

  it('keeps the root README builder lane clearly secondary to the default product story', () => {
    const readme = readRepoFile('README.md');

    expect(readme).toContain(
      'This is a **secondary** reading path, not the default repo identity.'
    );
    expect(readme).toContain('the latest review shelf');
    expect(readme).toContain('not a signed/store-ready shelf');
    expect(readme).toContain('builder-facing packets or the new read-only');
    expect(readme).toContain('./docs/ecosystem/builder-start-here.md');
    expect(readme).toContain('./docs/ecosystem/integration-recipes.md');
    expect(readme).toContain('./docs/ecosystem/agent-quickstarts.md');
    expect(readme).toContain('./docs/ecosystem/mcp-quickstart.md');
    expect(readme).toContain(
      'Target-specific quickstarts, example JSON, and ecosystem-specific packets stay'
    );
    expect(readme).not.toContain('| Target | Start page | Fastest command |');
    expect(readme).not.toContain('./docs/ecosystem/codex-quickstart.md');
    expect(readme).not.toContain('./docs/ecosystem/claude-code-quickstart.md');
    expect(readme).not.toContain('./docs/ecosystem/openclaw-comparison.md');
  });

  it('keeps the live Pages entry as a real front door instead of a thin link shelf', () => {
    const pagesIndex = readRepoFile('docs/index.md');

    expect(pagesIndex).toContain('Chrome-first shopping extension family.');
    expect(pagesIndex).toContain('many storefront doors, one kitchen.');
    expect(pagesIndex).toContain('## Shopflow In 30 Seconds');
    expect(pagesIndex).toContain('## What This Repo Is');
    expect(pagesIndex).toContain('## What Is Public Today');
    expect(pagesIndex).toContain('## Best First Route');
    expect(pagesIndex).toContain('## Builder Lane Is Real, But Secondary');
    expect(pagesIndex).toContain('https://github.com/xiaojiou176-open/shopflow-suite');
    expect(pagesIndex).toContain('https://github.com/xiaojiou176-open/shopflow-suite/releases/latest');
  });

  it('keeps the release shelf explicit about review-only truth', () => {
    const rootReadme = readRepoFile('README.md');
    const pagesIndex = readRepoFile('docs/index.md');

    expect(rootReadme).toContain('there is already a real review shelf you can inspect today.');
    expect(rootReadme).toContain('it is a reviewer shelf, not a signed/store-ready shelf.');
    expect(pagesIndex).toContain(
      'attached release shelf now works as a public review shelf'
    );
    expect(pagesIndex).toContain('not a signed store-ready shelf');
  });

  it('keeps the live-budget blocker route explicit in the front door docs', () => {
    const rootReadme = readRepoFile('README.md');
    const docsReadme = readRepoFile('docs/README.md');

    expect(rootReadme).toContain('browser main-process PID');
    expect(rootReadme).toContain('requested Shopflow user-data-dir');
    expect(rootReadme).toContain('requested debugging port');

    expect(docsReadme).toContain(
      '.runtime-cache/live-browser/open-live-browser-latest.json'
    );
    expect(docsReadme).toContain(
      'browserInstanceBudget.browserMainProcessPids'
    );
    expect(docsReadme).toContain(
      'browserInstanceBudget.matchingRequestedRootPids'
    );
    expect(docsReadme).toContain(
      'browserInstanceBudget.matchingRequestedPortPids'
    );
  });

  it('keeps ready-to-sync material explicit about not already being published', () => {
    const artifactsGuide = readRepoFile(
      'docs/ecosystem/ready-to-sync-artifacts.md'
    );
    const publicCopy = readRepoFile('docs/ecosystem/public-copy.ready.md');
    const syncBlocks = readRepoFile(
      'docs/ecosystem/ready-to-sync-public-copy.md'
    );
    const releaseBody = readRepoFile('docs/ecosystem/release-body.ready.md');

    expect(artifactsGuide).toContain('already published');
    expect(artifactsGuide).toContain('submission-readiness.json');
    expect(artifactsGuide).toContain(
      './evidence-submission-current-scope-readiness.md'
    );
    expect(publicCopy).toContain('ready-to-sync, not already synced');
    expect(syncBlocks).toContain(
      'ready-to-sync is not the same thing as already synced'
    );
    expect(releaseBody).toContain(
      'It is not proof that the release body is already published.'
    );
  });

  it('keeps the builder current-scope readiness doc branch-aware instead of claiming main already landed', () => {
    const currentScopeReadiness = readRepoFile(
      'docs/ecosystem/builder-current-scope-readiness.md'
    );

    expect(currentScopeReadiness).toContain('Branch-Aware Git Truth');
    expect(currentScopeReadiness).toContain(
      'must **not** be used as proof that local `main` has landed on `origin/main`'
    );
    expect(currentScopeReadiness).toContain(
      'branch-aware and fresh-recheck-only'
    );
    expect(currentScopeReadiness).not.toContain(
      'the current local `main` is now landed on `origin/main`'
    );
  });

  it('keeps public review-shelf assets from implying Chrome Web Store readiness', () => {
    const reviewShelfCard = readRepoFile(
      'docs/assets/shopflow-review-shelf-card.svg'
    );
    const altText = readRepoFile('docs/assets/ALT_TEXT.md');

    expect(reviewShelfCard).toContain('Review shelf, not store shelf');
    expect(reviewShelfCard).not.toContain('Chrome Web Store ready');
    expect(reviewShelfCard).toContain('signed release shelf');
    expect(reviewShelfCard).toContain('public store listing');
    expect(altText).toContain(
      'signed artifacts and public store listing receipts are still not in place'
    );
  });

  it('keeps the tooling guide aligned with the builder entry pages', () => {
    const toolingReadme = readRepoFile('tooling/README.md');

    expect(toolingReadme).toContain('docs/ecosystem/builder-start-here.md');
    expect(toolingReadme).toContain('docs/ecosystem/integration-recipes.md');
    expect(toolingReadme).toContain('docs/ecosystem/examples/README.md');
    expect(toolingReadme).toContain(
      'tooling/builder/write-builder-example-rack.ts'
    );
    expect(toolingReadme).toContain('runtime-seam');
    expect(toolingReadme).toContain('agent-target-packet');
  });

  it('keeps packages/ui consuming the core package entrypoint instead of core source files directly', () => {
    const uiFiles = [
      'packages/ui/src/ui-copy.ts',
      'packages/ui/src/popup-launcher.tsx',
      'packages/ui/src/recent-activity-copy.ts',
      'packages/ui/src/side-panel-home-page.tsx',
      'packages/ui/src/runtime-surface.tsx',
    ];

    for (const relativePath of uiFiles) {
      const contents = readRepoFile(relativePath);
      expect(contents).toContain('@shopflow/core');
      expect(contents).not.toContain('../../core/src/');
    }
  });

  it('keeps builder docs explicit about the supported multi-app current-scope payload path', () => {
    const builderReadModels = readRepoFile(
      'docs/ecosystem/builder-read-models.md'
    );
    const builderStartHere = readRepoFile(
      'docs/ecosystem/builder-start-here.md'
    );
    const integrationRecipes = readRepoFile(
      'docs/ecosystem/integration-recipes.md'
    );
    const examplesIndex = readRepoFile('docs/ecosystem/examples/README.md');

    expect(builderReadModels).toContain(
      'ext-albertsons`, `ext-amazon`, `ext-kroger`, and `ext-temu`'
    );
    expect(builderReadModels).toContain(
      'pnpm cli:read-only -- agent-integration-bundle'
    );
    expect(builderReadModels).toContain(
      'pnpm cli:read-only -- agent-target-packet --target codex'
    );
    expect(builderReadModels).toContain(
      'pnpm cli:read-only -- agent-target-packet --target claude-code'
    );
    expect(builderReadModels).toContain(
      'pnpm cli:read-only -- agent-target-packet --target openclaw'
    );
    expect(builderStartHere).toContain(
      'supported current-scope apps such as `ext-albertsons`, `ext-amazon`, `ext-kroger`, and `ext-temu`'
    );
    expect(integrationRecipes).toContain('Current example-rack apps:');
    expect(integrationRecipes).toContain('pnpm builder:refresh-example-rack');
    expect(integrationRecipes).toContain(
      'pnpm cli:read-only -- agent-target-packet --target codex'
    );
    expect(examplesIndex).toContain('ext-amazon');
    expect(examplesIndex).toContain('ext-kroger');
    expect(examplesIndex).toContain('ext-temu');
  });

  it('keeps runtime-seam entrypoints visible across the builder front door', () => {
    const builderStartHere = readRepoFile(
      'docs/ecosystem/builder-start-here.md'
    );
    const builderReadModels = readRepoFile(
      'docs/ecosystem/builder-read-models.md'
    );
    const integrationRecipes = readRepoFile(
      'docs/ecosystem/integration-recipes.md'
    );
    const builderSurfaces = readRepoFile('docs/ecosystem/builder-surfaces.md');
    const readiness = readRepoFile(
      'docs/ecosystem/builder-current-scope-readiness.md'
    );

    expect(builderStartHere).toContain('pnpm cli:read-only -- runtime-seam');
    expect(builderReadModels).toContain('pnpm cli:read-only -- runtime-seam');
    expect(integrationRecipes).toContain('pnpm cli:read-only -- runtime-seam');
    expect(builderSurfaces).toContain('pnpm cli:read-only -- runtime-seam');
    expect(builderSurfaces).toContain(
      'pnpm cli:read-only -- agent-target-packet --target codex'
    );
    expect(builderSurfaces).toContain(
      'pnpm cli:read-only -- agent-target-packet --target claude-code'
    );
    expect(builderSurfaces).toContain(
      'pnpm cli:read-only -- agent-target-packet --target openclaw'
    );
    expect(builderSurfaces).toContain(
      'pnpm cli:read-only -- agent-integration-bundle'
    );
    expect(readiness).toContain('pnpm cli:read-only -- runtime-seam');
  });

  it('keeps the thin runtime-consumer entrypoint visible where Switchyard boundaries are explained', () => {
    const docsReadme = readRepoFile('docs/README.md');
    const builderStartHere = readRepoFile(
      'docs/ecosystem/builder-start-here.md'
    );
    const builderReadModels = readRepoFile(
      'docs/ecosystem/builder-read-models.md'
    );
    const integrationRecipes = readRepoFile(
      'docs/ecosystem/integration-recipes.md'
    );

    expect(docsReadme).toContain('pnpm cli:read-only -- runtime-consumer');
    expect(builderStartHere).toContain(
      'pnpm cli:read-only -- runtime-consumer --base-url'
    );
    expect(builderReadModels).toContain(
      'pnpm cli:read-only -- runtime-consumer --base-url'
    );
    expect(integrationRecipes).toContain(
      'pnpm cli:read-only -- runtime-consumer --base-url'
    );
  });

  it('keeps the public distribution bundle visible where ready-to-sync surfaces are explained', () => {
    const docsReadme = readRepoFile('docs/README.md');
    const readyToSync = readRepoFile(
      'docs/ecosystem/ready-to-sync-artifacts.md'
    );
    const builderStartHere = readRepoFile(
      'docs/ecosystem/builder-start-here.md'
    );
    const integrationRecipes = readRepoFile(
      'docs/ecosystem/integration-recipes.md'
    );
    const publicDistribution = readRepoFile(
      'docs/ecosystem/public-distribution-bundle.ready.md'
    );
    const publicMcp = readRepoFile(
      'docs/ecosystem/public-mcp-capability-map.ready.md'
    );
    const publicSkills = readRepoFile(
      'docs/ecosystem/public-skills-catalog.ready.md'
    );
    const pluginMetadata = readRepoFile(
      'docs/ecosystem/plugin-marketplace-metadata.ready.md'
    );

    expect(docsReadme).toContain('public-distribution-bundle.ready.md');
    expect(docsReadme).toContain('public-mcp-capability-map.ready.md');
    expect(docsReadme).toContain('public-skills-catalog.ready.md');
    expect(docsReadme).toContain('plugin-marketplace-metadata.ready.md');
    expect(readyToSync).toContain('public-distribution-bundle.ready.md');
    expect(readyToSync).toContain('public-mcp-capability-map.ready.md');
    expect(readyToSync).toContain('public-skills-catalog.ready.md');
    expect(readyToSync).toContain('plugin-marketplace-metadata.ready.md');
    expect(builderStartHere).toContain(
      'pnpm cli:read-only -- public-distribution-bundle'
    );
    expect(builderStartHere).toContain(
      'pnpm cli:read-only -- agent-target-packet --target'
    );
    expect(builderStartHere).toContain(
      'pnpm cli:read-only -- agent-target-packet --target'
    );
    expect(integrationRecipes).toContain(
      'pnpm cli:read-only -- public-distribution-bundle'
    );
    expect(publicDistribution).toContain(
      'pnpm cli:read-only -- public-distribution-bundle'
    );
    expect(publicDistribution).toContain(
      'pnpm cli:read-only -- agent-integration-bundle'
    );
    expect(publicDistribution).toContain(
      'pnpm cli:read-only -- agent-target-packet --target codex'
    );
    expect(publicDistribution).toContain(
      'pnpm cli:read-only -- agent-target-packet --target claude-code'
    );
    expect(publicDistribution).toContain(
      'pnpm cli:read-only -- agent-target-packet --target openclaw'
    );
    expect(publicDistribution).toContain(
      'Codex / Claude Code Public Distribution Matrix'
    );
    expect(publicDistribution).toContain(
      'plugin-level public distribution bundle'
    );
    expect(publicDistribution).toContain('official-listing claim');
    expect(publicMcp).toContain(
      'pnpm cli:read-only -- public-mcp-capability-map'
    );
    expect(publicSkills).toContain(
      'pnpm cli:read-only -- public-skills-catalog'
    );
    expect(publicSkills).toContain('Claude Code Skills Bundle Row');
    expect(publicSkills).toContain('starter-bundle companion');
    expect(pluginMetadata).toContain(
      'pnpm cli:read-only -- plugin-marketplace-metadata --target codex'
    );
    expect(pluginMetadata).toContain('Codex / Claude Code Bundle Rows');
    expect(pluginMetadata).toContain('plugin-level-public-distribution-bundle');
  });

  it('keeps agent-specific quickstarts visible across the front door and packet docs', () => {
    const readme = readRepoFile('README.md');
    const docsReadme = readRepoFile('docs/README.md');
    const quickstarts = readRepoFile('docs/ecosystem/agent-quickstarts.md');
    const distributionArtifacts = readRepoFile(
      'docs/ecosystem/agent-distribution-artifacts.md'
    );
    const codexQuickstart = readRepoFile('docs/ecosystem/codex-quickstart.md');
    const claudeQuickstart = readRepoFile(
      'docs/ecosystem/claude-code-quickstart.md'
    );
    const openClawComparison = readRepoFile(
      'docs/ecosystem/openclaw-comparison.md'
    );
    const positioning = readRepoFile(
      'docs/ecosystem/agent-and-mcp-positioning.md'
    );

    expect(readme).toContain('docs/ecosystem/agent-quickstarts.md');
    expect(readme).not.toContain('docs/ecosystem/codex-quickstart.md');
    expect(readme).not.toContain('docs/ecosystem/claude-code-quickstart.md');
    expect(readme).not.toContain('docs/ecosystem/openclaw-comparison.md');
    expect(readme).not.toContain('docs/ecosystem/examples/README.md');
    expect(readme).not.toContain('agent-target-packet.codex.json');
    expect(readme).not.toContain('agent-target-packet.claude-code.json');
    expect(readme).not.toContain('agent-target-packet.openclaw.json');
    expect(docsReadme).toContain('./ecosystem/agent-quickstarts.md');
    expect(docsReadme).toContain(
      './ecosystem/examples/agent-integration-bundle.json'
    );
    expect(docsReadme).toContain(
      './ecosystem/examples/agent-target-packet.codex.json'
    );
    expect(docsReadme).toContain(
      './ecosystem/examples/agent-target-packet.claude-code.json'
    );
    expect(docsReadme).toContain(
      './ecosystem/examples/agent-target-packet.opencode.json'
    );
    expect(docsReadme).toContain(
      './ecosystem/examples/agent-target-packet.openhands.json'
    );
    expect(docsReadme).toContain(
      './ecosystem/examples/agent-target-packet.openclaw.json'
    );
    expect(docsReadme).toContain(
      './ecosystem/examples/plugin-marketplace-metadata.codex.json'
    );
    expect(docsReadme).toContain(
      './ecosystem/examples/plugin-marketplace-metadata.claude-code.json'
    );
    expect(docsReadme).toContain(
      './ecosystem/examples/plugin-marketplace-metadata.openclaw.json'
    );
    expect(docsReadme).toContain('pnpm cli:read-only --help');
    expect(docsReadme).toContain(
      'pnpm cli:read-only -- agent-target-packet --target claude-code'
    );
    expect(docsReadme).toContain(
      'pnpm cli:read-only -- agent-target-packet --target opencode'
    );
    expect(docsReadme).toContain(
      'pnpm cli:read-only -- agent-target-packet --target openhands'
    );
    expect(docsReadme).toContain(
      'pnpm cli:read-only -- agent-target-packet --target openclaw'
    );
    expect(quickstarts).toContain(
      'pnpm cli:read-only -- agent-integration-bundle'
    );
    expect(quickstarts).toContain(
      'pnpm cli:read-only -- agent-target-packet --target claude-code'
    );
    expect(quickstarts).toContain(
      'pnpm cli:read-only -- agent-target-packet --target opencode'
    );
    expect(quickstarts).toContain(
      'pnpm cli:read-only -- agent-target-packet --target openhands'
    );
    expect(quickstarts).toContain(
      'pnpm cli:read-only -- public-mcp-capability-map'
    );
    expect(quickstarts).toContain(
      'pnpm cli:read-only -- public-skills-catalog'
    );
    expect(quickstarts).toContain(
      'pnpm cli:read-only -- plugin-marketplace-metadata'
    );
    expect(quickstarts).toContain('agent-target-packet.codex.json');
    expect(quickstarts).toContain('agent-target-packet.claude-code.json');
    expect(quickstarts).toContain('agent-target-packet.opencode.json');
    expect(quickstarts).toContain('agent-target-packet.openhands.json');
    expect(quickstarts).toContain('agent-target-packet.openclaw.json');
    expect(quickstarts).toContain('pnpm cli:read-only --help');
    expect(quickstarts).toContain('30-Second Target-Specific Copy Path');
    expect(quickstarts).toContain(
      'Codex / Claude Code Public Distribution Matrix'
    );
    expect(quickstarts).toContain('plugin-level public distribution bundle');
    expect(quickstarts).toContain(
      'pnpm cli:read-only -- agent-target-packet --target codex'
    );
    expect(distributionArtifacts).toContain('agent-integration-bundle.json');
    expect(distributionArtifacts).toContain('agent-target-packet.codex.json');
    expect(distributionArtifacts).toContain(
      'agent-target-packet.claude-code.json'
    );
    expect(distributionArtifacts).toContain(
      'agent-target-packet.opencode.json'
    );
    expect(distributionArtifacts).toContain(
      'agent-target-packet.openhands.json'
    );
    expect(distributionArtifacts).toContain(
      'agent-target-packet.openclaw.json'
    );
    expect(distributionArtifacts).toContain('public-mcp-capability-map.json');
    expect(distributionArtifacts).toContain(
      'To rewrite the checked-in files on disk, run:'
    );
    expect(distributionArtifacts).toContain(
      'pnpm builder:refresh-example-rack'
    );
    expect(distributionArtifacts).toContain('They do **not** refresh the');
    expect(distributionArtifacts).toContain(
      'checked-in examples in this folder.'
    );
    expect(distributionArtifacts).toContain(
      'pnpm cli:read-only -- plugin-marketplace-metadata'
    );
    expect(distributionArtifacts).toContain(
      'pnpm cli:read-only -- agent-target-packet --target codex'
    );
    expect(distributionArtifacts).toContain(
      'pnpm cli:read-only -- agent-target-packet --target claude-code'
    );
    expect(distributionArtifacts).toContain(
      'pnpm cli:read-only -- agent-target-packet --target opencode'
    );
    expect(distributionArtifacts).toContain(
      'pnpm cli:read-only -- agent-target-packet --target openhands'
    );
    expect(distributionArtifacts).toContain(
      'pnpm cli:read-only -- agent-target-packet --target openclaw'
    );
    expect(distributionArtifacts).toContain(
      'Codex / Claude Code Starter Bundle Pack'
    );
    expect(distributionArtifacts).toContain('official listing');
    expect(codexQuickstart).toContain(
      'pnpm cli:read-only -- outcome-bundle --app ext-kroger'
    );
    expect(codexQuickstart).toContain(
      'pnpm cli:read-only -- agent-target-packet --target codex'
    );
    expect(codexQuickstart).toContain('30-Second Copy-Paste Path');
    expect(codexQuickstart).toContain('Codex Public Distribution Matrix');
    expect(codexQuickstart).toContain('sample config');
    expect(codexQuickstart).toContain('proof loop');
    expect(codexQuickstart).toContain(
      'pnpm cli:read-only -- agent-target-packet --target codex'
    );
    expect(codexQuickstart).toContain(
      'pnpm cli:read-only -- plugin-marketplace-metadata --target codex --output'
    );
    expect(codexQuickstart).toContain('plugin-marketplace-metadata.codex.json');
    expect(codexQuickstart).toContain('pluginMarketplaceMetadataPacket');
    expect(claudeQuickstart).toContain(
      'pnpm cli:read-only -- submission-readiness'
    );
    expect(claudeQuickstart).toContain(
      'pnpm cli:read-only -- agent-target-packet --target claude-code'
    );
    expect(claudeQuickstart).toContain('30-Second Copy-Paste Path');
    expect(claudeQuickstart).toContain(
      'Claude Code Public Distribution Matrix'
    );
    expect(claudeQuickstart).toContain('skills-facing bundle companion');
    expect(claudeQuickstart).toContain('proof loop');
    expect(claudeQuickstart).toContain(
      'pnpm cli:read-only -- agent-target-packet --target claude-code'
    );
    expect(claudeQuickstart).toContain(
      'pnpm cli:read-only -- plugin-marketplace-metadata --target claude-code --output'
    );
    expect(claudeQuickstart).toContain(
      'plugin-marketplace-metadata.claude-code.json'
    );
    expect(claudeQuickstart).toContain('publicSkillsCatalog');
    expect(openClawComparison).toContain('public-ready');
    expect(openClawComparison).toContain('Public Proof Loop');
    expect(openClawComparison).toContain('Current Honest Placement');
    expect(openClawComparison).toContain(
      'pnpm cli:read-only -- agent-target-packet --target openclaw'
    );
    expect(openClawComparison).toContain(
      'pnpm cli:read-only -- agent-target-packet --target openclaw'
    );
    expect(openClawComparison).toContain(
      'plugin-marketplace-metadata.openclaw.json'
    );
    expect(positioning).toContain('Agent Quickstarts');
  });

  it('keeps ready pages shaped like handoff packets instead of prose-only explainers', () => {
    const publicMcp = readRepoFile(
      'docs/ecosystem/public-mcp-capability-map.ready.md'
    );
    const publicSkills = readRepoFile(
      'docs/ecosystem/public-skills-catalog.ready.md'
    );
    const pluginMetadata = readRepoFile(
      'docs/ecosystem/plugin-marketplace-metadata.ready.md'
    );

    expect(publicMcp).toContain('Handoff Packet');
    expect(publicMcp).toContain('Best JSON example');
    expect(publicMcp).toContain(
      'Shopflow now ships a repo-local read-only stdio MCP today'
    );
    expect(publicSkills).toContain('Handoff Packet');
    expect(publicSkills).toContain('Best JSON example');
    expect(publicSkills).toContain(
      'Shopflow ships a repo-owned skills-facing starter-bundle companion today'
    );
    expect(pluginMetadata).toContain('Handoff Packet');
    expect(pluginMetadata).toContain('Best JSON example');
    expect(pluginMetadata).toContain(
      'Shopflow ships a repo-owned plugin-level public distribution bundle today'
    );
    expect(pluginMetadata).toContain(
      './examples/plugin-marketplace-metadata.codex.json'
    );
    expect(pluginMetadata).toContain(
      './examples/plugin-marketplace-metadata.claude-code.json'
    );
    expect(pluginMetadata).toContain(
      './examples/plugin-marketplace-metadata.openclaw.json'
    );
  });
});
