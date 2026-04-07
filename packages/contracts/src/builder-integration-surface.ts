import { z } from 'zod';

export const builderIntegrationPhaseValues = [
  'today',
  'current-scope-now',
  'later',
  'no-go',
  'owner-decision',
] as const;

export const builderIntegrationBucketSchema = z.object({
  today: z.array(z.string().min(1)).min(1),
  currentScopeNow: z.array(z.string().min(1)).min(1),
  later: z.array(z.string().min(1)).min(1),
  noGo: z.array(z.string().min(1)).min(1),
  ownerDecision: z.array(z.string().min(1)).min(1),
});

export const builderEcosystemTargetValues = [
  'codex',
  'claude-code',
  'opencode',
  'openhands',
  'openclaw',
] as const;

export const builderEcosystemPlacementValues = [
  'front-door-primary',
  'public-ready-secondary',
  'ecosystem-secondary',
  'comparison-only',
  'owner-decision',
] as const;

export const builderSurfaceCatalogIdValues = [
  'agent-integration-bundle',
  'builder-integration-surface',
  'provider-runtime-seam',
  'provider-runtime-consumer',
  'public-distribution-bundle',
  'builder-app-snapshot',
  'operator-decision-brief',
  'workflow-copilot-brief',
  'submission-readiness-report',
  'builder-outcome-bundle',
] as const;

export const builderSurfaceCatalogCategoryValues = [
  'contract-truth',
  'read-model',
  'workflow-brief',
  'artifact-report',
] as const;

export const builderSurfaceEntrypointKindValues = [
  'import',
  'example-json',
  'command',
  'generated-artifact',
  'docs',
] as const;

export const builderEcosystemFitEntrySchema = z.object({
  target: z.enum(builderEcosystemTargetValues),
  placement: z.enum(builderEcosystemPlacementValues),
  truthfulWordingNow: z.string().min(1),
  mustNotClaimNow: z.array(z.string().min(1)).min(1),
});

export const builderSurfaceEntrypointSchema = z.object({
  kind: z.enum(builderSurfaceEntrypointKindValues),
  value: z.string().min(1),
  note: z.string().min(1).optional(),
});

const builderExampleRackAppIds = [
  'ext-albertsons',
  'ext-amazon',
  'ext-kroger',
  'ext-temu',
] as const;

function buildExampleRackEntrypoints(
  prefix:
    | 'builder-app-snapshot'
    | 'operator-decision-brief'
    | 'workflow-copilot-brief'
    | 'builder-outcome-bundle'
) {
  return builderExampleRackAppIds.map((appId) => ({
    kind: 'example-json' as const,
    value: `docs/ecosystem/examples/${prefix}.${appId}.json`,
  }));
}

export const builderSurfaceCatalogEntrySchema = z.object({
  id: z.enum(builderSurfaceCatalogIdValues),
  label: z.string().min(1),
  category: z.enum(builderSurfaceCatalogCategoryValues),
  availability: z.enum(builderIntegrationPhaseValues),
  readOnly: z.literal(true),
  entrypoints: z.array(builderSurfaceEntrypointSchema).min(1),
});

export const builderRepoLocalToolSchema = z.object({
  id: z.enum([
    'write-builder-runtime-payloads',
    'write-builder-example-rack',
    'write-builder-outcome-bundle',
    'read-only-cli-prototype',
  ]),
  label: z.string().min(1),
  availability: z.enum(builderIntegrationPhaseValues),
  readOnly: z.literal(true),
  command: z.string().min(1),
  outputPath: z.string().min(1),
  summary: z.string().min(1),
});

export const productLanguageBoundarySchema = z.object({
  publicSurfaceDefault: z.literal('en'),
  productUiDefault: z.literal('en'),
  productUiOptionalLocale: z.literal('zh-CN'),
  shellLevelLocaleRouteToggle: z.literal(true),
  persistedLanguageSettingsSystem: z.literal(false),
  noScatteredBilingualLiterals: z.literal(true),
});

export const builderIntegrationSurfaceSchema = z.object({
  surfaceId: z.literal('builder-integration-surface'),
  schemaVersion: z.literal('shopflow.builder-integration-surface.v1'),
  readOnly: z.literal(true),
  apiSubstrateFirst: builderIntegrationBucketSchema,
  surfaceCatalog: z.array(builderSurfaceCatalogEntrySchema).min(5),
  repoLocalTooling: z.array(builderRepoLocalToolSchema).min(1),
  ecosystemFit: z.array(builderEcosystemFitEntrySchema).length(5),
  productLanguageBoundary: productLanguageBoundarySchema,
});

