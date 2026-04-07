import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { allVerificationCatalogEntries } from '@shopflow/contracts';
import { writeReviewArtifactManifest } from './write-review-artifact-manifest';

export function sleep(milliseconds: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

export function removeDirectoryWithRetries(targetPath: string) {
  const deadline = Date.now() + 10_000;

  while (true) {
    try {
      rmSync(targetPath, {
        recursive: true,
        force: true,
      });
      return;
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          'code' in error &&
          ['EBUSY', 'ENOTEMPTY', 'EPERM'].includes(String(error.code))
        )
      ) {
        throw error;
      }

      if (Date.now() >= deadline) {
        throw error;
      }

      sleep(200);
    }
  }
}

export function collectZipEntries(outputRoot: string) {
  if (!existsSync(outputRoot)) {
    return [];
  }

  return readdirSync(outputRoot).filter((entry) => entry.endsWith('.zip'));
}

export function waitForZipEntries(outputRoot: string) {
  // `wxt zip` can return before the final archive is visible on disk on some
  // runs, especially when several apps are packaged back-to-back. Give the
  // staging lane a wider window so the release-readiness gate does not fail on
  // a transient filesystem lag.
  const deadline = Date.now() + 20_000;
  let zipEntries = collectZipEntries(outputRoot);

  while (zipEntries.length === 0 && Date.now() < deadline) {
    sleep(200);
    zipEntries = collectZipEntries(outputRoot);
  }

  return zipEntries;
}

export function requiredBundleFilesFor(appId: string) {
  const baseFiles = ['manifest.json', 'background.js', 'sidepanel.html'];

  return appId === 'ext-shopping-suite'
    ? baseFiles
    : [...baseFiles, 'popup.html'];
}

export function waitForBundleFiles(buildRoot: string, appId: string) {
  const deadline = Date.now() + 20_000;
  const requiredFiles = requiredBundleFilesFor(appId);

  while (Date.now() < deadline) {
    const allPresent = requiredFiles.every((fileName) =>
      existsSync(resolve(buildRoot, fileName))
    );

    if (allPresent) {
      return;
    }

    sleep(200);
  }
}

function verificationEntryFor(appId: string) {
  const entry = allVerificationCatalogEntries.find(
    (candidate) => candidate.appId === appId
  );

  if (!entry) {
    throw new Error(`Unknown appId "${appId}" while staging review artifacts.`);
  }

  return entry;
}

export function stagePackageArtifacts(
  appDirs: string[],
  repoRoot = process.cwd()
) {
  if (appDirs.length === 0) {
    throw new Error('Expected at least one app directory argument.');
  }

  const stagingRoot = resolve(repoRoot, '.runtime-cache/release-artifacts/apps');

  for (const appDir of appDirs) {
    const appId = basename(appDir);
    const outputRoot = resolve(repoRoot, appDir, '.output');
    const buildRoot = resolve(outputRoot, 'chrome-mv3');
    const appStageRoot = resolve(stagingRoot, appId);
    const bundleStageRoot = resolve(appStageRoot, 'bundle');
    const zipStageRoot = resolve(appStageRoot, 'zip');

    removeDirectoryWithRetries(appStageRoot);
    mkdirSync(appStageRoot, {
      recursive: true,
    });

    const zipEntries = waitForZipEntries(outputRoot);

    if (existsSync(buildRoot)) {
      waitForBundleFiles(buildRoot, appId);
      cpSync(buildRoot, bundleStageRoot, {
        recursive: true,
      });
    }

    mkdirSync(zipStageRoot, {
      recursive: true,
    });

    for (const entry of zipEntries) {
      cpSync(resolve(outputRoot, entry), resolve(zipStageRoot, entry));
    }

    if (existsSync(bundleStageRoot)) {
      const entry = verificationEntryFor(appId);
      writeReviewArtifactManifest({
        appId,
        packageName: `@shopflow/${appId}`,
        reviewChannel:
          entry.releaseChannel === 'internal-alpha'
            ? 'internal-alpha-review'
            : 'store-review',
        surface:
          appId === 'ext-shopping-suite'
            ? 'internal-alpha'
            : entry.tier === 'capability-heavy-product'
              ? 'capability-heavy-product'
              : 'storefront-shell',
        bundleDir: bundleStageRoot,
      });
    }
  }

  process.stdout.write(
    `Staged package artifacts for ${appDirs.length} app director${
      appDirs.length === 1 ? 'y' : 'ies'
    } under ${stagingRoot}.\n`
  );
}

function main() {
  stagePackageArtifacts(process.argv.slice(2));
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main();
}
