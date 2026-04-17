import {
  formatLiveReceiptOperatorPathLabel,
  formatLiveReceiptStatusLabel,
  getLiveReceiptAppRequirements,
  getLiveReceiptNextStep,
  getLiveReceiptOperatorHint,
  getLiveReceiptOperatorPath,
  needsLiveReceiptRecapture,
  operatorDecisionBriefSchema,
  type BuilderRouteOrigin,
  type OperatorDecisionBrief,
  type StoreAppId,
} from '@shopflow/contracts';
import type {
  ActivityItem,
  DetectionRecord,
  EvidenceCaptureRecord,
  LatestOutputRecord,
} from '@shopflow/runtime';
import {
  loadSuiteControlPlaneSource,
  type SuiteControlPlaneRepositories,
} from '@shopflow/runtime';
import {
  formatLatestOutputDetailLines,
  formatLatestOutputSummary,
  formatRecentActivityLabel,
  formatRecentActivitySummary,
} from './ui-locale';
import { getShopflowLocaleCatalog, type ShopflowLocale } from './locale';

export type SuiteCatalogItem = {
  appId: StoreAppId;
  title: string;
  wave: string;
  state: string;
  stateLabel: string;
  note: string;
  defaultRouteUrl: string;
  defaultRouteLabel: string;
  defaultRouteSummary: string;
};

export type SuiteDetailSource = {
  detection?: DetectionRecord;
  recentActivities: ActivityItem[];
  latestOutput?: LatestOutputRecord;
  evidenceRecords: EvidenceCaptureRecord[];
};

export type SuiteDetailModel = {
  decisionStage: OperatorDecisionBrief['stage'];
  latestDetection: string;
  latestActivity: string;
  latestActivityHref?: string;
  latestOutput: string;
  latestOutputHref?: string;
  routeLabel: string;
  routeHref: string;
  routeSummary: string;
  routeOrigin:
    | 'merchant-source'
    | 'captured-page'
    | 'detected-page'
    | 'default-route';
  operatorDecisionBrief: OperatorDecisionBrief;
  attentionState:
    | 'waiting-for-review'
    | 'needs-capture'
    | 'ready-to-inspect'
    | 'seed-runtime';
  evidenceCounts: {
    captureWork: number;
    waitingForReview: number;
    reviewed: number;
  };
  evidenceQueue: string;
  priorityQueueItem?: {
    title: string;
    operatorPathLabel: string;
    statusLabel: string;
    note: string;
    actionLabel: string;
    href: string;
  };
  evidenceItems: Array<{
    title: string;
    statusLabel: string;
    note: string;
    actionLabel: string;
    href: string;
  }>;
  evidenceSections: Array<{
    title: string;
    count: number;
    items: Array<{
      title: string;
      statusLabel: string;
      note: string;
      actionLabel: string;
      href: string;
    }>;
  }>;
  nextStep: string;
};

type EvidenceItemStatus = EvidenceCaptureRecord['status'];
type SuiteRouteSurfaceKind =
  | 'latestSourcePage'
  | 'latestCapturedPage'
  | 'latestDetectedPage'
  | 'evidenceSourcePage'
  | 'captureSourcePage'
  | 'defaultStoreRoute';

function localizeSuiteShellText(
  text: string,
  locale: ShopflowLocale = 'en'
) {
  if (locale !== 'zh-CN') {
    return text;
  }

  return text
    .replace(
      'Reconfirm repo verification is green before opening the live Safeway cart session.',
      '在打开 live Safeway cart session 之前，先重新确认 repo 验证仍然是绿色。'
    )
    .replace(
      'Reconfirm repo verification is green before opening the live Safeway manage page.',
      '在打开 live Safeway manage 页面之前，先重新确认 repo 验证仍然是绿色。'
    )
    .replace(/No fresh page context exists yet\./g, '当前还没有新的页面上下文。')
    .replace(/public wording/g, '公开说法')
    .replace(/live proof/g, '实时证明')
    .replace(/live receipt/g, '实时证据')
    .replace(/\brepo verification\b/g, 'repo 验证')
    .replace(/\brepo-verified\b/g, 'repo 已验证')
    .replace(/\brepo\b/g, '仓内')
    .replace(/\blive\b/g, '实时');
}

