// @vitest-environment jsdom

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { builderAppSnapshotSchema } from '../../packages/runtime/src/builder-app-snapshot';
import { operatorDecisionBriefSchema } from '../../packages/contracts/src/builder-surface';
import { workflowCopilotBriefSchema } from '../../packages/contracts/src/workflow-copilot-brief';
import {
  canonicalRuntimePayloadAppIds,
  supportsCanonicalRuntimePayloads,
  writeCanonicalBuilderRuntimePayloads,
} from '../../tooling/builder/runtime-payloads';
import { writeFileAtomically } from '../../tooling/shared/write-file-atomically';
import { resolveFromRepo } from '../support/repo-paths';

describe('builder runtime payload tooling', () => {
  seedReleaseArtifactState();

  it('advertises the expanded current-scope canonical payload writers', () => {
    expect(canonicalRuntimePayloadAppIds).toEqual(
      expect.arrayContaining([
        'ext-albertsons',
        'ext-amazon',
        'ext-kroger',
        'ext-temu',
      ])
    );
    expect(supportsCanonicalRuntimePayloads('ext-amazon')).toBe(true);
    expect(supportsCanonicalRuntimePayloads('ext-kroger')).toBe(true);
    expect(supportsCanonicalRuntimePayloads('ext-temu')).toBe(true);
    expect(supportsCanonicalRuntimePayloads('ext-costco')).toBe(false);
  });

  it.each([
    {
      appId: 'ext-amazon',
      expectedStage: 'ready-now',
      expectEvidenceQueue: false,
    },
    {
      appId: 'ext-kroger',
      expectedStage: 'claim-gated',
      expectEvidenceQueue: true,
    },
    {
      appId: 'ext-temu',
      expectedStage: 'claim-gated',
      expectEvidenceQueue: true,
    },
  ] as const)(
    'writes generated runtime payloads for $appId',
    ({ appId, expectedStage, expectEvidenceQueue }) => {
      const result = writeCanonicalBuilderRuntimePayloads(appId);

      expect(result.appId).toBe(appId);
      expect(existsSync(result.paths.builderAppSnapshot)).toBe(true);
      expect(existsSync(result.paths.operatorDecisionBrief)).toBe(true);
      expect(existsSync(result.paths.workflowCopilotBrief)).toBe(true);

      const snapshot = builderAppSnapshotSchema.parse(
        JSON.parse(readFileSync(result.paths.builderAppSnapshot, 'utf8'))
      );
      const brief = operatorDecisionBriefSchema.parse(
        JSON.parse(readFileSync(result.paths.operatorDecisionBrief, 'utf8'))
      );
      const workflowBrief = workflowCopilotBriefSchema.parse(
        JSON.parse(readFileSync(result.paths.workflowCopilotBrief, 'utf8'))
      );

      expect(snapshot.appId).toBe(appId);
      expect(snapshot.readOnly).toBe(true);
      expect(snapshot.detection?.appId).toBe(appId);
      expect(snapshot.recentActivities[0]?.href).toMatch(/^https:\/\//);
      expect(snapshot.latestOutput?.pageUrl).toMatch(/^https:\/\//);
      expect(brief.stage).toBe(expectedStage);
      expect(brief.readOnly).toBe(true);
      expect(workflowBrief.tone).toBe(expectedStage);

      if (expectEvidenceQueue) {
        expect(snapshot.evidenceQueue?.totalCount).toBeGreaterThan(0);
        expect(brief.primaryRouteOrigin).toBe('evidence-source');
      } else {
        expect(snapshot.evidenceQueue).toBeUndefined();
        expect(brief.primaryRouteOrigin).toBe('merchant-source');
      }
    }
  );

  it('writes payload files under the repo-local runtime-cache builder directory', () => {
    const result = writeCanonicalBuilderRuntimePayloads('ext-kroger');

    expect(result.outputDirectory).toBe(
      resolveFromRepo('.runtime-cache', 'builder')
    );
    expect(result.paths.builderAppSnapshot).toBe(
      resolveFromRepo('.runtime-cache', 'builder', 'builder-app-snapshot.ext-kroger.json')
    );
    expect(result.paths.operatorDecisionBrief).toBe(
      resolveFromRepo(
        '.runtime-cache',
        'builder',
        'operator-decision-brief.ext-kroger.json'
      )
    );
    expect(result.paths.workflowCopilotBrief).toBe(
      resolveFromRepo(
        '.runtime-cache',
        'builder',
        'workflow-copilot-brief.ext-kroger.json'
      )
    );
  });

  it.each(['ext-kroger', 'ext-temu'] as const)(
    'keeps evidence-gated route origins for %s even when submission-readiness state is absent',
    (appId) => {
      const readinessPath = resolveFromRepo(
        '.runtime-cache',
        'release-artifacts',
        'submission-readiness.json'
      );
      const readinessBackup = readFileSync(readinessPath, 'utf8');

      try {
        rmSync(readinessPath, { force: true });
        rmSync(
          resolveFromRepo(
            '.runtime-cache',
            'builder',
            `builder-app-snapshot.${appId}.json`
          ),
          { force: true }
        );
        rmSync(
          resolveFromRepo(
            '.runtime-cache',
            'builder',
            `operator-decision-brief.${appId}.json`
          ),
          { force: true }
        );
        rmSync(
          resolveFromRepo(
            '.runtime-cache',
            'builder',
            `workflow-copilot-brief.${appId}.json`
          ),
          { force: true }
        );

        const result = writeCanonicalBuilderRuntimePayloads(appId);
        const snapshot = builderAppSnapshotSchema.parse(
          JSON.parse(readFileSync(result.paths.builderAppSnapshot, 'utf8'))
        );
        const brief = operatorDecisionBriefSchema.parse(
          JSON.parse(readFileSync(result.paths.operatorDecisionBrief, 'utf8'))
        );

        expect(snapshot.evidenceQueue?.totalCount).toBeGreaterThan(0);
        expect(brief.primaryRouteOrigin).toBe('evidence-source');
      } finally {
        writeFileAtomically(readinessPath, readinessBackup);
      }
    }
  );
});

function seedReleaseArtifactState() {
  writeFileAtomically(
    resolveFromRepo('.runtime-cache', 'release-artifacts', 'manifest.json'),
    `${JSON.stringify(
      {
        generatedAt: '2026-04-03T12:00:00.000Z',
        entries: [
          {
            appId: 'ext-amazon',
            releaseChannel: 'store-review',
            buildDirectory: 'apps/ext-amazon/.output/chrome-mv3',
            zipArtifacts: ['apps/ext-amazon/.output/ext-amazon.zip'],
          },
          {
            appId: 'ext-kroger',
            releaseChannel: 'store-review',
            buildDirectory: 'apps/ext-kroger/.output/chrome-mv3',
            zipArtifacts: ['apps/ext-kroger/.output/ext-kroger.zip'],
          },
          {
            appId: 'ext-temu',
            releaseChannel: 'store-review',
            buildDirectory: 'apps/ext-temu/.output/chrome-mv3',
            zipArtifacts: ['apps/ext-temu/.output/ext-temu.zip'],
          },
        ],
      },
      null,
      2
    )}\n`
  );
  writeFileAtomically(
    resolveFromRepo(
      '.runtime-cache',
      'release-artifacts',
      'submission-readiness.json'
    ),
    `${JSON.stringify(
      {
        generatedAt: '2026-04-03T12:00:00.000Z',
        entries: [
          {
            appId: 'ext-amazon',
            repoOwnedStatus: 'review-bundle-ready-awaiting-signing',
            reviewBundleReady: true,
            readinessSummary: 'Ready for repo-local review.',
            requiredEvidenceCaptureIds: [],
          },
          {
            appId: 'ext-kroger',
            repoOwnedStatus: 'review-bundle-ready-claim-gated',
            reviewBundleReady: true,
            readinessSummary:
              'Reviewed live evidence still gates public wording.',
            requiredEvidenceCaptureIds: [
              'fred-meyer-verified-scope-live-receipt',
              'qfc-verified-scope-live-receipt',
            ],
          },
          {
            appId: 'ext-temu',
            repoOwnedStatus: 'review-bundle-ready-claim-gated',
            reviewBundleReady: true,
            readinessSummary:
              'Reviewed live evidence still gates public wording.',
            requiredEvidenceCaptureIds: ['temu-filter-live-receipt'],
          },
        ],
      },
      null,
      2
    )}\n`
  );
}
