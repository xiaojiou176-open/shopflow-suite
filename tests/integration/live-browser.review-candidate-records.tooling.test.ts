import { describe, expect, it } from 'vitest';
import { createReviewCandidateRecordsPacket } from '../../tooling/live/write-review-candidate-records';

describe('live browser review candidate records tooling', () => {
  it('promotes capture-ready candidates into captured records without promoting blocked candidates', () => {
    const packet = createReviewCandidateRecordsPacket({
      operatorCapturePacket: {
        checkedAt: '2026-04-05T22:30:05.118Z',
        sourceArtifacts: {},
        captureCandidates: [
          {
            captureId: 'safeway-subscribe-live-receipt',
            appId: 'ext-albertsons',
            status: 'blocked',
            classification: 'deep_link_unstable',
            finalUrl: 'https://www.safeway.com/schedule-and-save/manage',
            title: 'Manage Schedule | safeway',
            screenshotLabel: 'page-1.png',
            screenshotPath: '/tmp/page-1.png',
            blockerReason: 'deep_link_unstable',
          },
          {
            captureId: 'safeway-cancel-live-receipt',
            appId: 'ext-albertsons',
            status: 'capture-ready',
            classification: 'session_visible',
            finalUrl: 'https://www.safeway.com/schedule-and-save/manage',
            title: 'Manage Schedule | safeway',
            screenshotLabel: 'page-1.png',
            screenshotPath: '/tmp/page-1.png',
          },
          {
            captureId: 'fred-meyer-verified-scope-live-receipt',
            appId: 'ext-kroger',
            status: 'capture-ready',
            classification: 'session_visible',
            finalUrl: 'https://www.fredmeyer.com/pr/weekly-digital-deals',
            title: 'Weekly Digital Deals - Fred Meyer',
            screenshotLabel: 'page-4.png',
            screenshotPath: '/tmp/page-4.png',
          },
        ],
      },
    });

    expect(packet.capturedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captureId: 'safeway-cancel-live-receipt',
          status: 'captured',
          screenshotLabel: 'page-1.png',
          sourcePageUrl: 'https://www.safeway.com/schedule-and-save/manage',
          sourcePageLabel: 'Manage Schedule | safeway',
          capturedAt: '2026-04-05T22:30:05.118Z',
        }),
        expect.objectContaining({
          captureId: 'fred-meyer-verified-scope-live-receipt',
          status: 'captured',
          screenshotLabel: 'page-4.png',
          sourcePageUrl: 'https://www.fredmeyer.com/pr/weekly-digital-deals',
          sourcePageLabel: 'Weekly Digital Deals - Fred Meyer',
          capturedAt: '2026-04-05T22:30:05.118Z',
        }),
      ])
    );

    expect(packet.blockedCandidates).toEqual([
      expect.objectContaining({
        captureId: 'safeway-subscribe-live-receipt',
        blockerReason: 'deep_link_unstable',
      }),
    ]);
  });

  it('skips screenshot-less recaptures when the same captureId is already finalized', () => {
    const packet = createReviewCandidateRecordsPacket({
      operatorCapturePacket: {
        checkedAt: '2026-04-13T02:59:19.519Z',
        sourceArtifacts: {},
        captureCandidates: [
          {
            captureId: 'fred-meyer-verified-scope-live-receipt',
            appId: 'ext-kroger',
            status: 'capture-ready',
            classification: 'session_visible',
            finalUrl: 'https://www.fredmeyer.com/pr/weekly-digital-deals',
            title: 'www.fredmeyer.com',
          },
          {
            captureId: 'qfc-verified-scope-live-receipt',
            appId: 'ext-kroger',
            status: 'capture-ready',
            classification: 'session_visible',
            finalUrl: 'https://www.qfc.com/search?query=kombucha',
            title: 'www.qfc.com',
          },
        ],
      },
      reviewedRecordsPacket: {
        reviewedRecords: [
          { captureId: 'fred-meyer-verified-scope-live-receipt' },
          { captureId: 'qfc-verified-scope-live-receipt' },
        ],
        rejectedRecords: [],
      },
    });

    expect(packet.capturedRecords).toEqual([]);
    expect(packet.blockedCandidates).toEqual([]);
  });

  it('demotes screenshot-less new capture-ready candidates into blocked candidates', () => {
    const packet = createReviewCandidateRecordsPacket({
      operatorCapturePacket: {
        checkedAt: '2026-04-13T02:59:19.519Z',
        sourceArtifacts: {},
        captureCandidates: [
          {
            captureId: 'safeway-subscribe-live-receipt',
            appId: 'ext-albertsons',
            status: 'capture-ready',
            classification: 'session_visible',
            finalUrl: 'https://www.safeway.com/shop/cart',
            title: 'www.safeway.com',
            blockerReason: 'login_required',
          },
        ],
      },
      reviewedRecordsPacket: {
        reviewedRecords: [],
        rejectedRecords: [],
      },
    });

    expect(packet.capturedRecords).toEqual([]);
    expect(packet.blockedCandidates).toEqual([
      expect.objectContaining({
        captureId: 'safeway-subscribe-live-receipt',
        status: 'blocked',
        blockerReason: 'login_required',
      }),
    ]);
  });
});
