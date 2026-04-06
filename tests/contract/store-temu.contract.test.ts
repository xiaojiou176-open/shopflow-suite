// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createHtmlFixture } from '@shopflow/testkit';
import { temuAdapter } from '@shopflow/store-temu';
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

describe('store-temu contract', () => {
  it('matches Temu hosts and rejects foreign hosts', () => {
    expect(
      temuAdapter.matches(
        new URL('https://www.temu.com/search_result.html?search_key=lamp')
      )
    ).toBe(true);
    expect(temuAdapter.matches(new URL('https://www.walmart.com/'))).toBe(
      false
    );
  });

  it('keeps the differentiated filter workflow honest on search pages', () => {
    const url = new URL(
      'https://www.temu.com/search_result.html?search_key=warehouse'
    );
    const doc = createHtmlFixture(
      `
        <main data-page-kind="search">
          <article data-shopflow-search-item>
            <a data-shopflow-search-url href="https://www.temu.com/goods.html?goods_id=1">
              <span data-shopflow-search-title>Temu Lamp</span>
            </a>
            <span data-shopflow-search-price>$12.99</span>
          </article>
          <article data-shopflow-filter-item data-warehouse="remote"></article>
        </main>
      `
    );
    const detection = temuAdapter.detect(url, doc);

    expect(detection.pageKind).toBe('search');
    expect(detection.verifiedScopes).toEqual(['temu']);
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )?.status
    ).toBe('ready');
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'run_action'
      )
    ).toMatchObject({
      status: 'ready',
    });
  });

  it('blocks the differentiated workflow when the search page exists but filter candidates are missing', () => {
    const url = new URL(
      'https://www.temu.com/search_result.html?search_key=warehouse'
    );
    const doc = createHtmlFixture("<main data-page-kind='search'></main>");
    const detection = temuAdapter.detect(url, doc);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'run_action'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'SELECTOR_MISSING',
    });
  });

  it('reports parse-failed workflow gating when Temu filter candidates exist without warehouse metadata', () => {
    const url = new URL(
      'https://www.temu.com/search_result.html?search_key=warehouse'
    );
    const doc = createHtmlFixture(`
      <main data-page-kind="search">
        <article data-shopflow-search-item>
          <a data-shopflow-search-url href="https://www.temu.com/goods.html?goods_id=1">
            <span data-shopflow-search-title>Temu Lamp</span>
          </a>
          <span data-shopflow-search-price>$12.99</span>
        </article>
        <article data-shopflow-filter-item data-item-ref="candidate-1"></article>
      </main>
    `);
    const detection = temuAdapter.detect(url, doc);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'run_action'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'PARSE_FAILED',
    });
  });

  it('normalizes relative Temu search links into actionable absolute URLs', async () => {
    const fixture = loadFixture(
      'tests/fixtures/temu/action/pre-filter.html',
      'https://www.temu.com/search_result.html?search_key=organizer'
    );
    fixture.document.body.innerHTML = `
      <main data-page-kind="search">
        <article data-shopflow-search-item>
          <a data-shopflow-search-url href="/goods.html?goods_id=9301">
            <span data-shopflow-search-title>Temu Storage Basket</span>
          </a>
          <span data-shopflow-search-price>$13.99</span>
        </article>
        <article data-shopflow-filter-item data-warehouse="remote"></article>
      </main>
    `;

    const detection = temuAdapter.detect(fixture.url, fixture.document);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      temuAdapter.extractSearchResults?.(fixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceUrl: 'https://www.temu.com/goods.html?goods_id=9301',
        }),
      ])
    );
  });

  it('marks Temu extraction parse-failed when a detected search row points outside owned scope', () => {
    const url = new URL(
      'https://www.temu.com/search_result.html?search_key=warehouse'
    );
    const doc = createHtmlFixture(`
      <main data-page-kind="search">
        <article data-shopflow-search-item>
          <a data-shopflow-search-url href="https://www.example.com/goods.html?goods_id=9302">
            <span data-shopflow-search-title>Temu Lantern</span>
          </a>
          <span data-shopflow-search-price>$21.99</span>
        </article>
        <article data-shopflow-filter-item data-warehouse="remote"></article>
      </main>
    `);
    Object.defineProperty(doc, 'URL', {
      value: url.toString(),
      configurable: true,
    });

    const detection = temuAdapter.detect(url, doc);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('required title or URL'),
    });
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'export_data'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'PARSE_FAILED',
      reasonMessage: expect.stringContaining('required structured fields'),
    });
  });

  it('marks the Temu workflow blocked when the search surface matches but filter candidates are missing', () => {
    const url = new URL(
      'https://www.temu.com/search_result.html?search_key=warehouse'
    );
    const doc = createHtmlFixture("<main data-page-kind='search'></main>");
    const detection = temuAdapter.detect(url, doc);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'run_action'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'SELECTOR_MISSING',
    });
  });

  it('extracts Temu product and search payloads from fixtures', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/temu/product/product-page.html',
      'https://www.temu.com/goods.html?goods_id=9001'
    );
    await expect(
      temuAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      sourceStoreId: 'temu',
      title: 'Temu Travel Organizer Set',
      sku: 'TM-SHOPFLOW-9001',
    });

    const searchFixture = loadFixture(
      'tests/fixtures/temu/search/search-page.html',
      'https://www.temu.com/search_result.html?search_key=organizer'
    );
    await expect(
      temuAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toHaveLength(2);
  });

  it('accepts alternate Temu search selectors instead of overfitting to one DOM variant', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/temu/search/search-page-variant.html',
      'https://www.temu.com/search_result.html?search_key=pantry'
    );
    const detection = temuAdapter.detect(searchFixture.url, searchFixture.document);

    expect(detection.pageKind).toBe('search');
    await expect(
      temuAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Temu Stackable Pantry Bin',
        }),
        expect.objectContaining({
          sourceUrl: 'https://www.temu.com/goods.html?goods_id=9102',
        }),
      ])
    );
  });

  it('accepts a more realistic Temu product variant without downgrading extraction readiness', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/temu/product/product-page-realish-variant.html',
      'https://www.temu.com/goods.html?goods_id=9301'
    );
    const detection = temuAdapter.detect(
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
      temuAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Temu Stainless Bento Box',
      sku: 'TM-REAL-9301',
    });
  });

  it('extracts Temu product images from lazy-loaded product variants instead of dropping image fidelity', async () => {
    const url = new URL('https://www.temu.com/goods.html?goods_id=9403');
    const doc = createHtmlFixture(`
      <main data-page-kind="product">
        <h1 data-temu-product-title>Temu Kitchen Drawer Set</h1>
        <span data-temu-product-price>$24.99</span>
        <span data-temu-product-sku>TEMU-9403</span>
        <img
          data-temu-product-image
          data-src="/images/shopflow-kitchen-drawer-set.jpg"
          srcset="/images/shopflow-kitchen-drawer-set.jpg 1x, /images/shopflow-kitchen-drawer-set@2x.jpg 2x"
          alt="Temu Kitchen Drawer Set"
        />
      </main>
    `);
    Object.defineProperty(doc, 'URL', {
      value: url.toString(),
      configurable: true,
    });

    const detection = temuAdapter.detect(url, doc);

    expect(detection.pageKind).toBe('product');
    await expect(temuAdapter.extractProduct?.(doc)).resolves.toMatchObject({
      title: 'Temu Kitchen Drawer Set',
      sku: 'TEMU-9403',
      imageUrl: 'https://www.temu.com/images/shopflow-kitchen-drawer-set.jpg',
    });
  });

  it('treats search-card warehouse variants as real filter candidates instead of fake-ready or selector-missing states', async () => {
    const fixture = loadFixture(
      'tests/fixtures/temu/action/search-card-filter-variant.html',
      'https://www.temu.com/search_result.html?search_key=bento'
    );
    const detection = temuAdapter.detect(fixture.url, fixture.document);

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
        (state) => state.capability === 'run_action'
      )
    ).toMatchObject({
      status: 'ready',
    });
    await expect(
      temuAdapter.extractSearchResults?.(fixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Temu Stainless Bento Box',
        }),
        expect.objectContaining({
          sourceUrl: 'https://www.temu.com/goods.html?goods_id=9303',
        }),
      ])
    );

    await expect(
      temuAdapter.runAction?.(fixture.document, {
        actionKind: 'filter_non_local_warehouse',
      })
    ).resolves.toMatchObject({
      status: 'partial',
      attempted: 3,
      succeeded: 1,
      failed: 1,
      skipped: 1,
      errors: [
        expect.objectContaining({
          code: 'ACTION_STEP_FAILED',
          itemRef: 'temu-card-3',
        }),
        expect.objectContaining({
          code: 'ACTION_PARTIAL',
        }),
      ],
    });
  });

  it('blocks Temu filter readiness when warehouse candidates cannot be correlated back to visible search results', async () => {
    const fixture = loadFixture(
      'tests/fixtures/temu/action/detached-filter-candidates.html',
      'https://www.temu.com/search_result.html?search_key=organizer'
    );
    const detection = temuAdapter.detect(fixture.url, fixture.document);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'run_action'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'PARSE_FAILED',
    });

    await expect(
      temuAdapter.runAction?.(fixture.document, {
        actionKind: 'filter_non_local_warehouse',
      })
    ).resolves.toMatchObject({
      status: 'failed',
      attempted: 2,
      succeeded: 0,
      failed: 2,
      skipped: 0,
      errors: [
        expect.objectContaining({
          code: 'PARSE_FAILED',
          itemRef: 'temu-detached-1',
        }),
        expect.objectContaining({
          code: 'PARSE_FAILED',
          itemRef: 'temu-detached-2',
        }),
      ],
    });
  });

  it('correlates Temu filter candidates against page-owned ItemList JSON-LD when storefront cards are absent', async () => {
    const fixture = loadFixture(
      'tests/fixtures/temu/action/jsonld-filter-candidates.html',
      'https://www.temu.com/search_result.html?search_key=organizer'
    );
    const detection = temuAdapter.detect(fixture.url, fixture.document);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'ready',
    });
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'run_action'
      )
    ).toMatchObject({
      status: 'ready',
    });

    await expect(
      temuAdapter.runAction?.(fixture.document, {
        actionKind: 'filter_non_local_warehouse',
      })
    ).resolves.toMatchObject({
      status: 'success',
      attempted: 2,
      succeeded: 2,
      failed: 0,
      skipped: 0,
    });
  });

  it('keeps Temu filter readiness blocked when filter candidates exist without a trustworthy search extraction surface', () => {
    const fixture = loadFixture(
      'tests/fixtures/temu/action/filter-panel.html',
      'https://www.temu.com/search_result.html?search_key=warehouse'
    );
    const detection = temuAdapter.detect(fixture.url, fixture.document);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'extract_search'
      )
    ).toMatchObject({
      status: 'degraded',
      reasonCode: 'SELECTOR_MISSING',
    });
    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'run_action'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'SELECTOR_MISSING',
    });
  });

  it('treats an already-open Temu filter overlay as busy instead of pretending the workflow is runnable', async () => {
    const fixture = loadFixture(
      'tests/fixtures/temu/action/filter-modal.html',
      'https://www.temu.com/search_result.html?search_key=warehouse'
    );
    const detection = temuAdapter.detect(fixture.url, fixture.document);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'run_action'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'ACTION_PRECONDITION_FAILED',
    });

    await expect(
      temuAdapter.runAction?.(fixture.document, {
        actionKind: 'filter_non_local_warehouse',
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

  it('returns honest receipts for the non-local warehouse filter workflow', async () => {
    const filterFixture = loadFixture(
      'tests/fixtures/temu/action/pre-filter.html',
      'https://www.temu.com/search_result.html?search_key=warehouse'
    );

    await expect(
      temuAdapter.runAction?.(filterFixture.document, {
        actionKind: 'filter_non_local_warehouse',
      })
    ).resolves.toMatchObject({
      status: 'success',
      attempted: 3,
      succeeded: 2,
      skipped: 1,
      failed: 0,
    });
  });

  it('reports parse failures instead of silently guessing when Temu filter metadata is incomplete', async () => {
    const doc = createHtmlFixture(`
      <main data-page-kind="search">
        <article data-shopflow-filter-item data-item-ref="candidate-1"></article>
      </main>
    `);

    await expect(
      temuAdapter.runAction?.(doc, {
        actionKind: 'filter_non_local_warehouse',
      })
    ).resolves.toMatchObject({
      status: 'failed',
      attempted: 1,
      failed: 1,
      errors: [
        expect.objectContaining({
          code: 'PARSE_FAILED',
          itemRef: 'candidate-1',
        }),
      ],
    });
  });

  it('blocks Temu filter readiness when every non-local result is already filtered out', () => {
    const fixture = loadFixture(
      'tests/fixtures/temu/action/post-filter.html',
      'https://www.temu.com/search_result.html?search_key=warehouse'
    );
    const detection = temuAdapter.detect(fixture.url, fixture.document);

    expect(
      detection.capabilityStates.find(
        (state) => state.capability === 'run_action'
      )
    ).toMatchObject({
      status: 'blocked',
      reasonCode: 'ACTION_PRECONDITION_FAILED',
    });
  });

  it('fails honestly when Temu has no remaining non-local results left to filter', async () => {
    const fixture = loadFixture(
      'tests/fixtures/temu/action/post-filter.html',
      'https://www.temu.com/search_result.html?search_key=warehouse'
    );

    await expect(
      temuAdapter.runAction?.(fixture.document, {
        actionKind: 'filter_non_local_warehouse',
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

  it('accepts product JSON-LD as a more stable Temu truth source on product pages', async () => {
    const productFixture = loadFixture(
      'tests/fixtures/temu/product/product-page-jsonld-variant.html',
      'https://www.temu.com/goods.html?goods_id=4404'
    );
    const detection = temuAdapter.detect(
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
      temuAdapter.extractProduct?.(productFixture.document)
    ).resolves.toMatchObject({
      title: 'Temu JSON-LD Storage Caddy',
      sku: 'TM-JSON-4404',
      sourceUrl: 'https://www.temu.com/goods.html?goods_id=4404',
      imageUrl: 'https://www.temu.com/images/temu-json-storage-caddy.jpg',
      price: {
        currency: 'USD',
        amount: 19.49,
        displayText: '$19.49',
      },
    });
  });

  it('prefers search JSON-LD item lists over fixture-only Temu DOM cards when structured results are present', async () => {
    const searchFixture = loadFixture(
      'tests/fixtures/temu/search/search-page-jsonld-variant.html',
      'https://www.temu.com/search_result.html?search_key=storage'
    );
    const detection = temuAdapter.detect(
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
      temuAdapter.extractSearchResults?.(searchFixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Temu Foldable Storage Crate',
          sourceUrl: 'https://www.temu.com/goods.html?goods_id=5501',
          imageUrl: 'https://www.temu.com/images/storage-crate-5501.jpg',
          price: {
            currency: 'USD',
            amount: 14.99,
            displayText: '$14.99',
          },
        }),
        expect.objectContaining({
          title: 'Temu Collapsible Closet Bin',
          sourceUrl: 'https://www.temu.com/goods.html?goods_id=5502',
          imageUrl: 'https://www.temu.com/images/closet-bin-5502.jpg',
          price: {
            currency: 'USD',
            amount: 11.49,
            displayText: '$11.49',
          },
        }),
      ])
    );
  });
});
