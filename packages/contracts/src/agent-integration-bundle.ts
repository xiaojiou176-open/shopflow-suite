import { z } from 'zod';
import {
  builderEcosystemPlacementValues,
  builderEcosystemTargetValues,
} from './builder-integration-surface';

export const agentIntegrationEntryStateValues = [
  'repo-local-quickstart',
  'ecosystem-secondary-docs',
  'comparison-packet',
  'ready-to-publish-packet',
] as const;

export const agentCapabilityStateValues = [
  'repo-local-read-only',
  'current-scope-now',
  'later-packet',
] as const;

export const skillsDistributionStateValues = [
  'repo-local-skill-scaffold',
  'ready-to-sync-packet',
] as const;

export const pluginPackagingStateValues = [
  'metadata-skeleton-only',
  'plugin-level-public-distribution-bundle',
  'comparison-packet',
  'ready-to-publish-packet',
  'owner-decision-only',
] as const;

export const pluginDistributionSurfaceStatusValues = [
  'plugin-level-public-distribution-bundle',
  'comparison-packet',
  'ready-to-publish-packet',
] as const;

export const officialDistributionSurfaceStatusValues = [
  'official-surface-unconfirmed',
  'official-surface-confirmed-auth-required',
] as const;

export const agentCapabilityEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  state: z.enum(agentCapabilityStateValues),
  sourceCommand: z.string().min(1),
  sourceDocs: z.array(z.string().min(1)).min(1),
  targetFit: z.array(z.enum(builderEcosystemTargetValues)).min(1),
  summary: z.string().min(1),
});

export const agentSkillCatalogEntrySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  sourcePath: z.string().min(1),
  distributionState: z.enum(skillsDistributionStateValues),
  targetFit: z.array(z.enum(builderEcosystemTargetValues)).min(1),
  summary: z.string().min(1),
  mustNotClaim: z.array(z.string().min(1)).min(1),
});

export const pluginMarketplaceMetadataSkeletonSchema = z.object({
  target: z.enum(builderEcosystemTargetValues),
  placement: z.enum(builderEcosystemPlacementValues),
  packagingState: z.enum(pluginPackagingStateValues),
  suggestedSlug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  boundaryNote: z.string().min(1),
  screenshotSources: z.array(z.string().min(1)).min(1),
  capabilityRefs: z.array(z.string().min(1)).min(1),
  skillsRefs: z.array(z.string().min(1)).min(1),
  distributionBundle: z
    .object({
      truthfulSurfaceStatus: z.enum(pluginDistributionSurfaceStatusValues),
      officialSurfaceStatus: z.enum(officialDistributionSurfaceStatusValues),
      starterBundlePaths: z.array(z.string().min(1)).min(1),
      sampleConfigPaths: z.array(z.string().min(1)).min(1),
      installDocs: z.array(z.string().min(1)).min(1),
      proofLoopCommands: z.array(z.string().min(1)).min(1),
      listingPayloadPaths: z.array(z.string().min(1)).min(1),
    })
    .optional(),
  mustNotClaim: z.array(z.string().min(1)).min(1),
});

export const agentIntegrationProfileSchema = z.object({
  target: z.enum(builderEcosystemTargetValues),
  placement: z.enum(builderEcosystemPlacementValues),
  currentEntryState: z.enum(agentIntegrationEntryStateValues),
  quickstartPath: z.string().min(1),
  primaryCommand: z.string().min(1),
  recommendedCommands: z.array(z.string().min(1)).min(1),
  repoOwnedArtifacts: z.array(z.string().min(1)).min(1),
  skillsState: z.enum(skillsDistributionStateValues),
  pluginPackagingState: z.enum(pluginPackagingStateValues),
  summary: z.string().min(1),
  mustNotClaim: z.array(z.string().min(1)).min(1),
  nextHumanStep: z.string().min(1),
});

export const publicMcpCapabilityMapSchema = z.object({
  repoOwnedStatus: z.literal('ready-to-sync-packet'),
  publicReleaseState: z.literal('not-yet-published'),
  capabilities: z.array(agentCapabilityEntrySchema).min(1),
});

export const publicSkillsCatalogSchema = z.object({
  repoOwnedStatus: z.enum([
    'ready-to-sync-packet',
    'plugin-level-public-distribution-bundle',
  ]),
  publicReleaseState: z.literal('not-yet-published'),
  entries: z.array(agentSkillCatalogEntrySchema).min(1),
});

