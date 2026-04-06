import {
  capabilityStateSchema,
  detectionResultSchema,
  normalizedProductSchema,
  searchResultItemSchema,
  type CapabilityState,
  type DetectionResult,
  type StoreAdapter,
} from '@shopflow/contracts';

const hostPatterns = ['*://www.amazon.com/*'];

const productSelectors = {
  title: ['[data-shopflow-product-title]', '#productTitle', '#title span'],
  price: ['[data-shopflow-product-price]', '.a-price .a-offscreen'],
  image: ['[data-shopflow-product-image]', '#landingImage', '#imgBlkFront'],
  sku: ['[data-shopflow-product-sku]'],
} as const;

const productAsinValueSelectors = [
  '#ASIN',
  'input[name="ASIN"]',
  'input[name="ASIN.0"]',
  'input[name="dropdown_selected_asin"]',
  '[data-defaultasin]',
] as const;

const searchSelectors = {
  item: ['[data-shopflow-search-item]', '[data-component-type="s-search-result"]'],
  title: '[data-shopflow-search-title], h2 span',
  price: '[data-shopflow-search-price], .a-price .a-offscreen',
  url: '[data-shopflow-search-url], a[href]',
} as const;

const semanticSearchSelectors = {
  item: '[data-component-type="s-search-result"][data-asin]',
  title: 'h2[aria-label], h2 span',
  price: '.a-price .a-offscreen',
  image: 'img.s-image, img[data-image-latency="s-product-image"]',
  url: 'a[href*="/dp/"], a[href*="/gp/product/"]',
} as const;

export const amazonAdapter: StoreAdapter = {
  storeId: 'amazon',
  verifiedScopes: ['amazon'],
  matches(url) {
    return url.hostname === 'www.amazon.com';
  },
  detect(url, document) {
    const pageKind = detectAmazonPageKind(url, document);
    return detectionResultSchema.parse({
      storeId: 'amazon',
      verifiedScopes: ['amazon'],
      matchedHost: url.hostname,
      pageKind,
      confidence: pageKind === 'unknown' ? 0.4 : 0.92,
      capabilityStates: capabilityStatesFor(pageKind, document),
    });
  },
  async extractProduct(document) {
    const documentUrl = readRequiredDocumentUrl(document);
    const payload = readProductJsonLd(document);
    const asin = resolveAmazonProductAsin(document, payload, documentUrl);

    return normalizedProductSchema.parse({
      sourceStoreId: 'amazon',
      sourceUrl:
        buildAmazonCanonicalUrl(asin, payload?.sourceUrl ?? documentUrl, documentUrl) ??
        documentUrl,
      title: payload?.title ?? readText(document, productSelectors.title),
      imageUrl: payload?.imageUrl ?? readImageUrl(document, productSelectors.image),
      price:
        payload?.price ??
        parseMoney(readText(document, productSelectors.price, true)),
      sku: payload?.sku ?? readText(document, productSelectors.sku, true) ?? asin,
    });
  },
  async extractSearchResults(document) {
    const semanticResults = readAmazonSemanticSearchResults(document);
    if (semanticResults.length > 0) {
      return searchResultItemSchema.array().parse(semanticResults);
    }

    const structuredResults = readSearchJsonLdResults(document);
    if (structuredResults.length > 0) {
      return searchResultItemSchema.array().parse(structuredResults);
    }

    const items = queryAll(document, searchSelectors.item);

    return searchResultItemSchema.array().parse(
      items.map((item, index) => ({
        sourceStoreId: 'amazon',
        sourceUrl: readRequiredAttribute(item, searchSelectors.url, 'href'),
        title: readText(item, [searchSelectors.title]),
        price: parseMoney(readText(item, [searchSelectors.price], true)),
        position: index,
      }))
    );
  },
};

export { hostPatterns as amazonHostPatterns };

export function createAmazonPreviewDetection(
  pageKind: DetectionResult['pageKind'] = 'unknown'
): DetectionResult {
  const previewDocument = document.implementation.createHTMLDocument(
    'amazon-preview'
  );

  return detectionResultSchema.parse({
    storeId: 'amazon',
    verifiedScopes: ['amazon'],
    matchedHost: 'www.amazon.com',
    pageKind,
    confidence: pageKind === 'unknown' ? 0.4 : 0.92,
    capabilityStates: capabilityStatesFor(pageKind, previewDocument),
  });
}

