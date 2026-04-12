import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  tempRepoRoot,
  captureUiSurfacesMock,
  writeFileAtomicallyMock,
} = vi.hoisted(() => ({
  tempRepoRoot: '/tmp/shopflow-ui-surface-matrix-vitest',
  captureUiSurfacesMock: vi.fn(),
  writeFileAtomicallyMock: vi.fn(),
}));

vi.mock('../../tooling/verification/capture-ui-surfaces.ts', () => ({
  captureUiSurfaces: captureUiSurfacesMock,
}));

vi.mock('../../tooling/shared/write-file-atomically.ts', () => ({
  writeFileAtomically: writeFileAtomicallyMock,
}));

vi.mock('../../tests/support/repo-paths.ts', () => ({
  repoRoot: tempRepoRoot,
}));

import {
  captureUiSurfaceMatrix,
  uiSurfaceMatrixMain,
  uiSurfaceMatrixTargets,
} from '../../tooling/verification/capture-ui-surface-matrix';

describe('ui surface matrix tooling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rmSync(tempRepoRoot, { recursive: true, force: true });
    captureUiSurfacesMock.mockImplementation(
      async ({
        appId,
        locale,
        outputRoot,
        runId,
      }: {
        appId: string;
        locale: string;
        outputRoot: string;
        runId: string;
      }) => {
        mkdirSync(join(outputRoot, runId), { recursive: true });
        writeFileSync(
          join(outputRoot, runId, `${appId}.popup.${locale}.png`),
          `${appId}-popup-${locale}`
        );
        writeFileSync(
          join(outputRoot, runId, `${appId}.sidepanel.${locale}.png`),
          `${appId}-sidepanel-${locale}`
        );
        writeFileSync(
          join(outputRoot, runId, `ext-shopping-suite.sidepanel.${locale}.png`),
          `suite-sidepanel-${locale}`
        );

        return {
          manifestPath: `${outputRoot}/ui-surface-capture-manifest.${runId}.json`,
          plan: [],
          appId,
          locale,
        };
      }
    );
    writeFileAtomicallyMock.mockImplementation((path: string, contents: string) => {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, contents);
    });
  });

  it('covers the required multi-app matrix lanes', () => {
    expect(uiSurfaceMatrixTargets).toEqual([
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
    ]);
  });

  it('captures every target and stages the reviewer artifact set', async () => {
    const serialized = await captureUiSurfaceMatrix();
    const manifest = JSON.parse(serialized) as {
      targets: Array<{ appId: string; locale: string; manifestPath: string }>;
      stagedArtifacts: Array<{ destinationPath: string; sourcePath: string }>;
    };

    expect(captureUiSurfacesMock).toHaveBeenCalledTimes(
      uiSurfaceMatrixTargets.length
    );
    expect(manifest.targets).toHaveLength(uiSurfaceMatrixTargets.length);
    expect(manifest.targets.map((entry) => `${entry.appId}:${entry.locale}`)).toEqual(
      uiSurfaceMatrixTargets.map((entry) => `${entry.appId}:${entry.locale}`)
    );
    expect(manifest.stagedArtifacts).toHaveLength(7);
    expect(manifest.stagedArtifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          destinationPath: '.stitch/designs/matrix/r3/ext-albertsons.popup.en.png',
          sourcePath: expect.stringContaining(
            '.runtime-cache/ui-matrix/albertsons-en/'
          ),
        }),
        expect.objectContaining({
          destinationPath:
            '.stitch/designs/matrix/r3/ext-shopping-suite.sidepanel.zh-CN.png',
          sourcePath: expect.stringContaining(
            '.runtime-cache/ui-matrix/albertsons-zh-CN/'
          ),
        }),
      ])
    );
    expect(
      existsSync(
        join(tempRepoRoot, '.stitch/designs/matrix/r3/ext-albertsons.popup.en.png')
      )
    ).toBe(true);
    expect(
      readFileSync(
        join(tempRepoRoot, '.stitch/designs/matrix/r3/ext-temu.popup.en.png'),
        'utf8'
      )
    ).toBe('ext-temu-popup-en');
    expect(writeFileAtomicallyMock).toHaveBeenCalledWith(
      expect.stringContaining(
        '.runtime-cache/ui-matrix/ui-surface-matrix-manifest-latest.json'
      ),
      expect.stringContaining('"stagedArtifacts"')
    );
  });

  it('writes the serialized manifest to stdout in the CLI entrypoint', async () => {
    const stdoutWriteSpy = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    await uiSurfaceMatrixMain();

    expect(stdoutWriteSpy).toHaveBeenCalledWith(
      expect.stringContaining('"targets"')
    );
    stdoutWriteSpy.mockRestore();
  });
});