export const pluginMarketplaceMetadataPacketSchema = z.object({
  repoOwnedStatus: z.enum([
    'ready-to-sync-packet',
    'plugin-level-public-distribution-bundle',
  ]),
  publicReleaseState: z.literal('not-yet-published'),
  entries: z.array(pluginMarketplaceMetadataSkeletonSchema).min(1),
});

export const agentTargetPacketSchema = z.object({
  surfaceId: z.literal('agent-target-packet'),
  schemaVersion: z.literal('shopflow.agent-target-packet.v1'),
  readOnly: z.literal(true),
  target: z.enum(builderEcosystemTargetValues),
  placement: z.enum(builderEcosystemPlacementValues),
  currentEntryState: z.enum(agentIntegrationEntryStateValues),
  quickstartPath: z.string().min(1),
  primaryCommand: z.string().min(1),
  recommendedCommands: z.array(z.string().min(1)).min(1),
  repoOwnedArtifacts: z.array(z.string().min(1)).min(1),
  capabilities: z.array(agentCapabilityEntrySchema).min(1),
  skills: z.array(agentSkillCatalogEntrySchema),
  pluginMetadata: pluginMarketplaceMetadataSkeletonSchema.nullable(),
  summary: z.string().min(1),
  boundaryNote: z.string().min(1),
  mustNotClaim: z.array(z.string().min(1)).min(1),
  nextHumanStep: z.string().min(1),
});

export const agentIntegrationBundleSchema = z.object({
  surfaceId: z.literal('agent-integration-bundle'),
  schemaVersion: z.literal('shopflow.agent-integration-bundle.v1'),
  readOnly: z.literal(true),
  boundaryNote: z.string().min(1),
  discoverabilitySources: z.array(z.string().min(1)).min(3),
  profiles: z.array(agentIntegrationProfileSchema).length(5),
  publicMcpCapabilityMap: publicMcpCapabilityMapSchema,
  publicSkillsCatalog: publicSkillsCatalogSchema,
  pluginMarketplaceMetadata: pluginMarketplaceMetadataPacketSchema,
});

export type AgentIntegrationBundle = z.infer<
  typeof agentIntegrationBundleSchema
>;
export type AgentTargetPacket = z.infer<typeof agentTargetPacketSchema>;

