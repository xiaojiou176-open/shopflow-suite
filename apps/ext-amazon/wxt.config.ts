import { createAppConfig } from '../../tooling/wxt/create-app-config';

export default createAppConfig({
  name: 'Shopflow for Amazon',
  description:
    'Wave 1 storefront shell for Amazon product and search extraction.',
  hostPermissions: ['*://www.amazon.com/*'],
});
