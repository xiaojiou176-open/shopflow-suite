import { z } from 'zod';
import { resolveLocaleDictionary, type AppLocale } from './locale';
import { actionKindValues } from './action-receipt';
import { capabilityIdValues } from './capabilities';
import {
  storeAppIdValues,
  type StoreAppId,
  type StoreTier,
  storeCatalog,
} from './store-catalog';
import {
  pageKindValues,
  storeIdValues,
  verifiedScopeValues,
  type StoreId,
  type VerifiedScope,
} from './detection-result';

export const liveReceiptPlanStatusValues = [
  'missing-live-receipt',
  'capture-in-progress',
  'captured',
  'reviewed',
  'rejected',
  'expired',
] as const;

export type LiveReceiptPlanStatus =
  (typeof liveReceiptPlanStatusValues)[number];

export const liveReceiptOperatorStageValues = [
  'needs-capture',
  'capture-in-progress',
  'waiting-review',
  'reviewed',
] as const;

export type LiveReceiptOperatorStage =
  (typeof liveReceiptOperatorStageValues)[number];

export const liveReceiptOperatorPathValues = [
  'capture',
  'finish-capture',
  'review',
  'recapture',
  'complete',
] as const;

export type LiveReceiptOperatorPath =
  (typeof liveReceiptOperatorPathValues)[number];

export const liveReceiptArtifactKindValues = [
  'screenshot',
  'timestamp',
  'scope-proof',
  'outcome-summary',
  'action-counts',
  'operator-checklist',
] as const;

export type LiveReceiptArtifactKind =
  (typeof liveReceiptArtifactKindValues)[number];

export const liveReceiptArtifactRequirementSchema = z.object({
  kind: z.enum(liveReceiptArtifactKindValues),
  label: z.string().min(1),
});

export type LiveReceiptArtifactRequirement = z.infer<
  typeof liveReceiptArtifactRequirementSchema
>;

export const liveReceiptActionSnapshotSchema = z.object({
  attempted: z.number().int().nonnegative(),
  succeeded: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
});

export type LiveReceiptActionSnapshot = z.infer<
  typeof liveReceiptActionSnapshotSchema
>;

export const liveReceiptCapturePlanSchema = z.object({
  captureId: z.string().min(1),
  appId: z.enum(storeAppIdValues),
  storeId: z.enum(storeIdValues),
  verifiedScope: z.enum(verifiedScopeValues),
  pageKind: z.enum(pageKindValues),
  actionKind: z.enum(actionKindValues).optional(),
  status: z.enum(liveReceiptPlanStatusValues),
  tier: z
    .enum(['storefront-shell', 'capability-heavy-product'])
    .optional(),
  headline: z.string().min(1),
  blocker: z.string().min(1),
  requiredArtifacts: z.array(liveReceiptArtifactRequirementSchema).min(1),
  captureSteps: z.array(z.string().min(1)).min(1),
});

export type LiveReceiptCapturePlan = z.infer<
  typeof liveReceiptCapturePlanSchema
>;

