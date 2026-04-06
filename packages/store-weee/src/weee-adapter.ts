import {
  capabilityStateSchema,
  detectionResultSchema,
  normalizedProductSchema,
  searchResultItemSchema,
  type CapabilityState,
  type DetectionResult,
  type StoreAdapter,
} from '@shopflow/contracts';

export const weeeHostPatterns = ['*://www.sayweee.com/*'] as const;

const productSelectors = {
  title: [
    '[data-shopflow-product-title]',
    '[data-weee-product-title]',
    '[data-testid="product-title"]',
    '[data-testid="weee-product-title"]',
    '[data-testid="pdp-title"]',
  ],
  price: [
    '[data-shopflow-product-price]',
    '[data-weee-product-price]',
    '[data-testid="price-current"]',
    '[data-testid="weee-product-price"]',
    '[data-testid="pdp-price"]',
  ],
  image: [
    '[data-shopflow-product-image]',
    '[data-weee-product-image]',
    'img[data-testid="product-image"]',
    'img[data-testid="weee-product-image"]',
    'img[data-testid="pdp-image"]',
  ],
  sku: [
    '[data-shopflow-product-sku]',
    '[data-weee-product-sku]',
    '[data-testid="product-sku"]',
    '[data-testid="weee-product-sku"]',
    '[data-testid="goods-id"]',
  ],
} as const;

const searchSelectors = {
  item: [
    '[data-shopflow-search-item]',
    '[data-weee-search-item]',
    '[data-testid="weee-search-item"]',
    '[data-testid="search-product-card"]',
    '[data-testid="goods-card"]',
  ],
  title:
    '[data-shopflow-search-title], [data-weee-search-title], [data-testid="weee-search-title"], [data-testid="product-card-title"], [data-testid="goods-card-title"]',
  price:
    '[data-shopflow-search-price], [data-weee-search-price], [data-testid="weee-search-price"], [data-testid="product-card-price"], [data-testid="goods-card-price"]',
  url:
    '[data-shopflow-search-url], [data-weee-search-url], [data-testid="weee-search-url"], [data-testid="goods-card-link"], a[href]',
} as const;

export const weeeAdapter: StoreAdapter = {
  storeId: 'weee',
  verifiedScopes: ['weee'],
  matches(url) {
    return url.hostname === 'www.sayweee.com';
  },
  detect(url, document) {
    const pageKind = detectWeeePageKind(url, document);

    return detectionResultSchema.parse({
      storeId: 'weee',
      verifiedScopes: ['weee'],
      matchedHost: url.hostname,
      pageKind,
      confidence: pageKind === 'unknown' ? 0.45 : 0.9,
      capabilityStates: capabilityStatesFor(pageKind, document),
    });
  },
  async extractProduct(document) {
    const payload = readWeeeProductPayload(document) ?? readProductJsonLd(document);

    return normalizedProductSchema.parse({
      sourceStoreId: 'weee',
      sourceUrl:
        payload?.sourceUrl ??
        document.URL ??
        'https://www.sayweee.com/en/product/shopflow',
      title: payload?.title ?? readText(document, productSelectors.title),
      imageUrl: payload?.imageUrl ?? readImageUrl(document, productSelectors.image),
      price:
        payload?.price ??
        parseMoney(readText(document, productSelectors.price, true)),
      sku: payload?.sku ?? readText(document, productSelectors.sku, true),
    });
  },
  async extractSearchResults(document) {
    const payloadItems = analyzeWeeeSearchPayload(document).items;
    if (payloadItems.length > 0) {
      return searchResultItemSchema.array().parse(payloadItems);
    }

    const items = queryAll(document, searchSelectors.item);

    return searchResultItemSchema.array().parse(
      items.map((item, index) => ({
        sourceStoreId: 'weee',
        sourceUrl: readRequiredOwnedUrl(item, searchSelectors.url),
        title: readText(item, [searchSelectors.title]),
        price: parseMoney(readText(item, [searchSelectors.price], true)),
        position: index,
      }))
    );
  },
};

