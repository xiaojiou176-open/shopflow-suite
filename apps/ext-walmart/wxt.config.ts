import { createAppConfig } from '../../tooling/wxt/create-app-config';

export default createAppConfig({
  name: 'Shopflow for Walmart',
  description:
    'Wave 2 storefront shell for Walmart product and search extraction.',
  hostPermissions: ['*://www.walmart.com/*'],
});
