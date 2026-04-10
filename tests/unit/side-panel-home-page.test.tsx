import { renderToStaticMarkup } from 'react-dom/server';
import type { SidePanelHomeViewModel } from '@shopflow/core';
import { describe, expect, it } from 'vitest';
import { SidePanelHomePage } from '../../packages/ui/src/side-panel-home-page';

const model: SidePanelHomeViewModel = {
  appTitle: 'Shopflow for Amazon',
  appStatus: 'live',
  site: {
    siteId: 'amazon',
    siteName: 'Amazon',
    host: 'www.amazon.com',
    pageKind: 'product',
    pageKindLabel: 'product',
    urlLabel: 'www.amazon.com',
  },
  capabilities: [
    {
      id: 'extract_product',
      label: 'Extract Product',
      description: 'Capture normalized product details for this page.',
      status: 'ready',
    },
  ],
  quickActions: [
    {
      id: 'extract_product',
      label: 'Extract this product',
      summary:
        'Route back to the freshest known merchant page before you run this capability. Use the current product page as the execution surface for product capture.',
      href: 'https://www.amazon.com/dp/example',
      variant: 'primary',
      external: true,
    },
  ],
  secondaryNavigation: [
    {
      id: 'support-state',
      label: 'Review support state',
      summary: '1 capability is ready right now.',
      href: '#current-site-summary',
      actionLabel: 'Open current site summary',
    },
  ],
  recentActivities: [
    {
      id: 'ext-amazon:https://www.amazon.com/dp/example',
      label: 'www.amazon.com · product',
      summary: '1 ready capability on the latest detected page.',
      timestampLabel: '5:20 PM',
      href: 'https://www.amazon.com/dp/example',
    },
  ],
  latestOutputPreview: {
    label: 'Latest captured product',
    title: 'Amazon Burr Grinder',
    summary: 'Captured product details with price $49.99.',
    detailLines: ['Price: $49.99', 'SKU: B0SHOPFLOW'],
    timestampLabel: '5:20 PM',
    href: 'https://www.amazon.com/dp/example',
    hrefLabel: 'Open latest captured page',
  },
  readiness: {
    label: 'Repo-ready, claim-gated',
    summary:
      'Extract this product is runnable right now. Public wording still stays behind evidence review.',
    claimBoundary: 'Currently verified on Amazon.',
    operatorNextStep: 'Review the evidence queue before using public wording.',
  },
  workflowBrief: {
    tone: 'claim-gated',
    title: 'Workflow copilot',
    summary:
      'Repo verification is strong enough to inspect this path, but public wording still stays behind evidence review.',
    bullets: [
      {
        label: 'Runnable now',
        value: 'Extract this product',
      },
      {
        label: 'Claim gate',
        value: 'Amazon evidence is captured and waiting for explicit review.',
      },
      {
        label: 'Current surface',
        value: 'www.amazon.com · product',
      },
    ],
    nextAction: {
      label: 'Open review lane',
      reason: 'Review the evidence queue before using public wording.',
    },
  },
  evidenceStatus: {
    headline: 'Live receipt readiness',
    items: [
      {
        captureId: 'amazon-live-receipt',
        title: 'Amazon product live receipt',
        verifiedScope: 'amazon',
        status: 'captured',
        sectionHref: '#live-receipt-review',
        summary: 'Amazon evidence is captured and waiting for explicit review.',
        sourceHref: 'https://www.amazon.com/dp/example',
        sourceLabel: 'Open latest source page',
      },
    ],
  },
};

describe('SidePanelHomePage', () => {
  it('turns the quick action area into real routes backed by shared truth', () => {
    const html = renderToStaticMarkup(
      <SidePanelHomePage
        model={model}
        localeOptions={[
          { label: 'English', href: 'sidepanel.html', active: true },
          {
            label: '简体中文',
            href: 'sidepanel.html?locale=zh-CN',
            active: false,
          },
        ]}
      />
    );

    expect(html).toContain('Available on this page');
    expect(html).toContain('Best route right now');
    expect(html).toContain(
      'aria-label="Best route right now: Jump to latest source page"'
    );
    expect(html).toContain('id="recent-proof-block"');
    expect(html).toContain('Latest captured product');
    expect(html.indexOf('Latest captured product')).toBeLessThan(
      html.indexOf('Available on this page')
    );
    expect(html).toContain('Captured product details with price $49.99.');
    expect(html).toContain('Price: $49.99');
    expect(html).toContain('SKU: B0SHOPFLOW');
    expect(html).toContain('Captured 5:20 PM');
    expect(html).toContain('Extract this product');
    expect(html).toContain(
      'Use the current product page as the execution surface for product capture.'
    );
    expect(html).toContain('Primary route');
    expect(html).toContain('Merchant source page');
    expect(html).toContain('Open latest captured page');
    expect(html).toContain('href="https://www.amazon.com/dp/example"');
    expect(html).toContain('id="live-receipt-evidence"');
    expect(html).toContain('id="live-receipt-review"');
    expect(html).toContain('Raw packet ledger');
    expect(html).toContain(
      'Review the evidence queue before using public wording.'
    );
    expect(html).toContain('Next routes');
    expect(html).toContain('Open current site summary');
    expect(html).toContain(
      'Amazon evidence is captured and waiting for explicit review.'
    );
    expect(html).toContain('Display language');
    expect(html).toContain('href="sidepanel.html?locale=zh-CN"');
  });

  it('routes best-route guidance through the latest captured page when no fresher source page exists', () => {
    const html = renderToStaticMarkup(
      <SidePanelHomePage
        model={{
          ...model,
          recentActivities: [],
          latestOutputPreview: {
            ...model.latestOutputPreview!,
            hrefLabel: 'Open latest captured page',
          },
        }}
        localeOptions={[
          { label: 'English', href: 'sidepanel.html', active: true },
          {
            label: '简体中文',
            href: 'sidepanel.html?locale=zh-CN',
            active: false,
          },
        ]}
      />
    );

    expect(html).toContain('Best route right now');
    expect(html).toContain(
      'aria-label="Best route right now: Open latest captured page"'
    );
    expect(html).toContain(
      'Use the latest captured page when you need a real route but no fresher source page was recorded.'
    );
    expect(html).toContain('Display language');
    expect(html).toContain('href="sidepanel.html"');
    expect(html).toContain('href="sidepanel.html?locale=zh-CN"');
    expect(html).toContain('Latest captured page');
    expect(html).toContain('href="https://www.amazon.com/dp/example"');
    expect(html).toContain('aria-current="page"');
  });

  it('renders localized core headings when the locale changes', () => {
    const html = renderToStaticMarkup(
      <SidePanelHomePage
        model={model}
        locale="zh-CN"
        localeOptions={[
          { label: 'English', href: 'sidepanel.html', active: false },
          {
            label: '简体中文',
            href: 'sidepanel.html?locale=zh-CN',
            active: true,
          },
        ]}
      />
    );

    expect(html).toContain('当前准备度');
    expect(html).toContain('当前最佳路线');
    expect(html).toContain('已采集，等待审核');
    expect(html).toContain('界面语言');
  });
});
