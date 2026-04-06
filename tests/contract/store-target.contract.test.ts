// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSimpleStorefrontContractHarness,
  createHtmlFixture,
  createPageKindFixture,
} from '@shopflow/testkit';
import { targetAdapter } from '@shopflow/store-target';

describe('store-target contract', () => {
  const target = createSimpleStorefrontContractHarness('target', targetAdapter);

  afterEach(() => {
    vi.unstubAllGlobals();
    document.cookie = 'visitorId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('matches Target product URLs', () => {
    expect(
      target.inspectDetection(
        'https://www.target.com/p/example',
        createPageKindFixture('product')
      ).matches
    ).toBe(true);
  });

  it('declares product extraction honestly on product pages', () => {
    const inspection = target.inspectDetection(
      'https://www.target.com/p/example',
      createPageKindFixture(
        'product',
        '<h1 data-shopflow-product-title>Target Pantry Pasta</h1>'
      )
    );

    expect(inspection).toMatchObject({
      detection: {
        storeId: 'target',
        pageKind: 'product',
      },
    });
    expect(inspection.capabilityStatuses).toMatchObject({
      extract_product: 'ready',
      extract_deals: 'unsupported_page',
    });
  });

  it('degrades Target product extraction when the page kind is recognized but selectors are missing', () => {
    const inspection = target.inspectDetection(
      'https://www.target.com/p/example',
      createPageKindFixture('product')
    );

    expect(
      inspection.detection.capabilityStates.find(
        (state) => state.capability === 'extract_product'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'SELECTOR_MISSING',
    });
    expect(
      inspection.detection.capabilityStates.find(
        (state) => state.capability === 'export_data'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'SELECTOR_MISSING',
    });
  });

  it('declares search extraction honestly on search pages', () => {
    const inspection = target.inspectDetection(
      'https://www.target.com/c/grocery',
      createPageKindFixture(
        'search',
        `
          <article data-shopflow-search-item>
            <a data-shopflow-search-url href="https://www.target.com/p/pantry-pasta">
              <span data-shopflow-search-title>Target Pantry Pasta</span>
            </a>
          </article>
        `
      )
    );

    expect(inspection.detection.pageKind).toBe('search');
    expect(inspection.capabilityStatuses.extract_search).toBe('ready');
  });

  it('exposes the differentiated deals hook without pretending it is implemented', () => {
    const inspection = target.inspectDetection(
      'https://www.target.com/pl/deals',
      createHtmlFixture(`
        <main data-page-kind="deal">
          <article data-test="deal-card">
            <a data-test="deal-link" href="https://www.target.com/pl/deals/family-cereal">
              <span data-test="deal-title">Target Family Cereal</span>
            </a>
            <span data-test="deal-badge">Buy 2 save $3</span>
          </article>
        </main>
      `)
    );

    expect(inspection.matches).toBe(true);
    expect(inspection.detection.pageKind).toBe('deal');
    expect(inspection.capabilityStatuses).toMatchObject({
      extract_deals: 'ready',
      run_action: 'unsupported_page',
    });
  });

  it('marks Target deal extraction parse-failed when a recognized deal row is missing a required URL', () => {
    const inspection = target.inspectDetection(
      'https://www.target.com/pl/deals',
      createPageKindFixture(
        'deal',
        `
          <article data-test="deal-card">
            <span data-test="deal-title">Target Missing URL Deal</span>
            <span data-test="deal-badge">Buy 2 save $3</span>
          </article>
        `
      )
    );

    expect(
      inspection.detection.capabilityStates.find(
        (state) => state.capability === 'extract_deals'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('deal URL'),
    });
    expect(
      inspection.detection.capabilityStates.find(
        (state) => state.capability === 'export_data'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('deal URL'),
    });
  });

  it('extracts Target product, search, and deal payloads from fixtures', async () => {
    const productFixture = target.loadFixture(
      'product/product-page.html',
      'https://www.target.com/p/pantry-pasta'
    );
    await expect(
      targetAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      sourceStoreId: 'target',
      title: 'Target Pantry Pasta',
    });

    const searchFixture = target.loadFixture(
      'search/search-page.html',
      'https://www.target.com/c/grocery'
    );
    await expect(
      targetAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toHaveLength(2);

    const dealFixture = target.loadFixture(
      'deal/deal-page.html',
      'https://www.target.com/pl/deals'
    );
    await expect(
      targetAdapter.extractDeals?.(dealFixture.document)
    ).resolves.toMatchObject([
      {
        sourceStoreId: 'target',
        title: 'Family Cereal',
      },
    ]);
  });

  it('accepts product JSON-LD as a more stable truth source on product pages', async () => {
    const fixture = createPageKindFixture(
      'product',
      `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Target JSON-LD Pantry Pasta",
            "sku": "TARGET-JSON-88",
            "url": "/p/target-json-pasta/-/A-88",
            "image": "/images/target-json-pasta.jpg",
            "offers": {
              "@type": "Offer",
              "priceCurrency": "USD",
              "price": "6.49"
            }
          }
        </script>
      `
    );

    const inspection = target.inspectDetection(
      'https://www.target.com/p/target-json-pasta/-/A-88',
      fixture
    );

    expect(inspection.capabilityStatuses.extract_product).toBe('ready');
    await expect(targetAdapter.extractProduct?.(fixture)).resolves.toMatchObject({
      title: 'Target JSON-LD Pantry Pasta',
      sku: 'TARGET-JSON-88',
      sourceUrl: expect.stringContaining('/p/target-json-pasta/-/A-88'),
      imageUrl: expect.stringContaining('/images/target-json-pasta.jpg'),
      price: {
        amount: 6.49,
      },
    });
  });

  it('accepts a more realistic Target deal-card variant without depending on test-only selectors', async () => {
    const dealFixture = target.loadFixture(
      'deal/deal-page-realish-variant.html',
      'https://www.target.com/pl/sparkling-juice-deals'
    );

    const inspection = target.inspectDetection(
      dealFixture.url.toString(),
      dealFixture.document
    );

    expect(inspection.detection.pageKind).toBe('deal');
    await expect(
      targetAdapter.extractDeals?.(dealFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Sparkling Juice Variety Pack',
          dealLabel: 'Buy 2 save $3',
        }),
      ])
    );
  });

  it('uses Target page-owned search API context before falling back to DOM cards', async () => {
    const targetFixtureApiKeyField = 'apiKeyProduction';
    const targetFixtureApiKey = '0000000000000000000000000000000000000000';
    const fixture = createPageKindFixture(
      'search',
      `
        <script>
          window.__CONFIG__ = ${JSON.stringify({
            services: {
              cduiOrchestrations: {
                baseUrl: 'https://cdui-orchestrations.target.com',
                [targetFixtureApiKeyField]: targetFixtureApiKey,
                endpointPaths: {
                  pagesV1: 'cdui_orchestrations/v1/pages',
                },
              },
            },
          })};
          window.__TGT_DATA__ = {
            "serverLocationVariables": {
              "zipCode": "98102",
              "store_id": "2786",
              "store_ids": "2786,1284",
              "primaryStore": {
                "id": "2786",
                "storeName": "Seattle Pike Plaza",
                "zipCode": "98101"
              },
              "backupStoreIds": "2786,1284",
              "location": {
                "zipCode": "98102",
                "latitude": "47.630",
                "longitude": "-122.320",
                "state": "WA",
                "country": "US"
              }
            }
          };
          window.__PRELOADED_QUERIES__ = {
            "queries": [
              [
                ["site-top-of-funnel/get-cookies"],
                {
                  "visitorId": "019D4492CDAA0200ACC67B95AE51493A"
                }
              ]
            ]
          };
        </script>
        <div data-shopflow-search-term="granola"></div>
      `
    );
    Object.defineProperty(fixture, 'URL', {
      value: 'https://www.target.com/s?searchTerm=granola',
      configurable: true,
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data_source_modules: [
          {
            module_type: 'SearchWebDataSource',
            module_data: {
              search_response: {
                products: [
                  {
                    tcin: '50299918',
                    item: {
                      product_description: {
                        title: 'Purely Elizabeth Original Granola',
                      },
                      enrichment: {
                        buy_url:
                          'https://www.target.com/p/purely-elizabeth-original-grain-granola-12oz/-/A-50299918',
                        image_info: {
                          primary_image: {
                            url: 'https://target.scene7.com/is/image/Target/GUEST_granola',
                          },
                        },
                      },
                    },
                    price: {
                      current_retail: 4.99,
                      formatted_current_price: '$4.99',
                    },
                  },
                ],
              },
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const inspection = target.inspectDetection(
      'https://www.target.com/s?searchTerm=granola',
      fixture
    );

    expect(inspection.detection.pageKind).toBe('search');
    const results = await targetAdapter.extractSearchResults?.(fixture);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results).toEqual([
      expect.objectContaining({
        sourceStoreId: 'target',
        title: 'Purely Elizabeth Original Granola',
        sourceUrl:
          'https://www.target.com/p/purely-elizabeth-original-grain-granola-12oz/-/A-50299918',
        imageUrl: 'https://target.scene7.com/is/image/Target/GUEST_granola',
        price: expect.objectContaining({
          amount: 4.99,
          displayText: '$4.99',
        }),
      }),
    ]);
  });
});
