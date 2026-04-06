import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createProviderRuntimeConsumerSnapshot } from '../../packages/core/src/provider-runtime-consumer';

const { mockDetailMap } = vi.hoisted(() => ({
  mockDetailMap: {
    'ext-albertsons': {
      decisionStage: 'claim-gated' as const,
      latestDetection: 'www.safeway.com · cart',
      latestActivity:
        'www.safeway.com · cart · 1 ready capability on the latest detected page.',
      latestActivityHref: 'https://www.safeway.com/shop/cart',
      latestOutput:
        'Safeway Green Grapes · Captured product details with price $4.99. · Price: $4.99',
      latestOutputHref: 'https://www.safeway.com/shop/product-details/grapes',
      routeLabel: 'Review waiting evidence on source page',
      routeHref: 'https://www.safeway.com/shop/cart',
      routeSummary:
        '1 packet is waiting for review. Start from the freshest known operator page for this app.',
      routeOrigin: 'merchant-source' as const,
      attentionState: 'waiting-for-review' as const,
      evidenceCounts: {
        captureWork: 0,
        waitingForReview: 1,
        reviewed: 0,
      },
      evidenceQueue:
        '0 reviewed · 1 waiting for review · 0 still needing capture work',
      priorityQueueItem: {
        title: 'Safeway subscribe live receipt',
        operatorPathLabel: 'Review captured evidence',
        statusLabel: 'Captured, pending review',
        note: 'Run explicit review from the freshest known source page.',
        actionLabel: 'Review on latest source page',
        href: 'https://www.safeway.com/shop/cart',
      },
      operatorDecisionBrief: {
        appTitle: 'Shopflow for Albertsons Family',
        stage: 'claim-gated',
        summary:
          '1 packet is waiting for review. Start from the freshest known operator page for this app.',
        whyNow: [
          'www.safeway.com · cart',
          '0 reviewed · 1 waiting for review · 0 still needing capture work',
        ],
        nextStep:
          'Run explicit review before public wording changes for this banner.',
        primaryRouteLabel: 'Review waiting evidence on source page',
        primaryRouteHref: 'https://www.safeway.com/shop/cart',
      },
      evidenceItems: [],
      evidenceSections: [],
      nextStep:
        'Run explicit review before public wording changes for this banner.',
    },
  },
}));

vi.mock('../../apps/ext-shopping-suite/src/suite-control-plane', () => ({
  useSuiteControlPlane: () => mockDetailMap,
}));

import { SuiteAlphaPage } from '../../apps/ext-shopping-suite/src/suite-alpha-page';

describe('SuiteAlphaPage', () => {
  it('turns evidence gates into real drilldowns when shared runtime context exists', () => {
    const html = renderToStaticMarkup(
      <SuiteAlphaPage
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

    expect(html).toContain('Evidence gates still blocking public wording');
    expect(html).toContain(
      'Open verified scope clause for Shopflow for Albertsons Family'
    );
    expect(html).toContain('href="#verified-scope-ext-albertsons"');
    expect(html).toContain(
      'Open rollout row for Shopflow for Albertsons Family'
    );
    expect(html).toContain('href="#rollout-ext-albertsons"');
    expect(html).toContain('Review on latest source page');
    expect(html).toContain('href="https://www.safeway.com/shop/cart"');
    expect(html).toContain(
      '1 packet is waiting for review. Start from the freshest known operator page for this app.'
    );
    expect(html).toContain('Merchant source page');
    expect(html).toContain(
      'Run explicit review before public wording changes for this banner.'
    );
    expect(html).toContain(
      'Run explicit review from the freshest known source page.'
    );
    expect(html).toContain('Operator next step');
    expect(html).toContain('>Review waiting evidence on source page<');
    expect(html).toContain('Display language');
    expect(html).toContain('href="sidepanel.html"');
    expect(html).toContain('href="sidepanel.html?locale=zh-CN"');
    expect(html).toContain('aria-current="page"');
    expect(html.indexOf('Priority routes')).toBeLessThan(
      html.indexOf('Alpha guardrails')
    );
    expect(html.indexOf('Claim readiness board')).toBeLessThan(
      html.indexOf('Operator next step')
    );
  });

  it('keeps fallback blocker guidance honest when no fresh route is available yet', () => {
    const html = renderToStaticMarkup(<SuiteAlphaPage />);

    expect(html).toContain(
      'Open the verified scope clause and rollout row first, then open'
    );
    expect(html).not.toContain('href="undefined"');
  });

  it('renders suite headings from the locale catalog when zh-CN is requested', () => {
    const html = renderToStaticMarkup(
      <SuiteAlphaPage
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

    expect(html).toContain('从这里开始');
    expect(html).toContain('证据门');
    expect(html).toContain('已验证范围导航');
    expect(html).toContain('操作员下一步');
    expect(html).toContain('界面语言');
    expect(html).toContain('仅限内部 Alpha');
    expect(html).toContain('Shopflow for Albertsons Family 的优先路线');
    expect(html).toContain('打开证据门');
  });

  it('renders a real provider-runtime handoff card when a Switchyard base URL is configured', () => {
    const html = renderToStaticMarkup(
      <SuiteAlphaPage
        runtimeConsumer={createProviderRuntimeConsumerSnapshot({
          baseUrl: 'http://127.0.0.1:4317/',
        })}
      />
    );

    expect(html).toContain('Provider runtime seam');
    expect(html).toContain('Configured runtime base URL');
    expect(html).toContain('http://127.0.0.1:4317');
    expect(html).toContain('/v1/runtime/providers/chatgpt/acquisition/start');
    expect(html).toContain('/v1/runtime/providers/gemini/acquisition/capture');
    expect(html).toContain('does not replace merchant live proof');
  });
});
