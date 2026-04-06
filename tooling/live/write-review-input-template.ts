import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  getLiveReceiptAppRequirements,
  type LiveReceiptAppRequirement,
  type LiveReceiptCaptureRecord,
} from '@shopflow/contracts';
import { resolveShopflowLiveSessionConfig, writeLiveJsonArtifact } from './shared';

type ReviewCandidateRecordsPacket = {
  checkedAt: string;
  sourceArtifacts: {
    operatorCapturePacketLatestPath: string;
  };
  capturedRecords: LiveReceiptCaptureRecord[];
  blockedCandidates: Array<{
    captureId: string;
    appId: string;
    targetId: string;
    status: 'blocked';
    classification: string;
    finalUrl?: string;
    title?: string;
    screenshotLabel?: string;
    screenshotPath?: string;
    blockerReason?: string;
  }>;
};

type ReviewedRecordsPacket = {
  checkedAt: string;
  sourceArtifacts: {
    reviewCandidateRecordsLatestPath: string;
    reviewInputPath: string;
  };
  reviewedRecords: LiveReceiptCaptureRecord[];
  rejectedRecords: LiveReceiptCaptureRecord[];
  undecidedCapturedRecords: LiveReceiptCaptureRecord[];
  blockedCandidates: ReviewCandidateRecordsPacket['blockedCandidates'];
};

type TemplateActionSnapshot = {
  attempted: number | null;
  succeeded: number | null;
  failed: number | null;
  skipped: number | null;
};

type ReviewInputTemplateDecision = {
  captureId: string;
  appId: string;
  status: 'pending' | 'reviewed' | 'rejected';
  reviewedBy: string;
  reviewedAt: string;
  reviewSummary: string;
  reviewNotes: string;
  requirementTitle: string;
  requiresActionSnapshot: boolean;
  templateHint: string;
  screenshotLabel?: string;
  sourcePageUrl?: string;
  sourcePageLabel?: string;
  actionSnapshot?: TemplateActionSnapshot;
};

type ReviewInputTemplatePacket = {
  mode: 'shopflow_live_review_input_template';
  checkedAt: string;
  sourceArtifacts: {
    reviewCandidateRecordsLatestPath: string;
    reviewedRecordsLatestPath?: string;
  };
  instructions: string[];
  decisions: ReviewInputTemplateDecision[];
  alreadyReviewedCaptureIds: string[];
  alreadyRejectedCaptureIds: string[];
  blockedCandidates: ReviewCandidateRecordsPacket['blockedCandidates'];
};