function detectAmazonPageKind(
  url: URL,
  document: Document
): DetectionResult['pageKind'] {
  const fixtureKind =
    document.querySelector<HTMLElement>('[data-page-kind]')?.dataset.pageKind;
  if (fixtureKind === 'product' || fixtureKind === 'search') {
    return fixtureKind;
  }

  const path = url.pathname;

  if (path.includes('/s')) {
    return 'search';
  }

  if (
    path.includes('/dp/') ||
    path.includes('/gp/product/') ||
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
          ? 'Amazon product extraction can reuse page-owned JSON-LD before falling back to storefront PDP selectors.'
          : `Amazon product page was detected, but the current DOM snapshot is missing ${productIntegrity.detail}.`
        : `Amazon product extraction only applies on product pages, not ${describePageKind(pageKind)}.`
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
          ? 'Amazon search extraction can reuse semantic cards, ASIN carriers, or search JSON-LD item lists before falling back to generic DOM links.'
          : searchIntegrity.kind === 'missing_required_fields'
            ? `Amazon search page was detected, but at least one result row is missing ${searchIntegrity.detail}.`
            : `Amazon search page was detected, but the current DOM snapshot is missing ${searchIntegrity.detail}.`
        : `Amazon search extraction only applies on search pages, not ${describePageKind(pageKind)}.`
    ),
    capabilityState(
      'extract_deals',
      'unsupported_page',
      'UNSUPPORTED_PAGE',
      'Amazon Wave 1 does not claim deals support.'
    ),
    capabilityState(
      'run_action',
      'unsupported_page',
      'UNSUPPORTED_PAGE',
      'Amazon is intentionally a storefront shell in Wave 1.'
    ),
    capabilityState(
      'export_data',
      extractionReady ? 'ready' : exportState.status,
      extractionReady ? undefined : exportState.reasonCode,
      extractionReady
        ? 'Amazon export can ride on the extracted payload.'
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
    return createBlockedExportState('Amazon product', productIntegrity);
  }

  if (pageKind === 'search') {
    return createBlockedExportState('Amazon search', searchIntegrity);
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
  if (readAmazonSemanticSearchResults(document).length > 0) {
    return { kind: 'ready' };
  }

  if (readSearchJsonLdResults(document).length > 0) {
    return { kind: 'ready' };
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

function hasAnySelector(
  root: ParentNode,
  selectors: readonly string[] | readonly string[][]
): boolean {
  const flatSelectors = Array.isArray(selectors[0])
    ? (selectors as readonly string[][]).flat()
    : (selectors as readonly string[]);

  return flatSelectors.some((selector) =>
    Boolean(root.querySelector(selector))
  );
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
    throw new Error('Missing navigated document URL for Amazon extraction');
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

function readAmazonSemanticSearchResults(root: ParentNode) {
  const ownerDocument = root instanceof Document ? root : root.ownerDocument;
  if (!ownerDocument) {
    return [];
  }

  const items = Array.from(
    ownerDocument.querySelectorAll<HTMLElement>(semanticSearchSelectors.item)
  );
  const results = [];

  for (const item of items) {
    const result = readAmazonSemanticSearchItem(item, ownerDocument.URL, results.length);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

function readAmazonSemanticSearchItem(
  item: HTMLElement,
  documentUrl: string,
  position: number
) {
  const asin = sanitizeAmazonAsin(item.dataset.asin);
  const title = readAmazonSemanticSearchTitle(item);
  const sourceUrl = buildAmazonCanonicalUrl(
    asin,
    readAttribute(item, semanticSearchSelectors.url, 'href'),
    documentUrl
  );
  if (!title || !sourceUrl) {
    return undefined;
  }

  return {
    sourceStoreId: 'amazon' as const,
    sourceUrl,
    title,
    imageUrl: readImageUrl(item, [semanticSearchSelectors.image]),
    price: parseMoney(readText(item, [semanticSearchSelectors.price], true)),
    position,
  };
}

function readSearchJsonLdResults(root: ParentNode): SearchJsonLdItem[] {
  const ownerDocument = root instanceof Document ? root : root.ownerDocument;
  if (!ownerDocument) {
    return [];
  }

  const results: SearchJsonLdItem[] = [];
  const seen = new Set<string>();

  for (const script of ownerDocument.querySelectorAll<HTMLScriptElement>(
    'script[type="application/ld+json"]'
  )) {
    const parsedResults = parseSearchJsonLd(script.textContent, ownerDocument.URL);
    for (const item of parsedResults) {
      const key = `${item.sourceUrl}::${item.title}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      results.push({
        ...item,
        sourceStoreId: 'amazon',
        position: results.length,
      });
    }
  }

  return results;
}

function parseSearchJsonLd(
  rawText: string | null,
  documentUrl: string
): Array<Omit<SearchJsonLdItem, 'sourceStoreId' | 'position'>> {
  if (!rawText?.trim()) {
    return [];
  }

  try {
    return extractSearchJsonLd(JSON.parse(rawText), documentUrl);
  } catch {
    return [];
  }
}

function extractSearchJsonLd(
  value: unknown,
  documentUrl: string
): Array<Omit<SearchJsonLdItem, 'sourceStoreId' | 'position'>> {
  if (!value || typeof value !== 'object') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractSearchJsonLd(entry, documentUrl));
  }

  const record = value as Record<string, unknown>;
  if (Array.isArray(record['@graph'])) {
    return extractSearchJsonLd(record['@graph'], documentUrl);
  }

  const rawType = record['@type'];
  const types = Array.isArray(rawType)
    ? rawType
    : typeof rawType === 'string'
      ? [rawType]
      : [];

  if (types.some((type) => type.toLowerCase() === 'itemlist')) {
    const listItems = Array.isArray(record.itemListElement)
      ? record.itemListElement
      : [];
    return listItems
      .map((entry) => parseSearchJsonLdListItem(entry, documentUrl))
      .filter(
        (
          item
        ): item is Omit<SearchJsonLdItem, 'sourceStoreId' | 'position'> =>
          item !== undefined
      );
  }

  const product = parseSearchJsonLdProduct(record, documentUrl);
  return product ? [product] : [];
}

function parseSearchJsonLdListItem(
  value: unknown,
  documentUrl: string
): Omit<SearchJsonLdItem, 'sourceStoreId' | 'position'> | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const directProduct = parseSearchJsonLdProduct(record, documentUrl);
  if (directProduct) {
    return directProduct;
  }

  return parseSearchJsonLdProduct(record.item, documentUrl);
}

function parseSearchJsonLdProduct(
  value: unknown,
  documentUrl: string
): Omit<SearchJsonLdItem, 'sourceStoreId' | 'position'> | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const rawType = record['@type'];
  const types = Array.isArray(rawType)
    ? rawType
    : typeof rawType === 'string'
      ? [rawType]
      : [];

  if (
    types.length > 0 &&
    !types.some(
      (type) =>
        type.toLowerCase() === 'product' || type.toLowerCase() === 'listitem'
    )
  ) {
    return undefined;
  }

  const title = typeof record.name === 'string' ? record.name.trim() : undefined;
  const asin = sanitizeAmazonAsin(
    readFirstString(record, ['sku', 'productID', 'asin'])
  );
  const sourceUrl = buildAmazonCanonicalUrl(
    asin,
    typeof record.url === 'string' ? record.url : undefined,
    documentUrl
  );
  if (!title || !sourceUrl) {
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
        ? `$${offer.price.toFixed(2)}`
        : undefined;

  return {
    sourceUrl,
    title,
    imageUrl: resolveJsonLdImage(record.image, documentUrl),
    price: parseMoney(formatStructuredPriceDisplayText(rawPrice)),
  };
}

function readAmazonSemanticSearchTitle(item: ParentNode) {
  const labeledHeading = item
    .querySelector('h2[aria-label]')
    ?.getAttribute('aria-label')
    ?.trim();
  if (labeledHeading) {
    return labeledHeading;
  }

  return readText(item, ['h2 span'], true);
}

function sanitizeAmazonAsin(rawAsin: string | undefined) {
  const candidate = rawAsin?.trim().toUpperCase();
  return candidate && /^[A-Z0-9]{10}$/.test(candidate) ? candidate : undefined;
}

function readFirstString(
  record: Record<string, unknown>,
  keys: readonly string[]
) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function buildAmazonCanonicalUrl(
  asin: string | undefined,
  rawUrl: string | undefined,
  documentUrl: string
) {
  const resolved = resolveJsonLdUrl(rawUrl, documentUrl);
  const resolvedAsin = extractAmazonAsinFromUrl(resolved) ?? asin;
  if (resolvedAsin) {
    return `https://www.amazon.com/dp/${resolvedAsin}`;
  }

  return resolved && isOwnedAmazonUrl(resolved) ? resolved : undefined;
}

function extractAmazonAsinFromUrl(rawUrl: string | undefined) {
  if (!rawUrl) {
    return undefined;
  }

  try {
    const parsed = new URL(rawUrl);
    const match = parsed.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    return sanitizeAmazonAsin(match?.[1]);
  } catch {
    return undefined;
  }
}

function isOwnedAmazonUrl(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname === 'www.amazon.com';
  } catch {
    return false;
  }
}

function describePageKind(pageKind: DetectionResult['pageKind']) {
  return pageKind === 'unknown'
    ? 'unrecognized pages'
    : `${pageKind} pages`;
}

function resolveAmazonProductAsin(
  document: Document,
  payload: ProductJsonLdPayload | undefined,
  documentUrl: string
) {
  return (
    sanitizeAmazonAsin(payload?.sku) ??
    readAmazonAsinCarrier(document) ??
    extractAmazonAsinFromUrl(payload?.sourceUrl) ??
    extractAmazonAsinFromUrl(documentUrl)
  );
}

function readAmazonAsinCarrier(root: ParentNode) {
  for (const selector of productAsinValueSelectors) {
    const element = root.querySelector(selector);
    const rawValue =
      element instanceof HTMLInputElement
        ? element.value
        : element?.getAttribute('data-defaultasin') ?? element?.getAttribute('value');
    const asin = sanitizeAmazonAsin(rawValue ?? undefined);
    if (asin) {
      return asin;
    }
  }

  return undefined;
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

type SearchJsonLdItem = {
  sourceStoreId: 'amazon';
  sourceUrl: string;
  title: string;
  imageUrl?: string;
  price?: ReturnType<typeof parseMoney>;
  position: number;
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

function formatStructuredPriceDisplayText(rawPrice: string | undefined) {
  if (!rawPrice?.trim()) {
    return undefined;
  }

  const trimmed = rawPrice.trim();
  return /^[0-9]+(?:\.[0-9]{1,2})?$/.test(trimmed) ? `$${trimmed}` : trimmed;
}
