import { expect, test } from '@playwright/test';
import {
  launchExtensionApp,
  openCustomFixturePage,
  openExtensionPage,
  openFixturePage,
  waitForDetectionDataset,
} from './support/extension-smoke';

test('ext-walmart smoke renders search extraction from a routed fixture', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-walmart'
  );

  try {
    const merchantPage = await openFixturePage(context, 'ext-walmart');
    await waitForDetectionDataset(merchantPage, 'ext-walmart', 'search');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Walmart')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.walmart\.com · search/i
    );
    await expect(
      sidePanel.locator('#quick-actions')
    ).toContainText(/Primary route/i);
    await expect(
      sidePanel.locator('#quick-actions').getByRole('link', {
        name: 'Jump to latest source page',
      })
    ).toHaveAttribute('href', 'https://www.walmart.com/search?q=granola');
  } finally {
    await cleanup();
  }
});

test('ext-walmart smoke reuses Next payload search stacks before storefront DOM cards', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-walmart'
  );

  try {
    const merchantPage = await openCustomFixturePage(
      context,
      'tests/fixtures/walmart/search/search-page-next-data-variant.html',
      'https://www.walmart.com/search?q=coffee'
    );
    await waitForDetectionDataset(merchantPage, 'ext-walmart', 'search');

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Walmart')).toBeVisible();
    await expect(sidePanel.locator('body')).toContainText(
      /www\.walmart\.com · search/i
    );
    await expect(sidePanel.locator('#latest-output-preview')).toContainText(
      /Walmart Payload Coffee Sampler/i
    );
    await expect(
      sidePanel.locator('#quick-actions').getByRole('link', {
        name: 'Capture search results',
      })
    ).toHaveAttribute('href', 'https://www.walmart.com/search?q=coffee');
    await expect(
      sidePanel.locator('#latest-output-preview').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute('href', 'https://www.walmart.com/search?q=coffee');
    await sidePanel.close();
  } finally {
    await cleanup();
  }
});

test('ext-walmart smoke uses the latest captured page as the best route when no fresher activity exists', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-walmart'
  );

  try {
    const popup = await openExtensionPage(context, extensionId, 'popup');
    await popup.evaluate(async () => {
      await chrome.storage.local.set({
        'shopflow.siteDetection.ext-walmart': {
          appId: 'ext-walmart',
          url: 'https://www.walmart.com/search?q=granola',
          updatedAt: '2026-03-31T18:20:00.000Z',
          detection: {
            storeId: 'walmart',
            verifiedScopes: ['walmart'],
            matchedHost: 'www.walmart.com',
            pageKind: 'search',
            confidence: 0.95,
            capabilityStates: [
              { capability: 'extract_search', status: 'unsupported_page' },
              { capability: 'extract_product', status: 'unsupported_page' },
            ],
          },
        },
        'shopflow.latestOutput.ext-walmart': {
          appId: 'ext-walmart',
          storeId: 'walmart',
          kind: 'search',
          pageUrl: 'https://www.walmart.com/search?q=coffee',
          capturedAt: '2026-03-31T18:15:00.000Z',
          headline: 'Walmart Payload Coffee Sampler',
          summary: 'Captured search results from the latest payload-backed page.',
          previewLines: ['Results: 12', 'Top match: Coffee Sampler'],
        },
        'shopflow.recentActivity': [],
      });
    });
    await popup.close();

    const sidePanel = await openExtensionPage(context, extensionId, 'sidepanel');
    await expect(sidePanel.getByText('Shopflow for Walmart')).toBeVisible();
    await expect(sidePanel.locator('#latest-output-preview')).toContainText(
      /Walmart Payload Coffee Sampler/i
    );
    await expect(sidePanel.locator('#readiness-summary')).toContainText(
      /Best route right now/i
    );
    await expect(
      sidePanel.locator('#readiness-summary').getByRole('link', {
        name: 'Best route right now: Open latest captured page',
      })
    ).toHaveAttribute('href', 'https://www.walmart.com/search?q=coffee');
    await expect(sidePanel.locator('#readiness-summary')).toContainText(
      /Use the latest captured page when you need a real route but no fresher source page was recorded\./i
    );
    await sidePanel.close();

    const popupRelaunch = await openExtensionPage(context, extensionId, 'popup');
    await expect(popupRelaunch.getByText('Shopflow for Walmart')).toBeVisible();
    await expect(popupRelaunch.locator('#latest-output-preview')).toContainText(
      /Walmart Payload Coffee Sampler/i
    );
    await expect(
      popupRelaunch.getByRole('link', { name: 'Resume latest captured page' })
    ).toHaveAttribute('href', 'https://www.walmart.com/search?q=coffee');
    await expect(
      popupRelaunch.getByRole('link', {
        name: 'Open Side Panel readiness summary',
      })
    ).toHaveAttribute(
      'href',
      /sidepanel\.html(?:\?locale=en)?#readiness-summary$/i
    );
    await expect(
      popupRelaunch.getByRole('link', { name: 'Open Side Panel current site summary' })
    ).toHaveCount(0);
  } finally {
    await cleanup();
  }
});

test('ext-walmart popup routes the secondary CTA to the latest source page when both source and captured pages are known', async () => {
  const { context, extensionId, cleanup } = await launchExtensionApp(
    'ext-walmart'
  );

  try {
    const popup = await openExtensionPage(context, extensionId, 'popup');
    await popup.evaluate(async () => {
      await chrome.storage.local.set({
        'shopflow.siteDetection.ext-walmart': {
          appId: 'ext-walmart',
          url: 'https://www.walmart.com/search?q=granola',
          updatedAt: '2026-03-31T18:20:00.000Z',
          detection: {
            storeId: 'walmart',
            verifiedScopes: ['walmart'],
            matchedHost: 'www.walmart.com',
            pageKind: 'search',
            confidence: 0.95,
            capabilityStates: [
              { capability: 'extract_search', status: 'unsupported_page' },
              { capability: 'extract_product', status: 'unsupported_page' },
            ],
          },
        },
        'shopflow.latestOutput.ext-walmart': {
          appId: 'ext-walmart',
          storeId: 'walmart',
          kind: 'search',
          pageUrl: 'https://www.walmart.com/search?q=coffee',
          capturedAt: '2026-03-31T18:15:00.000Z',
          headline: 'Walmart Payload Coffee Sampler',
          summary: 'Captured search results from the latest payload-backed page.',
          previewLines: ['Results: 12', 'Top match: Coffee Sampler'],
        },
        'shopflow.recentActivity': [
          {
            id: 'ext-walmart:https://www.walmart.com/search?q=granola',
            appId: 'ext-walmart',
            label: 'www.walmart.com · search',
            summary: '2 ready capabilities on the latest detected page.',
            timestampLabel: '6:20 PM',
            href: 'https://www.walmart.com/search?q=granola',
          },
        ],
      });
    });
    await popup.reload();

    await expect(popup.getByText('Shopflow for Walmart')).toBeVisible();
    await expect(
      popup.locator('#latest-output-preview').getByRole('link', {
        name: 'Open latest captured page',
      })
    ).toHaveAttribute('href', 'https://www.walmart.com/search?q=coffee');
    await expect(
      popup.getByRole('link', { name: 'Open latest source page' })
    ).toHaveAttribute('href', 'https://www.walmart.com/search?q=granola');
    await expect(
      popup.getByRole('link', { name: 'Jump to latest source page' })
    ).toHaveCount(0);
  } finally {
    await cleanup();
  }
});
