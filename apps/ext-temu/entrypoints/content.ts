import { defineContentScript } from 'wxt/utils/define-content-script';
import {
  captureLatestReadyOutput,
  reportSiteDetection,
} from '@shopflow/runtime';
import { temuAdapter } from '@shopflow/store-temu';
import { appDefinition } from '../src/app-definition';

export default defineContentScript({
  matches: appDefinition.hostMatches,
  runAt: 'document_idle',
  async main() {
    const detection = temuAdapter.detect(new URL(window.location.href), document);

    await reportSiteDetection({
      appId: appDefinition.appId,
      url: window.location.href,
      detection,
    });

    document.documentElement.dataset.shopflowTemuState = detection.pageKind;

    await captureLatestReadyOutput({
      appId: appDefinition.appId,
      storeId: temuAdapter.storeId,
      pageUrl: window.location.href,
      detection,
      document,
      extractProduct: temuAdapter.extractProduct,
      extractSearchResults: temuAdapter.extractSearchResults,
      extractDeals: temuAdapter.extractDeals,
    });
  },
});
