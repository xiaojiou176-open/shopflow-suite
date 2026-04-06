import { expect, test } from '@playwright/test';
import {
  launchExtensionApp,
  openCustomFixturePage,
  openExtensionPage,
  openFixturePage,
  waitForDetectionDataset,
} from './support/extension-smoke';

test('ext-target smoke renders differentiated deals support from a routed fixture', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-target'
  );

  try {
    const merchantPage = await openFixturePage(context, 'ext-target');
    await waitForDetectionDataset(merchantPage, 'ext-target', 'deal');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Target')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.target\.com · deal/i
    );
    await expect(
      sidePanel.locator('#quick-actions')
    ).toContainText(/Primary route/i);
    await expect(sidePanel.locator('#latest-output-preview')).toContainText(
      /Latest captured deals/i
    );
    await expect(sidePanel.locator('#latest-output-preview')).toContainText(
      /Lead deal: Family Cereal\./i
    );
    await expect(
      sidePanel.locator('#latest-output-preview').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute('href', 'https://www.target.com/pl/deals');
    await sidePanel.close();
  } finally {
    await cleanup();
  }
});


test('ext-target smoke reuses product JSON-LD before storefront PDP selectors', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-target'
  );

  try {
    const merchantPage = await openCustomFixturePage(
      context,
      'tests/fixtures/target/product/product-page-jsonld-variant.html',
      'https://www.target.com/p/target-json-pasta/-/A-88'
    );
    await waitForDetectionDataset(merchantPage, 'ext-target', 'product');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Target')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.target\.com · product/i
    );
    await expect(sidePanel.locator('#latest-output-preview')).toContainText(
      /Target JSON-LD Pantry Pasta/i
    );
    await expect(
      sidePanel.locator('#quick-actions').getByRole('link', {
        name: 'Extract this product',
      })
    ).toHaveAttribute('href', 'https://www.target.com/p/target-json-pasta/-/A-88');
    await expect(
      sidePanel.locator('#latest-output-preview').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute('href', 'https://www.target.com/p/target-json-pasta/-/A-88');
    await sidePanel.close();
  } finally {
    await cleanup();
  }
});