export const liveReceiptCaptureRecordSchema = z
  .object({
    captureId: z.string().min(1),
    appId: z.enum(storeAppIdValues),
    storeId: z.enum(storeIdValues),
    verifiedScope: z.enum(verifiedScopeValues),
    pageKind: z.enum(pageKindValues),
    actionKind: z.enum(actionKindValues).optional(),
    capabilityId: z.enum(capabilityIdValues).optional(),
    status: z.enum(liveReceiptPlanStatusValues),
    summary: z.string().min(1),
    updatedAt: z.string().min(1),
    capturedAt: z.string().optional(),
    reviewedAt: z.string().optional(),
    reviewedBy: z.string().optional(),
    reviewSummary: z.string().optional(),
    reviewNotes: z.string().optional(),
    screenshotLabel: z.string().optional(),
    expiresAt: z.string().optional(),
    sourcePageUrl: z.string().url().optional(),
    sourcePageLabel: z.string().min(1).optional(),
    actionSnapshot: liveReceiptActionSnapshotSchema.optional(),
  })
  .superRefine((record, ctx) => {
    const requireField = (
      field:
        | 'capturedAt'
        | 'reviewedAt'
        | 'reviewedBy'
        | 'reviewSummary'
        | 'reviewNotes'
        | 'screenshotLabel'
        | 'expiresAt',
      message: string
    ) => {
      if (record[field]) {
        return;
      }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message,
      });
    };

    if (record.status === 'captured') {
      requireField(
        'capturedAt',
        'Captured evidence records must include capturedAt before they can wait for review.'
      );
      requireField(
        'screenshotLabel',
        'Captured evidence records must name the latest visual proof artifact.'
      );
    }

    if (record.status === 'reviewed') {
      requireField(
        'capturedAt',
        'Reviewed evidence records must retain the original capturedAt timestamp.'
      );
      requireField(
        'reviewedAt',
        'Reviewed evidence records must include reviewedAt.'
      );
      requireField(
        'reviewedBy',
        'Reviewed evidence records must identify the reviewer.'
      );
      requireField(
        'reviewSummary',
        'Reviewed evidence records must include a review summary.'
      );
      requireField(
        'screenshotLabel',
        'Reviewed evidence records must point at the visual proof artifact that was reviewed.'
      );
    }

    if (record.status === 'rejected') {
      requireField(
        'reviewedAt',
        'Rejected evidence records must include reviewedAt so the rejection is auditable.'
      );
      requireField(
        'reviewNotes',
        'Rejected evidence records must include reviewNotes explaining why recapture is required.'
      );
    }

    if (record.status === 'expired') {
      requireField(
        'expiresAt',
        'Expired evidence records must include expiresAt so operators know when trust lapsed.'
      );
    }
  });

export type LiveReceiptCaptureRecord = z.infer<
  typeof liveReceiptCaptureRecordSchema
>;

export const liveReceiptAppRequirementSchema = z.object({
  captureId: z.string().min(1),
  appId: z.enum(storeAppIdValues),
  title: z.string().min(1),
  storeId: z.enum(storeIdValues),
  verifiedScope: z.enum(verifiedScopeValues),
  pageKind: z.enum(pageKindValues),
  actionKind: z.enum(actionKindValues).optional(),
  capabilityId: z.enum(capabilityIdValues).optional(),
  missingSummary: z.string().min(1),
  operatorHint: z.string().min(1),
  requiredArtifacts: z.array(liveReceiptArtifactRequirementSchema).min(1),
  captureSteps: z.array(z.string().min(1)).min(1),
});

export type LiveReceiptAppRequirement = z.infer<
  typeof liveReceiptAppRequirementSchema
>;

export type LiveReceiptBlockerSummary = {
  appId: StoreAppId;
  title: string;
  note: string;
  captureIds: string[];
};

const liveReceiptTransitionMap: Record<
  LiveReceiptPlanStatus | 'untracked',
  readonly LiveReceiptPlanStatus[]
> = {
  untracked: ['missing-live-receipt', 'capture-in-progress', 'captured'],
  'missing-live-receipt': ['missing-live-receipt', 'capture-in-progress', 'captured'],
  'capture-in-progress': ['capture-in-progress', 'captured', 'missing-live-receipt'],
  captured: ['captured', 'reviewed', 'rejected', 'expired'],
  reviewed: ['reviewed', 'expired'],
  rejected: ['rejected', 'capture-in-progress', 'captured'],
  expired: ['expired', 'capture-in-progress', 'captured'],
};

export function defineLiveReceiptCapturePlan(
  plan: LiveReceiptCapturePlan
): LiveReceiptCapturePlan {
  return liveReceiptCapturePlanSchema.parse(plan);
}

export function summarizeLiveReceiptBlocker(
  plan: LiveReceiptCapturePlan
): string {
  const parsed = liveReceiptCapturePlanSchema.parse(plan);

  return `${parsed.headline} remains blocked until a live receipt bundle exists for ${parsed.verifiedScope}.`;
}

export function isLiveReceiptReadyStatus(status: LiveReceiptPlanStatus) {
  return status === 'reviewed';
}

export function getLiveReceiptPacketSummary(
  requirement: Pick<
    LiveReceiptAppRequirement,
    'requiredArtifacts' | 'captureSteps'
  >
) {
  return `${requirement.requiredArtifacts.length} required artifact${
    requirement.requiredArtifacts.length === 1 ? '' : 's'
  } · ${requirement.captureSteps.length} operator step${
    requirement.captureSteps.length === 1 ? '' : 's'
  }`;
}