function detectWeeePageKind(
  url: URL,
  document: Document
): DetectionResult['pageKind'] {
  const fixtureKind =
    document.querySelector<HTMLElement>('[data-page-kind]')?.dataset.pageKind;

  if (
    fixtureKind === 'product' ||
    fixtureKind === 'search' ||
    fixtureKind === 'account' ||
    fixtureKind === 'unsupported'
  ) {
    return fixtureKind;
  }

  const path = url.pathname.toLowerCase();

  if (path.includes('/account')) {
    return 'account';
  }

  if (path.includes('/search') || hasAnySelector(document, searchSelectors.item)) {
    return 'search';
  }

  if (
    path.includes('/product') ||
    path.includes('/goods') ||
    hasAnySelector(document, productSelectors.title)
  ) {
    return 'product';
  }

  return 'unknown';
}

function capabilityStatesFor(
  pageKind: DetectionResult['pageKind'],
  document: ParentNode
): CapabilityState[] {
  const supportedExtractionPage = pageKind === 'product' || pageKind === 'search';
  const productIntegrity = resolveProductIntegrity(document);
  const searchIntegrity = resolveSearchIntegrity(document);
  const exportReady =
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
          ? 'Weee product extraction can reuse product JSON-LD before falling back to storefront PDP selectors.'
          : `Weee product page was detected, but the current DOM snapshot is missing ${productIntegrity.detail}.`
        : `Weee product extraction only applies on product pages, not ${describePageKind(pageKind)}.`
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
          ? 'Weee search extraction can reuse page-owned Next payload data when the page exposes serialized search products, with DOM cards kept as fallback.'
          : searchIntegrity.kind === 'missing_required_fields'
            ? `Weee search page was detected, but at least one result row is missing ${searchIntegrity.detail}.`
            : `Weee search page was detected, but the current DOM snapshot is missing ${searchIntegrity.detail}.`
        : `Weee search extraction only applies on search pages, not ${describePageKind(pageKind)}.`
    ),
    capabilityState(
      'extract_deals',
      'unsupported_page',
      'UNSUPPORTED_PAGE',
      'Weee Wave 3 does not claim differentiated deals support.'
    ),
    capabilityState(
      'run_action',
      supportedExtractionPage ? 'not_implemented' : 'unsupported_page',
      supportedExtractionPage ? 'NOT_IMPLEMENTED' : 'UNSUPPORTED_PAGE',
      supportedExtractionPage
        ? 'Weee is intentionally a storefront shell in Wave 3 and does not expose action workflows.'
        : `Weee action workflows do not apply on ${describePageKind(pageKind)} pages.`
    ),
    capabilityState(
      'export_data',
      exportReady ? 'ready' : exportState.status,
      exportReady ? undefined : exportState.reasonCode,
      exportReady
        ? 'Weee export can ride on extracted product or search payloads.'
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
    return createBlockedExportState('Weee product', productIntegrity);
  }

  if (pageKind === 'search') {
    return createBlockedExportState('Weee search', searchIntegrity);
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
  const payloadAnalysis = analyzeWeeeProductPayload(document);

  if (
    payloadAnalysis.item ||
    hasProductJsonLd(document) ||
    hasAnySelector(document, productSelectors.title)
  ) {
    return { kind: 'ready' };
  }

  if (payloadAnalysis.missingDetail) {
    return {
      kind: 'missing_required_fields',
      detail: payloadAnalysis.missingDetail,
    };
  }

  return {
    kind: 'missing_surface',
    detail: 'supported product title selectors, page-owned product payloads, or product JSON-LD',
  };
}

