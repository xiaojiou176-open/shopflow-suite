import {
  actionReceiptSchema,
  capabilityStateSchema,
  dealItemSchema,
  detectionResultSchema,
  normalizedProductSchema,
  searchResultItemSchema,
  type ActionInput,
  type ActionReceipt,
  type CapabilityState,
  type PageKind,
  type StoreAdapter,
} from '@shopflow/contracts';
import {
  dealSelectors,
  cartActionSelectors,
  manageActionSelectors,
  productSelectors,
  SAFEWAY_HOST_PATTERN,
  SAFEWAY_VERIFIED_SCOPE,
  searchSelectors,
} from './constants';

const SAFEWAY_HOST_RE = /(^|\.)safeway\.com$/i;
const ALBERTSONS_FAMILY_HOST_RE = /(^|\.)((safeway|vons)\.com)$/i;

export const albertsonsStoreAdapter: StoreAdapter = {
  storeId: 'albertsons',
  verifiedScopes: [SAFEWAY_VERIFIED_SCOPE],
  matches(url) {
    return ALBERTSONS_FAMILY_HOST_RE.test(url.hostname);
  },
  detect(url, document) {
    const pageKind = detectPageKind(url, document);

    return detectionResultSchema.parse({
      storeId: 'albertsons',
      verifiedScopes: [SAFEWAY_VERIFIED_SCOPE],
      matchedHost: url.hostname,
      pageKind,
      confidence: pageKind === 'unknown' ? 0.4 : 0.95,
      capabilityStates: createCapabilityStates(pageKind, document, url),
    });
  },
  async extractProduct(document) {
    const payload = readProductJsonLd(document);
    const title = payload?.title ?? readText(document, productSelectors.title);
    const sourceUrl = document.URL || `https://www.safeway.com/${SAFEWAY_HOST_PATTERN}`;

    return normalizedProductSchema.parse({
      sourceStoreId: 'albertsons',
      sourceUrl: payload?.sourceUrl ?? sourceUrl,
      title,
      imageUrl: payload?.imageUrl ?? readImageUrl(document, productSelectors.image),
      price:
        payload?.price ?? parseMoney(readText(document, productSelectors.price, true)),
      availabilityLabel: readText(
        document,
        ['[data-shopflow-product-availability]'],
        true
      ),
      sku: payload?.sku ?? readText(document, productSelectors.sku, true),
    });
  },
  async extractSearchResults(document) {
    const payloadResults = await readSafewaySearchPayloadResults(document);
    if (payloadResults.length > 0) {
      return searchResultItemSchema.array().parse(payloadResults);
    }

    const items = Array.from(queryAll(document, searchSelectors.item));

    return searchResultItemSchema.array().parse(
      items.map((item, index) => ({
        sourceStoreId: 'albertsons',
        sourceUrl: readRequiredOwnedUrl(item, searchSelectors.url),
        title: readText(item, [searchSelectors.title]),
        price: parseMoney(readText(item, [searchSelectors.price], true)),
        position: index,
      }))
    );
  },
  async extractDeals(document) {
    const items = Array.from(queryAll(document, dealSelectors.item));

    return dealItemSchema.array().parse(
      items.map((item) => ({
        sourceStoreId: 'albertsons',
        sourceUrl: readRequiredOwnedUrl(item, dealSelectors.url),
        title: readText(item, [dealSelectors.title]),
        dealLabel: readText(item, [dealSelectors.label]),
        price: parseMoney(readText(item, [dealSelectors.price], true)),
      }))
    );
  },
  async runAction(_document, input) {
    return runSafewayAction(_document, input);
  },
};

export function detectPageKind(url: URL, document: Document): PageKind {
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

  if (
    path.includes('/schedule-and-save/manage') ||
    hasAnySelector(document, manageActionSelectors.item)
  ) {
    return 'manage';
  }

  if (path.includes('/shop/cart') || hasAnySelector(document, cartActionSelectors.item)) {
    return 'cart';
  }

  if (
    path.includes('/shop/product-details') ||
    hasAnySelector(document, productSelectors.title)
  ) {
    return 'product';
  }

  if (
    path.includes('/shop/search-results') ||
    hasAnySelector(document, searchSelectors.item)
  ) {
    return 'search';
  }

  if (path.includes('/deals') || hasAnySelector(document, dealSelectors.item)) {
    return 'deal';
  }

  return ALBERTSONS_FAMILY_HOST_RE.test(url.hostname) ? 'unknown' : 'unsupported';
}

export function createCapabilityStates(
  pageKind: PageKind,
  document?: Document,
  url?: URL
): CapabilityState[] {
  const productIntegrity = resolveProductIntegrity(document);
  const searchIntegrity = resolveSearchIntegrity(document);
  const dealIntegrity = resolveDealIntegrity(document);
  const exportState = resolveExportState(
    pageKind,
    productIntegrity,
    searchIntegrity,
    dealIntegrity
  );

  return [
    resolveExtractionCapabilityState(
      'extract_product',
      pageKind,
      'product',
      productIntegrity
    ),
    resolveExtractionCapabilityState(
      'extract_search',
      pageKind,
      'search',
      searchIntegrity
    ),
    resolveExtractionCapabilityState(
      'extract_deals',
      pageKind,
      'deal',
      dealIntegrity
    ),
    resolveRunActionState(pageKind, document, url),
    capabilityState(
      'export_data',
      exportState.status,
      exportState.reasonCode,
      exportState.reasonMessage
    ),
  ];
}

