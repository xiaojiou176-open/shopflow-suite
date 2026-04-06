import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getAgentIntegrationExampleArtifacts } from '@shopflow/contracts';
import {
  createCanonicalBuilderRuntimePayloads,
  supportsCanonicalRuntimePayloads,
  writeCanonicalBuilderRuntimePayloads,
} from './runtime-payloads.ts';
import { buildBuilderOutcomeBundle } from './write-builder-outcome-bundle.ts';

const repoRoot = resolve(import.meta.dirname, '../..');

export const builderExampleRackAppIds = [
  'ext-albertsons',
  'ext-amazon',
  'ext-kroger',
  'ext-temu',
] as const;

type BuilderExampleRackAppId = (typeof builderExampleRackAppIds)[number];

type CliOptions = {
  appIds: BuilderExampleRackAppId[];
  generatedAt?: string;
  exampleDirectory?: string;
  runtimeDirectory?: string;
};

type RefreshBuilderExampleRackResult = {
  appId: BuilderExampleRackAppId;
  examplePaths: {
    builderAppSnapshot: string;
    operatorDecisionBrief: string;
    workflowCopilotBrief: string;
    builderOutcomeBundle: string;
  };
  runtimePaths: {
    builderAppSnapshot: string;
    operatorDecisionBrief: string;
    workflowCopilotBrief: string;
    builderOutcomeBundle: string;
  };
};

type RefreshBuilderCommonExampleResult = {
  examplePaths: {
    agentIntegrationBundle: string;
    agentTargetPacketCodex: string;
    agentTargetPacketClaudeCode: string;
    agentTargetPacketOpenCode: string;
    agentTargetPacketOpenHands: string;
    agentTargetPacketOpenClaw: string;
    publicMcpCapabilityMap: string;
    publicSkillsCatalog: string;
    pluginMarketplaceMetadataCodex: string;
    pluginMarketplaceMetadataClaudeCode: string;
    pluginMarketplaceMetadataOpenClaw: string;
  };
};

export type RefreshBuilderExampleRackSummary = {
  appResults: RefreshBuilderExampleRackResult[];
  commonResult: RefreshBuilderCommonExampleResult;
};

function parseArgs(argv: string[]): CliOptions {
  const appIds = new Set<BuilderExampleRackAppId>();
  let generatedAt: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--app') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --app');
      }
      assertSupportedExampleRackAppId(value);
      appIds.add(value);
      index += 1;
      continue;
    }

    if (arg === '--generated-at') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --generated-at');
      }
      generatedAt = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    appIds:
      appIds.size > 0 ? Array.from(appIds) : [...builderExampleRackAppIds],
    generatedAt,
  };
}

function assertSupportedExampleRackAppId(
  appId: string
): asserts appId is BuilderExampleRackAppId {
  if (!builderExampleRackAppIds.includes(appId as BuilderExampleRackAppId)) {
    throw new Error(
      `Unsupported example rack app id: ${appId}. Supported apps: ${builderExampleRackAppIds.join(
        ', '
      )}.`
    );
  }

  if (!supportsCanonicalRuntimePayloads(appId)) {
    throw new Error(
      `No current-scope runtime payload writer exists yet for ${appId}.`
    );
  }
}

function examplePathFor(
  exampleDirectory: string,
  prefix:
    | 'builder-app-snapshot'
    | 'operator-decision-brief'
    | 'workflow-copilot-brief'
    | 'builder-outcome-bundle',
  appId: BuilderExampleRackAppId
) {
  return resolve(exampleDirectory, `${prefix}.${appId}.json`);
}

function runtimeOutcomeBundlePathFor(
  runtimeDirectory: string,
  appId: BuilderExampleRackAppId
) {
  return resolve(runtimeDirectory, `builder-outcome-bundle.${appId}.json`);
}

function writeJsonFile(path: string, payload: unknown) {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
}

