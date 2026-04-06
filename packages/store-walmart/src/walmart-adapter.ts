import {
  capabilityStateSchema,
  detectionResultSchema,
  normalizedProductSchema,
  searchResultItemSchema,
  type CapabilityState,
  type DetectionResult,
  type StoreAdapter,
} from '@shopflow/contracts';

export const walmartHostPatterns = ['*://www.walmart.com/*'];

const productSelectors = {
  title: [
    '[data-shopflow-product-title]',
    '[itemprop="name"]',
    '[data-automation-id="product-title"]',
  ],
  price: ['[data-shopflow-product-price]'],
  image: ['[data-shopflow-product-image]', '[data-testid="media-image"]'],
  sku: ['[data-shopflow-product-sku]'],
} as const;

const searchSelectors = {
  item: ['[data-shopflow-search-item]', '[data-item-id]'],
  title:
    '[data-shopflow-search-title], [data-automation-id="product-title"]',
  price:
    '[data-shopflow-search-price], [data-automation-id="product-price"]',
  url:
    '[data-shopflow-search-url], [data-automation-id="product-title-link"]',
} as const;

export const walmartAdapter: StoreAdapter = {
  storeId: 'walmart',
  verifiedScopes: ['walmart'],
  matches(url) {
    return url.hostname === 'www.walmart.com';
  },
  detect(url, document) {
    const pageKind = detectWalmartPageKind(url, document);

    return detectionResultSchema.parse({
      storeId: 'walmart',
      verifiedScopes: ['walmart'],
      matchedHost: url.hostname,
      pageKind,
      confidence: pageKind === 'unknown' ? 0.45 : 0.92,
      capabilityStates: capabilityStatesFor(pageKind, document),
    });
  },
  async extractProduct(document) {
    const payload = readProductJsonLd(document);

    return normalizedProductSchema.parse({
      sourceStoreId: 'walmart',
      sourceUrl: payload?.sourceUrl ?? readRequiredDocumentUrl(document),
      title: payload?.title ?? readText(document, productSelectors.title),
      imageUrl: payload?.imageUrl ?? readImageUrl(document, productSelectors.image),
      price:
        payload?.price ??
        parseMoney(readText(document, productSelectors.price, true)),
      sku: payload?.sku ?? readText(document, productSelectors.sku, true),
    });
  },
  async extractSearchResults(document) {
    const payloadResults = readWalmartSearchPayloadResults(document);
    if (payloadResults.length > 0) {
      return searchResultItemSchema.array().parse(payloadResults);
    }

    const items = queryAll(document, searchSelectors.item);

    return searchResultItemSchema.array().parse(
      items.map((item, index) => ({
        sourceStoreId: 'walmart',
        sourceUrl: readRequiredAttribute(item, searchSelectors.url, 'href'),
        title: readText(item, [searchSelectors.title]),
        price: parseMoney(readText(item, [searchSelectors.price], true)),
        position: index,
      }))
    );
  },
};

function detectWalmartPageKind(
  url: URL,
  document: Document
): DetectionResult['pageKind'] {
  const fixtureKind =
    document.querySelector<HTMLElement>('[data-page-kind]')?.dataset.pageKind;

  if (fixtureKind === 'product' || fixtureKind === 'search') {
    return fixtureKind;
  }

  const path = url.pathname.toLowerCase();

  if (path.includes('/search')) {
    return 'search';
  }

  if (
    path.includes('/ip/') ||
    path.includes('/product/') ||
    hasAnySelector(document, productSelectors.title)
  ) {
    return 'product';
  }

  if (hasAnySelector(document, searchSelectors.item)) {
    return 'search';
  }

  return 'unknown';
}

