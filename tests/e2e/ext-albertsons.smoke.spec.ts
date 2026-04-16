import { expect, test } from '@playwright/test';
import {
  launchExtensionApp,
  openCustomFixturePage,
  openExtensionPage,
  openFixturePage,
  waitForDetectionDataset,
} from './support/extension-smoke';

test('ext-albertsons smoke reflects cart action state honestly in the side panel', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-albertsons'
  );

  try {
    const merchantPage = await openFixturePage(context, 'ext-albertsons');
    await waitForDetectionDataset(merchantPage, 'ext-albertsons', 'cart');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Albertsons Family')).toBeVisible();
    const currentSiteCard = sidePanel
      .locator('section')
      .filter({ hasText: 'This page' })
      .first();
    await expect(currentSiteCard).toContainText('www.safeway.com · cart');
    const runActionCard = sidePanel
      .locator('section')
      .filter({ hasText: 'Run Actions' })
      .first();
    await expect(runActionCard).toBeVisible();
    await expect(
      sidePanel
        .locator('#readiness-summary')
        .getByText('Ready in repo · needs proof')
        .first()
    ).toBeVisible();
    await expect(runActionCard).toContainText(/Ready/);
    await expect(sidePanel.locator('body')).toContainText(
      /Live receipt readiness/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Safeway subscribe live receipt/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Reconfirm repo verification is green before opening a live Safeway cart session\./i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Safeway subscribe live receipt remains blocked until a live receipt bundle exists for safeway\./i
    );
    await expect(
      sidePanel
        .locator('#readiness-summary')
        .locator('a[href="https://www.safeway.com/shop/cart"]')
        .first()
    ).toBeVisible();
    await expect(
      sidePanel.getByRole('link', { name: 'Open current capture page' }).first()
    ).toHaveAttribute('href', 'https://www.safeway.com/shop/cart');
    await expect(sidePanel.locator('body')).toContainText(/Latest source/i);
    await expect(sidePanel.locator('body')).toContainText(
      /1 ready capability on the latest detected page\./i
    );
    await expect(
      sidePanel.locator('#readiness-summary').getByRole('link', {
        name: 'Check claim limit',
      })
    ).toHaveAttribute('href', '#live-receipt-evidence');
    await expect(sidePanel.locator('#readiness-summary')).toContainText(
      /Runnable now/i
    );
    await expect(sidePanel.locator('#readiness-summary')).toContainText(
      /Before public claims/i
    );
    await sidePanel.close();

    const popup = await openExtensionPage(context, extensionId, 'popup');
    await expect(popup.getByText('Shopflow for Albertsons Family')).toBeVisible();
    await expect(popup.locator('#latest-output-preview')).toContainText(
      /Latest runnable output/i
    );
    await expect(popup.locator('#latest-output-preview')).toContainText(
      /www\.safeway\.com · cart/i
    );
    await expect(popup.locator('body')).toContainText(
      /Recent activity: www\.safeway\.com · cart/i
    );
    await expect(popup.locator('body')).toContainText(
      /Seen \d{1,2}:\d{2}/i
    );
    await expect(popup.locator('body')).toContainText(
      /App-level live receipt blocker remains because 2 packets? still need(?:s)? a first capture\./i
    );
    await popup
      .locator('summary')
      .filter({ hasText: /Supporting routes/i })
      .first()
      .click();
    await expect(
      popup.getByRole('link', { name: 'Open supported workflow' })
    ).toHaveAttribute('href', 'https://www.safeway.com/shop/cart');
    await expect(popup.locator('body')).toContainText(
      /Route back to the freshest known merchant page before you run this capability\./i
    );
    await expect(
      popup.getByRole('link', { name: 'Jump to source page' }).first()
    ).toHaveAttribute('href', 'https://www.safeway.com/shop/cart');
    await expect(
      popup.getByRole('link', { name: 'Open Side Panel quick actions' })
    ).toHaveAttribute('href', /sidepanel\.html(?:\?locale=en)?#quick-actions$/i);
    await expect(
      popup.getByRole('link', { name: 'Open Side Panel capture queue' })
    ).toHaveAttribute(
      'href',
      /sidepanel\.html(?:\?locale=en)?#live-receipt-evidence$/i
    );
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
    await expect(
      sidePanelFromPopup.getByText('Shopflow for Albertsons Family')
    ).toBeVisible();
    await sidePanelFromPopup.close();

    const reviewLanePage = await context.newPage();
    await reviewLanePage.goto(
      `chrome-extension://${extensionId}/sidepanel.html#live-receipt-review`
    );
    await expect(
      reviewLanePage.locator('#live-receipt-review details')
    ).toHaveAttribute('open', '');
    await expect(reviewLanePage.locator('#live-receipt-review')).toContainText(
      /Review queue/i
    );
    await reviewLanePage.close();
  } finally {
    await cleanup();
  }
});