export function getLiveReceiptNextStep(
  status: LiveReceiptPlanStatus,
  requirement: Pick<LiveReceiptAppRequirement, 'captureSteps'>
) {
  switch (status) {
    case 'missing-live-receipt':
      return requirement.captureSteps[0];
    case 'capture-in-progress':
      return (
        requirement.captureSteps[2] ??
        requirement.captureSteps[1] ??
        'Finish assembling the operator packet before marking it as captured.'
      );
    case 'captured':
      return 'Run the explicit review pass now. Captured evidence is still pending review and cannot support release wording yet.';
    case 'reviewed':
      return 'Keep the reviewed packet attached to release decisioning and recapture when trust expires.';
    case 'rejected':
      return 'Capture a fresh packet, then return it to review. Rejected evidence cannot support release wording.';
    case 'expired':
      return 'Capture a fresh packet and repeat review before using this workflow in release decisioning.';
  }
}

export function getLiveReceiptOperatorHint(
  requirement: Pick<LiveReceiptAppRequirement, 'operatorHint'>,
  record?: Pick<LiveReceiptCaptureRecord, 'status' | 'reviewNotes'>
) {
  if (!record) {
    return requirement.operatorHint;
  }

  switch (record.status) {
    case 'reviewed':
      return undefined;
    case 'captured':
      return 'Captured bundle is waiting for an explicit review pass before public claims can move forward.';
    case 'capture-in-progress':
      return 'Capture is in progress. Finish the operator checklist before marking the bundle as captured.';
    case 'rejected':
      return (
        record.reviewNotes ??
        'Evidence was rejected. Re-capture the bundle before release review.'
      );
    case 'expired':
      return 'Evidence expired. Capture a fresh reviewable bundle before release review.';
    case 'missing-live-receipt':
      return requirement.operatorHint;
  }
}

export function assertValidLiveReceiptTransition(
  previousStatus: LiveReceiptPlanStatus | undefined,
  nextStatus: LiveReceiptPlanStatus
) {
  const from = previousStatus ?? 'untracked';
  const allowedTargets = liveReceiptTransitionMap[from];

  if (allowedTargets.includes(nextStatus)) {
    return;
  }

  throw new Error(
    `Invalid live receipt transition: ${from} -> ${nextStatus}. Captured evidence must still pass explicit review before it can become reviewed.`
  );
}

export function needsLiveReceiptRecapture(status: LiveReceiptPlanStatus) {
  return (
    status === 'missing-live-receipt' ||
    status === 'rejected' ||
    status === 'expired'
  );
}

export function getLiveReceiptOperatorPath(
  status: LiveReceiptPlanStatus
): LiveReceiptOperatorPath {
  switch (status) {
    case 'missing-live-receipt':
      return 'capture';
    case 'capture-in-progress':
      return 'finish-capture';
    case 'captured':
      return 'review';
    case 'reviewed':
      return 'complete';
    case 'rejected':
    case 'expired':
      return 'recapture';
  }
}

type LiveReceiptLocaleCopy = {
  operatorPathLabels: Record<LiveReceiptOperatorPath, string>;
  statusLabels: Record<LiveReceiptPlanStatus, string>;
  itemSummary: Record<LiveReceiptPlanStatus, (title: string) => string>;
};