export function createSuiteDetailModel(
  item: SuiteCatalogItem,
  source: SuiteDetailSource,
  locale: ShopflowLocale = 'en'
): SuiteDetailModel {
  const copy = getShopflowLocaleCatalog(locale).suite;
  const latestActivity = source.recentActivities[0];
  const requirements = getLiveReceiptAppRequirements(item.appId);

  const missingCount = requirements.filter((requirement) => {
    const record = source.evidenceRecords.find(
      ({ captureId }) => captureId === requirement.captureId
    );
    return !record || record.status === 'missing-live-receipt';
  }).length;
  const captureInProgressCount = requirements.filter((requirement) => {
    const record = source.evidenceRecords.find(
      ({ captureId }) => captureId === requirement.captureId
    );
    return record?.status === 'capture-in-progress';
  }).length;
  const reviewPendingCount = requirements.filter((requirement) => {
    const record = source.evidenceRecords.find(
      ({ captureId }) => captureId === requirement.captureId
    );
    return record?.status === 'captured';
  }).length;
  const reviewedCount = requirements.filter((requirement) => {
    const record = source.evidenceRecords.find(
      ({ captureId }) => captureId === requirement.captureId
    );
    return record?.status === 'reviewed';
  }).length;
  const reviewOutcomeNeedsRecaptureCount = requirements.filter((requirement) => {
    const record = source.evidenceRecords.find(
      ({ captureId }) => captureId === requirement.captureId
    );
    return record != null && needsLiveReceiptRecapture(record.status);
  }).length;
  const captureWorkCount =
    missingCount + captureInProgressCount + reviewOutcomeNeedsRecaptureCount;

  const evidenceItems: Array<{
    title: string;
    statusLabel: string;
    note: string;
    status: EvidenceItemStatus;
    operatorPath: ReturnType<typeof getLiveReceiptOperatorPath>;
    actionLabel: string;
    href: string;
    routeSurfaceKind: SuiteRouteSurfaceKind;
  }> = requirements.map((requirement) => {
    const record = source.evidenceRecords.find(
      ({ captureId }) => captureId === requirement.captureId
    );
    const status = record?.status ?? 'missing-live-receipt';
    const itemRoute = deriveEvidenceItemRoute(
      item,
      source,
      record,
      status,
      locale
    );

    return {
      title: requirement.title,
      statusLabel: formatLiveReceiptStatusLabel(status, locale),
      note:
        getLiveReceiptOperatorHint(requirement, record) ??
        getLiveReceiptNextStep(status, requirement),
      status,
      operatorPath: getLiveReceiptOperatorPath(status),
      actionLabel: itemRoute.label,
      href: itemRoute.href,
      routeSurfaceKind: itemRoute.routeSurfaceKind,
    };
  });
  const priorityQueueItem = derivePriorityEvidenceItem(evidenceItems);
  const highestPriorityRequirement = requirements.find((requirement) => {
    const record = source.evidenceRecords.find(
      ({ captureId }) => captureId === requirement.captureId
    );
    return !record || record.status === 'missing-live-receipt';
  });
  const highestPriorityRecord = highestPriorityRequirement
    ? source.evidenceRecords.find(
        ({ captureId }) => captureId === highestPriorityRequirement.captureId
      )
    : undefined;
  const attentionState =
    priorityQueueItem?.operatorPath === 'review'
      ? 'waiting-for-review'
      : priorityQueueItem
        ? 'needs-capture'
        : latestActivity?.href || source.latestOutput?.pageUrl || source.detection?.url
          ? 'ready-to-inspect'
          : 'seed-runtime';
  const routeTarget = deriveSuiteRouteTarget(
    item,
    source,
    {
      attentionState,
      reviewPendingCount,
      captureWorkCount,
    },
    locale
  );
  const operatorDecisionBrief = deriveSuiteOperatorDecisionBrief(
    item,
    {
      latestDetection: source.detection
        ? `${source.detection.detection.matchedHost} · ${getShopflowLocaleCatalog(locale).model.pageKindLabels[source.detection.detection.pageKind]}`
        : copy.noDetectionRecorded,
      evidenceQueue:
        requirements.length === 0
          ? copy.noRequiredQueue
          : copy.evidenceQueueSummary(
              reviewedCount,
              reviewPendingCount,
              captureWorkCount
            ),
      routeLabel: routeTarget.label,
      routeHref: routeTarget.href,
      routeSummary: localizeSuiteShellText(routeTarget.summary, locale),
      routeOrigin: routeTarget.origin,
      nextStep:
        requirements.length > 0 && highestPriorityRequirement
          ? localizeSuiteShellText(
              getLiveReceiptNextStep(
                highestPriorityRecord?.status ?? 'missing-live-receipt',
                highestPriorityRequirement
              ),
              locale
            )
          : source.latestOutput || source.detection
            ? copy.nextStepInspectStoreApp
            : localizeSuiteShellText(item.defaultRouteSummary, locale),
    }
  );
  const evidenceSections = [
    {
      title: getShopflowLocaleCatalog(locale).sidePanel.evidenceOverviewHeading,
      statuses: [
        'missing-live-receipt',
        'capture-in-progress',
      ] as EvidenceItemStatus[],
    },
    {
      title: getShopflowLocaleCatalog(locale).sidePanel.reviewLaneHeading,
      statuses: [
        'captured',
        'reviewed',
        'rejected',
        'expired',
      ] as EvidenceItemStatus[],
    },
  ]
    .map((section) => ({
      title: section.title,
      items: evidenceItems.filter((entry) => section.statuses.includes(entry.status)),
    }))
    .filter((section) => section.items.length > 0)
    .map((section) => ({
      title: section.title,
      count: section.items.length,
      items: section.items.map(({ title, statusLabel, note, actionLabel, href }) => ({
        title,
        statusLabel,
        note: localizeSuiteShellText(note, locale),
        actionLabel,
        href,
      })),
    }));

  return {
    decisionStage: operatorDecisionBrief.stage,
    latestDetection: source.detection
      ? `${source.detection.detection.matchedHost} · ${getShopflowLocaleCatalog(locale).model.pageKindLabels[source.detection.detection.pageKind]}`
      : copy.noDetectionRecorded,
    latestActivity: latestActivity
      ? formatRecentActivitySummary(latestActivity, locale)
        ? `${formatRecentActivityLabel(latestActivity, locale)} · ${formatRecentActivitySummary(latestActivity, locale)}`
        : formatRecentActivityLabel(latestActivity, locale)
      : copy.noRecentActivity,
    latestActivityHref: latestActivity?.href,
    latestOutput: source.latestOutput
      ? [
          source.latestOutput.headline,
          formatLatestOutputSummary(source.latestOutput, locale),
          ...formatLatestOutputDetailLines(source.latestOutput, locale).slice(0, 2),
        ].join(' · ')
      : copy.noCapturedOutput,
    latestOutputHref: source.latestOutput?.pageUrl,
    routeLabel: routeTarget.label,
    routeHref: routeTarget.href,
    routeSummary: localizeSuiteShellText(routeTarget.summary, locale),
    routeOrigin: routeTarget.origin,
    operatorDecisionBrief,
    attentionState,
    evidenceCounts: {
      captureWork: captureWorkCount,
      waitingForReview: reviewPendingCount,
      reviewed: reviewedCount,
    },
    evidenceQueue:
      requirements.length === 0
        ? copy.noRequiredQueue
        : copy.evidenceQueueSummary(
            reviewedCount,
            reviewPendingCount,
            captureWorkCount
          ),
    priorityQueueItem: priorityQueueItem
      ? {
          title: priorityQueueItem.title,
          operatorPathLabel: formatLiveReceiptOperatorPathLabel(
            priorityQueueItem.operatorPath,
            locale
          ),
          statusLabel: priorityQueueItem.statusLabel,
          note: localizeSuiteShellText(priorityQueueItem.note, locale),
          actionLabel: formatPriorityQueueActionLabel(
            priorityQueueItem.operatorPath,
            priorityQueueItem.routeSurfaceKind,
            item.defaultRouteLabel,
            locale
          ),
          href: priorityQueueItem.href,
        }
      : undefined,
    evidenceItems: evidenceItems.map(
      ({ title, statusLabel, note, actionLabel, href }) => ({
        title,
        statusLabel,
        note: localizeSuiteShellText(note, locale),
        actionLabel,
        href,
      })
    ),
    evidenceSections,
    nextStep:
      requirements.length > 0 && highestPriorityRequirement
        ? localizeSuiteShellText(
            getLiveReceiptNextStep(
              highestPriorityRecord?.status ?? 'missing-live-receipt',
              highestPriorityRequirement
            ),
            locale
          )
        : source.latestOutput || source.detection
          ? copy.nextStepInspectStoreApp
          : localizeSuiteShellText(item.defaultRouteSummary, locale),
  };
}

