import {
  actionReceiptSchema,
  capabilityStateSchema,
  detectionResultSchema,
  normalizedProductSchema,
  searchResultItemSchema,
  type ActionInput,
  type ActionReceipt,
  type CapabilityState,
  type DetectionResult,
  type StoreAdapter,
} from '@shopflow/contracts';

export const temuHostPatterns = ['*://www.temu.com/*'];

const productSelectors = {
  title: [
    '[data-shopflow-product-title]',
    '[data-temu-product-title]',
    '[data-testid="product-title"]',
    '[data-testid="goods-title"]',
    'h1',
  ],
  price: [
    '[data-shopflow-product-price]',
    '[data-temu-product-price]',
    '[data-testid="product-price"]',
    '[data-testid="goods-price"]',
  ],
  image: [
    '[data-shopflow-product-image]',
    '[data-temu-product-image]',
    '[data-testid="product-image"]',
    '[data-testid="goods-image"]',
    'img[src]',
  ],
  sku: [
    '[data-shopflow-product-sku]',
    '[data-temu-product-sku]',
    '[data-testid="product-sku"]',
    '[data-testid="goods-id"]',
  ],
} as const;

const searchSelectors = {
  item: [
    '[data-shopflow-search-item]',
    '[data-temu-search-item]',
    '[data-testid="search-result-card"]',
    '[data-testid="goods-card"]',
  ],
  title:
    '[data-shopflow-search-title], [data-temu-search-title], [data-testid="search-result-title"], [data-testid="goods-card-title"]',
  price:
    '[data-shopflow-search-price], [data-temu-search-price], [data-testid="search-result-price"], [data-testid="goods-card-price"]',
  url:
    '[data-shopflow-search-url], [data-temu-search-url], [data-testid="search-result-link"], [data-testid="goods-card-link"], a[href]',
} as const;

const filterSelectors = {
  item: [
    '[data-shopflow-filter-item]',
    '[data-testid="search-result-card"][data-warehouse]',
    '[data-testid="goods-card"][data-warehouse]',
    '[data-shopflow-search-item][data-warehouse]',
    '[data-temu-search-item][data-warehouse]',
  ],
} as const;

const filterOverlaySelectors = [
  '[data-filter-overlay="open"]',
  '[data-shopflow-filter-overlay="open"]',
] as const;

export const temuAdapter: StoreAdapter = {
  storeId: 'temu',
  verifiedScopes: ['temu'],
  matches(url) {
    return url.hostname === 'www.temu.com';
  },
  detect(url, document) {
    const pageKind = detectTemuPageKind(url, document);

    return detectionResultSchema.parse({
      storeId: 'temu',
      verifiedScopes: ['temu'],
      matchedHost: url.hostname,
      pageKind,
      confidence: pageKind === 'unknown' ? 0.45 : 0.9,
      capabilityStates: capabilityStatesFor(pageKind, document),
    });
  },
  async extractProduct(document) {
    const payload = readProductJsonLd(document);

    return normalizedProductSchema.parse({
      sourceStoreId: 'temu',
      sourceUrl:
        payload?.sourceUrl ?? document.URL ?? 'https://www.temu.com/goods.html',
      title: payload?.title ?? readText(document, productSelectors.title),
      imageUrl: payload?.imageUrl ?? readImageUrl(document, productSelectors.image),
      price:
        payload?.price ??
        parseMoney(readText(document, productSelectors.price, true)),
      sku: payload?.sku ?? readText(document, productSelectors.sku, true),
    });
  },
  async extractSearchResults(document) {
    const structuredResults = readSearchJsonLdResults(document);
    if (structuredResults.length > 0) {
      return searchResultItemSchema.array().parse(structuredResults);
    }

    const items = queryAll(document, searchSelectors.item);

    return searchResultItemSchema.array().parse(
      items.map((item, index) => ({
        sourceStoreId: 'temu',
        sourceUrl: readRequiredOwnedUrl(item, searchSelectors.url),
        title: readText(item, [searchSelectors.title]),
        price: parseMoney(readText(item, [searchSelectors.price], true)),
        position: index,
      }))
    );
  },
  async runAction(document, input) {
    return runTemuAction(document, input);
  },
};

