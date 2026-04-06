import { createAppConfig } from '../../tooling/wxt/create-app-config';

export default createAppConfig({
  name: 'Shopflow for Weee',
  description:
    'Wave 3 storefront shell for Weee product and search extraction.',
  hostPermissions: ['*://www.sayweee.com/*'],
});
