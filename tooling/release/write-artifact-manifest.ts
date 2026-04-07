import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { allVerificationCatalogEntries } from '@shopflow/contracts';
import { writeFileAtomically } from '../shared/write-file-atomically';

const repoRoot = resolve(import.meta.dirname, '../..');
const manifestOutputPath = resolve(
  repoRoot,
  '.runtime-cache/release-artifacts/manifest.json'
);

export type ReleaseArtifactManifestEntry = {
  appId: string;
  publicName: string;
  releaseChannel: string;
  claimState: string;
  wave: string;
  tier: string;
  buildDirectory: string;
  zipArtifacts: string[];
};

type ReleaseArtifactOutputIssue = {
  appId: string;
  buildDirectoryMissing: boolean;
  zipArtifactsMissing: boolean;
  missingBundleFiles: string[];
  reviewArtifactManifestMissing: boolean;
};

function sleep(milliseconds: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function collectZipArtifacts(outputDirectory: string) {
  if (!exists(outputDirectory)) {
    return [];
  }

  return readdirSync(outputDirectory)
    .filter((entry) => entry.endsWith('.zip'))
    .map((entry) => `${outputDirectory}/${entry}`);
}

function stagedAppRoot(appId: string) {
  return `.runtime-cache/release-artifacts/apps/${appId}`;
}

function stagedBuildDirectory(appId: string) {
  return `${stagedAppRoot(appId)}/bundle`;
}

function stagedZipDirectory(appId: string) {
  return `${stagedAppRoot(appId)}/zip`;
}

function exists(relativePath: string) {
  return readdirSafe(relativePath) !== null;
}

function fileExists(relativePath: string) {
  const absolutePath = resolve(repoRoot, relativePath);

  try {
    return readdirSync(resolve(absolutePath, '..')).includes(
      absolutePath.split('/').pop() ?? ''
    );
  } catch {
    return false;
  }
}

function readdirSafe(relativePath: string) {
  try {
    return readdirSync(resolve(repoRoot, relativePath));
  } catch {
    return null;
  }
}

export function buildManifest() {
  return allVerificationCatalogEntries.map((entry) => {
    const defaultBuildDirectory = `${entry.appDir}/.output/chrome-mv3`;
    const defaultOutputDirectory = `${entry.appDir}/.output`;
    const buildDirectory = exists(stagedBuildDirectory(entry.appId))
      ? stagedBuildDirectory(entry.appId)
      : defaultBuildDirectory;
    const outputDirectory = exists(stagedZipDirectory(entry.appId))
      ? stagedZipDirectory(entry.appId)
      : defaultOutputDirectory;

    return {
      appId: entry.appId,
      publicName: entry.publicName,
      releaseChannel: entry.releaseChannel,
      claimState: entry.claimState,
      wave: entry.wave,
      tier: entry.tier,
      buildDirectory,
      zipArtifacts: collectZipArtifacts(outputDirectory),
    } satisfies ReleaseArtifactManifestEntry;
  });
}

function requiredBundleFilesFor(appId: string) {
  const baseFiles = ['manifest.json', 'background.js', 'sidepanel.html'];

  return appId === 'ext-shopping-suite'
    ? baseFiles
    : [...baseFiles, 'popup.html'];
}

export function collectArtifactOutputIssues(
  manifest = buildManifest()
): ReleaseArtifactOutputIssue[] {
  return manifest.flatMap((entry) => {
    const reviewArtifactManifestMissing = !fileExists(
      join(entry.buildDirectory, 'shopflow-review-artifact.json')
    );
    const missingBundleFiles = requiredBundleFilesFor(entry.appId).filter(
      (fileName) => !fileExists(join(entry.buildDirectory, fileName))
    );
    const issue: ReleaseArtifactOutputIssue = {
      appId: entry.appId,
      buildDirectoryMissing: !exists(entry.buildDirectory),
      zipArtifactsMissing: entry.zipArtifacts.length === 0,
      missingBundleFiles,
      reviewArtifactManifestMissing,
    };

    return issue.buildDirectoryMissing ||
      issue.zipArtifactsMissing ||
      issue.missingBundleFiles.length > 0 ||
      issue.reviewArtifactManifestMissing
      ? [issue]
      : [];
  });
}

function waitForArtifactOutputs() {
  const deadline = Date.now() + 20_000;
  let manifest = buildManifest();
  let missingOutputs = collectArtifactOutputIssues(manifest);

  while (missingOutputs.length > 0 && Date.now() < deadline) {
    sleep(200);
    manifest = buildManifest();
    missingOutputs = collectArtifactOutputIssues(manifest);
  }

  return {
    manifest,
    missingOutputs,
  };
}

function main() {
  const requireOutputs = process.argv.includes('--require-outputs');
  const { manifest, missingOutputs } = requireOutputs
    ? waitForArtifactOutputs()
    : {
        manifest: buildManifest(),
        missingOutputs: collectArtifactOutputIssues(),
      };

  if (requireOutputs && missingOutputs.length > 0) {
    for (const entry of missingOutputs) {
      console.error(
        `- Missing packaged outputs for ${entry.appId}: buildDirMissing=${entry.buildDirectoryMissing}, zipArtifactsMissing=${entry.zipArtifactsMissing}, missingBundleFiles=${entry.missingBundleFiles.join(', ') || 'none'}, reviewArtifactManifestMissing=${entry.reviewArtifactManifestMissing}`
      );
    }
    process.exitCode = 1;
    return;
  }

  writeFileAtomically(
    manifestOutputPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), entries: manifest }, null, 2)}\n`
  );

  process.stdout.write(
    `Release artifact manifest written for ${manifest.length} app entries: ${manifestOutputPath}\n`
  );
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main();
}
