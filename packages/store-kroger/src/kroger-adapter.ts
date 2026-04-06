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

export const krogerHostPatterns = [
  '*://www.fredmeyer.com/*',
  '*://www.qfc.com/*',
] as const;

export const KROGER_VERIFIED_SCOPE_COPY =
  'Currently verified on Fred Meyer + QFC.';

const verifiedScopes = ['fred-meyer', 'qfc'] as const;
const KROGER_HOST_RE = /(^|\.)((fredmeyer|qfc)\.com)$/i;

const productSelectors = {
  title: [
    '[data-shopflow-product-title]',
    '[data-kroger-product-title]',
    '[data-testid="kroger-product-title"]',
    '[data-testid="product-details-name"]',
    'h1',
  ],
  price: [
    '[data-shopflow-product-price]',
    '[data-kroger-product-price]',
    '[data-testid="kroger-product-price"]',
    '[data-testid="product-details-price"]',
  ],
  image: [
    '[data-shopflow-product-image]',
    '[data-kroger-product-image]',
    '[data-testid="kroger-product-image"]',
    'img[data-testid="product-details-image"]',
    'img[src]',
  ],
  sku: [
    '[data-shopflow-product-sku]',
    '[data-kroger-product-sku]',
    '[data-testid="kroger-product-sku"]',
    '[data-testid="product-details-upc"]',
  ],
} as const;

const searchSelectors = {
  item: [
    '[data-shopflow-search-item]',
    '[data-kroger-search-item]',
    '[data-testid="kroger-search-item"]',
    '[data-testid="auto-grid-cell"]',
  ],
  title:
    '[data-shopflow-search-title], [data-kroger-search-title], [data-testid="kroger-search-title"], [data-testid="product-description"]',
  price:
    '[data-shopflow-search-price], [data-kroger-search-price], [data-testid="kroger-search-price"], [data-testid="product-price"]',
  url:
    '[data-shopflow-search-url], [data-testid="kroger-search-url"], a[href]',
} as const;

const dealSelectors = {
  item: [
    '[data-shopflow-deal-item]',
    '[data-kroger-deal-item]',
    '[data-testid="kroger-deal-item"]',
    '[data-testid="coupon-card"]',
    '[data-testid="offer-card"]',
  ],
  title:
    '[data-shopflow-deal-title], [data-kroger-deal-title], [data-testid="kroger-deal-title"], [data-testid="coupon-title"], [data-testid="offer-title"]',
  label:
    '[data-shopflow-deal-label], [data-kroger-deal-label], [data-testid="kroger-deal-label"], [data-testid="coupon-badge"], [data-testid="offer-badge"]',
  price:
    '[data-shopflow-deal-price], [data-kroger-deal-price], [data-testid="kroger-deal-price"], [data-testid="coupon-price"], [data-testid="offer-price"]',
  url:
    '[data-shopflow-deal-url], [data-testid="kroger-deal-url"], [data-testid="offer-link"], a[href]',
} as const;

const nonActionablePageKinds = new Set<DetectionResult['pageKind']>([
  'account',
  'unsupported',
  'unknown',
]);

