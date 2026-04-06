import { z } from 'zod';
import { requiresVerifiedScopeClause } from './public-claim-boundary';
import type { PublicClaimBoundary } from './public-claim-boundary';
import type { StoreId, VerifiedScope } from './detection-result';

export const storeAppIdValues = [
  'ext-albertsons',
  'ext-kroger',
  'ext-amazon',
  'ext-costco',
  'ext-walmart',
  'ext-weee',
  'ext-target',
  'ext-temu',
] as const;

export const storeWaveValues = ['wave-1', 'wave-2', 'wave-3'] as const;
export const storeTierValues = [
  'storefront-shell',
  'capability-heavy-product',
] as const;

export type StoreAppId = (typeof storeAppIdValues)[number];
export type StoreWave = (typeof storeWaveValues)[number];
export type StoreTier = (typeof storeTierValues)[number];

const verifiedScopeCopyByStoreId: Partial<Record<StoreId, string>> = {
  albertsons: 'Currently verified on Safeway.',
  kroger: 'Currently verified on Fred Meyer + QFC.',
};

export type StoreCatalogEntry = {
  appId: StoreAppId;
  storeId: StoreId;
  publicName: string;
  verifiedScopes: VerifiedScope[];
  hostPatterns: string[];
  defaultHosts: string[];
  wave: StoreWave;
  tier: StoreTier;
};

export const storeCatalogEntrySchema = z.object({
  appId: z.enum(storeAppIdValues),
  storeId: z.string(),
  publicName: z.string(),
  verifiedScopes: z.array(z.string()),
  hostPatterns: z.array(z.string()),
  defaultHosts: z.array(z.string()),
  wave: z.enum(storeWaveValues),
  tier: z.enum(storeTierValues),
});

export const storeCatalog: Record<StoreId, StoreCatalogEntry> = {
  albertsons: {
    appId: 'ext-albertsons',
    storeId: 'albertsons',
    publicName: 'Shopflow for Albertsons Family',
    verifiedScopes: ['safeway'],
    hostPatterns: ['*://*.safeway.com/*', '*://*.vons.com/shop/search-results*'],
    defaultHosts: ['www.safeway.com'],
    wave: 'wave-1',
    tier: 'capability-heavy-product',
  },
  kroger: {
    appId: 'ext-kroger',
    storeId: 'kroger',
    publicName: 'Shopflow for Kroger Family',
    verifiedScopes: ['fred-meyer', 'qfc'],
    hostPatterns: ['*://*.fredmeyer.com/*', '*://*.qfc.com/*'],
    defaultHosts: ['www.fredmeyer.com', 'www.qfc.com'],
    wave: 'wave-3',
    tier: 'capability-heavy-product',
  },
  amazon: {
    appId: 'ext-amazon',
    storeId: 'amazon',
    publicName: 'Shopflow for Amazon',
    verifiedScopes: ['amazon'],
    hostPatterns: ['*://www.amazon.com/*'],
    defaultHosts: ['www.amazon.com'],
    wave: 'wave-1',
    tier: 'storefront-shell',
  },
  costco: {
    appId: 'ext-costco',
    storeId: 'costco',
    publicName: 'Shopflow for Costco',
    verifiedScopes: ['costco'],
    hostPatterns: ['*://www.costco.com/*'],
    defaultHosts: ['www.costco.com'],
    wave: 'wave-2',
    tier: 'storefront-shell',
  },
  walmart: {
    appId: 'ext-walmart',
    storeId: 'walmart',
    publicName: 'Shopflow for Walmart',
    verifiedScopes: ['walmart'],
    hostPatterns: ['*://www.walmart.com/*'],
    defaultHosts: ['www.walmart.com'],
    wave: 'wave-2',
    tier: 'storefront-shell',
  },
  weee: {
    appId: 'ext-weee',
    storeId: 'weee',
    publicName: 'Shopflow for Weee',
    verifiedScopes: ['weee'],
    hostPatterns: ['*://www.sayweee.com/*'],
    defaultHosts: ['www.sayweee.com'],
    wave: 'wave-3',
    tier: 'storefront-shell',
  },
  target: {
    appId: 'ext-target',
    storeId: 'target',
    publicName: 'Shopflow for Target',
    verifiedScopes: ['target'],
    hostPatterns: ['*://www.target.com/*'],
    defaultHosts: ['www.target.com'],
    wave: 'wave-1',
    tier: 'storefront-shell',
  },
  temu: {
    appId: 'ext-temu',
    storeId: 'temu',
    publicName: 'Shopflow for Temu',
    verifiedScopes: ['temu'],
    hostPatterns: ['*://www.temu.com/*'],
    defaultHosts: ['www.temu.com'],
    wave: 'wave-2',
    tier: 'storefront-shell',
  },
};