export function refreshBuilderExampleRack(
  options: Partial<CliOptions> = {}
): RefreshBuilderExampleRackSummary {
  const appIds = options.appIds ?? [...builderExampleRackAppIds];
  const generatedAt = options.generatedAt;
  const exampleDirectory =
    options.exampleDirectory ?? resolve(repoRoot, 'docs/ecosystem/examples');
  const runtimeDirectory =
    options.runtimeDirectory ?? resolve(repoRoot, '.runtime-cache/builder');

  const appResults = appIds.map((appId) => {
    assertSupportedExampleRackAppId(appId);

    const payloads = createCanonicalBuilderRuntimePayloads(appId);
    const runtimePayloads = writeCanonicalBuilderRuntimePayloads(
      appId,
      runtimeDirectory
    );
    const builderOutcomeBundle = buildBuilderOutcomeBundle({
      appId,
      generatedAt,
      snapshotPath: runtimePayloads.paths.builderAppSnapshot,
      decisionBriefPath: runtimePayloads.paths.operatorDecisionBrief,
      workflowBriefPath: runtimePayloads.paths.workflowCopilotBrief,
      runtimePayloadDirectory: runtimeDirectory,
      payloadSourcePathMode: 'repo-relative',
    });

    const examplePaths = {
      builderAppSnapshot: examplePathFor(
        exampleDirectory,
        'builder-app-snapshot',
        appId
      ),
      operatorDecisionBrief: examplePathFor(
        exampleDirectory,
        'operator-decision-brief',
        appId
      ),
      workflowCopilotBrief: examplePathFor(
        exampleDirectory,
        'workflow-copilot-brief',
        appId
      ),
      builderOutcomeBundle: examplePathFor(
        exampleDirectory,
        'builder-outcome-bundle',
        appId
      ),
    };

    const runtimePaths = {
      ...runtimePayloads.paths,
      builderOutcomeBundle: runtimeOutcomeBundlePathFor(
        runtimeDirectory,
        appId
      ),
    };

    writeJsonFile(examplePaths.builderAppSnapshot, payloads.builderAppSnapshot);
    writeJsonFile(
      examplePaths.operatorDecisionBrief,
      payloads.operatorDecisionBrief
    );
    writeJsonFile(
      examplePaths.workflowCopilotBrief,
      payloads.workflowCopilotBrief
    );
    writeJsonFile(examplePaths.builderOutcomeBundle, builderOutcomeBundle);
    writeJsonFile(runtimePaths.builderOutcomeBundle, builderOutcomeBundle);

    return {
      appId,
      examplePaths,
      runtimePaths,
    };
  });

  const exampleArtifacts = getAgentIntegrationExampleArtifacts();
  const commonResult: RefreshBuilderCommonExampleResult = {
    examplePaths: {
      agentIntegrationBundle: resolve(
        exampleDirectory,
        'agent-integration-bundle.json'
      ),
      agentTargetPacketCodex: resolve(
        exampleDirectory,
        'agent-target-packet.codex.json'
      ),
      agentTargetPacketClaudeCode: resolve(
        exampleDirectory,
        'agent-target-packet.claude-code.json'
      ),
      agentTargetPacketOpenCode: resolve(
        exampleDirectory,
        'agent-target-packet.opencode.json'
      ),
      agentTargetPacketOpenHands: resolve(
        exampleDirectory,
        'agent-target-packet.openhands.json'
      ),
      agentTargetPacketOpenClaw: resolve(
        exampleDirectory,
        'agent-target-packet.openclaw.json'
      ),
      publicMcpCapabilityMap: resolve(
        exampleDirectory,
        'public-mcp-capability-map.json'
      ),
      publicSkillsCatalog: resolve(
        exampleDirectory,
        'public-skills-catalog.json'
      ),
      pluginMarketplaceMetadataCodex: resolve(
        exampleDirectory,
        'plugin-marketplace-metadata.codex.json'
      ),
      pluginMarketplaceMetadataClaudeCode: resolve(
        exampleDirectory,
        'plugin-marketplace-metadata.claude-code.json'
      ),
      pluginMarketplaceMetadataOpenClaw: resolve(
        exampleDirectory,
        'plugin-marketplace-metadata.openclaw.json'
      ),
    },
  };

  writeJsonFile(
    commonResult.examplePaths.agentIntegrationBundle,
    exampleArtifacts.agentIntegrationBundle
  );
  writeJsonFile(
    commonResult.examplePaths.agentTargetPacketCodex,
    exampleArtifacts.agentTargetPackets.codex
  );
  writeJsonFile(
    commonResult.examplePaths.agentTargetPacketClaudeCode,
    exampleArtifacts.agentTargetPackets['claude-code']
  );
  writeJsonFile(
    commonResult.examplePaths.agentTargetPacketOpenCode,
    exampleArtifacts.agentTargetPackets.opencode
  );
  writeJsonFile(
    commonResult.examplePaths.agentTargetPacketOpenHands,
    exampleArtifacts.agentTargetPackets.openhands
  );
  writeJsonFile(
    commonResult.examplePaths.agentTargetPacketOpenClaw,
    exampleArtifacts.agentTargetPackets.openclaw
  );
  writeJsonFile(
    commonResult.examplePaths.publicMcpCapabilityMap,
    exampleArtifacts.publicMcpCapabilityMap
  );
  writeJsonFile(
    commonResult.examplePaths.publicSkillsCatalog,
    exampleArtifacts.publicSkillsCatalog
  );
  writeJsonFile(
    commonResult.examplePaths.pluginMarketplaceMetadataCodex,
    exampleArtifacts.pluginMarketplaceMetadata.entries.find(
      (entry) => entry.target === 'codex'
    )
  );
  writeJsonFile(
    commonResult.examplePaths.pluginMarketplaceMetadataClaudeCode,
    exampleArtifacts.pluginMarketplaceMetadata.entries.find(
      (entry) => entry.target === 'claude-code'
    )
  );
  writeJsonFile(
    commonResult.examplePaths.pluginMarketplaceMetadataOpenClaw,
    exampleArtifacts.pluginMarketplaceMetadata.entries.find(
      (entry) => entry.target === 'openclaw'
    )
  );

  return {
    appResults,
    commonResult,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const results = refreshBuilderExampleRack(options);
  const summary = results.appResults
    .map(
      (result) =>
        `${result.appId}: ${result.examplePaths.builderAppSnapshot}, ${result.examplePaths.operatorDecisionBrief}, ${result.examplePaths.workflowCopilotBrief}, ${result.examplePaths.builderOutcomeBundle}`
    )
    .join('\n');
  const commonSummary = Object.values(results.commonResult.examplePaths).join(
    ', '
  );

  process.stdout.write(
    `Builder example rack refreshed for ${results.appResults.length} app${results.appResults.length === 1 ? '' : 's'}:\n${summary}\nCommon agent/distribution examples: ${commonSummary}\n`
  );
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main();
}
