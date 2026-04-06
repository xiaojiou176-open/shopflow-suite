import { defineContentScript } from 'wxt/utils/define-content-script';
import {
  captureLatestReadyOutput,
  reportSiteDetection,
} from '@shopflow/runtime';
import { costcoAdapter } from '@shopflow/store-costco';
import { appDefinition } from '../src/app-definition';

export default defineContentScript({
  matches: appDefinition.hostMatches,
  runAt: 'document_idle',
  async main() {
    const detection = costcoAdapter.detect(new URL(window.location.href), document);

    await reportSiteDetection({
      appId: appDefinition.appId,
      url: window.location.href,
      detection,
    });

    document.documentElement.dataset.shopflowCostcoState = detection.pageKind;

    await captureLatestReadyOutput({
      appId: appDefinition.appId,
      storeId: costcoAdapter.storeId,
      pageUrl: window.location.href,
      detection,
      document,
      extractProduct: costcoAdapter.extractProduct,
      extractSearchResults: costcoAdapter.extractSearchResults,
      extractDeals: costcoAdapter.extractDeals,
    });
  },
});
