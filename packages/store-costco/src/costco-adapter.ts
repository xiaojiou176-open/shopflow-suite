import {
  capabilityStateSchema,
  detectionResultSchema,
  normalizedProductSchema,
  searchResultItemSchema,
  type CapabilityState,
  type DetectionResult,
  type StoreAdapter,
} from '@shopflow/contracts';

export const costcoHostPatterns = ['*://www.costco.com/*'];

const productSelectors = {
  title: [
    '[data-shopflow-product-title]',
    '[data-testid="pdp-product-name"]',
    '[data-automation-id="productName"]',
  ],
  price: ['[data-shopflow-product-price]'],
  image: ['[data-shopflow-product-image]', '[data-testid="hero-image"]'],
  sku: ['[data-shopflow-product-sku]'],
} as const;

const searchSelectors = {
  item: ['[data-shopflow-search-item]'],
  title: '[data-shopflow-search-title]',
  price: '[data-shopflow-search-price]',
  url: '[data-shopflow-search-url]',
  image: ['[data-shopflow-search-image]', 'img'],
} as const;

export const costcoAdapter: StoreAdapter = {
  storeId: 'costco',
  verifiedScopes: ['costco'],
  matches(url) {
    return url.hostname === 'www.costco.com';
  },
  detect(url, document) {
    const pageKind = detectCostcoPageKind(url, document);

    return detectionResultSchema.parse({
      storeId: 'costco',
      verifiedScopes: ['costco'],
      matchedHost: url.hostname,
      pageKind,
      confidence: pageKind === 'unknown' ? 0.45 : 0.91,
      capabilityStates: capabilityStatesFor(pageKind, document),
    });
  },
  async extractProduct(document) {
    const payload = readProductJsonLd(document);

    return normalizedProductSchema.parse({
      sourceStoreId: 'costco',
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
    const typeaheadResults = await readCostcoTypeaheadResults(document);
    if (typeaheadResults.length > 0) {
      return searchResultItemSchema.array().parse(typeaheadResults);
    }

    const structuredResults = readSearchJsonLdResults(document);
    if (structuredResults.length > 0) {
      return searchResultItemSchema.array().parse(structuredResults);
    }

    const items = queryAll(document, searchSelectors.item);

    return searchResultItemSchema.array().parse(
      items.map((item, index) => ({
        sourceStoreId: 'costco',
        sourceUrl: readRequiredAttribute(item, searchSelectors.url, 'href'),
        title: readText(item, [searchSelectors.title]),
        imageUrl: readImageUrl(item, searchSelectors.image),
        price: parseMoney(readText(item, [searchSelectors.price], true)),
        position: index,
      }))
    );
  },
};

function detectCostcoPageKind(
  url: URL,
  document: Document
): DetectionResult['pageKind'] {
  const fixtureKind =
    document.querySelector<HTMLElement>('[data-page-kind]')?.dataset.pageKind;

  if (fixtureKind === 'product' || fixtureKind === 'search') {
    return fixtureKind;
  }

  const path = url.pathname.toLowerCase();

  if (path.includes('/catalogsearch')) {
    return 'search';
  }

  if (hasCostcoTypeaheadSearchContext(document)) {
    return 'search';
  }

  if (
    path.includes('/product.') ||
    path.includes('/cproductdisplay') ||
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
          ? 'Costco product extraction can reuse product JSON-LD before falling back to storefront PDP selectors.'
          : `Costco product page was detected, but the current DOM snapshot is missing ${productIntegrity.detail}.`
        : `Costco product extraction only applies on product pages, not ${describePageKind(pageKind)}.`
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
          ? 'Costco search extraction can reuse page-owned typeahead wiring or JSON-LD item lists before falling back to fixture-backed DOM cards.'
          : searchIntegrity.kind === 'missing_required_fields'
            ? `Costco search page was detected, but at least one result row is missing ${searchIntegrity.detail}.`
            : `Costco search page was detected, but the current DOM snapshot is missing ${searchIntegrity.detail}.`
        : `Costco search extraction only applies on search pages, not ${describePageKind(pageKind)}.`
    ),
    capabilityState(
      'extract_deals',
      'unsupported_page',
      'UNSUPPORTED_PAGE',
      'Costco Wave 2 does not claim differentiated deals support.'
    ),
    capabilityState(
      'run_action',
      'unsupported_page',
      'UNSUPPORTED_PAGE',
      'Costco is currently a storefront shell, not an action-heavy product.'
    ),
    capabilityState(
      'export_data',
      extractionReady ? 'ready' : exportState.status,
      extractionReady ? undefined : exportState.reasonCode,
      extractionReady
        ? 'Costco export can ride on extracted product or search payloads.'
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
    return createBlockedExportState('Costco product', productIntegrity);
  }

  if (pageKind === 'search') {
    return createBlockedExportState('Costco search', searchIntegrity);
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
  const ownerDocument = document instanceof Document ? document : document.ownerDocument;
  if (ownerDocument && readInlineCostcoTypeaheadResults(ownerDocument).length > 0) {
    return { kind: 'ready' };
  }

  if (hasCostcoTypeaheadSearchContext(document)) {
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
    const value = readImageCandidate(
      root.querySelector<HTMLImageElement>(selector),
      root
    );
    if (value) {
      return value;
    }
  }

  return undefined;
}

function readImageCandidate(
  image: HTMLImageElement | null,
  root: ParentNode
): string | undefined {
  if (!image) {
    return undefined;
  }

  const rawCandidate = [
    image.getAttribute('data-src'),
    image.getAttribute('data-lazy-src'),
    image.getAttribute('data-srcset'),
    image.getAttribute('srcset'),
    image.currentSrc,
    image.getAttribute('src'),
    image.src,
  ]
    .map(extractPrimaryUrl)
    .find(Boolean);

  if (!rawCandidate) {
    return undefined;
  }

  return resolveUrl(root, rawCandidate);
}

function extractPrimaryUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const primaryEntry = trimmed.split(',')[0]?.trim();
  return primaryEntry?.split(/\s+/)[0]?.trim() || undefined;
}

function resolveUrl(root: ParentNode, rawValue: string) {
  const ownerDocument = root instanceof Document ? root : root.ownerDocument;
  const baseUrl =
    ownerDocument?.URL && ownerDocument.URL !== 'about:blank'
      ? ownerDocument.URL
      : 'https://www.costco.com/';

  try {
    return new URL(rawValue, baseUrl).toString();
  } catch {
    return undefined;
  }
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
    throw new Error('Missing navigated document URL for Costco extraction');
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

function describePageKind(pageKind: DetectionResult['pageKind']) {
  return pageKind === 'unknown'
    ? 'unrecognized pages'
    : `${pageKind} pages`;
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
  sourceStoreId: 'costco';
  sourceUrl: string;
  title: string;
  imageUrl?: string;
  price?: ReturnType<typeof parseMoney>;
  position: number;
};

type CostcoTypeaheadContext = {
  endpoint: string;
  basicAuth: string;
  query: string;
  documentUrl: string;
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
        sourceStoreId: 'costco',
        position: results.length,
      });
    }
  }

  return results;
}