test('ext-albertsons smoke keeps verified-scope wording bounded while routing Vons search extraction through page-owned API context', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-albertsons'
  );

  try {
    await context.route(
      '**/abs/pub/xapi/pgmsearch/v1/search/products*',
      async (route) => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            results: {
              products: [
                {
                  name: 'Vons API Granola Clusters',
                  productUrl: '/shop/product-details.7001.html',
                  imageUrl:
                    'https://www.vons.com/images/shopflow-api-granola-clusters.jpg',
                  price: {
                    amount: 6.19,
                    displayText: '$6.19',
                  },
                },
              ],
            },
          }),
        });
      }
    );
    const merchantPage = await openCustomFixturePage(
      context,
      'tests/fixtures/albertsons/search/search-page-api-context-vons.html',
      'https://www.vons.com/shop/search-results.html?q=granola'
    );
    await merchantPage.context().addCookies([
      {
        name: 'SWY_SHARED_SESSION_INFO',
        value: encodeURIComponent(
          '{"info":{"COMMON":{"banner":"vons","wfcStoreId":"5799"},"SHOP":{"zipcode":"92110","storeId":"2053"}}}'
        ),
        domain: 'www.vons.com',
        path: '/',
      },
      {
        name: 'ACI_S_ECommBanner',
        value: 'vons',
        domain: 'www.vons.com',
        path: '/',
      },
    ]);
    await merchantPage.reload();
    await waitForDetectionDataset(merchantPage, 'ext-albertsons', 'search');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Albertsons Family')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(/www\.vons\.com · search/i);
    await expect(sidePanel.locator('body')).toContainText(
      /Currently verified on Safeway\./i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Captured 1 search result/i
    );
    await expect(sidePanel.locator('#recent-proof-block')).toContainText(
      /Top result: Vons API Granola Clusters\./i
    );
    await expect(
      sidePanel.locator('#quick-actions').getByRole('link', {
        name: 'Capture search results',
      })
    ).toHaveAttribute(
      'href',
      'https://www.vons.com/shop/search-results.html?q=granola'
    );
    await sidePanel.close();

    const popup = await openExtensionPage(context, extensionId, 'popup');
    await expect(popup.getByText('Shopflow for Albertsons Family')).toBeVisible();
    await expect(popup.locator('body')).toContainText(/www\.vons\.com · search/i);
    await expect(popup.locator('body')).toContainText(
      /Before public claims: Currently verified on Safeway\./i
    );
    await expect(popup.locator('#latest-output-preview')).toContainText(
      /Captured 1 search result/i
    );
    await expect(popup.locator('#latest-output-preview')).toContainText(
      /Top result: Vons API Granola Clusters\./i
    );
    await expect(popup.locator('#latest-output-preview')).toContainText(
      /Top result: Vons API Granola Clusters\./i
    );
    await popup.close();
  } finally {
    await cleanup();
  }
});
