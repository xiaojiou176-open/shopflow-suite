import { describe, expect, it } from 'vitest';
import {
  createMessageBusHandler,
  createPingMessage,
  registerMessageBus,
} from '../../packages/runtime/src/messaging/message-bus';

class FakeRuntime {
  listeners: Array<(message: unknown) => unknown> = [];

  readonly onMessage = {
    addListener: (listener: (message: unknown) => unknown) => {
      this.listeners.push(listener);
    },
  };
}

class MemoryStorage {
  private readonly store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.store.get(key) as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }
}

describe('runtime message bus', () => {
  it('responds to ping requests with a normalized pong payload', async () => {
    const handler = createMessageBusHandler();

    await expect(handler(createPingMessage('ext-amazon'))).resolves.toEqual({
      type: 'shopflow/pong',
      payload: {
        appId: 'ext-amazon',
        ok: true,
      },
    });
  });

  it('registers the shared runtime listener only once per runtime instance', () => {
    const runtime = new FakeRuntime();

    expect(registerMessageBus({ runtime })).toBe(true);
    expect(registerMessageBus({ runtime })).toBe(true);
    expect(runtime.listeners).toHaveLength(1);
  });

  it('records site detection into recent activity without inventing a second workflow plane', async () => {
    const storage = new MemoryStorage();
    const handler = createMessageBusHandler({
      storage,
      activityStorage: storage,
      now: () => '2026-03-30T17:20:00.000Z',
    });

    await handler(
      {
        type: 'shopflow/site-detected',
        payload: {
          appId: 'ext-amazon',
          url: 'https://www.amazon.com/dp/example',
          detection: {
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
          },
        },
      },
      {
        tab: {
          id: 3,
        },
      }
    );

    await expect(storage.get('shopflow.recentActivity')).resolves.toEqual([
      expect.objectContaining({
        appId: 'ext-amazon',
        label: 'www.amazon.com · product',
        summary:
          'www.amazon.com exposes 1 ready capability on the latest detected page.',
        matchedHost: 'www.amazon.com',
        pageKind: 'product',
        readyCount: 1,
        constrainedCount: 0,
        summaryKind: 'ready',
        occurredAt: '2026-03-30T17:20:00.000Z',
        href: 'https://www.amazon.com/dp/example',
      }),
    ]);
  });

  it('stores the latest captured output preview when content scripts report it', async () => {
    const storage = new MemoryStorage();
    const handler = createMessageBusHandler({
      outputStorage: storage,
    });

    await handler({
      type: 'shopflow/output-captured',
      payload: {
        appId: 'ext-amazon',
        storeId: 'amazon',
        kind: 'product',
        pageUrl: 'https://www.amazon.com/dp/example',
        capturedAt: '2026-03-30T17:21:00.000Z',
        headline: 'Amazon Burr Grinder',
        summary: 'Captured product details with price $39.99.',
        previewLines: ['Price: $39.99', 'SKU: B0SHOPFLOW'],
        summaryDescriptor: {
          variant: 'product-with-price',
          priceDisplayText: '$39.99',
        },
        detailEntries: [
          { kind: 'price', value: '$39.99' },
          { kind: 'sku', value: 'B0SHOPFLOW' },
        ],
      },
    });

    await expect(storage.get('shopflow.latestOutput.ext-amazon')).resolves.toEqual(
      expect.objectContaining({
        appId: 'ext-amazon',
        kind: 'product',
        headline: 'Amazon Burr Grinder',
        summaryDescriptor: {
          variant: 'product-with-price',
          priceDisplayText: '$39.99',
        },
        detailEntries: [
          { kind: 'price', value: '$39.99' },
          { kind: 'sku', value: 'B0SHOPFLOW' },
        ],
      })
    );
  });
});
