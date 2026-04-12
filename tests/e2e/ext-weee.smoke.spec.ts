import { expect, test } from '@playwright/test';
import {
  launchExtensionApp,
  openCustomFixturePage,
  openExtensionPage,
  openFixturePage,
  waitForDetectionDataset,
} from './support/extension-smoke';

test('ext-weee smoke renders product extraction from a routed fixture', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-weee'
  );

  try {
    const merchantPage = await openFixturePage(context, 'ext-weee');
    await waitForDetectionDataset(merchantPage, 'ext-weee', 'product');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Weee')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.sayweee\.com · product/i
    );
    await expect(
      sidePanel.locator('#readiness-summary')
    ).toContainText(/Runnable now/i);
    await expect(
      sidePanel.locator('#readiness-summary').getByRole('link', {
        name: 'Jump to latest source page',
      })
        .first()
    ).toHaveAttribute('href', 'https://www.sayweee.com/en/product/handmade-dumplings/2001');
  } finally {
    await cleanup();
  }
});

test('ext-weee smoke reuses Next payload search products before DOM cards', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-weee'
  );

  try {
    const merchantPage = await openCustomFixturePage(
      context,
      'tests/fixtures/weee/search/search-page-next-payload.html',
      'https://www.sayweee.com/en/search?keyword=rice'
    );
    await waitForDetectionDataset(merchantPage, 'ext-weee', 'search');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Weee')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.sayweee\.com · search/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Sekka Premium Japanese Medium Grain Rice 15 lb/i
    );
    await expect(
      sidePanel.locator('#quick-actions').getByRole('link', {
        name: 'Capture search results',
      })
    ).toHaveAttribute(
      'href',
      'https://www.sayweee.com/en/search?keyword=rice'
    );
    await expect(
      sidePanel.locator('#recent-proof-block').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute('href', 'https://www.sayweee.com/en/search?keyword=rice');
    await sidePanel.close();
  } finally {
    await cleanup();
  }
});
