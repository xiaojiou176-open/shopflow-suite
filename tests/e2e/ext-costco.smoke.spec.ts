import { expect, test } from '@playwright/test';
import {
  launchExtensionApp,
  openCustomFixturePage,
  openExtensionPage,
  openFixturePage,
  waitForDetectionDataset,
} from './support/extension-smoke';

test('ext-costco smoke renders product extraction from a routed fixture', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-costco'
  );

  try {
    const merchantPage = await openFixturePage(context, 'ext-costco');
    await waitForDetectionDataset(merchantPage, 'ext-costco', 'product');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Costco')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.costco\.com · product/i
    );
    await expect(
      sidePanel.locator('#readiness-summary')
    ).toContainText(/Runnable now/i);
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Latest captured product/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Kirkland Signature Cold Brew/i
    );
    await expect(
      sidePanel.locator('#recent-proof-block').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute(
      'href',
      'https://www.costco.com/shopflow-colombian-coffee.product.4000001234.html'
    );
    await sidePanel.close();
  } finally {
    await cleanup();
  }
});

test('ext-costco smoke reuses JSON-LD search item lists before fixture-only DOM cards', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-costco'
  );

  try {
    const merchantPage = await openCustomFixturePage(
      context,
      'tests/fixtures/costco/search/search-page-jsonld-variant.html',
      'https://www.costco.com/CatalogSearch?keyword=cold+brew'
    );
    await waitForDetectionDataset(merchantPage, 'ext-costco', 'search');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Costco')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.costco\.com · search/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Kirkland Colombian Cold Brew/i
    );
    await expect(
      sidePanel.locator('#quick-actions').getByRole('link', {
        name: 'Capture search results',
      })
    ).toHaveAttribute(
      'href',
      'https://www.costco.com/CatalogSearch?keyword=cold+brew'
    );
    await expect(
      sidePanel.locator('#recent-proof-block').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute(
      'href',
      'https://www.costco.com/CatalogSearch?keyword=cold+brew'
    );
    await sidePanel.close();
  } finally {
    await cleanup();
  }
});

test('ext-costco smoke reuses rewrite-page typeahead wiring before fixture-only search cards', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-costco'
  );

  try {
    await context.route('https://search.costco.com/typeahead*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          docs: [
            {
              title: 'Kirkland Espresso Beans',
              url: '/kirkland-espresso-beans.product.400300.html',
              imageUrl: '/images/espresso-beans-400300.jpg',
              price: '16.79',
            },
          ],
        }),
      });
    });

    const merchantPage = await openCustomFixturePage(
      context,
      'tests/fixtures/costco/search/search-page-typeahead-variant.html',
      'https://www.costco.com/en-us/s/blt3d8f002292e47f8d?keyword=cold+brew'
    );
    await waitForDetectionDataset(merchantPage, 'ext-costco', 'search');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Costco')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.costco\.com · search/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Kirkland Espresso Beans/i
    );
    await expect(
      sidePanel.locator('#quick-actions').getByRole('link', {
        name: 'Capture search results',
      })
    ).toHaveAttribute(
      'href',
      'https://www.costco.com/en-us/s/blt3d8f002292e47f8d?keyword=cold+brew'
    );
    await expect(
      sidePanel.locator('#recent-proof-block').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute(
      'href',
      'https://www.costco.com/en-us/s/blt3d8f002292e47f8d?keyword=cold+brew'
    );
    await sidePanel.close();
  } finally {
    await cleanup();
  }
});
