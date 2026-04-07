import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { resolveFromRepo } from '../support/repo-paths';

function readRepoFile(path: string) {
  return readFileSync(resolveFromRepo(path), 'utf8');
}

describe('shared package boundary guards', () => {
  it('keeps packages/ui from reaching into packages/core source files directly', () => {
    const uiFiles = [
      'packages/ui/src/ui-copy.ts',
      'packages/ui/src/popup-launcher.tsx',
      'packages/ui/src/recent-activity-copy.ts',
      'packages/ui/src/side-panel-home-page.tsx',
      'packages/ui/src/suite-control-plane.ts',
      'packages/ui/src/runtime-surface.tsx',
    ];

    for (const relativePath of uiFiles) {
      const contents = readRepoFile(relativePath);
      expect(contents).toContain('@shopflow/core');
      expect(contents).not.toContain('../../core/src/');
      expect(contents).not.toContain('../core/src/');
    }
  });

  it('keeps BrowserLocalStorage owned by runtime instead of redefined in ui or Suite app files', () => {
    const runtimeSurface = readRepoFile('packages/ui/src/runtime-surface.tsx');
    const suiteControlPlaneUi = readRepoFile(
      'packages/ui/src/suite-control-plane.ts'
    );
    const suiteControlPlaneShim = readRepoFile(
      'apps/ext-shopping-suite/src/suite-control-plane.ts'
    );
    const runtimeStorage = readRepoFile(
      'packages/runtime/src/storage/browser-local-storage.ts'
    );

    expect(runtimeSurface).toContain('BrowserLocalStorage');
    expect(runtimeSurface).toContain('@shopflow/runtime');
    expect(runtimeSurface).not.toContain('class BrowserLocalStorage');
    expect(suiteControlPlaneUi).toContain('createSuiteControlPlaneRepositories');
    expect(suiteControlPlaneUi).toContain('@shopflow/runtime');
    expect(suiteControlPlaneUi).not.toContain('class BrowserLocalStorage');
    expect(suiteControlPlaneShim).toContain("from '@shopflow/ui';");
    expect(suiteControlPlaneShim).not.toContain('class BrowserLocalStorage');
    expect(runtimeStorage).toContain('export class BrowserLocalStorage');
  });

  it('keeps Suite control-plane orchestration helpers in runtime instead of re-implementing key filtering in the app shell', () => {
    const suiteControlPlaneUi = readRepoFile(
      'packages/ui/src/suite-control-plane.ts'
    );
    const suiteControlPlaneShim = readRepoFile(
      'apps/ext-shopping-suite/src/suite-control-plane.ts'
    );
    const runtimeHelper = readRepoFile(
      'packages/runtime/src/storage/suite-control-plane-runtime.ts'
    );

    expect(suiteControlPlaneUi).toContain('createSuiteControlPlaneRepositories');
    expect(suiteControlPlaneUi).toContain('loadSuiteDetailMap');
    expect(suiteControlPlaneUi).toContain(
      'subscribeSuiteControlPlaneStorageChanges'
    );
    expect(suiteControlPlaneUi).not.toContain('activityStorageKey');
    expect(suiteControlPlaneUi).not.toContain('detectionStorageKeyPrefix');
    expect(suiteControlPlaneShim).toContain("from '@shopflow/ui';");
    expect(suiteControlPlaneShim).not.toContain('useEffect');
    expect(suiteControlPlaneShim).not.toContain('useState');
    expect(runtimeHelper).toContain(
      'export function createSuiteControlPlaneRepositories'
    );
    expect(runtimeHelper).toContain(
      'export async function loadSuiteControlPlaneSource'
    );
    expect(runtimeHelper).toContain(
      'export function hasSuiteControlPlaneStorageChange'
    );
    expect(runtimeHelper).toContain(
      'export function subscribeSuiteControlPlaneStorageChanges'
    );
  });

  it('keeps ext-albertsons pointed at the @shopflow/core package entrypoint', () => {
    const tsconfig = readRepoFile('apps/ext-albertsons/tsconfig.json');

    expect(tsconfig).toContain(
      '"@shopflow/core": ["../../packages/core/src/index.ts"]'
    );
    expect(tsconfig).not.toContain(
      '../../packages/core/src/side-panel-home-view-model.ts'
    );
  });

  it('keeps the Suite app consuming a shared core detail-model instead of owning the thick implementation locally', () => {
    const suiteShim = readRepoFile(
      'apps/ext-shopping-suite/src/suite-control-plane-model.ts'
    );
    const suiteControlPlaneShim = readRepoFile(
      'apps/ext-shopping-suite/src/suite-control-plane.ts'
    );
    const suiteControlPlaneUi = readRepoFile(
      'packages/ui/src/suite-control-plane.ts'
    );
    const suiteAlphaPage = readRepoFile(
      'apps/ext-shopping-suite/src/suite-alpha-page.tsx'
    );
    const sharedModel = readRepoFile(
      'packages/core/src/suite-detail-model.ts'
    );

    expect(
      existsSync(
        resolveFromRepo('apps/ext-shopping-suite/src/suite-control-plane-model.ts')
      )
    ).toBe(true);
    expect(suiteShim).toContain("from '@shopflow/core';");
    expect(suiteShim).not.toContain('operatorDecisionBriefSchema');
    expect(suiteShim).not.toContain('getLiveReceiptAppRequirements');
    expect(suiteControlPlaneShim).toContain("from '@shopflow/ui';");
    expect(suiteControlPlaneUi).toContain('@shopflow/core');
    expect(suiteControlPlaneUi).toContain('loadSuiteDetailMap');
    expect(suiteAlphaPage).toContain('@shopflow/core');
    expect(sharedModel).toContain('export function createSuiteDetailModel');
    expect(sharedModel).toContain('export async function loadSuiteDetailMap');
    expect(sharedModel).toContain('export function compareSuiteDetailPriority');
    expect(sharedModel).toContain('export function getSuiteCockpitAction');
  });
});