export function formatStoreWave(wave: StoreWave) {
  return wave.replace('wave-', 'Wave ');
}

export function findStoreCatalogEntryByAppId(
  appId: string,
  catalogMap: Record<StoreId, StoreCatalogEntry> = storeCatalog
) {
  return Object.values(catalogMap).find((entry) => entry.appId === appId);
}

export function normalizeStoreHostPattern(pattern: string) {
  const withoutScheme = pattern.replace(/^[^:]+:\/\//, '');
  return withoutScheme.split('/')[0] ?? withoutScheme;
}

function normalizeStorePathPattern(pattern: string) {
  const withoutScheme = pattern.replace(/^[^:]+:\/\//, '');
  const slashIndex = withoutScheme.indexOf('/');

  if (slashIndex === -1) {
    return '/*';
  }

  return withoutScheme.slice(slashIndex) || '/*';
}

function escapeRegExp(value: string) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function storePathPatternCoversPattern(
  containerPattern: string,
  candidatePattern: string
) {
  if (
    containerPattern === candidatePattern ||
    containerPattern === '*' ||
    containerPattern === '/*'
  ) {
    return true;
  }

  if (!candidatePattern.includes('*')) {
    const regex = new RegExp(
      `^${escapeRegExp(containerPattern).replace(/\\\*/g, '.*')}$`
    );
    return regex.test(candidatePattern);
  }

  if (containerPattern.endsWith('*')) {
    return candidatePattern.startsWith(containerPattern.slice(0, -1));
  }

  return false;
}

export function storeHostPatternMatchesHost(pattern: string, host: string) {
  const normalizedPattern = normalizeStoreHostPattern(pattern);

  if (normalizedPattern.startsWith('*.')) {
    const hostSuffix = normalizedPattern.slice(2);
    return host === hostSuffix || host.endsWith(`.${hostSuffix}`);
  }

  return host === normalizedPattern;
}

export function storeHostPatternCoversPattern(
  containerPattern: string,
  candidatePattern: string
) {
  const normalizedContainer = normalizeStoreHostPattern(containerPattern);
  const normalizedCandidate = normalizeStoreHostPattern(candidatePattern);

  if (normalizedContainer.startsWith('*.')) {
    const hostSuffix = normalizedContainer.slice(2);
    const hostCovered =
      normalizedCandidate === hostSuffix ||
      normalizedCandidate.endsWith(`.${hostSuffix}`);

    if (!hostCovered) {
      return false;
    }
  } else if (normalizedContainer !== normalizedCandidate) {
    return false;
  }

  return storePathPatternCoversPattern(
    normalizeStorePathPattern(containerPattern),
    normalizeStorePathPattern(candidatePattern)
  );
}

export function getStoreReviewStartHost(
  storeId: StoreId,
  catalogMap: Record<StoreId, StoreCatalogEntry> = storeCatalog
) {
  return catalogMap[storeId]?.defaultHosts[0];
}

export function getStoreReviewStartUrl(
  storeId: StoreId,
  catalogMap: Record<StoreId, StoreCatalogEntry> = storeCatalog
) {
  const defaultReviewHost = getStoreReviewStartHost(storeId, catalogMap);
  return defaultReviewHost ? `https://${defaultReviewHost}` : undefined;
}

export const publicClaimBoundaries: Record<StoreId, PublicClaimBoundary> =
  Object.fromEntries(
    Object.values(storeCatalog).map((entry) => {
      const verifiedScopeCopy = verifiedScopeCopyByStoreId[entry.storeId];

      return [
        entry.storeId,
        {
          storeId: entry.storeId,
          publicName: entry.publicName,
          verifiedScopes: entry.verifiedScopes,
          claimState: 'repo-verified',
          ...(requiresVerifiedScopeClause(entry.storeId) && verifiedScopeCopy
            ? { verifiedScopeCopy }
            : {}),
        },
      ];
    })
  ) as Record<StoreId, PublicClaimBoundary>;
