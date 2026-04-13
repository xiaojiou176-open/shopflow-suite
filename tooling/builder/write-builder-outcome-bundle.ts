import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  builderPayloadSourceSchema,
  builderAppSnapshotSchema,
  builderOutcomeBundleSchema,
  createBuilderOutcomeBundle,
} from '@shopflow/runtime';
import {
  operatorDecisionBriefSchema,
  workflowCopilotBriefSchema,
} from '@shopflow/contracts';
import {
  supportsCanonicalRuntimePayloads,
  writeCanonicalBuilderRuntimePayloads,
} from './runtime-payloads.ts';
import { writeFileAtomically } from '../shared/write-file-atomically.ts';

const repoRoot = resolve(import.meta.dirname, '../..');
const defaultOutputPath = resolve(
  repoRoot,
  '.runtime-cache/builder/builder-outcome-bundle.json'
);
const artifactManifestPath = resolve(
  repoRoot,
  '.runtime-cache/release-artifacts/manifest.json'
);
const submissionReadinessPath = resolve(
  repoRoot,
  '.runtime-cache/release-artifacts/submission-readiness.json'
);
const generatedBuilderDirectory = resolve(repoRoot, '.runtime-cache/builder');
type CliOptions = {
  appId: string;
  snapshotPath: string;
  decisionBriefPath: string;
  workflowBriefPath: string;
  outputPath: string;
  stdout: boolean;
  generatedAt?: string;
  artifactManifestPath: string;
  submissionReadinessPath: string;
  runtimePayloadDirectory: string;
  allowRuntimePayloadWrites: boolean;
  payloadSourcePathMode: 'absolute' | 'repo-relative';
};

type ReleaseArtifactManifest = {
  entries: Array<{
    appId: string;
    releaseChannel: string;
    buildDirectory: string;
    zipArtifacts: string[];
  }>;
};

type SubmissionReadinessReport = {
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

type BuilderPayloadSource = {
  kind: 'generated-runtime-file' | 'explicit-input-file' | 'checked-in-example';
  path: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    appId: 'ext-albertsons',
    snapshotPath: defaultPayloadPathFor('builder-app-snapshot', 'ext-albertsons'),
    decisionBriefPath: defaultPayloadPathFor('operator-decision-brief', 'ext-albertsons'),
    workflowBriefPath: defaultPayloadPathFor('workflow-copilot-brief', 'ext-albertsons'),
    outputPath: defaultOutputPath,
    stdout: false,
    artifactManifestPath,
    submissionReadinessPath,
    runtimePayloadDirectory: generatedBuilderDirectory,
    allowRuntimePayloadWrites: true,
    payloadSourcePathMode: 'absolute',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--stdout') {
      options.stdout = true;
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

    if (arg === '--app') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --app');
      }
      options.appId = value;
      options.snapshotPath = defaultPayloadPathFor('builder-app-snapshot', value);
      options.decisionBriefPath = defaultPayloadPathFor('operator-decision-brief', value);
      options.workflowBriefPath = defaultPayloadPathFor('workflow-copilot-brief', value);
      index += 1;
      continue;
    }

    if (arg === '--snapshot') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --snapshot');
      }
      options.snapshotPath = resolve(repoRoot, value);
      index += 1;
      continue;
    }

    if (arg === '--decision-brief') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --decision-brief');
      }
      options.decisionBriefPath = resolve(repoRoot, value);
      index += 1;
      continue;
    }

    if (arg === '--workflow-brief') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --workflow-brief');
      }
      options.workflowBriefPath = resolve(repoRoot, value);
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

function readJsonExample(path: string) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readOptionalJson<T>(path: string): T | undefined {
  if (!existsSync(path)) {
    return undefined;
  }

  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch (error) {
    // Cache-governance and test helpers can remove temp artifacts between the
    // existence check and the actual read. Treat ENOENT as "optional file
    // missing" instead of turning that race into a hard failure.
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'ENOENT'
    ) {
      return undefined;
    }

    throw error;
  }
}

