import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getStoreReviewStartUrl,
  getLiveReceiptCapturePlans,
  publicClaimBoundaries,
  storeCatalog,
  storeHostPatternCoversPattern,
  storeHostPatternMatchesHost,
} from '@shopflow/contracts';
import { appDefinition as albertsonsApp } from '../../apps/ext-albertsons/src/app-definition';
import { appDefinition as amazonApp } from '../../apps/ext-amazon/src/app-definition';
import { appDefinition as costcoApp } from '../../apps/ext-costco/src/app-definition';
import { appDefinition as krogerApp } from '../../apps/ext-kroger/src/app-definition';
import { appDefinition as targetApp } from '../../apps/ext-target/src/app-definition';
import { appDefinition as temuApp } from '../../apps/ext-temu/src/app-definition';
import { appDefinition as walmartApp } from '../../apps/ext-walmart/src/app-definition';
import { appDefinition as weeeApp } from '../../apps/ext-weee/src/app-definition';
import { repoRoot } from '../support/repo-paths';

function repoPath(relativePath: string) {
  return resolve(repoRoot, relativePath);
}

const appDefinitions: Record<
  string,
  {
    hostMatches: readonly string[];
    summary: string;
    verifiedScopeCopy?: string;
    requiredEvidence?: readonly { captureId: string }[];
  }
> = {
  'ext-albertsons': albertsonsApp,
  'ext-amazon': amazonApp,
  'ext-costco': costcoApp,
  'ext-kroger': krogerApp,
  'ext-target': targetApp,
  'ext-temu': temuApp,
  'ext-walmart': walmartApp,
  'ext-weee': weeeApp,
};

describe('store catalog parity guard', () => {
  it('keeps every catalog entry wired to app packaging, adapter package, contract test, and smoke spec', () => {
    for (const entry of Object.values(storeCatalog)) {
      expect(existsSync(repoPath(`apps/${entry.appId}/package.json`))).toBe(true);
      expect(
        existsSync(repoPath(`apps/${entry.appId}/src/app-definition.ts`))
      ).toBe(true);
      expect(
        existsSync(repoPath(`packages/store-${entry.storeId}/src/index.ts`))
      ).toBe(true);
      expect(
        existsSync(
          repoPath(`tests/contract/store-${entry.storeId}.contract.test.ts`)
        )
      ).toBe(true);
      expect(
        existsSync(repoPath(`tests/e2e/${entry.appId}.smoke.spec.ts`))
      ).toBe(true);
    }
  });

  it('forces live receipt requirements for family-scope and differentiated claim surfaces', () => {
    const albertsonsPlans = getLiveReceiptCapturePlans('ext-albertsons');
    const krogerPlans = getLiveReceiptCapturePlans('ext-kroger');
    const temuPlans = getLiveReceiptCapturePlans('ext-temu');

    expect(albertsonsPlans).toHaveLength(2);
    expect(krogerPlans.map((plan) => plan.verifiedScope).sort()).toEqual(
      [...publicClaimBoundaries.kroger.verifiedScopes].sort()
    );
    expect(temuPlans).toHaveLength(1);
    expect(getLiveReceiptCapturePlans('ext-amazon')).toHaveLength(0);
  });

  it('keeps reviewer start hosts, host matches, and verified-scope copy aligned with app definitions', () => {
    for (const entry of Object.values(storeCatalog)) {
      const appDefinition = appDefinitions[entry.appId];
      const boundary = publicClaimBoundaries[entry.storeId];

      expect(
        appDefinition.hostMatches.every((pattern) =>
          entry.hostPatterns.some((catalogPattern) =>
            storeHostPatternCoversPattern(catalogPattern, pattern)
          )
        )
      ).toBe(true);
      expect(getStoreReviewStartUrl(entry.storeId)).toBeDefined();
      expect(
        appDefinition.hostMatches.some((pattern) =>
          storeHostPatternMatchesHost(pattern, entry.defaultHosts[0]!)
        )
      ).toBe(true);

      if (boundary.verifiedScopeCopy) {
        expect(appDefinition.verifiedScopeCopy).toBe(boundary.verifiedScopeCopy);
        expect(appDefinition.summary).toContain(boundary.verifiedScopeCopy);
      }

      const requiredEvidenceCaptureIds = getLiveReceiptCapturePlans(
        entry.appId
      ).map((plan) => plan.captureId);
      expect(
        appDefinition.requiredEvidence?.map((requirement) => requirement.captureId) ??
          []
      ).toEqual(requiredEvidenceCaptureIds);
    }
  });

  it('keeps suite verification surfaces materialized alongside the store catalog', () => {
    expect(
      existsSync(repoPath('apps/ext-shopping-suite/src/app-definition.ts'))
    ).toBe(true);
    expect(
      existsSync(repoPath('tests/contract/store-suite.contract.test.ts'))
    ).toBe(true);
    expect(
      existsSync(repoPath('tests/e2e/ext-shopping-suite.smoke.spec.ts'))
    ).toBe(true);
  });
});