export async function loadSuiteDetailMap(
  items: readonly SuiteCatalogItem[],
  locale: ShopflowLocale,
  repositories: SuiteControlPlaneRepositories
): Promise<Record<string, SuiteDetailModel>> {
  const detailEntries = await Promise.all(
    items.map(async (item) => {
      return [
        item.appId,
        createSuiteDetailModel(
          item,
          await loadSuiteControlPlaneSource(item.appId, repositories),
          locale
        ),
      ] as const;
    })
  );

  return Object.fromEntries(detailEntries);
}

export function getSuiteCockpitAction(detail: SuiteDetailModel) {
  return {
    label: detail.priorityQueueItem?.actionLabel ?? detail.routeLabel,
    href: detail.priorityQueueItem?.href ?? detail.routeHref,
    summary: detail.routeSummary,
    nextStep: detail.priorityQueueItem?.note ?? detail.nextStep,
  };
}

const attentionStatePriority = {
  'waiting-for-review': 0,
  'needs-capture': 1,
  'ready-to-inspect': 2,
  'seed-runtime': 3,
} as const;

const routeOriginPriority = {
  'merchant-source': 0,
  'captured-page': 1,
  'detected-page': 2,
  'default-route': 3,
} as const;

export function compareSuiteDetailPriority(
  left: SuiteDetailModel,
  right: SuiteDetailModel
) {
  return (
    attentionStatePriority[left.attentionState] -
      attentionStatePriority[right.attentionState] ||
    right.evidenceCounts.waitingForReview - left.evidenceCounts.waitingForReview ||
    right.evidenceCounts.captureWork - left.evidenceCounts.captureWork ||
    routeOriginPriority[left.routeOrigin] - routeOriginPriority[right.routeOrigin]
  );
}

