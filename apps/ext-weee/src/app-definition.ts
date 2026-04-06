import { weeeHostPatterns } from '@shopflow/store-weee';

export const appDefinition = {
  appId: 'ext-weee',
  storeId: 'weee',
  siteName: 'Weee',
  title: 'Shopflow for Weee',
  summary: 'Wave 3 storefront shell focused on product and search workflows.',
  hostMatches: [...weeeHostPatterns],
} as const;