const liveReceiptLocaleDictionary: {
  en: LiveReceiptLocaleCopy;
  'zh-CN': Partial<LiveReceiptLocaleCopy>;
} = {
  en: {
    operatorPathLabels: {
      capture: 'Start first capture',
      'finish-capture': 'Finish in-progress capture',
      review: 'Run explicit review',
      recapture: 'Capture a fresh packet',
      complete: 'Keep reviewed evidence fresh',
    },
    statusLabels: {
      'missing-live-receipt': 'Missing live receipt',
      'capture-in-progress': 'Capture in progress',
      captured: 'Captured, pending review',
      reviewed: 'Reviewed',
      rejected: 'Rejected',
      expired: 'Expired',
    },
    itemSummary: {
      'missing-live-receipt': (title: string) =>
        `${title} still needs a fresh live receipt packet.`,
      'capture-in-progress': (title: string) =>
        `Operator packet assembly is still in progress for ${title}.`,
      captured: (title: string) =>
        `${title} was captured and is waiting for explicit review.`,
      reviewed: (title: string) =>
        `${title} already passed explicit review.`,
      rejected: (title: string) =>
        `${title} was rejected in review and needs a fresh packet.`,
      expired: (title: string) =>
        `${title} expired and must be recaptured before reuse.`,
    },
  },
  'zh-CN': {
    operatorPathLabels: {
      capture: '开始首次采集',
      'finish-capture': '完成进行中的采集',
      review: '执行明确审核',
      recapture: '采集新的证据包',
      complete: '保持已审核证据的新鲜度',
    },
    statusLabels: {
      'missing-live-receipt': '缺少 live receipt',
      'capture-in-progress': '采集中',
      captured: '已采集，等待审核',
      reviewed: '已审核',
      rejected: '已退回',
      expired: '已过期',
    },
    itemSummary: {
      'missing-live-receipt': (title: string) =>
        `${title} 仍然缺少新的 live receipt 证据包。`,
      'capture-in-progress': (title: string) =>
        `${title} 的操作员证据包仍在组装中。`,
      captured: (title: string) =>
        `${title} 已采集完成，但还在等待明确审核。`,
      reviewed: (title: string) =>
        `${title} 已完成明确审核。`,
      rejected: (title: string) =>
        `${title} 已在审核中被退回，需要重新采集。`,
      expired: (title: string) =>
        `${title} 已过期，复用前必须重新采集。`,
    },
  },
};

export function formatLiveReceiptOperatorPathLabel(
  path: LiveReceiptOperatorPath,
  locale: AppLocale = 'en'
): string {
  return resolveLocaleDictionary(liveReceiptLocaleDictionary, locale)
    .operatorPathLabels[path];
}

export function getLiveReceiptOperatorStage(
  status: LiveReceiptPlanStatus
): LiveReceiptOperatorStage {
  if (needsLiveReceiptRecapture(status)) {
    return 'needs-capture';
  }

  switch (status) {
    case 'capture-in-progress':
      return 'capture-in-progress';
    case 'captured':
      return 'waiting-review';
    case 'reviewed':
      return 'reviewed';
  }
}

export function formatLiveReceiptStatusLabel(
  status: LiveReceiptPlanStatus,
  locale: AppLocale = 'en'
): string {
  return resolveLocaleDictionary(liveReceiptLocaleDictionary, locale)
    .statusLabels[status];
}

export function formatLiveReceiptItemSummary(
  input: {
    title: string;
    status: LiveReceiptPlanStatus;
    summary?: string;
    reviewSummary?: string;
    reviewNotes?: string;
  },
  locale: AppLocale = 'en'
) {
  if (locale === 'en' && input.summary) {
    return input.summary;
  }

  if (input.status === 'rejected' && input.reviewNotes && locale === 'en') {
    return input.reviewNotes;
  }

  if (input.status === 'reviewed' && input.reviewSummary && locale === 'en') {
    return input.reviewSummary;
  }

  return resolveLocaleDictionary(liveReceiptLocaleDictionary, locale)
    .itemSummary[input.status](input.title);
}

function createRequiredArtifacts(
  verifiedScope: VerifiedScope,
  screenshotLabel: string,
  includeActionCounts: boolean
): LiveReceiptArtifactRequirement[] {
  return [
    {
      kind: 'screenshot',
      label: screenshotLabel,
    },
    {
      kind: 'timestamp',
      label: 'Execution timestamp',
    },
    {
      kind: 'scope-proof',
      label: `Verified scope proof for ${verifiedScope}`,
    },
    {
      kind: 'outcome-summary',
      label: 'Human-readable outcome summary',
    },
    {
      kind: 'operator-checklist',
      label: 'Operator packet checklist',
    },
    ...(includeActionCounts
      ? [
          {
            kind: 'action-counts' as const,
            label: 'Attempted / succeeded / failed / skipped counts',
          },
        ]
      : []),
  ];
}

function withTier(
  appId: StoreAppId,
  plan: Omit<LiveReceiptCapturePlan, 'tier'>
): LiveReceiptCapturePlan {
  const matchingEntry = Object.values(storeCatalog).find(
    (entry) => entry.appId === appId
  );

  return defineLiveReceiptCapturePlan({
    ...plan,
    tier: matchingEntry?.tier as StoreTier | undefined,
  });
}

