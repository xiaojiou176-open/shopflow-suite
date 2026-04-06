import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  getLiveReceiptAppRequirements,
  liveReceiptCaptureRecordSchema,
  type LiveReceiptAppRequirement,
  type LiveReceiptCaptureRecord,
} from '@shopflow/contracts';
import { resolveShopflowLiveSessionConfig, writeLiveJsonArtifact } from './shared';

type OperatorCapturePacket = {
  checkedAt: string;
  sourceArtifacts: {
    operatorCapturePacketPath?: string;
  };
  captureCandidates: Array<{
    captureId: string;
    appId: string;
    status: 'capture-ready' | 'blocked';
    classification: string;
    finalUrl?: string;
    title?: string;
    screenshotLabel?: string;
    screenshotPath?: string;
    blockerReason?: string;
  }>;
};

type ReviewCandidateRecordsPacket = {
  mode: 'shopflow_live_review_candidate_records';
  checkedAt: string;
  sourceArtifacts: {
    operatorCapturePacketLatestPath: string;
  };
  capturedRecords: LiveReceiptCaptureRecord[];
  blockedCandidates: OperatorCapturePacket['captureCandidates'];
};

function readJsonFile<T>(path: string) {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function createCapturedRecord(
  requirement: LiveReceiptAppRequirement,
  candidate: OperatorCapturePacket['captureCandidates'][number],
  capturedAt: string
) {
  return liveReceiptCaptureRecordSchema.parse({
    captureId: requirement.captureId,
    appId: requirement.appId,
    storeId: requirement.storeId,
    verifiedScope: requirement.verifiedScope,
    pageKind: requirement.pageKind,
    actionKind: requirement.actionKind,
    capabilityId: requirement.capabilityId,
    status: 'captured',
    summary: `${requirement.title} review candidate prepared from the live operator packet and waiting for explicit review.`,
    updatedAt: capturedAt,
    capturedAt,
    screenshotLabel: candidate.screenshotLabel,
    sourcePageUrl: candidate.finalUrl,
    sourcePageLabel: candidate.title,
  });
}

export function createReviewCandidateRecordsPacket(args: {
  operatorCapturePacket: OperatorCapturePacket;
}) {
  const { operatorCapturePacket } = args;
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

  const capturedRecords = operatorCapturePacket.captureCandidates
    .filter((candidate) => candidate.status === 'capture-ready')
    .map((candidate) => {
      const requirement = requirementByCaptureId.get(candidate.captureId);
      if (!requirement) {
        throw new Error(
          `Missing live receipt requirement for captureId ${candidate.captureId}.`
        );
      }

      return createCapturedRecord(
        requirement,
        candidate,
        operatorCapturePacket.checkedAt
      );
    });

  return {
    mode: 'shopflow_live_review_candidate_records',
    checkedAt: new Date().toISOString(),
    sourceArtifacts: {
      operatorCapturePacketLatestPath: '',
    },
    capturedRecords,
    blockedCandidates: operatorCapturePacket.captureCandidates.filter(
      (candidate) => candidate.status !== 'capture-ready'
    ),
  } satisfies ReviewCandidateRecordsPacket;
}

async function main() {
  const config = resolveShopflowLiveSessionConfig(process.env);
  const operatorCapturePacketLatestPath = resolve(
    config.artifactDirectory,
    'operator-capture-packet-latest.json'
  );

  if (!existsSync(operatorCapturePacketLatestPath)) {
    throw new Error(
      `Missing operator capture packet at ${operatorCapturePacketLatestPath}. Run \`pnpm exec tsx tooling/live/write-operator-capture-packet.ts\` first.`
    );
  }

  const operatorCapturePacket = readJsonFile<OperatorCapturePacket>(
    operatorCapturePacketLatestPath
  );
  const packet = createReviewCandidateRecordsPacket({ operatorCapturePacket });
  packet.sourceArtifacts.operatorCapturePacketLatestPath =
    operatorCapturePacketLatestPath;

  const artifacts = writeLiveJsonArtifact(
    config,
    'review-candidate-records',
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
