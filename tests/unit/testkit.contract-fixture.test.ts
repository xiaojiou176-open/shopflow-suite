import { describe, expect, it } from 'vitest';
import {
  createSimpleStorefrontContractHarness,
  loadContractFixture,
} from '@shopflow/testkit';
import { amazonAdapter } from '@shopflow/store-amazon';

describe('contract fixture testkit', () => {
  it('loads full HTML fixtures into the active document and primes the fixture URL', () => {
    const fixture = loadContractFixture(
      'tests/fixtures/costco/search/search-page-jsonld-variant.html',
      'https://www.costco.com/CatalogSearch?keyword=cold+brew'
    );

    expect(fixture.document.URL).toBe(
      'https://www.costco.com/CatalogSearch?keyword=cold+brew'
    );
    expect(fixture.document.baseURI).toBe(
      'https://www.costco.com/CatalogSearch?keyword=cold+brew'
    );
    expect(
      fixture.document.head.querySelector('script[type="application/ld+json"]')
    ).not.toBeNull();
    expect(fixture.document.body.textContent).toContain('cold brew');
  });

  it('primes relative fixture links against the requested page URL before adapter extraction', async () => {
    const harness = createSimpleStorefrontContractHarness('amazon', amazonAdapter);
    const fixture = harness.loadFixture(
      'search/search-page-semantic-asin-variant.html',
      'https://www.amazon.com/s?k=coffee+grinder'
    );

    harness.inspectDetection(fixture.url.toString(), fixture.document);

    const firstAnchor = fixture.document.querySelector<HTMLAnchorElement>(
      'a[href*="/dp/"]'
    );

    expect(firstAnchor?.href).toBe(
      'https://www.amazon.com/Hamilton-Beach-Coffee-Grinder-80335R/dp/B005EPRFKO/ref=sr_1_1?keywords=coffee+grinder'
    );

    await expect(
      amazonAdapter.extractSearchResults?.(fixture.document)
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceUrl: 'https://www.amazon.com/dp/B005EPRFKO',
        }),
      ])
    );
  });
});
