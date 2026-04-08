import { afterEach, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolveFromRepo } from '../support/repo-paths';

const spawnedClients: Client[] = [];
const spawnedTransports: StdioClientTransport[] = [];

async function connectClient() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      '--import',
      'tsx',
      resolveFromRepo('packages/mcp-server/bin/shopflow-mcp.mjs'),
    ],
    cwd: resolveFromRepo(),
    stderr: 'pipe',
  });
  const client = new Client({
    name: 'shopflow-mcp-test-client',
    version: '0.1.0',
  });

  await client.connect(transport);
  spawnedClients.push(client);
  spawnedTransports.push(transport);

  return client;
}

afterEach(async () => {
  while (spawnedClients.length > 0) {
    const client = spawnedClients.pop();
    await client?.close();
  }

  while (spawnedTransports.length > 0) {
    const transport = spawnedTransports.pop();
    await transport?.close();
  }
});

describe('shopflow mcp stdio server', () => {
  it('lists the four read-only tools through stdio', async () => {
    const client = await connectClient();
    const response = await client.listTools();
    const toolNames = response.tools.map((tool) => tool.name).sort();

    expect(toolNames).toEqual([
      'get_integration_surface',
      'get_public_distribution_bundle',
      'get_runtime_seam',
      'get_submission_readiness',
    ]);
  });

  it('returns structured JSON from each stdio tool', async () => {
    const client = await connectClient();

    const integration = await client.callTool({
      name: 'get_integration_surface',
      arguments: {},
    });
    const seam = await client.callTool({
      name: 'get_runtime_seam',
      arguments: {},
    });
    const readiness = await client.callTool({
      name: 'get_submission_readiness',
      arguments: {},
    });
    const distribution = await client.callTool({
      name: 'get_public_distribution_bundle',
      arguments: {},
    });

    expect(integration.structuredContent).toMatchObject({
      surfaceId: 'builder-integration-surface',
    });
    expect(seam.structuredContent).toMatchObject({
      surfaceId: 'provider-runtime-seam',
    });
    expect(readiness.structuredContent).toMatchObject({
      entries: expect.any(Array),
      generatedAt: expect.any(String),
    });
    expect(distribution.structuredContent).toMatchObject({
      surfaceId: 'public-distribution-bundle',
    });
  });
});
