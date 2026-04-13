import {
  builderIntegrationSurface,
  builderIntegrationSurfaceSchema,
  operatorDecisionBriefSchema,
  workflowCopilotBriefSchema,
} from '@shopflow/contracts';
import { z } from 'zod';
import { builderAppSnapshotSchema } from './builder-app-snapshot';

export const builderOutcomeArtifactPointerSchema = z.object({
  id: z.enum(['artifact-manifest', 'submission-readiness-report']),
  path: z.string().min(1),
  command: z.string().min(1),
  summary: z.string().min(1),
});

export const builderDiscoverabilityRouteSchema = z.object({
  id: z.enum([
    'builder-start-here',
    'integration-recipes',
    'examples-index',
    'builder-read-models',
    'local-outcome-bundle-command',
  ]),
  audience: z.enum(['builder', 'maintainer', 'public-sync']),
  kind: z.enum(['docs', 'command']),
  value: z.string().min(1),
  summary: z.string().min(1),
});

export const builderReadyToSyncArtifactSchema = z.object({
  id: z.enum([
    'public-copy-packet',
    'paste-ready-public-copy',
    'release-body',
    'repo-description',
  ]),
  path: z.string().min(1),
  destination: z.string().min(1),
  summary: z.string().min(1),
});

export const builderPayloadSourceSchema = z.object({
  surfaceId: z.enum([
    'builder-app-snapshot',
    'operator-decision-brief',
    'workflow-copilot-brief',
  ]),
  kind: z.enum([
    'generated-runtime-file',
    'explicit-input-file',
    'checked-in-example',
  ]),
  path: z.string().min(1),
});

export const builderOutcomeBundleSchema = z.object({
  bundleId: z.literal('builder-outcome-bundle'),
  schemaVersion: z.literal('shopflow.builder-outcome-bundle.v2'),
  readOnly: z.literal(true),
  generatedAt: z.string().datetime(),
  appId: z.string().min(1),
  integrationSurface: builderIntegrationSurfaceSchema,
  discoverabilityRoutes: z.array(builderDiscoverabilityRouteSchema).length(5),
  payloads: z.object({
    builderAppSnapshot: builderAppSnapshotSchema,
    operatorDecisionBrief: operatorDecisionBriefSchema,
    workflowCopilotBrief: workflowCopilotBriefSchema,
  }),
  payloadSources: z.object({
    builderAppSnapshot: builderPayloadSourceSchema,
    operatorDecisionBrief: builderPayloadSourceSchema,
    workflowCopilotBrief: builderPayloadSourceSchema,
  }),
  artifactPointers: z.array(builderOutcomeArtifactPointerSchema).length(2),
  readyToSyncArtifacts: z.array(builderReadyToSyncArtifactSchema).length(4),
});

export type BuilderOutcomeBundle = z.infer<typeof builderOutcomeBundleSchema>;

export function createBuilderOutcomeBundle({
  generatedAt,
  builderAppSnapshot,
  operatorDecisionBrief,
  workflowCopilotBrief,
  payloadSources,
}: {
  generatedAt?: string;
  builderAppSnapshot: z.input<typeof builderAppSnapshotSchema>;
  operatorDecisionBrief: z.input<typeof operatorDecisionBriefSchema>;
  workflowCopilotBrief: z.input<typeof workflowCopilotBriefSchema>;
  payloadSources: z.input<
    typeof builderOutcomeBundleSchema.shape.payloadSources
  >;
}): BuilderOutcomeBundle {
  return builderOutcomeBundleSchema.parse({
    bundleId: 'builder-outcome-bundle',
    schemaVersion: 'shopflow.builder-outcome-bundle.v2',
    readOnly: true,
    generatedAt: generatedAt ?? new Date().toISOString(),
    appId: builderAppSnapshot.appId,
    integrationSurface: builderIntegrationSurface,
    discoverabilityRoutes: [
      {
        id: 'builder-start-here',
        audience: 'builder',
        kind: 'docs',
        value: 'docs/ecosystem/builder-start-here.md',
        summary:
          'Shortest builder-facing front door for choosing the right current-scope entrypoint without overclaiming a public platform.',
      },
      {
        id: 'integration-recipes',
        audience: 'builder',
        kind: 'docs',
        value: 'docs/ecosystem/integration-recipes.md',
        summary:
          'Step-by-step current-scope recipes for inspecting contracts, generating a joined outcome bundle, and consuming ready-to-sync copy.',
      },
      {
        id: 'examples-index',
        audience: 'builder',
        kind: 'docs',
        value: 'docs/ecosystem/examples/README.md',
        summary:
          'Index page for the checked-in snapshot, decision-brief, workflow-brief, and outcome-bundle examples.',
      },
      {
        id: 'builder-read-models',
        audience: 'maintainer',
        kind: 'docs',
        value: 'docs/ecosystem/builder-read-models.md',
        summary:
          'Reference page for the typed builder read models, workflow briefs, and repo-local outcome tooling.',
      },
      {
        id: 'local-outcome-bundle-command',
        audience: 'builder',
        kind: 'command',
        value: 'pnpm builder:write-outcome-bundle -- --stdout',
        summary:
          'Fastest repo-local way to emit one read-only joined bundle for builders and coding tools.',
      },
    ],
    payloads: {
      builderAppSnapshot,
      operatorDecisionBrief,
      workflowCopilotBrief,
    },
    payloadSources,
    artifactPointers: [
      {
        id: 'artifact-manifest',
        path: '.runtime-cache/release-artifacts/manifest.json',
        command: 'pnpm package:artifacts',
        summary:
          'Repo-owned review artifact manifest for all 8+1 apps after packaging completes.',
      },
      {
        id: 'submission-readiness-report',
        path: '.runtime-cache/release-artifacts/submission-readiness.json',
        command: 'pnpm release:write-submission-readiness-report',
        summary:
          'Repo-owned submission-readiness checklist that keeps claim-gated and internal-alpha boundaries explicit.',
      },
    ],
    readyToSyncArtifacts: [
      {
        id: 'public-copy-packet',
        path: '.agents/Tasks/WAVE1-public-sync/public-copy.ready.md',
        destination: 'sync packet overview',
        summary:
          'Short packet that explains which current-scope public copy is ready to paste and what it still must not overclaim.',
      },
      {
        id: 'paste-ready-public-copy',
        path: '.agents/Tasks/WAVE1-public-sync/ready-to-sync-public-copy.md',
        destination: 'GitHub about, release notes, or social/page drafts',
        summary:
          'Paste-ready snippets and destination guidance for external sync work that still remains repo-truthful.',
      },
      {
        id: 'release-body',
        path: '.agents/Tasks/WAVE1-public-sync/release-body.ready.md',
        destination: 'release body starter',
        summary:
          'Short release-note block that stays inside current claim boundaries.',
      },
      {
        id: 'repo-description',
        path: '.agents/Tasks/WAVE1-public-sync/repo-description.ready.md',
        destination: 'GitHub repo description',
        summary:
          'One-line repo description that names the product shape without implying public API, MCP, or CLI availability.',
      },
    ],
  });
}
