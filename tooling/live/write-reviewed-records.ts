import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  getLiveReceiptAppRequirements,
  liveReceiptCaptureRecordSchema,
  type LiveReceiptActionSnapshot,
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

type ReviewDecisionStatus = 'pending' | 'reviewed' | 'rejected';

type ReviewDecision = {
  captureId: string;
  status: ReviewDecisionStatus;
  reviewedBy: string;
  reviewedAt?: string;
  reviewSummary?: string;
  reviewNotes?: string;
  actionSnapshot?: LiveReceiptActionSnapshot;
};

type ReviewInputPacket = {
  decisions: ReviewDecision[];
};

type ReviewedRecordsPacket = {
  mode: 'shopflow_live_reviewed_records';
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

type ParsedArgs = {
  reviewInputPath: string;
};

export function readJsonFile<T>(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function parseReviewedRecordsArgs(argv: string[]): ParsedArgs {
  let reviewInputPath: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--review-input') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Missing value after --review-input');
      }
      reviewInputPath = resolve(value);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!reviewInputPath) {
    throw new Error(
      'Missing --review-input <path>. Provide a repo-local JSON file with explicit review decisions.'
    );
  }

  return { reviewInputPath };
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

function applyReviewDecision(args: {
  capturedRecord: LiveReceiptCaptureRecord;
  requirement: LiveReceiptAppRequirement;
  decision: ReviewDecision;
}) {
  const { capturedRecord, requirement, decision } = args;
  const reviewedAt = decision.reviewedAt ?? new Date().toISOString();

  if (decision.status === 'reviewed') {
    if (!decision.reviewSummary) {
      throw new Error(
        `Reviewed decision for ${decision.captureId} requires reviewSummary.`
      );
    }

    if (requiresActionCounts(requirement) && !decision.actionSnapshot) {
      throw new Error(
        `Reviewed decision for ${decision.captureId} requires actionSnapshot because the capture checklist includes action-counts.`
      );
    }

    return liveReceiptCaptureRecordSchema.parse({
      ...capturedRecord,
      status: 'reviewed',
      summary: decision.reviewSummary,
      updatedAt: reviewedAt,
      reviewedAt,
      reviewedBy: decision.reviewedBy,
      reviewSummary: decision.reviewSummary,
      actionSnapshot: decision.actionSnapshot ?? capturedRecord.actionSnapshot,
    });
  }

  if (!decision.reviewNotes) {
    throw new Error(
      `Rejected decision for ${decision.captureId} requires reviewNotes.`
    );
  }

  return liveReceiptCaptureRecordSchema.parse({
    ...capturedRecord,
    status: 'rejected',
    summary: decision.reviewNotes,
    updatedAt: reviewedAt,
    reviewedAt,
    reviewedBy: decision.reviewedBy,
    reviewNotes: decision.reviewNotes,
    actionSnapshot: decision.actionSnapshot ?? capturedRecord.actionSnapshot,
  });
}

export function createReviewedRecordsPacket(args: {
  reviewCandidateRecordsPacket: ReviewCandidateRecordsPacket;
  reviewInputPacket: ReviewInputPacket;
  existingReviewedRecordsPacket?: ReviewedRecordsPacket;
}) {
  const {
    reviewCandidateRecordsPacket,
    reviewInputPacket,
    existingReviewedRecordsPacket,
  } = args;
  const requirementByCaptureId = buildRequirementByCaptureId();
  const capturedRecordByCaptureId = new Map(
    reviewCandidateRecordsPacket.capturedRecords.map((record) => [
      record.captureId,
      record,
    ] as const)
  );
  const decisionByCaptureId = new Map<string, ReviewDecision>();
  const overriddenCaptureIds = new Set<string>();

  for (const decision of reviewInputPacket.decisions) {
    if (decisionByCaptureId.has(decision.captureId)) {
      throw new Error(
        `Duplicate review decision for captureId ${decision.captureId}.`
      );
    }
    if (!capturedRecordByCaptureId.has(decision.captureId)) {
      throw new Error(
        `Review decision references uncaptured captureId ${decision.captureId}.`
      );
    }
    decisionByCaptureId.set(decision.captureId, decision);
    overriddenCaptureIds.add(decision.captureId);
  }

  const reviewedRecords = [
    ...(existingReviewedRecordsPacket?.reviewedRecords.filter(
      (record) => !overriddenCaptureIds.has(record.captureId)
    ) ?? []),
  ];
  const rejectedRecords = [
    ...(existingReviewedRecordsPacket?.rejectedRecords.filter(
      (record) => !overriddenCaptureIds.has(record.captureId)
    ) ?? []),
  ];
  const undecidedCapturedRecords: LiveReceiptCaptureRecord[] = [];

  for (const capturedRecord of reviewCandidateRecordsPacket.capturedRecords) {
    const decision = decisionByCaptureId.get(capturedRecord.captureId);
    if (!decision) {
      if (
        reviewedRecords.some((record) => record.captureId === capturedRecord.captureId) ||
        rejectedRecords.some((record) => record.captureId === capturedRecord.captureId)
      ) {
        continue;
      }
      undecidedCapturedRecords.push(capturedRecord);
      continue;
    }

    if (decision.status === 'pending') {
      undecidedCapturedRecords.push(capturedRecord);
      continue;
    }

    const requirement = requirementByCaptureId.get(capturedRecord.captureId);
    if (!requirement) {
      throw new Error(
        `Missing live receipt requirement for captureId ${capturedRecord.captureId}.`
      );
    }

    const nextRecord = applyReviewDecision({
      capturedRecord,
      requirement,
      decision,
    });

    if (nextRecord.status === 'reviewed') {
      reviewedRecords.push(nextRecord);
      continue;
    }

    rejectedRecords.push(nextRecord);
  }

  return {
    mode: 'shopflow_live_reviewed_records',
    checkedAt: new Date().toISOString(),
    sourceArtifacts: {
      reviewCandidateRecordsLatestPath: '',
      reviewInputPath: '',
    },
    reviewedRecords,
    rejectedRecords,
    undecidedCapturedRecords,
    blockedCandidates: reviewCandidateRecordsPacket.blockedCandidates,
  } satisfies ReviewedRecordsPacket;
}

async function main() {
  const parsedArgs = parseReviewedRecordsArgs(process.argv.slice(2));
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

  if (!existsSync(parsedArgs.reviewInputPath)) {
    throw new Error(
      `Missing review input JSON at ${parsedArgs.reviewInputPath}.`
    );
  }

  const reviewCandidateRecordsPacket = readJsonFile<ReviewCandidateRecordsPacket>(
    reviewCandidateRecordsLatestPath
  );
  const existingReviewedRecordsPacket = existsSync(reviewedRecordsLatestPath)
    ? readJsonFile<ReviewedRecordsPacket>(reviewedRecordsLatestPath)
    : undefined;
  const reviewInputPacket = readJsonFile<ReviewInputPacket>(
    parsedArgs.reviewInputPath
  );
  const packet = createReviewedRecordsPacket({
    reviewCandidateRecordsPacket,
    reviewInputPacket,
    existingReviewedRecordsPacket,
  });
  packet.sourceArtifacts.reviewCandidateRecordsLatestPath =
    reviewCandidateRecordsLatestPath;
  packet.sourceArtifacts.reviewInputPath = parsedArgs.reviewInputPath;

  const artifacts = writeLiveJsonArtifact(config, 'reviewed-records', packet);

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