function deriveSuiteRouteTarget(
  item: SuiteCatalogItem,
  source: SuiteDetailSource,
  options: {
    attentionState: SuiteDetailModel['attentionState'];
    reviewPendingCount: number;
    captureWorkCount: number;
  },
  locale: ShopflowLocale = 'en'
) {
  const copy = getShopflowLocaleCatalog(locale).suite;
  const latestActivity = source.recentActivities[0];

  if (options.attentionState === 'waiting-for-review') {
    if (latestActivity?.href) {
      return {
        href: latestActivity.href,
        label: copy.waitingReviewRouteLabel,
        summary: copy.waitingReviewRouteSummary(options.reviewPendingCount),
        origin: 'merchant-source' as const,
      };
    }

    if (source.latestOutput?.pageUrl) {
      return {
        href: source.latestOutput.pageUrl,
        label: copy.reviewFromLatestCaptureLabel,
        summary: copy.reviewFromLatestCaptureSummary(options.reviewPendingCount),
        origin: 'captured-page' as const,
      };
    }
  }

  if (options.attentionState === 'needs-capture') {
    if (latestActivity?.href) {
      return {
        href: latestActivity.href,
        label: copy.resumeCapturePathLabel,
        summary: copy.resumeCapturePathSummary(options.captureWorkCount),
        origin: 'merchant-source' as const,
      };
    }

    if (source.latestOutput?.pageUrl) {
      return {
        href: source.latestOutput.pageUrl,
        label: copy.resumeCaptureFromLatestCapturedPageLabel,
        summary: copy.resumeCaptureFromLatestCapturedPageSummary(
          options.captureWorkCount
        ),
        origin: 'captured-page' as const,
      };
    }
  }

  if (latestActivity?.href) {
    return {
      href: latestActivity.href,
      label: copy.inspectLatestSourcePageLabel,
      summary: copy.inspectLatestSourcePageSummary,
      origin: 'merchant-source' as const,
    };
  }

  if (source.latestOutput?.pageUrl) {
    return {
      href: source.latestOutput.pageUrl,
      label: copy.inspectLatestCapturedPageLabel,
      summary: copy.inspectLatestCapturedPageSummary,
      origin: 'captured-page' as const,
    };
  }

  if (source.detection?.url) {
    return {
      href: source.detection.url,
      label: copy.inspectLatestDetectedPageLabel,
      summary: copy.inspectLatestDetectedPageSummary,
      origin: 'detected-page' as const,
    };
  }

  return {
    href: item.defaultRouteUrl,
    label: item.defaultRouteLabel,
    summary: item.defaultRouteSummary,
    origin: 'default-route' as const,
  };
}

