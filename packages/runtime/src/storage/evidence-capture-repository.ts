import {
  assertValidLiveReceiptTransition,
  createMissingLiveReceiptRecord,
  formatLiveReceiptOperatorPathLabel,
  getLiveReceiptOperatorStage,
  getLiveReceiptOperatorPath,
  liveReceiptOperatorPathValues,
  getLiveReceiptNextStep,
  liveReceiptCaptureRecordSchema,
  liveReceiptPlanStatusValues,
  storeAppIdValues,
  type LiveReceiptAppRequirement,
  type LiveReceiptCaptureRecord,
  type LiveReceiptOperatorPath,
} from '@shopflow/contracts';
import { z } from 'zod';

export type EvidenceCaptureStatus = (typeof liveReceiptPlanStatusValues)[number];
export type EvidenceCaptureRecord = LiveReceiptCaptureRecord;
export type EvidenceCaptureQueueSummary = {
  appId: string;
  totalCount: number;
  needsCaptureCount: number;
  captureCount: number;
  recaptureCount: number;
  missingCount: number;
  captureInProgressCount: number;
  reviewPendingCount: number;
  reviewedCount: number;
  rejectedCount: number;
  expiredCount: number;
  blockerSummary: string;
  nextCaptureId?: string;
  nextStatus?: EvidenceCaptureStatus;
  nextOperatorPath?: LiveReceiptOperatorPath;
  nextRequirementTitle?: string;
  nextStep?: string;
  nextSourcePageUrl?: string;
  nextSourcePageLabel?: string;
  nextSourceRouteLabel?: string;
};

export const evidenceCaptureQueueSummarySchema = z
  .object({
    appId: z.enum(storeAppIdValues),
  })
  .extend({
    totalCount: z.number().int().nonnegative(),
    needsCaptureCount: z.number().int().nonnegative(),
    captureCount: z.number().int().nonnegative(),
    recaptureCount: z.number().int().nonnegative(),
    missingCount: z.number().int().nonnegative(),
    captureInProgressCount: z.number().int().nonnegative(),
    reviewPendingCount: z.number().int().nonnegative(),
    reviewedCount: z.number().int().nonnegative(),
    rejectedCount: z.number().int().nonnegative(),
    expiredCount: z.number().int().nonnegative(),
    blockerSummary: z.string().min(1),
    nextCaptureId: z.string().min(1).optional(),
    nextStatus: z.enum(liveReceiptPlanStatusValues).optional(),
    nextOperatorPath: z.enum(liveReceiptOperatorPathValues).optional(),
    nextRequirementTitle: z.string().min(1).optional(),
    nextStep: z.string().min(1).optional(),
    nextSourcePageUrl: z.string().url().optional(),
    nextSourcePageLabel: z.string().min(1).optional(),
    nextSourceRouteLabel: z.string().min(1).optional(),
  });

type EvidenceCaptureRequirementLike = Pick<
  LiveReceiptAppRequirement,
  'captureId'
> &
  Partial<Pick<LiveReceiptAppRequirement, 'title' | 'captureSteps'>>;

type NormalizedEvidenceCaptureItem = {
  captureId: string;
  status: EvidenceCaptureStatus;
  index: number;
  operatorPath: LiveReceiptOperatorPath;
  record?: EvidenceCaptureRecord;
  requirement?: EvidenceCaptureRequirementLike;
};

export interface EvidenceStorageAreaLike {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

export const evidenceCaptureStorageKeyPrefix = 'shopflow.liveEvidence';

export class EvidenceCaptureRepository {
  constructor(
    private readonly storage: EvidenceStorageAreaLike,
    private readonly storageKeyPrefix = evidenceCaptureStorageKeyPrefix
  ) {}

  async list(appId: string): Promise<EvidenceCaptureRecord[]> {
    const value = (await this.storage.get<unknown>(this.keyFor(appId))) ?? [];
    return liveReceiptCaptureRecordSchema.array().parse(value);
  }

