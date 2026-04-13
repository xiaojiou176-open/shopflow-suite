import { storeCatalog } from '@shopflow/contracts';
import { describe, expect, it } from 'vitest';
import { createSubmissionReadinessReport } from '../../tooling/release/write-submission-readiness-report';
import type { ReleaseArtifactManifestEntry } from '../../tooling/release/write-artifact-manifest';

describe('submission readiness report tooling', () => {
  it('keeps Suite internal-only in the submission readiness report', () => {
    const manifest: ReleaseArtifactManifestEntry[] = [
      {
        appId: 'ext-shopping-suite',
        publicName: 'Shopflow Suite',
        releaseChannel: 'internal-alpha',
        claimState: 'planned',
        wave: 'Wave 3',
        tier: 'capability-heavy-product',
        buildDirectory: 'apps/ext-shopping-suite/.output/chrome-mv3',
        zipArtifacts: [
          'apps/ext-shopping-suite/.output/shopflowext-shopping-suite-0.1.0-chrome.zip',
        ],
      },
    ];
    const report = createSubmissionReadinessReport(manifest, []);

    expect(report.entries[0]).toMatchObject({
      appId: 'ext-shopping-suite',
      reviewBundleReady: true,
      repoOwnedStatus: 'internal-alpha-review-only',
      readinessSummary: expect.stringMatching(
        /internal alpha review bundle is complete/i
      ),
      verificationParity: {
        ready: true,
        issues: [],
      },
      reviewerStartPath: {
        reviewChannel: 'internal-alpha-review',
        surface: 'internal-alpha',
        reviewArtifactManifestPath:
          'apps/ext-shopping-suite/.output/chrome-mv3/shopflow-review-artifact.json',
      },
    });
    expect(report.entries[0]?.submissionChecklist[0]).toMatch(
      /\[artifact-integrity\].*packaging is complete/i
    );
    expect(report.entries[0]?.reviewerChecklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'claim-boundary',
          status: 'internal-only',
        }),
        expect.objectContaining({
          category: 'verification-parity',
          status: 'ready',
        }),
        expect.objectContaining({
          category: 'submission-boundary',
          status: 'internal-only',
        }),
      ])
    );
    expect(report.entries[0]?.submissionBoundaryNote).toMatch(
      /not a store submission/i
    );
    expect(report.entries[0]?.externalBlockers).toEqual([]);
  });

  it('reports claim-gated store apps honestly while preserving live-evidence requirements', () => {
    const manifest: ReleaseArtifactManifestEntry[] = [
      {
        appId: 'ext-albertsons',
        publicName: 'Shopflow for Albertsons Family',
        releaseChannel: 'capability-heavy-candidate',
        claimState: 'repo-verified',
        wave: 'Wave 1',
        tier: 'capability-heavy-product',
        buildDirectory: 'apps/ext-albertsons/.output/chrome-mv3',
        zipArtifacts: [
          'apps/ext-albertsons/.output/shopflowext-albertsons-0.1.0-chrome.zip',
        ],
      },
    ];
    const report = createSubmissionReadinessReport(manifest, []);

    expect(report.entries[0]).toMatchObject({
      appId: 'ext-albertsons',
      reviewBundleReady: true,
      repoOwnedStatus: 'review-bundle-ready-claim-gated',
      claimState: 'repo-verified',
      manualReviewStartUrl: 'https://www.safeway.com',
      verifiedScopeCopy: 'Currently verified on Safeway.',
      readinessSummary: expect.stringMatching(
        /remaining gate is external reviewed live evidence/i
      ),
      verificationParity: {
        ready: true,
        issues: [],
      },
      reviewerStartPath: {
        reviewChannel: 'store-review',
        surface: 'capability-heavy-product',
        manualReviewStartUrl: 'https://www.safeway.com',
        reviewArtifactManifestPath:
          'apps/ext-albertsons/.output/chrome-mv3/shopflow-review-artifact.json',
      },
    });
    expect(report.entries[0]?.requiredEvidenceCaptureIds).toEqual(
      expect.arrayContaining([
        'safeway-subscribe-live-receipt',
        'safeway-cancel-live-receipt',
      ])
    );
    expect(report.entries[0]?.bundleAudit).toMatchObject({
      ready: true,
      zipArtifactsMissing: false,
      missingBundleFiles: [],
      reviewArtifactManifestMissing: false,
    });
    expect(report.entries[0]?.reviewerChecklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'review-start-path',
          status: 'ready',
          detail: expect.stringMatching(/https:\/\/www\.safeway\.com/i),
        }),
        expect.objectContaining({
          category: 'claim-boundary',
          status: 'blocked',
        }),
        expect.objectContaining({
          category: 'live-evidence',
          status: 'external',
        }),
        expect.objectContaining({
          category: 'verification-parity',
          status: 'ready',
        }),
      ])
    );
    expect(report.entries[0]?.submissionChecklist).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/\[claim-boundary\].*claim-gated/i),
        expect.stringMatching(/\[live-evidence\].*external capture\/review packet/i),
      ])
    );
    expect(report.entries[0]?.repoOwnedNextMove).toMatch(
      /repo-owned reviewer handoff is ready/i
    );
    expect(report.entries[0]?.externalBlockers).toEqual([
      'Reviewed live evidence still requires an external capture/review packet for safeway-subscribe-live-receipt, safeway-cancel-live-receipt.',
    ]);
  });

  it('stops reporting external live-evidence blockers once all required captures are already reviewed', () => {
    const manifest: ReleaseArtifactManifestEntry[] = [
      {
        appId: 'ext-kroger',
        publicName: 'Shopflow for Kroger Family',
        releaseChannel: 'capability-heavy-candidate',
        claimState: 'repo-verified',
        wave: 'Wave 3',
        tier: 'capability-heavy-product',
        buildDirectory: 'apps/ext-kroger/.output/chrome-mv3',
        zipArtifacts: [
          'apps/ext-kroger/.output/shopflowext-kroger-0.1.0-chrome.zip',
        ],
      },
    ];
    const report = createSubmissionReadinessReport(manifest, [], {
      reviewedRecordsPacket: {
        reviewedRecords: [
          { captureId: 'fred-meyer-verified-scope-live-receipt' },
          { captureId: 'qfc-verified-scope-live-receipt' },
        ],
        rejectedRecords: [],
      },
    });

    expect(report.entries[0]).toMatchObject({
      appId: 'ext-kroger',
      reviewBundleReady: true,
      repoOwnedStatus: 'review-bundle-ready-claim-gated',
      readinessSummary: expect.stringMatching(
        /reviewed live evidence is already attached/i
      ),
      reviewerStartPath: {
        reviewChannel: 'store-review',
        surface: 'capability-heavy-product',
      },
    });
    expect(report.entries[0]?.reviewerChecklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'claim-boundary',
          status: 'blocked',
          detail: expect.stringMatching(/already attached/i),
        }),
        expect.objectContaining({
          category: 'live-evidence',
          status: 'ready',
          detail: expect.stringMatching(/attached to the release decision trail/i),
        }),
      ])
    );
    expect(report.entries[0]?.repoOwnedNextMove).toMatch(
      /explicitly raises the public-claim boundary/i
    );
    expect(report.entries[0]?.externalBlockers).toEqual([]);
  });

  it('treats rejected live-evidence records as repo-side triage instead of external blockers', () => {
    const manifest: ReleaseArtifactManifestEntry[] = [
      {
        appId: 'ext-kroger',
        publicName: 'Shopflow for Kroger Family',
        releaseChannel: 'capability-heavy-candidate',
        claimState: 'repo-verified',
        wave: 'Wave 3',
        tier: 'capability-heavy-product',
        buildDirectory: 'apps/ext-kroger/.output/chrome-mv3',
        zipArtifacts: [
          'apps/ext-kroger/.output/shopflowext-kroger-0.1.0-chrome.zip',
        ],
      },
    ];
    const report = createSubmissionReadinessReport(manifest, [], {
      reviewedRecordsPacket: {
        reviewedRecords: [
          { captureId: 'qfc-verified-scope-live-receipt' },
        ],
        rejectedRecords: [
          { captureId: 'fred-meyer-verified-scope-live-receipt' },
        ],
      },
    });

    expect(report.entries[0]).toMatchObject({
      appId: 'ext-kroger',
      reviewBundleReady: true,
      repoOwnedStatus: 'review-bundle-ready-claim-gated',
      readinessSummary: expect.stringMatching(
        /finalized with rejected captures|claim-gated/i
      ),
    });
    expect(report.entries[0]?.reviewerChecklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'claim-boundary',
          status: 'attention',
          detail: expect.stringMatching(
            /keep wording claim-gated and do not reopen/i
          ),
        }),
        expect.objectContaining({
          category: 'live-evidence',
          status: 'attention',
          detail: expect.stringMatching(
            /Do not treat these captures as missing external packets unless the owner later requests/i
          ),
        }),
      ])
    );
    expect(report.entries[0]?.repoOwnedNextMove).toMatch(
      /do not reopen unless the owner later requests/i
    );
    expect(report.entries[0]?.externalBlockers).toEqual([]);
  });

  it('keeps rejected captures claim-gated while still surfacing unresolved external live proof', () => {
    const manifest: ReleaseArtifactManifestEntry[] = [
      {
        appId: 'ext-albertsons',
        publicName: 'Shopflow for Albertsons Family',
        releaseChannel: 'capability-heavy-candidate',
        claimState: 'repo-verified',
        wave: 'Wave 1',
        tier: 'capability-heavy-product',
        buildDirectory: 'apps/ext-albertsons/.output/chrome-mv3',
        zipArtifacts: [
          'apps/ext-albertsons/.output/shopflowext-albertsons-0.1.0-chrome.zip',
        ],
      },
    ];
    const report = createSubmissionReadinessReport(manifest, [], {
      reviewedRecordsPacket: {
        reviewedRecords: [],
        rejectedRecords: [{ captureId: 'safeway-cancel-live-receipt' }],
      },
    });

    expect(report.entries[0]).toMatchObject({
      appId: 'ext-albertsons',
      repoOwnedStatus: 'review-bundle-ready-claim-gated',
      readinessSummary: expect.stringMatching(
        /remaining open gate is external capture\/review|claim-gated/i
      ),
      repoOwnedNextMove: expect.stringMatching(
        /external capture\/review is still required/i
      ),
    });
    expect(report.entries[0]?.reviewerChecklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'claim-boundary',
          status: 'attention',
          detail: expect.stringMatching(
            /reviewed external evidence is still unresolved for safeway-subscribe-live-receipt/i
          ),
        }),
        expect.objectContaining({
          category: 'live-evidence',
          status: 'attention',
          detail: expect.stringMatching(
            /external capture\/review is still unresolved for safeway-subscribe-live-receipt/i
          ),
        }),
      ])
    );
    expect(report.entries[0]?.externalBlockers).toEqual([
      'Reviewed live evidence still requires an external capture/review packet for safeway-subscribe-live-receipt.',
    ]);
  });

  it('turns missing default review hosts into readable reviewer-start-path blockers instead of fake URLs', () => {
    const manifest: ReleaseArtifactManifestEntry[] = [
      {
        appId: 'ext-temu',
        publicName: 'Shopflow for Temu',
        releaseChannel: 'storefront-shell-candidate',
        claimState: 'repo-verified',
        wave: 'Wave 2',
        tier: 'storefront-shell',
        buildDirectory: 'apps/ext-temu/.output/chrome-mv3',
        zipArtifacts: [
          'apps/ext-temu/.output/shopflowext-temu-0.1.0-chrome.zip',
        ],
      },
    ];
    const report = createSubmissionReadinessReport(manifest, [], {
      storeCatalogMap: {
        ...storeCatalog,
        temu: {
          ...storeCatalog.temu,
          defaultHosts: [],
        },
      },
    });

    expect(report.entries[0]?.manualReviewStartUrl).toBeUndefined();
    expect(report.entries[0]?.readinessSummary).toMatch(
      /reviewer start-path truth is missing/i
    );
    expect(report.entries[0]?.verificationParity).toMatchObject({
      ready: true,
      issues: [],
    });
    expect(report.entries[0]?.repoOwnedNextMove).toMatch(
      /repair reviewer start-path truth/i
    );
    expect(report.entries[0]?.reviewerStartPath.firstCheck).toMatch(
      /repair default review host drift/i
    );
    expect(report.entries[0]?.reviewerChecklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'review-start-path',
          status: 'blocked',
          driftSignals: ['missing-default-review-host'],
        }),
        expect.objectContaining({
          category: 'verification-parity',
          status: 'ready',
        }),
      ])
    );
    expect(report.entries[0]?.submissionChecklist).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /\[review-start-path\].*trustworthy reviewer start URL/i
        ),
      ])
    );
  });

  it('surfaces bundle completeness gaps as reviewer-facing triage instead of a vague red light', () => {
    const manifest: ReleaseArtifactManifestEntry[] = [
      {
        appId: 'ext-temu',
        publicName: 'Shopflow for Temu',
        releaseChannel: 'storefront-shell-candidate',
        claimState: 'repo-verified',
        wave: 'Wave 2',
        tier: 'storefront-shell',
        buildDirectory: 'apps/ext-temu/.output/chrome-mv3',
        zipArtifacts: [],
      },
    ];
    const report = createSubmissionReadinessReport(manifest, [
      {
        appId: 'ext-temu',
        buildDirectoryMissing: true,
        zipArtifactsMissing: true,
        missingBundleFiles: ['manifest.json', 'popup.html'],
        reviewArtifactManifestMissing: true,
      },
    ]);

    expect(report.entries[0]).toMatchObject({
      appId: 'ext-temu',
      reviewBundleReady: false,
      repoOwnedStatus: 'review-bundle-incomplete',
      readinessSummary: expect.stringMatching(/review bundle is incomplete/i),
      verificationParity: {
        ready: true,
        issues: [],
      },
      bundleAudit: {
        ready: false,
        buildDirectoryMissing: true,
        zipArtifactsMissing: true,
        missingBundleFiles: ['manifest.json', 'popup.html'],
        reviewArtifactManifestMissing: true,
      },
    });
    expect(report.entries[0]?.reviewerChecklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'artifact-integrity',
          status: 'blocked',
          driftSignals: expect.arrayContaining([
            'build-directory-missing',
            'zip-artifacts-missing',
            'missing-bundle-files',
            'review-artifact-manifest-missing',
          ]),
        }),
      ])
    );
    expect(report.entries[0]?.repoOwnedNextMove).toMatch(
      /packaging completeness/i
    );
  });

  it('folds app-scoped verification parity drift into the readiness checklist and next move', () => {
    const manifest: ReleaseArtifactManifestEntry[] = [
      {
        appId: 'ext-temu',
        publicName: 'Shopflow for Temu',
        releaseChannel: 'storefront-shell-candidate',
        claimState: 'repo-verified',
        wave: 'Wave 2',
        tier: 'storefront-shell',
        buildDirectory: 'apps/ext-temu/.output/chrome-mv3',
        zipArtifacts: [
          'apps/ext-temu/.output/shopflowext-temu-0.1.0-chrome.zip',
        ],
      },
    ];
    const report = createSubmissionReadinessReport(manifest, [], {
      verificationParityIssues: [
        {
          appId: 'ext-temu',
          category: 'claim-boundary',
          message:
            'App summary drift for ext-temu: summary must repeat the verified-scope clause "Currently verified on Safeway.".',
        },
        {
          appId: 'ext-temu',
          category: 'review-start-path',
          message:
            'Default review host drift for ext-temu: www.temu.com is not covered by app hostMatches *://m.temu.com/*.',
        },
      ],
    });

    expect(report.entries[0]).toMatchObject({
      appId: 'ext-temu',
      reviewBundleReady: true,
      verificationParity: {
        ready: false,
        issues: expect.arrayContaining([
          expect.stringMatching(/\[claim-boundary\].*summary drift/i),
          expect.stringMatching(/\[review-start-path\].*default review host drift/i),
        ]),
        driftSignals: expect.arrayContaining([
          'verification-claim-boundary-drift',
          'verification-review-start-path-drift',
        ]),
      },
      readinessSummary: expect.stringMatching(/verification parity drift/i),
      repoOwnedNextMove: expect.stringMatching(/repair verification parity drift/i),
    });
    expect(report.entries[0]?.reviewerChecklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'verification-parity',
          status: 'blocked',
          driftSignals: expect.arrayContaining([
            'verification-claim-boundary-drift',
            'verification-review-start-path-drift',
          ]),
        }),
      ])
    );
    expect(report.entries[0]?.submissionChecklist).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/\[verification-parity\].*\[claim-boundary\].*\[review-start-path\]/i),
      ])
    );
  });

  it('keeps true external blockers limited to signing and submission once repo-owned gates are cleared', () => {
    const manifest: ReleaseArtifactManifestEntry[] = [
      {
        appId: 'ext-walmart',
        publicName: 'Shopflow for Walmart',
        releaseChannel: 'storefront-shell-candidate',
        claimState: 'public-claim-ready',
        wave: 'Wave 2',
        tier: 'storefront-shell',
        buildDirectory: 'apps/ext-walmart/.output/chrome-mv3',
        zipArtifacts: [
          'apps/ext-walmart/.output/shopflowext-walmart-0.1.0-chrome.zip',
        ],
      },
    ];

    const report = createSubmissionReadinessReport(manifest, []);

    expect(report.entries[0]?.repoOwnedStatus).toBe(
      'review-bundle-ready-awaiting-signing'
    );
    expect(report.entries[0]?.externalBlockers).toEqual([
      'Signed store-ready artifacts and actual submission environment remain external.',
    ]);
  });
});