function capabilityStatesFor(
  pageKind: DetectionResult['pageKind'],
  document: ParentNode
): CapabilityState[] {
  const productIntegrity = resolveProductIntegrity(document);
  const searchIntegrity = resolveSearchIntegrity(document);
  const extractionReady =
    (pageKind === 'product' && productIntegrity.kind === 'ready') ||
    (pageKind === 'search' && searchIntegrity.kind === 'ready');
  const exportState = resolveExportState(
    pageKind,
    productIntegrity,
    searchIntegrity
  );

  return [
    capabilityState(
      'extract_product',
      pageKind === 'product'
        ? productIntegrity.kind === 'ready'
          ? 'ready'
          : 'degraded'
        : 'unsupported_page',
      pageKind === 'product'
        ? productIntegrity.kind === 'missing_required_fields'
          ? 'PARSE_FAILED'
          : productIntegrity.kind === 'ready'
            ? undefined
            : 'SELECTOR_MISSING'
        : 'UNSUPPORTED_PAGE',
      pageKind === 'product'
        ? productIntegrity.kind === 'ready'
          ? 'Walmart product extraction can reuse page-owned JSON-LD before falling back to storefront PDP selectors.'
          : `Walmart product page was detected, but the current DOM snapshot is missing ${productIntegrity.detail}.`
        : `Walmart product extraction only applies on product pages, not ${describePageKind(pageKind)}.`
    ),
    capabilityState(
      'extract_search',
      pageKind === 'search'
        ? searchIntegrity.kind === 'ready'
          ? 'ready'
          : 'degraded'
        : 'unsupported_page',
      pageKind === 'search'
        ? searchIntegrity.kind === 'missing_required_fields'
          ? 'PARSE_FAILED'
          : searchIntegrity.kind === 'ready'
            ? undefined
            : 'SELECTOR_MISSING'
        : 'UNSUPPORTED_PAGE',
      pageKind === 'search'
        ? searchIntegrity.kind === 'ready'
          ? 'Walmart search extraction can reuse page-owned Next payload item stacks before falling back to storefront DOM cards.'
          : searchIntegrity.kind === 'missing_required_fields'
            ? `Walmart search page was detected, but at least one result row is missing ${searchIntegrity.detail}.`
            : `Walmart search page was detected, but the current DOM snapshot is missing ${searchIntegrity.detail}.`
        : `Walmart search extraction only applies on search pages, not ${describePageKind(pageKind)}.`
    ),
    capabilityState(
      'extract_deals',
      'unsupported_page',
      'UNSUPPORTED_PAGE',
      'Walmart Wave 2 does not claim differentiated deals support.'
    ),
    capabilityState(
      'run_action',
      'unsupported_page',
      'UNSUPPORTED_PAGE',
      'Walmart is currently a storefront shell, not an action-capable release claim.'
    ),
    capabilityState(
      'export_data',
      extractionReady ? 'ready' : exportState.status,
      extractionReady ? undefined : exportState.reasonCode,
      extractionReady
        ? 'Walmart export can ride on extracted product or search payloads.'
        : exportState.reasonMessage
    ),
  ];
}

function capabilityState(
  capability: CapabilityState['capability'],
  status: CapabilityState['status'],
  reasonCode?: CapabilityState['reasonCode'],
  reasonMessage?: string
) {
  return capabilityStateSchema.parse({
    capability,
    status,
    reasonCode,
    reasonMessage,
  });
}

type SurfaceIntegrity =
  | {
      kind: 'ready';
    }
  | {
      kind: 'missing_surface';
      detail: string;
    }
  | {
      kind: 'missing_required_fields';
      detail: string;
    };

function resolveExportState(
  pageKind: DetectionResult['pageKind'],
  productIntegrity: SurfaceIntegrity,
  searchIntegrity: SurfaceIntegrity
) {
  if (pageKind === 'product') {
    return createBlockedExportState('Walmart product', productIntegrity);
  }

  if (pageKind === 'search') {
    return createBlockedExportState('Walmart search', searchIntegrity);
  }

  return {
    status: 'unsupported_page' as const,
    reasonCode: 'UNSUPPORTED_PAGE' as const,
    reasonMessage: `Export only applies on product or search pages, not ${describePageKind(pageKind)}.`,
  };
}

function createBlockedExportState(
  surfaceLabel: string,
  integrity: SurfaceIntegrity
) {
  if (integrity.kind === 'missing_required_fields') {
    return {
      status: 'blocked' as const,
      reasonCode: 'PARSE_FAILED' as const,
      reasonMessage: `${surfaceLabel} export remains blocked because the current DOM snapshot is missing ${integrity.detail}.`,
    };
  }

  if (integrity.kind === 'missing_surface') {
    return {
      status: 'blocked' as const,
      reasonCode: 'SELECTOR_MISSING' as const,
      reasonMessage: `${surfaceLabel} export remains blocked because the current DOM snapshot is missing ${integrity.detail}.`,
    };
  }

  return {
    status: 'blocked' as const,
    reasonCode: 'INTERNAL_ERROR' as const,
    reasonMessage: `${surfaceLabel} export should only be evaluated when extraction readiness is not ready.`,
  };
}

function resolveProductIntegrity(document: ParentNode): SurfaceIntegrity {
  return hasText(document, productSelectors.title) || hasProductJsonLd(document)
    ? { kind: 'ready' }
    : {
        kind: 'missing_surface',
        detail: 'supported product title selectors or product JSON-LD',
      };
}