export type BuilderIntegrationSurface = z.infer<
  typeof builderIntegrationSurfaceSchema
>;

export const builderIntegrationSurface = builderIntegrationSurfaceSchema.parse({
  surfaceId: 'builder-integration-surface',
  schemaVersion: 'shopflow.builder-integration-surface.v1',
  readOnly: true,
  apiSubstrateFirst: {
    today: [
      'Typed store-adapter contracts and verified-scope boundaries',
      'Agent-specific onboarding bundle that gives Codex / Claude Code a truthful quickstart path and gives OpenClaw a public-ready route without pretending official listing is already done',
      'Read-only provider-runtime seam contract that keeps external runtime acquisition boundaries explicit without turning Shopflow into a provider runtime',
      'Read-only runtime truth for detection, latest output, recent activity, and evidence queue state',
      'Workflow decision briefs and workflow-copilot briefs',
      'Review-bundle and submission-readiness artifacts',
      'Repo-local read-only outcome bundle command that joins the integration surface, prefers generated runtime payload files when available, and adds generated artifact summaries plus source pointers when repo outputs exist',
    ],
    currentScopeNow: [
      'Keep the builder-facing integration substrate machine-readable and stable',
      'Ship Codex / Claude Code plugin-level public distribution bundles with starter bundle, sample config, install docs, proof loop, and listing payload while keeping official-listing claims conditional on real official surfaces',
      'Keep AI inside the operator workflow instead of in a generic chat surface',
      'Keep public copy English-first while product UI stays English-default with zh-CN support through shared locale catalogs',
      'Keep new user-visible strings out of scattered bilingual literals',
      'Keep repo-local outcome tooling read-only and truthful instead of presenting it as a public CLI commitment',
    ],
    later: [
      'Read-only MCP surface backed by the same runtime truth',
      'Read-only public API transport',
      'Generated client or thin SDK',
      'CLI wrapper or skills pack built on the same read models',
    ],
    noGo: [
      'Write-capable MCP',
      'Hosted SaaS control plane',
      'Generic autonomous shopping assistant',
      'Public wording that outruns reviewed live evidence',
    ],
    ownerDecision: [
      'Public CLI commitments',
      'Official-listing language for ecosystems that may or may not expose an official public surface',
      'Publisher namespace / slug / irreversible channel choices',
      'Public API publication beyond the current repo-owned substrate',
    ],
  },
  surfaceCatalog: [
    {
      id: 'agent-integration-bundle',
      label: 'Agent integration bundle',
      category: 'artifact-report',
      availability: 'current-scope-now',
      readOnly: true,
      entrypoints: [
        {
          kind: 'import',
          value: '@shopflow/contracts:agentIntegrationBundle',
          note: 'Use when a coding tool needs one machine-readable packet for agent quickstarts, MCP capability prep, skills scaffolds, and plugin listing-payload bundles.',
        },
        {
          kind: 'command',
          value: 'pnpm cli:read-only -- agent-integration-bundle',
        },
        {
          kind: 'command',
          value: 'pnpm cli:read-only -- agent-target-packet --target <target>',
          note: 'Use when one target ecosystem needs a smaller handoff packet instead of the full onboarding bundle.',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/agent-quickstarts.md',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/codex-quickstart.md',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/claude-code-quickstart.md',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/openclaw-comparison.md',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/agent-distribution-artifacts.md',
        },
      ],
    },
    {
      id: 'builder-integration-surface',
      label: 'Builder integration surface contract',
      category: 'contract-truth',
      availability: 'today',
      readOnly: true,
      entrypoints: [
        {
          kind: 'import',
          value: '@shopflow/contracts:builderIntegrationSurface',
          note: 'Use when a builder needs the machine-readable today/current-scope/later/no-go/owner-decision matrix.',
        },
        {
          kind: 'import',
          value: '@shopflow/contracts:builderIntegrationSurfaceSchema',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/builder-read-models.md',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/builder-start-here.md',
          note: 'Fastest builder-facing front door when a reader needs the current-scope map before diving into imports or examples.',
        },
      ],
    },
    {
      id: 'provider-runtime-seam',
      label: 'Provider runtime seam contract',
      category: 'contract-truth',
      availability: 'today',
      readOnly: true,
      entrypoints: [
        {
          kind: 'import',
          value: '@shopflow/contracts:providerRuntimeSeam',
          note: 'Use when a builder needs the explicit Shopflow-vs-runtime ownership boundary before wiring any external acquisition flow.',
        },
        {
          kind: 'import',
          value: '@shopflow/contracts:providerRuntimeSeamSchema',
        },
        {
          kind: 'docs',
          value: 'docs/adr/ADR-004-switchyard-provider-runtime-seam.md',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/builder-read-models.md',
          note: 'Builder-facing explanation of why the seam is read-only contract truth, not merchant live proof.',
        },
      ],
    },
    {
      id: 'provider-runtime-consumer',
      label: 'Provider runtime consumer snapshot',
      category: 'read-model',
      availability: 'current-scope-now',
      readOnly: true,
      entrypoints: [
        {
          kind: 'import',
          value: '@shopflow/core:createProviderRuntimeConsumer',
          note: 'Use when a Shopflow-side consumer needs thin Switchyard acquisition routes without turning the seam into a public runtime product.',
        },
        {
          kind: 'command',
          value:
            'pnpm cli:read-only -- runtime-consumer --base-url <switchyard-url>',
          note: 'Repo-local packet for consuming the Switchyard seam through a real Shopflow consumer path.',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/builder-read-models.md',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/integration-recipes.md',
        },
      ],
    },
    {
      id: 'public-distribution-bundle',
      label: 'Public distribution bundle',
      category: 'artifact-report',
      availability: 'current-scope-now',
      readOnly: true,
      entrypoints: [
        {
          kind: 'import',
          value: '@shopflow/contracts:publicDistributionBundle',
          note: 'Use when a reader needs one machine-readable packet for current repo-owned public distribution execution across public API / MCP / skills / plugin-marketplace surfaces without claiming public release.',
        },
        {
          kind: 'command',
          value: 'pnpm cli:read-only -- public-distribution-bundle',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/public-distribution-bundle.ready.md',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/ready-to-sync-artifacts.md',
        },
      ],
    },
    {
      id: 'builder-app-snapshot',
      label: 'Builder app snapshot',
      category: 'read-model',
      availability: 'today',
      readOnly: true,
      entrypoints: [
        {
          kind: 'import',
          value: '@shopflow/runtime:createBuilderAppSnapshot',
        },
        {
          kind: 'import',
          value: '@shopflow/runtime:builderAppSnapshotSchema',
        },
        ...buildExampleRackEntrypoints('builder-app-snapshot'),
        {
          kind: 'docs',
          value: 'docs/ecosystem/integration-recipes.md',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/examples/README.md',
        },
      ],
    },
    {
      id: 'operator-decision-brief',
      label: 'Operator decision brief',
      category: 'workflow-brief',
      availability: 'today',
      readOnly: true,
      entrypoints: [
        {
          kind: 'import',
          value: '@shopflow/core:createOperatorDecisionBrief',
        },
        {
          kind: 'import',
          value: '@shopflow/contracts:operatorDecisionBriefSchema',
        },
        ...buildExampleRackEntrypoints('operator-decision-brief'),
        {
          kind: 'docs',
          value: 'docs/ecosystem/integration-recipes.md',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/examples/README.md',
        },
      ],
    },
    {
      id: 'workflow-copilot-brief',
      label: 'Workflow copilot brief schema',
      category: 'workflow-brief',
      availability: 'today',
      readOnly: true,
      entrypoints: [
        {
          kind: 'import',
          value: '@shopflow/contracts:workflowCopilotBriefSchema',
        },
        ...buildExampleRackEntrypoints('workflow-copilot-brief'),
        {
          kind: 'docs',
          value: 'docs/ecosystem/builder-read-models.md',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/integration-recipes.md',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/examples/README.md',
        },
      ],
    },
    {
      id: 'submission-readiness-report',
      label: 'Submission readiness report',
      category: 'artifact-report',
      availability: 'today',
      readOnly: true,
      entrypoints: [
        {
          kind: 'command',
          value: 'pnpm release:write-submission-readiness-report',
        },
        {
          kind: 'generated-artifact',
          value: '.runtime-cache/release-artifacts/submission-readiness.json',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/integration-recipes.md',
          note: 'Recipe page for release-state consumption without implying a public release platform.',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/ready-to-sync-artifacts.md',
        },
      ],
    },
    {
      id: 'builder-outcome-bundle',
      label: 'Builder outcome bundle',
      category: 'artifact-report',
      availability: 'today',
      readOnly: true,
      entrypoints: [
        {
          kind: 'command',
          value: 'pnpm builder:write-outcome-bundle',
          note: 'Repo-local read-only bundle that prefers generated runtime payload files when they exist, falls back to checked-in examples when they do not, and adds generated release-artifact summaries.',
        },
        {
          kind: 'generated-artifact',
          value: '.runtime-cache/builder/builder-outcome-bundle.json',
        },
        ...buildExampleRackEntrypoints('builder-outcome-bundle'),
        {
          kind: 'docs',
          value: 'docs/ecosystem/integration-recipes.md',
          note: 'Recipe page for consuming the read-only outcome tooling without implying a public CLI or API.',
        },
        {
          kind: 'docs',
          value: 'docs/ecosystem/examples/README.md',
        },
      ],
    },
  ],
  repoLocalTooling: [
    {
      id: 'write-builder-runtime-payloads',
      label: 'Repo-local builder runtime payload writer',
      availability: 'today',
      readOnly: true,
      command: 'pnpm builder:write-runtime-payloads -- --app <appId>',
      outputPath: '.runtime-cache/builder/',
      summary:
        'Writes repo-local builder snapshot, operator decision brief, and workflow-copilot brief JSON files from canonical runtime truth for supported current-scope apps such as ext-albertsons, ext-amazon, ext-kroger, and ext-temu.',
    },
    {
      id: 'write-builder-example-rack',
      label: 'Repo-local checked-in example rack refresh',
      availability: 'today',
      readOnly: true,
      command: 'pnpm builder:refresh-example-rack',
      outputPath: 'docs/ecosystem/examples/',
      summary:
        'Refreshes the checked-in multi-app example rack from repo-owned generated runtime payloads and outcome bundles for ext-albertsons, ext-amazon, ext-kroger, and ext-temu.',
    },
    {
      id: 'write-builder-outcome-bundle',
      label: 'Repo-local builder outcome bundle writer',
      availability: 'today',
      readOnly: true,
      command: 'pnpm builder:write-outcome-bundle',
      outputPath: '.runtime-cache/builder/builder-outcome-bundle.json',
      summary:
        'Writes a repo-local read-only bundle that prefers generated runtime payload files, falls back to checked-in examples when needed, and adds generated artifact summaries without claiming a public CLI.',
    },
    {
      id: 'read-only-cli-prototype',
      label: 'Repo-local read-only CLI prototype',
      availability: 'current-scope-now',
      readOnly: true,
      command: 'pnpm cli:read-only -- integration-surface',
      outputPath: '.runtime-cache/cli/',
      summary:
        'Provides one repo-local read-only CLI wrapper for agent-integration-bundle, agent-target-packet, integration-surface, runtime-seam, runtime-consumer, public-distribution-bundle, outcome-bundle, and submission-readiness without turning that convenience wrapper into a public CLI commitment.',
    },
  ],
  ecosystemFit: [
    {
      target: 'codex',
      placement: 'front-door-primary',
      truthfulWordingNow:
        'Strong builder fit through typed contracts, workflow briefs, read-only builder snapshots, and a plugin-level public distribution bundle with starter packet, sample config, install docs, proof loop, and listing payload.',
      mustNotClaimNow: [
        'Official integration',
        'Official plugin',
        'Official listing',
      ],
    },
    {
      target: 'claude-code',
      placement: 'front-door-primary',
      truthfulWordingNow:
        'Strong builder fit for the same builder-facing reasons as Codex, plus a stronger skills-facing plugin-level public distribution bundle.',
      mustNotClaimNow: [
        'Official integration',
        'Official plugin',
        'Official listing',
        'Shipped skills pack',
      ],
    },
    {
      target: 'opencode',
      placement: 'ecosystem-secondary',
      truthfulWordingNow:
        'Useful comparison and later-facing integration candidate when CLI or skills packaging becomes explicit.',
      mustNotClaimNow: ['Main front-door placement', 'Official package'],
    },
    {
      target: 'openhands',
      placement: 'ecosystem-secondary',
      truthfulWordingNow:
        'Useful comparison context for agentic coding and workflow automation.',
      mustNotClaimNow: ['Main front-door placement', 'Official package'],
    },
    {
      target: 'openclaw',
      placement: 'public-ready-secondary',
      truthfulWordingNow:
        'Public-ready secondary route with explicit install, discovery, and proof paths, while official-listing claims remain conditional on real external surfaces.',
      mustNotClaimNow: [
        'Official OpenClaw listing',
        'Official OpenClaw integration',
      ],
    },
  ],
  productLanguageBoundary: {
    publicSurfaceDefault: 'en',
    productUiDefault: 'en',
    productUiOptionalLocale: 'zh-CN',
    shellLevelLocaleRouteToggle: true,
    persistedLanguageSettingsSystem: false,
    noScatteredBilingualLiterals: true,
  },
});