function capabilityState(
  capability: CapabilityState['capability'],
  status: CapabilityState['status'],
  reasonCode?: CapabilityState['reasonCode'],
  reasonMessage?: string
): CapabilityState {
  return capabilityStateSchema.parse({
    capability,
    status,
    reasonCode,
    reasonMessage,
  });
}

function resolveRunActionState(
  pageKind: PageKind,
  document?: Document,
  url?: URL
): CapabilityState {
  if (pageKind !== 'cart' && pageKind !== 'manage') {
    return capabilityState(
      'run_action',
      'unsupported_page',
      'UNSUPPORTED_PAGE',
      'Safeway action workflows only apply on cart or manage pages.'
    );
  }

  if (!document) {
    return capabilityState(
      'run_action',
      'degraded',
      'ACTION_PARTIAL',
      'Safeway action workflows are fixture-backed for repo hardening, but still require live receipts before public-ready support.'
    );
  }

  const actionUrl = url ?? readActionSurfaceUrl(document);
  if (actionUrl && !SAFEWAY_HOST_RE.test(actionUrl.hostname)) {
    return capabilityState(
      'run_action',
      'unsupported_site',
      'UNSUPPORTED_SITE',
      'Albertsons family search can extend to family hosts, but Schedule & Save actions stay Safeway-only until a broader verified scope exists.'
    );
  }

  const selectors =
    pageKind === 'cart' ? cartActionSelectors : manageActionSelectors;
  const items = queryAll(document.body, selectors.item);
  const targetState = resolveActionTargetState(pageKind);

  if (items.length === 0) {
    return capabilityState(
      'run_action',
      'blocked',
      'SELECTOR_MISSING',
      `Safeway ${pageKind} pages must expose actionable items before the ${pageKind === 'cart' ? 'subscribe' : 'cancel'} workflow can be trusted.`
    );
  }

  const actionableItems = items.filter(
    (item) => readActionItemState(item, pageKind) !== targetState
  );

  if (actionableItems.length === 0) {
    return capabilityState(
      'run_action',
      'blocked',
      'ACTION_PRECONDITION_FAILED',
      `Safeway ${pageKind} pages are already fully ${targetState}, so there is no remaining ${pageKind === 'cart' ? 'subscribe' : 'cancel'} work to run.`
    );
  }

  const incompleteItems = items.filter(
    (item) => readActionItemState(item, pageKind) !== targetState && !hasRequiredActionControls(item, pageKind)
  );

  if (incompleteItems.length > 0) {
    if (incompleteItems.length === actionableItems.length) {
      return capabilityState(
        'run_action',
        'blocked',
        'SELECTOR_MISSING',
        `Safeway ${pageKind} pages expose action items, but none currently expose the controls needed to ${pageKind === 'cart' ? 'subscribe' : 'cancel'} safely.`
      );
    }

    return capabilityState(
      'run_action',
      'degraded',
      'ACTION_PARTIAL',
      `Safeway ${pageKind} pages expose action items, but ${incompleteItems.length} item(s) are missing required controls and may only partially complete.`
    );
  }

  return capabilityState(
    'run_action',
    'ready'
  );
}

