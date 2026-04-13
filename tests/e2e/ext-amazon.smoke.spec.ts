import { expect, test } from '@playwright/test';
import {
  launchExtensionApp,
  openCustomFixturePage,
  openExtensionPage,
  openFixturePage,
  waitForDetectionDataset,
} from './support/extension-smoke';

test('ext-amazon smoke renders product extraction from a routed fixture', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-amazon'
  );

  try {
    const merchantPage = await openFixturePage(context, 'ext-amazon');
    await waitForDetectionDataset(merchantPage, 'ext-amazon', 'product');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Amazon')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.amazon\.com · product/i
    );
    await expect(
      sidePanel.locator('#readiness-summary')
    ).toContainText(/Runnable now/i);
    await expect(sidePanel.locator('body')).toContainText(/Recent activity/i);
    await expect(sidePanel.locator('body')).toContainText(
      /www\.amazon\.com · product/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /2 ready capabilities on the latest detected page\./i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Latest captured product/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Amazon Burr Grinder/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Captured product details with price \$49\.99\./i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Price: \$49\.99/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /SKU: B0SHOPFLOW/i
    );
    await expect(
      sidePanel.locator('#quick-actions').getByRole('link', {
        name: 'Extract this product',
      })
    ).toHaveAttribute('href', 'https://www.amazon.com/dp/shopflow-grinder');
    await expect(sidePanel.locator('#quick-actions')).toContainText(
      /Use the current product page as the execution surface for product capture\./i
    );
    await expect(
      sidePanel.locator('#recent-proof-block').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute('href', 'https://www.amazon.com/dp/shopflow-grinder');
    await sidePanel.close();

    const popup = await openExtensionPage(context, extensionId, 'popup');
    await expect(popup.getByText('Shopflow for Amazon')).toBeVisible();
    await expect(popup.locator('body')).toContainText(
      /Recent activity: www\.amazon\.com · product/i
    );
    await expect(popup.locator('#latest-output-preview')).toContainText(
      /Latest captured product/i
    );
    await expect(popup.locator('#latest-output-preview')).toContainText(
      /Amazon Burr Grinder/i
    );
    await expect(popup.locator('#latest-output-preview')).toContainText(
      /Captured product details with price \$49\.99\./i
    );
    await expect(popup.locator('#latest-output-preview')).toContainText(
      /Price: \$49\.99/i
    );
    await expect(popup.locator('body')).toContainText(
      /Extract this product and 1 more move are runnable right now\./i
    );
    await expect(
      popup.getByRole('link', { name: 'Extract this product' })
    ).toHaveAttribute('href', 'https://www.amazon.com/dp/shopflow-grinder');
    await expect(popup.locator('body')).toContainText(
      /Use the current product page as the execution surface for product capture\./i
    );
    await expect(
      popup.getByRole('link', { name: 'Open latest captured page' }).first()
    ).toHaveAttribute('href', 'https://www.amazon.com/dp/shopflow-grinder');
    const sidePanelHref = await popup
      .getByRole('link', { name: 'Open Side Panel quick actions' })
      .getAttribute('href');
    expect(sidePanelHref).toMatch(
      /sidepanel\.html(?:\?locale=en)?#quick-actions$/i
    );
    const sidePanelFromPopup = await context.newPage();
    await sidePanelFromPopup.goto(
      sidePanelHref?.startsWith('chrome-extension://')
        ? sidePanelHref
        : `chrome-extension://${extensionId}/${sidePanelHref}`
    );
    await expect(sidePanelFromPopup.getByText('Shopflow for Amazon')).toBeVisible();
    await sidePanelFromPopup.close();
  } finally {
    await cleanup();
  }
});

test('ext-amazon smoke reuses semantic search cards before generic tracked links on search pages', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-amazon'
  );

  try {
    const merchantPage = await openCustomFixturePage(
      context,
      'tests/fixtures/amazon/search/search-page-semantic-asin-variant.html',
      'https://www.amazon.com/s?k=coffee+grinder'
    );
    await waitForDetectionDataset(merchantPage, 'ext-amazon', 'search');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Amazon')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.amazon\.com · search/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Hamilton Beach Fresh Grind Electric Coffee Grinder/i
    );
    await expect(
      sidePanel.locator('#quick-actions').getByRole('link', {
        name: 'Capture search results',
      })
    ).toHaveAttribute(
      'href',
      'https://www.amazon.com/s?k=coffee+grinder'
    );
    await expect(
      sidePanel.locator('#recent-proof-block').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute('href', 'https://www.amazon.com/s?k=coffee+grinder');
    await sidePanel.close();

    const popup = await openExtensionPage(context, extensionId, 'popup');
    await expect(popup.getByText('Shopflow for Amazon')).toBeVisible();
    await expect(popup.locator('body')).toContainText(
      /www\.amazon\.com · search/i
    );
    await expect(popup.locator('#latest-output-preview')).toContainText(
      /Hamilton Beach Fresh Grind Electric Coffee Grinder/i
    );
    await expect(
      popup.getByRole('link', { name: 'Capture search results' })
    ).toHaveAttribute('href', 'https://www.amazon.com/s?k=coffee+grinder');
    await popup.close();
  } finally {
    await cleanup();
  }
});

test('ext-amazon smoke promotes hidden ASIN carriers into canonical product identity', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-amazon'
  );

  try {
    const merchantPage = await openCustomFixturePage(
      context,
      'tests/fixtures/amazon/product/product-page-asin-carrier-variant.html',
      'https://www.amazon.com/gp/product/B0ASINC123/ref=ox_sc_act_title_1?smid=ATVPDKIKX0DER&psc=1'
    );
    await waitForDetectionDataset(merchantPage, 'ext-amazon', 'product');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Amazon')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.amazon\.com · product/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Amazon Travel Grinder/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /SKU: B0ASINC123/i
    );
    await expect(
      sidePanel.locator('#quick-actions').getByRole('link', {
        name: 'Extract this product',
      })
    ).toHaveAttribute(
      'href',
      'https://www.amazon.com/gp/product/B0ASINC123/ref=ox_sc_act_title_1?smid=ATVPDKIKX0DER&psc=1'
    );
    await expect(
      sidePanel.locator('#recent-proof-block').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute('href', 'https://www.amazon.com/dp/B0ASINC123');
    await sidePanel.close();

  } finally {
    await cleanup();
  }
});
