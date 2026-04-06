import type {
  DealItem,
  DetectionResult,
  NormalizedProduct,
  SearchResultItem,
  StoreId,
} from '@shopflow/contracts';
import { reportCapturedOutput } from '../messaging/message-bus';
import type { LatestOutputRecord } from '../storage/latest-output-repository';

type CaptureReadyOutputArgs = {
  appId: string;
  storeId: StoreId;
  pageUrl: string;
  detection: DetectionResult;
  document: Document;
  now?: () => string;
  extractProduct?: (document: Document) => Promise<NormalizedProduct>;
  extractSearchResults?: (document: Document) => Promise<SearchResultItem[]>;
  extractDeals?: (document: Document) => Promise<DealItem[]>;
};

export async function captureLatestReadyOutput({
  appId,
  storeId,
  pageUrl,
  detection,
  document,
  now = () => new Date().toISOString(),
  extractProduct,
  extractSearchResults,
  extractDeals,
}: CaptureReadyOutputArgs) {
  const record =
    (await captureProduct({
      appId,
      storeId,
      pageUrl,
      detection,
      document,
      capturedAt: now(),
      extractProduct,
    })) ??
    (await captureSearch({
      appId,
      storeId,
      pageUrl,
      detection,
      document,
      capturedAt: now(),
      extractSearchResults,
    })) ??
    (await captureDeals({
      appId,
      storeId,
      pageUrl,
      detection,
      document,
      capturedAt: now(),
      extractDeals,
    }));

  if (!record) {
    return undefined;
  }

  await reportCapturedOutput(record);
  return record;
}

async function captureProduct({
  appId,
  storeId,
  pageUrl,
  detection,
  document,
  capturedAt,
  extractProduct,
}: {
  appId: string;
  storeId: StoreId;
  pageUrl: string;
  detection: DetectionResult;
  document: Document;
  capturedAt: string;
  extractProduct?: (document: Document) => Promise<NormalizedProduct>;
}): Promise<LatestOutputRecord | undefined> {
  if (
    detection.pageKind !== 'product' ||
    !hasReadyCapability(detection, 'extract_product') ||
    !extractProduct
  ) {
    return undefined;
  }

  const product = await extractProduct(document);

  return {
    appId,
    storeId,
    kind: 'product',
    pageUrl: product.sourceUrl || pageUrl,
    capturedAt,
    headline: product.title,
    summary: product.price
      ? `Captured product details with price ${product.price.displayText}.`
      : 'Captured product details from the current page.',
    summaryDescriptor: product.price
      ? {
          variant: 'product-with-price',
          priceDisplayText: product.price.displayText,
        }
      : {
          variant: 'product',
        },
    previewLines: [
      ...(product.price ? [`Price: ${product.price.displayText}`] : []),
      ...(product.availabilityLabel
        ? [`Availability: ${product.availabilityLabel}`]
        : []),
      ...(product.sku ? [`SKU: ${product.sku}`] : []),
    ],
    detailEntries: [
      ...(product.price
        ? [{ kind: 'price' as const, value: product.price.displayText }]
        : []),
      ...(product.availabilityLabel
        ? [{ kind: 'availability' as const, value: product.availabilityLabel }]
        : []),
      ...(product.sku ? [{ kind: 'sku' as const, value: product.sku }] : []),
    ],
  };
}

async function captureSearch({
  appId,
  storeId,
  pageUrl,
  detection,
  document,
  capturedAt,
  extractSearchResults,
}: {
  appId: string;
  storeId: StoreId;
  pageUrl: string;
  detection: DetectionResult;
  document: Document;
  capturedAt: string;
  extractSearchResults?: (document: Document) => Promise<SearchResultItem[]>;
}): Promise<LatestOutputRecord | undefined> {
  if (
    detection.pageKind !== 'search' ||
    !hasReadyCapability(detection, 'extract_search') ||
    !extractSearchResults
  ) {
    return undefined;
  }

  const results = await extractSearchResults(document);

  return {
    appId,
    storeId,
    kind: 'search',
    pageUrl,
    capturedAt,
    headline: `Captured ${results.length} search result${
      results.length === 1 ? '' : 's'
    }`,
    summary:
      results[0] != null
        ? `Top result: ${results[0].title}.`
        : 'Captured search results from the current page.',
    summaryDescriptor:
      results[0] != null
        ? {
            variant: 'search-top-result',
            itemCount: results.length,
            leadTitle: results[0].title,
          }
        : {
            variant: 'search',
            itemCount: results.length,
          },
    previewLines: results.slice(0, 3).map((item) => item.title),
    detailEntries: [
      { kind: 'results-count', value: String(results.length) },
      ...(results[0]
        ? [{ kind: 'top-match' as const, value: results[0].title }]
        : []),
    ],
  };
}

async function captureDeals({
  appId,
  storeId,
  pageUrl,
  detection,
  document,
  capturedAt,
  extractDeals,
}: {
  appId: string;
  storeId: StoreId;
  pageUrl: string;
  detection: DetectionResult;
  document: Document;
  capturedAt: string;
  extractDeals?: (document: Document) => Promise<DealItem[]>;
}): Promise<LatestOutputRecord | undefined> {
  if (
    detection.pageKind !== 'deal' ||
    !hasReadyCapability(detection, 'extract_deals') ||
    !extractDeals
  ) {
    return undefined;
  }

  const deals = await extractDeals(document);

  return {
    appId,
    storeId,
    kind: 'deal',
    pageUrl,
    capturedAt,
    headline: `Captured ${deals.length} deal${deals.length === 1 ? '' : 's'}`,
    summary:
      deals[0] != null
        ? `Lead deal: ${deals[0].title}.`
        : 'Captured current deals from the page.',
    summaryDescriptor:
      deals[0] != null
        ? {
            variant: 'deal-lead',
            itemCount: deals.length,
            leadTitle: deals[0].title,
          }
        : {
            variant: 'deal',
            itemCount: deals.length,
          },
    previewLines: deals.slice(0, 3).map((item) => item.title),
    detailEntries: [
      { kind: 'results-count', value: String(deals.length) },
      ...(deals[0]
        ? [{ kind: 'lead-deal' as const, value: deals[0].title }]
        : []),
    ],
  };
}

function hasReadyCapability(
  detection: DetectionResult,
  capability: 'extract_product' | 'extract_search' | 'extract_deals'
) {
  return detection.capabilityStates.some(
    (state) => state.capability === capability && state.status === 'ready'
  );
}