function detectTemuPageKind(
  url: URL,
  document: Document
): DetectionResult['pageKind'] {
  const fixtureKind =
    document.querySelector<HTMLElement>('[data-page-kind]')?.dataset.pageKind;

  if (fixtureKind === 'product' || fixtureKind === 'search') {
    return fixtureKind;
  }

  const path = url.pathname.toLowerCase();

  if (path.includes('/search_result.html')) {
    return 'search';
  }

  if (path.includes('/goods.html') || hasAnySelector(document, productSelectors.title)) {
    return 'product';
  }

  if (hasAnySelector(document, searchSelectors.item)) {
    return 'search';
  }

  return 'unknown';
}

function capabilityStatesFor(
  pageKind: DetectionResult['pageKind'],
  document: Document
): CapabilityState[] {
  const productIntegrity = resolveProductIntegrity(document);
  const searchIntegrity = resolveSearchIntegrity(document);
  const filterReadiness = resolveFilterReadiness(document, searchIntegrity);
  const extractionReady =
    (pageKind === 'product' && productIntegrity === 'ready') ||
    (pageKind === 'search' && searchIntegrity === 'ready');
  const exportState = resolveExportState(
    pageKind,
    productIntegrity,
    searchIntegrity
  );

  return [
    capabilityState(
      'extract_product',
      pageKind === 'product'
        ? productIntegrity === 'ready'
          ? 'ready'
          : 'degraded'
        : 'unsupported_page',
      pageKind === 'product'
        ? productIntegrity === 'missing_required_fields'
          ? 'PARSE_FAILED'
          : productIntegrity === 'ready'
            ? undefined
            : 'SELECTOR_MISSING'
        : undefined,
      pageKind === 'product'
        ? productIntegrity === 'ready'
          ? 'Temu product extraction can reuse product JSON-LD before falling back to storefront PDP selectors.'
          : productIntegrity === 'missing_required_fields'
            ? 'Temu product page was detected, but the current DOM snapshot is missing required structured product fields.'
            : 'Temu product page was detected, but the current DOM snapshot is missing required product selectors.'
        : 'Temu product extraction only applies on product pages.'
    ),
    capabilityState(
      'extract_search',
      pageKind === 'search'
        ? searchIntegrity === 'ready'
          ? 'ready'
          : 'degraded'
        : 'unsupported_page',
      pageKind === 'search'
        ? searchIntegrity === 'missing_required_fields'
          ? 'PARSE_FAILED'
          : searchIntegrity === 'ready'
            ? undefined
            : 'SELECTOR_MISSING'
        : undefined,
      pageKind === 'search'
        ? searchIntegrity === 'ready'
          ? 'Temu search extraction can reuse page-owned ItemList JSON-LD before falling back to storefront search selectors.'
          : searchIntegrity === 'missing_required_fields'
            ? 'Temu search page was detected, but at least one result row is missing a required title or URL.'
            : 'Temu search page was detected, but the current DOM snapshot is missing required search-result selectors.'
        : 'Temu search extraction only applies on search pages.'
    ),
    capabilityState(
      'extract_deals',
      'unsupported_page',
      undefined,
      'Temu Wave 2 does not claim differentiated deals extraction.'
    ),
    capabilityState(
      'run_action',
      pageKind === 'search'
        ? filterReadiness === 'ready'
          ? 'ready'
          : 'blocked'
        : 'unsupported_page',
      pageKind === 'search'
        ? resolveFilterReasonCode(filterReadiness)
        : undefined,
      pageKind === 'search'
        ? resolveFilterReasonMessage(filterReadiness)
        : 'Temu warehouse filtering only applies on supported search result pages.'
    ),
    capabilityState(
      'export_data',
      extractionReady ? 'ready' : exportState.status,
      extractionReady ? undefined : exportState.reasonCode,
      extractionReady
        ? 'Temu export can ride on extracted product or search payloads.'
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

type SurfaceIntegrity = 'ready' | 'missing_surface' | 'missing_required_fields';
type FilterReadiness =
  | 'ready'
  | 'busy'
  | 'missing_surface'
  | 'missing_search_surface'
  | 'incomplete_search_surface'
  | 'detached_candidates'
  | 'missing_required_fields'
  | 'already_filtered'
  | 'only_local_results';

function resolveProductIntegrity(document: ParentNode): SurfaceIntegrity {
  return hasProductJsonLd(document) || hasAnySelector(document, productSelectors.title)
    ? 'ready'
    : 'missing_surface';
}

function resolveSearchIntegrity(document: ParentNode): SurfaceIntegrity {
  if (readSearchJsonLdResults(document).length > 0) {
    return 'ready';
  }

  return resolveCollectionIntegrity(document, searchSelectors.item, (item) => {
    return (
      hasText(item, [searchSelectors.title]) &&
      hasOwnedUrl(item, searchSelectors.url)
    );
  });
}

function resolveFilterReadiness(
  document: ParentNode,
  searchIntegrity: SurfaceIntegrity
): FilterReadiness {
  if (hasAnySelector(document, filterOverlaySelectors)) {
    return 'busy';
  }

  const items = queryAll(document, filterSelectors.item);
  if (items.length === 0) {
    if (searchIntegrity === 'missing_surface') {
      return 'missing_search_surface';
    }

    if (searchIntegrity === 'missing_required_fields') {
      return 'incomplete_search_surface';
    }

    return 'missing_surface';
  }

  if (!items.every((item) => Boolean(item.getAttribute('data-warehouse')))) {
    return 'missing_required_fields';
  }

  const nonLocalItems = items.filter(
    (item) => item.getAttribute('data-warehouse') !== 'local'
  );

  if (nonLocalItems.length === 0) {
    return 'only_local_results';
  }

  const actionableItems = nonLocalItems.filter(
    (item) => item.getAttribute('data-shopflow-filtered') !== 'true'
  );

  if (actionableItems.length === 0) {
    return 'already_filtered';
  }

  if (searchIntegrity === 'missing_surface') {
    return 'missing_search_surface';
  }

  if (searchIntegrity === 'missing_required_fields') {
    return 'incomplete_search_surface';
  }

  const searchCorrelation = buildSearchCorrelation(document);
  if (
    actionableItems.some(
      (item) => !isCorrelatedFilterCandidate(item, searchCorrelation)
    )
  ) {
    return 'detached_candidates';
  }

  return 'ready';
}

function resolveCollectionIntegrity(
  document: ParentNode,
  itemSelectors: readonly string[],
  validator: (item: Element) => boolean
): SurfaceIntegrity {
  const items = queryAll(document, itemSelectors);
  if (items.length === 0) {
    return 'missing_surface';
  }

  return items.every(validator) ? 'ready' : 'missing_required_fields';
}

function runTemuAction(document: Document, input: ActionInput): ActionReceipt {
  if (input.actionKind !== 'filter_non_local_warehouse') {
    return actionReceiptSchema.parse({
      actionKind: input.actionKind,
      status: 'failed',
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [
        {
          code: 'ACTION_PRECONDITION_FAILED',
          message:
            'Temu only supports the non-local warehouse filter workflow in Wave 2.',
        },
      ],
    });
  }

  const pageKind = detectTemuPageKind(resolveActionUrl(document), document);
  if (pageKind !== 'search') {
    return actionReceiptSchema.parse({
      actionKind: input.actionKind,
      status: 'failed',
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [
        {
          code: 'ACTION_PRECONDITION_FAILED',
          message:
            'Temu warehouse filtering only runs on supported search result pages.',
        },
      ],
    });
  }

  if (hasAnySelector(document, filterOverlaySelectors)) {
    return actionReceiptSchema.parse({
      actionKind: input.actionKind,
      status: 'failed',
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [
        {
          code: 'ACTION_PRECONDITION_FAILED',
          message:
            'Temu warehouse filtering is already mid-flight on this page, so Shopflow will not start a second overlapping run.',
        },
      ],
    });
  }

  const items = queryAll(document.body, filterSelectors.item);
  if (items.length === 0) {
    return actionReceiptSchema.parse({
      actionKind: input.actionKind,
      status: 'failed',
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [
        {
          code: 'SELECTOR_MISSING',
          message:
            'No Temu filter candidates were found for the non-local warehouse workflow.',
        },
      ],
    });
  }

  const searchIntegrity = resolveSearchIntegrity(document);
  const actionableItems = items.filter((item) => {
    const warehouse = item.getAttribute('data-warehouse');
    return (
      warehouse !== 'local' &&
      Boolean(warehouse) &&
      item.getAttribute('data-shopflow-filtered') !== 'true'
    );
  });

  const itemsMissingWarehouse = items.filter(
    (item) => !item.getAttribute('data-warehouse')
  );

  if (itemsMissingWarehouse.length > 0) {
    let failed = 0;
    const errors: ActionReceipt['errors'] = [];

    for (const [index, item] of items.entries()) {
      if (item.getAttribute('data-warehouse')) {
        continue;
      }

      failed += 1;
      errors.push({
        code: 'PARSE_FAILED',
        message:
          'Temu filter candidate is missing the warehouse marker needed for honest decisioning.',
        itemRef: item.getAttribute('data-item-ref') ?? `temu-filter-${index + 1}`,
      });
    }

    return actionReceiptSchema.parse({
      actionKind: input.actionKind,
      status: 'failed',
      attempted: items.length,
      succeeded: 0,
      failed,
      skipped: 0,
      errors,
    });
  }

  if (actionableItems.length > 0 && searchIntegrity === 'missing_surface') {
    return actionReceiptSchema.parse({
      actionKind: input.actionKind,
      status: 'failed',
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [
        {
          code: 'SELECTOR_MISSING',
          message:
            'Temu warehouse filtering stays blocked until a trustworthy search-result surface is visible on the page.',
        },
      ],
    });
  }

  if (
    actionableItems.length > 0 &&
    searchIntegrity === 'missing_required_fields'
  ) {
    return actionReceiptSchema.parse({
      actionKind: input.actionKind,
      status: 'failed',
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [
        {
          code: 'PARSE_FAILED',
          message:
            'Temu warehouse filtering stays blocked until every visible search result exposes the title and URL needed for honest correlation.',
        },
      ],
    });
  }

  if (actionableItems.length > 0) {
    const searchCorrelation = buildSearchCorrelation(document);
    const detachedItems = actionableItems.filter(
      (item) => !isCorrelatedFilterCandidate(item, searchCorrelation)
    );

    if (detachedItems.length > 0) {
      return actionReceiptSchema.parse({
        actionKind: input.actionKind,
        status: 'failed',
        attempted: detachedItems.length,
        succeeded: 0,
        failed: detachedItems.length,
        skipped: 0,
        errors: detachedItems.map((item, index) => ({
          code: 'PARSE_FAILED' as const,
          message:
            'Temu filter candidate could not be correlated back to a visible search result, so Shopflow refuses to hide it blindly.',
          itemRef:
            item.getAttribute('data-item-ref') ?? `temu-filter-${index + 1}`,
        })),
      });
    }
  }

  if (actionableItems.length === 0 && itemsMissingWarehouse.length === 0) {
    return actionReceiptSchema.parse({
      actionKind: input.actionKind,
      status: 'failed',
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [
        {
          code: 'ACTION_PRECONDITION_FAILED',
          message:
            'Temu has no remaining non-local warehouse results to filter on this page.',
        },
      ],
    });
  }

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  const errors: ActionReceipt['errors'] = [];

  for (const [index, item] of items.entries()) {
    const itemRef = item.getAttribute('data-item-ref') ?? `temu-filter-${index + 1}`;
    const warehouse = item.getAttribute('data-warehouse');
    const result = item.getAttribute('data-filter-result');

    if (!warehouse) {
      failed += 1;
      errors.push({
        code: 'PARSE_FAILED',
        message:
          'Temu filter candidate is missing the warehouse marker needed for honest decisioning.',
        itemRef,
      });
      continue;
    }

    if (warehouse === 'local') {
      skipped += 1;
      continue;
    }

    if (item.getAttribute('data-shopflow-filtered') === 'true') {
      skipped += 1;
      continue;
    }

    if (input.dryRun) {
      skipped += 1;
      continue;
    }

    if (result === 'blocked') {
      failed += 1;
      errors.push({
        code: 'ACTION_STEP_FAILED',
        message: 'Temu refused to hide a non-local warehouse result.',
        itemRef,
      });
      continue;
    }

    item.setAttribute('data-shopflow-filtered', 'true');
    succeeded += 1;
  }

  const attempted = items.length;
  const status =
    failed > 0 ? (succeeded > 0 ? 'partial' : 'failed') : 'success';

  if (status === 'partial') {
    errors.push({
      code: 'ACTION_PARTIAL',
      message:
        'Temu filter workflow hid some non-local results, but at least one candidate remained visible.',
    });
  }

  return actionReceiptSchema.parse({
    actionKind: input.actionKind,
    status,
    attempted,
    succeeded,
    failed,
    skipped,
    errors,
  });
}

function resolveExportState(
  pageKind: DetectionResult['pageKind'],
  productIntegrity: SurfaceIntegrity,
  searchIntegrity: SurfaceIntegrity
) {
  if (pageKind === 'product') {
    return createBlockedExportState('Temu product', productIntegrity);
  }

  if (pageKind === 'search') {
    return createBlockedExportState('Temu search', searchIntegrity);
  }

  return {
    status: 'blocked' as const,
    reasonCode: 'UNSUPPORTED_PAGE' as const,
    reasonMessage: `Export only applies on product or search pages, not ${describePageKind(pageKind)}.`,
  };
}

function createBlockedExportState(
  surfaceLabel: string,
  integrity: SurfaceIntegrity
) {
  if (integrity === 'missing_required_fields') {
    return {
      status: 'blocked' as const,
      reasonCode: 'PARSE_FAILED' as const,
      reasonMessage: `${surfaceLabel} extraction is still missing required structured fields, so export would be incomplete.`,
    };
  }

  return {
    status: 'blocked' as const,
    reasonCode: 'SELECTOR_MISSING' as const,
    reasonMessage: `${surfaceLabel} extraction selectors are still missing, so export stays hidden instead of pretending payloads are ready.`,
  };
}

function resolveFilterReasonCode(filterReadiness: FilterReadiness) {
  switch (filterReadiness) {
    case 'ready':
      return undefined;
    case 'busy':
    case 'already_filtered':
    case 'only_local_results':
      return 'ACTION_PRECONDITION_FAILED' as const;
    case 'missing_required_fields':
    case 'incomplete_search_surface':
    case 'detached_candidates':
      return 'PARSE_FAILED' as const;
    case 'missing_surface':
    case 'missing_search_surface':
      return 'SELECTOR_MISSING' as const;
  }
}

function resolveFilterReasonMessage(filterReadiness: FilterReadiness) {
  switch (filterReadiness) {
    case 'ready':
      return 'Temu non-local warehouse filtering can run on this search page right now.';
    case 'busy':
      return 'Temu warehouse filtering is already in progress on this page, so Shopflow keeps the workflow blocked until the current overlay clears.';
    case 'missing_search_surface':
      return 'Temu warehouse filtering stays blocked until the search-result surface is visible enough to correlate filter actions with actual result rows.';
    case 'incomplete_search_surface':
      return 'Temu warehouse filtering stays blocked because at least one visible search result is missing the title or URL needed for honest correlation.';
    case 'detached_candidates':
      return 'Temu warehouse filtering stays blocked because at least one filter candidate cannot be correlated back to a visible search result on the page.';
    case 'missing_required_fields':
      return 'This Temu search page matched the workflow surface, but at least one filter candidate is missing the warehouse marker needed for honest decisioning.';
    case 'already_filtered':
      return 'This Temu search page already has every non-local warehouse result filtered out, so there is no remaining filter work to run.';
    case 'only_local_results':
      return 'This Temu search page only shows local warehouse results, so the non-local filter has nothing left to hide.';
    case 'missing_surface':
      return 'This Temu search page matched the workflow surface, but no filter candidates were detected.';
  }
}

function describePageKind(pageKind: DetectionResult['pageKind']) {
  return pageKind === 'unknown' ? 'this unmatched page' : `${pageKind} pages`;
}

function resolveActionUrl(document: Document) {
  return new URL(document.URL || 'https://www.temu.com/search_result.html');
}

type SearchCorrelation = {
  itemCount: number;
  titles: Set<string>;
  urls: Set<string>;
};

function buildSearchCorrelation(document: ParentNode): SearchCorrelation {
  const titles = new Set<string>();
  const urls = new Set<string>();
  const domItems = queryAll(document, searchSelectors.item);

  for (const item of domItems) {
    const title = normalizeText(readText(item, [searchSelectors.title], true));
    const url = resolveOwnedTemuUrl(item, searchSelectors.url);

    if (title) {
      titles.add(title);
    }

    if (url) {
      urls.add(url);
    }
  }

  for (const result of readSearchJsonLdResults(document)) {
    const normalizedTitle = normalizeText(result.title);
    if (normalizedTitle) {
      titles.add(normalizedTitle);
    }

    if (result.sourceUrl) {
      urls.add(result.sourceUrl);
    }
  }

  return {
    itemCount: Math.max(domItems.length, titles.size, urls.size),
    titles,
    urls,
  };
}

function isCorrelatedFilterCandidate(
  item: Element,
  searchCorrelation: SearchCorrelation
) {
  const itemUrl = resolveOwnedTemuUrl(item, searchSelectors.url);
  if (itemUrl && searchCorrelation.urls.has(itemUrl)) {
    return true;
  }

  const label = normalizeText(readFilterCandidateLabel(item));
  if (label) {
    return searchCorrelation.titles.has(label);
  }

  return searchCorrelation.itemCount === 1;
}

function readFilterCandidateLabel(root: ParentNode) {
  return readText(
    root,
    [
      '[data-shopflow-filter-title]',
      '[data-shopflow-search-title]',
      '[data-temu-search-title]',
      '[data-testid="search-result-title"]',
      '[data-testid="goods-card-title"]',
      'p',
    ],
    true
  );
}

function resolveOwnedTemuUrl(
  root: ParentNode,
  selector: string
): string | undefined {
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
      resolved.hostname !== 'www.temu.com' ||
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
        resolved.hostname === 'www.temu.com' &&
        (resolved.protocol === 'https:' || resolved.protocol === 'http:')
      ) {
        return ownerDocument.URL;
      }
    } catch {
      // Fall back to the deterministic Temu base below.
    }
  }

  return 'https://www.temu.com/';
}