export const agentIntegrationBundle = agentIntegrationBundleSchema.parse({
  surfaceId: 'agent-integration-bundle',
  schemaVersion: 'shopflow.agent-integration-bundle.v1',
  readOnly: true,
  boundaryNote:
    'This bundle turns agent-specific onboarding, MCP capability prep, skills scaffolds, starter bundles, sample configs, proof loops, and plugin metadata into one repo-owned packet. It does not prove any official integration, official listing, published plugin, or distributed skills pack already exists.',
  discoverabilitySources: [
    'docs/ecosystem/agent-quickstarts.md',
    'docs/ecosystem/builder-start-here.md',
    'docs/ecosystem/agent-and-mcp-positioning.md',
    'docs/ecosystem/public-distribution-bundle.ready.md',
  ],
  profiles: [
    {
      target: 'codex',
      placement: 'front-door-primary',
      currentEntryState: 'repo-local-quickstart',
      quickstartPath: 'docs/ecosystem/codex-quickstart.md',
      primaryCommand:
        'pnpm cli:read-only -- agent-target-packet --target codex',
      recommendedCommands: [
        'pnpm cli:read-only -- integration-surface',
        'pnpm cli:read-only -- outcome-bundle --app ext-kroger',
        'pnpm cli:read-only -- runtime-consumer --base-url http://127.0.0.1:4317',
        'pnpm cli:read-only -- plugin-marketplace-metadata --target codex --output .runtime-cache/cli/plugin-marketplace-metadata.codex.json',
        'pnpm cli:read-only -- public-distribution-bundle',
      ],
      repoOwnedArtifacts: [
        'docs/ecosystem/codex-quickstart.md',
        'docs/ecosystem/agent-quickstarts.md',
        'docs/ecosystem/public-distribution-bundle.ready.md',
        'docs/ecosystem/examples/agent-target-packet.codex.json',
        'docs/ecosystem/examples/plugin-marketplace-metadata.codex.json',
      ],
      skillsState: 'ready-to-sync-packet',
      pluginPackagingState: 'plugin-level-public-distribution-bundle',
      summary:
        'Codex now has a plugin-level public distribution bundle with a starter packet, sample config, install docs, proof loop, and listing payload while still avoiding any official-listing claim.',
      mustNotClaim: [
        'Official Codex integration',
        'Published Codex plugin',
        'Official Codex listing',
        'Public MCP already shipped for Codex',
      ],
      nextHumanStep:
        'Use the bundle as the strongest truthful public distribution surface today, and only move to an official Codex listing flow after the official surface and required auth path are both confirmed.',
    },
    {
      target: 'claude-code',
      placement: 'front-door-primary',
      currentEntryState: 'repo-local-quickstart',
      quickstartPath: 'docs/ecosystem/claude-code-quickstart.md',
      primaryCommand:
        'pnpm cli:read-only -- agent-target-packet --target claude-code',
      recommendedCommands: [
        'pnpm cli:read-only -- integration-surface',
        'pnpm cli:read-only -- runtime-seam',
        'pnpm cli:read-only -- submission-readiness',
        'pnpm cli:read-only -- public-skills-catalog --output .runtime-cache/cli/public-skills-catalog.json',
        'pnpm cli:read-only -- plugin-marketplace-metadata --target claude-code --output .runtime-cache/cli/plugin-marketplace-metadata.claude-code.json',
      ],
      repoOwnedArtifacts: [
        'docs/ecosystem/claude-code-quickstart.md',
        '.agents/skills/shopflow-read-only-runtime-seam-consumption/SKILL.md',
        'docs/ecosystem/public-distribution-bundle.ready.md',
        'docs/ecosystem/examples/agent-target-packet.claude-code.json',
        'docs/ecosystem/examples/public-skills-catalog.json',
        'docs/ecosystem/examples/plugin-marketplace-metadata.claude-code.json',
      ],
      skillsState: 'ready-to-sync-packet',
      pluginPackagingState: 'plugin-level-public-distribution-bundle',
      summary:
        'Claude Code now has a plugin-level public distribution bundle with a starter packet, sample config, install docs, proof loop, and listing payload, plus a stronger skills-facing companion path.',
      mustNotClaim: [
        'Official Claude Code integration',
        'Published Claude Code plugin',
        'Official Claude Code listing',
        'Shipped public skills pack',
      ],
      nextHumanStep:
        'Use the bundle as the strongest truthful public distribution surface today, and only move to an official Claude Code listing or write-side skills distribution flow after the real official surface and auth path are confirmed.',
    },
    {
      target: 'opencode',
      placement: 'ecosystem-secondary',
      currentEntryState: 'ecosystem-secondary-docs',
      quickstartPath: 'docs/ecosystem/agent-quickstarts.md',
      primaryCommand:
        'pnpm cli:read-only -- agent-target-packet --target opencode',
      recommendedCommands: [
        'pnpm cli:read-only -- public-distribution-bundle',
        'pnpm cli:read-only -- outcome-bundle --app ext-kroger',
      ],
      repoOwnedArtifacts: [
        'docs/ecosystem/agent-quickstarts.md',
        'docs/ecosystem/integration-recipes.md',
      ],
      skillsState: 'ready-to-sync-packet',
      pluginPackagingState: 'owner-decision-only',
      summary:
        'OpenCode stays an ecosystem-secondary reference, but the repo now exposes the same onboarding bundle and metadata packet so later packaging work no longer starts from prose only.',
      mustNotClaim: ['Main front-door placement', 'Official OpenCode package'],
      nextHumanStep:
        'Use the onboarding bundle as a packaging reference only if OpenCode becomes a chosen external distribution target later.',
    },
    {
      target: 'openhands',
      placement: 'ecosystem-secondary',
      currentEntryState: 'ecosystem-secondary-docs',
      quickstartPath: 'docs/ecosystem/agent-quickstarts.md',
      primaryCommand:
        'pnpm cli:read-only -- agent-target-packet --target openhands',
      recommendedCommands: [
        'pnpm cli:read-only -- public-distribution-bundle',
        'pnpm cli:read-only -- runtime-consumer --base-url http://127.0.0.1:4317',
      ],
      repoOwnedArtifacts: [
        'docs/ecosystem/agent-quickstarts.md',
        'docs/ecosystem/agent-and-mcp-positioning.md',
      ],
      skillsState: 'ready-to-sync-packet',
      pluginPackagingState: 'owner-decision-only',
      summary:
        'OpenHands stays an ecosystem-secondary comparison, but the same onboarding bundle now gives it a concrete repo-owned reference path instead of generic future wording.',
      mustNotClaim: ['Main front-door placement', 'Official OpenHands package'],
      nextHumanStep:
        'Use the onboarding bundle only as later-stage packaging input if OpenHands becomes an explicit external target.',
    },
    {
      target: 'openclaw',
      placement: 'public-ready-secondary',
      currentEntryState: 'ready-to-publish-packet',
      quickstartPath: 'docs/ecosystem/openclaw-comparison.md',
      primaryCommand:
        'pnpm cli:read-only -- agent-target-packet --target openclaw',
      recommendedCommands: [
        'pnpm cli:read-only -- plugin-marketplace-metadata --target openclaw',
        'pnpm cli:read-only -- public-distribution-bundle',
        'pnpm cli:read-only -- agent-integration-bundle',
      ],
      repoOwnedArtifacts: [
        'docs/ecosystem/openclaw-comparison.md',
        'docs/ecosystem/openclaw-public-ready-matrix.md',
        'docs/ecosystem/openclaw-publish-unblock-packet.ready.md',
      ],
      skillsState: 'ready-to-sync-packet',
      pluginPackagingState: 'ready-to-publish-packet',
      summary:
        'OpenClaw is now carried as a public-ready but not-yet-published packet: install path, discovery path, and proof loop are explicit, while the final external publish step stays truthfully outside the repo boundary.',
      mustNotClaim: [
        'Official OpenClaw listing',
        'Official OpenClaw integration',
      ],
      nextHumanStep:
        'Create or authorize the public GitHub plugin repo, install it through nix-openclaw customPlugins, and capture the proof loop receipts. If official OpenClaw-owned placement is desired, ask maintainers through the documented Discord channel first.',
    },
  ],
  publicMcpCapabilityMap: {
    repoOwnedStatus: 'ready-to-sync-packet',
    publicReleaseState: 'not-yet-published',
    capabilities: [
      {
        id: 'integration-surface',
        label: 'Builder integration surface',
        state: 'repo-local-read-only',
        sourceCommand: 'pnpm cli:read-only -- integration-surface',
        sourceDocs: [
          'docs/ecosystem/builder-start-here.md',
          'docs/ecosystem/integration-recipes.md',
        ],
        targetFit: [
          'codex',
          'claude-code',
          'opencode',
          'openhands',
          'openclaw',
        ],
        summary:
          'Gives coding agents one machine-readable map of today/current-scope/later/no-go/owner-decision.',
      },
      {
        id: 'runtime-seam',
        label: 'Provider runtime seam',
        state: 'repo-local-read-only',
        sourceCommand: 'pnpm cli:read-only -- runtime-seam',
        sourceDocs: [
          'docs/adr/ADR-004-switchyard-provider-runtime-seam.md',
          'docs/ecosystem/integration-recipes.md',
        ],
        targetFit: [
          'codex',
          'claude-code',
          'opencode',
          'openhands',
          'openclaw',
        ],
        summary:
          'Makes the Shopflow-vs-runtime boundary explicit without turning the repo into a public runtime product.',
      },
      {
        id: 'runtime-consumer',
        label: 'Thin runtime consumer snapshot',
        state: 'current-scope-now',
        sourceCommand:
          'pnpm cli:read-only -- runtime-consumer --base-url http://127.0.0.1:4317',
        sourceDocs: [
          'docs/ecosystem/builder-start-here.md',
          'docs/ecosystem/claude-code-quickstart.md',
          'docs/ecosystem/codex-quickstart.md',
        ],
        targetFit: ['codex', 'claude-code', 'opencode', 'openhands'],
        summary:
          'Turns the read-only Switchyard seam into concrete acquisition routes when a real base URL exists.',
      },
      {
        id: 'outcome-bundle',
        label: 'Joined outcome bundle',
        state: 'repo-local-read-only',
        sourceCommand: 'pnpm cli:read-only -- outcome-bundle --app ext-kroger',
        sourceDocs: [
          'docs/ecosystem/integration-recipes.md',
          'docs/ecosystem/codex-quickstart.md',
        ],
        targetFit: ['codex', 'claude-code', 'opencode', 'openhands'],
        summary:
          'Gives one joined read-only JSON bundle without hidden runtime-payload writes.',
      },
      {
        id: 'submission-readiness',
        label: 'Submission readiness report',
        state: 'repo-local-read-only',
        sourceCommand: 'pnpm cli:read-only -- submission-readiness',
        sourceDocs: [
          'docs/ecosystem/claude-code-quickstart.md',
          'docs/ecosystem/public-distribution-bundle.ready.md',
        ],
        targetFit: [
          'codex',
          'claude-code',
          'opencode',
          'openhands',
          'openclaw',
        ],
        summary:
          'Surfaces what still blocks release or submission without pretending those external steps are already done.',
      },
    ],
  },
  publicSkillsCatalog: {
    repoOwnedStatus: 'plugin-level-public-distribution-bundle',
    publicReleaseState: 'not-yet-published',
    entries: [
      {
        id: 'shopflow-read-only-runtime-seam-consumption',
        label: 'Shopflow read-only runtime seam consumption',
        sourcePath:
          '.agents/skills/shopflow-read-only-runtime-seam-consumption/SKILL.md',
        distributionState: 'repo-local-skill-scaffold',
        targetFit: ['codex', 'claude-code'],
        summary:
          'Keeps Switchyard seam consumption honest: read-only, repo-local, and separate from merchant live proof while serving as a starter-bundle companion for Codex and Claude Code.',
        mustNotClaim: ['Public skill already distributed'],
      },
      {
        id: 'shopflow-live-browser-ops',
        label: 'Shopflow live browser ops',
        sourcePath: '.agents/skills/shopflow-live-browser-ops/SKILL.md',
        distributionState: 'repo-local-skill-scaffold',
        targetFit: ['claude-code', 'codex'],
        summary:
          'Encodes the browser/profile ownership rules, login-attempt ceiling, and focus-safe live helper order for operator lanes, which makes the Claude Code starter bundle more plug-and-play without claiming a public skills pack.',
        mustNotClaim: ['Public live-browser skill already distributed'],
      },
      {
        id: 'shopflow-builder-facing-discoverability-and-ready-sync',
        label: 'Shopflow builder-facing discoverability and ready-sync',
        sourcePath:
          '.agents/skills/shopflow-builder-facing-discoverability-and-ready-sync/SKILL.md',
        distributionState: 'repo-local-skill-scaffold',
        targetFit: ['codex', 'claude-code', 'openclaw'],
        summary:
          'Keeps agent-facing front doors, starter bundles, and ready-to-sync copy truthful instead of overclaiming public distribution.',
        mustNotClaim: ['Public discoverability skill pack already shipped'],
      },
    ],
  },
  pluginMarketplaceMetadata: {
    repoOwnedStatus: 'plugin-level-public-distribution-bundle',
    publicReleaseState: 'not-yet-published',
    entries: [
      {
        target: 'codex',
        placement: 'front-door-primary',
        packagingState: 'plugin-level-public-distribution-bundle',
        suggestedSlug: 'shopflow-read-only-builder-packet',
        title: 'Shopflow Read-only Builder Packet',
        summary:
          'Plugin-level public distribution bundle for Codex with starter bundle, sample config, install docs, proof loop, and listing payload.',
        boundaryNote:
          'Starter bundle and listing payload are repo-owned today. Do not claim an official Codex plugin, official listing, or marketplace package until the real official surface and auth path are confirmed.',
        screenshotSources: [
          'README.md',
          'docs/ecosystem/codex-quickstart.md',
          'docs/ecosystem/builder-start-here.md',
        ],
        capabilityRefs: [
          'integration-surface',
          'runtime-consumer',
          'outcome-bundle',
          'submission-readiness',
        ],
        skillsRefs: [
          'shopflow-read-only-runtime-seam-consumption',
          'shopflow-builder-facing-discoverability-and-ready-sync',
        ],
        distributionBundle: {
          truthfulSurfaceStatus: 'plugin-level-public-distribution-bundle',
          officialSurfaceStatus: 'official-surface-confirmed-auth-required',
          starterBundlePaths: [
            'docs/ecosystem/codex-quickstart.md',
            'docs/ecosystem/agent-quickstarts.md',
            'docs/ecosystem/examples/agent-target-packet.codex.json',
            'docs/ecosystem/examples/plugin-marketplace-metadata.codex.json',
          ],
          sampleConfigPaths: [
            'docs/ecosystem/examples/agent-target-packet.codex.json',
            'docs/ecosystem/examples/plugin-marketplace-metadata.codex.json',
          ],
          installDocs: [
            'docs/ecosystem/codex-quickstart.md',
            'docs/ecosystem/agent-quickstarts.md',
            'docs/ecosystem/public-distribution-bundle.ready.md',
          ],
          proofLoopCommands: [
            'pnpm cli:read-only -- agent-target-packet --target codex',
            'pnpm cli:read-only -- plugin-marketplace-metadata --target codex --output .runtime-cache/cli/plugin-marketplace-metadata.codex.json',
            'pnpm cli:read-only -- public-distribution-bundle',
          ],
          listingPayloadPaths: [
            'docs/ecosystem/examples/plugin-marketplace-metadata.codex.json',
          ],
        },
        mustNotClaim: [
          'Published Codex plugin',
          'Official Codex marketplace package',
          'Official Codex listing',
        ],
      },
      {
        target: 'claude-code',
        placement: 'front-door-primary',
        packagingState: 'plugin-level-public-distribution-bundle',
        suggestedSlug: 'shopflow-read-only-operator-packet',
        title: 'Shopflow Read-only Operator Packet',
        summary:
          'Plugin-level public distribution bundle for Claude Code with starter bundle, sample config, install docs, proof loop, listing payload, and a skills-facing companion packet.',
        boundaryNote:
          'Starter bundle and listing payload are repo-owned today. Do not claim an official Claude Code plugin, official listing, or distributed public skills pack until the real official surface and auth path are confirmed.',
        screenshotSources: [
          'docs/ecosystem/claude-code-quickstart.md',
          'docs/ecosystem/agent-quickstarts.md',
          'docs/ecosystem/public-distribution-bundle.ready.md',
        ],
        capabilityRefs: [
          'integration-surface',
          'runtime-seam',
          'submission-readiness',
        ],
        skillsRefs: [
          'shopflow-read-only-runtime-seam-consumption',
          'shopflow-live-browser-ops',
        ],
        distributionBundle: {
          truthfulSurfaceStatus: 'plugin-level-public-distribution-bundle',
          officialSurfaceStatus: 'official-surface-confirmed-auth-required',
          starterBundlePaths: [
            'docs/ecosystem/claude-code-quickstart.md',
            'docs/ecosystem/agent-quickstarts.md',
            'docs/ecosystem/examples/agent-target-packet.claude-code.json',
            'docs/ecosystem/examples/plugin-marketplace-metadata.claude-code.json',
            'docs/ecosystem/examples/public-skills-catalog.json',
          ],
          sampleConfigPaths: [
            'docs/ecosystem/examples/agent-target-packet.claude-code.json',
            'docs/ecosystem/examples/plugin-marketplace-metadata.claude-code.json',
            'docs/ecosystem/examples/public-skills-catalog.json',
          ],
          installDocs: [
            'docs/ecosystem/claude-code-quickstart.md',
            'docs/ecosystem/agent-quickstarts.md',
            'docs/ecosystem/public-skills-catalog.ready.md',
            'docs/ecosystem/public-distribution-bundle.ready.md',
          ],
          proofLoopCommands: [
            'pnpm cli:read-only -- agent-target-packet --target claude-code',
            'pnpm cli:read-only -- public-skills-catalog --output .runtime-cache/cli/public-skills-catalog.json',
            'pnpm cli:read-only -- plugin-marketplace-metadata --target claude-code --output .runtime-cache/cli/plugin-marketplace-metadata.claude-code.json',
          ],
          listingPayloadPaths: [
            'docs/ecosystem/examples/plugin-marketplace-metadata.claude-code.json',
          ],
        },
        mustNotClaim: [
          'Published Claude Code plugin',
          'Distributed public Claude Code skills pack',
          'Official Claude Code listing',
        ],
      },
      {
        target: 'openclaw',
        placement: 'public-ready-secondary',
        packagingState: 'ready-to-publish-packet',
        suggestedSlug: 'shopflow-openclaw-read-only-packet',
        title: 'Shopflow OpenClaw Read-only Packet',
        summary:
          'Ready-to-publish metadata draft for a public OpenClaw plugin-style route that keeps Shopflow read-only and below official-live claims.',
        boundaryNote:
          'Ready-to-publish packet only. Do not claim an official OpenClaw listing or official-org integration until a real public repo or approved listing surface is live.',
        screenshotSources: [
          'docs/ecosystem/openclaw-comparison.md',
          'docs/ecosystem/openclaw-public-ready-matrix.md',
          'docs/ecosystem/openclaw-publish-unblock-packet.ready.md',
        ],
        capabilityRefs: ['integration-surface', 'submission-readiness'],
        skillsRefs: ['shopflow-builder-facing-discoverability-and-ready-sync'],
        distributionBundle: {
          truthfulSurfaceStatus: 'ready-to-publish-packet',
          officialSurfaceStatus: 'official-surface-confirmed-auth-required',
          starterBundlePaths: [
            'docs/ecosystem/openclaw-comparison.md',
            'docs/ecosystem/openclaw-public-ready-matrix.md',
            'docs/ecosystem/examples/agent-target-packet.openclaw.json',
          ],
          sampleConfigPaths: [
            'docs/ecosystem/examples/agent-target-packet.openclaw.json',
            'docs/ecosystem/examples/plugin-marketplace-metadata.openclaw.json',
          ],
          installDocs: [
            'docs/ecosystem/openclaw-comparison.md',
            'docs/ecosystem/openclaw-public-ready-matrix.md',
            'docs/ecosystem/openclaw-publish-unblock-packet.ready.md',
          ],
          proofLoopCommands: [
            'pnpm cli:read-only -- agent-target-packet --target openclaw',
            'pnpm cli:read-only -- plugin-marketplace-metadata --target openclaw',
            'pnpm cli:read-only -- public-distribution-bundle',
          ],
          listingPayloadPaths: [
            'docs/ecosystem/examples/plugin-marketplace-metadata.openclaw.json',
          ],
        },
        mustNotClaim: [
          'Official OpenClaw listing',
          'Official OpenClaw integration',
        ],
      },
    ],
  },
});