function examplePathFor(
  prefix:
    | 'builder-app-snapshot'
    | 'operator-decision-brief'
    | 'workflow-copilot-brief',
  appId: string
) {
  return resolve(repoRoot, `docs/ecosystem/examples/${prefix}.${appId}.json`);
}

function generatedPayloadPathFor(
  prefix:
    | 'builder-app-snapshot'
    | 'operator-decision-brief'
    | 'workflow-copilot-brief',
  appId: string,
  runtimePayloadDirectory = generatedBuilderDirectory
) {
  return resolve(runtimePayloadDirectory, `${prefix}.${appId}.json`);
}

function defaultPayloadPathFor(
  prefix:
    | 'builder-app-snapshot'
    | 'operator-decision-brief'
    | 'workflow-copilot-brief',
  appId: string,
  runtimePayloadDirectory = generatedBuilderDirectory,
  allowRuntimePayloadWrites = true
) {
  const generatedPath = generatedPayloadPathFor(
    prefix,
    appId,
    runtimePayloadDirectory
  );

  if (
    !existsSync(generatedPath) &&
    allowRuntimePayloadWrites &&
    supportsCanonicalRuntimePayloads(appId)
  ) {
    writeCanonicalBuilderRuntimePayloads(appId, runtimePayloadDirectory);
  }

  return existsSync(generatedPath)
    ? generatedPath
    : examplePathFor(prefix, appId);
}

function resolvePayloadSource(
  path: string,
  defaultPath: string,
  runtimePayloadDirectory = generatedBuilderDirectory,
  pathMode: CliOptions['payloadSourcePathMode'] = 'absolute'
): BuilderPayloadSource {
  const renderedPath =
    pathMode === 'repo-relative' ? renderRepoRelativePath(path) : path;

  if (path === defaultPath) {
    return {
      kind: existsSync(path) && path.startsWith(runtimePayloadDirectory)
        ? 'generated-runtime-file'
        : 'checked-in-example',
      path: renderedPath,
    };
  }

  return {
    kind: 'explicit-input-file',
    path: renderedPath,
  };
}

function renderRepoRelativePath(path: string) {
  const relativePath = relative(repoRoot, path);
  return relativePath.startsWith('..') ? path : relativePath.replaceAll('\\', '/');
}

export function buildBuilderOutcomeBundle(options: Partial<CliOptions> = {}) {
  const selectedAppId = options.appId ?? 'ext-albertsons';
  const runtimePayloadDirectory =
    options.runtimePayloadDirectory ?? generatedBuilderDirectory;
  const allowRuntimePayloadWrites = options.allowRuntimePayloadWrites ?? true;
  const payloadSourcePathMode = options.payloadSourcePathMode ?? 'absolute';
  const snapshotPath =
    options.snapshotPath ??
    defaultPayloadPathFor(
      'builder-app-snapshot',
      selectedAppId,
      runtimePayloadDirectory,
      allowRuntimePayloadWrites
    );
  const snapshot = builderAppSnapshotSchema.parse(readJsonExample(snapshotPath));
  const operatorDecisionBriefPath =
    options.decisionBriefPath ??
    defaultPayloadPathFor(
      'operator-decision-brief',
      snapshot.appId,
      runtimePayloadDirectory,
      allowRuntimePayloadWrites
    );
  const operatorDecisionBrief = operatorDecisionBriefSchema.parse(
    readJsonExample(operatorDecisionBriefPath)
  );
  const workflowBriefPath =
    options.workflowBriefPath ??
    defaultPayloadPathFor(
      'workflow-copilot-brief',
      snapshot.appId,
      runtimePayloadDirectory,
      allowRuntimePayloadWrites
    );
  const workflowCopilotBrief = workflowCopilotBriefSchema.parse(
    readJsonExample(workflowBriefPath)
  );

  const baseBundle = createBuilderOutcomeBundle({
    generatedAt: options.generatedAt,
    builderAppSnapshot: snapshot,
    operatorDecisionBrief,
    workflowCopilotBrief,
    payloadSources: {
      builderAppSnapshot: builderPayloadSourceSchema.parse({
        surfaceId: 'builder-app-snapshot',
        ...resolvePayloadSource(
          snapshotPath,
          defaultPayloadPathFor(
            'builder-app-snapshot',
            snapshot.appId,
            runtimePayloadDirectory,
            allowRuntimePayloadWrites
          ),
          runtimePayloadDirectory,
          payloadSourcePathMode
        ),
      }),
      operatorDecisionBrief: builderPayloadSourceSchema.parse({
        surfaceId: 'operator-decision-brief',
        ...resolvePayloadSource(
          operatorDecisionBriefPath,
          defaultPayloadPathFor(
            'operator-decision-brief',
            snapshot.appId,
            runtimePayloadDirectory,
            allowRuntimePayloadWrites
          ),
          runtimePayloadDirectory,
          payloadSourcePathMode
        ),
      }),
      workflowCopilotBrief: builderPayloadSourceSchema.parse({
        surfaceId: 'workflow-copilot-brief',
        ...resolvePayloadSource(
          workflowBriefPath,
          defaultPayloadPathFor(
            'workflow-copilot-brief',
            snapshot.appId,
            runtimePayloadDirectory,
            allowRuntimePayloadWrites
          ),
          runtimePayloadDirectory,
          payloadSourcePathMode
        ),
      }),
    },
  });
  const manifest = readOptionalJson<ReleaseArtifactManifest>(
    options.artifactManifestPath ?? artifactManifestPath
  );
  const readiness = readOptionalJson<SubmissionReadinessReport>(
    options.submissionReadinessPath ?? submissionReadinessPath
  );

  return builderOutcomeBundleSchema.parse({
    ...baseBundle,
    artifactPointers: baseBundle.artifactPointers.map((pointer) => {
      if (pointer.id === 'artifact-manifest') {
        return buildArtifactManifestPointer(pointer, snapshot.appId, manifest);
      }

      return buildSubmissionReadinessPointer(pointer, snapshot.appId, readiness);
    }),
  });
}

