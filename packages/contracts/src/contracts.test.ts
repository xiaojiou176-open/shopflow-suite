import { describe, expect, it } from 'vitest';
import { actionReceiptSchema } from './action-receipt';
import {
  agentIntegrationBundle,
  agentIntegrationBundleSchema,
  agentTargetPacketSchema,
  getAgentTargetPacket,
  pluginMarketplaceMetadataPacket,
  pluginMarketplaceMetadataPacketSchema,
  publicMcpCapabilityMap,
  publicMcpCapabilityMapSchema,
  publicSkillsCatalog,
  publicSkillsCatalogSchema,
} from './agent-integration-bundle';
import {
  builderIntegrationSurface,
  builderIntegrationSurfaceSchema,
} from './builder-integration-surface';
import {
  publicDistributionBundle,
  publicDistributionBundleSchema,
} from './public-distribution-bundle';
import { capabilityStateSchema } from './capabilities';
import { detectionResultSchema } from './detection-result';
import {
  isPublicClaimReady,
  publicClaimBoundarySchema,
  requiresVerifiedScopeClause,
} from './public-claim-boundary';
import {
  getLiveReceiptCapturePlans,
  getLiveReceiptBlockerSummaries,
  getLiveReceiptAppRequirements,
  getLiveReceiptVerifiedScopesForStore,
  isLiveReceiptReadyStatus,
  needsLiveReceiptRecapture,
} from './live-receipt-capture-plan';
import {
  findStoreCatalogEntryByAppId,
  getStoreReviewStartUrl,
  publicClaimBoundaries,
  storeCatalog,
  storeCatalogEntrySchema,
  formatStoreWave,
  storeHostPatternCoversPattern,
  storeHostPatternMatchesHost,
} from './store-catalog';
import { operatorDecisionBriefSchema } from './builder-surface';
import { resolveLocaleDictionary } from './locale';
import { storeTopology } from './store-topology';
import { normalizedProductSchema } from './store-adapter';
import { workflowCopilotBriefSchema } from './workflow-copilot-brief';
import {
  allVerificationCatalogEntries,
  storeVerificationCatalog,
  suiteVerificationCatalogEntry,
} from './verification-catalog';

