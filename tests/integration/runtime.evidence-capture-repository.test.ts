import { describe, expect, it } from 'vitest';
import { getLiveReceiptAppRequirements } from '@shopflow/contracts';
import {
  EvidenceCaptureRepository,
  type EvidenceStorageAreaLike,
} from '@shopflow/runtime';

class InMemoryStorage implements EvidenceStorageAreaLike {
  private readonly values = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.values.get(key) as T | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.values.set(key, value);
  }
}

describe('runtime evidence capture repository', () => {
  it('stores reviewable evidence lifecycle states per app without pretending public-ready proof exists', async () => {
    const repository = new EvidenceCaptureRepository(new InMemoryStorage());

    await repository.upsert({
      appId: 'ext-albertsons',
      captureId: 'safeway-subscribe-live-receipt',
      storeId: 'albertsons',
      verifiedScope: 'safeway',
      pageKind: 'cart',
      actionKind: 'schedule_save_subscribe',
      status: 'missing-live-receipt',
      summary:
        'Manual Safeway subscribe capture path exists, but no live receipt bundle has been recorded yet.',
      updatedAt: '2026-03-30T09:00:00.000Z',
    });
    await repository.upsert({
      appId: 'ext-albertsons',
      captureId: 'safeway-subscribe-live-receipt',
      storeId: 'albertsons',
      verifiedScope: 'safeway',
      pageKind: 'cart',
      actionKind: 'schedule_save_subscribe',
      status: 'captured',
      summary:
        'A reviewable live receipt bundle has been recorded for Safeway subscribe and is waiting for review.',
      updatedAt: '2026-03-30T09:05:00.000Z',
      capturedAt: '2026-03-30T09:05:00.000Z',
      screenshotLabel: 'safeway-subscribe-success.png',
      sourcePageUrl: 'https://www.safeway.com/cart',
      sourcePageLabel: 'Live Safeway cart page',
      actionSnapshot: {
        attempted: 2,
        succeeded: 2,
        failed: 0,
        skipped: 0,
      },
    });
    await repository.upsert({
      appId: 'ext-albertsons',
      captureId: 'safeway-subscribe-live-receipt',
      storeId: 'albertsons',
      verifiedScope: 'safeway',
      pageKind: 'cart',
      actionKind: 'schedule_save_subscribe',
      status: 'reviewed',
      summary:
        'Safeway subscribe evidence bundle was reviewed and accepted for release decisioning.',
      updatedAt: '2026-03-30T09:12:00.000Z',
      capturedAt: '2026-03-30T09:05:00.000Z',
      reviewedAt: '2026-03-30T09:12:00.000Z',
      reviewedBy: 'Shopflow QA',
      reviewSummary:
        'Screenshot, scope proof, and action counts all match the capture checklist.',
      screenshotLabel: 'safeway-subscribe-success.png',
      sourcePageUrl: 'https://www.safeway.com/cart',
      sourcePageLabel: 'Live Safeway cart page',
      actionSnapshot: {
        attempted: 2,
        succeeded: 2,
        failed: 0,
        skipped: 0,
      },
    });

    await expect(repository.list('ext-albertsons')).resolves.toEqual([
      expect.objectContaining({
        captureId: 'safeway-subscribe-live-receipt',
        status: 'reviewed',
        reviewedBy: 'Shopflow QA',
        screenshotLabel: 'safeway-subscribe-success.png',
        sourcePageUrl: 'https://www.safeway.com/cart',
        sourcePageLabel: 'Live Safeway cart page',
        actionSnapshot: {
          attempted: 2,
          succeeded: 2,
          failed: 0,
          skipped: 0,
        },
      }),
    ]);
  });

  it('seeds missing records from shared app requirements without inventing reviewed proof', async () => {
    const repository = new EvidenceCaptureRepository(new InMemoryStorage());

    await repository.seedMissing(
      getLiveReceiptAppRequirements('ext-kroger'),
      '2026-03-30T10:00:00.000Z'
    );

    await expect(repository.list('ext-kroger')).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captureId: 'fred-meyer-verified-scope-live-receipt',
          status: 'missing-live-receipt',
        }),
        expect.objectContaining({
          captureId: 'qfc-verified-scope-live-receipt',
          status: 'missing-live-receipt',
        }),
      ])
    );
  });

  it('summarizes app-level queue states without collapsing raw evidence packets into one generic blocker', async () => {
    const repository = new EvidenceCaptureRepository(new InMemoryStorage());
    const requirements = getLiveReceiptAppRequirements('ext-albertsons');

    await repository.seedMissing(requirements, '2026-03-30T10:00:00.000Z');
    await repository.upsert({
      appId: 'ext-albertsons',
      captureId: 'safeway-subscribe-live-receipt',
      storeId: 'albertsons',
      verifiedScope: 'safeway',
      pageKind: 'cart',
      actionKind: 'schedule_save_subscribe',
      status: 'capture-in-progress',
      summary:
        'Operator started assembling the Safeway subscribe packet but has not finished the capture checklist yet.',
      updatedAt: '2026-03-30T10:05:00.000Z',
      sourcePageUrl: 'https://www.safeway.com/cart',
      sourcePageLabel: 'Live Safeway cart page',
    });

    await expect(
      repository.summarize('ext-albertsons', requirements)
    ).resolves.toMatchObject({
      totalCount: 2,
      needsCaptureCount: 1,
      captureCount: 1,
      recaptureCount: 0,
      missingCount: 1,
      captureInProgressCount: 1,
      reviewPendingCount: 0,
      reviewedCount: 0,
      rejectedCount: 0,
      expiredCount: 0,
      blockerSummary:
        'Proof still blocked: 1 packet already started and still need capture completion and 1 packet still need a first capture. Next path: Finish in-progress capture for Safeway subscribe live receipt.',
      nextCaptureId: 'safeway-subscribe-live-receipt',
      nextStatus: 'capture-in-progress',
      nextOperatorPath: 'finish-capture',
      nextRequirementTitle: 'Safeway subscribe live receipt',
      nextStep:
        'Capture the screenshot, timestamp, scope proof, and action counts outside version control.',
      nextSourcePageUrl: 'https://www.safeway.com/cart',
      nextSourcePageLabel: 'Live Safeway cart page',
      nextSourceRouteLabel: 'Resume recorded capture page',
    });
  });

  it('keeps rejected and expired packets visible in queue summary instead of flattening them into generic missing work', async () => {
    const repository = new EvidenceCaptureRepository(new InMemoryStorage());
    const requirements = getLiveReceiptAppRequirements('ext-kroger');

    await repository.seedMissing(
      requirements,
      '2026-03-30T10:00:00.000Z'
    );
    await repository.upsert({
      appId: 'ext-kroger',
      captureId: 'fred-meyer-verified-scope-live-receipt',
      storeId: 'kroger',
      verifiedScope: 'fred-meyer',
      pageKind: 'product',
      status: 'captured',
      summary:
        'Fred Meyer scope packet was captured and is ready for explicit review.',
      updatedAt: '2026-03-30T10:05:00.000Z',
      capturedAt: '2026-03-30T10:05:00.000Z',
      screenshotLabel: 'fred-meyer-product.png',
    });
    await repository.upsert({
      appId: 'ext-kroger',
      captureId: 'fred-meyer-verified-scope-live-receipt',
      storeId: 'kroger',
      verifiedScope: 'fred-meyer',
      pageKind: 'product',
      status: 'rejected',
      summary:
        'Fred Meyer scope packet failed review because the screenshot was stale.',
      updatedAt: '2026-03-30T10:12:00.000Z',
      reviewedAt: '2026-03-30T10:12:00.000Z',
      reviewNotes:
        'Screenshot was stale. Re-capture on a fresh Fred Meyer product page.',
      sourcePageUrl: 'https://www.fredmeyer.com/p/grapes/123',
      sourcePageLabel: 'Fred Meyer product page',
    });
    await repository.upsert({
      appId: 'ext-kroger',
      captureId: 'qfc-verified-scope-live-receipt',
      storeId: 'kroger',
      verifiedScope: 'qfc',
      pageKind: 'product',
      status: 'captured',
      summary: 'QFC scope packet was captured and reviewed earlier.',
      updatedAt: '2026-03-30T10:20:00.000Z',
      capturedAt: '2026-03-30T10:20:00.000Z',
      screenshotLabel: 'qfc-product.png',
    });
    await repository.upsert({
      appId: 'ext-kroger',
      captureId: 'qfc-verified-scope-live-receipt',
      storeId: 'kroger',
      verifiedScope: 'qfc',
      pageKind: 'product',
      status: 'reviewed',
      summary: 'QFC scope packet passed explicit review.',
      updatedAt: '2026-03-30T10:24:00.000Z',
      capturedAt: '2026-03-30T10:20:00.000Z',
      reviewedAt: '2026-03-30T10:24:00.000Z',
      reviewedBy: 'Shopflow QA',
      reviewSummary: 'Scope proof and screenshot match the checklist.',
      screenshotLabel: 'qfc-product.png',
    });
    await repository.upsert({
      appId: 'ext-kroger',
      captureId: 'qfc-verified-scope-live-receipt',
      storeId: 'kroger',
      verifiedScope: 'qfc',
      pageKind: 'product',
      status: 'expired',
      summary: 'QFC scope packet expired after the review window lapsed.',
      updatedAt: '2026-03-31T10:24:00.000Z',
      expiresAt: '2026-03-31T10:24:00.000Z',
    });

    await expect(
      repository.summarize('ext-kroger', requirements)
    ).resolves.toMatchObject({
      totalCount: 2,
      needsCaptureCount: 2,
      captureCount: 0,
      recaptureCount: 2,
      missingCount: 0,
      captureInProgressCount: 0,
      reviewPendingCount: 0,
      reviewedCount: 0,
      rejectedCount: 1,
      expiredCount: 1,
      blockerSummary:
        'Proof still blocked: 2 packets need a fresh recapture after rejection or expiry. Next path: Capture a fresh packet for Fred Meyer verified-scope live receipt.',
      nextCaptureId: 'fred-meyer-verified-scope-live-receipt',
      nextStatus: 'rejected',
      nextOperatorPath: 'recapture',
      nextRequirementTitle: 'Fred Meyer verified-scope live receipt',
      nextStep:
        'Capture a fresh packet, then return it to review. Rejected evidence cannot support release wording.',
      nextSourcePageUrl: 'https://www.fredmeyer.com/p/grapes/123',
      nextSourcePageLabel: 'Fred Meyer product page',
      nextSourceRouteLabel: 'Re-open prior capture page',
    });
  });

  it('rejects reviewed evidence records that are missing required review metadata', async () => {
    const repository = new EvidenceCaptureRepository(new InMemoryStorage());

    await expect(
      repository.upsert({
        appId: 'ext-albertsons',
        captureId: 'safeway-subscribe-live-receipt',
        storeId: 'albertsons',
        verifiedScope: 'safeway',
        pageKind: 'cart',
        actionKind: 'schedule_save_subscribe',
        status: 'reviewed',
        summary: 'This record should fail because review metadata is incomplete.',
        updatedAt: '2026-03-30T09:12:00.000Z',
        capturedAt: '2026-03-30T09:05:00.000Z',
      })
    ).rejects.toThrow(/review/i);
  });

  it('rejects lifecycle jumps that skip the explicit review queue', async () => {
    const repository = new EvidenceCaptureRepository(new InMemoryStorage());

    await repository.upsert({
      appId: 'ext-albertsons',
      captureId: 'safeway-subscribe-live-receipt',
      storeId: 'albertsons',
      verifiedScope: 'safeway',
      pageKind: 'cart',
      actionKind: 'schedule_save_subscribe',
      status: 'capture-in-progress',
      summary:
        'Operator started assembling the Safeway subscribe packet, but it is not reviewable yet.',
      updatedAt: '2026-03-30T09:03:00.000Z',
    });

    await expect(
      repository.upsert({
        appId: 'ext-albertsons',
        captureId: 'safeway-subscribe-live-receipt',
        storeId: 'albertsons',
        verifiedScope: 'safeway',
        pageKind: 'cart',
        actionKind: 'schedule_save_subscribe',
        status: 'reviewed',
        summary:
          'This record incorrectly tries to skip the captured queue and jump straight into reviewed.',
        updatedAt: '2026-03-30T09:12:00.000Z',
        capturedAt: '2026-03-30T09:05:00.000Z',
        reviewedAt: '2026-03-30T09:12:00.000Z',
        reviewedBy: 'Shopflow QA',
        reviewSummary:
          'This should fail because capture-in-progress was never advanced to captured first.',
        screenshotLabel: 'safeway-subscribe-success.png',
      })
    ).rejects.toThrow(/transition/i);
  });
});