function deriveEvidenceItemRoute(
  item: SuiteCatalogItem,
  source: SuiteDetailSource,
  record: EvidenceCaptureRecord | undefined,
  status: EvidenceItemStatus,
  locale: ShopflowLocale = 'en'
): {
  href: string;
  label: string;
  routeSurfaceKind: SuiteRouteSurfaceKind;
} {
  const copy = getShopflowLocaleCatalog(locale).suite;
  if (record?.sourcePageUrl) {
    return {
      href: record.sourcePageUrl,
      label:
        status === 'captured' || status === 'reviewed'
          ? copy.openEvidenceSourcePageLabel
          : copy.openCaptureSourcePageLabel,
      routeSurfaceKind:
        status === 'captured' || status === 'reviewed'
          ? 'evidenceSourcePage'
          : 'captureSourcePage',
    };
  }

  const latestActivity = source.recentActivities[0];

  if (latestActivity?.href) {
    return {
      href: latestActivity.href,
      label:
        status === 'captured' || status === 'reviewed'
          ? copy.openLatestSourcePageLabel
          : copy.resumeFromLatestSourcePageLabel,
      routeSurfaceKind: 'latestSourcePage',
    };
  }

  if (source.latestOutput?.pageUrl) {
    return {
      href: source.latestOutput.pageUrl,
      label:
        status === 'captured' || status === 'reviewed'
          ? copy.openLatestCapturedPageLabel
          : copy.resumeFromLatestCapturedPageLabel,
      routeSurfaceKind: 'latestCapturedPage',
    };
  }

  if (source.detection?.url) {
    return {
      href: source.detection.url,
      label: copy.openLatestDetectedPageLabel,
      routeSurfaceKind: 'latestDetectedPage',
    };
  }

  return {
    href: item.defaultRouteUrl,
    label: item.defaultRouteLabel,
    routeSurfaceKind: 'defaultStoreRoute',
  };
}

