import { defineContentScript } from 'wxt/utils/define-content-script';
import {
  captureLatestReadyOutput,
  reportSiteDetection,
} from '@shopflow/runtime';
import { albertsonsStoreAdapter } from '@shopflow/store-albertsons';
import { appDefinition } from '../src/app-definition';

export default defineContentScript({
  matches: [...appDefinition.hostMatches],
  runAt: 'document_idle',
  async main() {
    const currentUrl = new URL(window.location.href);

    if (!albertsonsStoreAdapter.matches(currentUrl)) {
      return;
    }

    const detection = albertsonsStoreAdapter.detect(currentUrl, document);

    await reportSiteDetection({
      appId: appDefinition.appId,
      url: window.location.href,
      detection,
    });

    document.documentElement.dataset.shopflowAlbertsonsState =
      detection.pageKind;

    await captureLatestReadyOutput({
      appId: appDefinition.appId,
      storeId: albertsonsStoreAdapter.storeId,
      pageUrl: window.location.href,
      detection,
      document,
      extractProduct: albertsonsStoreAdapter.extractProduct,
      extractSearchResults: albertsonsStoreAdapter.extractSearchResults,
      extractDeals: albertsonsStoreAdapter.extractDeals,
    });
  },
});
