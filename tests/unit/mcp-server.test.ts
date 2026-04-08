import { describe, expect, it } from 'vitest';
import {
  builderIntegrationSurface,
  publicDistributionBundle,
  providerRuntimeSeam,
} from '../../packages/contracts/src';
import {
  buildShopflowMcpPayload,
  createShopflowReadOnlyMcpServer,
  shopflowMcpToolIds,
} from '../../packages/mcp-server/src';
import {
  buildReadOnlyCliPayload,
  readOnlyCliCommandValues,
} from '../../tooling/cli/read-only';
import {
  createSubmissionReadinessReport,
  submissionReadinessReportSchema,
} from '../../tooling/release/write-submission-readiness-report';

function withoutGeneratedAt<T extends { generatedAt: string }>(payload: T) {
  const clone = { ...payload };
  delete clone.generatedAt;
  return clone;
}

describe('shopflow mcp server payloads', () => {
  it('maps all four MCP tools to stable ids', () => {
    expect(shopflowMcpToolIds).toEqual([
      'get_integration_surface',
      'get_runtime_seam',
      'get_submission_readiness',
      'get_public_distribution_bundle',
    ]);
  });

  it('keeps MCP payloads equal to the existing repo-local truth sources', () => {
    expect(buildShopflowMcpPayload('get_integration_surface')).toEqual(
      builderIntegrationSurface
    );
    expect(buildShopflowMcpPayload('get_runtime_seam')).toEqual(
      providerRuntimeSeam
    );
    expect(buildShopflowMcpPayload('get_public_distribution_bundle')).toEqual(
      publicDistributionBundle
    );
    expect(
      withoutGeneratedAt(
        buildShopflowMcpPayload('get_submission_readiness') as ReturnType<
          typeof createSubmissionReadinessReport
        >
      )
    ).toEqual(
      withoutGeneratedAt(
        submissionReadinessReportSchema.parse(createSubmissionReadinessReport())
      )
    );
  });

  it('keeps MCP payloads equal to the overlapping read-only CLI commands', () => {
    expect(
      buildShopflowMcpPayload('get_integration_surface')
    ).toEqual(
      buildReadOnlyCliPayload({
        command: 'integration-surface',
      })
    );
    expect(buildShopflowMcpPayload('get_runtime_seam')).toEqual(
      buildReadOnlyCliPayload({
        command: 'runtime-seam',
      })
    );
    expect(
      buildShopflowMcpPayload('get_public_distribution_bundle')
    ).toEqual(
      buildReadOnlyCliPayload({
        command: 'public-distribution-bundle',
      })
    );
    expect(
      withoutGeneratedAt(
        buildShopflowMcpPayload('get_submission_readiness') as ReturnType<
          typeof createSubmissionReadinessReport
        >
      )
    ).toEqual(
      withoutGeneratedAt(
        buildReadOnlyCliPayload({
          command: 'submission-readiness',
        }) as ReturnType<typeof createSubmissionReadinessReport>
      )
    );
  });

  it('does not change the existing read-only CLI command roster', () => {
    expect(readOnlyCliCommandValues).toEqual(
      expect.arrayContaining([
        'integration-surface',
        'runtime-seam',
        'submission-readiness',
        'public-distribution-bundle',
      ])
    );
  });

  it('registers the four MCP tools on the server', () => {
    const server = createShopflowReadOnlyMcpServer();

    expect(server.server.getCapabilities()?.tools).toBeDefined();
    expect(server.server.getCapabilities()?.tools).toMatchObject({});
  });
});
