import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { builderIntegrationSurface } from '../../packages/contracts/src/builder-integration-surface';
import { builderOutcomeBundleSchema } from '../../packages/runtime/src/builder-outcome-bundle';
import { buildBuilderOutcomeBundle } from '../../tooling/builder/write-builder-outcome-bundle';
import { writeFileAtomically } from '../../tooling/shared/write-file-atomically';
import { writeCanonicalBuilderRuntimePayloads } from '../../tooling/builder/runtime-payloads.ts';
import { repoRoot } from '../support/repo-paths';
const multiAppIds = ['ext-amazon', 'ext-kroger', 'ext-temu'] as const;

function normalizeDynamicArtifactSummaries<
  T extends {
    artifactPointers: Array<{
      id: string;
      path: string;
      command: string;
      summary: string;
    }>;
  },
>(bundle: T) {
  return {
    ...bundle,
    payloadSources: Object.fromEntries(
      Object.entries(bundle.payloadSources).map(([key, value]) => [
        key,
        {
          surfaceId: value.surfaceId,
          kind: value.kind,
        },
      ])
    ),
    artifactPointers: bundle.artifactPointers.map(({ id, path, command }) => ({
      id,
      path,
      command,
    })),
  };
}

describe('builder outcome bundle tooling', () => {
  it('assembles a read-only builder outcome bundle from the checked-in example surfaces', () => {
    const generatedRuntimePayloads =
      writeCanonicalBuilderRuntimePayloads('ext-albertsons');
    const releaseState = createReleaseArtifactState(['ext-albertsons']);
    const manifest = JSON.parse(
      readFileSync(releaseState.manifestPath, 'utf8')
    ) as {
      entries: Array<{
        appId: string;
        releaseChannel: string;
        buildDirectory: string;
        zipArtifacts: string[];
      }>;
    };
    const submissionReadiness = JSON.parse(
      readFileSync(releaseState.readinessPath, 'utf8')
    ) as {
      entries: Array<{
        appId: string;
        repoOwnedStatus: string;
        reviewBundleReady: boolean;
        readinessSummary: string;
        manualReviewStartUrl?: string;
        reviewerStartPath?: {
          reviewArtifactManifestPath?: string;
        };
      }>;
    };
    const bundle = buildBuilderOutcomeBundle({
      appId: 'ext-albertsons',
      generatedAt: '2026-04-02T08:00:00.000Z',
      artifactManifestPath: releaseState.manifestPath,
      submissionReadinessPath: releaseState.readinessPath,
    });
    const manifestEntry = manifest.entries.find(
      (entry) => entry.appId === 'ext-albertsons'
    );
    const readinessEntry = submissionReadiness.entries.find(
      (entry) => entry.appId === 'ext-albertsons'
    );

    expect(builderOutcomeBundleSchema.parse(bundle)).toMatchObject({
      bundleId: 'builder-outcome-bundle',
      schemaVersion: 'shopflow.builder-outcome-bundle.v2',
      readOnly: true,
      appId: 'ext-albertsons',
      payloads: {
        builderAppSnapshot: {
          surfaceId: 'builder-app-snapshot',
          bestRoute: {
            origin: 'evidence-source',
          },
        },
        operatorDecisionBrief: {
          surfaceId: 'operator-decision-brief',
          primaryRouteOrigin: 'evidence-source',
        },
        workflowCopilotBrief: {
          tone: 'claim-gated',
        },
      },
      payloadSources: {
        builderAppSnapshot: {
          surfaceId: 'builder-app-snapshot',
          kind: 'generated-runtime-file',
        },
        operatorDecisionBrief: {
          surfaceId: 'operator-decision-brief',
          kind: 'generated-runtime-file',
        },
        workflowCopilotBrief: {
          surfaceId: 'workflow-copilot-brief',
          kind: 'generated-runtime-file',
        },
      },
    });
    expect(bundle.payloadSources.builderAppSnapshot.path).toBe(
      generatedRuntimePayloads.paths.builderAppSnapshot
    );
    expect(bundle.payloadSources.operatorDecisionBrief.path).toBe(
      generatedRuntimePayloads.paths.operatorDecisionBrief
    );
    expect(bundle.payloadSources.workflowCopilotBrief.path).toBe(
      generatedRuntimePayloads.paths.workflowCopilotBrief
    );
    expect(bundle.artifactPointers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'artifact-manifest',
          command: 'pnpm package:artifacts',
          summary: expect.stringContaining(
            `${manifest.entries.length} app entries`
          ),
        }),
        expect.objectContaining({
          id: 'submission-readiness-report',
          command: 'pnpm release:write-submission-readiness-report',
          summary: expect.stringContaining(
            readinessEntry?.repoOwnedStatus ?? ''
          ),
        }),
      ])
    );
    expect(manifestEntry).toBeDefined();
    expect(readinessEntry).toBeDefined();
    expect(
      bundle.artifactPointers.find((pointer) => pointer.id === 'artifact-manifest')
        ?.summary
    ).toContain(manifestEntry?.buildDirectory ?? '');
    expect(
      bundle.artifactPointers.find(
        (pointer) => pointer.id === 'submission-readiness-report'
      )?.summary
    ).toContain(readinessEntry?.manualReviewStartUrl ?? '');
    expect(
      bundle.artifactPointers.find(
        (pointer) => pointer.id === 'submission-readiness-report'
      )?.summary
    ).toContain(
      readinessEntry?.reviewerStartPath?.reviewArtifactManifestPath ?? ''
    );
    expect(bundle.discoverabilityRoutes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'builder-start-here',
          kind: 'docs',
          value: 'docs/ecosystem/builder-start-here.md',
        }),
        expect.objectContaining({
          id: 'examples-index',
          kind: 'docs',
          value: 'docs/ecosystem/examples/README.md',
        }),
        expect.objectContaining({
          id: 'local-outcome-bundle-command',
          kind: 'command',
          value: 'pnpm builder:write-outcome-bundle -- --stdout',
        }),
      ])
    );
    expect(bundle.readyToSyncArtifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'public-copy-packet',
          path: 'docs/ecosystem/public-copy.ready.md',
        }),
        expect.objectContaining({
          id: 'repo-description',
          path: 'docs/ecosystem/repo-description.ready.md',
        }),
      ])
    );
  });

  it('keeps the checked-in builder outcome bundle example aligned with the tooling output', () => {
    const releaseState = createReleaseArtifactState(['ext-albertsons']);
    const expected = buildBuilderOutcomeBundle({
      appId: 'ext-albertsons',
      generatedAt: '2026-04-02T10:00:00.000Z',
      artifactManifestPath: releaseState.manifestPath,
      submissionReadinessPath: releaseState.readinessPath,
    });
    const example = builderOutcomeBundleSchema.parse(
      JSON.parse(
        readFileSync(
          resolve(
            repoRoot,
            'docs/ecosystem/examples/builder-outcome-bundle.ext-albertsons.json'
          ),
          'utf8'
        )
      )
    );

    expect(example.generatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
    expect(
      normalizeDynamicArtifactSummaries({
        ...example,
        generatedAt: expected.generatedAt,
      })
    ).toEqual(normalizeDynamicArtifactSummaries(expected));
  });

  it('prefers explicit runtime-style payload files when they are provided', () => {
    const snapshotPath = resolve(
      repoRoot,
      '.runtime-cache/builder/builder-app-snapshot.ext-albertsons.runtime-test.json'
    );
    const decisionBriefPath = resolve(
      repoRoot,
      '.runtime-cache/builder/operator-decision-brief.ext-albertsons.runtime-test.json'
    );
    const workflowBriefPath = resolve(
      repoRoot,
      '.runtime-cache/builder/workflow-copilot-brief.ext-albertsons.runtime-test.json'
    );

    const exampleBundle = buildBuilderOutcomeBundle({
      appId: 'ext-albertsons',
      generatedAt: '2026-04-02T12:00:00.000Z',
    });

    const writePayload = (path: string, payload: unknown) => {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
    };

    writePayload(snapshotPath, exampleBundle.payloads.builderAppSnapshot);
    writePayload(decisionBriefPath, exampleBundle.payloads.operatorDecisionBrief);
    writePayload(workflowBriefPath, exampleBundle.payloads.workflowCopilotBrief);

    const runtimeBundle = buildBuilderOutcomeBundle({
      appId: 'ext-albertsons',
      snapshotPath,
      decisionBriefPath,
      workflowBriefPath,
      generatedAt: '2026-04-02T12:00:00.000Z',
    });

    expect(runtimeBundle.payloadSources).toMatchObject({
      builderAppSnapshot: {
        kind: 'explicit-input-file',
        path: snapshotPath,
      },
      operatorDecisionBrief: {
        kind: 'explicit-input-file',
        path: decisionBriefPath,
      },
      workflowCopilotBrief: {
        kind: 'explicit-input-file',
        path: workflowBriefPath,
      },
    });

    rmSync(snapshotPath, { force: true });
    rmSync(decisionBriefPath, { force: true });
    rmSync(workflowBriefPath, { force: true });
  });

  it('consumes generated runtime payloads for multiple current-scope apps beyond the original canonical sample', () => {
    const releaseState = createReleaseArtifactState([...multiAppIds]);
    const submissionReadiness = JSON.parse(
      readFileSync(releaseState.readinessPath, 'utf8')
    ) as {
      entries: Array<{
        appId: string;
        repoOwnedStatus: string;
        manualReviewStartUrl?: string;
      }>;
    };

    for (const appId of multiAppIds) {
      const bundle = buildBuilderOutcomeBundle({
        appId,
        generatedAt: '2026-04-02T14:00:00.000Z',
        artifactManifestPath: releaseState.manifestPath,
        submissionReadinessPath: releaseState.readinessPath,
      });
      const readinessEntry = submissionReadiness.entries.find(
        (entry) => entry.appId === appId
      );

      expect(builderOutcomeBundleSchema.parse(bundle)).toMatchObject({
        appId,
        payloadSources: {
          builderAppSnapshot: {
            kind: 'generated-runtime-file',
          },
          operatorDecisionBrief: {
            kind: 'generated-runtime-file',
          },
          workflowCopilotBrief: {
            kind: 'generated-runtime-file',
          },
        },
      });
      expect(
        bundle.artifactPointers.find(
          (pointer) => pointer.id === 'submission-readiness-report'
        )?.summary
      ).toContain(readinessEntry?.repoOwnedStatus ?? '');
      expect(
        bundle.artifactPointers.find(
          (pointer) => pointer.id === 'submission-readiness-report'
        )?.summary
      ).toContain(readinessEntry?.manualReviewStartUrl ?? '');

      if (appId === 'ext-amazon') {
        expect(bundle.payloads.builderAppSnapshot.bestRoute.origin).toBe(
          'merchant-source'
        );
        expect(bundle.payloads.operatorDecisionBrief.primaryRouteOrigin).toBe(
          'merchant-source'
        );
      }

      if (appId === 'ext-kroger' || appId === 'ext-temu') {
        expect(bundle.payloads.builderAppSnapshot.bestRoute.origin).toBe(
          'evidence-source'
        );
        expect(bundle.payloads.operatorDecisionBrief.primaryRouteOrigin).toBe(
          'evidence-source'
        );
        expect(bundle.payloads.workflowCopilotBrief.tone).toBe('claim-gated');
      }
    }
  });

  for (const appId of ['ext-amazon', 'ext-kroger', 'ext-temu'] as const) {
    it(`assembles a multi-app outcome bundle from generated runtime payloads for ${appId}`, () => {
      const releaseState = createReleaseArtifactState([appId]);
      const generatedRuntimePayloads = writeCanonicalBuilderRuntimePayloads(appId);
      const bundle = buildBuilderOutcomeBundle({
        appId,
        generatedAt: '2026-04-02T14:00:00.000Z',
        artifactManifestPath: releaseState.manifestPath,
        submissionReadinessPath: releaseState.readinessPath,
      });

      expect(builderOutcomeBundleSchema.parse(bundle)).toMatchObject({
        appId,
        payloadSources: {
          builderAppSnapshot: {
            kind: 'generated-runtime-file',
            path: generatedRuntimePayloads.paths.builderAppSnapshot,
          },
          operatorDecisionBrief: {
            kind: 'generated-runtime-file',
            path: generatedRuntimePayloads.paths.operatorDecisionBrief,
          },
          workflowCopilotBrief: {
            kind: 'generated-runtime-file',
            path: generatedRuntimePayloads.paths.workflowCopilotBrief,
          },
        },
      });

      expect(
        bundle.artifactPointers.find((pointer) => pointer.id === 'artifact-manifest')
          ?.summary
      ).toContain(appId);
      expect(
        bundle.artifactPointers.find(
          (pointer) => pointer.id === 'submission-readiness-report'
        )?.summary
      ).toContain(appId);
    });
  }

  it('keeps builder discoverability entrypoints coherent with files and scripts that actually exist', () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(repoRoot, 'package.json'), 'utf8')
    ) as {
      scripts: Record<string, string>;
    };

    for (const surface of builderIntegrationSurface.surfaceCatalog) {
      for (const entrypoint of surface.entrypoints) {
        if (
          entrypoint.kind === 'docs' ||
          entrypoint.kind === 'example-json'
        ) {
          expect(existsSync(resolve(repoRoot, entrypoint.value))).toBe(true);
        }

        if (entrypoint.kind === 'command') {
          const [, scriptName] = entrypoint.value.split(' ');
          expect(packageJson.scripts[scriptName]).toBeTruthy();
        }
      }
    }

    for (const tool of builderIntegrationSurface.repoLocalTooling) {
      const [, scriptName] = tool.command.split(' ');
      expect(packageJson.scripts[scriptName]).toBeTruthy();
    }
  });

  it(
    'replaces builder-facing JSON files atomically so concurrent readers never parse a truncated payload',
    () => {
    const tempRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-builder-atomic-'));
    const targetPath = resolve(tempRoot, 'submission-readiness.json');
    const payload = {
      generatedAt: '2026-04-03T03:40:00.000Z',
      entries: Array.from({ length: 400 }, (_, index) => ({
        appId: `ext-test-${index}`,
        repoOwnedStatus: 'review-bundle-ready-claim-gated',
        readinessSummary: `entry-${index}`,
      })),
    };

    writeFileAtomically(targetPath, `${JSON.stringify(payload, null, 2)}\n`);

    const reader = () => {
      for (let index = 0; index < 300; index += 1) {
        expect(() => JSON.parse(readFileSync(targetPath, 'utf8'))).not.toThrow();
      }
    };

    for (let index = 0; index < 8; index += 1) {
      writeFileAtomically(targetPath, `${JSON.stringify(payload, null, 2)}\n`);
      reader();
    }

      rmSync(tempRoot, { recursive: true, force: true });
    },
    15000
  );
});

