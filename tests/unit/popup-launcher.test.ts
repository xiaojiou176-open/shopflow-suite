import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PopupLauncher } from '../../packages/ui/src/popup-launcher';

describe('PopupLauncher', () => {
  it('renders real action routes when popup receives actionable quick routes', () => {
    const html = renderToStaticMarkup(
      React.createElement(PopupLauncher, {
        title: 'Shopflow Suite',
        summary: 'Internal-only alpha composition shell.',
        actionHeading: 'What Suite can route right now',
        actionItems: [
          {
            label: 'Route into the right store shell',
            summary:
              'Jump straight into the store app route that can actually do the next move.',
            href: 'https://www.safeway.com/shop/cart',
            external: true,
          },
          {
            label: 'Inspect claim gates before release talk',
            summary:
              'Check the claim boundary before treating repo-ready support as public-ready support.',
          },
        ],
        latestOutputPreview: {
          label: 'Latest captured product',
          title: 'Safeway Green Grapes',
          summary: 'Captured product details with price $4.99.',
          detailLines: ['Price: $4.99', 'SKU: 12345'],
          timestampLabel: '7:10 PM',
          href: 'https://www.safeway.com/shop/product-details/grapes',
          hrefLabel: 'Open latest captured page',
        },
        primaryHref: 'sidepanel.html#claim-readiness-board',
        primaryLabel: 'Open claim readiness board',
        primaryOriginLabel: 'Side Panel section',
        primarySummary: 'Route straight into the claim-readiness section.',
        secondaryHref: 'sidepanel.html#current-rollout-map',
        secondaryLabel: 'Open rollout map',
        secondaryOriginLabel: 'Side Panel section',
        secondarySummary: 'Jump to the rollout control board.',
        latestSourceHref: 'https://www.safeway.com/shop/cart',
        localeOptions: [
          { label: 'English', href: 'popup.html', active: true },
          { label: '简体中文', href: 'popup.html?locale=zh-CN', active: false },
        ],
      })
    );

    expect(html.indexOf('Quick router')).toBeLessThan(
      html.indexOf('What Suite can route right now')
    );
    expect(html).toContain('Primary route');
    expect(html).toContain('Side Panel section');
    expect(html.indexOf('Primary route')).toBeLessThan(
      html.indexOf('Secondary route')
    );
    expect(html.indexOf('Secondary route')).toBeLessThan(
      html.indexOf('Latest captured product')
    );
    expect(html.indexOf('Latest captured product')).toBeLessThan(
      html.indexOf('What Suite can route right now')
    );
    expect(html).toContain('What Suite can route right now');
    expect(html).toContain('Route into the right store shell');
    expect(html).toContain(
      'Jump straight into the store app route that can actually do the next move.'
    );
    expect(html).toContain('href="https://www.safeway.com/shop/cart"');
    expect(html).toContain('Inspect claim gates before release talk');
    expect(html).toContain(
      'Check the claim boundary before treating repo-ready support as public-ready support.'
    );
    expect(html).toContain('Open claim readiness board');
    expect(html).toContain('href="sidepanel.html#claim-readiness-board"');
    expect(html).toContain('Open rollout map');
    expect(html).toContain('href="sidepanel.html#current-rollout-map"');
    expect(html).toContain('Latest captured product');
    expect(html).toContain('Safeway Green Grapes');
    expect(html).toContain('Captured product details with price $4.99.');
    expect(html).toContain('Price: $4.99');
    expect(html).toContain('Open latest captured page');
    expect(html).toContain('Jump to latest source page');
    expect(html).not.toContain('Jump back');
    expect(html).toContain(
      'Latest source page routes you back into the live merchant flow. Latest captured page reopens the freshest captured output.'
    );
    expect(html).toContain('<details');
    expect(html).toContain('Display language');
    expect(html).toContain('href="popup.html?locale=zh-CN"');
  });

  it('keeps latest source and latest captured routes distinct when both are known', () => {
    const html = renderToStaticMarkup(
      React.createElement(PopupLauncher, {
        title: 'Shopflow for Walmart',
        summary: 'Repo-verified shell with a fresher source page on record.',
        actionItems: [],
        latestOutputPreview: {
          label: 'Latest captured search',
          title: 'Walmart Payload Coffee Sampler',
          summary:
            'Captured search results from the latest payload-backed page.',
          detailLines: ['Results: 12'],
          href: 'https://www.walmart.com/search?q=coffee',
          hrefLabel: 'Open latest captured page',
        },
        latestSourceHref: 'https://www.walmart.com/search?q=granola',
        latestSourceLabel: 'Jump to latest source page',
        primaryHref: 'sidepanel.html#quick-actions',
        primaryOriginLabel: 'Side Panel section',
        secondaryOriginLabel: 'Merchant source page',
        localeOptions: [
          { label: 'English', href: 'popup.html', active: true },
          { label: '简体中文', href: 'popup.html?locale=zh-CN', active: false },
        ],
      })
    );

    expect(html).toContain('href="https://www.walmart.com/search?q=coffee"');
    expect(html).toContain('href="https://www.walmart.com/search?q=granola"');
    expect(html).toContain('Open latest captured page');
    expect(html).toContain('Jump to latest source page');
    expect(html).not.toContain('Jump back');
    expect(html).toContain(
      'Latest source page routes you back into the live merchant flow. Latest captured page reopens the freshest captured output.'
    );
    expect(html.indexOf('Latest captured search')).toBeLessThan(
      html.indexOf('Jump to latest source page')
    );
  });

  it('keeps popup lightweight when the secondary route already promotes the latest captured page', () => {
    const html = renderToStaticMarkup(
      React.createElement(PopupLauncher, {
        title: 'Shopflow for Walmart',
        summary: '1 ready capability on the latest detected page.',
        latestOutputPreview: {
          label: 'Latest captured search',
          title: 'Walmart Payload Coffee Sampler',
          summary:
            'Captured search results from the latest payload-backed page.',
          detailLines: ['Results: 12', 'Top match: Coffee Sampler'],
        },
        primaryHref: 'sidepanel.html#quick-actions',
        primaryLabel: 'Open Side Panel quick actions',
        primaryOriginLabel: 'Side Panel section',
        primarySummary:
          'Open the Side Panel quick-actions section for the one runnable move on this page.',
        secondaryHref: 'https://www.walmart.com/search?q=coffee',
        secondaryLabel: 'Resume latest captured page',
        secondaryOriginLabel: 'Latest captured page',
        secondarySummary:
          'Return to the freshest captured page when no fresher merchant source page was recorded.',
      })
    );

    expect(html).toContain('Resume latest captured page');
    expect(html).toContain('href="https://www.walmart.com/search?q=coffee"');
    expect(html).toContain('Walmart Payload Coffee Sampler');
    expect(html).toContain('Latest captured page');
    expect(html.indexOf('Secondary route')).toBeLessThan(
      html.indexOf('Latest captured search')
    );
    expect(html).not.toContain('Jump back');
    expect(html).not.toContain('Jump to latest source page');
  });

  it('falls back to locale-aware defaults when labels and summaries are omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(PopupLauncher, {
        title: 'Shopflow for Walmart',
        summary: '当前页面已有 1 个可运行能力。',
        locale: 'zh-CN',
        localeOptions: [
          { label: 'English', href: 'popup.html', active: false },
          { label: '简体中文', href: 'popup.html?locale=zh-CN', active: true },
        ],
        primaryHref: 'sidepanel.html#quick-actions',
        primaryOriginLabel: 'Side Panel 分区',
        secondaryHref: 'sidepanel.html#current-site-summary',
        secondaryOriginLabel: 'Side Panel 分区',
        latestSourceHref: 'https://www.walmart.com/search?q=granola',
      })
    );

    expect(html).toContain('主路线');
    expect(html).toContain('次路线');
    expect(html).toContain('打开 Side Panel');
    expect(html).toContain('查看当前支持状态');
    expect(html).toContain('Side Panel 分区');
    expect(html).toContain('界面语言');
    expect(html).toContain('简体中文');
    expect(html).toContain('href="popup.html"');
    expect(html).toContain('href="popup.html?locale=zh-CN"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('打开当前页面对应的主 Shopflow 工作面板。');
    expect(html).toContain(
      '跳到下一条支持状态或 claim 边界路线，而不是把 popup 变成第二个控制台。'
    );
    expect(html).not.toContain('当前页面现在能做什么');
    expect(html).not.toContain('当前页面还没有可立即执行的能力。');
    expect(html).not.toContain('<details');
    expect(html).toContain('跳回');
    expect(html).toContain('跳回最新来源页面');
  });

  it('renders label-only quick routes and detail checklist items', () => {
    const html = renderToStaticMarkup(
      React.createElement(PopupLauncher, {
        title: 'Shopflow Suite',
        summary: 'Keep popup guidance short and route-first.',
        actionItems: [
          'Review verified scope clauses',
          'Open claim readiness after family selection',
        ],
        details: [
          'Start from the family chooser instead of treating popup like a second console.',
          'Check claim readiness before any public wording leaves the repo boundary.',
        ],
        primaryHref: 'sidepanel.html#start-here',
      })
    );

    expect(html).toContain('Review verified scope clauses');
    expect(html).toContain('Open claim readiness after family selection');
    expect(html).toContain('<details');
    expect(html).toContain(
      'Start from the family chooser instead of treating popup like a second console.'
    );
    expect(html).toContain(
      'Check claim readiness before any public wording leaves the repo boundary.'
    );
  });
});
