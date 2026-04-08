import {
  builderIntegrationSurface,
  builderIntegrationSurfaceSchema,
  providerRuntimeSeam,
  providerRuntimeSeamSchema,
  publicDistributionBundle,
  publicDistributionBundleSchema,
} from '@shopflow/contracts';
import {
  createSubmissionReadinessReport,
  submissionReadinessReportSchema,
} from '../../../tooling/release/write-submission-readiness-report';

export const shopflowMcpToolIds = [
  'get_integration_surface',
  'get_runtime_seam',
  'get_submission_readiness',
  'get_public_distribution_bundle',
] as const;

export type ShopflowMcpToolId = (typeof shopflowMcpToolIds)[number];

export const shopflowMcpToolDescriptions: Record<ShopflowMcpToolId, string> = {
  get_integration_surface:
    'Return the current builder integration surface JSON for today/current-scope/later/no-go/owner-decision.',
  get_runtime_seam:
    'Return the current read-only provider runtime seam JSON and its Shopflow ownership boundary.',
  get_submission_readiness:
    'Return the current submission-readiness report JSON generated from repo-owned artifacts and verification inputs.',
  get_public_distribution_bundle:
    'Return the current public distribution bundle JSON for read-only API/MCP/skills/plugin marketplace surfaces.',
};

export type ShopflowMcpPayloadByTool = {
  get_integration_surface: typeof builderIntegrationSurface;
  get_runtime_seam: typeof providerRuntimeSeam;
  get_submission_readiness: ReturnType<typeof createSubmissionReadinessReport>;
  get_public_distribution_bundle: typeof publicDistributionBundle;
};

export function buildShopflowMcpPayload<T extends ShopflowMcpToolId>(
  toolId: T
): ShopflowMcpPayloadByTool[T] {
  switch (toolId) {
    case 'get_integration_surface':
      return builderIntegrationSurfaceSchema.parse(
        builderIntegrationSurface
      ) as ShopflowMcpPayloadByTool[T];
    case 'get_runtime_seam':
      return providerRuntimeSeamSchema.parse(
        providerRuntimeSeam
      ) as ShopflowMcpPayloadByTool[T];
    case 'get_submission_readiness':
      return submissionReadinessReportSchema.parse(
        createSubmissionReadinessReport()
      ) as ShopflowMcpPayloadByTool[T];
    case 'get_public_distribution_bundle':
      return publicDistributionBundleSchema.parse(
        publicDistributionBundle
      ) as ShopflowMcpPayloadByTool[T];
  }
}

export function renderShopflowMcpPayloadText(
  toolId: ShopflowMcpToolId,
  payload: ShopflowMcpPayloadByTool[ShopflowMcpToolId]
) {
  return [
    `Shopflow ${toolId}`,
    '',
    JSON.stringify(payload, null, 2),
  ].join('\n');
}