function resolveSearchIntegrity(document: ParentNode): SurfaceIntegrity {
  const payloadAnalysis = analyzeWeeeSearchPayload(document);
  if (payloadAnalysis.items.length > 0) {
    return { kind: 'ready' };
  }

  const domIntegrity = resolveCollectionIntegrity(
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
        isSatisfied: (item) => hasOwnedUrl(item, searchSelectors.url),
      },
    ]
  );

  if (domIntegrity.kind === 'ready' || !payloadAnalysis.malformedDetail) {
    return domIntegrity;
  }

  return {
    kind: 'missing_required_fields',
    detail: payloadAnalysis.malformedDetail,
  };
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

  for (const item of items) {
    for (const requirement of requirements) {
      if (!requirement.isSatisfied(item)) {
        return {
          kind: 'missing_required_fields',
          detail: requirement.detail,
        };
      }
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
  return Array.from(root.querySelectorAll(selectors.join(', ')));
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
    const image = root.querySelector<HTMLImageElement>(selector);
    const value = readImageCandidate(image, root);
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
  return root.querySelector(selector)?.getAttribute(attribute)?.trim() ?? undefined;
}

function readRequiredOwnedUrl(root: ParentNode, selector: string): string {
  const value = resolveOwnedUrl(root, selector);
  if (value) {
    return value;
  }

  throw new Error(`Missing actionable Weee URL for selector: ${selector}`);
}

function hasOwnedUrl(root: ParentNode, selector: string) {
  return Boolean(resolveOwnedUrl(root, selector));
}

function hasSupportedWebProtocol(url: URL) {
  return url.protocol === 'https:' || url.protocol === 'http:';
}

function resolveOwnedUrl(root: ParentNode, selector: string): string | undefined {
  const rawValue = readAttribute(root, selector, 'href');
  if (!rawValue) {
    return undefined;
  }

  const trimmed = rawValue.trim();
  if (trimmed.startsWith('#')) {
    return undefined;
  }

  try {
    const resolved = new URL(trimmed, resolveDocumentUrl(root));
    if (!hasSupportedWebProtocol(resolved)) {
      return undefined;
    }

    if (resolved.hostname !== 'www.sayweee.com') {
      return undefined;
    }

    return resolved.toString();
  } catch {
    return undefined;
  }
}

function resolveDocumentUrl(root: ParentNode): string {
  const ownerDocument = root instanceof Document ? root : root.ownerDocument;
  if (ownerDocument?.URL && ownerDocument.URL !== 'about:blank') {
    try {
      const resolved = new URL(ownerDocument.URL);
      if (
        resolved.hostname === 'www.sayweee.com' &&
        (resolved.protocol === 'https:' || resolved.protocol === 'http:')
      ) {
        return ownerDocument.URL;
      }
    } catch {
      // Fall back to the deterministic Weee base below.
    }
  }

  return 'https://www.sayweee.com/';
}

function hasText(root: ParentNode, selectors: readonly string[]) {
  return selectors.some((selector) =>
    Boolean(root.querySelector(selector)?.textContent?.trim())
  );
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

type SearchPayloadItem = {
  sourceStoreId: 'weee';
  title: string;
  sourceUrl: string;
  imageUrl?: string;
  price?: ReturnType<typeof parseMoney>;
  position: number;
};

type ProductJsonLdPayload = {
  title?: string;
  sourceUrl?: string;
  imageUrl?: string;
  price?: ReturnType<typeof parseMoney>;
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
      ? offer.price.trim().startsWith('$')
        ? offer.price
        : `$${offer.price}`
      : offer && typeof offer.price === 'number'
        ? `$${offer.price.toFixed(2)}`
        : undefined;

  return {
    title: typeof record.name === 'string' ? record.name.trim() : undefined,
    sourceUrl: resolveKnownDocumentUrl(
      typeof record.url === 'string' ? record.url : undefined,
      documentUrl,
      'https://www.sayweee.com/'
    ),
    imageUrl: resolveProductJsonLdImage(record.image, documentUrl),
    price: parseMoney(rawPrice),
    sku:
      typeof record.sku === 'string'
        ? record.sku.trim()
        : typeof record.productID === 'string'
          ? record.productID.trim()
          : undefined,
  };
}

function resolveProductJsonLdImage(image: unknown, documentUrl: string) {
  const rawCandidate = Array.isArray(image)
    ? image.find((entry) => typeof entry === 'string')
    : typeof image === 'string'
      ? image
      : undefined;

  return resolveKnownDocumentUrl(
    rawCandidate,
    documentUrl,
    'https://www.sayweee.com/'
  );
}

type SearchPayloadSeed = Omit<SearchPayloadItem, 'sourceStoreId' | 'position'>;
type WeeePayloadAnalysis<T> = {
  items: T[];
  malformedDetail?: string;
};
type WeeePayloadParseResult<T> = {
  item?: T;
  missingDetail?: string;
};
type WeeeProductPayload = {
  id?: number;
  name?: string;
  title?: string;
  img?: string;
  primary_img?: string;
  img_urls?: unknown;
  price?: number | string;
  base_price?: number | string;
  list_price?: number | string;
  view_link?: string;
  slug?: string;
  url?: string;
  canonical_url?: string;
  product_id?: string;
  goods_id?: string;
  sku?: string;
};

type WeeeSearchPayloadProduct = {
  id?: number;
  name?: string;
  img?: string;
  img_urls?: unknown;
  price?: number | string;
  base_price?: number | string;
  list_price?: number | string;
  view_link?: string;
  slug?: string;
};

function analyzeWeeeSearchPayload(
  document: ParentNode
): WeeePayloadAnalysis<SearchPayloadItem> {
  const ownerDocument = document instanceof Document ? document : document.ownerDocument;
  if (!ownerDocument) {
    return {
      items: [],
    };
  }

  const seen = new Set<string>();
  const payloadItems: SearchPayloadItem[] = [];
  let malformedDetail: string | undefined;

  for (const product of readWeeeSearchPayloadProducts(ownerDocument)) {
    const parsed = parseWeeeSearchPayloadItem(product, ownerDocument.URL);
    if (!parsed.item) {
      malformedDetail ??= parsed.missingDetail;
      continue;
    }

    const item = parsed.item;
    const key = `${item.sourceUrl}::${item.title}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    payloadItems.push({
      ...item,
      sourceStoreId: 'weee',
      position: payloadItems.length,
    });
  }

  return {
    items: payloadItems,
    malformedDetail,
  };
}

function readWeeeSearchPayloadProducts(
  document: Document
): WeeeSearchPayloadProduct[] {
  const products: WeeeSearchPayloadProduct[] = [];
  const seen = new Set<string>();
  const scripts = Array.from(document.querySelectorAll('script'))
    .map((script) => script.textContent ?? '')
    .filter(
      (scriptText) =>
        scriptText.includes('__next_f.push') && scriptText.includes('products')
    );

  for (const scriptText of scripts) {
    for (const chunk of readWeeeRscChunks(scriptText)) {
      for (const arrayText of extractJsonArraysForKey(chunk, '"products":[')) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(arrayText);
        } catch {
          continue;
        }

        if (!Array.isArray(parsed)) {
          continue;
        }

        for (const entry of parsed) {
          if (!isWeeeSearchPayloadProduct(entry)) {
            continue;
          }

          const key = readWeeeSearchPayloadProductKey(entry);
          if (seen.has(key)) {
            continue;
          }

          seen.add(key);
          products.push(entry);
        }
      }
    }
  }

  return products;
}

function readWeeeProductPayload(root: ParentNode): ProductJsonLdPayload | undefined {
  return analyzeWeeeProductPayload(root).item;
}

function analyzeWeeeProductPayload(
  root: ParentNode
): WeeePayloadParseResult<ProductJsonLdPayload> {
  const ownerDocument = root instanceof Document ? root : root.ownerDocument;
  if (!ownerDocument) {
    return {};
  }

  let malformedDetail: string | undefined;
  for (const product of readWeeeProductPayloadEntries(ownerDocument)) {
    const parsed = parseWeeeProductPayload(product, ownerDocument.URL);
    if (parsed.item) {
      return parsed;
    }

    malformedDetail ??= parsed.missingDetail;
  }

  return malformedDetail ? { missingDetail: malformedDetail } : {};
}

function readWeeeProductPayloadEntries(document: Document): WeeeProductPayload[] {
  const products: WeeeProductPayload[] = [];
  const seen = new Set<string>();
  const scripts = Array.from(document.querySelectorAll('script'))
    .map((script) => script.textContent ?? '')
    .filter(
      (scriptText) =>
        scriptText.includes('__next_f.push') &&
        (scriptText.includes('productDetail') ||
          scriptText.includes('"product":{') ||
          scriptText.includes('"goods":{'))
    );

  for (const scriptText of scripts) {
    for (const chunk of readWeeeRscChunks(scriptText)) {
      for (const key of ['"productDetail":{', '"product":{', '"goods":{']) {
        for (const objectText of extractJsonObjectsForKey(chunk, key)) {
          let parsed: unknown;
          try {
            parsed = JSON.parse(objectText);
          } catch {
            continue;
          }

          if (!isWeeeProductPayload(parsed)) {
            continue;
          }

          const dedupeKey = readWeeeProductPayloadKey(parsed);
          if (seen.has(dedupeKey)) {
            continue;
          }

          seen.add(dedupeKey);
          products.push(parsed);
        }
      }
    }
  }

  return products;
}

function readWeeeRscChunks(scriptText: string): string[] {
  return Array.from(
    scriptText.matchAll(
      /self\.__next_f\.push\(\[\s*\d+\s*,\s*"([\s\S]*?)"\s*,?\s*\]\);?/g
    ),
    (match) => decodeWeeeRscChunk(match[1])
  );
}

function decodeWeeeRscChunk(chunk: string): string {
  return chunk
    .replace(/\\\\"/g, '"')
    .replace(/\\"/g, '"')
    .replace(/\\\\u([\da-fA-F]{4})/g, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16))
    )
    .replace(/\\u([\da-fA-F]{4})/g, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16))
    )
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\\\\//g, '/')
    .replace(/\\\//g, '/');
}

function extractJsonArraysForKey(text: string, key: string): string[] {
  const arrays: string[] = [];
  let searchFrom = 0;

  while (searchFrom < text.length) {
    const keyIndex = text.indexOf(key, searchFrom);
    if (keyIndex === -1) {
      break;
    }

    const arrayStart = keyIndex + key.length - 1;
    const arrayText = readBalancedJsonArray(text, arrayStart);
    if (arrayText) {
      arrays.push(arrayText);
      searchFrom = arrayStart + arrayText.length;
      continue;
    }

    searchFrom = keyIndex + key.length;
  }

  return arrays;
}

function extractJsonObjectsForKey(text: string, key: string): string[] {
  const objects: string[] = [];
  let searchFrom = 0;

  while (searchFrom < text.length) {
    const keyIndex = text.indexOf(key, searchFrom);
    if (keyIndex === -1) {
      break;
    }

    const objectStart = keyIndex + key.length - 1;
    const objectText = readBalancedJsonObject(text, objectStart);
    if (objectText) {
      objects.push(objectText);
      searchFrom = objectStart + objectText.length;
      continue;
    }

    searchFrom = keyIndex + key.length;
  }

  return objects;
}

function readBalancedJsonArray(
  text: string,
  startIndex: number
): string | undefined {
  if (text[startIndex] !== '[') {
    return undefined;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const character = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === '\\') {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === '[') {
      depth += 1;
      continue;
    }

    if (character === ']') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  return undefined;
}

function readBalancedJsonObject(
  text: string,
  startIndex: number
): string | undefined {
  if (text[startIndex] !== '{') {
    return undefined;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const character = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === '\\') {
      escaped = true;
      continue;
    }

    if (character === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (character === '{') {
      depth += 1;
      continue;
    }

    if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  return undefined;
}

function isWeeeSearchPayloadProduct(
  value: unknown
): value is WeeeSearchPayloadProduct {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const product = value as Record<string, unknown>;
  return (
    typeof product.name === 'string' ||
    typeof product.view_link === 'string' ||
    typeof product.slug === 'string' ||
    typeof product.id === 'number'
  );
}

function isWeeeProductPayload(value: unknown): value is WeeeProductPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const product = value as Record<string, unknown>;
  return (
    typeof product.name === 'string' ||
    typeof product.title === 'string' ||
    typeof product.view_link === 'string' ||
    typeof product.slug === 'string' ||
    typeof product.id === 'number'
  );
}

function readWeeeSearchPayloadProductKey(
  product: WeeeSearchPayloadProduct
): string {
  if (typeof product.view_link === 'string' && product.view_link.trim()) {
    return product.view_link.trim();
  }

  if (typeof product.slug === 'string' && product.slug.trim()) {
    return product.slug.trim();
  }

  if (typeof product.id === 'number') {
    return String(product.id);
  }

  return product.name?.trim() ?? 'weee-search-product';
}

function readWeeeProductPayloadKey(product: WeeeProductPayload): string {
  return (
    product.view_link?.trim() ||
    product.slug?.trim() ||
    product.product_id?.trim() ||
    product.goods_id?.trim() ||
    product.sku?.trim() ||
    (typeof product.id === 'number' ? String(product.id) : undefined) ||
    product.name?.trim() ||
    product.title?.trim() ||
    'weee-product-payload'
  );
}

function parseWeeeSearchPayloadItem(
  product: WeeeSearchPayloadProduct,
  documentUrl: string
): WeeePayloadParseResult<SearchPayloadSeed> {
  const title = product.name?.trim();
  const sourceUrl = resolveKnownDocumentUrl(
    typeof product.view_link === 'string'
      ? product.view_link
      : typeof product.slug === 'string'
        ? `/en/product/${product.slug}`
        : undefined,
    documentUrl,
    'https://www.sayweee.com/'
  );

  if (!title) {
    return {
      missingDetail: 'a result title',
    };
  }

  if (!sourceUrl) {
    return {
      missingDetail: 'a result URL',
    };
  }

  return {
    item: {
      title,
      sourceUrl,
      imageUrl: readWeeeSearchPayloadImageUrl(product, documentUrl),
      price: parseMoney(readWeeeSearchPayloadPriceDisplayText(product)),
    },
  };
}

function parseWeeeProductPayload(
  product: WeeeProductPayload,
  documentUrl: string
): WeeePayloadParseResult<ProductJsonLdPayload> {
  const title = product.name?.trim() || product.title?.trim();
  if (!title) {
    return {
      missingDetail: 'a product title',
    };
  }

  const sourceUrl = resolveKnownDocumentUrl(
    typeof product.view_link === 'string'
      ? product.view_link
      : typeof product.url === 'string'
        ? product.url
        : typeof product.canonical_url === 'string'
          ? product.canonical_url
          : typeof product.slug === 'string'
            ? `/en/product/${product.slug}`
            : undefined,
    documentUrl,
    'https://www.sayweee.com/'
  );

  return {
    item: {
      title,
      sourceUrl,
      imageUrl: readWeeeSearchPayloadImageUrl(product, documentUrl),
      price: parseMoney(readWeeeSearchPayloadPriceDisplayText(product)),
      sku:
        product.product_id?.trim() ||
        product.goods_id?.trim() ||
        product.sku?.trim() ||
        (typeof product.id === 'number' ? String(product.id) : undefined),
    },
  };
}

function readWeeeSearchPayloadImageUrl(
  product: WeeeSearchPayloadProduct | WeeeProductPayload,
  documentUrl: string
) {
  const rawImage =
    'primary_img' in product &&
    typeof product.primary_img === 'string' &&
    product.primary_img.trim()
      ? product.primary_img
      : typeof product.img === 'string' && product.img.trim()
      ? product.img
      : Array.isArray(product.img_urls)
        ? product.img_urls.find(
            (entry): entry is string =>
              typeof entry === 'string' && entry.trim().length > 0
          )
        : undefined;

  return resolveKnownDocumentUrl(
    rawImage,
    documentUrl,
    'https://www.sayweee.com/'
  );
}

function readWeeeSearchPayloadPriceDisplayText(
  product: WeeeSearchPayloadProduct | WeeeProductPayload
) {
  const rawPrice = [
    product.price,
    product.base_price,
    product.list_price,
  ].find((candidate) => {
    if (typeof candidate === 'number') {
      return Number.isFinite(candidate);
    }

    return typeof candidate === 'string' && candidate.trim().length > 0;
  });

  if (typeof rawPrice === 'number' && Number.isFinite(rawPrice)) {
    return `$${rawPrice.toFixed(2)}`;
  }

  if (typeof rawPrice === 'string' && rawPrice.trim()) {
    return rawPrice;
  }

  return undefined;
}

function resolveKnownDocumentUrl(
  value: string | undefined,
  documentUrl: string,
  fallbackBaseUrl: string
): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  try {
    return new URL(value, documentUrl || fallbackBaseUrl).toString();
  } catch {
    try {
      return new URL(value, fallbackBaseUrl).toString();
    } catch {
      return undefined;
    }
  }
}

function describePageKind(pageKind: DetectionResult['pageKind']) {
  return pageKind === 'unknown' ? 'this unmatched page' : `${pageKind} pages`;
}

function readImageCandidate(
  image: HTMLImageElement | null,
  root: ParentNode
): string | undefined {
  if (!image) {
    return undefined;
  }

  const rawCandidate = [
    image.getAttribute('src'),
    image.getAttribute('data-src'),
    image.getAttribute('data-lazy-src'),
    image.getAttribute('data-srcset'),
    image.getAttribute('srcset'),
    image.currentSrc,
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
      : ownerDocument?.baseURI;

  if (!baseUrl) {
    return rawValue;
  }

  try {
    return new URL(rawValue, baseUrl).toString();
  } catch {
    return rawValue;
  }
}
