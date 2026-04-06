import { describe, expect, it } from 'vitest';
import { createHomeViewModel } from '@shopflow/core';
import type { DetectionResult } from '@shopflow/contracts';

const detection: DetectionResult = {
  storeId: 'amazon',
  verifiedScopes: ['amazon'],
  matchedHost: 'www.amazon.com',
  pageKind: 'product',
  confidence: 0.9,
  capabilityStates: [
    {
      capability: 'extract_product',
      status: 'ready',
    },
    {
      capability: 'extract_search',
      status: 'unsupported_page',
    },
  ],
};

describe('createHomeViewModel', () => {
  it('maps detection into UI-safe quick actions', () => {
    const model = createHomeViewModel(
      'Shopflow for Amazon',
      'Amazon',
      detection,
      [],
      undefined,
      {
        appSummary: 'Wave 1 storefront shell focused on product and search workflows.',
        latestOutput: {
          kind: 'product',
          headline: 'Amazon Burr Grinder',
          summary: 'Captured product details with price $49.99.',
          previewLines: ['Price: $49.99', 'SKU: B0SHOPFLOW'],
          capturedAt: '2026-03-31T17:20:00.000Z',
          pageUrl: 'https://www.amazon.com/dp/example',
        },
      }
    );

    expect(model.site.host).toBe('www.amazon.com');
    expect(model.quickActions).toHaveLength(1);
    expect(model.quickActions[0]).toMatchObject({
      label: 'Extract this product',
      href: 'https://www.amazon.com/dp/example',
      external: true,
    });
    expect(model.quickActions[0]?.summary).toContain(
      'Use the latest captured page when you need a real route but no fresher source page was recorded.'
    );
    expect(model.readiness.label).toBe('Ready on this page');
    expect(model.readiness.summary).toBe(
      'Extract this product is runnable right now.'
    );
    expect(model.secondaryNavigation[0]?.label).toBe('Review support state');
    expect(model.secondaryNavigation[0]?.href).toBe('#current-site-summary');
    expect(model.recentActivities).toHaveLength(0);
    expect(model.latestOutputPreview).toMatchObject({
      label: 'Latest captured product',
      title: 'Amazon Burr Grinder',
      summary:
        'Captured product details with price $49.99. Latest runnable output: Extract this product.',
      detailLines: ['Price: $49.99', 'SKU: B0SHOPFLOW'],
      href: 'https://www.amazon.com/dp/example',
      hrefLabel: 'Open latest captured page',
    });
  });

  it('keeps evidence status visible in the shared view model when live proof is still missing', () => {
    const model = createHomeViewModel(
      'Shopflow for Temu',
      'Temu',
      detection,
      [],
      {
        headline: 'Live receipt readiness',
        items: [
          {
            captureId: 'temu-filter-live-receipt',
            title: 'Temu warehouse filter live receipt',
            verifiedScope: 'temu',
            status: 'missing-live-receipt',
            sectionHref: '#live-receipt-evidence',
            summary:
              'Temu warehouse filtering remains repo-verified only. A live receipt bundle is still missing.',
            operatorHint:
              'Follow docs/runbooks/live-receipt-capture.md before using this differentiated workflow in public claims.',
            packetSummary: '6 required artifacts',
            nextStep:
              'Reconfirm repo verification is green before opening a live Temu search page.',
          },
        ],
      },
      {
        appSummary:
          'Wave 2 differentiated shell for product, search, and fixture-backed warehouse filtering that still needs live receipt evidence.',
      }
    );

    expect(model.evidenceStatus?.headline).toBe('Live receipt readiness');
    expect(model.evidenceStatus?.items[0]?.status).toBe('missing-live-receipt');
    expect(model.evidenceStatus?.items[0]?.packetSummary).toBe(
      '6 required artifacts'
    );
    expect(model.readiness.label).toBe('Repo-ready, claim-gated');
    expect(model.readiness.operatorNextStep).toContain('Reconfirm repo verification');
    expect(model.secondaryNavigation[1]?.label).toBe('Open capture queue');
    expect(model.secondaryNavigation[1]?.href).toBe('#live-receipt-evidence');
  });

  it('accepts reviewed evidence metadata without collapsing it back into a generic string', () => {
    const model = createHomeViewModel(
      'Shopflow for Kroger Family',
      'Kroger',
      detection,
      [],
      {
        headline: 'Live receipt readiness',
        items: [
          {
            captureId: 'fred-meyer-verified-scope-live-receipt',
            title: 'Fred Meyer verified-scope live receipt',
            verifiedScope: 'fred-meyer',
            status: 'reviewed',
            sectionHref: '#live-receipt-review',
            summary: 'Fred Meyer verified-scope evidence has been reviewed.',
            screenshotLabel: 'fred-meyer-product-page.png',
            updatedAtLabel: 'Mar 30, 9:12 AM',
            reviewLabel: 'Reviewed Mar 30, 9:12 AM by Shopflow QA',
            reviewSummary:
              'The screenshot and verified-scope proof match the release checklist.',
          },
        ],
      },
      {
        verifiedScopeCopy: 'Currently verified on Fred Meyer + QFC.',
      }
    );

    expect(model.evidenceStatus?.items[0]?.status).toBe('reviewed');
    expect(model.evidenceStatus?.items[0]?.reviewLabel).toContain('Reviewed');
    expect(model.readiness.claimBoundary).toBe(
      'Currently verified on Fred Meyer + QFC.'
    );
    expect(model.secondaryNavigation[1]?.summary).toContain(
      'Reviewed evidence'
    );
    expect(model.secondaryNavigation[1]?.label).toBe('Open review lane');
    expect(model.secondaryNavigation[1]?.href).toBe('#live-receipt-review');
    expect(model.secondaryNavigation[2]?.href).toBe('#recent-activity');
    expect(model.latestOutputPreview?.summary).toContain(
      'Latest runnable output: Extract this product.'
    );
  });

  it('keeps recent activity available as lightweight operator context', () => {
    const model = createHomeViewModel(
      'Shopflow for Amazon',
      'Amazon',
      detection,
      [
        {
          id: 'ext-amazon:https://www.amazon.com/dp/example',
          label: 'www.amazon.com · product',
          summary:
            'www.amazon.com exposes 1 ready capability on the latest detected page.',
          timestampLabel: '5:20 PM',
          href: 'https://www.amazon.com/dp/example',
        },
      ]
    );

    expect(model.recentActivities[0]).toMatchObject({
      label: 'www.amazon.com · product',
      summary:
        'www.amazon.com exposes 1 ready capability on the latest detected page.',
      timestampLabel: '5:20 PM',
    });
    expect(model.latestOutputPreview).toMatchObject({
      label: 'Latest runnable output',
      title: 'www.amazon.com · product',
      detailLines: [],
      timestampLabel: '5:20 PM',
      href: 'https://www.amazon.com/dp/example',
      hrefLabel: 'Jump to source page',
    });
    expect(model.latestOutputPreview?.summary).toContain(
      'www.amazon.com exposes 1 ready capability on the latest detected page.'
    );
    expect(model.latestOutputPreview?.summary).toContain(
      'Latest runnable output: Extract this product.'
    );
  });

  it('routes core user-visible strings through the locale track for zh-CN', () => {
    const model = createHomeViewModel(
      'Shopflow for Amazon',
      'Amazon',
      detection,
      [],
      {
        headline: 'Live receipt readiness',
        items: [
          {
            captureId: 'amazon-live-receipt',
            title: 'Amazon product live receipt',
            verifiedScope: 'amazon',
            status: 'missing-live-receipt',
            sectionHref: '#live-receipt-evidence',
            summary: 'Amazon evidence is still missing.',
            nextStep: 'Open a supported page first.',
          },
        ],
      },
      {
        locale: 'zh-CN',
        verifiedScopeCopy: '当前验证范围：Amazon。',
        latestOutput: {
          kind: 'product',
          headline: 'Amazon Burr Grinder',
          summary: 'Captured product details with price $49.99.',
          previewLines: ['Price: $49.99', 'SKU: B0SHOPFLOW'],
          summaryDescriptor: {
            variant: 'product-with-price',
            priceDisplayText: '$49.99',
          },
          detailEntries: [
            { kind: 'price', value: '$49.99' },
            { kind: 'sku', value: 'B0SHOPFLOW' },
          ],
          capturedAt: '2026-03-31T17:20:00.000Z',
          pageUrl: 'https://www.amazon.com/dp/example',
        },
      }
    );

    expect(model.readiness.label).toBe('仓内已验证，但公开宣称仍被证据门禁限制');
    expect(model.latestOutputPreview?.label).toBe('最新捕获商品');
    expect(model.latestOutputPreview?.summary).toContain(
      '已捕获商品详情，价格为 $49.99。'
    );
    expect(model.latestOutputPreview?.detailLines).toEqual([
      '价格: $49.99',
      'SKU: B0SHOPFLOW',
    ]);
    expect(model.secondaryNavigation[0]?.label).toBe('查看支持状态');
    expect(model.secondaryNavigation[1]?.label).toBe('打开采集队列');
    expect(model.site.pageKindLabel).toBe('商品页');
  });
});
