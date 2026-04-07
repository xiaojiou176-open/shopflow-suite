import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createReviewArtifactManifest,
  writeReviewArtifactManifest,
} from '../../tooling/release/write-review-artifact-manifest';
import { collectArtifactOutputIssues } from '../../tooling/release/write-artifact-manifest';

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

function createBundleDir() {
  const root = mkdtempSync(join(os.tmpdir(), 'shopflow-release-artifact-'));
  const bundleDir = join(root, 'apps', 'ext-temu', '.output', 'chrome-mv3');
  tempDirs.push(root);
  mkdirSync(bundleDir, { recursive: true });
  writeFileSync(
    join(bundleDir, 'manifest.json'),
    JSON.stringify(
      {
        name: 'Shopflow for Temu',
        version: '0.1.0',
      },
      null,
      2
    )
  );
  writeFileSync(join(bundleDir, 'background.js'), 'console.log("bg");\n');
  writeFileSync(join(bundleDir, 'sidepanel.html'), '<html></html>\n');
  writeFileSync(join(bundleDir, 'popup.html'), '<html></html>\n');
  writeFileSync(
    join(root, 'apps', 'ext-temu', '.output', 'shopflow-ext-temu.zip'),
    'zip'
  );

  return bundleDir;
}

describe('release review artifact manifest tooling', () => {
  it('derives review metadata from the built extension manifest', () => {
    const bundleDir = createBundleDir();

    const reviewArtifact = createReviewArtifactManifest({
      appId: 'ext-temu',
      packageName: '@shopflow/ext-temu',
      reviewChannel: 'store-review',
      surface: 'storefront-shell',
      bundleDir,
      githubWorkflow: 'shopflow-ci',
      githubRunId: '12345',
      sourceSha: 'abc123',
      generatedAt: '2026-03-30T14:00:00.000Z',
    });

    expect(reviewArtifact).toMatchObject({
      appId: 'ext-temu',
      packageName: '@shopflow/ext-temu',
      reviewChannel: 'store-review',
      surface: 'storefront-shell',
      releaseChannel: 'storefront-shell-candidate',
      claimState: 'repo-verified',
      extensionName: 'Shopflow for Temu',
      extensionVersion: '0.1.0',
      githubWorkflow: 'shopflow-ci',
      githubRunId: '12345',
      sourceSha: 'abc123',
      generatedAt: '2026-03-30T14:00:00.000Z',
      bundleCompleteness: {
        requiredFiles: [
          'manifest.json',
          'background.js',
          'sidepanel.html',
          'popup.html',
        ],
        zipArtifacts: ['shopflow-ext-temu.zip'],
      },
    });
  });

  it('writes a review manifest next to the built bundle', () => {
    const bundleDir = createBundleDir();

    const outputPath = writeReviewArtifactManifest({
      appId: 'ext-temu',
      packageName: '@shopflow/ext-temu',
      reviewChannel: 'store-review',
      surface: 'storefront-shell',
      bundleDir,
      generatedAt: '2026-03-30T14:05:00.000Z',
    });

    expect(outputPath).toBe(join(bundleDir, 'shopflow-review-artifact.json'));
    expect(JSON.parse(readFileSync(outputPath, 'utf8'))).toMatchObject({
      appId: 'ext-temu',
      extensionName: 'Shopflow for Temu',
      generatedAt: '2026-03-30T14:05:00.000Z',
    });
  });

  it('also accepts staged release-artifact bundle directories', () => {
    const root = mkdtempSync(join(os.tmpdir(), 'shopflow-release-artifact-staged-'));
    tempDirs.push(root);
    const bundleDir = join(
      root,
      '.runtime-cache',
      'release-artifacts',
      'apps',
      'ext-temu',
      'bundle'
    );
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(
      join(bundleDir, 'manifest.json'),
      JSON.stringify(
        {
          name: 'Shopflow for Temu',
          version: '0.1.0',
        },
        null,
        2
      )
    );
    writeFileSync(join(bundleDir, 'background.js'), 'console.log("bg");\n');
    writeFileSync(join(bundleDir, 'sidepanel.html'), '<html></html>\n');
    writeFileSync(join(bundleDir, 'popup.html'), '<html></html>\n');
    mkdirSync(join(bundleDir, '..', 'zip'), { recursive: true });
    writeFileSync(join(bundleDir, '..', 'zip', 'shopflow-ext-temu.zip'), 'zip');

    const outputPath = writeReviewArtifactManifest({
      appId: 'ext-temu',
      packageName: '@shopflow/ext-temu',
      reviewChannel: 'store-review',
      surface: 'storefront-shell',
      bundleDir,
      generatedAt: '2026-03-30T14:05:00.000Z',
    });

    expect(outputPath).toBe(join(bundleDir, 'shopflow-review-artifact.json'));
    expect(JSON.parse(readFileSync(outputPath, 'utf8'))).toMatchObject({
      appId: 'ext-temu',
      extensionName: 'Shopflow for Temu',
    });
  });

  it('fails loudly when review metadata drifts away from the verification catalog', () => {
    const bundleDir = createBundleDir();

    expect(() =>
      createReviewArtifactManifest({
        appId: 'ext-temu',
        packageName: '@shopflow/ext-temu',
        reviewChannel: 'internal-alpha-review',
        surface: 'internal-alpha',
        bundleDir,
      })
    ).toThrow(/reviewChannel drift[\s\S]*surface drift/i);
  });

  it('fails loudly when the review bundle is incomplete even if metadata looks correct', () => {
    const bundleDir = createBundleDir();

    rmSync(join(bundleDir, 'popup.html'));
    rmSync(join(bundleDir, '..', 'shopflow-ext-temu.zip'));

    expect(() =>
      createReviewArtifactManifest({
        appId: 'ext-temu',
        packageName: '@shopflow/ext-temu',
        reviewChannel: 'store-review',
        surface: 'storefront-shell',
        bundleDir,
      })
    ).toThrow(/\[packaging\][\s\S]*popup\.html[\s\S]*zip artifacts/i);
  });

  it('reports missing bundle files in a readable local packaging failure shape', () => {
    const issues = collectArtifactOutputIssues([
      {
        appId: 'ext-temu',
        publicName: 'Shopflow for Temu',
        releaseChannel: 'storefront-shell-candidate',
        claimState: 'repo-verified',
        wave: 'Wave 2',
        tier: 'storefront-shell',
        buildDirectory: 'apps/ext-temu/.output/missing-chrome-mv3',
        zipArtifacts: [],
      },
    ]);

    expect(issues).toEqual([
      expect.objectContaining({
        appId: 'ext-temu',
        buildDirectoryMissing: true,
        zipArtifactsMissing: true,
        missingBundleFiles: expect.arrayContaining([
          'manifest.json',
          'background.js',
          'sidepanel.html',
          'popup.html',
        ]),
        reviewArtifactManifestMissing: true,
      }),
    ]);
  });
});
