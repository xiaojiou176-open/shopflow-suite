import browser from 'webextension-polyfill';
import { defineBackground } from 'wxt/utils/define-background';
import { SidePanelController } from '@shopflow/runtime';

const controller = new SidePanelController();

export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id != null) {
      await controller.openForTab(tab.id);
    }
  });
});
