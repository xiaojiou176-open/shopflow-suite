import {
  capabilityStateSchema,
  dealItemSchema,
  detectionResultSchema,
  normalizedProductSchema,
  searchResultItemSchema,
  type CapabilityState,
  type DetectionResult,
  type StoreAdapter,
} from '@shopflow/contracts';

const hostPatterns = ['*://www.target.com/*'];

const productSelectors = {
  title: ['[data-shopflow-product-title]'],
  price: ['[data-shopflow-product-price]'],
  image: ['[data-shopflow-product-image]'],
  sku: ['[data-shopflow-product-sku]'],
} as const;

const searchSelectors = {
  item: ['[data-shopflow-search-item]'],
  title: '[data-shopflow-search-title]',
  price: '[data-shopflow-search-price]',
  url: '[data-shopflow-search-url]',
} as const;

const dealSelectors = {
  item: ['[data-shopflow-deal-item]', '[data-test="deal-card"]'],
  title: '[data-shopflow-deal-title], [data-test="deal-title"]',
  label: '[data-shopflow-deal-label], [data-test="deal-badge"]',
  price: '[data-shopflow-deal-price], [data-test="deal-price"]',
  url: '[data-shopflow-deal-url], [data-test="deal-link"]',
} as const;

export const targetAdapter: StoreAdapter = {
  storeId: 'target',
  verifiedScopes: ['target'],
  matches(url) {
    return url.hostname === 'www.target.com';
  },
  detect(url, document) {
    const pageKind = detectTargetPageKind(url, document);
    return detectionResultSchema.parse({
      storeId: 'target',
      verifiedScopes: ['target'],
      matchedHost: url.hostname,
      pageKind,
      confidence: pageKind === 'unknown' ? 0.4 : 0.9,
      capabilityStates: capabilityStatesFor(pageKind, document, url),
    });
  },
  async extractProduct(document) {
    const payload = readProductJsonLd(document);

    return normalizedProductSchema.parse({
      sourceStoreId: 'target',
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
    const payloadResults = await readTargetSearchPayloadResults(document);
    if (payloadResults.length > 0) {
      return searchResultItemSchema.array().parse(payloadResults);
    }

    const items = queryAll(document, searchSelectors.item);

    return searchResultItemSchema.array().parse(
      items.map((item, index) => ({
        sourceStoreId: 'target',
        sourceUrl: readRequiredAttribute(item, searchSelectors.url, 'href'),
        title: readText(item, [searchSelectors.title]),
        price: parseMoney(readText(item, [searchSelectors.price], true)),
        position: index,
      }))
    );
  },
  async extractDeals(document) {
    const items = queryAll(document, dealSelectors.item);

    return dealItemSchema.array().parse(
      items.map((item) => ({
        sourceStoreId: 'target',
        sourceUrl: readRequiredAttribute(item, dealSelectors.url, 'href'),
        title: readText(item, [dealSelectors.title]),
        dealLabel: readText(item, [dealSelectors.label]),
        price: parseMoney(readText(item, [dealSelectors.price], true)),
      }))
    );
  },
};

export { hostPatterns as targetHostPatterns };

export function createTargetPreviewDetection(
  pageKind: DetectionResult['pageKind'] = 'unknown'
): DetectionResult {
  const previewDocument = document.implementation.createHTMLDocument('target-preview');
  const previewUrl =
    pageKind === 'search'
      ? new URL('https://www.target.com/s?searchTerm=preview')
      : pageKind === 'deal'
        ? new URL('https://www.target.com/pl/deals')
        : new URL('https://www.target.com/p/preview');

  return detectionResultSchema.parse({
    storeId: 'target',
    verifiedScopes: ['target'],
    matchedHost: previewUrl.hostname,
    pageKind,
    confidence: pageKind === 'unknown' ? 0.4 : 0.9,
    capabilityStates: capabilityStatesFor(pageKind, previewDocument, previewUrl),
  });
}

function detectTargetPageKind(
  url: URL,
  document: Document
): DetectionResult['pageKind'] {
  const fixtureKind =
    document.querySelector<HTMLElement>('[data-page-kind]')?.dataset.pageKind;
  if (fixtureKind === 'product' || fixtureKind === 'search' || fixtureKind === 'deal') {
    return fixtureKind;
  }

  const path = url.pathname;

  if (path.includes('/c/')) {
    return 'search';
  }

  if (path.includes('/pl/') || path.includes('/deals')) {
    return 'deal';
  }

  if (path.includes('/p/') || hasAnySelector(document, productSelectors.title)) {
    return 'product';
  }

  if (hasAnySelector(document, searchSelectors.item)) {
    return 'search';
  }

  if (hasAnySelector(document, dealSelectors.item)) {
    return 'deal';
  }

  return 'unknown';
}

function capabilityStatesFor(
  pageKind: DetectionResult['pageKind'],
  document: ParentNode,
  url: URL
): CapabilityState[] {
  const productIntegrity = resolveProductIntegrity(document);
  const searchIntegrity = resolveSearchIntegrity(document, url);
  const dealIntegrity = resolveDealIntegrity(document);
  const exportReady =
    (pageKind === 'product' && productIntegrity.kind === 'ready') ||
    (pageKind === 'search' && searchIntegrity.kind === 'ready') ||
    (pageKind === 'deal' && dealIntegrity.kind === 'ready');
  const exportState = resolveExportState(
    pageKind,
    productIntegrity,
    searchIntegrity,
    dealIntegrity
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
          ? 'Target product extraction can reuse product JSON-LD before falling back to storefront PDP selectors.'
          : `Target product page was detected, but the current DOM snapshot is missing ${productIntegrity.detail}.`
        : `Target product extraction only applies on product pages, not ${describePageKind(pageKind)}.`
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
          ? 'Target search extraction can use page-owned search data when the page exposes Target runtime context, with DOM cards kept as fallback.'
          : searchIntegrity.kind === 'missing_required_fields'
            ? `Target search page was detected, but at least one result row is missing ${searchIntegrity.detail}.`
            : `Target search page was detected, but the current DOM snapshot is missing ${searchIntegrity.detail}.`
        : `Target search extraction only applies on search pages, not ${describePageKind(pageKind)}.`
    ),
    capabilityState(
      'extract_deals',
      pageKind === 'deal'
        ? dealIntegrity.kind === 'ready'
          ? 'ready'
          : 'degraded'
        : 'unsupported_page',
      pageKind === 'deal'
        ? dealIntegrity.kind === 'missing_required_fields'
          ? 'PARSE_FAILED'
          : dealIntegrity.kind === 'ready'
            ? undefined
            : 'SELECTOR_MISSING'
        : 'UNSUPPORTED_PAGE',
      pageKind === 'deal'
        ? dealIntegrity.kind === 'ready'
          ? 'Target differentiated deals support is fixture-backed for Wave 1.'
          : dealIntegrity.kind === 'missing_required_fields'
            ? `Target deal page was detected, but at least one deal row is missing ${dealIntegrity.detail}.`
            : `Target deal page was detected, but the current DOM snapshot is missing ${dealIntegrity.detail}.`
        : `Target deals only apply on deal pages, not ${describePageKind(pageKind)}.`
    ),
    capabilityState(
      'run_action',
      'unsupported_page',
      'UNSUPPORTED_PAGE',
      'Target is not an action-heavy product in Wave 1.'
    ),
    capabilityState(
      'export_data',
      exportReady ? 'ready' : exportState.status,
      exportReady ? undefined : exportState.reasonCode,
      exportReady
        ? 'Target export can ride on the extracted payload.'
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
  searchIntegrity: SurfaceIntegrity,
  dealIntegrity: SurfaceIntegrity
) {
  if (pageKind === 'product') {
    return createBlockedExportState('Target product', productIntegrity);
  }

  if (pageKind === 'search') {
    return createBlockedExportState('Target search', searchIntegrity);
  }

  if (pageKind === 'deal') {
    return createBlockedExportState('Target deal', dealIntegrity);
  }

  return {
    status: 'unsupported_page' as const,
    reasonCode: 'UNSUPPORTED_PAGE' as const,
    reasonMessage: `Export only applies on product, search, or deal pages, not ${describePageKind(pageKind)}.`,
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

function resolveSearchIntegrity(
  document: ParentNode,
  url: URL
): SurfaceIntegrity {
  if (hasTargetSearchApiContext(document, url)) {
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

function resolveDealIntegrity(document: ParentNode): SurfaceIntegrity {
  return resolveCollectionIntegrity(
    document,
    dealSelectors.item,
    'supported deal cards',
    [
      {
        detail: 'a deal title',
        isSatisfied: (item) => hasText(item, [dealSelectors.title]),
      },
      {
        detail: 'a deal label',
        isSatisfied: (item) => hasText(item, [dealSelectors.label]),
      },
      {
        detail: 'a deal URL',
        isSatisfied: (item) => hasAttribute(item, dealSelectors.url, 'href'),
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
    throw new Error('Missing navigated document URL for Target extraction');
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

type TargetSearchApiContext = {
  apiKey: string;
  baseUrl: string;
  pagesPath: string;
  visitorId: string;
  zipCode: string;
  storeId: string;
  storeIds: string;
  latitude: string;
  longitude: string;
  state: string;
  keyword: string;
};

type TargetSearchApiProduct = {
  item?: {
    product_description?: {
      title?: string;
    };
    enrichment?: {
      buy_url?: string;
      image_info?: {
        primary_image?: {
          url?: string;
        };
      };
    };
  };
  price?: {
    current_retail?: number;
    formatted_current_price?: string;
  };
};

function hasTargetSearchApiContext(root: ParentNode, url: URL) {
  return Boolean(readTargetSearchApiContext(root, url));
}

async function readTargetSearchPayloadResults(document: Document) {
  const context = readTargetSearchApiContext(
    document,
    new URL(document.URL || 'https://www.target.com/')
  );
  if (!context || typeof fetch !== 'function') {
    return [];
  }

  try {
    const response = await fetch(buildTargetSearchApiUrl(context), {
      credentials: 'include',
    });
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as {
      data_source_modules?: Array<{
        module_type?: string;
        module_data?: {
          search_response?: {
            products?: TargetSearchApiProduct[];
          };
        };
      }>;
    };

    const searchModule = payload.data_source_modules?.find(
      (module) => module.module_type === 'SearchWebDataSource'
    );
    const products = searchModule?.module_data?.search_response?.products ?? [];

    return products
      .map((product, index) => toTargetSearchResultItem(product, document.URL, index))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  } catch {
    return [];
  }
}

function toTargetSearchResultItem(
  product: TargetSearchApiProduct,
  documentUrl: string,
  index: number
) {
  const title = product.item?.product_description?.title?.trim();
  const sourceUrl = resolveJsonLdUrl(
    product.item?.enrichment?.buy_url,
    documentUrl
  );
  if (!title || !sourceUrl) {
    return undefined;
  }

  const imageUrl = resolveJsonLdUrl(
    product.item?.enrichment?.image_info?.primary_image?.url,
    documentUrl
  );
  const amount = product.price?.current_retail;
  const displayText = product.price?.formatted_current_price;
  const price =
    amount != null &&
    Number.isFinite(amount) &&
    typeof displayText === 'string' &&
    displayText.trim()
      ? {
          currency: 'USD',
          amount,
          displayText,
        }
      : displayText
        ? parseMoney(displayText)
        : undefined;

  return {
    sourceStoreId: 'target' as const,
    sourceUrl,
    title,
    imageUrl,
    price,
    position: index,
  };
}

function readTargetSearchApiContext(root: ParentNode, url: URL) {
  const fixtureKeyword = readFixtureSearchKeyword(root);
  const isTargetSearchUrl = url.hostname === 'www.target.com' && url.pathname === '/s';
  if (!isTargetSearchUrl && !fixtureKeyword) {
    return undefined;
  }

  const keyword = url.searchParams.get('searchTerm')?.trim() ?? fixtureKeyword;
  if (!keyword) {
    return undefined;
  }

  const scriptText = readTargetRuntimeText(root);
  if (!scriptText) {
    return undefined;
  }

  const apiKey = readTargetApiKey(scriptText);
  const baseUrl = readTargetCduiBaseUrl(scriptText);
  const pagesPath = readTargetCduiPagesPath(scriptText);
  const visitorId = readTargetVisitorId(root, scriptText);
  const location = readTargetServerLocation(scriptText);

  if (!apiKey || !baseUrl || !pagesPath || !visitorId || !location) {
    return undefined;
  }

  return {
    apiKey,
    baseUrl,
    pagesPath,
    visitorId,
    keyword,
    ...location,
  } satisfies TargetSearchApiContext;
}

function buildTargetSearchApiUrl(context: TargetSearchApiContext) {
  const searchPath = `/s/${encodeURIComponent(context.keyword)}`;
  const params = new URLSearchParams({
    key: context.apiKey,
    platform: 'WEB',
    sapphire_channel: 'WEB',
    sapphire_page: searchPath,
    channel: 'WEB',
    page: searchPath,
    visitor_id: context.visitorId,
    purchasable_store_ids: context.storeIds,
    latitude: context.latitude,
    longitude: context.longitude,
    state: context.state,
    store_id: context.storeId,
    zip: context.zipCode,
    has_pending_inputs: 'false',
    offset: '0',
    keyword: context.keyword,
    count: '24',
    default_purchasability_filter: 'true',
    include_sponsored: 'true',
    new_search: 'true',
    spellcheck: 'true',
    store_ids: context.storeIds,
    is_seo_bot: 'false',
    include_data_source_modules: 'true',
    query_string: `searchTerm=${context.keyword}`,
    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'America/Los_Angeles',
  });

  return new URL(
    `${context.pagesPath.replace(/^\//, '')}/slp?${params.toString()}`,
    `${context.baseUrl.replace(/\/$/, '')}/`
  ).toString();
}

function readTargetRuntimeText(root: ParentNode) {
  const ownerDocument = root instanceof Document ? root : root.ownerDocument;
  if (!ownerDocument) {
    return undefined;
  }

  const raw = Array.from(
    ownerDocument.querySelectorAll<HTMLScriptElement>('script')
  )
    .map((script) => script.textContent?.trim() ?? '')
    .join('\n');

  return raw ? raw.replace(/\\"/g, '"').replace(/\s+/g, ' ') : undefined;
}

function readTargetApiKey(scriptText: string) {
  return (
    scriptText.match(/"apiKeyProduction"\s*:\s*"([a-f0-9]{40})"/)?.[1] ??
    scriptText.match(/"apiKey"\s*:\s*"([a-f0-9]{40})"/)?.[1]
  );
}

function readTargetCduiBaseUrl(scriptText: string) {
  return scriptText.match(
    /"cduiOrchestrations"\s*:\s*\{\s*"baseUrl"\s*:\s*"([^"]+)"/
  )?.[1];
}

function readTargetCduiPagesPath(scriptText: string) {
  return (
    scriptText.match(
      /"endpointPaths"\s*:\s*\{\s*"pagesV1"\s*:\s*"([^"]+)"/
    )?.[1] ??
    'cdui_orchestrations/v1/pages'
  );
}

function readTargetVisitorId(root: ParentNode, scriptText: string) {
  const ownerDocument = root instanceof Document ? root : root.ownerDocument;
  const cookieMatch = ownerDocument?.cookie.match(/(?:^|;\s*)visitorId=([^;]+)/);
  return (
    cookieMatch?.[1] ??
    scriptText.match(/"visitorId"\s*:\s*"([A-Z0-9]+)"/)?.[1] ??
    scriptText.match(/"visitor_id"\s*:\s*"([A-Z0-9]+)"/)?.[1]
  );
}

function readTargetServerLocation(scriptText: string) {
  const match = scriptText.match(
    /"serverLocationVariables"\s*:\s*\{\s*"zipCode"\s*:\s*"([^"]+)"\s*,\s*"store_id"\s*:\s*"([^"]+)"\s*,\s*"store_ids"\s*:\s*"([^"]+)".*?"latitude"\s*:\s*"([^"]+)"\s*,\s*"longitude"\s*:\s*"([^"]+)"\s*,\s*"state"\s*:\s*"([^"]+)"/
  );
  if (!match) {
    return undefined;
  }

  const [, zipCode, storeId, storeIds, latitude, longitude, state] = match;
  return {
    zipCode,
    storeId,
    storeIds,
    latitude,
    longitude,
    state,
  };
}

function readFixtureSearchKeyword(root: ParentNode) {
  const ownerDocument = root instanceof Document ? root : root.ownerDocument;
  return ownerDocument?.querySelector<HTMLElement>('[data-shopflow-search-term]')
    ?.dataset.shopflowSearchTerm
    ?.trim();
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
