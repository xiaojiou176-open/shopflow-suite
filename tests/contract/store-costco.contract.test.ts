// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSimpleStorefrontContractHarness,
  createHtmlFixture,
  createPageKindFixture,
} from '@shopflow/testkit';
import { costcoAdapter } from '@shopflow/store-costco';

describe('store-costco contract', () => {
  const costco = createSimpleStorefrontContractHarness('costco', costcoAdapter);

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('matches Costco hosts and rejects foreign hosts', () => {
    const foreignInspection = costco.inspectDetection(
      'https://www.walmart.com/',
      createPageKindFixture('unknown')
    );

    expect(
      costco.inspectDetection(
        'https://www.costco.com/CatalogSearch',
        createPageKindFixture('search')
      ).matches
    ).toBe(true);
    expect(foreignInspection.matches).toBe(false);
  });

  it('declares product extraction honestly on product pages', () => {
    const inspection = costco.inspectDetection(
      'https://www.costco.com/CProductDisplay',
      createHtmlFixture(`
        <main data-page-kind="product">
          <h1 data-testid="pdp-product-name">Kirkland Cold Brew</h1>
        </main>
      `)
    );

    expect(inspection).toMatchObject({
      detection: {
        storeId: 'costco',
        pageKind: 'product',
        verifiedScopes: ['costco'],
      },
    });
    expect(inspection.capabilityStatuses).toMatchObject({
      extract_product: 'ready',
      run_action: 'unsupported_page',
    });
  });

  it('degrades Costco product extraction when the page kind is recognized but selectors are missing', () => {
    const inspection = costco.inspectDetection(
      'https://www.costco.com/CProductDisplay',
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

  it('marks Costco search extraction parse-failed when a recognized result row is missing a required URL', () => {
    const inspection = costco.inspectDetection(
      'https://www.costco.com/CatalogSearch?keyword=cold+brew',
      createHtmlFixture(`
        <main data-page-kind="search">
          <article data-shopflow-search-item>
            <span data-shopflow-search-title>Kirkland Missing URL Cold Brew</span>
          </article>
        </main>
      `)
    );

    expect(
      inspection.detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('result URL'),
    });
    expect(
      inspection.detection.capabilityStates.find(
        (state) => state.capability === 'export_data'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('result URL'),
    });
  });

  it('extracts Costco product and search payloads from fixtures', async () => {
    const productFixture = costco.loadFixture(
      'product/product-page.html',
      'https://www.costco.com/kirkland-cold-brew.product.400001.html'
    );
    await expect(
      costcoAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      sourceStoreId: 'costco',
      title: 'Kirkland Signature Cold Brew',
      sku: 'COSTCO-400001',
    });

    const searchFixture = costco.loadFixture(
      'search/search-page.html',
      'https://www.costco.com/CatalogSearch?keyword=cold+brew'
    );
    await expect(
      costcoAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toHaveLength(2);
  });

  it('keeps Costco product image fidelity on lazy-loaded hero variants instead of dropping the image field', async () => {
    const productFixture = costco.loadFixture(
      'product/product-page-lazy-image-variant.html',
      'https://www.costco.com/kirkland-cold-brew.product.400401.html'
    );

    const inspection = costco.inspectDetection(
      productFixture.url.toString(),
      productFixture.document
    );

    expect(inspection.detection.pageKind).toBe('product');
    expect(inspection.capabilityStatuses.extract_product).toBe('ready');

    await expect(
      costcoAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Kirkland Lazy Hero Cold Brew',
      sku: 'COSTCO-LAZY-400401',
      imageUrl: 'https://www.costco.com/images/cold-brew-hero@2x.jpg',
    });
  });

  it('extracts Costco DOM-card search images from lazy image variants instead of dropping card fidelity', async () => {
    const searchFixture = costco.loadFixture(
      'search/search-page-card-image-variant.html',
      'https://www.costco.com/CatalogSearch?keyword=coffee+storage'
    );

    const inspection = costco.inspectDetection(
      searchFixture.url.toString(),
      searchFixture.document
    );

    expect(inspection.detection.pageKind).toBe('search');
    expect(inspection.capabilityStatuses.extract_search).toBe('ready');

    await expect(
      costcoAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Kirkland Storage Tote',
          sourceUrl:
            'https://www.costco.com/kirkland-storage-tote.product.400501.html',
          imageUrl: 'https://www.costco.com/images/storage-tote@2x.jpg',
        }),
        expect.objectContaining({
          title: 'Kitchen Pantry Canisters',
          sourceUrl:
            'https://www.costco.com/kitchen-pantry-canisters.product.400502.html',
          imageUrl:
            'https://www.costco.com/images/kitchen-pantry-canisters.jpg',
        }),
      ])
    );
  });

  it('prefers page-owned search JSON-LD item lists over fixture-only DOM cards', async () => {
    const searchFixture = costco.loadFixture(
      'search/search-page-jsonld-variant.html',
      'https://www.costco.com/CatalogSearch?keyword=cold+brew'
    );

    const inspection = costco.inspectDetection(
      searchFixture.url.toString(),
      searchFixture.document
    );

    expect(inspection.detection.pageKind).toBe('search');
    expect(inspection.capabilityStatuses.extract_search).toBe('ready');

    await expect(
      costcoAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Kirkland Colombian Cold Brew',
          sourceUrl:
            'https://www.costco.com/kirkland-colombian-cold-brew.product.400123.html',
          imageUrl: 'https://www.costco.com/images/cold-brew-400123.jpg',
          price: {
            currency: 'USD',
            amount: 17.49,
            displayText: '$17.49',
          },
        }),
        expect.objectContaining({
          title: 'Kirkland Vanilla Latte Pack',
          sourceUrl:
            'https://www.costco.com/kirkland-vanilla-latte-pack.product.400124.html',
          imageUrl: 'https://www.costco.com/images/latte-400124.jpg',
          price: {
            currency: 'USD',
            amount: 19.99,
            displayText: '$19.99',
          },
        }),
      ])
    );
  });

  it('reuses rewrite-page typeahead wiring before falling back to fixture-only search cards', async () => {
    const searchFixture = costco.loadFixture(
      'search/search-page-typeahead-variant.html',
      'https://www.costco.com/en-us/s/blt3d8f002292e47f8d?keyword=cold+brew'
    );

    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            docs: [
              {
                title: 'Kirkland Espresso Beans',
                url: '/kirkland-espresso-beans.product.400300.html',
                imageUrl: '/images/espresso-beans-400300.jpg',
                price: '16.79',
              },
              {
                doc: {
                  name: 'Organic Trail Mix',
                  href: 'https://www.costco.com/organic-trail-mix.product.400301.html',
                  thumbnailUrl:
                    'https://www.costco.com/images/trail-mix-400301.jpg',
                  salePrice: 13.49,
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
    );
    vi.stubGlobal('fetch', fetchMock);

    const inspection = costco.inspectDetection(
      searchFixture.url.toString(),
      searchFixture.document
    );

    expect(inspection.detection.pageKind).toBe('search');
    expect(inspection.capabilityStatuses.extract_search).toBe('ready');

    await expect(
      costcoAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Kirkland Espresso Beans',
          sourceUrl:
            'https://www.costco.com/kirkland-espresso-beans.product.400300.html',
          imageUrl: 'https://www.costco.com/images/espresso-beans-400300.jpg',
          price: {
            currency: 'USD',
            amount: 16.79,
            displayText: '$16.79',
          },
        }),
        expect.objectContaining({
          title: 'Organic Trail Mix',
          sourceUrl:
            'https://www.costco.com/organic-trail-mix.product.400301.html',
          imageUrl: 'https://www.costco.com/images/trail-mix-400301.jpg',
          price: {
            currency: 'USD',
            amount: 13.49,
            displayText: '$13.49',
          },
        }),
      ])
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestedUrl, requestedInit] = fetchMock.mock.calls[0] ?? [];
    expect(String(requestedUrl)).toBe(
      'https://search.costco.com/typeahead?query=cold%20brew'
    );
    expect(requestedInit).toMatchObject({
      headers: expect.objectContaining({
        Authorization: 'Basic shopflow-fixture-basic-auth',
      }),
    });
  });

  it('accepts assignment-backed Costco typeahead payloads before falling back to network-only search wiring', async () => {
    const searchFixture = costco.loadFixture(
      'search/search-page-typeahead-payload-assignment-variant.html',
      'https://www.costco.com/CatalogSearch?keyword=latte'
    );

    const inspection = costco.inspectDetection(
      searchFixture.url.toString(),
      searchFixture.document
    );

    expect(inspection.detection.pageKind).toBe('search');
    expect(inspection.capabilityStatuses.extract_search).toBe('ready');

    await expect(
      costcoAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Kirkland Cold Brew Cans',
          sourceUrl:
            'https://www.costco.com/kirkland-cold-brew-cans.product.401200.html',
          imageUrl: 'https://www.costco.com/images/cold-brew-cans-401200.jpg',
          price: {
            currency: 'USD',
            amount: 18.49,
            displayText: '$18.49',
          },
        }),
        expect.objectContaining({
          title: 'Organic Matcha Latte Mix',
          sourceUrl:
            'https://www.costco.com/organic-matcha-latte-mix.product.401201.html',
          imageUrl: 'https://www.costco.com/images/matcha-latte-401201.jpg',
          price: {
            currency: 'USD',
            amount: 21.99,
            displayText: '$21.99',
          },
        }),
      ])
    );
  });

  it('accepts product JSON-LD as a more stable truth source on product pages', async () => {
    const fixture = createHtmlFixture(`
      <main data-page-kind="product">
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Costco JSON-LD Cold Brew",
            "sku": "COSTCO-JSON-77",
            "url": "/kirkland-cold-brew.product.400077.html",
            "image": "/images/costco-json-cold-brew.jpg",
            "offers": {
              "@type": "Offer",
              "priceCurrency": "USD",
              "price": "15.49"
            }
          }
        </script>
      </main>
    `);

    const inspection = costco.inspectDetection(
      'https://www.costco.com/kirkland-cold-brew.product.400077.html',
      fixture
    );

    expect(inspection.capabilityStatuses.extract_product).toBe('ready');
    await expect(costcoAdapter.extractProduct?.(fixture)).resolves.toMatchObject({
      title: 'Costco JSON-LD Cold Brew',
      sku: 'COSTCO-JSON-77',
      sourceUrl: expect.stringContaining(
        '/kirkland-cold-brew.product.400077.html'
      ),
      imageUrl: expect.stringContaining('/images/costco-json-cold-brew.jpg'),
      price: {
        amount: 15.49,
      },
    });
  });

  it('accepts a more realistic Costco product variant without depending on test-only selectors', async () => {
    const productFixture = costco.loadFixture(
      'product/product-page-realish-variant.html',
      'https://www.costco.com/sparkling-water.product.7002.html'
    );

    const inspection = costco.inspectDetection(
      productFixture.url.toString(),
      productFixture.document
    );

    expect(inspection.detection.pageKind).toBe('product');
    await expect(
      costcoAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Kirkland Sparkling Water Pack',
      sku: 'COSTCO-ALT-7002',
    });
  });
});
