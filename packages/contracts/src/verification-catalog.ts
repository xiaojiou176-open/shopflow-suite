import { requiresVerifiedScopeClause } from './public-claim-boundary';
import {
  formatStoreWave,
  publicClaimBoundaries,
  storeCatalog,
  type StoreAppId,
} from './store-catalog';
import { getLiveReceiptCapturePlans } from './live-receipt-capture-plan';
import { storeTopologyByStoreId } from './store-topology';
import type { StoreId } from './detection-result';

export const releaseChannelValues = [
  'storefront-shell-candidate',
  'capability-heavy-candidate',
  'internal-alpha',
] as const;

export type ReleaseChannel = (typeof releaseChannelValues)[number];

export type StoreVerificationCatalogEntry = {
  appId: StoreAppId;
  storeId: StoreId;
  publicName: string;
  wave: string;
  tier: string;
  claimState: string;
  releaseChannel: ReleaseChannel;
  appDir: string;
  storePackageDir: string;
  contractTestPath: string;
  e2eSmokePath: string;
  fixtureDirectories: string[];
  requiredEvidenceCaptureIds: string[];
  requiresVerifiedScopeCopy: boolean;
};

export type SuiteVerificationCatalogEntry = {
  appId: 'ext-shopping-suite';
  publicName: 'Shopflow Suite';
  wave: 'Wave 3';
  tier: 'capability-heavy-product';
  claimState: 'planned';
  releaseChannel: 'internal-alpha';
  appDir: 'apps/ext-shopping-suite';
  contractTestPath: 'tests/contract/store-suite.contract.test.ts';
  e2eSmokePath: 'tests/e2e/ext-shopping-suite.smoke.spec.ts';
  fixtureDirectories: [];
  requiredEvidenceCaptureIds: [];
  requiresVerifiedScopeCopy: false;
};

export const storeVerificationCatalog: StoreVerificationCatalogEntry[] =
  Object.values(storeCatalog).map((entry) => {
    const boundary = publicClaimBoundaries[entry.storeId];
    const topology = storeTopologyByStoreId[entry.storeId];

    return {
      appId: entry.appId,
      storeId: entry.storeId,
      publicName: boundary.publicName,
      wave: formatStoreWave(entry.wave),
      tier: entry.tier,
      claimState: boundary.claimState,
      releaseChannel:
        entry.tier === 'capability-heavy-product'
          ? 'capability-heavy-candidate'
          : 'storefront-shell-candidate',
      appDir: topology.appDir,
      storePackageDir: topology.storePackageDir,
      contractTestPath: topology.contractTestPath,
      e2eSmokePath: topology.e2eSmokePath,
      fixtureDirectories: topology.fixtureDirectories,
      requiredEvidenceCaptureIds: getLiveReceiptCapturePlans(entry.appId).map(
        (plan) => plan.captureId
      ),
      requiresVerifiedScopeCopy: requiresVerifiedScopeClause(entry.storeId),
    };
  });

export const suiteVerificationCatalogEntry: SuiteVerificationCatalogEntry = {
  appId: 'ext-shopping-suite',
  publicName: 'Shopflow Suite',
  wave: 'Wave 3',
  tier: 'capability-heavy-product',
  claimState: 'planned',
  releaseChannel: 'internal-alpha',
  appDir: 'apps/ext-shopping-suite',
  contractTestPath: 'tests/contract/store-suite.contract.test.ts',
  e2eSmokePath: 'tests/e2e/ext-shopping-suite.smoke.spec.ts',
  fixtureDirectories: [],
  requiredEvidenceCaptureIds: [],
  requiresVerifiedScopeCopy: false,
};

export const allVerificationCatalogEntries = [
  ...storeVerificationCatalog,
  suiteVerificationCatalogEntry,
] as const;