function runSafewayAction(
  document: Document,
  input: ActionInput
): ActionReceipt {
  if (
    input.actionKind !== 'schedule_save_subscribe' &&
    input.actionKind !== 'schedule_save_cancel'
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
          code: 'ACTION_PRECONDITION_FAILED',
          message:
            'Albertsons only supports Schedule & Save subscribe/cancel actions in Wave 1.',
        },
      ],
    });
  }

  const actionUrl = resolveActionUrl(document, input.actionKind);
  if (!SAFEWAY_HOST_RE.test(actionUrl.hostname)) {
    return actionReceiptSchema.parse({
      actionKind: input.actionKind,
      status: 'failed',
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [
        {
          code: 'UNSUPPORTED_SITE',
          message:
            'Schedule & Save actions remain Safeway-only inside the current Albertsons family verified scope.',
        },
      ],
    });
  }

  const pageKind = detectPageKind(actionUrl, document);

  if (
    (input.actionKind === 'schedule_save_subscribe' && pageKind !== 'cart') ||
    (input.actionKind === 'schedule_save_cancel' && pageKind !== 'manage')
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
          code: 'ACTION_PRECONDITION_FAILED',
          message: `Safeway ${input.actionKind} only runs on the matching page kind.`,
        },
      ],
    });
  }

  const itemSelectors =
    input.actionKind === 'schedule_save_subscribe'
      ? cartActionSelectors
      : manageActionSelectors;
  const items = queryAll(document.body, itemSelectors.item);
  const targetState = resolveActionTargetState(
    input.actionKind === 'schedule_save_subscribe' ? 'cart' : 'manage'
  );
  const limit = input.limit;
  const actionableItems = items.filter(
    (item) =>
      readActionItemState(
        item,
        input.actionKind === 'schedule_save_subscribe' ? 'cart' : 'manage'
      ) !== targetState
  );
  const limitedItems = limit ? actionableItems.slice(0, limit) : actionableItems;

  if (limitedItems.length === 0) {
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
          message: `No remaining Safeway items need ${input.actionKind} because every detected item is already ${targetState}.`,
        },
      ],
    });
  }

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  const errors: ActionReceipt['errors'] = [];

  for (const [index, item] of limitedItems.entries()) {
    const itemRef =
      item.getAttribute('data-item-ref') ?? `${input.actionKind}-${index + 1}`;

    if (input.dryRun) {
      skipped += 1;
      continue;
    }

    const result =
      input.actionKind === 'schedule_save_subscribe'
        ? executeSubscribeItem(item, itemRef)
        : executeCancelItem(item, itemRef);

    if (result.ok) {
      succeeded += 1;
    } else {
      failed += 1;
      errors.push(result.error);
    }
  }

  const attempted = limitedItems.length;
  const status =
    failed === 0 && succeeded > 0
      ? 'success'
      : succeeded > 0 || skipped > 0
        ? 'partial'
        : 'failed';

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

function resolveActionUrl(document: Document, actionKind: 'schedule_save_subscribe' | 'schedule_save_cancel') {
  try {
    if (document.URL && !document.URL.startsWith('about:blank')) {
      const resolved = new URL(document.URL);
      if (ALBERTSONS_FAMILY_HOST_RE.test(resolved.hostname)) {
        return resolved;
      }
    }
  } catch {
    // Fall through to the deterministic fixture URL below.
  }

  return new URL(
    actionKind === 'schedule_save_subscribe'
      ? 'https://www.safeway.com/shop/cart'
      : 'https://www.safeway.com/schedule-and-save/manage'
  );
}

function resolveActionTargetState(pageKind: 'cart' | 'manage') {
  return pageKind === 'cart' ? 'subscribed' : 'cancelled';
}

function readActionItemState(item: Element, pageKind: 'cart' | 'manage') {
  const explicitState = item
    .getAttribute('data-shopflow-action-state')
    ?.trim()
    .toLowerCase();
  const targetState = resolveActionTargetState(pageKind);
  if (explicitState === targetState) {
    return targetState;
  }

  const statusText = normalizeActionStatusText(item.textContent);
  if (!statusText) {
    return undefined;
  }

  if (
    pageKind === 'cart' &&
    /(schedule\s*&?\s*save active|already subscribed|subscription active)/i.test(
      statusText
    )
  ) {
    return 'subscribed';
  }

  if (
    pageKind === 'manage' &&
    /(subscription cancelled|subscription canceled|already cancelled|already canceled|cancellation confirmed)/i.test(
      statusText
    )
  ) {
    return 'cancelled';
  }

  return undefined;
}

function normalizeActionStatusText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\s+/g, ' ') : undefined;
}

function executeSubscribeItem(
  item: Element,
  itemRef: string
): { ok: true } | { ok: false; error: ActionReceipt['errors'][number] } {
  const trigger = queryFirst<HTMLElement>(item, cartActionSelectors.trigger);
  const cadence = queryFirst<HTMLElement>(item, cartActionSelectors.cadence);
  const confirm = queryFirst<HTMLElement>(item, cartActionSelectors.confirm);

  if (!trigger || !cadence || !confirm) {
    return {
      ok: false,
      error: {
        code: 'ACTION_STEP_FAILED',
        message:
          'Missing subscribe trigger, cadence, or confirm control for Safeway cart action.',
        itemRef,
      },
    };
  }

  trigger.click();
  cadence.click();
  confirm.click();
  item.setAttribute('data-shopflow-action-state', 'subscribed');

  return { ok: true };
}