function resolveSearchIntegrity(document: ParentNode): SurfaceIntegrity {
  const payloadIntegrity = resolveWalmartSearchPayloadIntegrity(document);
  if (payloadIntegrity) {
    return payloadIntegrity;
  }

  return resolveCollectionIntegrity(
    document,
    searchSelectors.item,
    'supported search-result cards',
    [
      {
        detail: 'a result title',
        isSatisfied: (item) => hasText(item, [searchSelectors.title]),
      },
      {
        detail: 'a result URL',
        isSatisfied: (item) => hasAttribute(item, searchSelectors.url, 'href'),
      },
    ]
  );
}

function resolveCollectionIntegrity(
  document: ParentNode,
  itemSelectors: readonly string[],
  missingSurfaceDetail: string,
  requirements: ReadonlyArray<{
    detail: string;
    isSatisfied: (item: Element) => boolean;
  }>
): SurfaceIntegrity {
  const items = queryAll(document, itemSelectors);
  if (items.length === 0) {
    return {
      kind: 'missing_surface',
      detail: missingSurfaceDetail,
    };
  }

  for (const requirement of requirements) {
    if (!items.every((item) => requirement.isSatisfied(item))) {
      return {
        kind: 'missing_required_fields',
        detail: requirement.detail,
      };
    }
  }

  return { kind: 'ready' };
}

type SearchPayloadItem = {
  title?: string;
  sourceUrl?: string;
  imageUrl?: string;
  price?: {
    currency: string;
    amount: number;
    displayText: string;
  };
};

function resolveWalmartSearchPayloadIntegrity(
  document: ParentNode
): SurfaceIntegrity | undefined {
  const payloadItems = readWalmartSearchPayloadCandidates(document);
  if (payloadItems.length === 0) {
    return undefined;
  }

  for (const item of payloadItems) {
    if (!item.title) {
      return {
        kind: 'missing_required_fields',
        detail: 'a payload result title',
      };
    }

    if (!item.sourceUrl) {
      return {
        kind: 'missing_required_fields',
        detail: 'a payload result URL',
      };
    }
  }

  return { kind: 'ready' };
}

function hasAnySelector(
  root: ParentNode,
  selectors: readonly string[] | readonly string[][]
): boolean {
  const flatSelectors = Array.isArray(selectors[0])
    ? (selectors as readonly string[][]).flat()
    : (selectors as readonly string[]);

  return flatSelectors.some((selector) => Boolean(root.querySelector(selector)));
}

function queryAll(root: ParentNode, selectors: readonly string[]): Element[] {
  for (const selector of selectors) {
    const nodes = Array.from(root.querySelectorAll(selector));
    if (nodes.length > 0) {
      return nodes;
    }
  }

  return [];
}

function readText(
  root: ParentNode,
  selectors: readonly string[],
  optional = false
): string | undefined {
  for (const selector of selectors) {
    const value = root.querySelector(selector)?.textContent?.trim();
    if (value) {
      return value;
    }
  }

  if (optional) {
    return undefined;
  }

  throw new Error(`Missing text for selectors: ${selectors.join(', ')}`);
}

