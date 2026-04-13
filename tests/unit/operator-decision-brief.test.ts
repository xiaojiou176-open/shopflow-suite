import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createHomeViewModel,
  createOperatorDecisionBrief,
  type SidePanelHomeViewModel,
} from '@shopflow/core';
import {
  operatorDecisionBriefSchema,
  type DetectionResult,
} from '@shopflow/contracts';
import { repoRoot } from '../support/repo-paths';

const readyDetection: DetectionResult = {
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
  ],
};

describe('createOperatorDecisionBrief', () => {
  it('reuses localized workflow truth instead of falling back to English count prose', () => {
    const model = createHomeViewModel(
      'Shopflow for Amazon',
      'Amazon',
      readyDetection,
      [],
      {
        headline: 'Live receipt readiness',
        items: [
          {
            captureId: 'amazon-live-receipt',
            title: 'Amazon product live receipt',
            verifiedScope: 'amazon',
            status: 'captured',
            sectionHref: '#live-receipt-review',
            summary: 'Amazon evidence is captured and waiting for explicit review.',
            nextStep: '先审核证据队列，再决定公开说法。',
          },
        ],
      },
      {
        locale: 'zh-CN',
      }
    );

    const brief = createOperatorDecisionBrief(model);

    expect(brief.whyNow[0]).toBe('www.amazon.com · 商品页');
    expect(brief.whyNow[1]).toContain('当前可以直接运行');
    expect(brief.whyNow[1]).not.toContain('runnable capability on this page');
    expect(brief.nextStep).toBe('先审核证据队列，再决定公开说法。');
  });

  it('falls back to workflow or secondary-navigation truth instead of a hardcoded English label', () => {
    const model: SidePanelHomeViewModel = {
      appTitle: 'Shopflow for Amazon',
      appStatus: 'idle',
      site: {
        siteId: 'amazon',
        siteName: 'Amazon',
        host: '等待支持页面',
        pageKind: 'unknown',
        pageKindLabel: '未知页面',
        urlLabel: '先进入支持页面',
      },
      capabilities: [],
      quickActions: [],
      secondaryNavigation: [
        {
          id: 'support-state',
          label: '查看支持状态',
          summary: '先打开当前站点摘要，确认站点上下文。',
          href: '#current-site-summary',
          actionLabel: '打开当前站点摘要',
        },
      ],
      recentActivities: [],
      readiness: {
        label: '等待支持页面',
        summary: '先进入支持页面，再回来查看准备度。',
      },
      workflowBrief: {
        tone: 'unsupported',
        title: '工作流副驾',
        summary: '当前页面还不在支持边界内。',
        bullets: [
          {
            label: '当前页面',
            value: '等待支持页面 · 未知页面',
          },
          {
            label: '下一步动作',
            value: '先进入支持页面',
          },
        ],
        nextAction: {
          label: '打开当前站点摘要',
          reason: '先进入支持页面',
        },
      },
    };

    const brief = createOperatorDecisionBrief(model);

    expect(brief.primaryRouteLabel).toBe('打开当前站点摘要');
    expect(brief.nextStep).toBe('先进入支持页面');
  });

  it('keeps the checked-in operator decision brief example aligned with current logic', () => {
    const model = createHomeViewModel(
      'Shopflow for Albertsons Family',
      'Albertsons Family',
      {
        storeId: 'albertsons',
        verifiedScopes: ['safeway'],
        matchedHost: 'www.safeway.com',
        pageKind: 'cart',
        confidence: 0.95,
        capabilityStates: [
          {
            capability: 'run_action',
            status: 'ready',
          },
        ],
      },
      [
        {
          id: 'ext-albertsons:https://www.safeway.com/shop/cart',
          label: 'www.safeway.com · cart',
          summary:
            'www.safeway.com exposes 1 ready capability on the latest detected page.',
          timestampLabel: '8:00 AM',
          href: 'https://www.safeway.com/shop/cart',
        },
      ],
      {
        headline: 'Live receipt readiness',
        blockerSummary: {
          label: 'Still missing reviewable evidence',
          summary:
            'Review bundle is complete; reviewed live evidence already includes rejected captures, and the remaining open gate is external capture/review on unresolved live proof.',
          nextStep:
            'Keep wording claim-gated. Reviewed live evidence already includes rejected captures for safeway-cancel-live-receipt, and external capture/review is still required for safeway-subscribe-live-receipt.',
          sourceHref: 'https://www.safeway.com/shop/cart',
          sourceLabel: 'Open current evidence route',
        },
        items: [
          {
            captureId: 'safeway-subscribe-live-receipt',
            title: 'Safeway subscribe live receipt',
            verifiedScope: 'safeway',
            status: 'missing-live-receipt',
            sectionHref: '#live-receipt-evidence',
            summary:
              'Safeway subscribe live receipt still requires a fresh, reviewable live capture from a logged-in Safeway session.',
            nextStep:
              'Keep wording claim-gated. Reviewed live evidence already includes rejected captures for safeway-cancel-live-receipt, and external capture/review is still required for safeway-subscribe-live-receipt.',
            sourceHref: 'https://www.safeway.com/shop/cart',
            sourceLabel: 'Open current evidence route',
          },
          {
            captureId: 'safeway-cancel-live-receipt',
            title: 'Safeway cancel live receipt',
            verifiedScope: 'safeway',
            status: 'rejected',
            sectionHref: '#live-receipt-review',
            summary:
              'Safeway cancel live receipt is currently rejected because the account state did not expose a cancelable Schedule & Save subscription.',
            reviewSummary:
              'Current account state has no active Schedule & Save subscription item to cancel.',
            reviewLabel: 'Rejected in review',
            sourceHref: 'https://www.safeway.com/schedule-and-save/manage',
            sourceLabel: 'Open current evidence route',
          },
        ],
      },
      {
        verifiedScopeCopy: 'Currently verified on Safeway.',
      }
    );

    const expected = createOperatorDecisionBrief(model);
    const example = operatorDecisionBriefSchema.parse(
      JSON.parse(
        readFileSync(
          resolve(repoRoot, 'docs/ecosystem/examples/operator-decision-brief.ext-albertsons.json'),
          'utf8'
        )
      )
    );

    expect(example).toEqual(expected);
  });
});
