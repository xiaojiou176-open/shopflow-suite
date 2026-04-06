// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { createHtmlFixture, loadContractFixture } from '@shopflow/testkit';
import { krogerAdapter } from '@shopflow/store-kroger';

function loadFixture(relativePath: string, url: string) {
  return loadContractFixture(relativePath, url);
}

describe('store-kroger contract', () => {
  it('matches Fred Meyer and QFC hosts while rejecting foreign hosts', () => {
    expect(
      krogerAdapter.matches(new URL('https://www.fredmeyer.com/p/example'))
    ).toBe(true);
    expect(
      krogerAdapter.matches(new URL('https://weekly.qfc.com/search?query=olive'))
    ).toBe(true);
    expect(
      krogerAdapter.matches(new URL('https://www.qfc.com/search?query=olive'))
    ).toBe(true);
    expect(krogerAdapter.matches(new URL('https://www.amazon.com/'))).toBe(
      false
    );
  });

  it('declares deal extraction honestly on family deal pages', () => {
    const url = new URL('https://www.fredmeyer.com/savings/coupons');
    const doc = createHtmlFixture(`
      <main data-page-kind="deal">
        <article data-kroger-deal-item>
          <a href="https://www.fredmeyer.com/deals/blueberries">
            <span data-kroger-deal-title>Fred Meyer Blueberries</span>
          </a>
          <span data-kroger-deal-label>Digital coupon</span>
          <span data-kroger-deal-price>$3.99</span>
        </article>
      </main>
    `);
    const detection = krogerAdapter.detect(url, doc);

    expect(detection.pageKind).toBe('deal');
    expect(detection.verifiedScopes).toEqual(['fred-meyer', 'qfc']);
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_deals'
      )
    ).toMatchObject({
      status: 'ready',
    });
  });

  it('recognizes the newer weekly digital deals route as the same family deal surface', () => {
    const url = new URL('https://www.fredmeyer.com/pr/weekly-digital-deals');
    const doc = createHtmlFixture(`
      <main>
        <article data-kroger-deal-item>
          <a href="https://www.fredmeyer.com/deals/blueberries">
            <span data-kroger-deal-title>Fred Meyer Blueberries</span>
          </a>
          <span data-kroger-deal-label>Digital coupon</span>
          <span data-kroger-deal-price>$3.99</span>
        </article>
      </main>
    `);
    const detection = krogerAdapter.detect(url, doc);

    expect(detection.pageKind).toBe('deal');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_deals'
      )
    ).toMatchObject({
      status: 'ready',
    });
  });

  it('degrades family extraction when the page kind is recognized but selectors are missing', () => {
    const url = new URL('https://www.qfc.com/search?query=olive');
    const doc = createHtmlFixture("<main data-page-kind='search'></main>");
    const detection = krogerAdapter.detect(url, doc);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'SELECTOR_MISSING',
    });
  });

  it('marks family extraction parse-failed when a recognized result row is missing a required URL', () => {
    const url = new URL('https://www.fredmeyer.com/search?query=chips');
    const doc = createHtmlFixture(`
      <main data-page-kind="search">
        <article data-kroger-search-item>
          <span data-kroger-search-title>Fred Meyer Chips</span>
          <span data-kroger-search-price>$3.49</span>
        </article>
      </main>
    `);
    const detection = krogerAdapter.detect(url, doc);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('result URL'),
    });
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'export_data'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('result URL'),
    });
  });

  it('normalizes relative Kroger family result links into actionable absolute URLs', async () => {
    const url = new URL('https://www.qfc.com/search?query=bagels');
    const doc = createHtmlFixture(`
      <main data-page-kind="search">
        <article data-kroger-search-item>
          <a href="/p/family-bagels/9201">
            <span data-kroger-search-title>QFC Sesame Bagels</span>
          </a>
          <span data-kroger-search-price>$4.29</span>
        </article>
      </main>
    `);
    Object.defineProperty(doc, 'URL', {
      value: url.toString(),
      configurable: true,
    });

    const detection = krogerAdapter.detect(url, doc);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(krogerAdapter.extractSearchResults?.(doc)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceUrl: 'https://www.qfc.com/p/family-bagels/9201',
        }),
      ])
    );
  });

  it('blocks Kroger family search extraction honesty when a detected result row leaves owned scope', () => {
    const url = new URL('https://www.fredmeyer.com/search?query=coffee');
    const doc = createHtmlFixture(`
      <main data-page-kind="search">
        <article data-kroger-search-item>
          <a href="https://www.example.com/p/family-coffee/9202">
            <span data-kroger-search-title>Fred Meyer Family Coffee</span>
          </a>
          <span data-kroger-search-price>$8.49</span>
        </article>
      </main>
    `);
    Object.defineProperty(doc, 'URL', {
      value: url.toString(),
      configurable: true,
    });

    const detection = krogerAdapter.detect(url, doc);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('result URL'),
    });
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'export_data'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('result URL'),
    });
  });

  it('marks unsupported family pages honestly and keeps action workflows explicitly not implemented', () => {
    const fixture = loadFixture(
      'tests/fixtures/kroger/account/account-page.html',
      'https://www.qfc.com/my-account'
    );

    const detection = krogerAdapter.detect(fixture.url, fixture.document);

    expect(detection.pageKind).toBe('account');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_product'
      )
    ).toMatchObject({
      status: 'unsupported_page',
      reasonCode: 'UNSUPPORTED_PAGE',
    });
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'run_action'
      )
    ).toMatchObject({
      status: 'unsupported_page',
      reasonCode: 'UNSUPPORTED_PAGE',
    });
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'export_data'
      )
    ).toMatchObject({
      status: 'unsupported_page',
      reasonCode: 'UNSUPPORTED_PAGE',
    });
  });

  it('keeps export readiness tied to extraction readiness instead of run_action not_implemented semantics', () => {
    const fixture = loadFixture(
      'tests/fixtures/kroger/product/product-page.html',
      'https://www.fredmeyer.com/p/fred-meyer-family-granola/1001'
    );

    const detection = krogerAdapter.detect(fixture.url, fixture.document);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'run_action'
      )
    ).toMatchObject({
      status: 'not_implemented',
      reasonCode: 'NOT_IMPLEMENTED',
    });
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'export_data'
      )
    ).toMatchObject({
      status: 'ready',
    });
  });

  it('extracts Kroger family product, search, and deal payloads from fixtures', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/kroger/product/product-page.html',
      'https://www.fredmeyer.com/p/fred-meyer-family-granola/1001'
    );
    await expect(
      krogerAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      sourceStoreId: 'kroger',
      title: 'Fred Meyer Family Granola',
      sku: 'KROGER-FAM-1001',
    });

    const searchFixture = loadFixture(
      'tests/fixtures/kroger/search/search-page.html',
      'https://www.qfc.com/search?query=chips'
    );
    await expect(
      krogerAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toHaveLength(2);

    const dealFixture = loadFixture(
      'tests/fixtures/kroger/deal/deal-page.html',
      'https://www.fredmeyer.com/savings/coupons'
    );
    await expect(
      krogerAdapter.extractDeals?.(dealFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceStoreId: 'kroger',
          title: 'Fred Meyer Blueberries',
        }),
        expect.objectContaining({
          sourceStoreId: 'kroger',
          title: 'QFC Greek Yogurt',
        }),
      ])
    );
  });

  it('accepts a more realistic Kroger family product variant without losing product extraction fidelity', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/kroger/product/product-page-realish-variant.html',
      'https://www.qfc.com/p/family-granola-bars/2202'
    );
    const detection = krogerAdapter.detect(
      productFixture.url,
      productFixture.document
    );

    expect(detection.pageKind).toBe('product');
    await expect(
      krogerAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      sourceStoreId: 'kroger',
      title: 'QFC Family Granola Bars',
      sku: 'KROGER-FAM-2202',
    });
  });

  it('accepts product JSON-LD as a more stable Kroger family truth source on PDPs', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/kroger/product/product-page-jsonld-variant.html',
      'https://www.fredmeyer.com/p/fred-meyer-overnight-oats/4404'
    );
    const detection = krogerAdapter.detect(
      productFixture.url,
      productFixture.document
    );

    expect(detection.pageKind).toBe('product');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_product'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      krogerAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Fred Meyer Overnight Oats',
      sku: 'KROGER-JSON-4404',
      sourceUrl: 'https://www.fredmeyer.com/p/fred-meyer-overnight-oats/4404',
      imageUrl:
        'https://www.fredmeyer.com/images/shopflow-jsonld-oats.jpg',
      price: {
        currency: 'USD',
        amount: 6.79,
        displayText: '$6.79',
      },
    });
  });

  it('accepts page-owned Kroger family product payloads before falling back to JSON-LD or DOM selectors', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/kroger/product/product-page-payload-variant.html',
      'https://www.qfc.com/p/qfc-blueberry-waffles/7701'
    );
    const detection = krogerAdapter.detect(
      productFixture.url,
      productFixture.document
    );

    expect(detection.pageKind).toBe('product');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_product'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      krogerAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'QFC Blueberry Waffles',
      sku: 'KROGER-PAYLOAD-7701',
      sourceUrl: 'https://www.qfc.com/p/qfc-blueberry-waffles/7701',
      imageUrl: 'https://www.qfc.com/images/qfc-blueberry-waffles.jpg',
      price: {
        currency: 'USD',
        amount: 5.79,
        displayText: '$5.79',
      },
    });
  });

  it('marks payload-only Kroger family product pages parse-failed when the serialized product loses its title', () => {
    const productFixture = loadFixture(
      'tests/fixtures/kroger/product/product-page-payload-malformed-variant.html',
      'https://www.qfc.com/p/qfc-blueberry-waffles/7701'
    );
    const detection = krogerAdapter.detect(
      productFixture.url,
      productFixture.document
    );

    expect(detection.pageKind).toBe('product');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_product'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('product title'),
    });
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'export_data'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('product title'),
    });
  });

  it('accepts Kroger family product selectors used by product-detail card layouts', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/kroger/product/product-page-card-variant.html',
      'https://www.fredmeyer.com/p/family-soup-pack/3301'
    );
    const detection = krogerAdapter.detect(
      productFixture.url,
      productFixture.document
    );

    expect(detection.pageKind).toBe('product');
    await expect(
      krogerAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Fred Meyer Hearty Soup Pack',
      sku: 'KROGER-FAM-3301',
    });
  });

  it('accepts alternate Kroger family search selectors instead of overfitting to one DOM variant', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/kroger/search/search-page-variant.html',
      'https://www.fredmeyer.com/search?query=snacks'
    );

    const detection = krogerAdapter.detect(searchFixture.url, searchFixture.document);

    expect(detection.pageKind).toBe('search');
    await expect(
      krogerAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceStoreId: 'kroger',
          title: 'Fred Meyer Trail Mix',
        }),
        expect.objectContaining({
          sourceUrl: 'https://www.qfc.com/p/family-crackers/2002',
        }),
      ])
    );
  });

  it('uses serialized Kroger family search payloads before falling back to DOM cards', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/kroger/search/search-page-payload-variant.html',
      'https://www.qfc.com/search?query=sparkling-water'
    );
    const detection = krogerAdapter.detect(
      searchFixture.url,
      searchFixture.document
    );

    expect(detection.pageKind).toBe('search');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      krogerAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual([
      expect.objectContaining({
        title: 'QFC Citrus Sparkling Water',
        sourceUrl: 'https://www.qfc.com/p/qfc-citrus-sparkling-water/7811',
        imageUrl: 'https://www.qfc.com/images/qfc-citrus-sparkling-water.jpg',
        price: {
          currency: 'USD',
          amount: 4.49,
          displayText: '$4.49',
        },
        position: 0,
      }),
      expect.objectContaining({
        title: 'Fred Meyer Cold Brew Concentrate',
        sourceUrl:
          'https://www.fredmeyer.com/p/fred-meyer-cold-brew-concentrate/7812',
        imageUrl:
          'https://www.fredmeyer.com/images/fred-meyer-cold-brew-concentrate.jpg',
        price: {
          currency: 'USD',
          amount: 6.29,
          displayText: '$6.29',
        },
        position: 1,
      }),
    ]);
  });

  it('accepts assignment-backed Kroger family search payloads instead of overfitting to application/json script tags', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/kroger/search/search-page-payload-assignment-variant.html',
      'https://www.qfc.com/search?query=granola'
    );
    const detection = krogerAdapter.detect(
      searchFixture.url,
      searchFixture.document
    );

    expect(detection.pageKind).toBe('search');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      krogerAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual([
      expect.objectContaining({
        title: 'QFC Maple Granola',
        sourceUrl: 'https://www.qfc.com/p/qfc-maple-granola/7815',
        imageUrl: 'https://www.qfc.com/images/qfc-maple-granola.jpg',
        price: {
          currency: 'USD',
          amount: 4.89,
          displayText: '$4.89',
        },
        position: 0,
      }),
      expect.objectContaining({
        title: 'Fred Meyer Iced Coffee',
        sourceUrl:
          'https://www.fredmeyer.com/p/fred-meyer-iced-coffee/7816',
        price: {
          currency: 'USD',
          amount: 6.59,
          displayText: '$6.59',
        },
        position: 1,
      }),
    ]);
  });

  it('accepts nested Kroger family search payload shapes instead of only flat result fields', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/kroger/search/search-page-payload-nested-variant.html',
      'https://www.qfc.com/search?query=kombucha'
    );
    const detection = krogerAdapter.detect(
      searchFixture.url,
      searchFixture.document
    );

    expect(detection.pageKind).toBe('search');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      krogerAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual([
      expect.objectContaining({
        title: 'QFC Ginger Kombucha',
        sourceUrl: 'https://www.qfc.com/p/qfc-ginger-kombucha/9901',
        imageUrl: 'https://www.qfc.com/images/qfc-ginger-kombucha.jpg',
        price: {
          currency: 'USD',
          amount: 5.19,
          displayText: '$5.19',
        },
        position: 0,
      }),
      expect.objectContaining({
        title: 'Fred Meyer Coconut Granola',
        sourceUrl:
          'https://www.fredmeyer.com/p/fred-meyer-coconut-granola/9902',
        imageUrl:
          'https://www.fredmeyer.com/images/fred-meyer-coconut-granola.jpg',
        price: {
          currency: 'USD',
          amount: 3.89,
          displayText: '$3.89',
        },
        position: 1,
      }),
    ]);
  });

  it('accepts a more realistic Kroger family search-card variant without losing family host coverage', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/kroger/search/search-page-realish-variant.html',
      'https://www.qfc.com/search?query=breakfast'
    );
    const detection = krogerAdapter.detect(
      searchFixture.url,
      searchFixture.document
    );

    expect(detection.pageKind).toBe('search');
    await expect(
      krogerAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Fred Meyer Family Bagels',
        }),
        expect.objectContaining({
          sourceUrl: 'https://www.qfc.com/p/family-orange-juice/4102',
        }),
      ])
    );
  });

  it('derives Kroger family search URLs from payload slugs and product identifiers when explicit URLs are omitted', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/kroger/search/search-page-payload-identifier-variant.html',
      'https://www.qfc.com/search?query=olive+oil'
    );
    const detection = krogerAdapter.detect(
      searchFixture.url,
      searchFixture.document
    );

    expect(detection.pageKind).toBe('search');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      krogerAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual([
      expect.objectContaining({
        title: 'QFC Olive Oil',
        sourceUrl: 'https://www.qfc.com/p/qfc-olive-oil/5511',
        imageUrl: 'https://www.qfc.com/images/qfc-olive-oil.jpg',
        price: {
          currency: 'USD',
          amount: 8.79,
          displayText: '$8.79',
        },
        position: 0,
      }),
      expect.objectContaining({
        title: 'QFC Marinara Sauce',
        sourceUrl: 'https://www.qfc.com/p/qfc-marinara-sauce/5512',
        price: {
          currency: 'USD',
          amount: 4.29,
          displayText: '$4.29',
        },
        position: 1,
      }),
    ]);
  });

  it('accepts offer-card deal layouts without downgrading family deal extraction', async () => {
    const dealFixture = loadFixture(
      'tests/fixtures/kroger/deal/deal-page-offer-card-variant.html',
      'https://www.qfc.com/savings/coupons'
    );
    const detection = krogerAdapter.detect(dealFixture.url, dealFixture.document);

    expect(detection.pageKind).toBe('deal');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_deals'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      krogerAdapter.extractDeals?.(dealFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Fred Meyer Oat Milk',
        }),
        expect.objectContaining({
          sourceUrl: 'https://www.qfc.com/deals/pasta-sauce',
        }),
      ])
    );
  });

  it('uses serialized Kroger family deal payloads before falling back to coupon cards', async () => {
    const dealFixture = loadFixture(
      'tests/fixtures/kroger/deal/deal-page-payload-variant.html',
      'https://www.fredmeyer.com/savings/coupons'
    );
    const detection = krogerAdapter.detect(dealFixture.url, dealFixture.document);

    expect(detection.pageKind).toBe('deal');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_deals'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(krogerAdapter.extractDeals?.(dealFixture.document)).resolves.toEqual([
      expect.objectContaining({
        title: 'Fred Meyer Yogurt Cups',
        dealLabel: 'Digital coupon',
        sourceUrl: 'https://www.fredmeyer.com/savings/cl/coupon/8801',
        price: {
          currency: 'USD',
          amount: 3.59,
          displayText: '$3.59',
        },
      }),
      expect.objectContaining({
        title: 'QFC Pasta Sauce',
        dealLabel: 'Clip coupon',
        sourceUrl: 'https://www.qfc.com/savings/cl/coupon/8802',
        price: {
          currency: 'USD',
          amount: 2.99,
          displayText: '$2.99',
        },
      }),
    ]);
  });

  it('derives Kroger family coupon URLs from payload identifiers when explicit URLs are omitted', async () => {
    const dealFixture = loadFixture(
      'tests/fixtures/kroger/deal/deal-page-payload-identifier-variant.html',
      'https://www.qfc.com/savings/coupons'
    );
    const detection = krogerAdapter.detect(dealFixture.url, dealFixture.document);

    expect(detection.pageKind).toBe('deal');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_deals'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(krogerAdapter.extractDeals?.(dealFixture.document)).resolves.toEqual([
      expect.objectContaining({
        title: 'QFC Olive Tapenade',
        dealLabel: 'Clip coupon',
        sourceUrl: 'https://www.qfc.com/savings/cl/coupon/9911',
        price: {
          currency: 'USD',
          amount: 4.19,
          displayText: '$4.19',
        },
      }),
      expect.objectContaining({
        title: 'QFC Pasta Sauce',
        dealLabel: 'Digital coupon',
        sourceUrl: 'https://www.qfc.com/savings/cl/coupon/9912',
        price: {
          currency: 'USD',
          amount: 3.09,
          displayText: '$3.09',
        },
      }),
    ]);
  });

  it('marks serialized Kroger family deal payloads parse-failed when coupon rows lose their owned URL', () => {
    const dealFixture = loadFixture(
      'tests/fixtures/kroger/deal/deal-page-payload-malformed-variant.html',
      'https://www.fredmeyer.com/savings/coupons'
    );
    const detection = krogerAdapter.detect(dealFixture.url, dealFixture.document);

    expect(detection.pageKind).toBe('deal');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_deals'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('coupon URL'),
    });
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'export_data'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('coupon URL'),
    });
  });

  it('accepts nested Kroger family deal payload shapes instead of only flat coupon fields', async () => {
    const dealFixture = loadFixture(
      'tests/fixtures/kroger/deal/deal-page-payload-nested-variant.html',
      'https://www.qfc.com/savings/coupons'
    );
    const detection = krogerAdapter.detect(dealFixture.url, dealFixture.document);

    expect(detection.pageKind).toBe('deal');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_deals'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(krogerAdapter.extractDeals?.(dealFixture.document)).resolves.toEqual([
      expect.objectContaining({
        title: 'QFC Curry Sauce',
        dealLabel: 'Clip coupon',
        sourceUrl: 'https://www.qfc.com/savings/cl/coupon/9903',
        price: {
          currency: 'USD',
          amount: 2.79,
          displayText: '$2.79',
        },
      }),
      expect.objectContaining({
        title: 'Fred Meyer Frozen Dumplings',
        dealLabel: 'Digital coupon',
        sourceUrl: 'https://www.fredmeyer.com/savings/cl/coupon/9904',
        price: {
          currency: 'USD',
          amount: 4.59,
          displayText: '$4.59',
        },
      }),
    ]);
  });

  it('accepts Kroger family search-card selectors used by auto-grid result layouts', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/kroger/search/search-page-card-variant.html',
      'https://www.fredmeyer.com/search?query=pasta'
    );
    const detection = krogerAdapter.detect(
      searchFixture.url,
      searchFixture.document
    );

    expect(detection.pageKind).toBe('search');
    await expect(
      krogerAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Fred Meyer Pasta Sauce',
        }),
        expect.objectContaining({
          sourceUrl: 'https://www.qfc.com/p/family-granola-bites/5202',
        }),
      ])
    );
  });

  it('accepts a more realistic Kroger family deal-card variant without downgrading deal extraction', async () => {
    const dealFixture = loadFixture(
      'tests/fixtures/kroger/deal/deal-page-realish-variant.html',
      'https://www.fredmeyer.com/savings/coupons'
    );
    const detection = krogerAdapter.detect(dealFixture.url, dealFixture.document);

    expect(detection.pageKind).toBe('deal');
    await expect(
      krogerAdapter.extractDeals?.(dealFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Fred Meyer Family Cereal',
        }),
        expect.objectContaining({
          sourceUrl: 'https://www.qfc.com/deals/family-pasta',
        }),
      ])
    );
  });

  it('accepts Kroger family coupon-card selectors used by alternate deals layouts', async () => {
    const dealFixture = loadFixture(
      'tests/fixtures/kroger/deal/deal-page-card-variant.html',
      'https://www.qfc.com/savings/coupons'
    );
    const detection = krogerAdapter.detect(dealFixture.url, dealFixture.document);

    expect(detection.pageKind).toBe('deal');
    await expect(
      krogerAdapter.extractDeals?.(dealFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Fred Meyer Family Coffee',
        }),
        expect.objectContaining({
          sourceUrl: 'https://www.qfc.com/deals/family-cookies',
        }),
      ])
    );
  });

  it('keeps mixed Kroger family search-card layouts export-ready instead of only reading the first selector family', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/kroger/search/search-page-mixed-variant.html',
      'https://www.fredmeyer.com/search?query=snack-bars'
    );
    const detection = krogerAdapter.detect(
      searchFixture.url,
      searchFixture.document
    );

    expect(detection.pageKind).toBe('search');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'export_data'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      krogerAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Fred Meyer Vanilla Yogurt',
        }),
        expect.objectContaining({
          title: 'QFC Oat Bars',
          sourceUrl: 'https://www.qfc.com/p/family-oat-bars/6602',
        }),
      ])
    );
  });

  it('extracts Kroger family product images from lazy-loaded PDP variants instead of dropping image fidelity', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/kroger/product/product-page-lazy-image-variant.html',
      'https://www.fredmeyer.com/p/family-almond-butter/6601'
    );
    const detection = krogerAdapter.detect(
      productFixture.url,
      productFixture.document
    );

    expect(detection.pageKind).toBe('product');
    await expect(
      krogerAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Fred Meyer Almond Butter',
      sku: 'KROGER-FAM-6601',
      imageUrl:
        'https://www.fredmeyer.com/images/shopflow-family-almond-butter.jpg',
    });
  });
});
