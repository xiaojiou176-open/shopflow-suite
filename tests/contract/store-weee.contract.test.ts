// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createHtmlFixture } from '@shopflow/testkit';
import { weeeAdapter } from '@shopflow/store-weee';
import { repoRoot } from '../support/repo-paths';

function loadFixture(relativePath: string, url: string) {
  const html = readFileSync(
    resolve(repoRoot, relativePath),
    'utf8'
  );

  document.body.innerHTML = html;
  Object.defineProperty(document, 'URL', {
    value: url,
    configurable: true,
  });
  return {
    url: new URL(url),
    document,
  };
}

describe('store-weee contract', () => {
  it('matches Weee hosts and rejects foreign hosts', () => {
    expect(
      weeeAdapter.matches(new URL('https://www.sayweee.com/en/product/greens'))
    ).toBe(true);
    expect(weeeAdapter.matches(new URL('https://www.amazon.com/'))).toBe(
      false
    );
  });

  it('declares product extraction honestly on product pages', () => {
    const url = new URL('https://www.sayweee.com/en/product/greens');
    const doc = createHtmlFixture(`
      <main data-page-kind="product">
        <h1 data-weee-product-title>Weee Morning Glory</h1>
      </main>
    `);
    const detection = weeeAdapter.detect(url, doc);

    expect(detection.pageKind).toBe('product');
    expect(detection.verifiedScopes).toEqual(['weee']);
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_product'
      )
    ).toMatchObject({
      status: 'ready',
    });
  });

  it('degrades Weee extraction when the page kind is recognized but selectors are missing', () => {
    const url = new URL('https://www.sayweee.com/en/search?keyword=greens');
    const doc = createHtmlFixture("<main data-page-kind='search'></main>");
    const detection = weeeAdapter.detect(url, doc);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'SELECTOR_MISSING',
    });
  });

  it('marks Weee extraction parse-failed when a recognized result row is missing a required URL', () => {
    const url = new URL('https://www.sayweee.com/en/search?keyword=greens');
    const doc = createHtmlFixture(`
      <main data-page-kind="search">
        <article data-weee-search-item>
          <span data-weee-search-title>Weee Greens Bundle</span>
          <span data-weee-search-price>$5.49</span>
        </article>
      </main>
    `);
    const detection = weeeAdapter.detect(url, doc);

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

  it('normalizes relative Weee search links into actionable absolute URLs', async () => {
    const url = new URL('https://www.sayweee.com/en/search?keyword=bread');
    const doc = createHtmlFixture(`
      <main data-page-kind="search">
        <article data-weee-search-item>
          <a data-weee-search-url href="/en/product/milk-bread/9901">
            <span data-weee-search-title>Weee Milk Bread</span>
          </a>
          <span data-weee-search-price>$5.19</span>
        </article>
      </main>
    `);
    Object.defineProperty(doc, 'URL', {
      value: url.toString(),
      configurable: true,
    });

    const detection = weeeAdapter.detect(url, doc);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(weeeAdapter.extractSearchResults?.(doc)).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceUrl: 'https://www.sayweee.com/en/product/milk-bread/9901',
        }),
      ])
    );
  });

  it('blocks Weee extraction honesty when a detected result row leaves owned scope', () => {
    const url = new URL('https://www.sayweee.com/en/search?keyword=bread');
    const doc = createHtmlFixture(`
      <main data-page-kind="search">
        <article data-weee-search-item>
          <a data-weee-search-url href="https://www.example.com/en/product/milk-bread/9902">
            <span data-weee-search-title>Weee Milk Bread</span>
          </a>
          <span data-weee-search-price>$5.19</span>
        </article>
      </main>
    `);
    Object.defineProperty(doc, 'URL', {
      value: url.toString(),
      configurable: true,
    });

    const detection = weeeAdapter.detect(url, doc);

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

  it('extracts Weee product and search payloads from fixtures', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/weee/product/product-page.html',
      'https://www.sayweee.com/en/product/handmade-dumplings/2001'
    );
    await expect(
      weeeAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      sourceStoreId: 'weee',
      title: 'Weee Handmade Dumplings',
      sku: 'WEEE-2001',
    });

    const searchFixture = loadFixture(
      'tests/fixtures/weee/search/search-page.html',
      'https://www.sayweee.com/en/search?keyword=dumpling'
    );
    await expect(
      weeeAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toHaveLength(2);
  });

  it('accepts product JSON-LD as a more stable Weee truth source on PDPs', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/weee/product/product-page-jsonld-variant.html',
      'https://www.sayweee.com/en/product/Organic-Shanghai-Bok-Choy/92101'
    );
    const detection = weeeAdapter.detect(
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
      weeeAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Weee Organic Shanghai Bok Choy',
      sku: 'WEEE-JSON-92101',
      sourceUrl: 'https://www.sayweee.com/en/product/Organic-Shanghai-Bok-Choy/92101',
      imageUrl:
        'https://img06.weeecdn.com/product/image/921/101/shopflow-bok-choy.png',
      price: {
        currency: 'USD',
        amount: 4.99,
        displayText: '$4.99',
      },
    });
  });

  it('accepts alternate Weee DOM variants without downgrading the page to unsupported', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/weee/product/product-page-variant.html',
      'https://www.sayweee.com/en/product/rice-cakes/3001'
    );
    const detection = weeeAdapter.detect(productFixture.url, productFixture.document);

    expect(detection.pageKind).toBe('product');
    await expect(
      weeeAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Weee Rice Cake Variety Pack',
      sku: 'WEEE-ALT-3001',
    });

    const searchFixture = loadFixture(
      'tests/fixtures/weee/search/search-page-variant.html',
      'https://www.sayweee.com/en/search?keyword=rice-cake'
    );
    await expect(
      weeeAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Weee Spicy Rice Cakes',
        }),
        expect.objectContaining({
          sourceUrl: 'https://www.sayweee.com/en/product/frozen-dumplings/3002',
        }),
      ])
    );
  });

  it('accepts Weee product selectors used by card-oriented PDP layouts', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/weee/product/product-page-card-variant.html',
      'https://www.sayweee.com/en/product/sesame-rice-balls/6101'
    );
    const detection = weeeAdapter.detect(
      productFixture.url,
      productFixture.document
    );

    expect(detection.pageKind).toBe('product');
    await expect(
      weeeAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Weee Sesame Rice Balls',
      sku: 'WEEE-CARD-6101',
    });
  });

  it('accepts a more realistic Weee product variant without losing extraction fidelity', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/weee/product/product-page-realish-variant.html',
      'https://www.sayweee.com/en/product/spicy-hot-pot-kit/5101'
    );
    const detection = weeeAdapter.detect(
      productFixture.url,
      productFixture.document
    );

    expect(detection.pageKind).toBe('product');
    await expect(
      weeeAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Weee Spicy Hot Pot Kit',
      sku: 'WEEE-REAL-5101',
    });
  });

  it('accepts a more realistic Weee search-card variant without overfitting to only one fixture shape', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/weee/search/search-page-realish-variant.html',
      'https://www.sayweee.com/en/search?keyword=meal-kit'
    );
    const detection = weeeAdapter.detect(searchFixture.url, searchFixture.document);

    expect(detection.pageKind).toBe('search');
    await expect(
      weeeAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Weee Kimchi Fried Rice',
        }),
        expect.objectContaining({
          sourceUrl: 'https://www.sayweee.com/en/product/udon-noodle-kit/4002',
        }),
      ])
    );
  });

  it('accepts Weee search-card selectors used by alternate product-card layouts', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/weee/search/search-page-card-variant.html',
      'https://www.sayweee.com/en/search?keyword=noodle'
    );
    const detection = weeeAdapter.detect(searchFixture.url, searchFixture.document);

    expect(detection.pageKind).toBe('search');
    await expect(
      weeeAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Weee Fish Ball Soup',
        }),
        expect.objectContaining({
          sourceUrl:
            'https://www.sayweee.com/en/product/hand-pulled-noodles/6202',
        }),
      ])
    );
  });

  it('accepts goods-card search layouts without downgrading Weee export readiness', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/weee/search/search-page-goods-card-variant.html',
      'https://www.sayweee.com/en/search?keyword=wonton'
    );
    const detection = weeeAdapter.detect(
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
      weeeAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Weee Shrimp Wonton Soup',
        }),
        expect.objectContaining({
          sourceUrl:
            'https://www.sayweee.com/en/product/chili-oil-dumplings/7102',
        }),
      ])
    );
  });

  it('uses Weee page-owned Next payload before falling back to DOM cards', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/weee/search/search-page-next-payload.html',
      'https://www.sayweee.com/en/search?keyword=rice'
    );
    const detection = weeeAdapter.detect(searchFixture.url, searchFixture.document);

    expect(detection.pageKind).toBe('search');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      weeeAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual([
      expect.objectContaining({
        title: 'Sekka Premium Japanese Medium Grain Rice 15 lb',
        sourceUrl:
          'https://www.sayweee.com/en/product/Sekka-Premium-Japanese-Medium-Grain-Rice/81224',
        imageUrl:
          'https://img06.weeecdn.com/product/image/188/684/6948BFF6FFF56CA0.png',
        price: {
          currency: 'USD',
          amount: 12.88,
          displayText: '$12.88',
        },
        position: 0,
      }),
      expect.objectContaining({
        title: 'Three Ladies Brand Jasmine Rice Large Bag 10 lb',
        sourceUrl:
          'https://www.sayweee.com/en/product/Three-Ladies-Brand-Jasmine-Rice-Large-Bag/91011',
        price: {
          currency: 'USD',
          amount: 16.99,
          displayText: '16.99',
        },
        position: 1,
      }),
    ]);
  });

  it('keeps Weee search extraction payload-first when live-ish Next products only expose base_price and img_urls', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/weee/search/search-page-next-payload-liveish-variant.html',
      'https://www.sayweee.com/en/search?keyword=rice'
    );
    const detection = weeeAdapter.detect(
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
      weeeAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual([
      expect.objectContaining({
        title: 'Sekka Premium Japanese Medium Grain Rice 15 lb',
        sourceUrl:
          'https://www.sayweee.com/en/product/Sekka-Premium-Japanese-Medium-Grain-Rice/81224',
        imageUrl:
          'https://img06.weeecdn.com/product/image/188/684/6948BFF6FFF56CA0.png',
        price: {
          currency: 'USD',
          amount: 17.99,
          displayText: '$17.99',
        },
      }),
      expect.objectContaining({
        title: 'Three Ladies Brand Jasmine Rice Large Bag 10 lb',
        sourceUrl:
          'https://www.sayweee.com/en/product/Three-Ladies-Brand-Jasmine-Rice-Large-Bag/91011',
        imageUrl:
          'https://img06.weeecdn.com/product/image/091/507/62FA47C3A8D0FEDF.png',
        price: {
          currency: 'USD',
          amount: 16.99,
          displayText: '16.99',
        },
      }),
    ]);
  });

  it('accepts Weee product payloads before falling back to JSON-LD or DOM selectors', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/weee/product/product-page-next-payload-variant.html',
      'https://www.sayweee.com/en/product/Fresh-Handmade-Noodles/8301'
    );
    const detection = weeeAdapter.detect(
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
      weeeAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Weee Fresh Handmade Noodles',
      sku: 'WEEE-PAYLOAD-8301',
      sourceUrl: 'https://www.sayweee.com/en/product/Fresh-Handmade-Noodles/8301',
      imageUrl:
        'https://img06.weeecdn.com/product/image/830/101/shopflow-fresh-noodles.png',
      price: {
        currency: 'USD',
        amount: 8.29,
        displayText: '$8.29',
      },
    });
  });

  it('marks payload-only Weee product pages parse-failed when Next product payloads lose their title', () => {
    const productFixture = loadFixture(
      'tests/fixtures/weee/product/product-page-next-payload-malformed-variant.html',
      'https://www.sayweee.com/en/product/Fresh-Handmade-Noodles/8301'
    );
    const detection = weeeAdapter.detect(
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

  it('marks payload-only Weee search pages parse-failed when Next products lose their result URL', () => {
    const searchFixture = loadFixture(
      'tests/fixtures/weee/search/search-page-next-payload-malformed-variant.html',
      'https://www.sayweee.com/en/search?keyword=dumpling'
    );
    const detection = weeeAdapter.detect(
      searchFixture.url,
      searchFixture.document
    );

    expect(detection.pageKind).toBe('search');
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

  it('marks account pages as unsupported instead of pretending an action workflow exists', () => {
    const url = new URL('https://www.sayweee.com/en/account/profile');
    const doc = createHtmlFixture("<main data-page-kind='account'></main>");
    const detection = weeeAdapter.detect(url, doc);

    expect(detection.pageKind).toBe('account');
    expect(
      detection.capabilityStates.find((state) => state.capability === 'extract_product')
    ).toMatchObject({
      status: 'unsupported_page',
      reasonCode: 'UNSUPPORTED_PAGE',
    });
    expect(
      detection.capabilityStates.find((state) => state.capability === 'run_action')
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

  it('keeps export readiness attached to extraction readiness instead of run_action not_implemented status', () => {
    const fixture = loadFixture(
      'tests/fixtures/weee/product/product-page.html',
      'https://www.sayweee.com/en/product/handmade-dumplings/2001'
    );

    const detection = weeeAdapter.detect(fixture.url, fixture.document);

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

  it('keeps mixed Weee search-card layouts export-ready instead of only reading the first selector family', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/weee/search/search-page-mixed-variant.html',
      'https://www.sayweee.com/en/search?keyword=buns'
    );
    const detection = weeeAdapter.detect(
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
      weeeAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Weee Milk Bread',
        }),
        expect.objectContaining({
          title: 'Weee Red Bean Buns',
          sourceUrl: 'https://www.sayweee.com/en/product/red-bean-buns/8802',
        }),
      ])
    );
  });

  it('extracts Weee product images from lazy-loaded PDP variants instead of dropping image fidelity', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/weee/product/product-page-lazy-image-variant.html',
      'https://www.sayweee.com/en/product/taro-buns/8801'
    );
    const detection = weeeAdapter.detect(
      productFixture.url,
      productFixture.document
    );

    expect(detection.pageKind).toBe('product');
    await expect(
      weeeAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Weee Taro Buns',
      sku: 'WEEE-LAZY-8801',
      imageUrl: 'https://www.sayweee.com/images/shopflow-taro-buns.jpg',
    });
  });
});
