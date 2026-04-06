import { defineContentScript } from 'wxt/utils/define-content-script';
import {
  captureLatestReadyOutput,
  reportSiteDetection,
} from '@shopflow/runtime';
import { amazonAdapter } from '@shopflow/store-amazon';
import { appDefinition } from '../src/app-definition';

export default defineContentScript({
  matches: appDefinition.hostMatches,
  runAt: 'document_idle',
  async main() {
    const detection = amazonAdapter.detect(new URL(window.location.href), document);

    await reportSiteDetection({
      appId: appDefinition.appId,
      url: window.location.href,
      detection,
    });

    document.documentElement.dataset.shopflowAmazonState = detection.pageKind;

    await captureLatestReadyOutput({
      appId: appDefinition.appId,
      storeId: amazonAdapter.storeId,
      pageUrl: window.location.href,
      detection,
      document,
      extractProduct: amazonAdapter.extractProduct,
      extractSearchResults: amazonAdapter.extractSearchResults,
      extractDeals: amazonAdapter.extractDeals,
    });
  },
});
