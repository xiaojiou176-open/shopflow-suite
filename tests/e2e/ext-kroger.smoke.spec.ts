import { expect, test } from '@playwright/test';
import {
  launchExtensionApp,
  openCustomFixturePage,
  openExtensionPage,
  openFixturePage,
  waitForDetectionDataset,
} from './support/extension-smoke';

test('ext-kroger smoke renders family deals support without overclaiming beyond verified scope', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-kroger'
  );

  try {
    const merchantPage = await openFixturePage(context, 'ext-kroger');
    await waitForDetectionDataset(merchantPage, 'ext-kroger', 'deal');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Kroger Family')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.fredmeyer\.com · deal/i
    );
    await expect(
      sidePanel.locator('#readiness-summary')
    ).toContainText(/Runnable now/i);
    await expect(
      sidePanel.locator(
        '#quick-actions a[href="https://www.fredmeyer.com/savings/coupons"]'
      ).first()
    ).toHaveAttribute('href', 'https://www.fredmeyer.com/savings/coupons');
    await expect(
      sidePanel.locator('#readiness-summary').getByRole('link', {
        name: 'Check claim limit',
      })
    ).toHaveAttribute('href', '#live-receipt-evidence');
  } finally {
    await cleanup();
  }
});

test('ext-kroger smoke reuses product JSON-LD before family-safe PDP selectors', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-kroger'
  );

  try {
    const merchantPage = await openCustomFixturePage(
      context,
      'tests/fixtures/kroger/product/product-page-jsonld-variant.html',
      'https://www.fredmeyer.com/p/fred-meyer-overnight-oats/4404'
    );
    await waitForDetectionDataset(merchantPage, 'ext-kroger', 'product');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Kroger Family')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.fredmeyer\.com · product/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Fred Meyer Overnight Oats/i
    );
    await expect(
      sidePanel.locator('#quick-actions').getByRole('link', {
        name: 'Extract this product',
      })
    ).toHaveAttribute(
      'href',
      'https://www.fredmeyer.com/p/fred-meyer-overnight-oats/4404'
    );
    await expect(
      sidePanel.locator('#recent-proof-block').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute(
      'href',
      'https://www.fredmeyer.com/p/fred-meyer-overnight-oats/4404'
    );
    await sidePanel.close();
  } finally {
    await cleanup();
  }
});

test('ext-kroger smoke reuses nested family search payloads before storefront DOM cards', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-kroger'
  );

  try {
    const merchantPage = await openCustomFixturePage(
      context,
      'tests/fixtures/kroger/search/search-page-payload-nested-variant.html',
      'https://www.qfc.com/search?query=kombucha'
    );
    await waitForDetectionDataset(merchantPage, 'ext-kroger', 'search');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Kroger Family')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.qfc\.com · search/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /QFC Ginger Kombucha/i
    );
    await expect(
      sidePanel.locator('#quick-actions').getByRole('link', {
        name: 'Capture search results',
      })
    ).toHaveAttribute('href', 'https://www.qfc.com/search?query=kombucha');
    await expect(
      sidePanel.locator('#recent-proof-block').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute('href', 'https://www.qfc.com/search?query=kombucha');
    await sidePanel.close();
  } finally {
    await cleanup();
  }
});