function normalizeText(value: string | undefined) {
  return value?.trim().replace(/\s+/g, ' ').toLowerCase();
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
    const image = root.querySelector<HTMLImageElement>(selector);
    const value = readImageCandidate(image, root);
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

  throw new Error(`Missing actionable Temu URL for selector: ${selector}`);
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
      resolved.hostname !== 'www.temu.com' ||
      (resolved.protocol !== 'https:' && resolved.protocol !== 'http:')
    ) {
      return undefined;
    }

    return resolved.toString();
  } catch {
    return undefined;
  }
}


function hasText(root: ParentNode, selectors: readonly string[]) {
  return selectors.some((selector) =>
    Boolean(root.querySelector(selector)?.textContent?.trim())
  );
}

type SearchJsonLdItem = {
  sourceStoreId: 'temu';
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
        sourceStoreId: 'temu',
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
  const sourceUrl = resolveOwnedStructuredUrl(
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
    imageUrl: resolveStructuredImage(record.image, documentUrl),
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
    sourceUrl: resolveOwnedStructuredUrl(
      typeof record.url === 'string' ? record.url : undefined,
      documentUrl
    ),
    imageUrl: resolveStructuredImage(record.image, documentUrl),
    price,
    sku:
      typeof record.sku === 'string'
        ? record.sku.trim()
        : typeof record.productID === 'string'
          ? record.productID.trim()
          : undefined,
  };
}

function resolveStructuredImage(
  image: unknown,
  documentUrl: string
): string | undefined {
  if (typeof image === 'string') {
    return resolveStructuredUrl(image, documentUrl);
  }

  if (Array.isArray(image)) {
    for (const entry of image) {
      const resolved = resolveStructuredImage(entry, documentUrl);
      if (resolved) {
        return resolved;
      }
    }

    return undefined;
  }

  if (image && typeof image === 'object') {
    const record = image as Record<string, unknown>;
    if (typeof record.url === 'string') {
      return resolveStructuredUrl(record.url, documentUrl);
    }
  }

  return undefined;
}

function resolveStructuredUrl(
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

function resolveOwnedStructuredUrl(
  rawUrl: string | undefined,
  documentUrl: string
): string | undefined {
  const resolved = resolveStructuredUrl(rawUrl, documentUrl);
  if (!resolved) {
    return undefined;
  }

  try {
    const parsed = new URL(resolved);
    return parsed.hostname === 'www.temu.com' ? parsed.toString() : undefined;
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
