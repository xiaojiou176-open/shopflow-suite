import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  agentIntegrationBundle,
  agentIntegrationBundleSchema,
  agentTargetPacketSchema,
  getAgentTargetPacket,
  getPluginMarketplaceMetadataEntry,
  pluginMarketplaceMetadataPacketSchema,
  pluginMarketplaceMetadataPacket,
  publicMcpCapabilityMap,
  publicMcpCapabilityMapSchema,
  publicSkillsCatalog,
  publicSkillsCatalogSchema,
} from '@shopflow/contracts';
import { buildShopflowMcpPayload } from '@shopflow/mcp-server';
import { createProviderRuntimeConsumer } from '@shopflow/core';
import { buildBuilderOutcomeBundle } from '../builder/write-builder-outcome-bundle';
import { writeFileAtomically } from '../shared/write-file-atomically';

export const readOnlyCliCommandValues = [
  'agent-integration-bundle',
  'agent-target-packet',
  'public-mcp-capability-map',
  'public-skills-catalog',
  'plugin-marketplace-metadata',
  'integration-surface',
  'runtime-seam',
  'runtime-consumer',
  'public-distribution-bundle',
  'outcome-bundle',
  'submission-readiness',
] as const;

export type ReadOnlyCliCommand = (typeof readOnlyCliCommandValues)[number];
export const readOnlyCliAgentTargetValues = [
  'codex',
  'claude-code',
  'opencode',
  'openhands',
  'openclaw',
] as const;
export type ReadOnlyCliAgentTarget =
  (typeof readOnlyCliAgentTargetValues)[number];
export const readOnlyCliPluginTargetValues = [
  'codex',
  'claude-code',
  'openclaw',
] as const;
export type ReadOnlyCliPluginTarget =
  (typeof readOnlyCliPluginTargetValues)[number];

export type ReadOnlyCliOptions = {
  command: ReadOnlyCliCommand;
  appId?: string;
  target?: string;
  baseUrl?: string;
  outputPath?: string;
  generatedAt?: string;
  runtimePayloadDirectory?: string;
};

const repoRoot = resolve(import.meta.dirname, '../..');

export function renderReadOnlyCliHelp() {
  const commands = readOnlyCliCommandValues
    .map((command) => `- ${command}`)
    .join('\n');
  const agentTargets = readOnlyCliAgentTargetValues.join(', ');
  const pluginTargets = readOnlyCliPluginTargetValues.join(', ');

  return [
    'Shopflow read-only CLI',
    '',
    'Usage:',
    '  pnpm cli:read-only -- <command> [options]',
    '',
    'Commands:',
    commands,
    '',
    'Options:',
    '- --app <appId>        Choose the app for outcome-bundle.',
    '- --target <target>    Choose agent or plugin packet target. Allowed: ' +
      agentTargets,
    '- --base-url <url>     Provide a Switchyard base URL for runtime-consumer.',
    '- --output <path>      Write the JSON payload to a repo-relative file path.',
    '- --generated-at <ts>  Override generatedAt for outcome-bundle exports.',
    '- -h, --help           Show this help text.',
    '',
    'Examples:',
    'pnpm cli:read-only -- agent-integration-bundle',
    'pnpm cli:read-only -- agent-target-packet --target codex',
    'pnpm cli:read-only -- agent-target-packet --target claude-code --output .runtime-cache/cli/agent-target-packet.claude-code.json',
    'pnpm cli:read-only -- agent-target-packet --target openclaw --output .runtime-cache/cli/agent-target-packet.openclaw.json',
    'pnpm cli:read-only -- public-mcp-capability-map --output .runtime-cache/cli/public-mcp-capability-map.json',
    'pnpm cli:read-only -- public-skills-catalog --output .runtime-cache/cli/public-skills-catalog.json',
    'pnpm cli:read-only -- plugin-marketplace-metadata --target codex --output .runtime-cache/cli/plugin-marketplace-metadata.codex.json  # plugin targets: ' +
      pluginTargets,
    'pnpm cli:read-only -- plugin-marketplace-metadata --target claude-code --output .runtime-cache/cli/plugin-marketplace-metadata.claude-code.json',
    'pnpm cli:read-only -- public-distribution-bundle --output .runtime-cache/cli/public-distribution-bundle.json',
    'pnpm cli:read-only -- public-skills-catalog --output .runtime-cache/cli/public-skills-catalog.json',
    'pnpm cli:read-only -- runtime-consumer --base-url http://127.0.0.1:4317',
    '',
    'Boundary:',
    '- repo-local only',
    '- read-only only',
    '- not proof of published public CLI / MCP / skills / plugin surfaces',
    '- Codex / Claude Code bundle-ready packets still require real official surface confirmation before any official-listing claim',
    '',
  ].join('\n');
}

export function parseReadOnlyCliArgs(argv: string[]): ReadOnlyCliOptions {
  const options: ReadOnlyCliOptions = {
    command: 'integration-surface',
    appId: 'ext-albertsons',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      continue;
    }

    if (
      readOnlyCliCommandValues.includes(arg as ReadOnlyCliCommand) &&
      options.command === 'integration-surface'
    ) {
      options.command = arg as ReadOnlyCliCommand;
      continue;
    }

    if (arg === '--app') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --app');
      }
      options.appId = value;
      index += 1;
      continue;
    }

    if (arg === '--target') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --target');
      }
      options.target = value;
      index += 1;
      continue;
    }

    if (arg === '--base-url') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --base-url');
      }
      options.baseUrl = value;
      index += 1;
      continue;
    }

    if (arg === '--output') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --output');
      }
      options.outputPath = resolve(repoRoot, value);
      index += 1;
      continue;
    }

    if (arg === '--generated-at') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --generated-at');
      }
      options.generatedAt = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