describe('@shopflow/contracts', () => {
  it('parses capability and detection shapes defined by the contract', () => {
    expect(
      capabilityStateSchema.parse({
        capability: 'extract_product',
        status: 'ready',
      })
    ).toEqual({
      capability: 'extract_product',
      status: 'ready',
    });

    expect(
      detectionResultSchema.parse({
        storeId: 'amazon',
        verifiedScopes: ['amazon'],
        matchedHost: 'www.amazon.com',
        pageKind: 'product',
        confidence: 0.75,
        capabilityStates: [
          {
            capability: 'extract_product',
            status: 'ready',
          },
        ],
      }).pageKind
    ).toBe('product');
  });

  it('keeps store-bound product outputs schema-safe', () => {
    const product = normalizedProductSchema.parse({
      sourceStoreId: 'target',
      sourceUrl: 'https://www.target.com/p/example',
      title: 'Example product',
      price: {
        currency: 'USD',
        amount: 10,
        displayText: '$10.00',
      },
    });

    expect(product.sourceStoreId).toBe('target');
  });

  it('enforces action receipt semantics', () => {
    const receipt = actionReceiptSchema.parse({
      actionKind: 'schedule_save_subscribe',
      status: 'partial',
      attempted: 4,
      succeeded: 3,
      failed: 1,
      skipped: 0,
      errors: [
        {
          code: 'ACTION_STEP_FAILED',
          message: 'Failed to click the subscribe button',
        },
      ],
    });

    expect(receipt.status).toBe('partial');
    expect(receipt.failed).toBe(1);
  });

  it('formalizes verified-scope claim boundaries', () => {
    const boundary = publicClaimBoundarySchema.parse(
      publicClaimBoundaries.albertsons
    );

    expect(requiresVerifiedScopeClause(boundary.storeId)).toBe(true);
    expect(isPublicClaimReady(boundary.claimState)).toBe(false);
    expect(boundary.verifiedScopeCopy).toBe('Currently verified on Safeway.');
    expect(boundary.claimState).toBe('repo-verified');
  });

  it('keeps materialized Wave 1, Wave 2, and Wave 3 claim states repo-verified without overclaiming public-ready support', () => {
    expect(publicClaimBoundaries.amazon.claimState).toBe('repo-verified');
    expect(publicClaimBoundaries.costco.claimState).toBe('repo-verified');
    expect(publicClaimBoundaries.walmart.claimState).toBe('repo-verified');
    expect(publicClaimBoundaries.target.claimState).toBe('repo-verified');
    expect(publicClaimBoundaries.temu.claimState).toBe('repo-verified');
    expect(publicClaimBoundaries.kroger.claimState).toBe('repo-verified');
    expect(publicClaimBoundaries.weee.claimState).toBe('repo-verified');
    expect(isPublicClaimReady(publicClaimBoundaries.temu.claimState)).toBe(
      false
    );
  });

  it('keeps the store catalog aligned with public claim boundaries', () => {
    for (const [storeId, entry] of Object.entries(storeCatalog)) {
      expect(storeCatalogEntrySchema.parse(entry).storeId).toBe(storeId);
      expect(
        publicClaimBoundaries[storeId as keyof typeof publicClaimBoundaries]
          ?.publicName
      ).toBe(entry.publicName);
      expect(
        publicClaimBoundaries[storeId as keyof typeof publicClaimBoundaries]
          ?.verifiedScopes
      ).toEqual(entry.verifiedScopes);
    }
  });

  it('derives reviewer start paths and host coverage from shared catalog helpers', () => {
    expect(findStoreCatalogEntryByAppId('ext-temu')?.storeId).toBe('temu');
    expect(getStoreReviewStartUrl('albertsons')).toBe(
      'https://www.safeway.com'
    );
    expect(
      storeHostPatternMatchesHost('*://*.safeway.com/*', 'www.safeway.com')
    ).toBe(true);
    expect(
      storeHostPatternCoversPattern(
        '*://*.safeway.com/*',
        '*://www.safeway.com/*'
      )
    ).toBe(true);
    expect(
      storeHostPatternMatchesHost(
        '*://*.vons.com/shop/search-results*',
        'www.vons.com'
      )
    ).toBe(true);
    expect(
      storeHostPatternCoversPattern(
        '*://*.vons.com/shop/search-results*',
        '*://www.vons.com/shop/search-results*'
      )
    ).toBe(true);
    expect(
      storeHostPatternCoversPattern(
        '*://*.vons.com/shop/search-results*',
        '*://www.vons.com/pharmacy*'
      )
    ).toBe(false);
  });

  it('exports a read-only operator decision brief schema for builder-facing consumers', () => {
    expect(
      operatorDecisionBriefSchema.parse({
        surfaceId: 'operator-decision-brief',
        schemaVersion: 'shopflow.operator-decision-brief.v1',
        readOnly: true,
        appTitle: 'Shopflow for Amazon',
        stage: 'claim-gated',
        summary:
          'Extract this product is runnable right now. Public wording still stays behind evidence review.',
        whyNow: [
          'www.amazon.com · product',
          '1 runnable capability on this page',
          '1 live receipt packet still missing for this app.',
        ],
        nextStep: 'Review the evidence queue before using public wording.',
        primaryRouteLabel: 'Extract this product',
        primaryRouteHref: 'https://www.amazon.com/dp/example',
        primaryRouteOrigin: 'merchant-source',
        claimBoundary: 'Currently verified on Amazon.',
      })
    ).toMatchObject({
      stage: 'claim-gated',
      primaryRouteLabel: 'Extract this product',
    });
  });

  it('locks builder integration buckets and language policy into machine-readable truth', () => {
    const integrationSurface = builderIntegrationSurfaceSchema.parse(
      builderIntegrationSurface
    );

    expect(integrationSurface.productLanguageBoundary).toMatchObject({
      publicSurfaceDefault: 'en',
      productUiDefault: 'en',
      productUiOptionalLocale: 'zh-CN',
      shellLevelLocaleRouteToggle: true,
      persistedLanguageSettingsSystem: false,
      noScatteredBilingualLiterals: true,
    });
    expect(integrationSurface.surfaceId).toBe('builder-integration-surface');
    expect(integrationSurface.readOnly).toBe(true);
    expect(integrationSurface.apiSubstrateFirst.later).toContain(
      'Read-only MCP surface backed by the same runtime truth'
    );
    expect(integrationSurface.apiSubstrateFirst.today).toContain(
      'Repo-local read-only outcome bundle command that joins the integration surface, prefers generated runtime payload files when available, and adds generated artifact summaries plus source pointers when repo outputs exist'
    );
    expect(integrationSurface.apiSubstrateFirst.today).toContain(
      'Read-only provider-runtime seam contract that keeps external runtime acquisition boundaries explicit without turning Shopflow into a provider runtime'
    );
    expect(integrationSurface.apiSubstrateFirst.ownerDecision).toContain(
      'Public CLI commitments'
    );
    expect(
      integrationSurface.surfaceCatalog
        .find((entry) => entry.id === 'provider-runtime-seam')
        ?.entrypoints.some(
          (entrypoint) =>
            entrypoint.kind === 'docs' &&
            entrypoint.value ===
              'docs/adr/ADR-004-switchyard-provider-runtime-seam.md'
        )
    ).toBe(true);
    expect(
      integrationSurface.surfaceCatalog
        .find((entry) => entry.id === 'provider-runtime-seam')
        ?.entrypoints.some(
          (entrypoint) =>
            entrypoint.kind === 'import' &&
            entrypoint.value === '@shopflow/contracts:providerRuntimeSeam'
        )
    ).toBe(true);
    expect(
      integrationSurface.surfaceCatalog
        .find((entry) => entry.id === 'provider-runtime-consumer')
        ?.entrypoints.some(
          (entrypoint) =>
            entrypoint.kind === 'command' &&
            entrypoint.value ===
              'pnpm cli:read-only -- runtime-consumer --base-url <switchyard-url>'
        )
    ).toBe(true);
    expect(
      integrationSurface.surfaceCatalog
        .find((entry) => entry.id === 'agent-integration-bundle')
        ?.entrypoints.some(
          (entrypoint) =>
            entrypoint.kind === 'command' &&
            entrypoint.value ===
              'pnpm cli:read-only -- agent-integration-bundle'
        )
    ).toBe(true);
    expect(
      integrationSurface.surfaceCatalog
        .find((entry) => entry.id === 'agent-integration-bundle')
        ?.entrypoints.some(
          (entrypoint) =>
            entrypoint.kind === 'command' &&
            entrypoint.value ===
              'pnpm cli:read-only -- agent-target-packet --target <target>'
        )
    ).toBe(true);
    expect(
      integrationSurface.surfaceCatalog
        .find((entry) => entry.id === 'public-distribution-bundle')
        ?.entrypoints.some(
          (entrypoint) =>
            entrypoint.kind === 'command' &&
            entrypoint.value ===
              'pnpm cli:read-only -- public-distribution-bundle'
        )
    ).toBe(true);
    expect(
      integrationSurface.repoLocalTooling.find(
        (tool) => tool.id === 'read-only-cli-prototype'
      )?.summary
    ).toContain('agent-target-packet');
    expect(
      integrationSurface.surfaceCatalog
        .find((entry) => entry.id === 'builder-app-snapshot')
        ?.entrypoints.some(
          (entrypoint) =>
            entrypoint.kind === 'example-json' &&
            entrypoint.value ===
              'docs/ecosystem/examples/builder-app-snapshot.ext-albertsons.json'
        )
    ).toBe(true);
    expect(
      integrationSurface.surfaceCatalog
        .find((entry) => entry.id === 'builder-app-snapshot')
        ?.entrypoints.some(
          (entrypoint) =>
            entrypoint.kind === 'example-json' &&
            entrypoint.value ===
              'docs/ecosystem/examples/builder-app-snapshot.ext-amazon.json'
        )
    ).toBe(true);
    expect(
      integrationSurface.surfaceCatalog
        .find((entry) => entry.id === 'builder-outcome-bundle')
        ?.entrypoints.some(
          (entrypoint) =>
            entrypoint.kind === 'example-json' &&
            entrypoint.value ===
              'docs/ecosystem/examples/builder-outcome-bundle.ext-kroger.json'
        )
    ).toBe(true);
    expect(
      integrationSurface.surfaceCatalog
        .find((entry) => entry.id === 'workflow-copilot-brief')
        ?.entrypoints.some(
          (entrypoint) =>
            entrypoint.kind === 'example-json' &&
            entrypoint.value ===
              'docs/ecosystem/examples/workflow-copilot-brief.ext-albertsons.json'
        )
    ).toBe(true);
    expect(
      integrationSurface.surfaceCatalog
        .find((entry) => entry.id === 'builder-integration-surface')
        ?.entrypoints.some(
          (entrypoint) =>
            entrypoint.kind === 'docs' &&
            entrypoint.value === 'docs/ecosystem/builder-start-here.md'
        )
    ).toBe(true);
    expect(
      integrationSurface.surfaceCatalog
        .find((entry) => entry.id === 'builder-outcome-bundle')
        ?.entrypoints.some(
          (entrypoint) =>
            entrypoint.kind === 'docs' &&
            entrypoint.value === 'docs/ecosystem/integration-recipes.md'
        )
    ).toBe(true);
    expect(
      integrationSurface.surfaceCatalog
        .find((entry) => entry.id === 'submission-readiness-report')
        ?.entrypoints.some(
          (entrypoint) =>
            entrypoint.kind === 'docs' &&
            entrypoint.value === 'docs/ecosystem/integration-recipes.md'
        )
    ).toBe(true);
    expect(integrationSurface.repoLocalTooling[0]).toMatchObject({
      command: 'pnpm builder:write-runtime-payloads -- --app <appId>',
      outputPath: '.runtime-cache/builder/',
      readOnly: true,
    });
    expect(integrationSurface.repoLocalTooling[1]).toMatchObject({
      command: 'pnpm builder:refresh-example-rack',
      outputPath: 'docs/ecosystem/examples/',
      readOnly: true,
    });
    expect(integrationSurface.repoLocalTooling[2]).toMatchObject({
      command: 'pnpm builder:write-outcome-bundle',
      outputPath: '.runtime-cache/builder/builder-outcome-bundle.json',
      readOnly: true,
    });
    expect(integrationSurface.repoLocalTooling[3]).toMatchObject({
      command: 'pnpm cli:read-only -- integration-surface',
      outputPath: '.runtime-cache/cli/',
      readOnly: true,
    });
    expect(
      integrationSurface.ecosystemFit.find((entry) => entry.target === 'codex')
        ?.placement
    ).toBe('front-door-primary');
    expect(
      integrationSurface.ecosystemFit.find(
        (entry) => entry.target === 'openclaw'
      )?.placement
    ).toBe('public-ready-secondary');
  });

  it('keeps locale dictionaries English-first while allowing zh-CN overrides', () => {
    const copy = resolveLocaleDictionary(
      {
        en: {
          title: 'Decision brief',
          summary: 'Keep repo truth ahead of public wording.',
        },
        'zh-CN': {
          title: '决策摘要',
        },
      },
      'zh-CN'
    );

    expect(copy).toEqual({
      title: '决策摘要',
      summary: 'Keep repo truth ahead of public wording.',
    });
  });

  it('formalizes live receipt requirements for action-heavy and family-scope claims', () => {
    expect(getLiveReceiptCapturePlans('ext-albertsons')).toHaveLength(2);
    expect(getLiveReceiptCapturePlans('ext-kroger')).toHaveLength(2);
    expect(getLiveReceiptCapturePlans('ext-temu')).toHaveLength(1);
    expect(getLiveReceiptCapturePlans('ext-amazon')).toHaveLength(0);
    expect(getLiveReceiptAppRequirements('ext-kroger')).toHaveLength(2);
    expect(getLiveReceiptBlockerSummaries()).toHaveLength(3);
    expect(getLiveReceiptVerifiedScopesForStore('kroger')).toEqual([
      'fred-meyer',
      'qfc',
    ]);
  });

  it('treats captured evidence as review-pending instead of silently public-ready', () => {
    expect(isLiveReceiptReadyStatus('reviewed')).toBe(true);
    expect(isLiveReceiptReadyStatus('captured')).toBe(false);
    expect(needsLiveReceiptRecapture('missing-live-receipt')).toBe(true);
    expect(needsLiveReceiptRecapture('captured')).toBe(false);
  });

  it('keeps the verification catalog aligned with store topology and release channels', () => {
    expect(storeVerificationCatalog).toHaveLength(
      Object.keys(storeCatalog).length
    );
    expect(suiteVerificationCatalogEntry.releaseChannel).toBe('internal-alpha');
    expect(allVerificationCatalogEntries).toHaveLength(
      Object.keys(storeCatalog).length + 1
    );
    expect(
      storeVerificationCatalog.find((entry) => entry.appId === 'ext-albertsons')
        ?.requiredEvidenceCaptureIds
    ).toEqual([
      'safeway-subscribe-live-receipt',
      'safeway-cancel-live-receipt',
    ]);
  });

  it('derives topology wiring and wave labels from shared store metadata once', () => {
    expect(storeTopology).toHaveLength(Object.keys(storeCatalog).length);
    expect(formatStoreWave(storeCatalog.kroger.wave)).toBe('Wave 3');
    expect(
      storeTopology.find((entry) => entry.storeId === 'weee')
    ).toMatchObject({
      appDir: 'apps/ext-weee',
      storePackageDir: 'packages/store-weee',
      storePackageImportName: '@shopflow/store-weee',
      contractTestPath: 'tests/contract/store-weee.contract.test.ts',
      e2eSmokePath: 'tests/e2e/ext-weee.smoke.spec.ts',
    });
  });

  it('keeps workflow copilot briefs schema-safe for builder-facing read models', () => {
    const brief = workflowCopilotBriefSchema.parse({
      tone: 'claim-gated',
      title: 'Workflow copilot',
      summary:
        'Repo verification is green enough to inspect this page, but public wording still remains behind evidence review.',
      bullets: [
        {
          label: 'Runnable now',
          value: 'Capture search results',
        },
        {
          label: 'Claim gate',
          value: '1 packet is still waiting for explicit review.',
        },
      ],
      nextAction: {
        label: 'Open capture queue',
        reason: 'Review the current packet before public wording changes.',
      },
    });

    expect(brief.tone).toBe('claim-gated');
    expect(brief.bullets).toHaveLength(2);
  });

  it('keeps the public distribution bundle machine-readable and boundary-explicit', () => {
    const bundle = publicDistributionBundleSchema.parse(
      publicDistributionBundle
    );

    expect(bundle.surfaceId).toBe('public-distribution-bundle');
    expect(bundle.readOnly).toBe(true);
    expect(bundle.channels.map((channel) => channel.id)).toEqual([
      'public-api',
      'public-mcp',
      'public-skills',
      'plugin-marketplace',
    ]);
    expect(bundle.boundaryNote).toContain('do not prove any public surface');
    expect(
      bundle.channels
        .find((channel) => channel.id === 'public-mcp')
        ?.artifacts.some(
          (artifact) =>
            artifact.kind === 'command' &&
            artifact.value === 'pnpm cli:read-only -- agent-integration-bundle'
        )
    ).toBe(true);
  });

  it('keeps the agent integration bundle machine-readable and honest about placement', () => {
    const bundle = agentIntegrationBundleSchema.parse(agentIntegrationBundle);

    expect(bundle.surfaceId).toBe('agent-integration-bundle');
    expect(bundle.readOnly).toBe(true);
    expect(bundle.discoverabilitySources).toContain(
      'docs/ecosystem/agent-quickstarts.md'
    );
    expect(
      bundle.profiles.find((profile) => profile.target === 'codex')?.placement
    ).toBe('front-door-primary');
    expect(
      bundle.profiles.find((profile) => profile.target === 'claude-code')
        ?.quickstartPath
    ).toBe('docs/ecosystem/claude-code-quickstart.md');
    expect(
      bundle.profiles.find((profile) => profile.target === 'openclaw')
        ?.placement
    ).toBe('public-ready-secondary');
    expect(
      bundle.publicMcpCapabilityMap.capabilities.some(
        (capability) => capability.id === 'runtime-seam'
      )
    ).toBe(true);
    expect(bundle.publicSkillsCatalog.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'shopflow-read-only-runtime-seam-consumption',
          distributionState: 'repo-local-skill-scaffold',
        }),
      ])
    );
    expect(bundle.pluginMarketplaceMetadata.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          target: 'openclaw',
          packagingState: 'ready-to-publish-packet',
        }),
      ])
    );
  });

  it('builds target-specific agent handoff packets from the full bundle', () => {
    const codexPacket = agentTargetPacketSchema.parse(
      getAgentTargetPacket('codex')
    );
    const openHandsPacket = agentTargetPacketSchema.parse(
      getAgentTargetPacket('openhands')
    );

    expect(codexPacket.target).toBe('codex');
    expect(
      codexPacket.capabilities.some((entry) => entry.id === 'runtime-consumer')
    ).toBe(true);
    expect(
      codexPacket.skills.some(
        (entry) => entry.id === 'shopflow-builder-facing-discoverability-and-ready-sync'
      )
    ).toBe(true);
    expect(codexPacket.pluginMetadata?.target).toBe('codex');
    expect(openHandsPacket.target).toBe('openhands');
    expect(openHandsPacket.pluginMetadata).toBeNull();
  });

  it('exports direct read-only packet constants for MCP, skills, and plugin metadata', () => {
    const mcpPacket = publicMcpCapabilityMapSchema.parse(publicMcpCapabilityMap);
    const skillsPacket = publicSkillsCatalogSchema.parse(publicSkillsCatalog);
    const pluginPacket = pluginMarketplaceMetadataPacketSchema.parse(
      pluginMarketplaceMetadataPacket
    );

    expect(mcpPacket.capabilities.some((capability) => capability.id === 'runtime-seam')).toBe(
      true
    );
    expect(
      skillsPacket.entries.some(
        (entry) => entry.id === 'shopflow-live-browser-ops'
      )
    ).toBe(true);
    expect(
      pluginPacket.entries.some(
        (entry) => entry.target === 'claude-code'
      )
    ).toBe(true);
  });
});