function readImageUrl(
  root: ParentNode,
  selectors: readonly string[]
): string | undefined {
  for (const selector of selectors) {
    const value = root.querySelector<HTMLImageElement>(selector)?.src?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function readAttribute(
  root: ParentNode,
  selector: string,
  attribute: string
): string | undefined {
  return (
    root.querySelector(selector)?.getAttribute(attribute)?.trim() ?? undefined
  );
}

function readRequiredAttribute(
  root: ParentNode,
  selector: string,
  attribute: string
): string {
  const value = readAttribute(root, selector, attribute);
  if (value) {
    return value;
  }

  throw new Error(`Missing attribute ${attribute} for selector: ${selector}`);
}

function readRequiredDocumentUrl(document: Document): string {
  const sourceUrl = document.URL?.trim();
  if (!sourceUrl || sourceUrl === 'about:blank') {
    throw new Error('Missing navigated document URL for Walmart extraction');
  }

  return new URL(sourceUrl).toString();
}

function hasText(root: ParentNode, selectors: readonly string[]) {
  return selectors.some((selector) =>
    Boolean(root.querySelector(selector)?.textContent?.trim())
  );
}

function hasAttribute(root: ParentNode, selector: string, attribute: string) {
  return Boolean(root.querySelector(selector)?.getAttribute(attribute)?.trim());
}

function parseMoney(displayText: string | undefined) {
  if (!displayText) {
    return undefined;
  }

  const normalized = displayText.replace(/[^0-9.]/g, '');
  const amount = Number.parseFloat(normalized);

  if (!Number.isFinite(amount)) {
    return undefined;
  }

  return {
    currency: 'USD',
    amount,
    displayText,
  };
}

function readWalmartSearchPayloadResults(root: ParentNode) {
  const payloadItems = readWalmartSearchPayloadCandidates(root);
  const results = payloadItems.flatMap((item, index) => {
    if (!item.title || !item.sourceUrl) {
      return [];
    }

    return [
      {
        sourceStoreId: 'walmart' as const,
        sourceUrl: item.sourceUrl,
        title: item.title,
        imageUrl: item.imageUrl,
        price: item.price,
        position: index,
      },
    ];
  });

  return results;
}

function readWalmartSearchPayloadCandidates(root: ParentNode): SearchPayloadItem[] {
  const nextData = readWalmartNextData(root);
  const stacks = readNestedArray(nextData, [
    'props',
    'pageProps',
    'initialData',
    'searchResult',
    'itemStacks',
  ]);
  const payloadItems: SearchPayloadItem[] = [];

  for (const stack of stacks) {
    if (!stack || typeof stack !== 'object') {
      continue;
    }

    const record = stack as Record<string, unknown>;
    const items = readNestedArray(record, ['items']);
    for (const item of items) {
      const payloadItem = toWalmartSearchPayloadItem(item, resolveDocumentUrl(root));
      if (payloadItem) {
        payloadItems.push(payloadItem);
      }
    }
  }

  return payloadItems;
}

function readWalmartNextData(root: ParentNode): unknown {
  const ownerDocument = root instanceof Document ? root : root.ownerDocument;
  const script = ownerDocument?.querySelector<HTMLScriptElement>(
    'script#__NEXT_DATA__[type="application/json"]'
  );
  if (!script?.textContent?.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(script.textContent) as unknown;
  } catch {
    return undefined;
  }
}

function toWalmartSearchPayloadItem(
  value: unknown,
  documentUrl: string
): SearchPayloadItem | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const title = readStringValue(record.name) ?? readStringValue(record.title);
  const sourceUrl = resolveOwnedWalmartUrl(
    readStringValue(record.canonicalUrl) ??
      readStringValue(record.productUrl) ??
      readNestedString(record, ['canonicalUrl']),
    documentUrl
  );
  const imageUrl = resolvePayloadImageUrl(record.imageInfo, documentUrl);
  const price = readPayloadPrice(record);

  if (!title && !sourceUrl) {
    return undefined;
  }

  return {
    title,
    sourceUrl,
    imageUrl,
    price,
  };
}

function resolvePayloadImageUrl(
  value: unknown,
  documentUrl: string
): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  return resolveJsonLdUrl(
    readStringValue(record.thumbnailUrl) ?? readStringValue(record.url),
    documentUrl
  );
}

function readPayloadPrice(record: Record<string, unknown>) {
  const numericPrice =
    readNumberValue(record.price) ??
    readNestedNumber(record, ['priceInfo', 'price']) ??
    readNestedNumber(record, ['priceInfo', 'currentPrice', 'price']) ??
    readNestedNumber(record, ['priceInfo', 'currentPrice', 'priceString']);

  if (numericPrice != null) {
    return {
      currency: 'USD',
      amount: numericPrice,
      displayText: `$${numericPrice.toFixed(2)}`,
    };
  }

  const displayText =
    readNestedString(record, ['priceInfo', 'linePriceDisplay']) ??
    readNestedString(record, ['priceInfo', 'linePrice']) ??
    readNestedString(record, ['priceInfo', 'currentPrice', 'priceDisplay']);

  return parseMoney(displayText);
}

function describePageKind(pageKind: DetectionResult['pageKind']) {
  return pageKind === 'unknown'
    ? 'unrecognized pages'
    : `${pageKind} pages`;
}

function resolveDocumentUrl(root: ParentNode): string {
  const ownerDocument = root instanceof Document ? root : root.ownerDocument;
  const candidate = ownerDocument?.URL?.trim();
  if (candidate) {
    try {
      if (new URL(candidate).hostname === 'www.walmart.com') {
        return candidate;
      }
    } catch {
      // Fall back to the canonical Walmart search origin below.
    }
  }

  return 'https://www.walmart.com/search';
}

type ProductJsonLdPayload = {
  title?: string;
  sourceUrl?: string;
  imageUrl?: string;
  price?: {
    currency: string;
    amount: number;
    displayText: string;
  };
  sku?: string;
};

function hasProductJsonLd(root: ParentNode) {
  return Boolean(readProductJsonLd(root));
}

