import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { basename, resolve } from 'node:path';

function sleep(milliseconds: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function removeDirectoryWithRetries(targetPath: string) {
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

function collectZipEntries(outputRoot: string) {
  if (!existsSync(outputRoot)) {
    return [];
  }

  return readdirSync(outputRoot).filter((entry) => entry.endsWith('.zip'));
}

function waitForZipEntries(outputRoot: string) {
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

function requiredBundleFilesFor(appId: string) {
  const baseFiles = ['manifest.json', 'background.js', 'sidepanel.html'];

  return appId === 'ext-shopping-suite'
    ? baseFiles
    : [...baseFiles, 'popup.html'];
}

function waitForBundleFiles(buildRoot: string, appId: string) {
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

const appDirs = process.argv.slice(2);

if (appDirs.length === 0) {
  throw new Error('Expected at least one app directory argument.');
}

const repoRoot = process.cwd();
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
}

process.stdout.write(
  `Staged package artifacts for ${appDirs.length} app director${
    appDirs.length === 1 ? 'y' : 'ies'
  } under ${stagingRoot}.\n`
);
