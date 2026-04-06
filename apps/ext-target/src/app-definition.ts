import { targetHostPatterns } from '@shopflow/store-target';

export const appDefinition = {
  appId: 'ext-target',
  storeId: 'target',
  siteName: 'Target',
  title: 'Shopflow for Target',
  summary: 'Wave 1 shell with product, search, and differentiated deals paths.',
  hostMatches: targetHostPatterns,
} as const;