  async upsert(record: EvidenceCaptureRecord): Promise<void> {
    const parsed = liveReceiptCaptureRecordSchema.parse(record);
    const current = await this.list(parsed.appId);
    const previous = current.find(({ captureId }) => captureId === parsed.captureId);

    assertValidLiveReceiptTransition(previous?.status, parsed.status);

    const next = [
      parsed,
      ...current.filter(({ captureId }) => captureId !== parsed.captureId),
    ];

    await this.storage.set(this.keyFor(parsed.appId), next);
  }

  async seedMissing(
    requirements: readonly LiveReceiptAppRequirement[],
    updatedAt: string
  ): Promise<void> {
    for (const requirement of requirements) {
      const current = await this.list(requirement.appId);
      if (current.some(({ captureId }) => captureId === requirement.captureId)) {
        continue;
      }

      await this.upsert(createMissingLiveReceiptRecord(requirement, updatedAt));
    }
  }

  async summarize(
    appId: string,
    requirements: readonly EvidenceCaptureRequirementLike[] = []
  ): Promise<EvidenceCaptureQueueSummary> {
    const current = await this.list(appId);
    const currentByCaptureId = new Map(
      current.map((record) => [record.captureId, record] as const)
    );
    const requirementsByCaptureId = new Map(
      requirements.map(
        (requirement) => [requirement.captureId, requirement] as const
      )
    );
    const orderedCaptureIds =
      requirements.length > 0
        ? requirements.map((requirement) => requirement.captureId)
        : current.map((record) => record.captureId);
    const normalized: NormalizedEvidenceCaptureItem[] = orderedCaptureIds.map(
      (captureId, index) => {
        const record = currentByCaptureId.get(captureId);
        const status = record?.status ?? 'missing-live-receipt';

        return {
          captureId,
          status,
          index,
          operatorPath: getLiveReceiptOperatorPath(status),
          record,
          requirement: requirementsByCaptureId.get(captureId),
        };
      }
    );
    const next = normalized
      .sort((left, right) => {
        const operatorPathPriority: Record<
          LiveReceiptOperatorPath,
          number
        > = {
          'finish-capture': 0,
          review: 1,
          recapture: 2,
          capture: 3,
          complete: 4,
        };

        return (
          operatorPathPriority[left.operatorPath] -
            operatorPathPriority[right.operatorPath] ||
          left.index - right.index
        );
      })
      .find(({ status }) => status !== 'reviewed');
    const captureCount = normalized.filter(
      ({ operatorPath }) => operatorPath === 'capture'
    ).length;
    const recaptureCount = normalized.filter(
      ({ operatorPath }) => operatorPath === 'recapture'
    ).length;
    const nextRequirement = next?.requirement;
    const nextStep =
      next && nextRequirement?.captureSteps?.length
        ? getLiveReceiptNextStep(next.status, {
            captureSteps: nextRequirement.captureSteps,
          })
        : undefined;
    const nextSourceRoute = createNextSourceRoute(next);

    return {
      appId,
      totalCount: normalized.length,
      needsCaptureCount: normalized.filter(
        ({ status }) => getLiveReceiptOperatorStage(status) === 'needs-capture'
      ).length,
      captureCount,
      recaptureCount,
      missingCount: normalized.filter(
        ({ status }) => status === 'missing-live-receipt'
      ).length,
      captureInProgressCount: normalized.filter(
        ({ status }) =>
          getLiveReceiptOperatorStage(status) === 'capture-in-progress'
      ).length,
      reviewPendingCount: normalized.filter(
        ({ status }) => getLiveReceiptOperatorStage(status) === 'waiting-review'
      ).length,
      reviewedCount: normalized.filter(
        ({ status }) => getLiveReceiptOperatorStage(status) === 'reviewed'
      ).length,
      rejectedCount: normalized.filter(({ status }) => status === 'rejected')
        .length,
      expiredCount: normalized.filter(({ status }) => status === 'expired')
        .length,
      blockerSummary: createBlockerSummary(appId, normalized, next),
      nextCaptureId: next?.captureId,
      nextStatus: next?.status,
      nextOperatorPath: next?.operatorPath,
      nextRequirementTitle: nextRequirement?.title,
      nextStep,
      nextSourcePageUrl: nextSourceRoute.sourcePageUrl,
      nextSourcePageLabel: nextSourceRoute.sourcePageLabel,
      nextSourceRouteLabel: nextSourceRoute.sourceRouteLabel,
    };
  }

