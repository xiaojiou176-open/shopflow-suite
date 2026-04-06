import { defineContentScript } from 'wxt/utils/define-content-script';
import {
  captureLatestReadyOutput,
  reportSiteDetection,
} from '@shopflow/runtime';
import { walmartAdapter } from '@shopflow/store-walmart';
import { appDefinition } from '../src/app-definition';

export default defineContentScript({
  matches: appDefinition.hostMatches,
  runAt: 'document_idle',
  async main() {
    const detection = walmartAdapter.detect(new URL(window.location.href), document);

    await reportSiteDetection({
      appId: appDefinition.appId,
      url: window.location.href,
      detection,
    });

    document.documentElement.dataset.shopflowWalmartState = detection.pageKind;

    await captureLatestReadyOutput({
      appId: appDefinition.appId,
      storeId: walmartAdapter.storeId,
      pageUrl: window.location.href,
      detection,
      document,
      extractProduct: walmartAdapter.extractProduct,
      extractSearchResults: walmartAdapter.extractSearchResults,
      extractDeals: walmartAdapter.extractDeals,
    });
  },
});
