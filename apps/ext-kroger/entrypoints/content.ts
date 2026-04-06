import { defineContentScript } from 'wxt/utils/define-content-script';
import {
  captureLatestReadyOutput,
  reportSiteDetection,
} from '@shopflow/runtime';
import { krogerAdapter } from '@shopflow/store-kroger';
import { appDefinition } from '../src/app-definition';

export default defineContentScript({
  matches: Array.from(appDefinition.hostMatches),
  runAt: 'document_idle',
  async main() {
    const detection = krogerAdapter.detect(new URL(window.location.href), document);

    await reportSiteDetection({
      appId: appDefinition.appId,
      url: window.location.href,
      detection,
    });

    document.documentElement.dataset.shopflowKrogerState = detection.pageKind;

    await captureLatestReadyOutput({
      appId: appDefinition.appId,
      storeId: krogerAdapter.storeId,
      pageUrl: window.location.href,
      detection,
      document,
      extractProduct: krogerAdapter.extractProduct,
      extractSearchResults: krogerAdapter.extractSearchResults,
      extractDeals: krogerAdapter.extractDeals,
    });
  },
});
