import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createReviewedRecordsPacket,
  parseReviewedRecordsArgs,
  readJsonFile,
} from '../../tooling/live/write-reviewed-records';
import { createReviewInputTemplatePacket } from '../../tooling/live/write-review-input-template';

describe('live browser reviewed records tooling', () => {
  it('turns explicit review decisions into reviewed records without touching undecided captures', () => {
    const packet = createReviewedRecordsPacket({
      reviewCandidateRecordsPacket: {
        checkedAt: '2026-04-05T22:58:49.695Z',
        sourceArtifacts: {
          operatorCapturePacketLatestPath: '/tmp/operator-capture-packet.json',
        },
        capturedRecords: [
          {
            captureId: 'fred-meyer-verified-scope-live-receipt',
            appId: 'ext-kroger',
            storeId: 'kroger',
            verifiedScope: 'fred-meyer',
            pageKind: 'product',
            status: 'captured',
            summary:
              'Fred Meyer verified-scope live receipt review candidate prepared from the live operator packet and waiting for explicit review.',
            updatedAt: '2026-04-05T22:58:49.689Z',
            capturedAt: '2026-04-05T22:58:49.689Z',
            screenshotLabel: 'page-2.png',
            sourcePageUrl: 'https://www.fredmeyer.com/pr/weekly-digital-deals',
            sourcePageLabel: 'Weekly Digital Deals - Fred Meyer',
          },
          {
            captureId: 'qfc-verified-scope-live-receipt',
            appId: 'ext-kroger',
            storeId: 'kroger',
            verifiedScope: 'qfc',
            pageKind: 'product',
            status: 'captured',
            summary:
              'QFC verified-scope live receipt review candidate prepared from the live operator packet and waiting for explicit review.',
            updatedAt: '2026-04-05T22:58:49.689Z',
            capturedAt: '2026-04-05T22:58:49.689Z',
            screenshotLabel: 'page-3.png',
            sourcePageUrl: 'https://www.qfc.com/search?query=kombucha',
            sourcePageLabel: 'Search Products - QFC',
          },
        ],
        blockedCandidates: [
          {
            captureId: 'safeway-subscribe-live-receipt',
            appId: 'ext-albertsons',
            targetId: 'safeway-cart',
            status: 'blocked',
            classification: 'deep_link_unstable',
            blockerReason: 'deep_link_unstable',
          },
        ],
      },
      reviewInputPacket: {
        decisions: [
          {
            captureId: 'fred-meyer-verified-scope-live-receipt',
            status: 'reviewed',
            reviewedBy: 'Shopflow QA',
            reviewedAt: '2026-04-05T23:05:00.000Z',
            reviewSummary:
              'Screenshot and verified-scope page label match the Fred Meyer review checklist.',
          },
        ],
      },
    });

    expect(packet.reviewedRecords).toEqual([
      expect.objectContaining({
        captureId: 'fred-meyer-verified-scope-live-receipt',
        status: 'reviewed',
        reviewedBy: 'Shopflow QA',
        reviewedAt: '2026-04-05T23:05:00.000Z',
        reviewSummary:
          'Screenshot and verified-scope page label match the Fred Meyer review checklist.',
      }),
    ]);
    expect(packet.undecidedCapturedRecords).toEqual([
      expect.objectContaining({
        captureId: 'qfc-verified-scope-live-receipt',
        status: 'captured',
      }),
    ]);
    expect(packet.blockedCandidates).toEqual([
      expect.objectContaining({
        captureId: 'safeway-subscribe-live-receipt',
        blockerReason: 'deep_link_unstable',
      }),
    ]);
  });

  it('refuses to review action-heavy captures without action counts', () => {
    expect(() =>
      createReviewedRecordsPacket({
        reviewCandidateRecordsPacket: {
          checkedAt: '2026-04-05T22:58:49.695Z',
          sourceArtifacts: {
            operatorCapturePacketLatestPath: '/tmp/operator-capture-packet.json',
          },
          capturedRecords: [
            {
              captureId: 'temu-filter-live-receipt',
              appId: 'ext-temu',
              storeId: 'temu',
              verifiedScope: 'temu',
              pageKind: 'search',
              actionKind: 'filter_non_local_warehouse',
              status: 'captured',
              summary:
                'Temu warehouse filter live receipt review candidate prepared from the live operator packet and waiting for explicit review.',
              updatedAt: '2026-04-05T22:58:49.689Z',
              capturedAt: '2026-04-05T22:58:49.689Z',
              screenshotLabel: 'page-1.png',
              sourcePageUrl:
                'https://www.temu.com/search_result.html?search_key=warehouse',
              sourcePageLabel: 'Temu',
            },
          ],
          blockedCandidates: [],
        },
        reviewInputPacket: {
          decisions: [
            {
              captureId: 'temu-filter-live-receipt',
              status: 'reviewed',
              reviewedBy: 'Shopflow QA',
              reviewSummary:
                'Screenshot looks good, but this should still fail without action counts.',
            },
          ],
        },
      })
    ).toThrow(/requires actionSnapshot/i);
  });

  it('allows action-heavy captures to be reviewed once action counts are present', () => {
    const packet = createReviewedRecordsPacket({
      reviewCandidateRecordsPacket: {
        checkedAt: '2026-04-05T22:58:49.695Z',
        sourceArtifacts: {
          operatorCapturePacketLatestPath: '/tmp/operator-capture-packet.json',
        },
        capturedRecords: [
          {
            captureId: 'safeway-cancel-live-receipt',
            appId: 'ext-albertsons',
            storeId: 'albertsons',
            verifiedScope: 'safeway',
            pageKind: 'manage',
            actionKind: 'schedule_save_cancel',
            status: 'captured',
            summary:
              'Safeway cancel live receipt review candidate prepared from the live operator packet and waiting for explicit review.',
            updatedAt: '2026-04-05T22:58:49.689Z',
            capturedAt: '2026-04-05T22:58:49.689Z',
            screenshotLabel: 'page-4.png',
            sourcePageUrl: 'https://www.safeway.com/schedule-and-save/manage',
            sourcePageLabel: 'Manage Schedule | safeway',
          },
        ],
        blockedCandidates: [],
      },
      reviewInputPacket: {
        decisions: [
          {
            captureId: 'safeway-cancel-live-receipt',
            status: 'reviewed',
            reviewedBy: 'Shopflow QA',
            reviewedAt: '2026-04-05T23:12:00.000Z',
            reviewSummary:
              'Manage-page screenshot, verified scope, and cancellation action counts all match the checklist.',
            actionSnapshot: {
              attempted: 1,
              succeeded: 1,
              failed: 0,
              skipped: 0,
            },
          },
        ],
      },
    });

    expect(packet.reviewedRecords).toEqual([
      expect.objectContaining({
        captureId: 'safeway-cancel-live-receipt',
        status: 'reviewed',
        reviewedBy: 'Shopflow QA',
        actionSnapshot: {
          attempted: 1,
          succeeded: 1,
          failed: 0,
          skipped: 0,
        },
      }),
    ]);
  });

  it('keeps pending template decisions undecided instead of auto-upgrading them', () => {
    const packet = createReviewedRecordsPacket({
      reviewCandidateRecordsPacket: {
        checkedAt: '2026-04-05T22:58:49.695Z',
        sourceArtifacts: {
          operatorCapturePacketLatestPath: '/tmp/operator-capture-packet.json',
        },
        capturedRecords: [
          {
            captureId: 'safeway-cancel-live-receipt',
            appId: 'ext-albertsons',
            storeId: 'albertsons',
            verifiedScope: 'safeway',
            pageKind: 'manage',
            actionKind: 'schedule_save_cancel',
            status: 'captured',
            summary:
              'Safeway cancel live receipt review candidate prepared from the live operator packet and waiting for explicit review.',
            updatedAt: '2026-04-05T22:58:49.689Z',
            capturedAt: '2026-04-05T22:58:49.689Z',
            screenshotLabel: 'page-4.png',
            sourcePageUrl: 'https://www.safeway.com/schedule-and-save/manage',
            sourcePageLabel: 'Manage Schedule | safeway',
          },
        ],
        blockedCandidates: [],
      },
      reviewInputPacket: {
        decisions: [
          {
            captureId: 'safeway-cancel-live-receipt',
            status: 'pending',
            reviewedBy: '',
          },
        ],
      },
      existingReviewedRecordsPacket: {
        checkedAt: '2026-04-05T23:09:55.332Z',
        sourceArtifacts: {
          reviewCandidateRecordsLatestPath: '/tmp/review-candidate-records.json',
          reviewInputPath: '/tmp/review-input.json',
        },
        reviewedRecords: [
          {
            captureId: 'fred-meyer-verified-scope-live-receipt',
            appId: 'ext-kroger',
            storeId: 'kroger',
            verifiedScope: 'fred-meyer',
            pageKind: 'product',
            status: 'reviewed',
            summary: 'Fred Meyer reviewed',
            updatedAt: '2026-04-05T23:10:00.000Z',
            capturedAt: '2026-04-05T22:58:49.689Z',
            reviewedAt: '2026-04-05T23:10:00.000Z',
            reviewedBy: 'Shopflow QA',
            reviewSummary: 'Looks good.',
            screenshotLabel: 'page-2.png',
          },
        ],
        rejectedRecords: [],
        undecidedCapturedRecords: [],
        blockedCandidates: [],
      },
    });

    expect(packet.reviewedRecords).toEqual([
      expect.objectContaining({
        captureId: 'fred-meyer-verified-scope-live-receipt',
        status: 'reviewed',
      }),
    ]);
    expect(packet.rejectedRecords).toEqual([]);
    expect(packet.undecidedCapturedRecords).toEqual([
      expect.objectContaining({
        captureId: 'safeway-cancel-live-receipt',
        status: 'captured',
      }),
    ]);
  });

  it('builds a safe pending review-input template for remaining undecided captures', () => {
    const packet = createReviewInputTemplatePacket({
      reviewCandidateRecordsPacket: {
        checkedAt: '2026-04-05T22:58:49.695Z',
        sourceArtifacts: {
          operatorCapturePacketLatestPath: '/tmp/operator-capture-packet.json',
        },
        capturedRecords: [
          {
            captureId: 'fred-meyer-verified-scope-live-receipt',
            appId: 'ext-kroger',
            storeId: 'kroger',
            verifiedScope: 'fred-meyer',
            pageKind: 'product',
            status: 'captured',
            summary: 'Fred Meyer candidate',
            updatedAt: '2026-04-05T22:58:49.689Z',
            capturedAt: '2026-04-05T22:58:49.689Z',
            screenshotLabel: 'page-2.png',
            sourcePageUrl: 'https://www.fredmeyer.com/pr/weekly-digital-deals',
            sourcePageLabel: 'Weekly Digital Deals - Fred Meyer',
          },
          {
            captureId: 'temu-filter-live-receipt',
            appId: 'ext-temu',
            storeId: 'temu',
            verifiedScope: 'temu',
            pageKind: 'search',
            actionKind: 'filter_non_local_warehouse',
            status: 'captured',
            summary: 'Temu candidate',
            updatedAt: '2026-04-05T22:58:49.689Z',
            capturedAt: '2026-04-05T22:58:49.689Z',
            screenshotLabel: 'page-1.png',
            sourcePageUrl:
              'https://www.temu.com/search_result.html?search_key=warehouse',
            sourcePageLabel: 'Temu',
          },
        ],
        blockedCandidates: [
          {
            captureId: 'safeway-subscribe-live-receipt',
            appId: 'ext-albertsons',
            targetId: 'safeway-cart',
            status: 'blocked',
            classification: 'deep_link_unstable',
            blockerReason: 'deep_link_unstable',
          },
        ],
      },
      reviewedRecordsPacket: {
        checkedAt: '2026-04-05T23:09:55.332Z',
        sourceArtifacts: {
          reviewCandidateRecordsLatestPath: '/tmp/review-candidate-records.json',
          reviewInputPath: '/tmp/review-input.json',
        },
        reviewedRecords: [
          {
            captureId: 'fred-meyer-verified-scope-live-receipt',
            appId: 'ext-kroger',
            storeId: 'kroger',
            verifiedScope: 'fred-meyer',
            pageKind: 'product',
            status: 'reviewed',
            summary: 'Fred Meyer reviewed',
            updatedAt: '2026-04-05T23:10:00.000Z',
            capturedAt: '2026-04-05T22:58:49.689Z',
            reviewedAt: '2026-04-05T23:10:00.000Z',
            reviewedBy: 'Shopflow QA',
            reviewSummary: 'Looks good.',
            screenshotLabel: 'page-2.png',
          },
        ],
        rejectedRecords: [],
        undecidedCapturedRecords: [
          {
            captureId: 'temu-filter-live-receipt',
            appId: 'ext-temu',
            storeId: 'temu',
            verifiedScope: 'temu',
            pageKind: 'search',
            actionKind: 'filter_non_local_warehouse',
            status: 'captured',
            summary: 'Temu candidate',
            updatedAt: '2026-04-05T22:58:49.689Z',
            capturedAt: '2026-04-05T22:58:49.689Z',
            screenshotLabel: 'page-1.png',
            sourcePageUrl:
              'https://www.temu.com/search_result.html?search_key=warehouse',
            sourcePageLabel: 'Temu',
          },
        ],
        blockedCandidates: [
          {
            captureId: 'safeway-subscribe-live-receipt',
            appId: 'ext-albertsons',
            targetId: 'safeway-cart',
            status: 'blocked',
            classification: 'deep_link_unstable',
            blockerReason: 'deep_link_unstable',
          },
        ],
      },
    });

    expect(packet.alreadyReviewedCaptureIds).toEqual([
      'fred-meyer-verified-scope-live-receipt',
    ]);
    expect(packet.decisions).toEqual([
      expect.objectContaining({
        captureId: 'temu-filter-live-receipt',
        status: 'pending',
        requiresActionSnapshot: true,
        actionSnapshot: {
          attempted: null,
          succeeded: null,
          failed: null,
          skipped: null,
        },
      }),
    ]);
    expect(packet.blockedCandidates).toEqual([
      expect.objectContaining({
        captureId: 'safeway-subscribe-live-receipt',
      }),
    ]);
  });

  it('does not carry forward stale undecided captures that are no longer captured in the latest packet', () => {
    const packet = createReviewInputTemplatePacket({
      reviewCandidateRecordsPacket: {
        checkedAt: '2026-04-05T23:45:34.034Z',
        sourceArtifacts: {
          operatorCapturePacketLatestPath: '/tmp/operator-capture-packet.json',
        },
        capturedRecords: [
          {
            captureId: 'temu-filter-live-receipt',
            appId: 'ext-temu',
            storeId: 'temu',
            verifiedScope: 'temu',
            pageKind: 'search',
            actionKind: 'filter_non_local_warehouse',
            status: 'captured',
            summary: 'Temu candidate',
            updatedAt: '2026-04-05T23:45:32.092Z',
            capturedAt: '2026-04-05T23:45:32.092Z',
            screenshotLabel: 'page-1.png',
            sourcePageUrl:
              'https://www.temu.com/search_result.html?search_key=warehouse',
            sourcePageLabel: 'Temu',
          },
        ],
        blockedCandidates: [
          {
            captureId: 'safeway-cancel-live-receipt',
            appId: 'ext-albertsons',
            targetId: 'safeway-manage',
            status: 'blocked',
            classification: 'login_required',
            blockerReason: 'login_required',
          },
        ],
      },
      reviewedRecordsPacket: {
        checkedAt: '2026-04-05T23:31:56.175Z',
        sourceArtifacts: {
          reviewCandidateRecordsLatestPath: '/tmp/review-candidate-records.json',
          reviewInputPath: '/tmp/review-input.json',
        },
        reviewedRecords: [
          {
            captureId: 'fred-meyer-verified-scope-live-receipt',
            appId: 'ext-kroger',
            storeId: 'kroger',
            verifiedScope: 'fred-meyer',
            pageKind: 'product',
            status: 'reviewed',
            summary: 'Fred Meyer reviewed',
            updatedAt: '2026-04-05T23:10:00.000Z',
            capturedAt: '2026-04-05T22:59:59.811Z',
            reviewedAt: '2026-04-05T23:10:00.000Z',
            reviewedBy: 'Shopflow QA',
            reviewSummary: 'Looks good.',
            screenshotLabel: 'page-2.png',
          },
          {
            captureId: 'qfc-verified-scope-live-receipt',
            appId: 'ext-kroger',
            storeId: 'kroger',
            verifiedScope: 'qfc',
            pageKind: 'product',
            status: 'reviewed',
            summary: 'QFC reviewed',
            updatedAt: '2026-04-05T23:10:00.000Z',
            capturedAt: '2026-04-05T22:59:59.811Z',
            reviewedAt: '2026-04-05T23:10:00.000Z',
            reviewedBy: 'Shopflow QA',
            reviewSummary: 'Looks good.',
            screenshotLabel: 'page-3.png',
          },
        ],
        rejectedRecords: [],
        undecidedCapturedRecords: [
          {
            captureId: 'safeway-cancel-live-receipt',
            appId: 'ext-albertsons',
            storeId: 'albertsons',
            verifiedScope: 'safeway',
            pageKind: 'manage',
            actionKind: 'schedule_save_cancel',
            status: 'captured',
            summary: 'Old stale undecided Safeway cancel candidate',
            updatedAt: '2026-04-05T22:59:59.811Z',
            capturedAt: '2026-04-05T22:59:59.811Z',
            screenshotLabel: 'page-4.png',
            sourcePageUrl: 'https://www.safeway.com/schedule-and-save/manage',
            sourcePageLabel: 'Manage Schedule | safeway',
          },
        ],
        blockedCandidates: [
          {
            captureId: 'safeway-subscribe-live-receipt',
            appId: 'ext-albertsons',
            targetId: 'safeway-cart',
            status: 'blocked',
            classification: 'login_required',
            blockerReason: 'login_required',
          },
        ],
      },
    });

    expect(packet.alreadyReviewedCaptureIds).toEqual([
      'fred-meyer-verified-scope-live-receipt',
      'qfc-verified-scope-live-receipt',
    ]);
    expect(packet.decisions).toEqual([
      expect.objectContaining({
        captureId: 'temu-filter-live-receipt',
      }),
    ]);
    expect(packet.decisions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captureId: 'safeway-cancel-live-receipt',
        }),
      ])
    );
    expect(packet.blockedCandidates).toEqual([
      expect.objectContaining({
        captureId: 'safeway-cancel-live-receipt',
        blockerReason: 'login_required',
      }),
    ]);
  });

  it('reopens a newer captured record even when an older rejected verdict exists', () => {
    const packet = createReviewInputTemplatePacket({
      reviewCandidateRecordsPacket: {
        checkedAt: '2026-04-13T02:32:15.166Z',
        sourceArtifacts: {
          operatorCapturePacketLatestPath: '/tmp/operator-capture-packet.json',
        },
        capturedRecords: [
          {
            captureId: 'temu-filter-live-receipt',
            appId: 'ext-temu',
            storeId: 'temu',
            verifiedScope: 'temu',
            pageKind: 'search',
            actionKind: 'filter_non_local_warehouse',
            status: 'captured',
            summary: 'Temu recapture candidate',
            updatedAt: '2026-04-13T02:32:05.471Z',
            capturedAt: '2026-04-13T02:32:05.471Z',
            screenshotLabel: 'page-1.png',
            sourcePageUrl:
              'https://www.temu.com/search_result.html?search_key=warehouse',
            sourcePageLabel: 'Temu',
          },
        ],
        blockedCandidates: [
          {
            captureId: 'safeway-subscribe-live-receipt',
            appId: 'ext-albertsons',
            targetId: 'safeway-cart',
            status: 'blocked',
            classification: 'login_required',
            blockerReason: 'login_required',
          },
        ],
      },
      reviewedRecordsPacket: {
        checkedAt: '2026-04-08T00:12:39.988Z',
        sourceArtifacts: {
          reviewCandidateRecordsLatestPath: '/tmp/review-candidate-records.json',
          reviewInputPath: '/tmp/review-input.json',
        },
        reviewedRecords: [
          {
            captureId: 'fred-meyer-verified-scope-live-receipt',
            appId: 'ext-kroger',
            storeId: 'kroger',
            verifiedScope: 'fred-meyer',
            pageKind: 'product',
            status: 'reviewed',
            summary: 'Fred Meyer reviewed',
            updatedAt: '2026-04-08T00:12:39.988Z',
            capturedAt: '2026-04-08T00:11:39.988Z',
            reviewedAt: '2026-04-08T00:12:39.988Z',
            reviewedBy: 'Shopflow QA',
            reviewSummary: 'Looks good.',
            screenshotLabel: 'page-5.png',
          },
        ],
        rejectedRecords: [
          {
            captureId: 'temu-filter-live-receipt',
            appId: 'ext-temu',
            storeId: 'temu',
            verifiedScope: 'temu',
            pageKind: 'search',
            actionKind: 'filter_non_local_warehouse',
            status: 'rejected',
            summary: 'Current page does not expose the warehouse filter control.',
            updatedAt: '2026-04-08T00:12:39.988Z',
            capturedAt: '2026-04-08T00:11:39.988Z',
            reviewedAt: '2026-04-08T00:12:39.988Z',
            reviewedBy: 'Shopflow QA',
            reviewNotes:
              'Rejected because the current live page does not show a visible warehouse filter control.',
            screenshotLabel: 'page-1.png',
            sourcePageUrl:
              'https://www.temu.com/search_result.html?search_key=warehouse',
            sourcePageLabel: 'Temu',
          },
        ],
        undecidedCapturedRecords: [],
        blockedCandidates: [
          {
            captureId: 'safeway-subscribe-live-receipt',
            appId: 'ext-albertsons',
            targetId: 'safeway-cart',
            status: 'blocked',
            classification: 'deep_link_unstable',
            blockerReason: 'deep_link_unstable',
          },
        ],
      },
    });

    expect(packet.alreadyReviewedCaptureIds).toEqual([
      'fred-meyer-verified-scope-live-receipt',
    ]);
    expect(packet.alreadyRejectedCaptureIds).toEqual([]);
    expect(packet.decisions).toEqual([
      expect.objectContaining({
        captureId: 'temu-filter-live-receipt',
        status: 'pending',
        requiresActionSnapshot: true,
      }),
    ]);
    expect(packet.blockedCandidates).toEqual([
      expect.objectContaining({
        captureId: 'safeway-subscribe-live-receipt',
        blockerReason: 'login_required',
      }),
    ]);
  });

  it('keeps already rejected captures out of the next pending review template', () => {
    const packet = createReviewInputTemplatePacket({
      reviewCandidateRecordsPacket: {
        checkedAt: '2026-04-06T00:12:00.000Z',
        sourceArtifacts: {
          operatorCapturePacketLatestPath: '/tmp/operator-capture-packet.json',
        },
        capturedRecords: [
          {
            captureId: 'fred-meyer-verified-scope-live-receipt',
            appId: 'ext-kroger',
            storeId: 'kroger',
            verifiedScope: 'fred-meyer',
            pageKind: 'product',
            status: 'captured',
            summary: 'Fred Meyer candidate',
            updatedAt: '2026-04-06T00:09:00.000Z',
            capturedAt: '2026-04-06T00:09:00.000Z',
            screenshotLabel: 'page-2.png',
            sourcePageUrl: 'https://www.fredmeyer.com/pr/weekly-digital-deals',
            sourcePageLabel: 'Weekly Digital Deals - Fred Meyer',
          },
          {
            captureId: 'qfc-verified-scope-live-receipt',
            appId: 'ext-kroger',
            storeId: 'kroger',
            verifiedScope: 'qfc',
            pageKind: 'product',
            status: 'captured',
            summary: 'QFC candidate',
            updatedAt: '2026-04-06T00:09:00.000Z',
            capturedAt: '2026-04-06T00:09:00.000Z',
            screenshotLabel: 'page-3.png',
            sourcePageUrl: 'https://www.qfc.com/search?query=kombucha',
            sourcePageLabel: 'Search Products - QFC',
          },
        ],
        blockedCandidates: [],
      },
      reviewedRecordsPacket: {
        checkedAt: '2026-04-06T00:10:00.000Z',
        sourceArtifacts: {
          reviewCandidateRecordsLatestPath: '/tmp/review-candidate-records.json',
          reviewInputPath: '/tmp/review-input.json',
        },
        reviewedRecords: [],
        rejectedRecords: [
          {
            captureId: 'fred-meyer-verified-scope-live-receipt',
            appId: 'ext-kroger',
            storeId: 'kroger',
            verifiedScope: 'fred-meyer',
            pageKind: 'product',
            status: 'rejected',
            summary: 'Rejected because the screenshot does not match the page.',
            updatedAt: '2026-04-06T00:10:00.000Z',
            capturedAt: '2026-04-06T00:09:00.000Z',
            reviewedAt: '2026-04-06T00:10:00.000Z',
            reviewedBy: 'Shopflow QA',
            reviewNotes: 'Screenshot drifted away from the verified-scope page.',
            screenshotLabel: 'page-2.png',
          },
        ],
        undecidedCapturedRecords: [],
        blockedCandidates: [],
      },
    });

    expect(packet.alreadyRejectedCaptureIds).toEqual([
      'fred-meyer-verified-scope-live-receipt',
    ]);
    expect(packet.decisions).toEqual([
      expect.objectContaining({
        captureId: 'qfc-verified-scope-live-receipt',
      }),
    ]);
    expect(packet.decisions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captureId: 'fred-meyer-verified-scope-live-receipt',
        }),
      ])
    );
  });

  it('parses the explicit review-input argument and rejects malformed CLI input', () => {
    expect(
      parseReviewedRecordsArgs(['--review-input', './tmp/review-input.json'])
    ).toEqual({
      reviewInputPath: expect.stringContaining('tmp/review-input.json'),
    });

    expect(() => parseReviewedRecordsArgs([])).toThrow(/missing --review-input/i);
    expect(() => parseReviewedRecordsArgs(['--wat'])).toThrow(/unknown argument/i);
  });

  it('reads review input JSON from disk without changing payload shape', () => {
    const tempDirectory = mkdtempSync(join(tmpdir(), 'shopflow-reviewed-records-'));
    const jsonPath = join(tempDirectory, 'review-input.json');

    try {
      writeFileSync(
        jsonPath,
        `${JSON.stringify(
          {
            decisions: [
              {
                captureId: 'fred-meyer-verified-scope-live-receipt',
                status: 'reviewed',
                reviewedBy: 'Shopflow QA',
                reviewSummary: 'Looks good.',
              },
            ],
          },
          null,
          2
        )}\n`
      );

      expect(
        readJsonFile<{ decisions: Array<{ captureId: string }> }>(jsonPath)
      ).toMatchObject({
        decisions: [
          {
            captureId: 'fred-meyer-verified-scope-live-receipt',
          },
        ],
      });
    } finally {
      rmSync(tempDirectory, { recursive: true, force: true });
    }
  });
});