export const liveReceiptCapturePlans = [
  withTier('ext-albertsons', {
    captureId: 'safeway-subscribe-live-receipt',
    appId: 'ext-albertsons',
    storeId: 'albertsons',
    verifiedScope: 'safeway',
    pageKind: 'cart',
    actionKind: 'schedule_save_subscribe',
    status: 'missing-live-receipt',
    headline: 'Safeway subscribe live receipt',
    blocker:
      'Public-ready Safeway subscribe claims remain blocked until a real live receipt bundle exists.',
    requiredArtifacts: createRequiredArtifacts(
      'safeway',
      'Live Safeway cart screenshot',
      true
    ),
    captureSteps: [
      'Reconfirm repo verification is green before opening a live Safeway cart session.',
      'Run the supported subscribe flow on a real Safeway cart page.',
      'Capture the screenshot, timestamp, scope proof, and action counts outside version control.',
      'Record the capture as captured, then require an explicit review pass before treating it as release evidence.',
    ],
  }),
  withTier('ext-albertsons', {
    captureId: 'safeway-cancel-live-receipt',
    appId: 'ext-albertsons',
    storeId: 'albertsons',
    verifiedScope: 'safeway',
    pageKind: 'manage',
    actionKind: 'schedule_save_cancel',
    status: 'missing-live-receipt',
    headline: 'Safeway cancel live receipt',
    blocker:
      'Public-ready Safeway cancel claims remain blocked until a real live receipt bundle exists.',
    requiredArtifacts: createRequiredArtifacts(
      'safeway',
      'Live Safeway manage-page screenshot',
      true
    ),
    captureSteps: [
      'Reconfirm repo verification is green before opening the live Safeway manage page.',
      'Run the supported cancel flow on a real Safeway manage surface.',
      'Capture the screenshot, timestamp, scope proof, and cancellation outcome outside version control.',
      'Record the capture as captured, then require an explicit review pass before treating it as release evidence.',
    ],
  }),
  withTier('ext-kroger', {
    captureId: 'fred-meyer-verified-scope-live-receipt',
    appId: 'ext-kroger',
    storeId: 'kroger',
    verifiedScope: 'fred-meyer',
    pageKind: 'product',
    status: 'missing-live-receipt',
    headline: 'Fred Meyer verified-scope live receipt',
    blocker:
      'Family-level Kroger wording remains blocked until Fred Meyer has a reviewable verified-scope live receipt bundle.',
    requiredArtifacts: createRequiredArtifacts(
      'fred-meyer',
      'Live Fred Meyer product or deal screenshot',
      false
    ),
    captureSteps: [
      'Reconfirm repo verification is green before opening a live Fred Meyer supported page.',
      'Capture a real Fred Meyer supported surface that proves the currently named verified scope.',
      'Record screenshot, timestamp, and verified-scope proof outside version control.',
      'Record the capture as captured, then require an explicit review pass before using it for family wording.',
    ],
  }),
  withTier('ext-kroger', {
    captureId: 'qfc-verified-scope-live-receipt',
    appId: 'ext-kroger',
    storeId: 'kroger',
    verifiedScope: 'qfc',
    pageKind: 'product',
    status: 'missing-live-receipt',
    headline: 'QFC verified-scope live receipt',
    blocker:
      'Family-level Kroger wording remains blocked until QFC has a reviewable verified-scope live receipt bundle.',
    requiredArtifacts: createRequiredArtifacts(
      'qfc',
      'Live QFC product or deal screenshot',
      false
    ),
    captureSteps: [
      'Reconfirm repo verification is green before opening a live QFC supported page.',
      'Capture a real QFC supported surface that proves the currently named verified scope.',
      'Record screenshot, timestamp, and verified-scope proof outside version control.',
      'Record the capture as captured, then require an explicit review pass before using it for family wording.',
    ],
  }),
  withTier('ext-temu', {
    captureId: 'temu-filter-live-receipt',
    appId: 'ext-temu',
    storeId: 'temu',
    verifiedScope: 'temu',
    pageKind: 'search',
    actionKind: 'filter_non_local_warehouse',
    status: 'missing-live-receipt',
    headline: 'Temu warehouse filter live receipt',
    blocker:
      'Public-facing Temu warehouse filter claims remain blocked until a real live receipt bundle exists.',
    requiredArtifacts: createRequiredArtifacts(
      'temu',
      'Live Temu search screenshot',
      true
    ),
    captureSteps: [
      'Reconfirm repo verification is green before opening a live Temu search page.',
      'Run the warehouse filter workflow on a real supported Temu search surface.',
      'Capture the screenshot, timestamp, scope proof, and filtering outcome outside version control.',
      'Record the capture as captured, then require an explicit review pass before treating it as release evidence.',
    ],
  }),
] as const satisfies readonly LiveReceiptCapturePlan[];

