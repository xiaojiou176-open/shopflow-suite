import { walmartHostPatterns } from '@shopflow/store-walmart';

export const appDefinition = {
  appId: 'ext-walmart',
  storeId: 'walmart',
  siteName: 'Walmart',
  title: 'Shopflow for Walmart',
  summary: 'Wave 2 storefront shell focused on product and search workflows.',
  hostMatches: walmartHostPatterns,
} as const;