  keyFor(appId: string) {
    return `${this.storageKeyPrefix}.${appId}`;
  }
}

function createBlockerSummary(
  appId: string,
  normalized: readonly NormalizedEvidenceCaptureItem[],
  next?: NormalizedEvidenceCaptureItem
) {
  if (normalized.length === 0) {
    return `No live receipt requirements are tracked for ${appId}.`;
  }

  const inProgressCount = normalized.filter(
    ({ operatorPath }) => operatorPath === 'finish-capture'
  ).length;
  const reviewCount = normalized.filter(
    ({ operatorPath }) => operatorPath === 'review'
  ).length;
  const recaptureCount = normalized.filter(
    ({ operatorPath }) => operatorPath === 'recapture'
  ).length;
  const captureCount = normalized.filter(
    ({ operatorPath }) => operatorPath === 'capture'
  ).length;

  if (inProgressCount + reviewCount + recaptureCount + captureCount === 0) {
    return `All required live receipt packets for ${appId} are reviewed. Keep the accepted bundle attached to release decisioning until trust expires.`;
  }

  const parts = [
    inProgressCount > 0
      ? `${formatCount(inProgressCount, 'packet')} already started and still need capture completion`
      : undefined,
    reviewCount > 0
      ? `${formatCount(reviewCount, 'packet')} are reviewable and still waiting for explicit review`
      : undefined,
    recaptureCount > 0
      ? `${formatCount(recaptureCount, 'packet')} need a fresh recapture after rejection or expiry`
      : undefined,
    captureCount > 0
      ? `${formatCount(captureCount, 'packet')} still need a first capture`
      : undefined,
  ].filter((part): part is string => Boolean(part));

  const nextPathSummary =
    next?.operatorPath && next.requirement?.title
      ? ` Next operator path: ${formatLiveReceiptOperatorPathLabel(next.operatorPath)} for ${next.requirement.title}.`
      : '';

  return `App-level live receipt blocker remains because ${joinParts(parts)}.${nextPathSummary}`;
}

function createNextSourceRoute(next?: NormalizedEvidenceCaptureItem) {
  if (!next?.record?.sourcePageUrl) {
    return {
      sourcePageUrl: undefined,
      sourcePageLabel: undefined,
      sourceRouteLabel: undefined,
    };
  }

  return {
    sourcePageUrl: next.record.sourcePageUrl,
    sourcePageLabel: next.record.sourcePageLabel,
    sourceRouteLabel: formatNextSourceRouteLabel(next.operatorPath),
  };
}

function formatNextSourceRouteLabel(path: LiveReceiptOperatorPath) {
  switch (path) {
    case 'finish-capture':
      return 'Resume recorded capture page';
    case 'review':
      return 'Open recorded capture page';
    case 'recapture':
      return 'Re-open prior capture page';
    case 'complete':
      return 'Open recorded proof page';
    case 'capture':
      return undefined;
  }
}

function formatCount(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function joinParts(parts: readonly string[]) {
  if (parts.length <= 1) {
    return parts[0] ?? '';
  }

  if (parts.length === 2) {
    return `${parts[0]} and ${parts[1]}`;
  }

  return `${parts.slice(0, -1).join(', ')}, and ${parts.at(-1)}`;
}