function executeCancelItem(
  item: Element,
  itemRef: string
): { ok: true } | { ok: false; error: ActionReceipt['errors'][number] } {
  const trigger = queryFirst<HTMLElement>(item, manageActionSelectors.trigger);
  const reason = queryFirst<HTMLElement>(item, manageActionSelectors.reason);
  const confirm = queryFirst<HTMLElement>(item, manageActionSelectors.confirm);

  if (!trigger || !reason || !confirm) {
    return {
      ok: false,
      error: {
        code: 'ACTION_STEP_FAILED',
        message:
          'Missing cancel trigger, reason, or confirm control for Safeway manage action.',
        itemRef,
      },
    };
  }

  trigger.click();
  reason.click();
  confirm.click();
  item.setAttribute('data-shopflow-action-state', 'cancelled');

  return { ok: true };
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

function queryFirst<T extends Element>(
  root: ParentNode,
  selectors: readonly string[]
): T | null {
  for (const selector of selectors) {
    const node = root.querySelector<T>(selector);
    if (node) {
      return node;
    }
  }

  return null;
}

function hasRequiredActionControls(item: Element, pageKind: 'cart' | 'manage') {
  const selectors =
    pageKind === 'cart' ? cartActionSelectors : manageActionSelectors;

  return Boolean(
    queryFirst(item, selectors.trigger) &&
      queryFirst(item, pageKind === 'cart' ? cartActionSelectors.cadence : manageActionSelectors.reason) &&
      queryFirst(item, selectors.confirm)
  );
}

type SurfaceIntegrity =
  | 'ready'
  | 'missing_surface'
  | 'missing_required_fields'
  | 'missing_page_context';

function resolveProductIntegrity(document?: Document): SurfaceIntegrity {
  if (!document) {
    return 'ready';
  }

  return hasProductJsonLd(document) || hasAnySelector(document, productSelectors.title)
    ? 'ready'
    : 'missing_surface';
}

function resolveSearchIntegrity(document?: Document): SurfaceIntegrity {
  if (!document) {
    return 'ready';
  }

  if (readSafewaySearchApiContextFromDocument(document)) {
    return 'ready';
  }

  const inlineProducts = readSafewayInlineSearchProducts(
    document,
    readDocumentUrl(document)?.toString() ?? 'https://www.safeway.com/'
  );
  if (inlineProducts.length > 0) {
    return 'ready';
  }

  if (readSafewayInlineSearchProducts(document, document.URL).length > 0) {
    return 'ready';
  }

  const collectionIntegrity = resolveCollectionIntegrity(
    document,
    searchSelectors.item,
    (item) => {
      return (
        hasText(item, [searchSelectors.title]) &&
        hasOwnedUrl(item, searchSelectors.url)
      );
    }
  );

  if (collectionIntegrity !== 'missing_surface') {
    return collectionIntegrity;
  }

  return hasSafewaySearchApiContextHints(document)
    ? 'missing_page_context'
    : collectionIntegrity;
}

function resolveDealIntegrity(document?: Document): SurfaceIntegrity {
  return resolveCollectionIntegrity(document, dealSelectors.item, (item) => {
    return (
      hasText(item, [dealSelectors.title]) &&
      hasText(item, [dealSelectors.label]) &&
      hasOwnedUrl(item, dealSelectors.url)
    );
  });
}

function resolveCollectionIntegrity(
  document: Document | undefined,
  itemSelectors: readonly string[],
  validator: (item: Element) => boolean
): SurfaceIntegrity {
  if (!document) {
    return 'ready';
  }

  const items = queryAll(document, itemSelectors);
  if (items.length === 0) {
    return 'missing_surface';
  }

  return items.every(validator) ? 'ready' : 'missing_required_fields';
}

function resolveExtractionCapabilityState(
  capability: CapabilityState['capability'],
  pageKind: PageKind,
  expectedPageKind: 'product' | 'search' | 'deal',
  integrity: SurfaceIntegrity
): CapabilityState {
  if (pageKind !== expectedPageKind) {
    return capabilityState(
      capability,
      'unsupported_page',
      'UNSUPPORTED_PAGE',
      `Safeway ${capabilityLabel(capability)} only applies on ${expectedPageKind} pages, not ${describePageKind(pageKind)}.`
    );
  }

  if (integrity === 'ready') {
    return capabilityState(capability, 'ready');
  }

  if (integrity === 'missing_page_context') {
    return capabilityState(
      capability,
      'degraded',
      'PARSE_FAILED',
      `Safeway ${expectedPageKind} page exposes page-owned search context, but required store or query fields are incomplete so ${capabilityLabel(capability)} cannot stay truthful yet.`
    );
  }

  return capabilityState(
    capability,
    'degraded',
    integrity === 'missing_surface' ? 'SELECTOR_MISSING' : 'PARSE_FAILED',
    integrity === 'missing_surface'
      ? `Safeway ${expectedPageKind} page was detected, but required ${capabilityLabel(capability)} selectors are still missing.`
      : `Safeway ${expectedPageKind} page was detected, but at least one ${capabilityLabel(capability)} candidate is missing required structured fields.`
  );
}

function resolveExportState(
  pageKind: PageKind,
  productIntegrity: SurfaceIntegrity,
  searchIntegrity: SurfaceIntegrity,
  dealIntegrity: SurfaceIntegrity
) {
  if (pageKind === 'product') {
    return createBlockedExportState('Safeway product', productIntegrity);
  }

  if (pageKind === 'search') {
    return createBlockedExportState('Safeway search', searchIntegrity);
  }

  if (pageKind === 'deal') {
    return createBlockedExportState('Safeway deal', dealIntegrity);
  }

  return {
    status: 'blocked' as const,
    reasonCode: 'UNSUPPORTED_PAGE' as const,
    reasonMessage: `Export only applies on product, search, or deal pages, not ${describePageKind(pageKind)}.`,
  };
}

function createBlockedExportState(
  surfaceLabel: string,
  integrity: SurfaceIntegrity
) {
  if (integrity === 'ready') {
    return {
      status: 'ready' as const,
      reasonCode: undefined,
      reasonMessage:
        'Safeway export can ride on complete structured extraction payloads.',
    };
  }

  if (integrity === 'missing_required_fields') {
    return {
      status: 'blocked' as const,
      reasonCode: 'PARSE_FAILED' as const,
      reasonMessage: `${surfaceLabel} extraction is still missing required structured fields, so export would be incomplete.`,
    };
  }

  if (integrity === 'missing_page_context') {
    return {
      status: 'blocked' as const,
      reasonCode: 'PARSE_FAILED' as const,
      reasonMessage:
        `${surfaceLabel} page-owned API context is present but incomplete, so export stays hidden instead of pretending the backing payload is trustworthy.`,
    };
  }

  return {
    status: 'blocked' as const,
    reasonCode: 'SELECTOR_MISSING' as const,
    reasonMessage: `${surfaceLabel} extraction selectors are still missing, so export stays hidden instead of pretending payloads are ready.`,
  };
}

function capabilityLabel(capability: CapabilityState['capability']) {
  switch (capability) {
    case 'extract_product':
      return 'product extraction';
    case 'extract_search':
      return 'search extraction';
    case 'extract_deals':
      return 'deal extraction';
    case 'run_action':
      return 'action workflow';
    case 'export_data':
      return 'data export';
  }
}

function describePageKind(pageKind: PageKind) {
  return pageKind === 'unknown' ? 'this unmatched page' : `${pageKind} pages`;
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

function readRequiredOwnedUrl(root: ParentNode, selector: string): string {
  const value = resolveOwnedUrl(root, selector);
  if (value) {
    return value;
  }

  throw new Error(`Missing actionable Safeway URL for selector: ${selector}`);
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

    if (!ALBERTSONS_FAMILY_HOST_RE.test(resolved.hostname)) {
      return undefined;
    }

    return resolved.toString();
  } catch {
    return undefined;
  }
}

function resolveDocumentUrl(root: ParentNode): string {
  const ownerDocument = isDocumentNode(root) ? root : root.ownerDocument ?? undefined;
  if (ownerDocument?.URL && ownerDocument.URL !== 'about:blank') {
    try {
      const resolved = new URL(ownerDocument.URL);
      if (
        ALBERTSONS_FAMILY_HOST_RE.test(resolved.hostname) &&
        (resolved.protocol === 'https:' || resolved.protocol === 'http:')
      ) {
        return ownerDocument.URL;
      }
    } catch {
      // Fall back to the deterministic Safeway base below.
    }
  }

  return 'https://www.safeway.com/';
}

function resolveUrl(root: ParentNode, rawValue: string) {
  const baseUrl = resolveDocumentUrl(root);

  try {
    return new URL(rawValue, baseUrl).toString();
  } catch {
    return rawValue;
  }
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

  const numeric = Number(displayText.replace(/[^0-9.]/g, ''));
  if (Number.isNaN(numeric)) {
    return undefined;
  }

  return {
    currency: 'USD',
    amount: numeric,
    displayText,
  };
}

type SafewaySearchApiContext = {
  basePath: string;
  productsEndpoint: string;
  subscriptionHeaderName: string;
  subscriptionKey: string;
  storeId: string;
  zipCode: string;
  wineStoreId: string;
  banner: string;
  query: string;
  refererUrl: string;
};

type SafewaySearchApiProduct = Record<string, unknown>;

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

async function readSafewaySearchPayloadResults(document: Document) {
  const context = readSafewaySearchApiContextFromDocument(document);
  if (!context) {
    return readSafewayInlineSearchProducts(
      document,
      readDocumentUrl(document)?.toString() ?? 'https://www.safeway.com/'
    );
  }
  if (typeof fetch !== 'function') {
    return readSafewayInlineSearchProducts(document, context.refererUrl);
  }

  const abortController =
    typeof AbortController === 'function' ? new AbortController() : undefined;
  const timeoutHandle =
    abortController &&
    typeof setTimeout === 'function'
      ? setTimeout(() => abortController.abort(), 2500)
      : undefined;

  try {
    const response = await fetch(buildSafewaySearchApiUrl(context), {
      credentials: 'include',
      headers: {
        Accept: 'application/json, text/plain, */*',
        [context.subscriptionHeaderName]: context.subscriptionKey,
      },
      signal: abortController?.signal,
    });
    if (!response.ok) {
      return readSafewayInlineSearchProducts(document, context.refererUrl);
    }

    const payload = (await response.json()) as unknown;
    const products = readSafewaySearchProducts(payload);
    const productItems = products
      .map((item, index) =>
        toSafewaySearchResultItem(item, context.refererUrl, index)
      )
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    return productItems.length > 0
      ? productItems
      : readSafewayInlineSearchProducts(document, context.refererUrl);
  } catch {
    return readSafewayInlineSearchProducts(document, context.refererUrl);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function readSafewayInlineSearchProducts(
  document: Document,
  refererUrl: string
) {
  const scripts = Array.from(
    document.querySelectorAll<HTMLScriptElement>('script')
  ).map((script) => script.textContent?.trim() ?? '');

  for (const scriptText of scripts) {
    for (const payload of readInlineJsonCandidates(scriptText)) {
      const products = readSafewaySearchProducts(payload);
      if (products.length === 0) {
        continue;
      }

      return products
        .map((item, index) => toSafewaySearchResultItem(item, refererUrl, index))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
    }
  }

  return [];
}

function readInlineJsonCandidates(scriptText: string): unknown[] {
  const candidates: unknown[] = [];
  const trimmed = scriptText.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      candidates.push(JSON.parse(trimmed) as unknown);
    } catch {
      // Ignore invalid raw JSON script bodies and continue scanning.
    }
  }

  for (const marker of inlineJsonAssignmentMarkers) {
    const payload = readAssignedJsonPayload(scriptText, marker);
    if (payload !== undefined) {
      candidates.push(payload);
    }
  }

  return candidates;
}

const inlineJsonAssignmentMarkers = [
  'window.__PRELOADED_STATE__ =',
  'window.__INITIAL_STATE__ =',
  'window.__SEARCH_RESULTS__ =',
  '__NEXT_DATA__ =',
] as const;

function readAssignedJsonPayload(
  scriptText: string,
  marker: string
): unknown | undefined {
  const markerIndex = scriptText.indexOf(marker);
  if (markerIndex === -1) {
    return undefined;
  }

  const payloadStart = findJsonStartIndex(
    scriptText,
    markerIndex + marker.length
  );
  if (payloadStart === -1) {
    return undefined;
  }

  const payloadEnd = findBalancedJsonEnd(scriptText, payloadStart);
  if (payloadEnd === -1) {
    return undefined;
  }

  try {
    return JSON.parse(scriptText.slice(payloadStart, payloadEnd + 1)) as unknown;
  } catch {
    return undefined;
  }
}

function findJsonStartIndex(scriptText: string, startIndex: number) {
  for (let index = startIndex; index < scriptText.length; index += 1) {
    const char = scriptText[index];
    if (char === '{' || char === '[') {
      return index;
    }
  }

  return -1;
}

function findBalancedJsonEnd(scriptText: string, startIndex: number) {
  const openingChar = scriptText[startIndex];
  const closingChar = openingChar === '{' ? '}' : ']';
  let depth = 0;
  let insideString = false;
  let escaped = false;

  for (let index = startIndex; index < scriptText.length; index += 1) {
    const char = scriptText[index];

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

function readSafewaySearchProducts(payload: unknown): SafewaySearchApiProduct[] {
  const candidateArrays = [
    readNestedArray(payload, ['results', 'products']),
    readNestedArray(payload, ['response', 'products']),
    readNestedArray(payload, ['data', 'products']),
    readNestedArray(payload, ['products']),
    readNestedArray(payload, ['response', 'productCards']),
    readNestedArray(payload, ['data', 'productCards']),
  ];

  return candidateArrays.find((items) => items.length > 0) ?? [];
}

function hasProductJsonLd(root: ParentNode) {
  return Boolean(readProductJsonLd(root));
}

function readProductJsonLd(root: ParentNode): ProductJsonLdPayload | undefined {
  const ownerDocument = isDocumentNode(root) ? root : root.ownerDocument ?? undefined;
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

function toSafewaySearchResultItem(
  product: SafewaySearchApiProduct,
  documentUrl: string,
  index: number
) {
  const title = readCandidateString(product, [
    ['title'],
    ['name'],
    ['displayName'],
    ['productName'],
    ['product', 'displayName'],
    ['product', 'name'],
    ['product', 'title'],
    ['product', 'description', 'displayName'],
  ]);
  const sourceUrl = resolveUrl(
    createUrlResolutionRoot(documentUrl),
    readCandidateString(product, [
      ['url'],
      ['productUrl'],
      ['pdpUrl'],
      ['seoUrl'],
      ['product', 'url'],
      ['product', 'productUrl'],
      ['links', 'product'],
      ['links', 'productUrl'],
    ]) ?? ''
  );
  if (!title || !sourceUrl || !isOwnedAlbertsonsFamilyUrl(sourceUrl)) {
    return undefined;
  }

  const imageUrl = readCandidateString(product, [
    ['imageUrl'],
    ['image', 'url'],
    ['image', 'src'],
    ['product', 'imageUrl'],
    ['product', 'image', 'url'],
    ['product', 'image', 'src'],
    ['images', '0', 'url'],
  ]);
  const displayText =
    readCandidateString(product, [
      ['price', 'displayText'],
      ['price', 'formattedPrice'],
      ['pricing', 'displayText'],
      ['pricing', 'formattedPrice'],
      ['formattedPrice'],
    ]) ??
    readCandidateString(product, [['price'], ['salePrice'], ['currentPrice']]);
  const amount = readCandidateNumber(product, [
    ['price', 'amount'],
    ['price', 'value'],
    ['pricing', 'amount'],
    ['pricing', 'value'],
    ['salePrice'],
    ['currentPrice'],
  ]);
  const price =
    amount != null && displayText
      ? {
          currency: 'USD',
          amount,
          displayText,
        }
      : parseMoney(displayText);

  return {
    sourceStoreId: 'albertsons' as const,
    sourceUrl,
    title,
    imageUrl: imageUrl
      ? resolveUrl(createUrlResolutionRoot(documentUrl), imageUrl)
      : undefined,
    price,
    position: index,
  };
}

function readSafewaySearchApiContextFromDocument(document: Document) {
  const url = readDocumentUrl(document) ?? new URL('https://www.safeway.com/');
  const scriptText = readSafewayRuntimeText(document);
  if (!scriptText) {
    return undefined;
  }

  const query =
    url.searchParams.get('q')?.trim() ??
    document
      .querySelector<HTMLElement>('[data-shopflow-search-term]')
      ?.dataset.shopflowSearchTerm
      ?.trim();
  const searchConfig = readSafewayConfig(document, 'initSearchConfig');
  const storeConfig = readSafewayConfig(document, 'initStoreResolutionConfig');
  if (!query || !searchConfig || !storeConfig) {
    return undefined;
  }

  const sessionInfo = readSafewaySessionInfo(document);
  const sessionRecord = asRecord(sessionInfo);
  const infoRecord = asRecord(sessionRecord?.info);
  const shopRecord = asRecord(infoRecord?.SHOP);
  const j4uRecord = asRecord(infoRecord?.J4U);
  const commonRecord = asRecord(infoRecord?.COMMON);
  const searchRecord = asRecord(searchConfig);
  const storeRecord = asRecord(storeConfig);

  const storeId =
    readStringValue(shopRecord?.storeId) ??
    readStringValue(j4uRecord?.storeId) ??
    readStringValue(storeRecord?.shopDefaultStoreId);
  const zipCode =
    readStringValue(shopRecord?.zipcode) ??
    readStringValue(j4uRecord?.zipcode) ??
    readStringValue(storeRecord?.shopDefaultZipcode);
  const banner =
    readStringValue(commonRecord?.banner) ??
    readSafewayCookie(document, 'ACI_S_ECommBanner') ??
    url.hostname.split('.').at(-2);
  const wineStoreId =
    readStringValue(commonRecord?.wfcStoreId) ??
    readSafewayRuntimeValueFromText(scriptText, 'wineStoreId') ??
    '5799';
  const subscriptionKey = readStringValue(searchRecord?.apimProgramSubscriptionKey);
  const basePath = readStringValue(searchRecord?.apimProgramSearchPath);
  const productsEndpoint = readStringValue(
    searchRecord?.apimProgramSearchProductsEndpoint
  );
  const subscriptionHeaderName =
    readSafewayRuntimeValueFromText(
      scriptText,
      'sns.arservice.apim.subkeyHeader'
    ) ??
    'ocp-apim-subscription-key';

  if (
    !storeId ||
    !zipCode ||
    !banner ||
    !subscriptionKey ||
    !basePath ||
    !productsEndpoint
  ) {
    return undefined;
  }

  return {
    basePath,
    productsEndpoint,
    subscriptionHeaderName,
    subscriptionKey,
    storeId,
    zipCode,
    wineStoreId,
    banner,
    query,
    refererUrl: url.toString(),
  } satisfies SafewaySearchApiContext;
}

function buildSafewaySearchApiUrl(context: SafewaySearchApiContext) {
  const refererOrigin = new URL(context.refererUrl).origin;
  const endpoint = new URL(
    `${context.basePath.replace(/\/$/, '')}/${context.productsEndpoint.replace(
      /^\//,
      ''
    )}`,
    `${refererOrigin}/`
  );

  endpoint.searchParams.set('request-id', 'shopflow-adapter');
  endpoint.searchParams.set('url', refererOrigin);
  endpoint.searchParams.set('pageurl', refererOrigin);
  endpoint.searchParams.set('pagename', 'search');
  endpoint.searchParams.set('rows', '24');
  endpoint.searchParams.set('start', '0');
  endpoint.searchParams.set('search-type', 'keyword');
  endpoint.searchParams.set('storeid', context.storeId);
  endpoint.searchParams.set('featured', 'true');
  endpoint.searchParams.set('q', context.query);
  endpoint.searchParams.set('sort', '');
  endpoint.searchParams.set(
    'timezone',
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
      'America/Los_Angeles'
  );
  endpoint.searchParams.set('dvid', 'web-4.1search');
  endpoint.searchParams.set('channel', 'instore');
  endpoint.searchParams.set('wineshopstoreid', context.wineStoreId);
  endpoint.searchParams.set('zipcode', context.zipCode);
  endpoint.searchParams.set('visitorId', '');
  endpoint.searchParams.set('pgm', 'wineshop,merch-banner');
  endpoint.searchParams.set('includeOffer', 'true');
  endpoint.searchParams.set('banner', context.banner);

  return endpoint.toString();
}

function hasSafewaySearchApiContextHints(document: Document) {
  const runtimeText = readSafewayRuntimeText(document);
  if (!runtimeText) {
    return false;
  }

  return (
    runtimeText.includes('initSearchConfig') ||
    runtimeText.includes('initStoreResolutionConfig')
  );
}

function readSafewayConfig(root: ParentNode, initName: string) {
  const ownerDocument = getOwnerDocument(root);
  if (!ownerDocument) {
    return undefined;
  }

  for (const script of ownerDocument.querySelectorAll<HTMLScriptElement>('script')) {
    const config = readSafewayConfigFromText(script.textContent ?? '', initName);
    if (config) {
      return config;
    }
  }

  return undefined;
}

function readSafewayConfigFromText(scriptText: string, initName: string) {
  const payload = readSafewayConfigPayload(scriptText, initName);
  if (!payload) {
    return undefined;
  }

  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function readSafewayConfigPayload(scriptText: string, initName: string) {
  const markers = [
    `SWY.CONFIGSERVICE.${initName}('`,
    `window.SWY.CONFIGSERVICE.${initName}('`,
    `SWY.CONFIGSERVICE.${initName}("`,
    `window.SWY.CONFIGSERVICE.${initName}("`,
  ];

  for (const marker of markers) {
    const start = scriptText.indexOf(marker);
    if (start === -1) {
      continue;
    }

    const payloadStart = start + marker.length;
    const closingQuote = marker.endsWith("('") ? "'" : '"';
    const payloadEnd = scriptText.indexOf(`${closingQuote});`, payloadStart);
    if (payloadEnd === -1) {
      continue;
    }

    return scriptText.slice(payloadStart, payloadEnd);
  }

  return undefined;
}

function readSafewayRuntimeValueFromText(scriptText: string, key: string) {
  return scriptText.match(new RegExp(`"${escapeRegExp(key)}":"([^"]+)"`))?.[1];
}

function readSafewaySessionInfo(root: ParentNode) {
  const raw =
    readSafewayCookie(root, 'SWY_SHARED_SESSION_INFO') ??
    readSafewayCookie(root, 'abs_gsession');
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function readSafewayCookie(root: ParentNode, name: string) {
  const ownerDocument = getOwnerDocument(root);
  const match = ownerDocument?.cookie.match(
    new RegExp(`(?:^|;\\\\s*)${escapeRegExp(name)}=([^;]+)`)
  );
  if (!match) {
    return undefined;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function readSafewayRuntimeText(root: ParentNode) {
  const ownerDocument = getOwnerDocument(root);
  if (!ownerDocument) {
    return undefined;
  }

  const raw = Array.from(
    ownerDocument.querySelectorAll<HTMLScriptElement>('script')
  )
    .map((script) => script.textContent?.trim() ?? '')
    .join('\n');

  return raw || undefined;
}

function readCandidateString(
  payload: unknown,
  paths: ReadonlyArray<ReadonlyArray<string>>
) {
  for (const path of paths) {
    const value = readPath(payload, path);
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return undefined;
}

function readCandidateNumber(
  payload: unknown,
  paths: ReadonlyArray<ReadonlyArray<string>>
) {
  for (const path of paths) {
    const value = readPath(payload, path);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function readNestedArray(payload: unknown, path: readonly string[]) {
  const value = readPath(payload, path);
  return Array.isArray(value)
    ? value.filter((item): item is SafewaySearchApiProduct => {
        return Boolean(item) && typeof item === 'object';
      })
    : [];
}

function readPath(payload: unknown, path: readonly string[]) {
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

function asRecord(value: unknown) {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function readStringValue(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function readDocumentUrl(document?: Document) {
  if (!document?.URL || document.URL === 'about:blank') {
    return undefined;
  }

  try {
    return new URL(document.URL);
  } catch {
    return undefined;
  }
}

function readActionSurfaceUrl(document?: Document) {
  const url = readDocumentUrl(document);
  if (!url) {
    return undefined;
  }

  const hasPrimedFixtureBase = Boolean(
    document?.head.querySelector('base[data-shopflow-fixture-base]')
  );
  const isSyntheticUnprimedFixture =
    document?.defaultView == null && !hasPrimedFixtureBase;

  return isSyntheticUnprimedFixture ? undefined : url;
}

function getOwnerDocument(root: ParentNode) {
  return isDocumentNode(root) ? root : root.ownerDocument ?? undefined;
}

function isDocumentNode(root: ParentNode): root is Document {
  return root.nodeType === 9;
}

function createUrlResolutionRoot(sourceUrl: string) {
  const ownerDocument = document.implementation.createHTMLDocument('shopflow');
  ownerDocument.body.innerHTML = '<main></main>';
  Object.defineProperty(ownerDocument, 'URL', {
    configurable: true,
    value: sourceUrl,
  });
  return ownerDocument;
}

function isOwnedAlbertsonsFamilyUrl(sourceUrl: string) {
  try {
    return ALBERTSONS_FAMILY_HOST_RE.test(new URL(sourceUrl).hostname);
  } catch {
    return false;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