function readProductJsonLd(root: ParentNode): ProductJsonLdPayload | undefined {
  const ownerDocument = root instanceof Document ? root : root.ownerDocument;
  if (!ownerDocument) {
    return undefined;
  }

  for (const script of ownerDocument.querySelectorAll<HTMLScriptElement>(
    'script[type="application/ld+json"]'
  )) {
    const candidate = parseProductJsonLd(script.textContent, ownerDocument.URL);
    if (candidate?.title) {
      return candidate;
    }
  }

  return undefined;
}

function parseProductJsonLd(
  rawText: string | null,
  documentUrl: string
): ProductJsonLdPayload | undefined {
  if (!rawText?.trim()) {
    return undefined;
  }

  try {
    return extractProductJsonLd(JSON.parse(rawText), documentUrl);
  } catch {
    return undefined;
  }
}

function extractProductJsonLd(
  value: unknown,
  documentUrl: string
): ProductJsonLdPayload | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const product = extractProductJsonLd(entry, documentUrl);
      if (product?.title) {
        return product;
      }
    }
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if (Array.isArray(record['@graph'])) {
    return extractProductJsonLd(record['@graph'], documentUrl);
  }

  const rawType = record['@type'];
  const types = Array.isArray(rawType)
    ? rawType
    : typeof rawType === 'string'
      ? [rawType]
      : [];
  if (!types.some((type) => type.toLowerCase() === 'product')) {
    return undefined;
  }

  const offer = Array.isArray(record.offers)
    ? record.offers.find((entry) => entry && typeof entry === 'object')
    : record.offers && typeof record.offers === 'object'
      ? (record.offers as Record<string, unknown>)
      : undefined;
  const rawPrice =
    offer && typeof offer.price === 'string'
      ? offer.price
      : offer && typeof offer.price === 'number'
        ? String(offer.price)
        : undefined;
  const amount = rawPrice ? Number.parseFloat(rawPrice) : undefined;
  const currency =
    offer && typeof offer.priceCurrency === 'string'
      ? offer.priceCurrency
      : 'USD';
  const price =
    amount != null && Number.isFinite(amount)
      ? {
          currency,
          amount,
          displayText: `$${amount.toFixed(2)}`,
        }
      : undefined;

  return {
    title: typeof record.name === 'string' ? record.name.trim() : undefined,
    sourceUrl: resolveJsonLdUrl(
      typeof record.url === 'string' ? record.url : undefined,
      documentUrl
    ),
    imageUrl: resolveJsonLdImage(record.image, documentUrl),
    price,
    sku:
      typeof record.sku === 'string'
        ? record.sku.trim()
        : typeof record.productID === 'string'
          ? record.productID.trim()
          : undefined,
  };
}

function resolveJsonLdImage(
  image: unknown,
  documentUrl: string
): string | undefined {
  if (typeof image === 'string') {
    return resolveJsonLdUrl(image, documentUrl);
  }

  if (Array.isArray(image)) {
    for (const entry of image) {
      const resolved = resolveJsonLdImage(entry, documentUrl);
      if (resolved) {
        return resolved;
      }
    }
    return undefined;
  }

  if (image && typeof image === 'object') {
    const record = image as Record<string, unknown>;
    if (typeof record.url === 'string') {
      return resolveJsonLdUrl(record.url, documentUrl);
    }
  }

  return undefined;
}

function resolveJsonLdUrl(
  rawUrl: string | undefined,
  documentUrl: string
): string | undefined {
  if (!rawUrl?.trim()) {
    return undefined;
  }

  try {
    return new URL(rawUrl, documentUrl).toString();
  } catch {
    return undefined;
  }
}

function resolveOwnedWalmartUrl(
  rawUrl: string | undefined,
  documentUrl: string
): string | undefined {
  const resolved = resolveJsonLdUrl(rawUrl, documentUrl);
  if (!resolved) {
    return undefined;
  }

  try {
    return new URL(resolved).hostname === 'www.walmart.com' ? resolved : undefined;
  } catch {
    return undefined;
  }
}

function readNestedArray(value: unknown, path: readonly string[]) {
  const resolved = readPath(value, path);
  return Array.isArray(resolved) ? resolved : [];
}

function readNestedString(value: unknown, path: readonly string[]) {
  return readStringValue(readPath(value, path));
}

function readNestedNumber(value: unknown, path: readonly string[]) {
  return readNumberValue(readPath(value, path));
}

function readPath(value: unknown, path: readonly string[]) {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

function readStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readNumberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const normalized = Number.parseFloat(value);
    return Number.isFinite(normalized) ? normalized : undefined;
  }

  return undefined;
}
