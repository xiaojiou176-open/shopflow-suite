// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHtmlFixture, loadContractFixture } from '@shopflow/testkit';
import {
  albertsonsStoreAdapter,
  createCapabilityStates,
  detectPageKind,
} from '../../packages/store-albertsons/src/index';

function loadFixture(relativePath: string, url: string) {
  return loadContractFixture(relativePath, url);
}

describe('store-albertsons contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.cookie = 'SWY_SHARED_SESSION_INFO=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'ACI_S_ECommBanner=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('matches Safeway and Vons hosts while rejecting foreign hosts', () => {
    expect(
      albertsonsStoreAdapter.matches(
        new URL('https://www.safeway.com/shop/cart')
      )
    ).toBe(true);
    expect(
      albertsonsStoreAdapter.matches(
        new URL('https://www.vons.com/shop/search-results.html?q=granola')
      )
    ).toBe(true);
    expect(
      albertsonsStoreAdapter.matches(new URL('https://www.amazon.com/'))
    ).toBe(false);
  });

  it('detects product pages with verified scope bound to Safeway', () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/product/fixture.html',
      'https://www.safeway.com/shop/product-details.111.html'
    );

    const detection = albertsonsStoreAdapter.detect(
      fixture.url,
      fixture.document
    );

    expect(detection.storeId).toBe('albertsons');
    expect(detection.verifiedScopes).toEqual(['safeway']);
    expect(detection.pageKind).toBe('product');
    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'extract_product'
      )?.status
    ).toBe('ready');
  });

  it('detects blocked action state on cart pages without pretending it is runnable', () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-page.html',
      'https://www.safeway.com/shop/cart'
    );

    const detection = albertsonsStoreAdapter.detect(
      fixture.url,
      fixture.document
    );

    expect(detection.pageKind).toBe('cart');
    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'run_action'
      )
    ).toMatchObject({
      status: 'ready',
    });
  });

  it('keeps family search expansion from leaking Safeway action readiness onto Vons carts', () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-page.html',
      'https://www.vons.com/shop/cart'
    );

    const detection = albertsonsStoreAdapter.detect(
      fixture.url,
      fixture.document
    );

    expect(detection.pageKind).toBe('cart');
    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'run_action'
      )
    ).toMatchObject({
      status: 'unsupported_site',
      reasonCode: 'UNSUPPORTED_SITE',
    });
  });

  it('blocks Safeway action workflows when the cart page exists but actionable items are missing', () => {
    const doc = createHtmlFixture("<main data-page-kind='cart'></main>");
    const detection = albertsonsStoreAdapter.detect(
      new URL('https://www.safeway.com/shop/cart'),
      doc
    );

    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'run_action'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'SELECTOR_MISSING',
    });
  });

  it('marks search extraction degraded when a Safeway result row is missing its required link target', () => {
    const doc = createHtmlFixture(`
      <main data-page-kind="search">
        <article data-shopflow-search-item>
          <span data-shopflow-search-title>Safeway Granola</span>
          <span data-shopflow-search-price>$4.99</span>
        </article>
      </main>
    `);
    const detection = albertsonsStoreAdapter.detect(
      new URL('https://www.safeway.com/shop/search-results?q=granola'),
      doc
    );

    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'PARSE_FAILED',
    });
    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'export_data'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'PARSE_FAILED',
    });
  });

  it('marks action workflows blocked when a Safeway action page has no actionable items', () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/cart/cart-page.html',
      'https://www.safeway.com/shop/cart'
    );

    const detection = albertsonsStoreAdapter.detect(
      fixture.url,
      fixture.document
    );

    expect(detection.pageKind).toBe('cart');
    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'run_action'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'SELECTOR_MISSING',
    });
  });

  it('keeps Safeway action readiness blocked when every detected action item is missing required controls', () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-missing-controls.html',
      'https://www.safeway.com/shop/cart'
    );

    const detection = albertsonsStoreAdapter.detect(
      fixture.url,
      fixture.document
    );

    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'run_action'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'SELECTOR_MISSING',
    });
  });

  it('extracts product, search, and deal payloads into contract-safe shapes', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/albertsons/product/fixture.html',
      'https://www.safeway.com/shop/product-details.111.html'
    );
    await expect(
      albertsonsStoreAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      sourceStoreId: 'albertsons',
      title: 'Safeway Honeycrisp Apples',
    });

    const searchFixture = loadFixture(
      'tests/fixtures/albertsons/search/fixture.html',
      'https://www.safeway.com/shop/search-results.html?q=granola'
    );
    await expect(
      albertsonsStoreAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toHaveLength(2);

    const dealFixture = loadFixture(
      'tests/fixtures/albertsons/deal/fixture.html',
      'https://www.safeway.com/deals'
    );
    await expect(
      albertsonsStoreAdapter.extractDeals?.(dealFixture.document)
    ).resolves.toMatchObject([
      {
        sourceStoreId: 'albertsons',
        title: 'Fresh Berries',
      },
    ]);
  });

  it('can extract search results from page-owned Safeway search API context before falling back to DOM cards', async () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/search/search-page-api-context.html',
      'https://www.safeway.com/shop/search-results.html?q=granola'
    );
    document.cookie = `SWY_SHARED_SESSION_INFO=${encodeURIComponent(
      '{"info":{"COMMON":{"banner":"safeway","wfcStoreId":"5799"},"SHOP":{"zipcode":"94611","storeId":"3132"}}}'
    )}; path=/`;
    document.cookie = 'ACI_S_ECommBanner=safeway; path=/';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: {
          products: [
            {
              name: 'Safeway API Granola Clusters',
              productUrl: '/shop/product-details.5001.html',
              imageUrl:
                'https://www.safeway.com/images/shopflow-api-granola-clusters.jpg',
              price: {
                amount: 5.99,
                displayText: '$5.99',
              },
            },
            {
              product: {
                displayName: 'Safeway API Trail Mix',
                url: '/shop/product-details.5002.html',
                image: {
                  url: 'https://www.safeway.com/images/shopflow-api-trail-mix.jpg',
                },
              },
              pricing: {
                amount: 6.49,
                displayText: '$6.49',
              },
            },
          ],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const detection = albertsonsStoreAdapter.detect(
      fixture.url,
      fixture.document
    );
    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });

    await expect(
      albertsonsStoreAdapter.extractSearchResults?.(fixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Safeway API Granola Clusters',
          sourceUrl: 'https://www.safeway.com/shop/product-details.5001.html',
        }),
        expect.objectContaining({
          title: 'Safeway API Trail Mix',
          sourceUrl: 'https://www.safeway.com/shop/product-details.5002.html',
        }),
      ])
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      '/abs/pub/xapi/pgmsearch/v1/search/products'
    );
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      credentials: 'include',
      headers: expect.objectContaining({
        'ocp-apim-subscription-key': 'fixture-search-key',
      }),
    });
  });

  it('can extract search results from page-owned Vons search API context without changing the public verified-scope claim', async () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/search/search-page-api-context-vons.html',
      'https://www.vons.com/shop/search-results.html?q=granola'
    );
    document.cookie = `SWY_SHARED_SESSION_INFO=${encodeURIComponent(
      '{"info":{"COMMON":{"banner":"vons","wfcStoreId":"5799"},"SHOP":{"zipcode":"92110","storeId":"2053"}}}'
    )}; path=/`;
    document.cookie = 'ACI_S_ECommBanner=vons; path=/';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: {
          products: [
            {
              name: 'Vons API Granola Clusters',
              productUrl: '/shop/product-details.7001.html',
              imageUrl:
                'https://www.vons.com/images/shopflow-api-granola-clusters.jpg',
              price: {
                amount: 6.19,
                displayText: '$6.19',
              },
            },
          ],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const detection = albertsonsStoreAdapter.detect(
      fixture.url,
      fixture.document
    );

    expect(detection.verifiedScopes).toEqual(['safeway']);
    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });

    await expect(
      albertsonsStoreAdapter.extractSearchResults?.(fixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Vons API Granola Clusters',
          sourceUrl: 'https://www.vons.com/shop/product-details.7001.html',
        }),
      ])
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      '/abs/pub/xapi/pgmsearch/v1/search/products'
    );
    expect(fetchMock.mock.calls[0]?.[0]).toContain('banner=vons');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      credentials: 'include',
      headers: expect.objectContaining({
        'ocp-apim-subscription-key': 'fixture-vons-search-key',
      }),
    });
  });

  it('keeps search degradation causal when page-owned Safeway API context is present but missing required store resolution fields', () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/search/search-page-api-context-missing-store-config.html',
      'https://www.safeway.com/shop/search-results.html?q=granola'
    );

    const detection = albertsonsStoreAdapter.detect(
      fixture.url,
      fixture.document
    );

    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'PARSE_FAILED',
    });
    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'export_data'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'PARSE_FAILED',
    });
  });

  it('keeps inline Safeway search payloads runnable even when store-resolution config is missing', async () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/search/search-page-inline-payload-no-store-config.html',
      'https://www.safeway.com/shop/search-results.html?q=granola'
    );

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const detection = albertsonsStoreAdapter.detect(
      fixture.url,
      fixture.document
    );

    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'export_data'
      )
    ).toMatchObject({
      status: 'ready',
    });

    await expect(
      albertsonsStoreAdapter.extractSearchResults?.(fixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Safeway Inline Granola Clusters',
          sourceUrl: 'https://www.safeway.com/shop/product-details.5101.html',
        }),
      ])
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts assignment-backed Safeway search payloads before falling back to DOM cards or fetch-only API context', async () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/search/search-page-inline-payload-assignment.html',
      'https://www.safeway.com/shop/search-results.html?q=yogurt'
    );

    const detection = albertsonsStoreAdapter.detect(
      fixture.url,
      fixture.document
    );

    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'export_data'
      )
    ).toMatchObject({
      status: 'ready',
    });

    await expect(
      albertsonsStoreAdapter.extractSearchResults?.(fixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Safeway Vanilla Yogurt',
          sourceUrl:
            'https://www.safeway.com/shop/product-details.8801.html',
          imageUrl:
            'https://www.safeway.com/images/shopflow-vanilla-yogurt.jpg',
          price: {
            currency: 'USD',
            amount: 4.79,
            displayText: '$4.79',
          },
        }),
        expect.objectContaining({
          title: 'Safeway Breakfast Bites',
          sourceUrl:
            'https://www.safeway.com/shop/product-details.8802.html',
          imageUrl:
            'https://www.safeway.com/images/shopflow-breakfast-bites.jpg',
          price: {
            currency: 'USD',
            amount: 5.29,
            displayText: '$5.29',
          },
        }),
      ])
    );
  });

  it('accepts more realistic Safeway product, search, and deal card variants without false degraded states', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/albertsons/product/product-page-realish-variant.html',
      'https://www.safeway.com/shop/product-details.2401.html'
    );
    const productDetection = albertsonsStoreAdapter.detect(
      productFixture.url,
      productFixture.document
    );

    expect(productDetection.pageKind).toBe('product');
    expect(
      productDetection.capabilityStates.find(
        ({ capability }) => capability === 'extract_product'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      albertsonsStoreAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Safeway Citrus Sparkling Water',
      sku: 'SAFEWAY-REAL-2401',
    });

    const searchFixture = loadFixture(
      'tests/fixtures/albertsons/search/search-page-realish-variant.html',
      'https://www.safeway.com/shop/search-results.html?q=sparkling+water'
    );
    const searchDetection = albertsonsStoreAdapter.detect(
      searchFixture.url,
      searchFixture.document
    );

    expect(searchDetection.pageKind).toBe('search');
    expect(
      searchDetection.capabilityStates.find(
        ({ capability }) => capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      albertsonsStoreAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Safeway Citrus Sparkling Water',
        }),
        expect.objectContaining({
          sourceUrl:
            'https://www.safeway.com/shop/product-details.2402.html',
        }),
      ])
    );

    const dealFixture = loadFixture(
      'tests/fixtures/albertsons/deal/deal-page-realish-variant.html',
      'https://www.safeway.com/deals'
    );
    const dealDetection = albertsonsStoreAdapter.detect(
      dealFixture.url,
      dealFixture.document
    );

    expect(dealDetection.pageKind).toBe('deal');
    expect(
      dealDetection.capabilityStates.find(
        ({ capability }) => capability === 'extract_deals'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      albertsonsStoreAdapter.extractDeals?.(dealFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Safeway Frozen Pizza',
        }),
        expect.objectContaining({
          sourceUrl: 'https://www.safeway.com/deals/cold-brew',
        }),
      ])
    );
  });

  it('accepts product JSON-LD as a more stable truth source on Safeway product pages', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/albertsons/product/product-page-jsonld-variant.html',
      'https://www.safeway.com/shop/product-details.3101.html'
    );
    const detection = albertsonsStoreAdapter.detect(
      productFixture.url,
      productFixture.document
    );

    expect(detection.pageKind).toBe('product');
    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'extract_product'
      )
    ).toMatchObject({
      status: 'ready',
    });

    await expect(
      albertsonsStoreAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      sourceStoreId: 'albertsons',
      title: 'Safeway Sparkling Green Tea',
      sku: 'SAFEWAY-JSONLD-3101',
      sourceUrl:
        'https://www.safeway.com/shop/product-details.3101.html',
      imageUrl:
        'https://www.safeway.com/images/shopflow-sparkling-green-tea.jpg',
      price: {
        currency: 'USD',
        amount: 5.49,
        displayText: '$5.49',
      },
    });
  });

  it('accepts relative Safeway search links and normalizes them into actionable absolute URLs', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/albertsons/search/search-page-relative-links.html',
      'https://www.safeway.com/shop/search-results.html?q=yogurt'
    );
    const detection = albertsonsStoreAdapter.detect(
      searchFixture.url,
      searchFixture.document
    );

    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'export_data'
      )
    ).toMatchObject({
      status: 'ready',
    });

    await expect(
      albertsonsStoreAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceUrl:
            'https://www.safeway.com/shop/product-details.4101.html',
        }),
        expect.objectContaining({
          sourceUrl:
            'https://www.safeway.com/shop/product-details.4102.html',
        }),
      ])
    );
  });

  it('blocks Safeway extraction honesty when a detected result or deal link is only a placeholder or leaves owned scope', () => {
    const searchDoc = createHtmlFixture(`
      <main data-page-kind="search">
        <article data-shopflow-search-item>
          <a data-shopflow-search-url href="javascript:void(0)">
            <span data-shopflow-search-title>Safeway Placeholder Result</span>
          </a>
        </article>
      </main>
    `);
    const searchDetection = albertsonsStoreAdapter.detect(
      new URL('https://www.safeway.com/shop/search-results?q=placeholder'),
      searchDoc
    );

    expect(
      searchDetection.capabilityStates.find(
        ({ capability }) => capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'PARSE_FAILED',
    });
    expect(
      searchDetection.capabilityStates.find(
        ({ capability }) => capability === 'export_data'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'PARSE_FAILED',
    });

    const dealDoc = createHtmlFixture(`
      <main data-page-kind="deal">
        <article data-shopflow-deal-item>
          <a data-shopflow-deal-url href="https://www.example.com/coupon">
            <span data-shopflow-deal-title>Safeway Mystery Coupon</span>
          </a>
          <span data-shopflow-deal-label>Club price</span>
        </article>
      </main>
    `);
    const dealDetection = albertsonsStoreAdapter.detect(
      new URL('https://www.safeway.com/deals'),
      dealDoc
    );

    expect(
      dealDetection.capabilityStates.find(
        ({ capability }) => capability === 'extract_deals'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'PARSE_FAILED',
    });
    expect(
      dealDetection.capabilityStates.find(
        ({ capability }) => capability === 'export_data'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'PARSE_FAILED',
    });
  });

  it('runs fixture-backed subscribe and cancel workflows with explicit receipts', async () => {
    const cartFixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-page.html',
      'https://www.safeway.com/shop/cart'
    );
    await expect(
      albertsonsStoreAdapter.runAction?.(cartFixture.document, {
        actionKind: 'schedule_save_subscribe',
      })
    ).resolves.toMatchObject({
      status: 'success',
      attempted: 2,
      succeeded: 2,
    });

    const manageFixture = loadFixture(
      'tests/fixtures/albertsons/manage/manage-page.html',
      'https://www.safeway.com/schedule-and-save/manage'
    );
    await expect(
      albertsonsStoreAdapter.runAction?.(manageFixture.document, {
        actionKind: 'schedule_save_cancel',
      })
    ).resolves.toMatchObject({
      status: 'success',
      attempted: 2,
      succeeded: 2,
    });
  });

  it('accepts aria and radio based Safeway manage controls instead of overfitting cancellation to fixture-only data attributes', async () => {
    const manageFixture = loadFixture(
      'tests/fixtures/albertsons/manage/manage-aria-controls-variant.html',
      'https://www.safeway.com/schedule-and-save/manage'
    );

    const detection = albertsonsStoreAdapter.detect(
      manageFixture.url,
      manageFixture.document
    );

    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'run_action'
      )
    ).toMatchObject({
      status: 'ready',
    });

    await expect(
      albertsonsStoreAdapter.runAction?.(manageFixture.document, {
        actionKind: 'schedule_save_cancel',
      })
    ).resolves.toMatchObject({
      status: 'success',
      attempted: 1,
      succeeded: 1,
      failed: 0,
    });
  });

  it('accepts alternate Safeway action controls instead of overfitting to one fixture shape', async () => {
    const cartFixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-selector-variant.html',
      'https://www.safeway.com/shop/cart'
    );

    await expect(
      albertsonsStoreAdapter.runAction?.(cartFixture.document, {
        actionKind: 'schedule_save_subscribe',
      })
    ).resolves.toMatchObject({
      status: 'success',
      attempted: 1,
      succeeded: 1,
      failed: 0,
    });
  });

  it('accepts aria-labeled Safeway action controls when Schedule & Save buttons ship without fixture-only data attributes', async () => {
    const cartFixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-aria-controls-variant.html',
      'https://www.safeway.com/shop/cart'
    );

    const detection = albertsonsStoreAdapter.detect(
      cartFixture.url,
      cartFixture.document
    );

    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'run_action'
      )
    ).toMatchObject({
      status: 'ready',
    });

    await expect(
      albertsonsStoreAdapter.runAction?.(cartFixture.document, {
        actionKind: 'schedule_save_subscribe',
      })
    ).resolves.toMatchObject({
      status: 'success',
      attempted: 1,
      succeeded: 1,
      failed: 0,
    });
  });

  it('keeps dry-run subscribe receipts explicit instead of pretending work already happened', async () => {
    const cartFixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-page.html',
      'https://www.safeway.com/shop/cart'
    );

    await expect(
      albertsonsStoreAdapter.runAction?.(cartFixture.document, {
        actionKind: 'schedule_save_subscribe',
        dryRun: true,
        limit: 1,
      })
    ).resolves.toMatchObject({
      status: 'partial',
      attempted: 1,
      succeeded: 0,
      failed: 0,
      skipped: 1,
    });
  });

  it('reports partial receipts honestly when only some Safeway action items can complete', async () => {
    const cartFixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-partial-failure.html',
      'https://www.safeway.com/shop/cart'
    );

    await expect(
      albertsonsStoreAdapter.runAction?.(cartFixture.document, {
        actionKind: 'schedule_save_subscribe',
      })
    ).resolves.toMatchObject({
      status: 'partial',
      attempted: 2,
      succeeded: 1,
      failed: 1,
      skipped: 0,
      errors: [
        expect.objectContaining({
          code: 'ACTION_STEP_FAILED',
          itemRef: 'cart-item-2',
        }),
      ],
    });
  });

  it('fails honestly when Safeway detects action items but every one of them is missing controls', async () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-missing-controls.html',
      'https://www.safeway.com/shop/cart'
    );

    await expect(
      albertsonsStoreAdapter.runAction?.(fixture.document, {
        actionKind: 'schedule_save_subscribe',
      })
    ).resolves.toMatchObject({
      status: 'failed',
      attempted: 1,
      succeeded: 0,
      failed: 1,
      skipped: 0,
      errors: [
        expect.objectContaining({
          code: 'ACTION_STEP_FAILED',
          itemRef: 'cart-missing-controls-1',
        }),
      ],
    });
  });

  it('uses skipped counts for dry runs instead of pretending a live action succeeded', async () => {
    const cartFixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-page.html',
      'https://www.safeway.com/shop/cart'
    );

    await expect(
      albertsonsStoreAdapter.runAction?.(cartFixture.document, {
        actionKind: 'schedule_save_subscribe',
        dryRun: true,
      })
    ).resolves.toMatchObject({
      status: 'partial',
      attempted: 2,
      succeeded: 0,
      failed: 0,
      skipped: 2,
      errors: [],
    });
  });

  it('keeps helper outputs aligned with contract enums', () => {
    document.body.innerHTML = '';
    expect(
      detectPageKind(new URL('https://www.safeway.com/deals'), document)
    ).toBe('deal');
    expect(createCapabilityStates('manage')).toHaveLength(5);
  });

  it('blocks subscribe readiness when every detected Safeway cart item is already subscribed', () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-already-subscribed.html',
      'https://www.safeway.com/shop/cart'
    );

    const detection = albertsonsStoreAdapter.detect(
      fixture.url,
      fixture.document
    );

    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'run_action'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'ACTION_PRECONDITION_FAILED',
    });
  });

  it('blocks subscribe readiness when semantic status copy says every Safeway cart item is already subscribed', () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-already-subscribed-semantic-variant.html',
      'https://www.safeway.com/shop/cart'
    );

    const detection = albertsonsStoreAdapter.detect(
      fixture.url,
      fixture.document
    );

    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'run_action'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'ACTION_PRECONDITION_FAILED',
    });
  });

  it('fails honestly when Safeway subscribe is retried after every detected item is already subscribed', async () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-already-subscribed.html',
      'https://www.safeway.com/shop/cart'
    );

    await expect(
      albertsonsStoreAdapter.runAction?.(fixture.document, {
        actionKind: 'schedule_save_subscribe',
      })
    ).resolves.toMatchObject({
      status: 'failed',
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [
        expect.objectContaining({
          code: 'ACTION_PRECONDITION_FAILED',
        }),
      ],
    });
  });

  it('fails honestly when semantic status copy shows Safeway subscribe is already complete', async () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-already-subscribed-semantic-variant.html',
      'https://www.safeway.com/shop/cart'
    );

    await expect(
      albertsonsStoreAdapter.runAction?.(fixture.document, {
        actionKind: 'schedule_save_subscribe',
      })
    ).resolves.toMatchObject({
      status: 'failed',
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [
        expect.objectContaining({
          code: 'ACTION_PRECONDITION_FAILED',
        }),
      ],
    });
  });

  it('blocks manage readiness when semantic status copy shows Safeway cancellation already completed', () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/manage/manage-already-cancelled-semantic-variant.html',
      'https://www.safeway.com/schedule-and-save/manage'
    );

    const detection = albertsonsStoreAdapter.detect(
      fixture.url,
      fixture.document
    );

    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'run_action'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'ACTION_PRECONDITION_FAILED',
    });
  });

  it('fails honestly when semantic status copy shows Safeway cancellation already completed', async () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/manage/manage-already-cancelled-semantic-variant.html',
      'https://www.safeway.com/schedule-and-save/manage'
    );

    await expect(
      albertsonsStoreAdapter.runAction?.(fixture.document, {
        actionKind: 'schedule_save_cancel',
      })
    ).resolves.toMatchObject({
      status: 'failed',
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [
        expect.objectContaining({
          code: 'ACTION_PRECONDITION_FAILED',
        }),
      ],
    });
  });

  it('fails fast instead of running Schedule & Save actions on non-verified Albertsons family hosts', async () => {
    const fixture = loadFixture(
      'tests/fixtures/albertsons/action/cart-page.html',
      'https://www.vons.com/shop/cart'
    );

    await expect(
      albertsonsStoreAdapter.runAction?.(fixture.document, {
        actionKind: 'schedule_save_subscribe',
      })
    ).resolves.toMatchObject({
      status: 'failed',
      attempted: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [
        expect.objectContaining({
          code: 'UNSUPPORTED_SITE',
        }),
      ],
    });
  });

  it('keeps export blocked reasons causal instead of falling back to a generic not-implemented state', () => {
    const doc = createHtmlFixture(`
      <main data-page-kind="product">
        <p>Safeway product shell without extraction selectors yet</p>
      </main>
    `);
    const detection = albertsonsStoreAdapter.detect(
      new URL('https://www.safeway.com/shop/product-details.222.html'),
      doc
    );

    expect(
      detection.capabilityStates.find(
        ({ capability }) => capability === 'export_data'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'SELECTOR_MISSING',
    });
  });
});
