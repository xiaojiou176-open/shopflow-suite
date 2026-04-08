import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import {
  findStoreCatalogEntryByAppId,
  getLiveReceiptAppRequirements,
  getStoreReviewStartUrl,
  publicClaimBoundaries,
  storeCatalog,
} from '@shopflow/contracts';
import {
  buildManifest,
  collectArtifactOutputIssues,
  type ReleaseArtifactManifestEntry,
} from './write-artifact-manifest';
import {
  collectStructuredVerificationParityIssues,
  type VerificationParityIssue,
  type VerificationParityIssueCategory,
} from '../verification/check-verification-parity';
import { writeFileAtomically } from '../shared/write-file-atomically';

const repoRoot = resolve(import.meta.dirname, '../..');
const reportOutputPath = resolve(
  repoRoot,
  '.runtime-cache/release-artifacts/submission-readiness.json'
);

export type SubmissionReadinessEntry = {
  appId: string;
  publicName: string;
  releaseChannel: string;
  wave: string;
  tier: string;
  claimState: string;
  reviewBundleReady: boolean;
  readinessSummary: string;
  repoOwnedStatus:
    | 'internal-alpha-review-only'
    | 'review-bundle-ready-claim-gated'
    | 'review-bundle-ready-awaiting-signing'
    | 'review-bundle-incomplete';
  bundleAudit: {
    ready: boolean;
    buildDirectory: string;
    reviewArtifactManifestPath: string;
    buildDirectoryMissing: boolean;
    zipArtifactsMissing: boolean;
    missingBundleFiles: string[];
    reviewArtifactManifestMissing: boolean;
  };
  reviewerStartPath: {
    reviewChannel: string;
    surface: string;
    reviewArtifactManifestPath: string;
    manualReviewStartUrl?: string;
    firstCheck: string;
  };
  manualReviewStartUrl?: string;
  verifiedScopeCopy?: string;
  requiredEvidenceCaptureIds: string[];
  verificationParity: {
    ready: boolean;
    issues: string[];
    driftSignals: string[];
  };
  reviewerChecklist: SubmissionReadinessChecklistItem[];
  submissionChecklist: string[];
  submissionBoundaryNote: string;
  repoOwnedNextMove: string;
  externalBlockers: string[];
};

export type SubmissionReadinessChecklistItem = {
  category:
    | 'artifact-integrity'
    | 'review-start-path'
    | 'claim-boundary'
    | 'live-evidence'
    | 'verification-parity'
    | 'submission-boundary';
  status: 'ready' | 'attention' | 'blocked' | 'external' | 'internal-only';
  headline: string;
  detail: string;
  driftSignals?: string[];
};

export const submissionReadinessChecklistItemSchema = z.object({
  category: z.enum([
    'artifact-integrity',
    'review-start-path',
    'claim-boundary',
    'live-evidence',
    'verification-parity',
    'submission-boundary',
  ]),
  status: z.enum([
    'ready',
    'attention',
    'blocked',
    'external',
    'internal-only',
  ]),
  headline: z.string().min(1),
  detail: z.string().min(1),
  driftSignals: z.array(z.string().min(1)).optional(),
});

export const submissionReadinessEntrySchema = z.object({
  appId: z.string().min(1),
  publicName: z.string().min(1),
  releaseChannel: z.string().min(1),
  wave: z.string().min(1),
  tier: z.string().min(1),
  claimState: z.string().min(1),
  reviewBundleReady: z.boolean(),
  readinessSummary: z.string().min(1),
  repoOwnedStatus: z.enum([
    'internal-alpha-review-only',
    'review-bundle-ready-claim-gated',
    'review-bundle-ready-awaiting-signing',
    'review-bundle-incomplete',
  ]),
  bundleAudit: z.object({
    ready: z.boolean(),
    buildDirectory: z.string().min(1),
    reviewArtifactManifestPath: z.string().min(1),
    buildDirectoryMissing: z.boolean(),
    zipArtifactsMissing: z.boolean(),
    missingBundleFiles: z.array(z.string().min(1)),
    reviewArtifactManifestMissing: z.boolean(),
  }),
  reviewerStartPath: z.object({
    reviewChannel: z.string().min(1),
    surface: z.string().min(1),
    reviewArtifactManifestPath: z.string().min(1),
    manualReviewStartUrl: z.string().min(1).optional(),
    firstCheck: z.string().min(1),
  }),
  manualReviewStartUrl: z.string().min(1).optional(),
  verifiedScopeCopy: z.string().min(1).optional(),
  requiredEvidenceCaptureIds: z.array(z.string().min(1)),
  verificationParity: z.object({
    ready: z.boolean(),
    issues: z.array(z.string().min(1)),
    driftSignals: z.array(z.string().min(1)),
  }),
  reviewerChecklist: z.array(submissionReadinessChecklistItemSchema),
  submissionChecklist: z.array(z.string().min(1)),
  submissionBoundaryNote: z.string().min(1),
  repoOwnedNextMove: z.string().min(1),
  externalBlockers: z.array(z.string().min(1)),
});

