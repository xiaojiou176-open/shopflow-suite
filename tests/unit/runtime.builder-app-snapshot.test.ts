// @vitest-environment jsdom

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  builderAppSnapshotSchema,
  builderSurfaceBoundary,
  createBuilderAppSnapshot,
} from '../../packages/runtime/src/builder-app-snapshot';
import { repoRoot } from '../support/repo-paths';

describe('builder app snapshot', () => {
  it('creates a truthful read-only builder snapshot from existing runtime truth', () => {
    const snapshot = createBuilderAppSnapshot({
      appId: 'ext-albertsons',
      detection: {
        appId: 'ext-albertsons',
        url: 'https://www.safeway.com/shop/cart',
        updatedAt: '2026-04-01T08:00:00.000Z',
        detection: {
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
      },
      latestOutput: {
        appId: 'ext-albertsons',
        storeId: 'albertsons',
        kind: 'product',
        pageUrl: 'https://www.safeway.com/shop/product-details/grapes',
        capturedAt: '2026-04-01T07:58:00.000Z',
        headline: 'Safeway Green Grapes',
        summary: 'Captured product details with price $4.99.',
        previewLines: ['Price: $4.99'],
      },
      recentActivities: [
        {
          id: 'ext-albertsons:https://www.safeway.com/shop/cart',
          appId: 'ext-albertsons',
          label: 'www.safeway.com · cart',
          summary: '1 ready capability on the latest detected page.',
          timestampLabel: '8:00 AM',
          href: 'https://www.safeway.com/shop/cart',
        },
      ],
      evidenceQueue: {
        appId: 'ext-albertsons',
        totalCount: 2,
        needsCaptureCount: 1,
        captureCount: 0,
        recaptureCount: 1,
        missingCount: 1,
        captureInProgressCount: 0,
        reviewPendingCount: 0,
        reviewedCount: 0,
        rejectedCount: 1,
        expiredCount: 0,
        blockerSummary:
          'Review bundle is complete; reviewed live evidence already includes rejected captures, and the remaining open gate is external capture/review on unresolved live proof.',
        nextCaptureId: 'safeway-subscribe-live-receipt',
        nextStatus: 'missing-live-receipt',
        nextOperatorPath: 'capture',
        nextRequirementTitle: 'Safeway subscribe live receipt',
        nextStep:
          'Keep wording claim-gated. Reviewed live evidence already includes rejected captures for safeway-cancel-live-receipt, and external capture/review is still required for safeway-subscribe-live-receipt.',
        nextSourcePageUrl: 'https://www.safeway.com/shop/cart',
        nextSourcePageLabel: 'Open current evidence route',
        nextSourceRouteLabel: 'Open current evidence route',
      },
    });

    expect(snapshot).toMatchObject({
      surfaceId: 'builder-app-snapshot',
      schemaVersion: 'shopflow.builder-app-snapshot.v1',
      readOnly: true,
      appId: 'ext-albertsons',
      publicName: 'Shopflow for Albertsons Family',
      claimState: 'repo-verified',
      wave: 'wave-1',
      tier: 'capability-heavy-product',
      verifiedScopeCopy: 'Currently verified on Safeway.',
      bestRoute: {
        origin: 'evidence-source',
        label: 'Open current evidence route',
        href: 'https://www.safeway.com/shop/cart',
      },
      builderSurfaceBoundary,
    });
  });

  it('parses the checked-in builder example payload', () => {
    const expected = createBuilderAppSnapshot({
      appId: 'ext-albertsons',
      detection: {
        appId: 'ext-albertsons',
        url: 'https://www.safeway.com/shop/cart',
        updatedAt: '2026-04-01T08:00:00.000Z',
        detection: {
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
      },
      latestOutput: {
        appId: 'ext-albertsons',
        storeId: 'albertsons',
        kind: 'product',
        pageUrl: 'https://www.safeway.com/shop/product-details/grapes',
        capturedAt: '2026-04-01T07:58:00.000Z',
        headline: 'Safeway Green Grapes',
        summary: 'Captured product details with price $4.99.',
        previewLines: ['Price: $4.99'],
      },
      recentActivities: [
        {
          id: 'ext-albertsons:https://www.safeway.com/shop/cart',
          appId: 'ext-albertsons',
          label: 'www.safeway.com · cart',
          summary: '1 ready capability on the latest detected page.',
          timestampLabel: '8:00 AM',
          href: 'https://www.safeway.com/shop/cart',
        },
      ],
      evidenceQueue: {
        appId: 'ext-albertsons',
        totalCount: 2,
        needsCaptureCount: 1,
        captureCount: 0,
        recaptureCount: 1,
        missingCount: 1,
        captureInProgressCount: 0,
        reviewPendingCount: 0,
        reviewedCount: 0,
        rejectedCount: 1,
        expiredCount: 0,
        blockerSummary:
          'Review bundle is complete; reviewed live evidence already includes rejected captures, and the remaining open gate is external capture/review on unresolved live proof.',
        nextCaptureId: 'safeway-subscribe-live-receipt',
        nextStatus: 'missing-live-receipt',
        nextOperatorPath: 'capture',
        nextRequirementTitle: 'Safeway subscribe live receipt',
        nextStep:
          'Keep wording claim-gated. Reviewed live evidence already includes rejected captures for safeway-cancel-live-receipt, and external capture/review is still required for safeway-subscribe-live-receipt.',
        nextSourcePageUrl: 'https://www.safeway.com/shop/cart',
        nextSourcePageLabel: 'Open current evidence route',
        nextSourceRouteLabel: 'Open current evidence route',
      },
    });

    const example = JSON.parse(
      readFileSync(
        resolve(repoRoot, 'docs/ecosystem/examples/builder-app-snapshot.ext-albertsons.json'),
        'utf8'
      )
    );

    expect(builderAppSnapshotSchema.parse(example)).toEqual(expected);
  });
});
