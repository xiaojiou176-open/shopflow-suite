import { expect, test } from '@playwright/test';
import {
  launchExtensionApp,
  openExtensionPage,
  openFixturePage,
  waitForDetectionDataset,
} from './support/extension-smoke';

test('ext-albertsons popup and sidepanel keep the core a11y / reflow contract', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-albertsons'
  );

  try {
    const merchantPage = await openFixturePage(context, 'ext-albertsons');
    await waitForDetectionDataset(merchantPage, 'ext-albertsons', 'cart');

    const popup = await openExtensionPage(context, extensionId, 'popup');
    await expect(popup.locator('main')).toHaveCount(1);
    await expect
      .poll(async () =>
        popup.evaluate(() => document.documentElement.lang || '')
      )
      .toBe('en');
    await expect
      .poll(async () =>
        popup.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
      )
      .toBe(true);
    await expect(
      popup.getByRole('link', { name: 'Open main workspace' })
    ).toBeVisible();
    await popup.close();

    const reviewLanePage = await context.newPage();
    await reviewLanePage.goto(
      `chrome-extension://${extensionId}/sidepanel.html#live-receipt-review`
    );
    await expect(reviewLanePage.locator('main')).toHaveCount(1);
    await expect(
      reviewLanePage.locator('#live-receipt-review details')
    ).toHaveAttribute('open', '');
    await expect
      .poll(async () =>
        reviewLanePage.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      )
      .toBe(true);
    await reviewLanePage.close();
    await merchantPage.close();
  } finally {
    await cleanup();
  }
});

test('suite zh-CN keeps one main landmark, no horizontal overflow, and hash routes auto-open disclosures', async () => {
  const { context, extensionId, cleanup } =
    await launchExtensionApp('ext-shopping-suite');

  try {
    const suitePage = await context.newPage();
    await suitePage.goto(
      `chrome-extension://${extensionId}/sidepanel.html?locale=zh-CN#verified-scope-navigator`
    );

    await expect(suitePage.locator('main')).toHaveCount(1);
    await expect
      .poll(async () =>
        suitePage.evaluate(() => document.documentElement.lang || '')
      )
      .toBe('zh-CN');
    await expect(
      suitePage.locator('#verified-scope-navigator details')
    ).toHaveAttribute('open', '');
    await expect
      .poll(async () =>
        suitePage.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      )
      .toBe(true);
    await expect(suitePage.locator('body')).toContainText(/已验证范围导航/i);
    await suitePage.close();
  } finally {
    await cleanup();
  }
});
