import { createAppConfig } from '../../tooling/wxt/create-app-config';

export default createAppConfig({
  name: 'Shopflow for Temu',
  description:
    'Wave 2 shell for Temu product/search plus fixture-backed warehouse filtering surfaces.',
  hostPermissions: ['*://www.temu.com/*'],
});
