import { describe, expect, it } from 'vitest';
import {
  appDefinition,
  suiteCatalog,
  suiteEvidenceBlockers,
  suiteStatusBoard,
  suiteVerifiedScopeNavigator,
} from '../../apps/ext-shopping-suite/src/app-definition';
import { createSuiteDetailModel } from '../../packages/core/src/suite-detail-model';
import {
  getLiveReceiptBlockerSummaries,
  publicClaimBoundaries,
  storeCatalog,
} from '@shopflow/contracts';

describe('shopping-suite internal alpha contract', () => {
  it('stays internal-only and avoids becoming a second logic plane', () => {
    expect(appDefinition.mode).toBe('internal-alpha');
    expect(appDefinition.guardrails).toContain('No public claim');
    expect(appDefinition.guardrails).toContain('No second logic plane');
  });

  it('acts as a capability navigator rather than a replacement store app', () => {
    expect(suiteCatalog.find((item) => item.appId === 'ext-albertsons')).toBeDefined();
    expect(suiteCatalog.find((item) => item.appId === 'ext-temu')).toBeDefined();
    expect(
      suiteCatalog.some((item) => item.state === 'repo-verified-claim-gated')
    ).toBe(true);
  });

  it('derives rollout titles and waves from shared contract truth instead of inventing a second catalog', () => {
    const albertsons = suiteCatalog.find((item) => item.appId === 'ext-albertsons');
    const kroger = suiteCatalog.find((item) => item.appId === 'ext-kroger');

    expect(albertsons?.title).toBe(publicClaimBoundaries.albertsons.publicName);
    expect(albertsons?.wave).toBe('Wave 1');
    expect(kroger?.title).toBe(publicClaimBoundaries.kroger.publicName);
    expect(kroger?.wave).toBe('Wave 3');
    expect(suiteCatalog).toHaveLength(Object.keys(storeCatalog).length);
  });

  it('keeps claim-gating evidence requirements explicit instead of hiding them behind launch copy', () => {
    expect(suiteEvidenceBlockers).toHaveLength(
      getLiveReceiptBlockerSummaries().length
    );
    expect(suiteEvidenceBlockers[0]?.title).toMatch(/live receipt/i);
    expect(
      suiteEvidenceBlockers.find((item) => item.appId === 'ext-kroger')?.captureIds
    ).toHaveLength(2);
  });

  it('derives claim-readiness counts and verified-scope navigation from shared truth', () => {
    expect(
      suiteStatusBoard.find((item) => item.id === 'repo-verified-claim-gated')
        ?.count
    ).toBe(3);
    expect(suiteVerifiedScopeNavigator).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          publicName: publicClaimBoundaries.albertsons.publicName,
          verifiedScopeCopy: 'Currently verified on Safeway.',
        }),
        expect.objectContaining({
          publicName: publicClaimBoundaries.kroger.publicName,
          verifiedScopeCopy: 'Currently verified on Fred Meyer + QFC.',
        }),
      ])
    );
  });

  it('derives drill-down detail from shared runtime truth instead of inventing a second suite status plane', () => {
    const albertsons = suiteCatalog.find(
      (item) => item.appId === 'ext-albertsons'
    )!;

    const detail = createSuiteDetailModel(albertsons, {
      detection: {
        appId: 'ext-albertsons',
        url: 'https://www.safeway.com/shop/cart',
        updatedAt: '2026-03-30T19:00:00.000Z',
        detection: {
          storeId: 'albertsons',
          verifiedScopes: ['safeway'],
          matchedHost: 'www.safeway.com',
          pageKind: 'cart',
          confidence: 0.95,
          capabilityStates: [
            { capability: 'run_action', status: 'ready' },
            { capability: 'export_data', status: 'blocked' },
          ],
        },
      },
      recentActivities: [
        {
          id: 'ext-albertsons:https://www.safeway.com/shop/cart',
          appId: 'ext-albertsons',
          label: 'www.safeway.com · cart',
          summary: '1 ready capability on the latest detected page.',
          timestampLabel: '7:00 PM',
          href: 'https://www.safeway.com/shop/cart',
        },
      ],
      latestOutput: {
        appId: 'ext-albertsons',
        storeId: 'albertsons',
        kind: 'product',
        pageUrl: 'https://www.safeway.com/shop/product-details/grapes',
        capturedAt: '2026-03-30T18:58:00.000Z',
        headline: 'Safeway Green Grapes',
        summary: 'Captured product details with price $4.99.',
        previewLines: ['Price: $4.99'],
      },
      evidenceRecords: [
        {
          captureId: 'safeway-subscribe-live-receipt',
          appId: 'ext-albertsons',
          storeId: 'albertsons',
          verifiedScope: 'safeway',
          pageKind: 'cart',
          actionKind: 'schedule_save_subscribe',
          status: 'captured',
          summary:
            'Safeway subscribe live receipt bundle is captured and waiting for explicit review.',
          updatedAt: '2026-03-30T19:00:00.000Z',
          capturedAt: '2026-03-30T19:00:00.000Z',
          screenshotLabel: 'safeway-cart-proof.png',
        },
      ],
    });

    expect(detail.latestDetection).toBe('www.safeway.com · cart');
    expect(detail.latestActivity).toContain('www.safeway.com · cart');
    expect(detail.latestOutput).toContain('Safeway Green Grapes');
    expect(detail.latestOutputHref).toBe(
      'https://www.safeway.com/shop/product-details/grapes'
    );
    expect(detail.evidenceQueue).toContain('waiting for review');
    expect(detail.latestActivityHref).toBe('https://www.safeway.com/shop/cart');
    expect(detail.routeLabel).toBe('Review waiting evidence on source page');
    expect(detail.routeHref).toBe('https://www.safeway.com/shop/cart');
    expect(detail.priorityQueueItem).toMatchObject({
      title: 'Safeway subscribe live receipt',
      operatorPathLabel: 'Run explicit review',
      actionLabel: 'Review on latest source page',
      href: 'https://www.safeway.com/shop/cart',
    });
    expect(detail.evidenceItems[0]).toMatchObject({
      title: 'Safeway subscribe live receipt',
      statusLabel: 'Captured, pending review',
    });
    expect(detail.evidenceSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Evidence overview',
          count: 1,
        }),
        expect.objectContaining({
          title: 'Review queue',
          count: 1,
        }),
      ])
    );
    expect(detail.nextStep).toContain('Reconfirm repo verification');
  });

  it('falls back to the store-specific default host route when no latest activity route exists yet', () => {
    const amazon = suiteCatalog.find((item) => item.appId === 'ext-amazon')!;

    const detail = createSuiteDetailModel(amazon, {
      detection: undefined,
      recentActivities: [],
      evidenceRecords: [],
    });

    expect(detail.routeLabel).toBe('Open Amazon home');
    expect(detail.routeHref).toBe('https://www.amazon.com/');
    expect(detail.routeSummary).toContain(
      'No fresh page context exists yet. Open Amazon home'
    );
    expect(detail.evidenceSections).toHaveLength(0);
    expect(detail.priorityQueueItem).toBeUndefined();
    expect(detail.latestOutput).toBe(
      'No captured output has been recorded for this app yet.'
    );
  });
});
