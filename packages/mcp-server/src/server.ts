import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  builderIntegrationSurfaceSchema,
  providerRuntimeSeamSchema,
  publicDistributionBundleSchema,
} from '@shopflow/contracts';
import {
  buildShopflowMcpPayload,
  type ShopflowMcpToolId,
  shopflowMcpToolDescriptions,
} from './payloads';
import { submissionReadinessReportSchema } from '../../../tooling/release/write-submission-readiness-report';

const emptyInputSchema = z.object({});

function createTextResult(
  toolId: ShopflowMcpToolId,
  payload: Record<string, unknown>
) {
  return {
    content: [
      {
        type: 'text' as const,
        text: [
          `Shopflow ${toolId}`,
          '',
          JSON.stringify(payload, null, 2),
        ].join('\n'),
      },
    ],
    structuredContent: payload,
  };
}

export function createShopflowReadOnlyMcpServer() {
  const server = new McpServer(
    {
      name: 'shopflow-read-only-mcp',
      version: '0.1.3',
    },
    {
      instructions:
        'Read-only stdio MCP surface for Shopflow repo truth, runtime seam, submission readiness, and distribution bundle access.',
    }
  );

  server.registerTool(
    'get_integration_surface',
    {
      title: 'Get integration surface',
      description: shopflowMcpToolDescriptions.get_integration_surface,
      inputSchema: emptyInputSchema,
      outputSchema: builderIntegrationSurfaceSchema,
    },
    async () =>
      createTextResult(
        'get_integration_surface',
        buildShopflowMcpPayload('get_integration_surface')
      )
  );

  server.registerTool(
    'get_runtime_seam',
    {
      title: 'Get runtime seam',
      description: shopflowMcpToolDescriptions.get_runtime_seam,
      inputSchema: emptyInputSchema,
      outputSchema: providerRuntimeSeamSchema,
    },
    async () =>
      createTextResult(
        'get_runtime_seam',
        buildShopflowMcpPayload('get_runtime_seam')
      )
  );

  server.registerTool(
    'get_submission_readiness',
    {
      title: 'Get submission readiness',
      description: shopflowMcpToolDescriptions.get_submission_readiness,
      inputSchema: emptyInputSchema,
      outputSchema: submissionReadinessReportSchema,
    },
    async () =>
      createTextResult(
        'get_submission_readiness',
        buildShopflowMcpPayload('get_submission_readiness')
      )
  );

  server.registerTool(
    'get_public_distribution_bundle',
    {
      title: 'Get public distribution bundle',
      description: shopflowMcpToolDescriptions.get_public_distribution_bundle,
      inputSchema: emptyInputSchema,
      outputSchema: publicDistributionBundleSchema,
    },
    async () =>
      createTextResult(
        'get_public_distribution_bundle',
        buildShopflowMcpPayload('get_public_distribution_bundle')
      )
  );

  return server;
}

export async function runShopflowReadOnlyMcpServer() {
  const transport = new StdioServerTransport();
  const server = createShopflowReadOnlyMcpServer();
  await server.connect(transport);
}
