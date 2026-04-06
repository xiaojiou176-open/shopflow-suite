import { defineContentScript } from 'wxt/utils/define-content-script';
import {
  captureLatestReadyOutput,
  reportSiteDetection,
} from '@shopflow/runtime';
import { targetAdapter } from '@shopflow/store-target';
import { appDefinition } from '../src/app-definition';

export default defineContentScript({
  matches: appDefinition.hostMatches,
  runAt: 'document_idle',
  async main() {
    const detection = targetAdapter.detect(new URL(window.location.href), document);

    await reportSiteDetection({
      appId: appDefinition.appId,
      url: window.location.href,
      detection,
    });

    document.documentElement.dataset.shopflowTargetState = detection.pageKind;

    await captureLatestReadyOutput({
      appId: appDefinition.appId,
      storeId: targetAdapter.storeId,
      pageUrl: window.location.href,
      detection,
      document,
      extractProduct: targetAdapter.extractProduct,
      extractSearchResults: targetAdapter.extractSearchResults,
      extractDeals: targetAdapter.extractDeals,
    });
  },
});
