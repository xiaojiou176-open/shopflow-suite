import { createLocaleRouteHref, type UiLocale } from '@shopflow/core';
import { SidePanelController } from '@shopflow/runtime';
import browser from 'webextension-polyfill';

export function createLocalizedExtensionPath(
  fileName: 'sidepanel.html' | 'popup.html',
  locale: UiLocale,
  hash?: string
) {
  return createLocaleRouteHref(`${fileName}${hash ? `#${hash}` : ''}`, locale);
}

export function createLocalizedExtensionHref(
  fileName: 'sidepanel.html' | 'popup.html',
  locale: UiLocale,
  hash?: string
) {
  return browser.runtime.getURL(createLocalizedExtensionPath(fileName, locale, hash));
}

export function createOpenSidePanelRouteAction(path: string) {
  return async () => {
    const [activeTab] = await browser.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });

    if (!activeTab?.id) {
      throw new Error(
        `Unable to open the Shopflow side panel because no active tab was found for path ${path}.`
      );
    }

    const controller = new SidePanelController(path);
    await controller.openForTab(activeTab.id);

    if (typeof window !== 'undefined') {
      window.close();
    }
  };
}
