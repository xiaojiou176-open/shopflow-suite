import { createAppConfig } from '../../tooling/wxt/create-app-config';

export default createAppConfig({
  name: 'Shopflow for Target',
  description:
    'Wave 1 storefront shell for Target product, search, and differentiated deals workflows.',
  hostPermissions: ['*://www.target.com/*'],
});
