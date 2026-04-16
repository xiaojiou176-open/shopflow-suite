import { describe, expect, it } from 'vitest';
import {
  createLocaleRouteHref,
  getShopflowLocaleCatalog,
  normalizeShopflowLocale,
  resolveShopflowLocaleFromUrl,
} from '../../packages/core/src/locale';

describe('Shopflow second-pass locale route helpers', () => {
  it('keeps the english suite route helpers explicit and route-first', () => {
    const en = getShopflowLocaleCatalog('en');

    expect(
      en.suite.priorityRouteAria(
        'Shopflow Suite',
        'Open Side Panel family chooser'
      )
    ).toBe('Priority route for Shopflow Suite: Open Side Panel family chooser');
    expect(
      en.suite.frontDoorAria(
        'Shopflow Suite',
        'Open verified scope clause for Shopflow Suite'
      )
    ).toBe(
      'Front door for Shopflow Suite: Open verified scope clause for Shopflow Suite'
    );
    expect(
      en.suite.operatorNextStepAria(
        'Shopflow Suite',
        'Review waiting evidence on source page'
      )
    ).toBe(
      'Next move for Shopflow Suite: Review waiting evidence on source page'
    );
    expect(
      en.suite.priorityPacketActionAria(
        'Shopflow Suite',
        'Review on latest source page'
      )
    ).toBe(
      'Priority packet action for Shopflow Suite: Review on latest source page'
    );
    expect(
      en.suite.decisionBriefRouteAria('Shopflow Suite', 'Open decision brief')
    ).toBe('Decision brief route for Shopflow Suite: Open decision brief');
    expect(
      en.suite.providerRuntimeSeamRouteSummary('http://127.0.0.1:4317')
    ).toContain('http://127.0.0.1:4317');
    expect(en.suite.providerRuntimeSeamAcquisitionModes('start, capture')).toBe(
      'Acquisition modes: start, capture.'
    );
    expect(en.suite.providerRuntimeSeamProviderSummary('Gemini')).toContain(
      'Gemini can reuse the same read-only seam'
    );
    expect(en.suite.providerRuntimeSeamStartLabel('Gemini')).toBe(
      'Start Gemini acquisition'
    );
    expect(en.suite.providerRuntimeSeamCaptureLabel('Gemini')).toBe(
      'Capture Gemini acquisition'
    );
    expect(en.suite.openRolloutRow('Shopflow for Amazon')).toBe(
      'Open rollout row for Shopflow for Amazon'
    );
    expect(en.suite.openVerifiedScopeClause('Shopflow for Amazon')).toBe(
      'Open verified scope clause for Shopflow for Amazon'
    );
    expect(en.suite.supportDesksHeading).toBe('Deeper detail');
    expect(en.suite.supportDesksSummary).toContain(
      'Open this only when you need verified scope clauses, proof queues, runtime handoff notes, or Suite rules.'
    );
    expect(en.suite.waitingReviewRouteSummary(2)).toBe(
      '2 packets are waiting for review. Start from the freshest known operator page for this app.'
    );
    expect(en.suite.reviewFromLatestCaptureSummary(1)).toBe(
      '1 packet are waiting for review. Open the latest captured page before you inspect the review lane.'
    );
    expect(en.suite.resumeCapturePathSummary(3)).toBe(
      '3 packets still need capture work. Start from the freshest known source page for this app.'
    );
    expect(en.suite.resumeCaptureFromLatestCapturedPageSummary(2)).toBe(
      '2 packets still need capture work. Open the latest captured page and continue from there.'
    );
    expect(
      en.suite.noFreshContextSummary(
        'Open Side Panel family chooser',
        'Shopflow Suite'
      )
    ).toBe(
      'No fresh page context exists yet. Open Side Panel family chooser so Suite can capture runtime context for Shopflow Suite.'
    );
    expect(en.suite.priorityQueueAction.review('latest source page')).toBe(
      'Review on latest source page'
    );
    expect(
      en.suite.priorityQueueAction.finishCapture('latest captured page')
    ).toBe('Finish capture on latest captured page');
  });

  it('keeps the zh-CN suite route helpers localized while staying operational', () => {
    const zh = getShopflowLocaleCatalog('zh-CN');

    expect(zh.common.capturedAtPrefix).toBe('捕获于');
    expect(zh.common.openCurrentCapturePage).toBe('打开当前捕获页面');
    expect(zh.sidePanel.openRoute).toBe('打开路线');
    expect(zh.sidePanel.statusLabels.live).toBe('当前可运行');
    expect(zh.model.capabilityActionLabels.run_action).toBe('打开支持的工作流');
    expect(
      zh.suite.priorityRouteAria(
        'Shopflow Suite',
        '打开 Side Panel 店铺入口选择器'
      )
    ).toBe('Shopflow Suite 的优先路线：打开 Side Panel 店铺入口选择器');
    expect(
      zh.suite.providerRuntimeSeamRouteSummary('http://127.0.0.1:4317')
    ).toContain('http://127.0.0.1:4317');
    expect(zh.suite.providerRuntimeSeamHeading).toBe('外部运行时接缝');
    expect(zh.suite.providerRuntimeSeamAcquisitionModes('start, capture')).toBe(
      '当前接入模式：start, capture。'
    );
    expect(zh.suite.providerRuntimeSeamProviderSummary('Gemini')).toContain(
      'Gemini 可以复用同一条只读接缝'
    );
    expect(zh.suite.providerRuntimeSeamStartLabel('Gemini')).toBe(
      '开始 Gemini 接入'
    );
    expect(zh.suite.providerRuntimeSeamCaptureLabel('Gemini')).toBe(
      '采集 Gemini 接入'
    );
    expect(zh.suite.supportDesksHeading).toBe('辅助服务台');
    expect(zh.suite.supportDesksSummary).toContain('压到第二层');
    expect(zh.suite.openRolloutRow('Shopflow for Amazon')).toBe(
      '打开 Shopflow for Amazon 的推进行'
    );
    expect(zh.suite.openVerifiedScopeClause('Shopflow for Amazon')).toBe(
      '打开 Shopflow for Amazon 的已验证范围条款'
    );
    expect(zh.suite.priorityQueueAction.review('最新来源页面')).toBe(
      '在最新来源页面上审核'
    );
    expect(zh.suite.priorityQueueAction.capture('最新捕获页面')).toBe(
      '在最新捕获页面开始采集'
    );
  });

  it('normalizes locale routes without duplicating or leaking locale params', () => {
    expect(normalizeShopflowLocale('zh-TW')).toBe('zh-CN');
    expect(normalizeShopflowLocale('en-US')).toBe('en');
    expect(resolveShopflowLocaleFromUrl('?locale=zh-CN', 'en')).toBe('zh-CN');
    expect(resolveShopflowLocaleFromUrl('', 'en-US')).toBe('en');

    expect(
      createLocaleRouteHref('popup.html?locale=zh-CN#start-here', 'en')
    ).toBe('popup.html#start-here');
    expect(
      createLocaleRouteHref('/sidepanel.html#claim-readiness-board', 'zh-CN')
    ).toBe('/sidepanel.html?locale=zh-CN#claim-readiness-board');
    expect(
      createLocaleRouteHref(
        'https://shopflow.local/popup.html?locale=zh-CN#start-here',
        'en'
      )
    ).toBe('https://shopflow.local/popup.html#start-here');
  });
});
