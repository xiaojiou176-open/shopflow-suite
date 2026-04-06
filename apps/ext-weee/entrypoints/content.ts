import { defineContentScript } from 'wxt/utils/define-content-script';
import {
  captureLatestReadyOutput,
  reportSiteDetection,
} from '@shopflow/runtime';
import { weeeAdapter } from '@shopflow/store-weee';
import { appDefinition } from '../src/app-definition';

export default defineContentScript({
  matches: Array.from(appDefinition.hostMatches),
  runAt: 'document_idle',
  async main() {
    const detection = weeeAdapter.detect(new URL(window.location.href), document);

    await reportSiteDetection({
      appId: appDefinition.appId,
      url: window.location.href,
      detection,
    });

    document.documentElement.dataset.shopflowWeeeState = detection.pageKind;

    await captureLatestReadyOutput({
      appId: appDefinition.appId,
      storeId: weeeAdapter.storeId,
      pageUrl: window.location.href,
      detection,
      document,
      extractProduct: weeeAdapter.extractProduct,
      extractSearchResults: weeeAdapter.extractSearchResults,
      extractDeals: weeeAdapter.extractDeals,
    });
  },
});
