import { expect, test } from '@playwright/test';
import {
  launchExtensionApp,
  openCustomFixturePage,
  openExtensionPage,
  openFixturePage,
  waitForDetectionDataset,
} from './support/extension-smoke';

test('ext-temu smoke keeps warehouse filtering differentiated but not overclaimed', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-temu'
  );

  try {
    const merchantPage = await openFixturePage(context, 'ext-temu');
    await waitForDetectionDataset(merchantPage, 'ext-temu', 'search');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Temu')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.temu\.com · search/i
    );
    const runActionCard = sidePanel
      .locator('section')
      .filter({ hasText: 'Run Actions' })
      .first();
    await expect(runActionCard).toBeVisible();
    await expect(runActionCard).toContainText(/Ready/);
    await expect(sidePanel.getByText('Repo-ready, claim-gated')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /Live receipt readiness/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Temu warehouse filter live receipt/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Reconfirm repo verification is green before opening a live Temu search page\./i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Temu warehouse filter live receipt remains blocked until a live receipt bundle exists for temu\./i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Latest captured search/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Captured 3 search results/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Top result: Temu Storage Basket\./i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Temu Closet Organizer/i
    );
    await expect(
      sidePanel.locator('#readiness-summary')
    ).toContainText(/Runnable now/i);
    await expect(
      sidePanel.locator('#readiness-summary').getByRole('link', {
        name: 'Open current capture page',
      })
        .first()
    ).toHaveAttribute(
      'href',
      'https://www.temu.com/search_result.html?search_key=desk%20lamp'
    );
    await sidePanel.close();

    const popup = await openExtensionPage(context, extensionId, 'popup');
    await expect(popup.getByText('Shopflow for Temu')).toBeVisible();
    await expect(popup.locator('body')).toContainText(
      /App-level live receipt blocker remains because 1 packet(?:s)? still need(?:s)? a first capture\./i
    );
    await expect(popup.locator('#latest-output-preview')).toContainText(
      /Latest captured search/i
    );
    await expect(popup.locator('#latest-output-preview')).toContainText(
      /Captured 3 search results/i
    );
    await expect(popup.locator('#latest-output-preview')).toContainText(
      /Top result: Temu Storage Basket\./i
    );
    await popup
      .locator('summary')
      .filter({ hasText: /Supporting routes/i })
      .first()
      .click();
    await expect(
      popup.getByRole('link', { name: 'Capture search results' })
    ).toHaveAttribute(
      'href',
      'https://www.temu.com/search_result.html?search_key=desk%20lamp'
    );
    await expect(popup.locator('body')).toContainText(
      /Use the current supported workflow page as the execution surface for the next operator move\./i
    );
    await expect(
      popup.getByRole('link', { name: 'Open Side Panel quick actions' })
    ).toHaveAttribute('href', /sidepanel\.html(?:\?locale=en)?#quick-actions$/i);
    await expect(
      popup.getByRole('link', { name: 'Open Side Panel capture queue' })
    ).toHaveAttribute(
      'href',
      /sidepanel\.html(?:\?locale=en)?#live-receipt-evidence$/i
    );
  } finally {
    await cleanup();
  }
});

test('ext-temu smoke reuses search ItemList JSON-LD before storefront-only selectors', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-temu'
  );

  try {
    const merchantPage = await openCustomFixturePage(
      context,
      'tests/fixtures/temu/search/search-page-jsonld-variant.html',
      'https://www.temu.com/search_result.html?search_key=storage'
    );
    await waitForDetectionDataset(merchantPage, 'ext-temu', 'search');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Temu')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.temu\.com · search/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Temu Foldable Storage Crate/i
    );
    await expect(
      sidePanel.locator('#quick-actions').getByRole('link', {
        name: 'Capture search results',
      })
    ).toHaveAttribute(
      'href',
      'https://www.temu.com/search_result.html?search_key=storage'
    );
    await expect(
      sidePanel.locator('#recent-proof-block').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute(
      'href',
      'https://www.temu.com/search_result.html?search_key=storage'
    );
    await sidePanel.close();
  } finally {
    await cleanup();
  }
});
