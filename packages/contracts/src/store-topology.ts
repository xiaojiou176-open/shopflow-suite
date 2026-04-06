import { storeCatalog } from './store-catalog';
import type { StoreId } from './detection-result';

export type StoreTopologyEntry = {
  appId: (typeof storeCatalog)[StoreId]['appId'];
  storeId: StoreId;
  appDir: string;
  storePackageDir: string;
  storePackageImportName: string;
  storePackageEntryPath: string;
  contractTestPath: string;
  e2eSmokePath: string;
  fixtureDirectories: string[];
};

const fixtureDirectoriesByStoreId: Record<StoreId, string[]> = {
  albertsons: [
    'tests/fixtures/albertsons/product',
    'tests/fixtures/albertsons/search',
    'tests/fixtures/albertsons/deal',
    'tests/fixtures/albertsons/action',
    'tests/fixtures/albertsons/manage',
  ],
  kroger: [
    'tests/fixtures/kroger/product',
    'tests/fixtures/kroger/search',
    'tests/fixtures/kroger/deal',
  ],
  amazon: ['tests/fixtures/amazon/product', 'tests/fixtures/amazon/search'],
  costco: ['tests/fixtures/costco/product', 'tests/fixtures/costco/search'],
  walmart: ['tests/fixtures/walmart/product', 'tests/fixtures/walmart/search'],
  weee: ['tests/fixtures/weee/product', 'tests/fixtures/weee/search'],
  target: [
    'tests/fixtures/target/product',
    'tests/fixtures/target/search',
    'tests/fixtures/target/deal',
  ],
  temu: [
    'tests/fixtures/temu/product',
    'tests/fixtures/temu/search',
    'tests/fixtures/temu/action',
  ],
};

export const storeTopology: StoreTopologyEntry[] = Object.values(storeCatalog).map(
  (entry) => ({
    appId: entry.appId,
    storeId: entry.storeId,
    appDir: `apps/${entry.appId}`,
    storePackageDir: `packages/store-${entry.storeId}`,
    storePackageImportName: `@shopflow/store-${entry.storeId}`,
    storePackageEntryPath: `packages/store-${entry.storeId}/src/index.ts`,
    contractTestPath: `tests/contract/store-${entry.storeId}.contract.test.ts`,
    e2eSmokePath: `tests/e2e/${entry.appId}.smoke.spec.ts`,
    fixtureDirectories: fixtureDirectoriesByStoreId[entry.storeId],
  })
);

export const storeTopologyByStoreId = Object.fromEntries(
  storeTopology.map((entry) => [entry.storeId, entry])
) as Record<StoreId, StoreTopologyEntry>;