export const submissionReadinessReportSchema = z.object({
  generatedAt: z.string().datetime(),
  entries: z.array(submissionReadinessEntrySchema),
});

export type SubmissionReadinessReport = z.infer<
  typeof submissionReadinessReportSchema
>;

type SubmissionReadinessReportOptions = {
  storeCatalogMap?: typeof storeCatalog;
  publicClaimBoundaryMap?: typeof publicClaimBoundaries;
  getLiveReceiptRequirements?: typeof getLiveReceiptAppRequirements;
  verificationParityIssues?: readonly VerificationParityIssue[];
  reviewedRecordsPacket?: ReviewedRecordsPacket;
};

type ReviewedRecordsPacket = {
  reviewedRecords: Array<{
    captureId: string;
  }>;
  rejectedRecords: Array<{
    captureId: string;
  }>;
};

type LiveEvidenceResolution = {
  reviewedCaptureIds: string[];
  unresolvedCaptureIds: string[];
  rejectedCaptureIds: string[];
  allRequiredCapturesReviewed: boolean;
};

const reviewedRecordsLatestPath = resolve(
  repoRoot,
  '.runtime-cache/live-browser/reviewed-records-latest.json'
);

function readJsonFile<T>(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function readLatestReviewedRecordsPacket() {
  if (!existsSync(reviewedRecordsLatestPath)) {
    return undefined;
  }

  return readJsonFile<ReviewedRecordsPacket>(reviewedRecordsLatestPath);
}

function resolveLiveEvidenceResolution(
  requiredEvidenceCaptureIds: readonly string[],
  reviewedRecordsPacket?: ReviewedRecordsPacket
): LiveEvidenceResolution {
  const reviewedCaptureIdsSet = new Set(
    reviewedRecordsPacket?.reviewedRecords.map((record) => record.captureId) ?? []
  );
  const rejectedCaptureIdsSet = new Set(
    reviewedRecordsPacket?.rejectedRecords.map((record) => record.captureId) ?? []
  );
  const reviewedCaptureIds = requiredEvidenceCaptureIds.filter((captureId) =>
    reviewedCaptureIdsSet.has(captureId)
  );
  const rejectedCaptureIds = requiredEvidenceCaptureIds.filter((captureId) =>
    rejectedCaptureIdsSet.has(captureId)
  );
  const unresolvedCaptureIds = requiredEvidenceCaptureIds.filter(
    (captureId) =>
      !reviewedCaptureIdsSet.has(captureId) &&
      !rejectedCaptureIdsSet.has(captureId)
  );

  return {
    reviewedCaptureIds,
    unresolvedCaptureIds,
    rejectedCaptureIds,
    allRequiredCapturesReviewed:
      requiredEvidenceCaptureIds.length > 0 &&
      unresolvedCaptureIds.length === 0 &&
      rejectedCaptureIds.length === 0,
  };
}

function resolveRepoOwnedStatus(
  entry: ReleaseArtifactManifestEntry,
  reviewBundleReady: boolean
): SubmissionReadinessEntry['repoOwnedStatus'] {
  if (!reviewBundleReady) {
    return 'review-bundle-incomplete';
  }

  if (entry.appId === 'ext-shopping-suite') {
    return 'internal-alpha-review-only';
  }

  if (entry.claimState !== 'public-claim-ready') {
    return 'review-bundle-ready-claim-gated';
  }

  return 'review-bundle-ready-awaiting-signing';
}

function resolveReviewChannel(releaseChannel: string) {
  return releaseChannel === 'internal-alpha'
    ? 'internal-alpha-review'
    : 'store-review';
}

function resolveSurface(entry: ReleaseArtifactManifestEntry) {
  if (entry.appId === 'ext-shopping-suite') {
    return 'internal-alpha';
  }

  return entry.tier === 'capability-heavy-product'
    ? 'capability-heavy-product'
    : 'storefront-shell';
}

function resolveRepoOwnedNextMove(
  status: SubmissionReadinessEntry['repoOwnedStatus'],
  liveEvidence: LiveEvidenceResolution,
  reviewerStartPathReady: boolean,
  verificationParity: SubmissionReadinessEntry['verificationParity']
) {
  if (status !== 'review-bundle-incomplete' && !verificationParity.ready) {
    return `Repair verification parity drift before reviewer handoff: ${verificationParity.issues[0]}`;
  }

  if (
    status !== 'internal-alpha-review-only' &&
    status !== 'review-bundle-incomplete' &&
    !reviewerStartPathReady
  ) {
    return 'Repair reviewer start-path truth in the store catalog before reviewer handoff or submission discussion.';
  }

  switch (status) {
    case 'review-bundle-incomplete':
      return 'Regenerate review bundles and fix packaging completeness before discussing submission readiness.';
    case 'internal-alpha-review-only':
      return 'Keep Suite internal-only and continue internal control-plane strengthening instead of preparing store submission wording.';
    case 'review-bundle-ready-claim-gated':
      return liveEvidence.allRequiredCapturesReviewed
        ? 'Reviewed live evidence is already attached. Keep wording claim-gated until the repo explicitly raises the public-claim boundary.'
        : liveEvidence.rejectedCaptureIds.length > 0
        ? `Keep wording claim-gated. Reviewed live evidence already includes rejected captures for ${liveEvidence.rejectedCaptureIds.join(', ')}, so repo-side recapture or evidence triage is still required before submission decisioning can move.`
        : liveEvidence.unresolvedCaptureIds.length > 0
        ? 'Keep wording claim-gated. Repo-owned reviewer handoff is ready, but reviewed live evidence still requires an external capture/review packet before submission decisioning can move.'
        : 'Keep wording inside repo-verified scope and only advance once the public-claim boundary is explicitly raised.';
    case 'review-bundle-ready-awaiting-signing':
      return 'Prepare store submission once the signing and submission environment is available.';
  }
}

function liveEvidenceStillRequiresExternalPacket(
  repoOwnedStatus: SubmissionReadinessEntry['repoOwnedStatus'],
  liveEvidence: LiveEvidenceResolution,
  reviewerStartPathReady: boolean,
  verificationParityReady: boolean
) {
  return (
    repoOwnedStatus === 'review-bundle-ready-claim-gated' &&
    liveEvidence.unresolvedCaptureIds.length > 0 &&
    reviewerStartPathReady &&
    verificationParityReady
  );
}

function createBundleAuditDriftSignals(
  bundleAudit: SubmissionReadinessEntry['bundleAudit']
) {
  const driftSignals: string[] = [];

  if (bundleAudit.buildDirectoryMissing) {
    driftSignals.push('build-directory-missing');
  }

  if (bundleAudit.zipArtifactsMissing) {
    driftSignals.push('zip-artifacts-missing');
  }

  if (bundleAudit.missingBundleFiles.length > 0) {
    driftSignals.push('missing-bundle-files');
  }

  if (bundleAudit.reviewArtifactManifestMissing) {
    driftSignals.push('review-artifact-manifest-missing');
  }

  return driftSignals;
}

function formatVerificationParityIssue(issue: VerificationParityIssue) {
  return `[${issue.category}] ${issue.message}`;
}

function createVerificationParityDriftSignal(
  category: VerificationParityIssueCategory
) {
  return `verification-${category}-drift`;
}

function createVerificationParity(
  issues: readonly VerificationParityIssue[]
): SubmissionReadinessEntry['verificationParity'] {
  return {
    ready: issues.length === 0,
    issues: issues.map(formatVerificationParityIssue),
    driftSignals: Array.from(
      new Set(
        issues.map((issue) => createVerificationParityDriftSignal(issue.category))
      )
    ),
  };
}

function createReviewerChecklist(
  entry: ReleaseArtifactManifestEntry,
  repoOwnedStatus: SubmissionReadinessEntry['repoOwnedStatus'],
  bundleAudit: SubmissionReadinessEntry['bundleAudit'],
  liveEvidence: LiveEvidenceResolution,
  manualReviewStartUrl: string | undefined,
  verificationParity: SubmissionReadinessEntry['verificationParity']
) {
  const checklist: SubmissionReadinessChecklistItem[] = [];
  const reviewerStartPathReady =
    entry.appId === 'ext-shopping-suite' || Boolean(manualReviewStartUrl);
  const liveEvidenceIsExternalOnly = liveEvidenceStillRequiresExternalPacket(
    repoOwnedStatus,
    liveEvidence,
    reviewerStartPathReady,
    verificationParity.ready
  );
  const verificationParityChecklistItem: SubmissionReadinessChecklistItem =
    verificationParity.ready
      ? {
          category: 'verification-parity',
          status: 'ready',
          headline: 'Verification parity guard is clean.',
          detail:
            'App definition wiring, review-start-path truth, fixture/test paths, and release packaging metadata stay aligned with the repo-owned verification catalog.',
        }
      : {
          category: 'verification-parity',
          status: 'blocked',
          headline:
            'Verification parity drift blocks a trustworthy reviewer handoff.',
          detail: verificationParity.issues.join(' '),
          driftSignals: verificationParity.driftSignals,
        };

  if (bundleAudit.ready) {
    checklist.push({
      category: 'artifact-integrity',
      status: 'ready',
      headline: 'Review bundle packaging is complete.',
      detail:
        'The repo-owned review bundle has the expected build directory, per-app review manifest, zip artifacts, and key bundle files for reviewer handoff.',
    });
  } else {
    checklist.push({
      category: 'artifact-integrity',
      status: 'blocked',
      headline: 'Review bundle packaging drift blocks reviewer handoff.',
      detail:
        'Fix the missing build output, review manifest, zip artifact, or key bundle file before treating this as a reviewer-ready bundle.',
      driftSignals: createBundleAuditDriftSignals(bundleAudit),
    });
  }

  if (entry.appId === 'ext-shopping-suite') {
    checklist.push(
      {
        category: 'review-start-path',
        status: 'internal-only',
        headline:
          'Suite review starts from the internal alpha bundle, not a store URL.',
        detail:
          'Inspect the Suite as an internal routing/control-plane shell and keep reviewer conversation inside the internal-alpha lane.',
      },
      {
        category: 'claim-boundary',
        status: 'internal-only',
        headline: 'Suite must remain outside public claim language.',
        detail:
          'Treat the bundle as an internal alpha surface only and do not translate it into store-submission or public-support wording.',
      },
      {
        category: 'live-evidence',
        status: 'internal-only',
        headline: 'Suite does not use store-facing live-receipt gating.',
        detail:
          'The relevant review question is internal control-plane behavior, not store-facing evidence capture for public claims.',
      },
      {
        category: 'submission-boundary',
        status: 'internal-only',
        headline:
          'Suite review artifacts are internal inspection packets only.',
        detail:
          'They are not store submissions, not signed releases, and not proof of public-claim readiness.',
      },
      verificationParityChecklistItem
    );

    return checklist;
  }

  if (manualReviewStartUrl) {
    checklist.push({
      category: 'review-start-path',
      status: 'ready',
      headline: 'Reviewer start path is explicit and readable.',
      detail: `Start manual inspection from ${manualReviewStartUrl} so reviewers do not have to guess the storefront entrypoint.`,
    });
  } else {
    checklist.push({
      category: 'review-start-path',
      status: 'blocked',
      headline: 'Reviewer start path drift blocks deterministic handoff.',
      detail:
        'The store catalog is missing a default review host, so the report cannot provide a trustworthy reviewer start URL.',
      driftSignals: ['missing-default-review-host'],
    });
  }

  if (entry.claimState !== 'public-claim-ready') {
    checklist.push({
      category: 'claim-boundary',
      status: 'blocked',
      headline:
        liveEvidence.reviewedCaptureIds.length > 0 ||
        liveEvidence.rejectedCaptureIds.length > 0 ||
        liveEvidence.unresolvedCaptureIds.length > 0
          ? 'Public claim boundary is still gated by live evidence.'
          : 'Public claim boundary is still limited to repo-verified wording.',
      detail:
        liveEvidence.reviewedCaptureIds.length > 0 ||
        liveEvidence.rejectedCaptureIds.length > 0 ||
        liveEvidence.unresolvedCaptureIds.length > 0
          ? liveEvidence.rejectedCaptureIds.length > 0
            ? `Reviewed live evidence already includes rejected captures for ${liveEvidence.rejectedCaptureIds.join(', ')}, so public wording must stay claim-gated until the repo decides whether to recapture or keep the rejection.`
            : liveEvidence.unresolvedCaptureIds.length > 0
            ? `Keep wording claim-gated until reviewed live evidence exists for ${liveEvidence.unresolvedCaptureIds.join(', ')}.`
            : 'Reviewed live evidence is already attached, but public wording must stay claim-gated until the repo explicitly raises the claim boundary.'
          : 'Keep public wording inside the current repo-verified scope until the claim boundary is explicitly raised.',
    });
  } else {
    checklist.push({
      category: 'claim-boundary',
      status: 'ready',
      headline: 'Public claim boundary is satisfied inside repo truth.',
      detail:
        'Claim-boundary gating is clear for the current verified scope, but that still does not replace signing or submission work.',
    });
  }

  if (
    liveEvidence.reviewedCaptureIds.length > 0 ||
    liveEvidence.rejectedCaptureIds.length > 0 ||
    liveEvidence.unresolvedCaptureIds.length > 0
  ) {
    checklist.push({
      category: 'live-evidence',
      status:
        liveEvidence.rejectedCaptureIds.length > 0
          ? 'blocked'
          : entry.claimState === 'public-claim-ready'
          ? 'ready'
          : liveEvidence.allRequiredCapturesReviewed
            ? 'ready'
          : liveEvidenceIsExternalOnly
            ? 'external'
            : 'blocked',
      headline:
        liveEvidence.rejectedCaptureIds.length > 0
          ? 'Reviewed live evidence already includes rejected captures.'
          : entry.claimState === 'public-claim-ready'
          ? 'Live-evidence requirements remain attached to the submission record.'
          : liveEvidence.allRequiredCapturesReviewed
            ? 'Reviewed live evidence is already attached to the submission path.'
          : liveEvidenceIsExternalOnly
            ? 'Reviewed live evidence still requires an external capture/review packet.'
            : 'Reviewed live evidence is still missing from the submission path.',
      detail:
        liveEvidence.rejectedCaptureIds.length > 0
          ? `Rejected evidence already exists for ${liveEvidence.rejectedCaptureIds.join(', ')}. Do not treat these captures as missing external packets; decide whether the repo should recapture or keep the rejection in place.`
          : entry.claimState === 'public-claim-ready'
          ? `Keep the reviewed evidence packet for ${liveEvidence.reviewedCaptureIds.join(', ')} attached to the release decision trail.`
          : liveEvidence.allRequiredCapturesReviewed
            ? `Keep the reviewed evidence packet for ${liveEvidence.reviewedCaptureIds.join(', ')} attached to the release decision trail while the repo decides whether to raise the public-claim boundary.`
          : liveEvidenceIsExternalOnly
            ? `The repo-owned review bundle, reviewer start path, and parity checks are already clear. The remaining gate is an external reviewed live-evidence packet for ${liveEvidence.unresolvedCaptureIds.join(', ')}.`
            : `Do not move toward public support wording until reviewers can inspect live evidence for ${liveEvidence.unresolvedCaptureIds.join(', ')}.`,
    });
  } else {
    checklist.push({
      category: 'live-evidence',
      status: 'ready',
      headline: 'No live-evidence gate applies to this app.',
      detail:
        'Review can stay inside repo-owned artifacts and verified-scope wording without waiting on a live-receipt packet.',
    });
  }

  checklist.push(verificationParityChecklistItem);

  checklist.push({
    category: 'submission-boundary',
    status:
      repoOwnedStatus === 'review-bundle-ready-awaiting-signing'
        ? 'external'
        : repoOwnedStatus === 'review-bundle-incomplete'
          ? 'blocked'
          : 'attention',
    headline:
      repoOwnedStatus === 'review-bundle-ready-awaiting-signing'
        ? 'Repo-owned review is complete, but signing and submission remain external.'
        : 'Review bundle stays a reviewer artifact, not a signed release.',
    detail:
      repoOwnedStatus === 'review-bundle-ready-awaiting-signing'
        ? 'Use the bundle for reviewer confidence, then move into the external signing and store-submission environment.'
        : 'Do not treat the review bundle as proof of signed-release readiness or public-claim readiness.',
  });

  return checklist;
}

function createSubmissionChecklist(
  reviewerChecklist: SubmissionReadinessChecklistItem[]
) {
  return reviewerChecklist.map(
    (item) => `[${item.category}] ${item.headline} ${item.detail}`
  );
}

function createReadinessSummary(
  status: SubmissionReadinessEntry['repoOwnedStatus'],
  liveEvidence: LiveEvidenceResolution,
  reviewerStartPathReady: boolean,
  verificationParityReady: boolean
) {
  if (status !== 'review-bundle-incomplete' && !verificationParityReady) {
    return 'Review bundle is complete, but verification parity drift still blocks a trustworthy reviewer handoff.';
  }

  if (
    status !== 'internal-alpha-review-only' &&
    status !== 'review-bundle-incomplete' &&
    !reviewerStartPathReady
  ) {
    return 'Review bundle is complete, but reviewer start-path truth is missing, so reviewer handoff cannot stay deterministic.';
  }

  switch (status) {
    case 'review-bundle-incomplete':
      return 'Review bundle is incomplete. Fix packaging completeness before reviewer handoff.';
    case 'internal-alpha-review-only':
      return 'Internal alpha review bundle is complete, but the Suite must stay outside store-submission talk.';
    case 'review-bundle-ready-claim-gated':
      return liveEvidence.allRequiredCapturesReviewed
        ? 'Review bundle is complete and reviewed live evidence is already attached, but public wording still remains claim-gated.'
        : liveEvidence.rejectedCaptureIds.length > 0
        ? 'Review bundle is complete, but reviewed live evidence includes rejected captures, so release wording is still blocked on repo-side evidence triage.'
        : liveEvidence.unresolvedCaptureIds.length > 0
        ? reviewerStartPathReady && verificationParityReady
          ? 'Review bundle is complete, reviewer handoff is clear, and the remaining gate is external reviewed live evidence.'
          : 'Review bundle is complete, but release wording is still blocked on reviewed live evidence.'
        : 'Review bundle is complete, but public wording must stay inside the current repo-verified scope.';
    case 'review-bundle-ready-awaiting-signing':
      return 'Review bundle is complete, but signed artifacts and the real submission environment remain external.';
  }
}

function createSubmissionBoundaryNote(
  entry: ReleaseArtifactManifestEntry,
  repoOwnedStatus: SubmissionReadinessEntry['repoOwnedStatus']
) {
  if (entry.appId === 'ext-shopping-suite') {
    return 'Internal alpha review artifacts are for internal inspection only and are not a store submission.';
  }

  if (repoOwnedStatus === 'review-bundle-incomplete') {
    return 'Packaging completeness is still red, so this repo-owned artifact is not ready for reviewer handoff.';
  }

  return 'Review bundles are repo-owned review artifacts, not signed releases and not proof of public-claim readiness.';
}

type ArtifactOutputIssue = ReturnType<
  typeof collectArtifactOutputIssues
>[number];

function createBundleAudit(
  entry: ReleaseArtifactManifestEntry,
  issue: ArtifactOutputIssue | undefined
): SubmissionReadinessEntry['bundleAudit'] {
  return {
    ready: !issue,
    buildDirectory: entry.buildDirectory,
    reviewArtifactManifestPath: `${entry.buildDirectory}/shopflow-review-artifact.json`,
    buildDirectoryMissing: issue?.buildDirectoryMissing ?? false,
    zipArtifactsMissing: issue?.zipArtifactsMissing ?? false,
    missingBundleFiles: issue?.missingBundleFiles ?? [],
    reviewArtifactManifestMissing: issue?.reviewArtifactManifestMissing ?? false,
  };
}

function createReviewerStartPath(
  entry: ReleaseArtifactManifestEntry,
  liveEvidence: LiveEvidenceResolution,
  manualReviewStartUrl: string | undefined
): SubmissionReadinessEntry['reviewerStartPath'] {
  if (entry.appId === 'ext-shopping-suite') {
    return {
      reviewChannel: resolveReviewChannel(entry.releaseChannel),
      surface: resolveSurface(entry),
      reviewArtifactManifestPath: `${entry.buildDirectory}/shopflow-review-artifact.json`,
      firstCheck:
        'Open the internal alpha review bundle and confirm Suite still behaves like a routing/control-plane shell instead of a store submission surface.',
    };
  }

  return {
    reviewChannel: resolveReviewChannel(entry.releaseChannel),
    surface: resolveSurface(entry),
    reviewArtifactManifestPath: `${entry.buildDirectory}/shopflow-review-artifact.json`,
    manualReviewStartUrl,
    firstCheck: !manualReviewStartUrl
      ? 'Repair default review host drift in the store catalog before reviewer handoff so the start path is explicit.'
      : liveEvidence.reviewedCaptureIds.length > 0 ||
          liveEvidence.rejectedCaptureIds.length > 0 ||
          liveEvidence.unresolvedCaptureIds.length > 0
        ? liveEvidence.allRequiredCapturesReviewed
          ? 'Start from the reviewer URL, confirm the reviewed live evidence packet stays attached, and keep wording claim-gated until the repo explicitly raises the public boundary.'
          : liveEvidence.rejectedCaptureIds.length > 0
          ? 'Start from the reviewer URL, inspect the rejected evidence packet, and decide whether the capture should be redone before any submission talk.'
          : 'Start from the reviewer URL, confirm the store-review bundle stays claim-gated, and record that reviewed live evidence still remains an external gate before any submission talk.'
        : 'Start from the reviewer URL and confirm the store-review bundle matches repo-verified storefront behavior without implying signed or public-ready status.',
  };
}

function resolveExternalBlockers(
  entry: ReleaseArtifactManifestEntry,
  repoOwnedStatus: SubmissionReadinessEntry['repoOwnedStatus'],
  liveEvidence: LiveEvidenceResolution,
  reviewerStartPathReady: boolean,
  verificationParityReady: boolean
) {
  if (entry.appId === 'ext-shopping-suite') {
    return [];
  }

  if (
    liveEvidenceStillRequiresExternalPacket(
      repoOwnedStatus,
      liveEvidence,
      reviewerStartPathReady,
      verificationParityReady
    )
  ) {
    return [
      `Reviewed live evidence still requires an external capture/review packet for ${liveEvidence.unresolvedCaptureIds.join(', ')}.`,
    ];
  }

  if (repoOwnedStatus === 'review-bundle-ready-awaiting-signing') {
    return [
      'Signed store-ready artifacts and actual submission environment remain external.',
    ];
  }

  return [];
}

export function createSubmissionReadinessReport(
  manifest: ReleaseArtifactManifestEntry[] = buildManifest(),
  artifactOutputIssues = collectArtifactOutputIssues(
    manifest as Parameters<typeof collectArtifactOutputIssues>[0]
  ),
  options: SubmissionReadinessReportOptions = {}
) {
  const issuesByAppId = new Map(
    artifactOutputIssues.map((issue) => [issue.appId, issue])
  );
  const storeCatalogMap = options.storeCatalogMap ?? storeCatalog;
  const publicClaimBoundaryMap =
    options.publicClaimBoundaryMap ?? publicClaimBoundaries;
  const getLiveReceiptRequirements =
    options.getLiveReceiptRequirements ?? getLiveReceiptAppRequirements;
  const verificationParityIssues =
    options.verificationParityIssues ?? collectStructuredVerificationParityIssues();
  const reviewedRecordsPacket =
    options.reviewedRecordsPacket ?? readLatestReviewedRecordsPacket();
  const parityIssuesByAppId = verificationParityIssues.reduce<
    Map<string, VerificationParityIssue[]>
  >((map, issue) => {
    if (!issue.appId) {
      return map;
    }

    const issues = map.get(issue.appId) ?? [];
    issues.push(issue);
    map.set(issue.appId, issues);
    return map;
  }, new Map());

  const entries: SubmissionReadinessEntry[] = manifest.map((entry) => {
    const artifactIssue = issuesByAppId.get(entry.appId);
    const reviewBundleReady = !artifactIssue;
    const storeEntry = findStoreCatalogEntryByAppId(entry.appId, storeCatalogMap);
    const boundary = storeEntry
      ? publicClaimBoundaryMap[storeEntry.storeId]
      : undefined;
    const requiredEvidenceCaptureIds = storeEntry
      ? getLiveReceiptRequirements(storeEntry.appId).map(
          (requirement) => requirement.captureId
        )
      : [];
    const liveEvidence = resolveLiveEvidenceResolution(
      requiredEvidenceCaptureIds,
      reviewedRecordsPacket
    );
    const repoOwnedStatus = resolveRepoOwnedStatus(entry, reviewBundleReady);
    const manualReviewStartUrl = storeEntry
      ? getStoreReviewStartUrl(storeEntry.storeId, storeCatalogMap)
      : undefined;
    const bundleAudit = createBundleAudit(entry, artifactIssue);
    const verificationParity = createVerificationParity(
      parityIssuesByAppId.get(entry.appId) ?? []
    );
    const reviewerChecklist = createReviewerChecklist(
      entry,
      repoOwnedStatus,
      bundleAudit,
      liveEvidence,
      manualReviewStartUrl,
      verificationParity
    );
    const reviewerStartPathReady =
      entry.appId === 'ext-shopping-suite' || Boolean(manualReviewStartUrl);

    return {
      appId: entry.appId,
      publicName: entry.publicName,
      releaseChannel: entry.releaseChannel,
      wave: entry.wave,
      tier: entry.tier,
      claimState: entry.claimState,
      reviewBundleReady,
      readinessSummary: createReadinessSummary(
        repoOwnedStatus,
        liveEvidence,
        reviewerStartPathReady,
        verificationParity.ready
      ),
      repoOwnedStatus,
      bundleAudit,
      reviewerStartPath: createReviewerStartPath(
        entry,
        liveEvidence,
        manualReviewStartUrl
      ),
      manualReviewStartUrl,
      verifiedScopeCopy: boundary?.verifiedScopeCopy,
      requiredEvidenceCaptureIds,
      verificationParity,
      reviewerChecklist,
      submissionChecklist: createSubmissionChecklist(reviewerChecklist),
      submissionBoundaryNote: createSubmissionBoundaryNote(
        entry,
        repoOwnedStatus
      ),
      repoOwnedNextMove: resolveRepoOwnedNextMove(
        repoOwnedStatus,
        liveEvidence,
        reviewerStartPathReady,
        verificationParity
      ),
      externalBlockers: resolveExternalBlockers(
        entry,
        repoOwnedStatus,
        liveEvidence,
        reviewerStartPathReady,
        verificationParity.ready
      ),
    };
  });

  return submissionReadinessReportSchema.parse({
    generatedAt: new Date().toISOString(),
    entries,
  });
}

function main() {
  const report = createSubmissionReadinessReport();

  writeFileAtomically(reportOutputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `Submission readiness report written for ${report.entries.length} app entries: ${reportOutputPath}\n`
  );
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main();
}
