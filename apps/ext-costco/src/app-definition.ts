import { costcoHostPatterns } from '@shopflow/store-costco';

export const appDefinition = {
  appId: 'ext-costco',
  storeId: 'costco',
  siteName: 'Costco',
  title: 'Shopflow for Costco',
  summary: 'Wave 2 storefront shell focused on product and search workflows.',
  hostMatches: costcoHostPatterns,
} as const;