export const krogerAdapter: StoreAdapter = {
  storeId: 'kroger',
  verifiedScopes: [...verifiedScopes],
  matches(url) {
    return KROGER_HOST_RE.test(url.hostname);
  },
  detect(url, document) {
    const pageKind = detectKrogerPageKind(url, document);

    return detectionResultSchema.parse({
      storeId: 'kroger',
      verifiedScopes: [...verifiedScopes],
      matchedHost: url.hostname,
      pageKind,
      confidence: pageKind === 'unknown' ? 0.45 : 0.9,
      capabilityStates: capabilityStatesFor(pageKind, document),
    });
  },
  async extractProduct(document) {
    const payload = readKrogerProductPayload(document) ?? readProductJsonLd(document);

    return normalizedProductSchema.parse({
      sourceStoreId: 'kroger',
      sourceUrl:
        payload?.sourceUrl ??
        document.URL ??
        'https://www.fredmeyer.com/p/shopflow-fixture',
      title: payload?.title ?? readText(document, productSelectors.title),
      imageUrl: payload?.imageUrl ?? readImageUrl(document, productSelectors.image),
      price:
        payload?.price ??
        parseMoney(readText(document, productSelectors.price, true)),
      sku: payload?.sku ?? readText(document, productSelectors.sku, true),
    });
  },
  async extractSearchResults(document) {
    const payloadItems = readKrogerSearchPayloadResults(document);
    if (payloadItems.length > 0) {
      return searchResultItemSchema.array().parse(payloadItems);
    }

    const items = queryAll(document, searchSelectors.item);

    return searchResultItemSchema.array().parse(
      items.map((item, index) => ({
        sourceStoreId: 'kroger',
        sourceUrl: readRequiredOwnedUrl(item, searchSelectors.url),
        title: readText(item, [searchSelectors.title]),
        price: parseMoney(readText(item, [searchSelectors.price], true)),
        position: index,
      }))
    );
  },
  async extractDeals(document) {
    const payloadItems = readKrogerDealPayloadResults(document);
    if (payloadItems.length > 0) {
      return dealItemSchema.array().parse(payloadItems);
    }

    const items = queryAll(document, dealSelectors.item);

    return dealItemSchema.array().parse(
      items.map((item) => ({
        sourceStoreId: 'kroger',
        sourceUrl: readRequiredOwnedUrl(item, dealSelectors.url),
        title: readText(item, [dealSelectors.title]),
        dealLabel: readText(item, [dealSelectors.label]),
        price: parseMoney(readText(item, [dealSelectors.price], true)),
      }))
    );
  },
};

