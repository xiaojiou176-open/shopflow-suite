import { describe, expect, it } from 'vitest';
import { localizeRecentActivities } from '../../packages/ui/src/recent-activity-copy';

describe('localizeRecentActivities', () => {
  it('keeps richer English runtime summaries intact while localizing zh-CN from structured fields', () => {
    const items = [
      {
        id: 'ext-amazon:https://www.amazon.com/dp/example',
        appId: 'ext-amazon',
        label: 'www.amazon.com · product',
        summary: 'www.amazon.com exposes 1 ready capability on the latest detected page.',
        matchedHost: 'www.amazon.com',
        pageKind: 'product',
        readyCount: 1,
        constrainedCount: 0,
        summaryKind: 'ready',
        occurredAt: '2026-04-01T08:00:00.000Z',
        timestampLabel: '8:00 AM',
        href: 'https://www.amazon.com/dp/example',
      },
      {
        id: 'ext-temu:https://www.temu.com/search_result.html?search_key=lamp',
        appId: 'ext-temu',
        label: 'www.temu.com · search',
        summary:
          'www.temu.com still has 2 capability constraints needing operator attention.',
        matchedHost: 'www.temu.com',
        pageKind: 'search',
        readyCount: 0,
        constrainedCount: 2,
        summaryKind: 'attention',
        occurredAt: '2026-04-01T08:05:00.000Z',
        timestampLabel: '8:05 AM',
        href: 'https://www.temu.com/search_result.html?search_key=lamp',
      },
    ];

    const english = localizeRecentActivities(items, 'en');
    const chinese = localizeRecentActivities(items, 'zh-CN');

    expect(english[0]?.label).toBe('www.amazon.com · product');
    expect(english[0]?.summary).toBe(
      'www.amazon.com exposes 1 ready capability on the latest detected page.'
    );

    expect(chinese[0]?.label).toBe('www.amazon.com · 商品页');
    expect(chinese[0]?.summary).toContain('当前有 1 个能力可以直接运行。');
    expect(chinese[0]?.timestampLabel).not.toBe('8:00 AM');

    expect(chinese[1]?.label).toBe('www.temu.com · 搜索页');
    expect(chinese[1]?.summary).toContain(
      '当前有 2 个能力还需要操作员先处理'
    );
  });
});
