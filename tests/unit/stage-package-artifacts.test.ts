import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  collectZipEntries,
  removeDirectoryWithRetries,
  requiredBundleFilesFor,
  sleep,
  stagePackageArtifacts,
  waitForBundleFiles,
  waitForZipEntries,
} from '../../tooling/release/stage-package-artifacts';

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

function createTempRoot(prefix: string) {
  const root = mkdtempSync(join(os.tmpdir(), prefix));
  tempDirs.push(root);
  return root;
}

function writeBundleFiles(bundleDir: string, includePopup = true) {
  mkdirSync(bundleDir, { recursive: true });
  writeFileSync(join(bundleDir, 'manifest.json'), '{}\n');
  writeFileSync(join(bundleDir, 'background.js'), 'console.log("bg");\n');
  writeFileSync(join(bundleDir, 'sidepanel.html'), '<html></html>\n');
  if (includePopup) {
    writeFileSync(join(bundleDir, 'popup.html'), '<html></html>\n');
  }
}

describe('stage package artifacts tooling', () => {
  it('uses the storefront and suite bundle file contracts explicitly', () => {
    expect(requiredBundleFilesFor('ext-temu')).toEqual([
      'manifest.json',
      'background.js',
      'sidepanel.html',
      'popup.html',
    ]);
    expect(requiredBundleFilesFor('ext-shopping-suite')).toEqual([
      'manifest.json',
      'background.js',
      'sidepanel.html',
    ]);
  });

  it('collects zip entries and returns immediately when they already exist', () => {
    const outputRoot = createTempRoot('shopflow-stage-zips-');
    writeFileSync(join(outputRoot, 'alpha.zip'), 'zip');
    writeFileSync(join(outputRoot, 'notes.txt'), 'ignore');

    expect(collectZipEntries(outputRoot)).toEqual(['alpha.zip']);
    expect(waitForZipEntries(outputRoot)).toEqual(['alpha.zip']);
  });

  it('exposes the zero-wait sleep helper as a harmless no-op for retry callers', () => {
    expect(() => sleep(0)).not.toThrow();
  });

  it('returns immediately when required bundle files already exist', () => {
    const storefrontRoot = createTempRoot('shopflow-stage-storefront-');
    const storefrontBundle = join(storefrontRoot, 'chrome-mv3');
    writeBundleFiles(storefrontBundle, true);

    const suiteRoot = createTempRoot('shopflow-stage-suite-');
    const suiteBundle = join(suiteRoot, 'chrome-mv3');
    writeBundleFiles(suiteBundle, false);

    expect(() => waitForBundleFiles(storefrontBundle, 'ext-target')).not.toThrow();
    expect(() => waitForBundleFiles(suiteBundle, 'ext-shopping-suite')).not.toThrow();
  });

  it('removes directories idempotently and stages bundle plus zip artifacts', () => {
    const repoRoot = createTempRoot('shopflow-stage-repo-');
    const outputRoot = join(repoRoot, 'apps', 'ext-amazon', '.output');
    const bundleRoot = join(outputRoot, 'chrome-mv3');
    const staleStageRoot = join(
      repoRoot,
      '.runtime-cache',
      'release-artifacts',
      'apps',
      'ext-amazon'
    );

    writeBundleFiles(bundleRoot, true);
    writeFileSync(join(outputRoot, 'shopflow-ext-amazon.zip'), 'zip');
    mkdirSync(staleStageRoot, { recursive: true });
    writeFileSync(join(staleStageRoot, 'old.txt'), 'old');

    expect(() => removeDirectoryWithRetries(staleStageRoot)).not.toThrow();
    stagePackageArtifacts(['apps/ext-amazon'], repoRoot);

    expect(
      collectZipEntries(join(staleStageRoot, 'zip'))
    ).toEqual(['shopflow-ext-amazon.zip']);
    expect(
      existsSync(join(staleStageRoot, 'bundle', 'shopflow-review-artifact.json'))
    ).toBe(true);
  });

  it('fails loudly when no app directories are provided', () => {
    const repoRoot = createTempRoot('shopflow-stage-empty-');

    expect(() => stagePackageArtifacts([], repoRoot)).toThrow(
      'Expected at least one app directory argument.'
    );
  });
});
