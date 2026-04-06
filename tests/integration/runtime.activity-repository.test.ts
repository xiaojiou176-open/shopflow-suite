import { describe, expect, it } from 'vitest';
import { ActivityRepository } from '../../packages/runtime/src/storage/activity-repository';
import { SiteContextCoordinator } from '../../packages/runtime/src/context/site-context-coordinator';

class MemoryStorage {
  private readonly store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key) as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }
}

describe('runtime integration skeleton', () => {
  it('persists activity items through the repository abstraction', async () => {
    const repository = new ActivityRepository(new MemoryStorage());

    await repository.save([
      {
        id: 'a1',
        appId: 'ext-amazon',
        label: 'Captured product',
        summary: '1 ready capability on the latest detected page.',
        timestampLabel: 'just now',
      },
    ]);

    await expect(repository.list('ext-amazon')).resolves.toEqual([
      expect.objectContaining({
        id: 'a1',
        appId: 'ext-amazon',
      }),
    ]);
  });

  it('keeps app-scoped activity entries lightweight and ordered', async () => {
    const repository = new ActivityRepository(new MemoryStorage());

    await repository.record({
      id: 'ext-amazon:https://www.amazon.com/dp/example',
      appId: 'ext-amazon',
      label: 'www.amazon.com · product',
      summary: 'www.amazon.com exposes 1 ready capability on the latest detected page.',
      timestampLabel: '10:00 AM',
      href: 'https://www.amazon.com/dp/example',
    });
    await repository.record({
      id: 'ext-temu:https://www.temu.com/search_result.html?search_key=lamp',
      appId: 'ext-temu',
      label: 'www.temu.com · search',
      summary:
        'www.temu.com still has 2 capability constraints needing operator attention.',
      timestampLabel: '10:05 AM',
      href: 'https://www.temu.com/search_result.html?search_key=lamp',
    });

    await expect(repository.list('ext-temu')).resolves.toEqual([
      expect.objectContaining({
        appId: 'ext-temu',
        label: 'www.temu.com · search',
      }),
    ]);
  });

  it('coordinates site context snapshots by tab id', () => {
    const coordinator = new SiteContextCoordinator();
    coordinator.set({
      appId: 'ext-amazon',
      tabId: 3,
      url: 'https://www.amazon.com/dp/example',
      detection: {
        storeId: 'amazon',
        verifiedScopes: ['amazon'],
        matchedHost: 'www.amazon.com',
        pageKind: 'product',
        confidence: 0.9,
        capabilityStates: [],
      },
    });

    expect(coordinator.get(3)?.detection.storeId).toBe('amazon');
    expect(coordinator.getLatestForApp('ext-amazon')?.tabId).toBe(3);
  });
});
