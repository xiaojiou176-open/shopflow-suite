import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  captureUiSurfaces,
  type UiCaptureLocale,
  type UiCaptureStoreAppId,
} from './capture-ui-surfaces.ts';
import { repoRoot } from '../../tests/support/repo-paths.ts';
import { writeFileAtomically } from '../shared/write-file-atomically.ts';

type MatrixCaptureTarget = {
  appId: UiCaptureStoreAppId;
  locale: UiCaptureLocale;
  outputSlug: string;
};

type MatrixSelectedArtifact = {
  sourceOutputSlug: string;
  relativeCapturePath: string;
  destinationFileName: string;
};

type UiSurfaceMatrixManifest = {
  generatedAt: string;
  outputRoot: string;
  targets: Array<{
    appId: UiCaptureStoreAppId;
    locale: UiCaptureLocale;
    outputRoot: string;
    manifestPath: string;
  }>;
  stagedArtifacts: Array<{
    destinationPath: string;
    sourcePath: string;
  }>;
};

const defaultMatrixRoot = resolve(repoRoot, '.runtime-cache/ui-matrix');
const defaultArtifactRoot = resolve(repoRoot, '.stitch/designs/matrix/r3');

export const uiSurfaceMatrixTargets: MatrixCaptureTarget[] = [
  {
    appId: 'ext-albertsons',
    locale: 'en',
    outputSlug: 'albertsons-en',
  },
  {
    appId: 'ext-kroger',
    locale: 'en',
    outputSlug: 'kroger-en',
  },
  {
    appId: 'ext-temu',
    locale: 'en',
    outputSlug: 'temu-en',
  },
  {
    appId: 'ext-albertsons',
    locale: 'zh-CN',
    outputSlug: 'albertsons-zh-CN',
  },
] as const;

const selectedArtifacts: MatrixSelectedArtifact[] = [
  {
    sourceOutputSlug: 'albertsons-en',
    relativeCapturePath: 'ext-albertsons.popup.en.png',
    destinationFileName: 'ext-albertsons.popup.en.png',
  },
  {
    sourceOutputSlug: 'albertsons-en',
    relativeCapturePath: 'ext-albertsons.sidepanel.en.png',
    destinationFileName: 'ext-albertsons.sidepanel.en.png',
  },
  {
    sourceOutputSlug: 'kroger-en',
    relativeCapturePath: 'ext-kroger.sidepanel.en.png',
    destinationFileName: 'ext-kroger.sidepanel.en.png',
  },
  {
    sourceOutputSlug: 'temu-en',
    relativeCapturePath: 'ext-temu.popup.en.png',
    destinationFileName: 'ext-temu.popup.en.png',
  },
  {
    sourceOutputSlug: 'albertsons-zh-CN',
    relativeCapturePath: 'ext-albertsons.popup.zh-CN.png',
    destinationFileName: 'ext-albertsons.popup.zh-CN.png',
  },
  {
    sourceOutputSlug: 'albertsons-zh-CN',
    relativeCapturePath: 'ext-albertsons.sidepanel.zh-CN.png',
    destinationFileName: 'ext-albertsons.sidepanel.zh-CN.png',
  },
  {
    sourceOutputSlug: 'albertsons-zh-CN',
    relativeCapturePath: 'ext-shopping-suite.sidepanel.zh-CN.png',
    destinationFileName: 'ext-shopping-suite.sidepanel.zh-CN.png',
  },
] as const;

function stageArtifact(sourcePath: string, destinationPath: string) {
  mkdirSync(dirname(destinationPath), { recursive: true });
  copyFileSync(sourcePath, destinationPath);
}

export async function captureUiSurfaceMatrix() {
  const matrixResults = [];

  for (const target of uiSurfaceMatrixTargets) {
    const outputRoot = resolve(defaultMatrixRoot, target.outputSlug);
    const runId = new Date().toISOString().replace(/[:]/g, '-');

    const result = await captureUiSurfaces({
      appId: target.appId,
      locale: target.locale,
      outputRoot,
      runId,
    });

    matrixResults.push({
      target,
      outputRoot,
      runId,
      manifestPath: result.manifestPath,
    });
  }

  const stagedArtifacts = selectedArtifacts.map((artifact) => {
    const sourceMatrix = matrixResults.find(
      (result) => result.target.outputSlug === artifact.sourceOutputSlug
    );
    if (!sourceMatrix) {
      throw new Error(
        `Unable to locate matrix result for ${artifact.sourceOutputSlug}.`
      );
    }

    const sourcePath = resolve(
      sourceMatrix.outputRoot,
      sourceMatrix.runId,
      artifact.relativeCapturePath
    );
    const destinationPath = resolve(defaultArtifactRoot, artifact.destinationFileName);

    stageArtifact(sourcePath, destinationPath);

    return {
      destinationPath: relative(repoRoot, destinationPath),
      sourcePath: relative(repoRoot, sourcePath),
    };
  });

  const manifest: UiSurfaceMatrixManifest = {
    generatedAt: new Date().toISOString(),
    outputRoot: relative(repoRoot, defaultMatrixRoot),
    targets: matrixResults.map((result) => ({
      appId: result.target.appId,
      locale: result.target.locale,
      outputRoot: relative(repoRoot, result.outputRoot),
      manifestPath: relative(repoRoot, result.manifestPath),
    })),
    stagedArtifacts,
  };

  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  const manifestPath = resolve(
    defaultMatrixRoot,
    'ui-surface-matrix-manifest-latest.json'
  );

  writeFileAtomically(manifestPath, serialized);
  return serialized;
}

export async function uiSurfaceMatrixMain() {
  const serialized = await captureUiSurfaceMatrix();
  process.stdout.write(serialized);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  uiSurfaceMatrixMain().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