function hasCostcoTypeaheadSearchContext(root: ParentNode) {
  return Boolean(readCostcoTypeaheadContext(root));
}

async function readCostcoTypeaheadResults(document: Document) {
  const context = readCostcoTypeaheadContext(document);
  const inlineResults = readInlineCostcoTypeaheadResults(document);
  if (inlineResults.length > 0) {
    return inlineResults.map((item, index) => ({
      ...item,
      sourceStoreId: 'costco',
      position: index,
    }));
  }

  if (!context || typeof fetch !== 'function') {
    return [];
  }

  const abortController =
    typeof AbortController === 'function' ? new AbortController() : undefined;
  const timeoutHandle =
    abortController && typeof setTimeout === 'function'
      ? setTimeout(() => abortController.abort(), 2500)
      : undefined;

  try {
    const response = await fetch(buildCostcoTypeaheadUrl(context), {
      headers: {
        Accept: 'application/json, text/plain, */*',
        Authorization: context.basicAuth.startsWith('Basic ')
          ? context.basicAuth
          : `Basic ${context.basicAuth}`,
      },
      signal: abortController?.signal,
    });
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as unknown;
    return readCostcoTypeaheadPayloadResults(payload, context.documentUrl).map(
      (item, index) => ({
        ...item,
        sourceStoreId: 'costco',
        position: index,
      })
    );
  } catch {
    return [];
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function readInlineCostcoTypeaheadResults(document: Document) {
  for (const script of document.querySelectorAll<HTMLScriptElement>('script')) {
    for (const payload of readInlineJsonCandidates(script.textContent ?? '')) {
      const results = readCostcoTypeaheadPayloadResults(payload, document.URL);
      if (results.length > 0) {
        return results;
      }
    }
  }

  return [];
}

function readCostcoTypeaheadContext(
  root: ParentNode
): CostcoTypeaheadContext | undefined {
  const ownerDocument = root instanceof Document ? root : root.ownerDocument;
  if (!ownerDocument) {
    return undefined;
  }

  let documentUrl: URL;
  try {
    documentUrl = new URL(ownerDocument.URL);
  } catch {
    return undefined;
  }

  const query = readCostcoSearchQuery(documentUrl);
  if (!query) {
    return undefined;
  }

  for (const script of ownerDocument.querySelectorAll<HTMLScriptElement>('script')) {
    const scriptText = script.textContent ?? '';
    if (!scriptText.includes('lwTypeAhead')) {
      continue;
    }

    const endpoint = readScriptStringValue(scriptText, [
      'lwTypeAhead.endpoint',
      'endpoint',
    ]);
    const basicAuth = readScriptStringValue(scriptText, [
      'lwTypeAhead.basicAuth',
      'basicAuth',
    ]);
    const resolvedEndpoint = resolveJsonLdUrl(endpoint, ownerDocument.URL);
    if (!resolvedEndpoint || !basicAuth) {
      continue;
    }

    return {
      endpoint: resolvedEndpoint,
      basicAuth,
      query,
      documentUrl: ownerDocument.URL,
    };
  }

  return undefined;
}

function buildCostcoTypeaheadUrl(context: CostcoTypeaheadContext) {
  const placeholderReplacements: Record<string, string> = {
    '{query}': encodeURIComponent(context.query),
    '__QUERY__': encodeURIComponent(context.query),
    '%QUERY%': encodeURIComponent(context.query),
  };

  for (const [placeholder, replacement] of Object.entries(
    placeholderReplacements
  )) {
    if (context.endpoint.includes(placeholder)) {
      return context.endpoint.split(placeholder).join(replacement);
    }
  }

  try {
    const url = new URL(context.endpoint);
    const existingQueryParam = [
      'query',
      'keyword',
      'q',
      'term',
      'searchTerm',
    ].find((name) => url.searchParams.has(name));
    url.searchParams.set(existingQueryParam ?? 'query', context.query);
    return url.toString();
  } catch {
    return context.endpoint;
  }
}

function readCostcoTypeaheadPayloadResults(
  payload: unknown,
  documentUrl: string
): Array<Omit<SearchJsonLdItem, 'sourceStoreId' | 'position'>> {
  const results: Array<Omit<SearchJsonLdItem, 'sourceStoreId' | 'position'>> = [];
  const seen = new Set<string>();

  for (const item of readCostcoTypeaheadPayloadDocuments(payload)) {
    const result = toCostcoTypeaheadResult(item, documentUrl);
    if (!result) {
      continue;
    }

    const key = `${result.sourceUrl}::${result.title}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    results.push(result);
  }

  return results;
}

const inlineJsonAssignmentMarkers = [
  'window.__COSTCO_TYPEAHEAD_RESULTS__ =',
  'window.__PRELOADED_STATE__ =',
  '__NEXT_DATA__ =',
] as const;

function readInlineJsonCandidates(rawText: string) {
  const candidates: unknown[] = [];
  const trimmed = rawText.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      candidates.push(JSON.parse(trimmed) as unknown);
    } catch {
      // Ignore invalid raw JSON bodies and continue scanning assignment wrappers.
    }
  }

  for (const marker of inlineJsonAssignmentMarkers) {
    const candidate = readAssignedJsonPayload(rawText, marker);
    if (candidate !== undefined) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

function readAssignedJsonPayload(
  rawText: string,
  marker: string
): unknown | undefined {
  const markerIndex = rawText.indexOf(marker);
  if (markerIndex === -1) {
    return undefined;
  }

  const payloadStart = findJsonStartIndex(rawText, markerIndex + marker.length);
  if (payloadStart === -1) {
    return undefined;
  }

  const payloadEnd = findBalancedJsonEnd(rawText, payloadStart);
  if (payloadEnd === -1) {
    return undefined;
  }

  try {
    return JSON.parse(rawText.slice(payloadStart, payloadEnd + 1)) as unknown;
  } catch {
    return undefined;
  }
}

function findJsonStartIndex(rawText: string, startIndex: number) {
  for (let index = startIndex; index < rawText.length; index += 1) {
    const char = rawText[index];
    if (char === '{' || char === '[') {
      return index;
    }
  }

  return -1;
}

function findBalancedJsonEnd(rawText: string, startIndex: number) {
  const openingChar = rawText[startIndex];
  const closingChar = openingChar === '{' ? '}' : ']';
  let depth = 0;
  let insideString = false;
  let escaped = false;

  for (let index = startIndex; index < rawText.length; index += 1) {
    const char = rawText[index];

    if (insideString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        insideString = false;
      }

      continue;
    }

    if (char === '"') {
      insideString = true;
      continue;
    }

    if (char === openingChar) {
      depth += 1;
      continue;
    }

    if (char === closingChar) {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function readCostcoTypeaheadPayloadDocuments(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const candidates = [
    record.docs,
    record.results,
    record.hits,
    readNestedArray(record, ['results', 'docs']),
    readNestedArray(record, ['response', 'docs']),
    readNestedArray(record, ['data', 'docs']),
    readNestedArray(record, ['data', 'results']),
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function toCostcoTypeaheadResult(
  value: unknown,
  documentUrl: string
): Omit<SearchJsonLdItem, 'sourceStoreId' | 'position'> | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  for (const record of readCostcoTypeaheadCandidateRecords(value)) {
    const title = readFirstString(record, [
      'title',
      'name',
      'productName',
      'product_title',
      'description',
    ]);
    const sourceUrl = resolveOwnedCostcoUrl(
      readFirstString(record, [
        'url',
        'productUrl',
        'href',
        'canonicalUrl',
        'seoUrl',
        'seo_url',
        'relativeUrl',
        'productPageUrl',
        'product_page_url',
      ]),
      documentUrl
    );
    if (!title || !sourceUrl) {
      continue;
    }

    return {
      title,
      sourceUrl,
      imageUrl: resolveJsonLdImage(
        readFirstValue(record, [
          'imageUrl',
          'image_url',
          'image',
          'thumbnailUrl',
          'thumbnail_url',
        ]),
        documentUrl
      ),
      price: readCostcoTypeaheadPrice(record),
    };
  }

  return undefined;
}

function readCostcoTypeaheadCandidateRecords(value: unknown) {
  const record = value as Record<string, unknown>;
  return [record, record.doc, record.document, record.product].filter(
    (candidate): candidate is Record<string, unknown> =>
      Boolean(candidate) && typeof candidate === 'object'
  );
}

function readCostcoTypeaheadPrice(record: Record<string, unknown>) {
  const displayText = readFirstString(record, [
    'formattedPrice',
    'displayPrice',
    'priceDisplay',
    'price_display',
    'memberPriceDisplay',
  ]);
  if (displayText) {
    return parseMoney(displayText);
  }

  const numericPrice = readFirstFiniteNumber(record, [
    'price',
    'memberPrice',
    'salePrice',
    'currentPrice',
  ]);
  if (numericPrice != null) {
    return {
      currency: 'USD',
      amount: numericPrice,
      displayText: `$${numericPrice.toFixed(2)}`,
    };
  }

  const rawTextPrice = readFirstString(record, [
    'price',
    'memberPrice',
    'salePrice',
    'currentPrice',
  ]);
  return parseMoney(formatStructuredPriceDisplayText(rawTextPrice));
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
  const sourceUrl = resolveOwnedCostcoUrl(
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
  const normalizedDisplayPrice = formatStructuredPriceDisplayText(rawPrice);

  return {
    sourceUrl,
    title,
    imageUrl: resolveJsonLdImage(record.image, documentUrl),
    price: parseMoney(normalizedDisplayPrice),
  };
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

function resolveOwnedCostcoUrl(
  rawUrl: string | undefined,
  documentUrl: string
): string | undefined {
  const resolved = resolveJsonLdUrl(rawUrl, documentUrl);
  if (!resolved) {
    return undefined;
  }

  try {
    return new URL(resolved).hostname === 'www.costco.com' ? resolved : undefined;
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

function readCostcoSearchQuery(url: URL) {
  const query =
    url.searchParams.get('keyword') ??
    url.searchParams.get('query') ??
    url.searchParams.get('q');
  return query?.trim() || undefined;
}

function readScriptStringValue(
  scriptText: string,
  propertyNames: readonly string[]
) {
  for (const propertyName of propertyNames) {
    const escapedPropertyName = propertyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = scriptText.match(
      new RegExp(
        `(?:["'])?${escapedPropertyName}(?:["'])?\\s*[:=]\\s*(["'])([^"']+?)\\1`
      )
    );
    if (match?.[2]?.trim()) {
      return match[2].trim();
    }
  }

  return undefined;
}

function readNestedArray(
  payload: Record<string, unknown>,
  path: readonly string[]
) {
  let current: unknown = payload;

  for (const segment of path) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return Array.isArray(current) ? current : undefined;
}

function readFirstValue(
  record: Record<string, unknown>,
  keys: readonly string[]
): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value != null) {
      return value;
    }
  }

  return undefined;
}

function readFirstString(
  record: Record<string, unknown>,
  keys: readonly string[]
) {
  const value = readFirstValue(record, keys);
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function readFirstFiniteNumber(
  record: Record<string, unknown>,
  keys: readonly string[]
) {
  const value = readFirstValue(record, keys);
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = Number.parseFloat(value);
    return Number.isFinite(normalized) ? normalized : undefined;
  }

  return undefined;
}
