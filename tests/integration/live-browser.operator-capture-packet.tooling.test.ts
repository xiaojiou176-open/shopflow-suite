import { describe, expect, it } from 'vitest';
import { createOperatorCapturePacket } from '../../tooling/live/write-operator-capture-packet';

describe('live browser operator capture packet tooling', () => {
  it('marks session-visible targets as capture-ready and unstable targets as blocked', () => {
    const packet = createOperatorCapturePacket({
      diagnoseReport: {
        probe: {
          checkedAt: '2026-04-05T22:17:25.344Z',
          sessionHealth: { safeway: 'healthy' },
          captureTargetState: { safeway: 'deep_link_unstable' },
          deepLinkState: { safeway: 'unstable' },
          observedTabs: [
            {
              url: 'https://www.safeway.com/schedule-and-save/manage',
              title: 'Manage Schedule | safeway',
            },
            {
              url: 'https://www.temu.com/search_result.html?search_key=warehouse',
              title: 'Temu',
            },
            {
              url: 'https://www.qfc.com/search?query=kombucha',
              title: 'Search Products - QFC',
            },
            {
              url: 'https://www.fredmeyer.com/pr/weekly-digital-deals',
              title: 'Weekly Digital Deals - Fred Meyer',
            },
          ],
          targets: [
            {
              id: 'safeway-home',
              label: 'Safeway home',
              requestedUrl: 'https://www.safeway.com/',
              finalUrl: 'https://www.safeway.com/schedule-and-save/manage',
              title: 'Manage Schedule | safeway',
              classification: 'session_visible',
              source: 'cdp-target',
              captureIds: [],
            },
            {
              id: 'safeway-cart',
              label: 'Safeway cart',
              requestedUrl: 'https://www.safeway.com/shop/cart',
              finalUrl: 'https://www.safeway.com/schedule-and-save/manage',
              title: 'Manage Schedule | safeway',
              classification: 'deep_link_unstable',
              source: 'cdp-target',
              captureIds: ['safeway-subscribe-live-receipt'],
            },
            {
              id: 'safeway-manage',
              label: 'Safeway Schedule & Save manage',
              requestedUrl: 'https://www.safeway.com/schedule-and-save/manage',
              finalUrl: 'https://www.safeway.com/schedule-and-save/manage',
              title: 'Manage Schedule | safeway',
              classification: 'session_visible',
              source: 'cdp-target',
              captureIds: ['safeway-cancel-live-receipt'],
            },
            {
              id: 'fred-meyer-coupons',
              label: 'Fred Meyer coupons',
              requestedUrl: 'https://www.fredmeyer.com/pr/weekly-digital-deals',
              finalUrl: 'https://www.fredmeyer.com/pr/weekly-digital-deals',
              title: 'Weekly Digital Deals - Fred Meyer',
              classification: 'session_visible',
              source: 'cdp-target',
              captureIds: ['fred-meyer-verified-scope-live-receipt'],
            },
            {
              id: 'qfc-search',
              label: 'QFC search',
              requestedUrl: 'https://www.qfc.com/search?query=kombucha',
              finalUrl: 'https://www.qfc.com/search?query=kombucha',
              title: 'Search Products - QFC',
              classification: 'session_visible',
              source: 'cdp-target',
              captureIds: ['qfc-verified-scope-live-receipt'],
            },
            {
              id: 'temu-search',
              label: 'Temu warehouse search',
              requestedUrl: 'https://www.temu.com/search_result.html?search_key=warehouse',
              finalUrl: 'https://www.temu.com/search_result.html?search_key=warehouse',
              title: 'Temu',
              classification: 'session_visible',
              source: 'cdp-target',
              captureIds: ['temu-filter-live-receipt'],
            },
          ],
        },
        traceBundle: {
          bundleDirectory:
            '.runtime-cache/live-browser/bundles/trace-2026-04-05T22-17-25-344Z',
          summaryPath:
            '.runtime-cache/live-browser/bundles/trace-2026-04-05T22-17-25-344Z/summary.json',
          chromeTabsPath: '',
          chromeProcessesPath: '',
          cdpSummaryPath: '',
          consolePath: '',
          pageErrorsPath: '',
          requestFailedPath: '',
          networkPath: '',
          screenshotsDirectory:
            '/tmp/shopflow-live/screenshots',
          traceMode: 'cdp-passive',
          pageCount: 4,
        },
      } as never,
      screenshotsDirectory: '/tmp/shopflow-live/screenshots',
    });

    expect(packet.safeway).toEqual({
      sessionHealth: 'healthy',
      captureTargetState: 'deep_link_unstable',
      deepLinkState: 'unstable',
    });

    expect(packet.captureCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captureId: 'safeway-subscribe-live-receipt',
          targetId: 'safeway-cart',
          status: 'blocked',
          blockerReason: 'deep_link_unstable',
          screenshotLabel: 'page-1.png',
        }),
        expect.objectContaining({
          captureId: 'safeway-cancel-live-receipt',
          targetId: 'safeway-manage',
          status: 'capture-ready',
          screenshotLabel: 'page-1.png',
        }),
        expect.objectContaining({
          captureId: 'temu-filter-live-receipt',
          targetId: 'temu-search',
          status: 'capture-ready',
          screenshotLabel: 'page-2.png',
        }),
        expect.objectContaining({
          captureId: 'qfc-verified-scope-live-receipt',
          targetId: 'qfc-search',
          status: 'capture-ready',
          screenshotLabel: 'page-3.png',
        }),
        expect.objectContaining({
          captureId: 'fred-meyer-verified-scope-live-receipt',
          targetId: 'fred-meyer-coupons',
          status: 'capture-ready',
          screenshotLabel: 'page-4.png',
        }),
      ])
    );
  });

  it('prefers screenshot manifest entries over observed-tab index order when mapping screenshots', () => {
    const packet = createOperatorCapturePacket({
      diagnoseReport: {
        probe: {
          checkedAt: '2026-04-05T22:17:25.344Z',
          sessionHealth: { safeway: 'healthy' },
          captureTargetState: { safeway: 'deep_link_unstable' },
          deepLinkState: { safeway: 'unstable' },
          observedTabs: [
            {
              url: 'https://www.safeway.com/schedule-and-save/manage',
              title: 'Manage Schedule | safeway',
            },
            {
              url: 'https://www.temu.com/search_result.html?search_key=warehouse',
              title: 'Temu',
            },
          ],
          targets: [
            {
              id: 'temu-search',
              label: 'Temu warehouse search',
              requestedUrl:
                'https://www.temu.com/search_result.html?search_key=warehouse',
              finalUrl:
                'https://www.temu.com/search_result.html?search_key=warehouse',
              title: 'Temu',
              classification: 'session_visible',
              source: 'cdp-target',
              captureIds: ['temu-filter-live-receipt'],
            },
          ],
        },
        traceBundle: {
          bundleDirectory:
            '.runtime-cache/live-browser/bundles/trace-2026-04-05T22-17-25-344Z',
          summaryPath:
            '.runtime-cache/live-browser/bundles/trace-2026-04-05T22-17-25-344Z/summary.json',
          chromeTabsPath: '',
          chromeProcessesPath: '',
          cdpSummaryPath: '',
          screenshotManifestPath:
            '.runtime-cache/live-browser/bundles/trace-2026-04-05T22-17-25-344Z/screenshots.json',
          consolePath: '',
          pageErrorsPath: '',
          requestFailedPath: '',
          networkPath: '',
          screenshotsDirectory: '/tmp/shopflow-live/screenshots',
          traceMode: 'cdp-passive',
          pageCount: 2,
        },
      } as never,
      screenshotsDirectory: '/tmp/shopflow-live/screenshots',
      screenshotEntries: [
        {
          pageUrl: 'https://www.temu.com/search_result.html?search_key=warehouse',
          title: 'Temu',
          screenshotLabel: 'page-9.png',
          screenshotPath: '/tmp/shopflow-live/screenshots/page-9.png',
        },
      ],
    });

    expect(packet.captureCandidates).toEqual([
      expect.objectContaining({
        captureId: 'temu-filter-live-receipt',
        screenshotLabel: 'page-9.png',
        screenshotPath: '/tmp/shopflow-live/screenshots/page-9.png',
      }),
    ]);
  });

  it('does not fall back to an ambiguous chrome-error screenshot when duplicate titles exist', () => {
    const packet = createOperatorCapturePacket({
      diagnoseReport: {
        probe: {
          checkedAt: '2026-04-13T02:31:52.598Z',
          sessionHealth: { safeway: 'login_required' },
          captureTargetState: { safeway: 'login_required' },
          deepLinkState: { safeway: 'unknown' },
          observedTabs: [
            {
              url: 'https://www.safeway.com/shop/cart',
              title: 'www.safeway.com',
            },
            {
              url: 'chrome-error://chromewebdata/',
              title: 'www.safeway.com',
            },
          ],
          targets: [
            {
              id: 'safeway-cart',
              label: 'Safeway cart',
              requestedUrl: 'https://www.safeway.com/shop/cart',
              finalUrl: 'https://www.safeway.com/shop/cart',
              title: 'www.safeway.com',
              classification: 'login_required',
              source: 'cdp-target',
              captureIds: ['safeway-subscribe-live-receipt'],
            },
          ],
        },
        traceBundle: {
          bundleDirectory:
            '.runtime-cache/live-browser/bundles/trace-2026-04-13T02-31-52-598Z',
          summaryPath:
            '.runtime-cache/live-browser/bundles/trace-2026-04-13T02-31-52-598Z/summary.json',
          chromeTabsPath: '',
          chromeProcessesPath: '',
          cdpSummaryPath: '',
          screenshotManifestPath:
            '.runtime-cache/live-browser/bundles/trace-2026-04-13T02-31-52-598Z/screenshots.json',
          consolePath: '',
          pageErrorsPath: '',
          requestFailedPath: '',
          networkPath: '',
          screenshotsDirectory: '/tmp/shopflow-live/screenshots',
          traceMode: 'cdp-passive',
          pageCount: 2,
        },
      } as never,
      screenshotsDirectory: '/tmp/shopflow-live/screenshots',
      screenshotEntries: [
        {
          pageUrl: 'chrome-error://chromewebdata/',
          title: 'www.safeway.com',
          screenshotLabel: 'page-6.png',
          screenshotPath: '/tmp/shopflow-live/screenshots/page-6.png',
        },
        {
          pageUrl: 'https://www.safeway.com/',
          title: 'www.safeway.com',
          screenshotLabel: 'page-3.png',
          screenshotPath: '/tmp/shopflow-live/screenshots/page-3.png',
        },
      ],
    });

    expect(packet.captureCandidates).toEqual([
      expect.objectContaining({
        captureId: 'safeway-subscribe-live-receipt',
        screenshotLabel: undefined,
        screenshotPath: undefined,
        blockerReason: 'login_required',
      }),
    ]);
  });

  it('matches screenshot manifest entries even when the final URL still carries query params', () => {
    const packet = createOperatorCapturePacket({
      diagnoseReport: {
        probe: {
          checkedAt: '2026-04-05T22:44:53.138Z',
          sessionHealth: { safeway: 'healthy' },
          captureTargetState: { safeway: 'deep_link_unstable' },
          deepLinkState: { safeway: 'unstable' },
          observedTabs: [],
          targets: [
            {
              id: 'qfc-search',
              label: 'QFC search',
              requestedUrl: 'https://www.qfc.com/search?query=kombucha',
              finalUrl: 'https://www.qfc.com/search?query=kombucha',
              title: 'Search Products - QFC',
              classification: 'session_visible',
              source: 'cdp-target',
              captureIds: ['qfc-verified-scope-live-receipt'],
            },
            {
              id: 'temu-search',
              label: 'Temu warehouse search',
              requestedUrl:
                'https://www.temu.com/search_result.html?search_key=warehouse',
              finalUrl:
                'https://www.temu.com/search_result.html?search_key=warehouse',
              title: 'Temu',
              classification: 'session_visible',
              source: 'cdp-target',
              captureIds: ['temu-filter-live-receipt'],
            },
          ],
        },
      } as never,
      screenshotEntries: [
        {
          pageUrl: 'https://www.qfc.com/search',
          title: 'Search Products - QFC',
          screenshotLabel: 'page-3.png',
          screenshotPath: '/tmp/shopflow-live/screenshots/page-3.png',
        },
        {
          pageUrl: 'https://www.temu.com/search_result.html',
          title: 'Temu',
          screenshotLabel: 'page-1.png',
          screenshotPath: '/tmp/shopflow-live/screenshots/page-1.png',
        },
      ],
    });

    expect(packet.captureCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captureId: 'qfc-verified-scope-live-receipt',
          screenshotLabel: 'page-3.png',
          screenshotPath: '/tmp/shopflow-live/screenshots/page-3.png',
        }),
        expect.objectContaining({
          captureId: 'temu-filter-live-receipt',
          screenshotLabel: 'page-1.png',
          screenshotPath: '/tmp/shopflow-live/screenshots/page-1.png',
        }),
      ])
    );
  });

  it('uses the broader Safeway capture-lane blocker when cart falls back to public_or_unknown under a login-gated session', () => {
    const packet = createOperatorCapturePacket({
      diagnoseReport: {
        probe: {
          checkedAt: '2026-04-12T22:06:44.096Z',
          sessionHealth: { safeway: 'login_required' },
          captureTargetState: { safeway: 'login_required' },
          deepLinkState: { safeway: 'unknown' },
          observedTabs: [
            {
              url: 'https://www.safeway.com/',
              title: 'Grocery Delivery Near You - Order Groceries Online | Safeway',
            },
            {
              url: 'https://www.safeway.com/shop/cart',
              title: '404 | Safeway',
            },
            {
              url: 'https://www.safeway.com/account/sign-in.html',
              title: 'Sign In | Safeway',
            },
          ],
          targets: [
            {
              id: 'safeway-home',
              label: 'Safeway home',
              requestedUrl: 'https://www.safeway.com/',
              finalUrl: 'https://www.safeway.com/',
              title: 'Grocery Delivery Near You - Order Groceries Online | Safeway',
              classification: 'login_required',
              source: 'cdp-target',
              captureIds: [],
            },
            {
              id: 'safeway-cart',
              label: 'Safeway cart',
              requestedUrl: 'https://www.safeway.com/shop/cart',
              finalUrl: 'https://www.safeway.com/shop/cart',
              title: '404 | Safeway',
              classification: 'public_or_unknown',
              source: 'cdp-target',
              captureIds: ['safeway-subscribe-live-receipt'],
            },
            {
              id: 'safeway-manage',
              label: 'Safeway Schedule & Save manage',
              requestedUrl: 'https://www.safeway.com/schedule-and-save/manage',
              finalUrl: 'https://www.safeway.com/account/sign-in.html',
              title: 'Sign In | Safeway',
              classification: 'login_required',
              source: 'cdp-target',
              captureIds: ['safeway-cancel-live-receipt'],
            },
          ],
        },
      } as never,
    });

    expect(packet.captureCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          captureId: 'safeway-subscribe-live-receipt',
          classification: 'public_or_unknown',
          blockerReason: 'login_required',
        }),
        expect.objectContaining({
          captureId: 'safeway-cancel-live-receipt',
          classification: 'login_required',
          blockerReason: 'login_required',
        }),
      ])
    );
  });
});
