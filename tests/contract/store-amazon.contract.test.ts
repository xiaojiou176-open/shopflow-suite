// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import {
  createSimpleStorefrontContractHarness,
  createHtmlFixture,
  createPageKindFixture,
} from '@shopflow/testkit';
import { amazonAdapter } from '@shopflow/store-amazon';

describe('store-amazon contract', () => {
  const amazon = createSimpleStorefrontContractHarness('amazon', amazonAdapter);

  it('matches amazon search pages and keeps the shell honest', () => {
    const inspection = amazon.inspectDetection(
      'https://www.amazon.com/s?k=coffee',
      createPageKindFixture(
        'search',
        `
          <article data-component-type="s-search-result">
            <a href="https://www.amazon.com/dp/shopflow-search-1">
              <h2><span>Amazon Search Coffee</span></h2>
            </a>
          </article>
        `
      )
    );

    expect(inspection).toMatchObject({
      matches: true,
      detection: {
        storeId: 'amazon',
        pageKind: 'search',
        verifiedScopes: ['amazon'],
      },
    });
    expect(inspection.capabilityStatuses).toMatchObject({
      extract_search: 'ready',
      run_action: 'unsupported_page',
    });
  });

  it('degrades Amazon search extraction when the page kind is recognized but selectors are missing', () => {
    const inspection = amazon.inspectDetection(
      'https://www.amazon.com/s?k=coffee',
      createPageKindFixture('search')
    );

    expect(
      inspection.detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
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

  it('marks Amazon search extraction parse-failed when a recognized result row is missing a required URL', () => {
    const inspection = amazon.inspectDetection(
      'https://www.amazon.com/s?k=beans',
      createPageKindFixture(
        'search',
        `
          <article data-component-type="s-search-result">
            <h2><span>Amazon Missing URL Beans</span></h2>
          </article>
        `
      )
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

  it('downgrades product extraction honestly outside product pages', () => {
    const inspection = amazon.inspectDetection(
      'https://www.amazon.com/s?k=beans',
      createHtmlFixture('<title>Amazon Search</title>')
    );

    expect(inspection.capabilityStatuses.extract_product).toBe('unsupported_page');
  });

  it('extracts Amazon product and search payloads from fixtures', async () => {
    const productFixture = amazon.loadFixture(
      'product/product-page.html',
      'https://www.amazon.com/dp/shopflow-grinder'
    );
    await expect(
      amazonAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      sourceStoreId: 'amazon',
      title: 'Amazon Burr Grinder',
      sku: 'B0SHOPFLOW',
    });

    const searchFixture = amazon.loadFixture(
      'search/search-page.html',
      'https://www.amazon.com/s?k=coffee'
    );
    await expect(
      amazonAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toHaveLength(2);
  });

  it('prefers semantic Amazon search cards backed by ASIN carriers over generic tracked links', async () => {
    const searchFixture = amazon.loadFixture(
      'search/search-page-semantic-asin-variant.html',
      'https://www.amazon.com/s?k=coffee+grinder'
    );
    const inspection = amazon.inspectDetection(
      searchFixture.url.toString(),
      searchFixture.document
    );

    expect(inspection.detection.pageKind).toBe('search');
    expect(inspection.capabilityStatuses.extract_search).toBe('ready');
    await expect(
      amazonAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Hamilton Beach Fresh Grind Electric Coffee Grinder',
          sourceUrl: 'https://www.amazon.com/dp/B005EPRFKO',
          imageUrl:
            'https://m.media-amazon.com/images/I/61EJRxaGwvL._AC_UL320_.jpg',
          price: {
            currency: 'USD',
            amount: 19.95,
            displayText: '$19.95',
          },
        }),
        expect.objectContaining({
          title: 'Cuisinart Grind Central Coffee Grinder',
          sourceUrl: 'https://www.amazon.com/dp/B0000A1ZN7',
          imageUrl:
            'https://m.media-amazon.com/images/I/6123iN7wlfL._AC_UL320_.jpg',
          price: {
            currency: 'USD',
            amount: 34.95,
            displayText: '$34.95',
          },
        }),
      ])
    );
  });

  it('accepts search JSON-LD item lists as a page-owned Amazon search truth source', async () => {
    const searchFixture = amazon.loadFixture(
      'search/search-page-jsonld-variant.html',
      'https://www.amazon.com/s?k=coffee+storage'
    );

    const inspection = amazon.inspectDetection(
      searchFixture.url.toString(),
      searchFixture.document
    );

    expect(inspection.detection.pageKind).toBe('search');
    expect(inspection.capabilityStatuses.extract_search).toBe('ready');

    await expect(
      amazonAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Amazon JSON-LD Storage Crate',
          sourceUrl: 'https://www.amazon.com/dp/B0JSONA001',
          imageUrl:
            'https://www.amazon.com/images/jsonld-storage-crate.jpg',
          price: {
            currency: 'USD',
            amount: 24.99,
            displayText: '$24.99',
          },
        }),
        expect.objectContaining({
          title: 'Amazon JSON-LD Pantry Bin',
          sourceUrl: 'https://www.amazon.com/dp/B0JSONA002',
          imageUrl: 'https://www.amazon.com/images/jsonld-pantry-bin.jpg',
          price: {
            currency: 'USD',
            amount: 31.49,
            displayText: '$31.49',
          },
        }),
      ])
    );
  });

  it('accepts product JSON-LD as a more stable truth source on product pages', async () => {
    const fixture = createPageKindFixture(
      'product',
      `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Amazon JSON-LD Grinder",
            "sku": "AMZ-JSON-42",
            "url": "/dp/amz-json-grinder",
            "image": "/images/amz-json-grinder.jpg",
            "offers": {
              "@type": "Offer",
              "priceCurrency": "USD",
              "price": "39.99"
            }
          }
        </script>
      `
    );

    const inspection = amazon.inspectDetection(
      'https://www.amazon.com/dp/amz-json-grinder',
      fixture
    );

    expect(inspection.capabilityStatuses.extract_product).toBe('ready');
    await expect(amazonAdapter.extractProduct?.(fixture)).resolves.toMatchObject({
      title: 'Amazon JSON-LD Grinder',
      sku: 'AMZ-JSON-42',
      sourceUrl: expect.stringContaining('/dp/amz-json-grinder'),
      imageUrl: expect.stringContaining('/images/amz-json-grinder.jpg'),
      price: {
        amount: 39.99,
      },
    });
  });

  it('accepts a more realistic Amazon product variant without depending on test-only selectors', async () => {
    const productFixture = amazon.loadFixture(
      'product/product-page-realish-variant.html',
      'https://www.amazon.com/dp/espresso-kettle'
    );

    const inspection = amazon.inspectDetection(
      productFixture.url.toString(),
      productFixture.document
    );

    expect(inspection.detection.pageKind).toBe('product');
    await expect(
      amazonAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Amazon Stainless Espresso Kettle',
      sku: 'B0ESPRESSO42',
    });
  });

  it('promotes hidden ASIN carriers into canonical product identity when JSON-LD is absent', async () => {
    const productFixture = amazon.loadFixture(
      'product/product-page-asin-carrier-variant.html',
      'https://www.amazon.com/gp/product/B0ASINC123/ref=ox_sc_act_title_1?smid=ATVPDKIKX0DER&psc=1'
    );

    const inspection = amazon.inspectDetection(
      productFixture.url.toString(),
      productFixture.document
    );

    expect(inspection.detection.pageKind).toBe('product');
    expect(inspection.capabilityStatuses.extract_product).toBe('ready');
    await expect(
      amazonAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Amazon Travel Grinder',
      sku: 'B0ASINC123',
      sourceUrl: 'https://www.amazon.com/dp/B0ASINC123',
      imageUrl: 'https://www.amazon.com/images/shopflow-travel-grinder.jpg',
      price: {
        amount: 29.99,
        currency: 'USD',
        displayText: '$29.99',
      },
    });
  });
});