function buildArtifactManifestPointer(
  pointer: {
    id: 'artifact-manifest' | 'submission-readiness-report';
    path: string;
    command: string;
    summary: string;
  },
  appId: string,
  manifest?: ReleaseArtifactManifest
) {
  const manifestEntry = manifest?.entries.find((entry) => entry.appId === appId);

  if (!manifest || !manifestEntry) {
    return pointer;
  }

  const zipArtifactCount = manifestEntry.zipArtifacts.length;

  return {
    ...pointer,
    summary: `Release manifest now proves ${manifest.entries.length} app entries. ${appId} is ${manifestEntry.releaseChannel} with bundle directory ${manifestEntry.buildDirectory} and ${zipArtifactCount} packaged zip artifact${zipArtifactCount === 1 ? '' : 's'}.`,
  };
}

function buildSubmissionReadinessPointer(
  pointer: {
    id: 'artifact-manifest' | 'submission-readiness-report';
    path: string;
    command: string;
    summary: string;
  },
  appId: string,
  readiness?: SubmissionReadinessReport
) {
  const readinessEntry = readiness?.entries.find((entry) => entry.appId === appId);

  if (!readiness || !readinessEntry) {
    return pointer;
  }

  const reviewManifestPath =
    readinessEntry.reviewerStartPath?.reviewArtifactManifestPath;
  const startUrl = readinessEntry.manualReviewStartUrl;

  return {
    ...pointer,
    summary: `Submission readiness marks ${appId} as ${readinessEntry.repoOwnedStatus}. Review bundle ready: ${readinessEntry.reviewBundleReady ? 'yes' : 'no'}.${reviewManifestPath ? ` Review artifact manifest: ${reviewManifestPath}.` : ''}${startUrl ? ` Manual review starts at ${startUrl}.` : ''} ${readinessEntry.readinessSummary}`,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const bundle = buildBuilderOutcomeBundle(options);
  const serialized = `${JSON.stringify(bundle, null, 2)}\n`;

  if (options.stdout) {
    process.stdout.write(serialized);
    return;
  }

  writeFileAtomically(options.outputPath, serialized);
  process.stdout.write(
    `Builder outcome bundle written for ${bundle.appId}: ${options.outputPath}\n`
  );
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main();
}