function createReleaseArtifactState(appIds: string[]) {
  const tempRoot = mkdtempSync(resolve(tmpdir(), 'shopflow-release-state-'));
  const manifestPath = resolve(tempRoot, 'manifest.json');
  const readinessPath = resolve(tempRoot, 'submission-readiness.json');

  writeFileAtomically(
    manifestPath,
    `${JSON.stringify(
      {
        generatedAt: '2026-04-03T12:00:00.000Z',
        entries: appIds.map((appId) => ({
          appId,
          releaseChannel: 'store-review',
          buildDirectory: `apps/${appId}/.output/chrome-mv3`,
          zipArtifacts: [`apps/${appId}/.output/${appId}.zip`],
        })),
      },
      null,
      2
    )}\n`
  );
  writeFileAtomically(
    readinessPath,
    `${JSON.stringify(
      {
        generatedAt: '2026-04-03T12:00:00.000Z',
        entries: appIds.map((appId) => ({
          appId,
          repoOwnedStatus:
            appId === 'ext-albertsons'
              ? 'review-bundle-ready-claim-gated'
              : appId === 'ext-amazon'
                ? 'review-bundle-ready-awaiting-signing'
                : 'review-bundle-ready-claim-gated',
          reviewBundleReady: true,
          readinessSummary:
            appId === 'ext-amazon'
              ? 'Ready for repo-local review.'
              : 'Reviewed live evidence still gates public wording.',
          manualReviewStartUrl: `https://example.com/${appId}`,
          reviewerStartPath: {
            reviewArtifactManifestPath: `.runtime-cache/release-artifacts/apps/${appId}/shopflow-review-artifact.json`,
          },
          requiredEvidenceCaptureIds:
            appId === 'ext-amazon' ? [] : [`${appId}-live-receipt`],
        })),
      },
      null,
      2
    )}\n`
  );

  return { manifestPath, readinessPath };
}
