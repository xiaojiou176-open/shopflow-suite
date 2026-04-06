// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import type { DetectionResult, NormalizedProduct } from '@shopflow/contracts';

vi.mock('../../packages/runtime/src/messaging/message-bus', () => ({
  reportCapturedOutput: vi.fn(async () => undefined),
}));

import { captureLatestReadyOutput } from '../../packages/runtime/src/capture/capture-ready-output';

const readyProductDetection: DetectionResult = {
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

describe('captureLatestReadyOutput', () => {
  it('uses the extracted canonical sourceUrl for latest product output when it is available', async () => {
    const product: NormalizedProduct = {
      sourceStoreId: 'amazon',
      sourceUrl: 'https://www.amazon.com/dp/B0ASINC123',
      title: 'Amazon Travel Grinder',
      price: {
        currency: 'USD',
        amount: 29.99,
        displayText: '$29.99',
      },
      sku: 'B0ASINC123',
    };

    const record = await captureLatestReadyOutput({
      appId: 'ext-amazon',
      storeId: 'amazon',
      pageUrl:
        'https://www.amazon.com/gp/product/B0ASINC123/ref=ox_sc_act_title_1?smid=ATVPDKIKX0DER&psc=1',
      detection: readyProductDetection,
      document,
      now: () => '2026-04-01T03:05:00.000Z',
      extractProduct: async () => product,
    });

    expect(record).toMatchObject({
      appId: 'ext-amazon',
      kind: 'product',
      pageUrl: 'https://www.amazon.com/dp/B0ASINC123',
      headline: 'Amazon Travel Grinder',
      summaryDescriptor: {
        variant: 'product-with-price',
        priceDisplayText: '$29.99',
      },
      detailEntries: expect.arrayContaining([
        { kind: 'price', value: '$29.99' },
        { kind: 'sku', value: 'B0ASINC123' },
      ]),
      previewLines: expect.arrayContaining(['SKU: B0ASINC123']),
    });
  });
});
