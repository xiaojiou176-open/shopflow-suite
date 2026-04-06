import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { operatorDecisionBriefSchema } from '../../packages/contracts/src/builder-surface';
import { workflowCopilotBriefSchema } from '../../packages/contracts/src/workflow-copilot-brief';
import { builderAppSnapshotSchema } from '../../packages/runtime/src/builder-app-snapshot';
import { builderOutcomeBundleSchema } from '../../packages/runtime/src/builder-outcome-bundle';
import {
  agentIntegrationBundleSchema,
  pluginMarketplaceMetadataSkeletonSchema,
} from '../../packages/contracts/src/agent-integration-bundle';
import {
  builderExampleRackAppIds,
  refreshBuilderExampleRack,
} from '../../tooling/builder/write-builder-example-rack';
import { repoRoot } from '../support/repo-paths';

describe('builder example rack tooling', () => {
  it('targets the current multi-app example rack apps', () => {
    expect(builderExampleRackAppIds).toEqual([
      'ext-albertsons',
      'ext-amazon',
      'ext-kroger',
      'ext-temu',
    ]);
  });

  it('refreshes the checked-in multi-app example rack from generated runtime truth', () => {
    const generatedAt = '2026-04-03T02:00:00.000Z';
    const tempRoot = mkdtempSync(
      resolve(tmpdir(), 'shopflow-builder-example-rack-')
    );
    const results = refreshBuilderExampleRack({
      generatedAt,
      exampleDirectory: resolve(tempRoot, 'examples'),
      runtimeDirectory: resolve(tempRoot, 'runtime'),
    });

    expect(results.appResults).toHaveLength(builderExampleRackAppIds.length);

    for (const result of results.appResults) {
      expect(existsSync(result.examplePaths.builderAppSnapshot)).toBe(true);
      expect(existsSync(result.examplePaths.operatorDecisionBrief)).toBe(true);
      expect(existsSync(result.examplePaths.workflowCopilotBrief)).toBe(true);
      expect(existsSync(result.examplePaths.builderOutcomeBundle)).toBe(true);
      expect(existsSync(result.runtimePaths.builderAppSnapshot)).toBe(true);
      expect(existsSync(result.runtimePaths.operatorDecisionBrief)).toBe(true);
      expect(existsSync(result.runtimePaths.workflowCopilotBrief)).toBe(true);
      expect(existsSync(result.runtimePaths.builderOutcomeBundle)).toBe(true);

      const snapshot = builderAppSnapshotSchema.parse(
        JSON.parse(readFileSync(result.examplePaths.builderAppSnapshot, 'utf8'))
      );
      const decisionBrief = operatorDecisionBriefSchema.parse(
        JSON.parse(
          readFileSync(result.examplePaths.operatorDecisionBrief, 'utf8')
        )
      );
      const workflowBrief = workflowCopilotBriefSchema.parse(
        JSON.parse(
          readFileSync(result.examplePaths.workflowCopilotBrief, 'utf8')
        )
      );
      const outcomeBundle = builderOutcomeBundleSchema.parse(
        JSON.parse(
          readFileSync(result.examplePaths.builderOutcomeBundle, 'utf8')
        )
      );

      expect(snapshot.appId).toBe(result.appId);
      expect(decisionBrief.appTitle).toContain('Shopflow');
      expect(workflowBrief.title).toBe('Workflow copilot');
      expect(outcomeBundle.appId).toBe(result.appId);
      expect(outcomeBundle.generatedAt).toBe(generatedAt);
      expect(outcomeBundle.payloadSources.builderAppSnapshot.kind).toBe(
        'generated-runtime-file'
      );
      expect(outcomeBundle.payloadSources.builderAppSnapshot.path).toContain(
        `builder-app-snapshot.${result.appId}.json`
      );
    }

    expect(existsSync(results.commonResult.examplePaths.agentIntegrationBundle)).toBe(
      true
    );
    expect(existsSync(results.commonResult.examplePaths.agentTargetPacketCodex)).toBe(
      true
    );
    expect(
      existsSync(results.commonResult.examplePaths.agentTargetPacketClaudeCode)
    ).toBe(true);
    expect(existsSync(results.commonResult.examplePaths.agentTargetPacketOpenCode)).toBe(
      true
    );
    expect(
      existsSync(results.commonResult.examplePaths.agentTargetPacketOpenHands)
    ).toBe(true);
    expect(existsSync(results.commonResult.examplePaths.agentTargetPacketOpenClaw)).toBe(
      true
    );
    expect(existsSync(results.commonResult.examplePaths.publicMcpCapabilityMap)).toBe(
      true
    );
    expect(existsSync(results.commonResult.examplePaths.publicSkillsCatalog)).toBe(
      true
    );

    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('writes checked-in outcome bundle examples for the multi-app rack', () => {
    for (const appId of builderExampleRackAppIds) {
      const outcomeBundlePath = resolve(
        repoRoot,
        `docs/ecosystem/examples/builder-outcome-bundle.${appId}.json`
      );
      const outcomeBundle = builderOutcomeBundleSchema.parse(
        JSON.parse(readFileSync(outcomeBundlePath, 'utf8'))
      );

      expect(outcomeBundle.appId).toBe(appId);
      expect(outcomeBundle.payloadSources.builderAppSnapshot.kind).toBe(
        'generated-runtime-file'
      );
    }
  });

  it('writes checked-in agent/distribution example artifacts', () => {
    const agentBundle = agentIntegrationBundleSchema.parse(
      JSON.parse(
        readFileSync(
          resolve(repoRoot, 'docs/ecosystem/examples/agent-integration-bundle.json'),
          'utf8'
        )
      )
    );

    expect(agentBundle.surfaceId).toBe('agent-integration-bundle');
    expect(agentBundle.profiles.find((profile) => profile.target === 'codex')).toBeDefined();
    expect(
      JSON.parse(
        readFileSync(
          resolve(repoRoot, 'docs/ecosystem/examples/agent-target-packet.codex.json'),
          'utf8'
        )
      ).target
    ).toBe('codex');
    expect(
      JSON.parse(
        readFileSync(
          resolve(
            repoRoot,
            'docs/ecosystem/examples/agent-target-packet.claude-code.json'
          ),
          'utf8'
        )
      ).target
    ).toBe('claude-code');
    expect(
      JSON.parse(
        readFileSync(
          resolve(
            repoRoot,
            'docs/ecosystem/examples/agent-target-packet.opencode.json'
          ),
          'utf8'
        )
      ).target
    ).toBe('opencode');
    expect(
      JSON.parse(
        readFileSync(
          resolve(
            repoRoot,
            'docs/ecosystem/examples/agent-target-packet.openhands.json'
          ),
          'utf8'
        )
      ).target
    ).toBe('openhands');
    expect(
      pluginMarketplaceMetadataSkeletonSchema.parse(
        JSON.parse(
          readFileSync(
            resolve(
              repoRoot,
              'docs/ecosystem/examples/plugin-marketplace-metadata.openclaw.json'
            ),
            'utf8'
          )
        )
      ).target
    ).toBe('openclaw');
  });
});
