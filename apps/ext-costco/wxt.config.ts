import { createAppConfig } from '../../tooling/wxt/create-app-config';

export default createAppConfig({
  name: 'Shopflow for Costco',
  description:
    'Wave 2 storefront shell for Costco product and search extraction.',
  hostPermissions: ['*://www.costco.com/*'],
});
