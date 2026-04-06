import { amazonHostPatterns } from '@shopflow/store-amazon';

export const appDefinition = {
  appId: 'ext-amazon',
  storeId: 'amazon',
  siteName: 'Amazon',
  title: 'Shopflow for Amazon',
  summary: 'Wave 1 storefront shell focused on product and search workflows.',
  hostMatches: amazonHostPatterns,
} as const;
