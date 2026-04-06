import { describe, expect, it } from 'vitest';
import { getLiveReceiptAppRequirements } from '../../packages/contracts/src/live-receipt-capture-plan';
import type { ActivityItem } from '../../packages/runtime/src/storage/activity-repository';
import { createSuiteDetailModel, type SuiteCatalogItem } from '../../apps/ext-shopping-suite/src/suite-control-plane-model';

describe('createSuiteDetailModel', () => {
  it('localizes suite actionable labels from structured route truth instead of parsing English labels', () => {
    const requirements = getLiveReceiptAppRequirements('ext-albertsons');
    const item: SuiteCatalogItem = {
      appId: 'ext-albertsons',
      title: 'Shopflow for Albertsons Family',
      wave: 'Wave 1',
      state: 'repo-verified-claim-gated',
      note: 'Currently verified on Safeway.',
      defaultRouteUrl: 'https://www.safeway.com/',
      defaultRouteLabel: '打开 Safeway 首页',
      defaultRouteSummary: '先进入 Safeway 首页，再让 Suite 采集最新运行时上下文。',
    };
    const recentActivity: ActivityItem = {
      id: 'ext-albertsons:https://www.safeway.com/shop/cart',
      appId: 'ext-albertsons',
      label: 'www.safeway.com · cart',
      summary: '1 ready capability on the latest detected page.',
      summaryKind: 'ready',
      matchedHost: 'www.safeway.com',
      pageKind: 'cart',
      readyCount: 1,
      timestampLabel: '8:10 PM',
      occurredAt: '2026-04-03T20:10:00.000Z',
      href: 'https://www.safeway.com/shop/cart',
    };

    const model = createSuiteDetailModel(
      item,
      {
        recentActivities: [recentActivity],
        evidenceRecords: [],
      },
      'zh-CN'
    );

    expect(requirements).toHaveLength(2);
    expect(model.routeLabel).toBe('继续采集路径');
    expect(model.priorityQueueItem?.actionLabel).toBe('在最新来源页面开始采集');
    expect(model.operatorDecisionBrief.primaryRouteLabel).toBe('继续采集路径');
  });
});
