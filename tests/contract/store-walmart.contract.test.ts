// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import {
  createSimpleStorefrontContractHarness,
  createHtmlFixture,
  createPageKindFixture,
} from '@shopflow/testkit';
import { walmartAdapter } from '@shopflow/store-walmart';

describe('store-walmart contract', () => {
  const walmart = createSimpleStorefrontContractHarness(
    'walmart',
    walmartAdapter
  );

  it('matches Walmart hosts and rejects foreign hosts', () => {
    const foreignInspection = walmart.inspectDetection(
      'https://www.costco.com/',
      createPageKindFixture('unknown')
    );

    expect(
      walmart.inspectDetection(
        'https://www.walmart.com/search?q=coffee',
        createPageKindFixture('search')
      ).matches
    ).toBe(true);
    expect(foreignInspection.matches).toBe(false);
  });

  it('declares product extraction honestly on product pages', () => {
    const inspection = walmart.inspectDetection(
      'https://www.walmart.com/ip/shopflow-fixture',
      createHtmlFixture(`
        <main data-page-kind="product">
          <h1 itemprop="name">Walmart Family Coffee Pack</h1>
        </main>
      `)
    );

    expect(inspection).toMatchObject({
      detection: {
        storeId: 'walmart',
        pageKind: 'product',
        verifiedScopes: ['walmart'],
      },
    });
    expect(inspection.capabilityStatuses).toMatchObject({
      extract_product: 'ready',
      run_action: 'unsupported_page',
    });
  });

  it('degrades Walmart product extraction when the page kind is recognized but selectors are missing', () => {
    const inspection = walmart.inspectDetection(
      'https://www.walmart.com/ip/shopflow-fixture',
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

  it('marks Walmart search extraction parse-failed when a recognized result row is missing a required URL', () => {
    const inspection = walmart.inspectDetection(
      'https://www.walmart.com/search?q=coffee',
      createHtmlFixture(`
        <main data-page-kind="search">
          <article data-item-id="wm-missing-url">
            <span data-automation-id="product-title">Walmart Missing URL Coffee</span>
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

  it('extracts Walmart product and search payloads from fixtures', async () => {
    const productFixture = walmart.loadFixture(
      'product/product-page.html',
      'https://www.walmart.com/ip/shopflow-fixture'
    );
    await expect(
      walmartAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      sourceStoreId: 'walmart',
      title: 'Walmart Family Coffee Pack',
      sku: 'WM-SHOPFLOW-1',
    });

    const searchFixture = walmart.loadFixture(
      'search/search-page.html',
      'https://www.walmart.com/search?q=coffee'
    );
    await expect(
      walmartAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toHaveLength(2);
  });

  it('prefers Walmart page-owned __NEXT_DATA__ search payloads before falling back to DOM cards', async () => {
    const searchFixture = walmart.loadFixture(
      'search/search-page-next-data-variant.html',
      'https://www.walmart.com/search?q=coffee'
    );
    const inspection = walmart.inspectDetection(
      searchFixture.url.toString(),
      searchFixture.document
    );

    expect(inspection.detection.pageKind).toBe('search');
    expect(inspection.capabilityStatuses.extract_search).toBe('ready');
    await expect(
      walmartAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Walmart Payload Coffee Sampler',
          sourceUrl:
            'https://www.walmart.com/ip/walmart-payload-coffee-sampler/111',
          imageUrl:
            'https://i5.walmartimages.com/seo/walmart-payload-coffee-sampler.jpg',
          price: {
            currency: 'USD',
            amount: 14.88,
            displayText: '$14.88',
          },
        }),
        expect.objectContaining({
          title: 'Walmart Payload Espresso Roast',
          sourceUrl:
            'https://www.walmart.com/ip/walmart-payload-espresso-roast/222',
          imageUrl:
            'https://i5.walmartimages.com/seo/walmart-payload-espresso-roast.jpg',
          price: {
            currency: 'USD',
            amount: 9.44,
            displayText: '$9.44',
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
            "name": "Walmart JSON-LD Coffee Pack",
            "sku": "WM-JSON-55",
            "url": "/ip/wm-json-coffee-pack/55",
            "image": "/images/wm-json-coffee-pack.jpg",
            "offers": {
              "@type": "Offer",
              "priceCurrency": "USD",
              "price": "18.88"
            }
          }
        </script>
      </main>
    `);

    const inspection = walmart.inspectDetection(
      'https://www.walmart.com/ip/wm-json-coffee-pack/55',
      fixture
    );

    expect(inspection.capabilityStatuses.extract_product).toBe('ready');
    await expect(walmartAdapter.extractProduct?.(fixture)).resolves.toMatchObject({
      title: 'Walmart JSON-LD Coffee Pack',
      sku: 'WM-JSON-55',
      sourceUrl: expect.stringContaining('/ip/wm-json-coffee-pack/55'),
      imageUrl: expect.stringContaining('/images/wm-json-coffee-pack.jpg'),
      price: {
        amount: 18.88,
      },
    });
  });

  it('accepts a more realistic Walmart search-card variant without depending on test-only selectors', async () => {
    const searchFixture = walmart.loadFixture(
      'search/search-page-realish-variant.html',
      'https://www.walmart.com/search?q=kettle'
    );

    const inspection = walmart.inspectDetection(
      searchFixture.url.toString(),
      searchFixture.document
    );

    expect(inspection.detection.pageKind).toBe('search');
    await expect(
      walmartAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Cold Brew Starter Kit',
        }),
        expect.objectContaining({
          sourceUrl: 'https://www.walmart.com/ip/shopflow-kettle',
        }),
      ])
    );
  });
});