export const liveReceiptCapturePlansByAppId = storeAppIdValues.reduce(
  (acc, appId) => {
    acc[appId] = liveReceiptCapturePlans.filter((plan) => plan.appId === appId);
    return acc;
  },
  {} as Record<StoreAppId, LiveReceiptCapturePlan[]>
);

export function getLiveReceiptCapturePlans(appId: StoreAppId) {
  return liveReceiptCapturePlansByAppId[appId];
}

export function getLiveReceiptVerifiedScopesForStore(storeId: StoreId) {
  return liveReceiptCapturePlans
    .filter((plan) => plan.storeId === storeId)
    .map((plan) => plan.verifiedScope);
}

export function createLiveReceiptAppRequirement(
  plan: LiveReceiptCapturePlan
): LiveReceiptAppRequirement {
  const parsed = liveReceiptCapturePlanSchema.parse(plan);

  return liveReceiptAppRequirementSchema.parse({
    captureId: parsed.captureId,
    appId: parsed.appId,
    title: parsed.headline,
    storeId: parsed.storeId,
    verifiedScope: parsed.verifiedScope,
    pageKind: parsed.pageKind,
    actionKind: parsed.actionKind,
    missingSummary: summarizeLiveReceiptBlocker(parsed),
    operatorHint: parsed.captureSteps[0],
    requiredArtifacts: parsed.requiredArtifacts,
    captureSteps: parsed.captureSteps,
  });
}

export function getLiveReceiptAppRequirements(
  appId: StoreAppId
): LiveReceiptAppRequirement[] {
  return getLiveReceiptCapturePlans(appId).map((plan) =>
    createLiveReceiptAppRequirement(plan)
  );
}

const blockerSummaryByAppId: Partial<
  Record<StoreAppId, Omit<LiveReceiptBlockerSummary, 'appId' | 'captureIds'>>
> = {
  'ext-albertsons': {
    title: 'Safeway subscribe / cancel live receipt',
    note: 'Action-heavy public claims remain blocked until reviewable Safeway subscribe and cancel bundles exist.',
  },
  'ext-kroger': {
    title: 'Fred Meyer + QFC verified-scope evidence',
    note: 'Family-level public wording remains blocked until reviewable verified-scope evidence exists for both currently named banners.',
  },
  'ext-temu': {
    title: 'Temu warehouse filter live evidence',
    note: 'Differentiated workflow public wording remains blocked until a live receipt bundle exists.',
  },
};

export function getLiveReceiptBlockerSummaries(): LiveReceiptBlockerSummary[] {
  return Object.entries(blockerSummaryByAppId).map(([appId, summary]) => ({
    appId: appId as StoreAppId,
    title: summary!.title,
    note: summary!.note,
    captureIds: getLiveReceiptCapturePlans(appId as StoreAppId).map(
      (plan) => plan.captureId
    ),
  }));
}

export function createMissingLiveReceiptRecord(
  requirement: LiveReceiptAppRequirement,
  updatedAt: string
): LiveReceiptCaptureRecord {
  const parsed = liveReceiptAppRequirementSchema.parse(requirement);

  return liveReceiptCaptureRecordSchema.parse({
    captureId: parsed.captureId,
    appId: parsed.appId,
    storeId: parsed.storeId,
    verifiedScope: parsed.verifiedScope,
    pageKind: parsed.pageKind,
    actionKind: parsed.actionKind,
    capabilityId: parsed.capabilityId,
    status: 'missing-live-receipt',
    summary: parsed.missingSummary,
    updatedAt,
  });
}
