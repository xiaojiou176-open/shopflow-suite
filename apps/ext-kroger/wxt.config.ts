import { createAppConfig } from '../../tooling/wxt/create-app-config';

export default createAppConfig({
  name: 'Shopflow for Kroger Family',
  description:
    'Currently verified on Fred Meyer + QFC. Wave 3 family shell for product, search, and deals discovery.',
  hostPermissions: ['*://www.fredmeyer.com/*', '*://www.qfc.com/*'],
});