function derivePriorityEvidenceItem(
  items: Array<{
    title: string;
    statusLabel: string;
    note: string;
    status: EvidenceItemStatus;
    operatorPath: ReturnType<typeof getLiveReceiptOperatorPath>;
    actionLabel: string;
    href: string;
    routeSurfaceKind: SuiteRouteSurfaceKind;
  }>
) {
  const operatorPathPriority: Record<
    ReturnType<typeof getLiveReceiptOperatorPath>,
    number
  > = {
    'finish-capture': 0,
    review: 1,
    recapture: 2,
    capture: 3,
    complete: 4,
  };

  return [...items]
    .sort(
      (left, right) =>
        operatorPathPriority[left.operatorPath] -
        operatorPathPriority[right.operatorPath]
    )
    .find(({ operatorPath }) => operatorPath !== 'complete');
}

function deriveSuiteOperatorDecisionBrief(
  item: SuiteCatalogItem,
  detail: {
    latestDetection: string;
    evidenceQueue: string;
    routeLabel: string;
    routeHref: string;
    routeSummary: string;
    routeOrigin: BuilderRouteOrigin;
    nextStep: string;
  }
) {
  const stage =
    item.state === 'repo-verified-claim-gated'
      ? 'claim-gated'
      : item.state === 'repo-verified'
        ? 'ready-now'
        : 'waiting-for-context';

  return operatorDecisionBriefSchema.parse({
    surfaceId: 'operator-decision-brief',
    schemaVersion: 'shopflow.operator-decision-brief.v1',
    readOnly: true,
    appTitle: item.title,
    stage,
    summary: detail.routeSummary,
    whyNow: [detail.latestDetection, detail.evidenceQueue],
    nextStep: detail.nextStep,
    primaryRouteLabel: detail.routeLabel,
    primaryRouteHref: detail.routeHref,
    primaryRouteOrigin: detail.routeOrigin,
    claimBoundary: item.note.startsWith('Currently verified')
      ? item.note
      : undefined,
  });
}

function formatPriorityQueueActionLabel(
  operatorPath: ReturnType<typeof getLiveReceiptOperatorPath>,
  routeSurfaceKind: SuiteRouteSurfaceKind,
  defaultRouteLabel: string,
  locale: ShopflowLocale = 'en'
) {
  const copy = getShopflowLocaleCatalog(locale).suite;
  const routeSuffix = resolveRouteSurfaceLabel(
    routeSurfaceKind,
    defaultRouteLabel,
    locale
  );

  switch (operatorPath) {
    case 'finish-capture':
      return copy.priorityQueueAction.finishCapture(routeSuffix);
    case 'review':
      return copy.priorityQueueAction.review(routeSuffix);
    case 'recapture':
      return copy.priorityQueueAction.recapture(routeSuffix);
    case 'capture':
      return copy.priorityQueueAction.capture(routeSuffix);
    case 'complete':
      return copy.priorityQueueAction.open(routeSuffix);
  }
}

function resolveRouteSurfaceLabel(
  routeSurfaceKind: SuiteRouteSurfaceKind,
  defaultRouteLabel: string,
  locale: ShopflowLocale = 'en'
) {
  const labels = getShopflowLocaleCatalog(locale).suite.routeSurfaceLabels;

  switch (routeSurfaceKind) {
    case 'latestSourcePage':
      return labels.latestSourcePage;
    case 'latestCapturedPage':
      return labels.latestCapturedPage;
    case 'latestDetectedPage':
      return labels.latestDetectedPage;
    case 'evidenceSourcePage':
      return labels.evidenceSourcePage;
    case 'captureSourcePage':
      return labels.captureSourcePage;
    case 'defaultStoreRoute':
      return defaultRouteLabel || labels.defaultStoreRoute;
  }
}
