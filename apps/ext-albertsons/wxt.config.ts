import { createAppConfig } from '../../tooling/wxt/create-app-config';

export default createAppConfig({
  name: 'Shopflow for Albertsons Family',
  description:
    'Currently verified on Safeway. Side panel shopping copilot for product, search, deal, and Schedule & Save surfaces.',
  hostPermissions: ['*://*.safeway.com/*'],
});