function readJsonFile<T>(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function buildRequirementByCaptureId() {
  const requirementByCaptureId = new Map<string, LiveReceiptAppRequirement>();

  for (const appId of [
    'ext-albertsons',
    'ext-kroger',
    'ext-amazon',
    'ext-costco',
    'ext-walmart',
    'ext-weee',
    'ext-target',
    'ext-temu',
  ] as const) {
    for (const requirement of getLiveReceiptAppRequirements(appId)) {
      requirementByCaptureId.set(requirement.captureId, requirement);
    }
  }

  return requirementByCaptureId;
}

function requiresActionCounts(requirement: LiveReceiptAppRequirement) {
  return requirement.requiredArtifacts.some(
    (artifact) => artifact.kind === 'action-counts'
  );
}

function createTemplateDecision(args: {
  capturedRecord: LiveReceiptCaptureRecord;
  requirement: LiveReceiptAppRequirement;
}) {
  const { capturedRecord, requirement } = args;
  const needsActionSnapshot = requiresActionCounts(requirement);

  return {
    captureId: capturedRecord.captureId,
    appId: capturedRecord.appId,
    status: 'pending',
    reviewedBy: '',
    reviewedAt: '',
    reviewSummary: '',
    reviewNotes: '',
    requirementTitle: requirement.title,
    requiresActionSnapshot: needsActionSnapshot,
    templateHint: needsActionSnapshot
      ? 'Fill reviewedBy, reviewSummary, and actionSnapshot, then switch status from pending to reviewed or rejected.'
      : 'Fill reviewedBy and reviewSummary, then switch status from pending to reviewed or rejected.',
    screenshotLabel: capturedRecord.screenshotLabel,
    sourcePageUrl: capturedRecord.sourcePageUrl,
    sourcePageLabel: capturedRecord.sourcePageLabel,
    actionSnapshot: needsActionSnapshot
      ? {
          attempted: null,
          succeeded: null,
          failed: null,
          skipped: null,
        }
      : undefined,
  } satisfies ReviewInputTemplateDecision;
}

export function createReviewInputTemplatePacket(args: {
  reviewCandidateRecordsPacket: ReviewCandidateRecordsPacket;
  reviewedRecordsPacket?: ReviewedRecordsPacket;
}) {
  const { reviewCandidateRecordsPacket, reviewedRecordsPacket } = args;
  const requirementByCaptureId = buildRequirementByCaptureId();
  const alreadyReviewedCaptureIds =
    reviewedRecordsPacket?.reviewedRecords.map((record) => record.captureId) ?? [];
  const alreadyRejectedCaptureIds =
    reviewedRecordsPacket?.rejectedRecords.map((record) => record.captureId) ?? [];
  const finalizedCaptureIds = new Set([
    ...alreadyReviewedCaptureIds,
    ...alreadyRejectedCaptureIds,
  ]);
  const capturedRecords = reviewCandidateRecordsPacket.capturedRecords.filter(
    (capturedRecord) => !finalizedCaptureIds.has(capturedRecord.captureId)
  );

  const decisions = capturedRecords.map((capturedRecord) => {
    const requirement = requirementByCaptureId.get(capturedRecord.captureId);
    if (!requirement) {
      throw new Error(
        `Missing live receipt requirement for captureId ${capturedRecord.captureId}.`
      );
    }

    return createTemplateDecision({
      capturedRecord,
      requirement,
    });
  });

  return {
    mode: 'shopflow_live_review_input_template',
    checkedAt: new Date().toISOString(),
    sourceArtifacts: {
      reviewCandidateRecordsLatestPath: '',
      reviewedRecordsLatestPath: undefined,
    },
    instructions: [
      'This file is safe to keep in pending state. The reviewed-record writer ignores pending decisions.',
      'For each capture you want to finalize, switch status from pending to reviewed or rejected and fill the required reviewer fields.',
      'Action-heavy captures must also fill actionSnapshot before they can be upgraded to reviewed.',
    ],
    decisions,
    alreadyReviewedCaptureIds,
    alreadyRejectedCaptureIds,
    blockedCandidates:
      reviewedRecordsPacket?.blockedCandidates ??
      reviewCandidateRecordsPacket.blockedCandidates,
  } satisfies ReviewInputTemplatePacket;
}

async function main() {
  const config = resolveShopflowLiveSessionConfig(process.env);
  const reviewCandidateRecordsLatestPath = resolve(
    config.artifactDirectory,
    'review-candidate-records-latest.json'
  );
  const reviewedRecordsLatestPath = resolve(
    config.artifactDirectory,
    'reviewed-records-latest.json'
  );

  if (!existsSync(reviewCandidateRecordsLatestPath)) {
    throw new Error(
      `Missing review-candidate records at ${reviewCandidateRecordsLatestPath}. Run \`pnpm exec tsx tooling/live/write-review-candidate-records.ts\` first.`
    );
  }

  const reviewCandidateRecordsPacket = readJsonFile<ReviewCandidateRecordsPacket>(
    reviewCandidateRecordsLatestPath
  );
  const reviewedRecordsPacket = existsSync(reviewedRecordsLatestPath)
    ? readJsonFile<ReviewedRecordsPacket>(reviewedRecordsLatestPath)
    : undefined;
  const packet = createReviewInputTemplatePacket({
    reviewCandidateRecordsPacket,
    reviewedRecordsPacket,
  });
  packet.sourceArtifacts.reviewCandidateRecordsLatestPath =
    reviewCandidateRecordsLatestPath;
  packet.sourceArtifacts.reviewedRecordsLatestPath = existsSync(
    reviewedRecordsLatestPath
  )
    ? reviewedRecordsLatestPath
    : undefined;

  const artifacts = writeLiveJsonArtifact(
    config,
    'review-input-template',
    packet
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        ...packet,
        artifacts,
      },
      null,
      2
    )}\n`
  );
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  await main();
}
