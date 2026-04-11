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
    await expect(sidePanel.locator('body')).toContainText(
      /Internal-only alpha/i
    );
    await expect(sidePanel.locator('body')).toContainText(/Start here/i);
    await expect(sidePanel.locator('body')).toContainText(
      /Route into the right store shell/i
    );
    await expect(sidePanel.locator('body')).toContainText(/Priority routes/i);
    await expect(sidePanel.locator('body')).toContainText(
      /No second logic plane/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Claim readiness board/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Current rollout map/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Verified scope navigator/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Shopflow for Albertsons Family/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Shopflow for Kroger Family/i
    );
    await expect(sidePanel.locator('body')).toContainText(/Shopflow for Temu/i);
    await expect(sidePanel.locator('body')).toContainText(/Shopflow for Weee/i);
    await expect(
      sidePanel.getByRole('link', { name: 'Open rollout row' }).first()
    ).toHaveAttribute('href', /#rollout-ext-/);
    await expect(
      sidePanel
        .locator('#priority-routes')
        .locator('a[href="https://www.safeway.com/shop/cart"]')
        .first()
    ).toBeVisible();
    await sidePanel
      .getByRole('button', {
        name: 'Inspect status for Shopflow for Albertsons Family',
      })
      .click();
    await expect(sidePanel.locator('body')).toContainText(/Latest detection/i);
    await expect(sidePanel.locator('body')).toContainText(
      /www\.safeway\.com · cart/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Latest recent activity/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /1 ready capability on the latest detected page\./i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Latest captured output/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Safeway Green Grapes/i
    );
    await expect(
      sidePanel.getByRole('link', { name: 'Open latest captured page' })
    ).toHaveAttribute(
      'href',
      'https://www.safeway.com/shop/product-details/grapes'
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Front door for this app/i
    );
    await expect(sidePanel.locator('body')).toContainText(/Evidence queue/i);
    await expect(sidePanel.locator('body')).toContainText(
      /waiting for review/i
    );
    await expect(sidePanel.locator('body')).toContainText(/Review lane \(1\)/i);
    await expect(
      sidePanel
        .locator('#priority-routes')
        .locator('a[href="https://www.safeway.com/shop/cart"]')
        .first()
    ).toBeVisible();
    await expect(
      sidePanel.getByRole('link', { name: 'Jump to source page' })
    ).toHaveAttribute('href', 'https://www.safeway.com/shop/cart');
    await expect(sidePanel.locator('body')).toContainText(
      /Safeway subscribe live receipt/i
    );
    await expect(sidePanel.locator('body')).toContainText(
      /Captured, pending review/i
    );
    await expect(sidePanel.locator('body')).toContainText(/Priority packet/i);
    await expect(sidePanel.locator('body')).toContainText(
      /Run explicit review/i
    );
    await expect(
      sidePanel.locator('#current-rollout-map').getByRole('link', {
        name: 'Priority packet action for Shopflow for Albertsons Family: Review on latest source page',
      })
    ).toHaveAttribute('href', 'https://www.safeway.com/shop/cart');
    await expect(sidePanel.locator('body')).toContainText(
      /Operator next step/i
    );
    await expect(
      sidePanel.locator('#rollout-ext-albertsons').getByRole('link', {
        name: 'Operator next step for Shopflow for Albertsons Family: Review waiting evidence on source page',
      })
    ).toHaveAttribute('href', 'https://www.safeway.com/shop/cart');
    await expect(
      sidePanel.locator('#claim-readiness-board').getByRole('link', {
        name: 'Open rollout map',
      })
    ).toHaveAttribute('href', '#current-rollout-map');
    await expect(
      sidePanel.locator('#claim-readiness-board').getByRole('link', {
        name: 'Open evidence gates',
      })
    ).toHaveAttribute('href', '#evidence-gates');
    await expect(
      sidePanel.locator('#claim-readiness-board').getByRole('link', {
        name: 'Open alpha guardrails',
      })
    ).toHaveAttribute('href', '#alpha-guardrails');
    await expect(
      sidePanel.locator('#evidence-gates').getByRole('link', {
        name: 'Open verified scope clause for Shopflow for Albertsons Family',
      })
    ).toHaveAttribute('href', '#verified-scope-ext-albertsons');
    await expect(
      sidePanel.locator('#evidence-gates').getByRole('link', {
        name: 'Open rollout row for Shopflow for Albertsons Family',
      })
    ).toHaveAttribute('href', '#rollout-ext-albertsons');
    await expect(
      sidePanel.locator('#evidence-gates').getByRole('link', {
        name: 'Review on latest source page',
      })
    ).toHaveAttribute('href', 'https://www.safeway.com/shop/cart');
    await expect(
      sidePanel.locator('#verified-scope-navigator').getByRole('link', {
        name: 'Open rollout row for Shopflow for Albertsons Family',
      })
    ).toHaveAttribute('href', '#rollout-ext-albertsons');
    await sidePanel
      .locator('#evidence-gates')
      .getByRole('link', {
        name: 'Open verified scope clause for Shopflow for Albertsons Family',
      })
      .click();
    await expect
      .poll(() => sidePanel.url())
      .toContain('#verified-scope-ext-albertsons');
    await expect(
      sidePanel.locator('#verified-scope-ext-albertsons')
    ).toContainText(/Currently verified on Safeway/i);

    await sidePanel.close();

    const popup = await openExtensionPage(context, extensionId, 'popup');
    await expect(popup.getByText('Shopflow Suite')).toBeVisible();
    await expect(popup.locator('body')).toContainText(/Internal alpha only/i);
    await expect(popup.locator('body')).toContainText(/Priority routes/i);
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
    await expect(
      popup.getByRole('link', { name: 'Review verified scope clauses' })
    ).toHaveAttribute(
      'href',
      /sidepanel\.html(?:\?locale=en)?#verified-scope-navigator$/i
    );

    const [rolloutPage] = await Promise.all([
      context.waitForEvent('page'),
      popup
        .getByRole('link', { name: 'Open Side Panel family chooser' })
        .click(),
    ]);
    await rolloutPage.waitForLoadState('domcontentloaded');
    await expect.poll(() => rolloutPage.url()).toContain('#start-here');
    await expect(rolloutPage.locator('#start-here')).toContainText(
      /Start here/i
    );
    await rolloutPage.close();

    const [claimReadinessPage] = await Promise.all([
      context.waitForEvent('page'),
      popup
        .getByRole('link', { name: 'Open Side Panel claim readiness board' })
        .first()
        .click(),
    ]);
    await claimReadinessPage.waitForLoadState('domcontentloaded');
    await expect
      .poll(() => claimReadinessPage.url())
      .toContain('#claim-readiness-board');
    await expect(
      claimReadinessPage.locator('#claim-readiness-board')
    ).toContainText(/Claim readiness board/i);
    await claimReadinessPage.close();

    const [verifiedScopePage] = await Promise.all([
      context.waitForEvent('page'),
      popup
        .getByRole('link', { name: 'Review verified scope clauses' })
        .click(),
    ]);
    await verifiedScopePage.waitForLoadState('domcontentloaded');
    await expect
      .poll(() => verifiedScopePage.url())
      .toContain('#verified-scope-navigator');
    await expect(
      verifiedScopePage.locator('#verified-scope-navigator')
    ).toContainText(/Verified scope navigator/i);
    await verifiedScopePage.close();

    const localizedPopup = await context.newPage();
    await localizedPopup.goto(
      `chrome-extension://${extensionId}/popup.html?locale=zh-CN`
    );
    await expect(localizedPopup.locator('body')).toContainText(/快速路由/i);
    await localizedPopup.close();

    const localizedSidePanel = await context.newPage();
    await localizedSidePanel.goto(
      `chrome-extension://${extensionId}/sidepanel.html?locale=zh-CN#current-rollout-map`
    );
    await expect(localizedSidePanel.locator('body')).toContainText(/界面语言/i);
    await expect(localizedSidePanel.locator('body')).toContainText(
      /当前 rollout 地图/i
    );
    await localizedSidePanel.close();
  } finally {
    await cleanup();
  }
});
