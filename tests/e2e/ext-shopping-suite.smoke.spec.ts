import { expect, test } from '@playwright/test';
import {
  launchExtensionApp,
  openExtensionPage,
} from './support/extension-smoke';

test('ext-shopping-suite smoke stays internal-only and renders rollout navigation', async () => {
  const { context, extensionId, cleanup } =
    await launchExtensionApp('ext-shopping-suite');

  try {
    const sidePanel = await openExtensionPage(
      context,
      extensionId,
      'sidepanel'
    );
    await sidePanel.evaluate(async () => {
      await chrome.storage.local.set({
        'shopflow.siteDetection.ext-albertsons': {
          appId: 'ext-albertsons',
          url: 'https://www.safeway.com/shop/cart',
          updatedAt: '2026-03-30T19:10:00.000Z',
          detection: {
            storeId: 'albertsons',
            verifiedScopes: ['safeway'],
            matchedHost: 'www.safeway.com',
            pageKind: 'cart',
            confidence: 0.95,
            capabilityStates: [
              { capability: 'run_action', status: 'ready' },
              { capability: 'export_data', status: 'blocked' },
            ],
          },
        },
        'shopflow.recentActivity': [
          {
            id: 'ext-albertsons:https://www.safeway.com/shop/cart',
            appId: 'ext-albertsons',
            label: 'www.safeway.com · cart',
            summary: '1 ready capability on the latest detected page.',
            timestampLabel: '7:10 PM',
            href: 'https://www.safeway.com/shop/cart',
          },
        ],
        'shopflow.latestOutput.ext-albertsons': {
          appId: 'ext-albertsons',
          storeId: 'albertsons',
          kind: 'product',
          pageUrl: 'https://www.safeway.com/shop/product-details/grapes',
          capturedAt: '2026-03-30T19:08:00.000Z',
          headline: 'Safeway Green Grapes',
          summary: 'Captured product details with price $4.99.',
          previewLines: ['Price: $4.99', 'SKU: 12345'],
        },
        'shopflow.liveEvidence.ext-albertsons': [
          {
            captureId: 'safeway-subscribe-live-receipt',
            appId: 'ext-albertsons',
            storeId: 'albertsons',
            verifiedScope: 'safeway',
            pageKind: 'cart',
            actionKind: 'schedule_save_subscribe',
            status: 'captured',
            summary:
              'Safeway subscribe live receipt bundle is captured and waiting for explicit review.',
            updatedAt: '2026-03-30T19:10:00.000Z',
            capturedAt: '2026-03-30T19:10:00.000Z',
            screenshotLabel: 'safeway-cart-proof.png',
          },
        ],
      });
    });

    await expect(sidePanel.getByText('Shopflow Suite')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(/Suite preview/i);
    await expect(sidePanel.locator('body')).toContainText(/Start here/i);
    await expect(sidePanel.locator('body')).toContainText(/Best next stops/i);
    await expect(sidePanel.locator('body')).toContainText(
      /What still needs proof/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Pick a store/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Verified scope/i
    );
    await sidePanel
      .locator('#priority-routes summary')
      .click();
    await expect(
      sidePanel
        .locator('#priority-routes')
        .locator('a[href="https://www.safeway.com/shop/cart"]')
        .first()
    ).toBeVisible();
    await sidePanel.close();

    const popup = await openExtensionPage(context, extensionId, 'popup');
    await expect(popup.getByText('Shopflow Suite')).toBeVisible();
    await expect(popup.locator('body')).toContainText(/Suite preview/i);
    await expect(popup.locator('body')).toContainText(/Quick router/i);
    await expect(
      popup.getByRole('link', { name: 'Open Side Panel family chooser' })
    ).toHaveAttribute('href', /sidepanel\.html(?:\?locale=en)?#start-here$/i);
    await expect(
      popup.getByRole('link', { name: 'Open Side Panel claim readiness board' })
    ).toHaveAttribute(
      'href',
      /sidepanel\.html(?:\?locale=en)?#claim-readiness-board$/i
    );
    await popup.close();

    const localizedPopup = await context.newPage();
    await localizedPopup.goto(
      `chrome-extension://${extensionId}/popup.html?locale=zh-CN`
    );
    await expect(localizedPopup.locator('body')).toContainText(/快速路由/i);
    await localizedPopup.close();
  } finally {
    await cleanup();
  }
});
