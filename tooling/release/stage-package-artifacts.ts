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

  rmSync(appStageRoot, {
    recursive: true,
    force: true,
  });
  mkdirSync(appStageRoot, {
    recursive: true,
  });

  if (existsSync(buildRoot)) {
    cpSync(buildRoot, bundleStageRoot, {
      recursive: true,
    });
  }

  mkdirSync(zipStageRoot, {
    recursive: true,
  });

  for (const entry of waitForZipEntries(outputRoot)) {
      cpSync(resolve(outputRoot, entry), resolve(zipStageRoot, entry));
  }
}

process.stdout.write(
  `Staged package artifacts for ${appDirs.length} app director${
    appDirs.length === 1 ? 'y' : 'ies'
  } under ${stagingRoot}.\n`
);