function detectKrogerPageKind(
  url: URL,
  document: Document
): DetectionResult['pageKind'] {
  const fixtureKind =
    document.querySelector<HTMLElement>('[data-page-kind]')?.dataset.pageKind;
  if (
    fixtureKind === 'product' ||
    fixtureKind === 'search' ||
    fixtureKind === 'deal' ||
    fixtureKind === 'cart' ||
    fixtureKind === 'manage' ||
    fixtureKind === 'account' ||
    fixtureKind === 'unsupported'
  ) {
    return fixtureKind;
  }

  const path = url.pathname.toLowerCase();

  if (path.includes('/search')) {
    return 'search';
  }

  if (path.includes('/my-account') || path.includes('/account')) {
    return 'account';
  }

  if (path.includes('/cart')) {
    return 'cart';
  }

  if (
    path.includes('/savings') ||
    path.includes('/coupons') ||
    path.includes('/weekly-digital-deals')
  ) {
    return 'deal';
  }

  if (
    path.includes('/p/') ||
    path.includes('/product/') ||
    hasAnySelector(document, productSelectors.title)
  ) {
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
  document: ParentNode
): CapabilityState[] {
  const productIntegrity = resolveProductIntegrity(document);
  const searchIntegrity = resolveSearchIntegrity(document);
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
          ? 'Kroger family product extraction can reuse page-owned product payloads or product JSON-LD before falling back to family-safe PDP selectors on Fred Meyer + QFC.'
          : `Kroger family product page was detected, but the current DOM snapshot is missing ${productIntegrity.detail}.`
        : `Kroger family product extraction only applies on product pages, not ${describePageKind(pageKind)}.`
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
          ? 'Kroger family search extraction can reuse serialized family search payloads before falling back to family-safe DOM cards on Fred Meyer + QFC.'
          : searchIntegrity.kind === 'missing_required_fields'
            ? `Kroger family search page was detected, but at least one result row is missing ${searchIntegrity.detail}.`
            : `Kroger family search page was detected, but the current DOM snapshot is missing ${searchIntegrity.detail}.`
        : `Kroger family search extraction only applies on search pages, not ${describePageKind(pageKind)}.`
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
          ? 'Kroger family deals extraction can reuse serialized family coupon payloads before falling back to coupon-card DOM on Fred Meyer + QFC.'
          : dealIntegrity.kind === 'missing_required_fields'
            ? `Kroger family deal page was detected, but at least one coupon row is missing ${dealIntegrity.detail}.`
            : `Kroger family deal page was detected, but the current DOM snapshot is missing ${dealIntegrity.detail}.`
        : `Kroger family deals extraction only applies on deal pages, not ${describePageKind(pageKind)}.`
    ),
    capabilityState(
      'run_action',
      nonActionablePageKinds.has(pageKind) ? 'unsupported_page' : 'not_implemented',
      nonActionablePageKinds.has(pageKind) ? 'UNSUPPORTED_PAGE' : 'NOT_IMPLEMENTED',
      nonActionablePageKinds.has(pageKind)
        ? `Kroger family action workflows do not apply on ${describePageKind(pageKind)}.`
        : 'Kroger family Wave 3 does not expose action-heavy workflows yet.'
    ),
    capabilityState(
      'export_data',
      exportReady ? 'ready' : exportState.status,
      exportReady ? undefined : exportState.reasonCode,
      exportReady
        ? 'Kroger family export can ride on extracted product, search, or deal payloads.'
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
    return createBlockedExportState('Kroger family product', productIntegrity);
  }

  if (pageKind === 'search') {
    return createBlockedExportState('Kroger family search', searchIntegrity);
  }

  if (pageKind === 'deal') {
    return createBlockedExportState('Kroger family deal', dealIntegrity);
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
  const payloadAnalysis = analyzeKrogerProductPayload(document);

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
  const payloadAnalysis = analyzeKrogerSearchPayload(document);
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

function resolveDealIntegrity(document: ParentNode): SurfaceIntegrity {
  const payloadAnalysis = analyzeKrogerDealPayload(document);
  if (payloadAnalysis.items.length > 0) {
    return { kind: 'ready' };
  }

  const domIntegrity = resolveCollectionIntegrity(document, dealSelectors.item, 'supported deal cards', [
    {
      detail: 'a coupon title',
      isSatisfied: (item) => hasText(item, [dealSelectors.title]),
    },
    {
      detail: 'a coupon label',
      isSatisfied: (item) => hasText(item, [dealSelectors.label]),
    },
    {
      detail: 'a coupon URL',
      isSatisfied: (item) => hasOwnedUrl(item, dealSelectors.url),
    },
  ]);

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
  return (
    root.querySelector(selector)?.getAttribute(attribute)?.trim() ?? undefined
  );
}

function readRequiredOwnedUrl(root: ParentNode, selector: string): string {
  const value = resolveOwnedUrl(root, selector);
  if (value) {
    return value;
  }

  throw new Error(`Missing actionable Kroger family URL for selector: ${selector}`);
}

function hasOwnedUrl(root: ParentNode, selector: string) {
  return Boolean(resolveOwnedUrl(root, selector));
}

function resolveOwnedUrl(root: ParentNode, selector: string): string | undefined {
  const rawValue = readAttribute(root, selector, 'href');
  if (!rawValue) {
    return undefined;
  }

  const trimmed = rawValue.trim();
  if (
    trimmed.startsWith('#') ||
    trimmed.toLowerCase().startsWith('javascript:')
  ) {
    return undefined;
  }

  try {
    const resolved = new URL(trimmed, resolveDocumentUrl(root));
    if (
      !KROGER_HOST_RE.test(resolved.hostname) ||
      (resolved.protocol !== 'https:' && resolved.protocol !== 'http:')
    ) {
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
        KROGER_HOST_RE.test(resolved.hostname) &&
        (resolved.protocol === 'https:' || resolved.protocol === 'http:')
      ) {
        return ownerDocument.URL;
      }
    } catch {
      // Fall back to the deterministic Fred Meyer base below.
    }
  }

  return 'https://www.fredmeyer.com/';
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

type KrogerSearchPayloadItem = {
  sourceStoreId: 'kroger';
  title: string;
  sourceUrl: string;
  imageUrl?: string;
  price?: ReturnType<typeof parseMoney>;
  position: number;
};

type KrogerDealPayloadItem = {
  sourceStoreId: 'kroger';
  title: string;
  sourceUrl: string;
  dealLabel: string;
  price?: ReturnType<typeof parseMoney>;
};

type KrogerSearchPayloadSeed = Omit<
  KrogerSearchPayloadItem,
  'sourceStoreId' | 'position'
>;

type KrogerDealPayloadSeed = Omit<KrogerDealPayloadItem, 'sourceStoreId'>;
type PayloadCollectionAnalysis<T> = {
  items: T[];
  malformedDetail?: string;
};
type PayloadParseResult<T> = {
  item?: T;
  missingDetail?: string;
};

function readKrogerProductPayload(
  document: ParentNode
): ProductJsonLdPayload | undefined {
  return analyzeKrogerProductPayload(document).item;
}

function analyzeKrogerProductPayload(
  document: ParentNode
): PayloadParseResult<ProductJsonLdPayload> {
  const ownerDocument = document instanceof Document ? document : document.ownerDocument;
  if (!ownerDocument) {
    return {};
  }

  let malformedDetail: string | undefined;
  for (const entry of readKrogerPayloadEntries(ownerDocument, 'product-detail')) {
    const parsed = parseKrogerProductPayloadEntry(entry, ownerDocument.URL);
    if (parsed.item) {
      return parsed;
    }

    malformedDetail ??= parsed.missingDetail;
  }

  return malformedDetail ? { missingDetail: malformedDetail } : {};
}

function readKrogerSearchPayloadResults(
  document: ParentNode
): KrogerSearchPayloadItem[] {
  return analyzeKrogerSearchPayload(document).items;
}

function analyzeKrogerSearchPayload(
  document: ParentNode
): PayloadCollectionAnalysis<KrogerSearchPayloadItem> {
  const ownerDocument = document instanceof Document ? document : document.ownerDocument;
  if (!ownerDocument) {
    return {
      items: [],
    };
  }

  const seen = new Set<string>();
  const items: KrogerSearchPayloadItem[] = [];
  let malformedDetail: string | undefined;

  for (const entry of readKrogerPayloadEntries(ownerDocument, 'search-results')) {
    const parsed = parseKrogerSearchPayloadEntry(entry, ownerDocument.URL);
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
    items.push({
      ...item,
      sourceStoreId: 'kroger',
      position: items.length,
    });
  }

  return {
    items,
    malformedDetail,
  };
}

function readKrogerDealPayloadResults(
  document: ParentNode
): KrogerDealPayloadItem[] {
  return analyzeKrogerDealPayload(document).items;
}

function analyzeKrogerDealPayload(
  document: ParentNode
): PayloadCollectionAnalysis<KrogerDealPayloadItem> {
  const ownerDocument = document instanceof Document ? document : document.ownerDocument;
  if (!ownerDocument) {
    return {
      items: [],
    };
  }

  const seen = new Set<string>();
  const items: KrogerDealPayloadItem[] = [];
  let malformedDetail: string | undefined;

  for (const entry of readKrogerPayloadEntries(ownerDocument, 'deal-results')) {
    const parsed = parseKrogerDealPayloadEntry(entry, ownerDocument.URL);
    if (!parsed.item) {
      malformedDetail ??= parsed.missingDetail;
      continue;
    }

    const item = parsed.item;
    const key = `${item.sourceUrl}::${item.title}::${item.dealLabel}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push({
      ...item,
      sourceStoreId: 'kroger',
    });
  }

  return {
    items,
    malformedDetail,
  };
}

function readKrogerPayloadEntries(
  document: Document,
  state: 'product-detail' | 'search-results' | 'deal-results'
): Array<Record<string, unknown>> {
  const explicitStateScripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>(
      `script[type="application/json"][data-kroger-page-state="${state}"]`
    )
  );
  const genericScripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>('script')
  ).filter((script) => !explicitStateScripts.includes(script));
  const scripts =
    explicitStateScripts.length > 0 ? explicitStateScripts : genericScripts;
  const entries: Array<Record<string, unknown>> = [];

  for (const script of scripts) {
    const stateEntries = parseKrogerPayloadEntries(script.textContent, state);
    const assignmentEntries = parseKrogerAssignmentPayloadEntries(
      script.textContent,
      state
    );

    for (const entry of [...stateEntries, ...assignmentEntries]) {
      entries.push(entry);
    }
  }

  return entries;
}

function parseKrogerAssignmentPayloadEntries(
  rawText: string | null,
  state: 'product-detail' | 'search-results' | 'deal-results'
): Array<Record<string, unknown>> {
  if (!rawText?.includes('__KROGER_PAGE_STATE__')) {
    return [];
  }

  const match = rawText.match(/__KROGER_PAGE_STATE__\s*=\s*({[\s\S]*?});/);
  if (!match?.[1]) {
    return [];
  }

  return parseKrogerPayloadEntries(match[1], state);
}

function parseKrogerPayloadEntries(
  rawText: string | null,
  state: 'product-detail' | 'search-results' | 'deal-results'
): Array<Record<string, unknown>> {
  if (!rawText?.trim()) {
    return [];
  }

  const entries: Array<Record<string, unknown>> = [];
  for (const candidate of readInlineJsonCandidates(rawText)) {
    entries.push(...extractKrogerPayloadEntries(candidate, state));
  }

  return entries;
}

const inlineJsonAssignmentMarkers = [
  'window.__KROGER_PAGE_STATE__ =',
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

function extractKrogerPayloadEntries(
  value: unknown,
  state: 'product-detail' | 'search-results' | 'deal-results'
): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is Record<string, unknown> =>
        Boolean(entry) && typeof entry === 'object'
    );
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const record = value as Record<string, unknown>;
  const candidates =
    state === 'product-detail'
      ? [
          record.product,
          record.productDetail,
          record.productDetails,
          record.item,
          record.data,
          record.data && typeof record.data === 'object'
            ? (record.data as Record<string, unknown>).product
            : undefined,
          value,
        ]
      : state === 'search-results'
        ? [record.searchResults, record.results, record.items]
        : [record.dealResults, record.results, record.items, record.offers];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === 'object'
      );
    }

    if (candidate && typeof candidate === 'object') {
      return [candidate as Record<string, unknown>];
    }
  }

  return [];
}

function parseKrogerProductPayloadEntry(
  entry: Record<string, unknown>,
  documentUrl: string
): PayloadParseResult<ProductJsonLdPayload> {
  const title = readPayloadTextCandidate(entry, [
    ['title'],
    ['name'],
    ['productName'],
    ['displayName'],
    ['description', 'displayName'],
    ['description', 'name'],
    ['product', 'title'],
    ['product', 'name'],
    ['product', 'productName'],
    ['product', 'displayName'],
    ['product', 'description', 'displayName'],
    ['item', 'title'],
    ['item', 'name'],
  ]);

  if (!title) {
    return {
      missingDetail: 'a product title',
    };
  }

  return {
    item: {
      title,
      sourceUrl: resolveOwnedPayloadUrl(
        readPayloadTextCandidate(entry, [
          ['url'],
          ['href'],
          ['canonicalUrl'],
          ['link'],
          ['link', 'href'],
          ['links', 'product'],
          ['links', 'productUrl'],
          ['product', 'url'],
          ['product', 'href'],
          ['product', 'canonicalUrl'],
          ['product', 'link'],
          ['product', 'link', 'href'],
          ['product', 'links', 'product'],
          ['product', 'links', 'productUrl'],
          ['item', 'url'],
          ['item', 'href'],
        ]),
        documentUrl
      ),
      imageUrl: resolvePayloadImage(
        readPayloadFirst(entry, [
          ['image'],
          ['imageUrl'],
          ['img'],
          ['images'],
          ['images', '0'],
          ['images', '0', 'url'],
          ['media', 'primary'],
          ['media', 'primary', 'url'],
          ['product', 'image'],
          ['product', 'imageUrl'],
          ['product', 'images'],
          ['product', 'images', '0'],
          ['product', 'images', '0', 'url'],
        ]),
        documentUrl
      ),
      price: readPayloadMoneyCandidate(entry, [
        ['price'],
        ['currentPrice'],
        ['amount'],
        ['pricing'],
        ['pricing', 'price'],
        ['pricing', 'currentPrice'],
        ['product', 'price'],
        ['product', 'currentPrice'],
        ['product', 'pricing'],
        ['offers'],
        ['offers', '0'],
        ['offers', '0', 'price'],
        ['offers', '0', 'currentPrice'],
        ['item', 'price'],
      ]),
      sku: readPayloadTextCandidate(entry, [
        ['sku'],
        ['upc'],
        ['productId'],
        ['productID'],
        ['product', 'sku'],
        ['product', 'upc'],
        ['product', 'productId'],
        ['product', 'productID'],
        ['item', 'sku'],
        ['item', 'upc'],
      ]),
    },
  };
}

function parseKrogerSearchPayloadEntry(
  entry: Record<string, unknown>,
  documentUrl: string
): PayloadParseResult<KrogerSearchPayloadSeed> {
  const title = readPayloadTextCandidate(entry, [
    ['title'],
    ['name'],
    ['product', 'title'],
    ['product', 'name'],
    ['product', 'displayName'],
    ['product', 'description', 'displayName'],
  ]);
  const sourceUrl = resolveOwnedPayloadUrl(
    readPayloadTextCandidate(entry, [
      ['url'],
      ['href'],
      ['canonicalUrl'],
      ['seoUrl'],
      ['seo_url'],
      ['link'],
      ['link', 'href'],
      ['links', 'product'],
      ['links', 'productUrl'],
      ['product', 'url'],
      ['product', 'href'],
      ['product', 'canonicalUrl'],
      ['product', 'seoUrl'],
      ['product', 'seo_url'],
      ['product', 'link'],
      ['product', 'link', 'href'],
      ['product', 'links', 'product'],
      ['product', 'links', 'productUrl'],
    ]),
    documentUrl
  ) ?? buildKrogerProductPayloadUrl(entry, documentUrl);

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
      imageUrl: resolvePayloadImage(
        readPayloadFirst(entry, [
          ['image'],
          ['imageUrl'],
          ['img'],
          ['media', 'primary'],
          ['media', 'primary', 'url'],
          ['product', 'image'],
          ['product', 'imageUrl'],
          ['product', 'image', 'url'],
          ['product', 'media', 'primary'],
          ['product', 'media', 'primary', 'url'],
          ['product', 'primaryImage'],
          ['product', 'primaryImage', 'url'],
          ['product', 'images'],
          ['product', 'images', '0'],
          ['product', 'images', '0', 'url'],
          ['images'],
          ['images', '0'],
          ['images', '0', 'url'],
        ]),
        documentUrl
      ),
      price: readPayloadMoneyCandidate(entry, [
        ['price'],
        ['currentPrice'],
        ['amount'],
        ['pricing'],
        ['pricing', 'price'],
        ['pricing', 'currentPrice'],
        ['pricing', 'amount'],
        ['product', 'price'],
        ['product', 'pricing'],
        ['offers'],
        ['offers', '0'],
        ['offers', '0', 'price'],
        ['offers', '0', 'currentPrice'],
        ['offers', '0', 'amount'],
      ]),
    },
  };
}

function parseKrogerDealPayloadEntry(
  entry: Record<string, unknown>,
  documentUrl: string
): PayloadParseResult<KrogerDealPayloadSeed> {
  const title = readPayloadTextCandidate(entry, [
    ['title'],
    ['name'],
    ['coupon', 'title'],
    ['coupon', 'name'],
    ['offer', 'title'],
    ['offer', 'name'],
    ['product', 'title'],
    ['product', 'name'],
  ]);
  const dealLabel = readPayloadTextCandidate(entry, [
    ['dealLabel'],
    ['label'],
    ['badge'],
    ['badge', 'text'],
    ['coupon', 'dealLabel'],
    ['coupon', 'label'],
    ['coupon', 'badge'],
    ['coupon', 'badge', 'text'],
    ['offer', 'dealLabel'],
    ['offer', 'label'],
    ['offer', 'badge'],
    ['offer', 'badge', 'text'],
  ]);
  const sourceUrl = resolveOwnedPayloadUrl(
    readPayloadTextCandidate(entry, [
      ['url'],
      ['href'],
      ['canonicalUrl'],
      ['link'],
      ['link', 'href'],
      ['coupon', 'url'],
      ['coupon', 'href'],
      ['coupon', 'canonicalUrl'],
      ['coupon', 'link'],
      ['coupon', 'link', 'href'],
      ['offer', 'url'],
      ['offer', 'href'],
      ['offer', 'canonicalUrl'],
      ['offer', 'link'],
      ['offer', 'link', 'href'],
    ]),
    documentUrl
  ) ?? buildKrogerCouponPayloadUrl(entry, documentUrl);

  if (!title) {
    return {
      missingDetail: 'a coupon title',
    };
  }

  if (!dealLabel) {
    return {
      missingDetail: 'a coupon label',
    };
  }

  if (!sourceUrl) {
    return {
      missingDetail: 'a coupon URL',
    };
  }

  return {
    item: {
      title,
      dealLabel,
      sourceUrl,
      price: readPayloadMoneyCandidate(entry, [
        ['price'],
        ['currentPrice'],
        ['amount'],
        ['coupon', 'price'],
        ['offer', 'price'],
        ['pricing'],
        ['offers'],
        ['offers', '0'],
        ['offers', '0', 'price'],
        ['offers', '0', 'currentPrice'],
        ['offers', '0', 'amount'],
      ]),
    },
  };
}

function readPayloadText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  return undefined;
}

function readPayloadTextCandidate(
  payload: unknown,
  paths: ReadonlyArray<ReadonlyArray<string>>
): string | undefined {
  for (const path of paths) {
    const value = readPayloadPath(payload, path);
    const text = readPayloadText(value);
    if (text) {
      return text;
    }
  }

  return undefined;
}

function readPayloadFirst(
  payload: unknown,
  paths: ReadonlyArray<ReadonlyArray<string>>
): unknown {
  for (const path of paths) {
    const value = readPayloadPath(payload, path);
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function readPayloadMoney(
  value: unknown
): ReturnType<typeof parseMoney> {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return parseMoney(`$${value.toFixed(2)}`);
  }

  if (typeof value === 'string') {
    return parseMoney(value);
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const money = readPayloadMoney(entry);
      if (money) {
        return money;
      }
    }

    return undefined;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const amount = readPayloadNumberCandidate(record, [
      ['amount'],
      ['value'],
      ['currentPrice'],
      ['salePrice'],
      ['price'],
    ]);
    const displayText =
      readPayloadTextCandidate(record, [
        ['displayText'],
        ['formattedPrice'],
        ['formattedValue'],
        ['label'],
        ['priceText'],
      ]) ?? (amount != null ? `$${amount.toFixed(2)}` : undefined);
    if (amount != null) {
      return {
        currency: 'USD',
        amount,
        displayText: displayText ?? `$${amount.toFixed(2)}`,
      };
    }

    for (const nested of [
      record.price,
      record.currentPrice,
      record.amount,
      record.value,
      record.offer,
      record.offers,
      record.pricing,
    ]) {
      if (nested === value) {
        continue;
      }

      const money = readPayloadMoney(nested);
      if (money) {
        return money;
      }
    }
  }

  return undefined;
}

function readPayloadMoneyCandidate(
  payload: unknown,
  paths: ReadonlyArray<ReadonlyArray<string>>
): ReturnType<typeof parseMoney> {
  for (const path of paths) {
    const money = readPayloadMoney(readPayloadPath(payload, path));
    if (money) {
      return money;
    }
  }

  return undefined;
}

function readPayloadNumberCandidate(
  payload: unknown,
  paths: ReadonlyArray<ReadonlyArray<string>>
): number | undefined {
  for (const path of paths) {
    const value = readPayloadPath(payload, path);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function readPayloadPath(
  payload: unknown,
  path: ReadonlyArray<string>
): unknown {
  let current = payload;

  for (const segment of path) {
    if (Array.isArray(current) && /^\d+$/.test(segment)) {
      current = current[Number.parseInt(segment, 10)];
      continue;
    }

    if (!current || typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function resolveOwnedPayloadUrl(rawUrl: string | undefined, documentUrl: string) {
  if (!rawUrl) {
    return undefined;
  }

  try {
    const resolved = new URL(rawUrl, documentUrl);
    if (
      !KROGER_HOST_RE.test(resolved.hostname) ||
      (resolved.protocol !== 'https:' && resolved.protocol !== 'http:')
    ) {
      return undefined;
    }

    return resolved.toString();
  } catch {
    return undefined;
  }
}

function buildKrogerProductPayloadUrl(payload: unknown, documentUrl: string) {
  const slug = sanitizeKrogerPayloadSegment(
    readPayloadTextCandidate(payload, [
      ['slug'],
      ['product', 'slug'],
      ['item', 'slug'],
    ])
  );
  const productId = sanitizeKrogerPayloadSegment(
    readPayloadTextCandidate(payload, [
      ['productId'],
      ['productID'],
      ['product', 'productId'],
      ['product', 'productID'],
      ['item', 'productId'],
      ['item', 'productID'],
    ])
  );

  if (!slug || !productId) {
    return undefined;
  }

  return `${resolveKrogerPayloadOrigin(documentUrl)}/p/${encodeURIComponent(
    slug
  )}/${encodeURIComponent(productId)}`;
}

function buildKrogerCouponPayloadUrl(payload: unknown, documentUrl: string) {
  const couponId = sanitizeKrogerPayloadSegment(
    readPayloadTextCandidate(payload, [
      ['couponId'],
      ['couponID'],
      ['offerId'],
      ['offerID'],
      ['coupon', 'couponId'],
      ['coupon', 'couponID'],
      ['coupon', 'id'],
      ['offer', 'offerId'],
      ['offer', 'offerID'],
      ['offer', 'couponId'],
      ['offer', 'couponID'],
      ['offer', 'id'],
    ])
  );

  if (!couponId) {
    return undefined;
  }

  return `${resolveKrogerPayloadOrigin(
    documentUrl
  )}/savings/cl/coupon/${encodeURIComponent(couponId)}`;
}

function resolveKrogerPayloadOrigin(documentUrl: string) {
  try {
    const resolved = new URL(documentUrl);
    if (
      KROGER_HOST_RE.test(resolved.hostname) &&
      (resolved.protocol === 'https:' || resolved.protocol === 'http:')
    ) {
      return resolved.origin;
    }
  } catch {
    // Fall back to Fred Meyer when fixtures or callers do not provide a live URL.
  }

  return 'https://www.fredmeyer.com';
}

function sanitizeKrogerPayloadSegment(value: string | undefined) {
  const trimmed = value?.trim().replace(/^\/+|\/+$/g, '');
  return trimmed || undefined;
}

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

function resolveJsonLdUrl(rawUrl: string | undefined, documentUrl: string) {
  if (!rawUrl) {
    return undefined;
  }

  try {
    return new URL(rawUrl, documentUrl).toString();
  } catch {
    return undefined;
  }
}

function resolveJsonLdImage(image: unknown, documentUrl: string) {
  const rawCandidate = Array.isArray(image)
    ? image.find((entry) => typeof entry === 'string')
    : typeof image === 'string'
      ? image
      : undefined;

  return resolveJsonLdUrl(rawCandidate, documentUrl);
}

function resolvePayloadImage(
  value: unknown,
  documentUrl: string
): string | undefined {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const imageUrl = resolvePayloadImage(entry, documentUrl);
      if (imageUrl) {
        return imageUrl;
      }
    }

    return undefined;
  }

  if (typeof value === 'string') {
    return resolveJsonLdUrl(value, documentUrl);
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  for (const candidate of [
    record.url,
    record.src,
    record.href,
    record.imageUrl,
    record.image,
  ]) {
    const imageUrl = resolvePayloadImage(candidate, documentUrl);
    if (imageUrl) {
      return imageUrl;
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