export const publicMcpCapabilityMap = publicMcpCapabilityMapSchema.parse(
  agentIntegrationBundle.publicMcpCapabilityMap
);

export const publicSkillsCatalog = publicSkillsCatalogSchema.parse(
  agentIntegrationBundle.publicSkillsCatalog
);

export const pluginMarketplaceMetadataPacket =
  pluginMarketplaceMetadataPacketSchema.parse(
    agentIntegrationBundle.pluginMarketplaceMetadata
  );

export function getAgentIntegrationProfile(target: string) {
  return agentIntegrationBundle.profiles.find(
    (profile) => profile.target === target
  );
}

export function getAgentTargetPacket(target: string) {
  const profile = getAgentIntegrationProfile(target);
  if (!profile) {
    return undefined;
  }

  return agentTargetPacketSchema.parse({
    surfaceId: 'agent-target-packet',
    schemaVersion: 'shopflow.agent-target-packet.v1',
    readOnly: true,
    target: profile.target,
    placement: profile.placement,
    currentEntryState: profile.currentEntryState,
    quickstartPath: profile.quickstartPath,
    primaryCommand: profile.primaryCommand,
    recommendedCommands: profile.recommendedCommands,
    repoOwnedArtifacts: profile.repoOwnedArtifacts,
    capabilities: publicMcpCapabilityMap.capabilities.filter((entry) =>
      entry.targetFit.includes(profile.target)
    ),
    skills: publicSkillsCatalog.entries.filter((entry) =>
      entry.targetFit.includes(profile.target)
    ),
    pluginMetadata:
      pluginMarketplaceMetadataPacket.entries.find(
        (entry) => entry.target === profile.target
      ) ?? null,
    summary: profile.summary,
    boundaryNote: agentIntegrationBundle.boundaryNote,
    mustNotClaim: profile.mustNotClaim,
    nextHumanStep: profile.nextHumanStep,
  });
}

export function getAgentIntegrationExampleArtifacts() {
  const agentTargetPackets = Object.fromEntries(
    builderEcosystemTargetValues.map((target) => [
      target,
      getAgentTargetPacket(target),
    ])
  );

  return {
    agentIntegrationBundle,
    agentTargetPackets,
    publicMcpCapabilityMap,
    publicSkillsCatalog,
    pluginMarketplaceMetadata: pluginMarketplaceMetadataPacket,
  };
}

export function getPluginMarketplaceMetadataEntry(target: string) {
  return pluginMarketplaceMetadataPacket.entries.find(
    (entry) => entry.target === target
  );
}