export function buildReadOnlyCliPayload(options: ReadOnlyCliOptions) {
  switch (options.command) {
    case 'agent-integration-bundle':
      return agentIntegrationBundleSchema.parse(agentIntegrationBundle);
    case 'agent-target-packet':
      if (!options.target) {
        throw new Error(
          `Missing --target for agent-target-packet. Allowed values: ${readOnlyCliAgentTargetValues.join(', ')}`
        );
      }
      if (
        !readOnlyCliAgentTargetValues.includes(
          options.target as ReadOnlyCliAgentTarget
        )
      ) {
        throw new Error(
          `Unknown --target for agent-target-packet: ${options.target}. Allowed values: ${readOnlyCliAgentTargetValues.join(', ')}`
        );
      }
      return agentTargetPacketSchema.parse(
        getAgentTargetPacket(options.target)
      );
    case 'public-mcp-capability-map':
      return publicMcpCapabilityMapSchema.parse(publicMcpCapabilityMap);
    case 'public-skills-catalog':
      return publicSkillsCatalogSchema.parse(publicSkillsCatalog);
    case 'plugin-marketplace-metadata':
      if (options.target) {
        const entry = getPluginMarketplaceMetadataEntry(options.target);
        if (!entry) {
          throw new Error(
            `Unknown --target for plugin-marketplace-metadata: ${options.target}. Allowed values: ${readOnlyCliPluginTargetValues.join(', ')}`
          );
        }
        return entry;
      }

      return pluginMarketplaceMetadataPacketSchema.parse(
        pluginMarketplaceMetadataPacket
      );
    case 'integration-surface':
      return buildShopflowMcpPayload('get_integration_surface');
    case 'runtime-seam':
      return buildShopflowMcpPayload('get_runtime_seam');
    case 'runtime-consumer':
      return createProviderRuntimeConsumer({
        baseUrl: options.baseUrl ?? process.env.SHOPFLOW_SWITCHYARD_BASE_URL,
      });
    case 'public-distribution-bundle':
      return buildShopflowMcpPayload('get_public_distribution_bundle');
    case 'outcome-bundle':
      return buildBuilderOutcomeBundle({
        appId: options.appId,
        generatedAt: options.generatedAt,
        runtimePayloadDirectory: options.runtimePayloadDirectory,
        allowRuntimePayloadWrites: false,
      });
    case 'submission-readiness':
      return buildShopflowMcpPayload('get_submission_readiness');
  }
}

export function defaultOutputPathForCommand(
  command: ReadOnlyCliCommand,
  appId = 'ext-albertsons',
  target = 'packet'
) {
  switch (command) {
    case 'agent-integration-bundle':
      return resolve(
        repoRoot,
        '.runtime-cache/cli/agent-integration-bundle.json'
      );
    case 'agent-target-packet':
      return resolve(
        repoRoot,
        `.runtime-cache/cli/agent-target-packet.${target}.json`
      );
    case 'public-mcp-capability-map':
      return resolve(
        repoRoot,
        '.runtime-cache/cli/public-mcp-capability-map.json'
      );
    case 'public-skills-catalog':
      return resolve(repoRoot, '.runtime-cache/cli/public-skills-catalog.json');
    case 'plugin-marketplace-metadata':
      return resolve(
        repoRoot,
        `.runtime-cache/cli/plugin-marketplace-metadata.${target}.json`
      );
    case 'integration-surface':
      return resolve(
        repoRoot,
        '.runtime-cache/cli/builder-integration-surface.json'
      );
    case 'runtime-seam':
      return resolve(repoRoot, '.runtime-cache/cli/provider-runtime-seam.json');
    case 'runtime-consumer':
      return resolve(
        repoRoot,
        '.runtime-cache/cli/provider-runtime-consumer.json'
      );
    case 'public-distribution-bundle':
      return resolve(
        repoRoot,
        '.runtime-cache/cli/public-distribution-bundle.json'
      );
    case 'outcome-bundle':
      return resolve(
        repoRoot,
        `.runtime-cache/cli/builder-outcome-bundle.${appId}.json`
      );
    case 'submission-readiness':
      return resolve(repoRoot, '.runtime-cache/cli/submission-readiness.json');
  }
}

export async function readOnlyCliMain(rawArgs = process.argv.slice(2)) {
  if (rawArgs.includes('--help') || rawArgs.includes('-h')) {
    process.stdout.write(renderReadOnlyCliHelp());
    return;
  }

  const options = parseReadOnlyCliArgs(rawArgs);
  const payload = buildReadOnlyCliPayload(options);
  const serialized = `${JSON.stringify(payload, null, 2)}\n`;

  if (options.outputPath) {
    writeFileAtomically(options.outputPath, serialized);
    process.stdout.write(
      `Read-only CLI payload written for ${options.command}: ${options.outputPath}\n`
    );
    return;
  }

  process.stdout.write(serialized);
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  readOnlyCliMain();
}
