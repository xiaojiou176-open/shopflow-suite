import {
  createHomeViewModel,
  createLocaleRouteHref,
  getDynamicCopy,
  getShopflowLocaleCatalog,
  resolveShopflowLocaleFromUrl,
  resolveUiLocale,
  toLocaleTimeString,
  uiLocaleValues,
  type SidePanelHomeViewModel,
  type UiLocale,
} from '@shopflow/core';
import {
  EvidenceCaptureRepository,
  type EvidenceCaptureQueueSummary,
  type EvidenceCaptureRecord,
  ActivityRepository,
  activityStorageKey,
  BrowserLocalStorage,
  type ActivityItem,
  DetectionRepository,
  type DetectionRecord,
  LatestOutputRepository,
  type LatestOutputRecord,
} from '@shopflow/runtime';
import {
  formatLiveReceiptItemSummary,
  formatLiveReceiptOperatorPathLabel,
  getLiveReceiptNextStep,
  getLiveReceiptOperatorStage,
  getLiveReceiptOperatorHint,
  getLiveReceiptPacketSummary,
  type LiveReceiptAppRequirement,
  type StoreId,
} from '@shopflow/contracts';
import browser from 'webextension-polyfill';
import { useEffect, useMemo, useState } from 'react';
import { getEvidenceSectionHref } from './evidence-section-routing';
import { PopupLauncher } from './popup-launcher';
import { localizeRecentActivities } from './recent-activity-copy';
import { SidePanelHomePage } from './side-panel-home-page';
import { getUiShellCopy } from './ui-copy';

type RuntimeAppDefinition = {
  appId: string;
  storeId: StoreId;
  siteName: string;
  title: string;
  summary: string;
  verifiedScopeCopy?: string;
  requiredEvidence?: readonly LiveReceiptAppRequirement[];
};

type EvidenceCaptureState = {
  records: EvidenceCaptureRecord[];
  summary?: EvidenceCaptureQueueSummary;
};

type EvidenceRouteSources = {
  currentSourceHref?: string;
  latestSourceHref?: string;
};

type LocaleOption = {
  label: string;
  href: string;
  active: boolean;
};

const detectionRepository = new DetectionRepository(new BrowserLocalStorage());
const evidenceRepository = new EvidenceCaptureRepository(
  new BrowserLocalStorage()
);
const activityRepository = new ActivityRepository(new BrowserLocalStorage());
const latestOutputRepository = new LatestOutputRepository(
  new BrowserLocalStorage()
);

function resolveSurfaceLocaleFromLocation(): UiLocale {
  return resolveShopflowLocaleFromUrl(
    typeof window !== 'undefined' ? window.location.search : '',
    document.documentElement.lang ?? navigator.language
  );
}

function createCurrentSurfaceLocaleOptions(
  locale: UiLocale = 'en'
): LocaleOption[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const currentUrl = new URL(window.location.href);
  const labels = getUiShellCopy(locale).common.languageOptionLabels;

  return uiLocaleValues.map((nextLocale) => ({
    label: labels[nextLocale],
    href: createLocaleRouteHref(
      `${currentUrl.pathname.split('/').pop() ?? ''}${currentUrl.search}${currentUrl.hash}`,
      nextLocale
    ),
    active: locale === nextLocale,
  }));
}

function createLocalizedExtensionHref(
  fileName: 'sidepanel.html' | 'popup.html',
  locale: UiLocale,
  hash?: string
) {
  const baseHref = browser.runtime.getURL(fileName);
  return createLocaleRouteHref(`${baseHref}${hash ? `#${hash}` : ''}`, locale);
}

function createIdleModel(
  app: RuntimeAppDefinition,
  evidenceStatus?: SidePanelHomeViewModel['evidenceStatus'],
  locale: UiLocale = 'en'
): SidePanelHomeViewModel {
  const dynamicCopy = getDynamicCopy(locale);
  const evidenceSectionHref =
    evidenceStatus?.items[0]?.sectionHref ?? '#live-receipt-readiness';

  return {
    appTitle: app.title,
    appStatus: 'idle',
    site: {
      siteId: app.storeId,
      siteName: app.siteName,
      host: dynamicCopy.waitingForSupportedPage,
      pageKind: 'unknown',
      pageKindLabel: dynamicCopy.pageKindLabel.unknown,
      urlLabel: dynamicCopy.routeIntoSupportedPageFirst,
    },
    capabilities: [],
    quickActions: [],
    secondaryNavigation: [
      {
        id: 'support-state',
        label: dynamicCopy.reviewSupportStateLabel,
        summary: dynamicCopy.supportStateWaitingSummary,
        href: '#current-site-summary',
        actionLabel: dynamicCopy.openCurrentSiteSummary,
      },
      {
        id: 'evidence-gate',
        label: evidenceStatus
          ? dynamicCopy.reviewClaimGateLabel
          : dynamicCopy.reviewSupportPolicy,
        summary: evidenceStatus
          ? (evidenceStatus.blockerSummary?.summary ??
            dynamicCopy.reviewClaimGateSummary)
          : dynamicCopy.reviewSupportPolicySummary,
        href: evidenceStatus ? evidenceSectionHref : '#readiness-summary',
        actionLabel: evidenceStatus
          ? evidenceSectionHref === '#live-receipt-evidence'
            ? dynamicCopy.openCaptureQueue
            : evidenceSectionHref === '#live-receipt-review'
              ? dynamicCopy.openReviewLane
              : dynamicCopy.openReadinessSummary
          : dynamicCopy.openReadinessSummary,
      },
      {
        id: 'activity-log',
        label: dynamicCopy.checkRecentActivityLabel,
        summary: dynamicCopy.checkRecentActivitySummaryIdle,
        href: '#recent-activity',
        actionLabel: dynamicCopy.openRecentActivity,
      },
    ],
    recentActivities: [],
    readiness: {
      label: dynamicCopy.waitingForSupportedPage,
      summary: app.summary,
      claimBoundary: app.verifiedScopeCopy,
      operatorNextStep:
        evidenceStatus?.blockerSummary?.nextStep ??
        dynamicCopy.routeIntoSupportedPageFirst,
    },
    workflowBrief: {
      tone: 'unsupported',
      title: dynamicCopy.workflowCopilotHeading,
      summary: dynamicCopy.workflowUnsupportedSummary,
      bullets: [
        {
          label: dynamicCopy.workflowBulletCurrentSurface,
          value: `${dynamicCopy.waitingForSupportedPage} · ${dynamicCopy.pageKindLabel.unknown}`,
        },
        {
          label: dynamicCopy.workflowBulletNextMove,
          value: dynamicCopy.routeIntoSupportedPageFirst,
        },
      ],
      nextAction: {
        label: dynamicCopy.openCurrentSiteSummary,
        reason: dynamicCopy.routeIntoSupportedPageFirst,
      },
    },
    evidenceStatus,
  };
}

function summarizeDetection(
  record: DetectionRecord | undefined,
  locale: UiLocale = 'en'
) {
  const dynamicCopy = getDynamicCopy(locale);
  if (!record) {
    return {
      summary: dynamicCopy.routeIntoSupportedPageFirst,
      details: [dynamicCopy.waitingForSupportedPageSummary],
    };
  }

  const readyCount = record.detection.capabilityStates.filter(
    (state) => state.status === 'ready'
  ).length;

  return {
    summary: `${record.detection.matchedHost} · ${dynamicCopy.pageKindLabel[record.detection.pageKind]}`,
    details: [
      `${getUiShellCopy(locale).popup.latestCapturedAt(
        toLocaleTimeString(record.updatedAt, locale)
      )}`,
      readyCount > 0
        ? dynamicCopy.supportStateReadySummary(readyCount)
        : dynamicCopy.supportStateWaitingSummary,
    ],
  };
}

function summarizeEvidence(
  app: RuntimeAppDefinition,
  summary?: EvidenceCaptureQueueSummary,
  locale: UiLocale = 'en'
) {
  const dynamicCopy = getDynamicCopy(locale);
  if (!app.requiredEvidence?.length || !summary || summary.totalCount === 0) {
    return [];
  }

  const missingCount = summary.needsCaptureCount;
  const uncapturedCount = summary.missingCount;
  const reviewPendingCount = summary.reviewPendingCount;
  const captureInProgressCount = summary.captureInProgressCount;
  const reviewedCount = summary.reviewedCount;
  const rejectedCount = summary.rejectedCount;
  const expiredCount = summary.expiredCount;

  if (
    missingCount === 0 &&
    reviewPendingCount === 0 &&
    reviewedCount > 0 &&
    rejectedCount === 0 &&
    expiredCount === 0
  ) {
    return [dynamicCopy.reviewedEvidenceForAppSummary(reviewedCount)];
  }

  if (
    missingCount === 0 &&
    reviewPendingCount > 0 &&
    captureInProgressCount === 0 &&
    rejectedCount === 0 &&
    expiredCount === 0
  ) {
    return [dynamicCopy.reviewPendingForAppSummary(reviewPendingCount)];
  }

  return [
    ...(reviewedCount > 0
      ? [dynamicCopy.reviewedEvidenceForAppSummary(reviewedCount)]
      : []),
    ...(uncapturedCount > 0
      ? [dynamicCopy.missingEvidenceForAppSummary(uncapturedCount)]
      : []),
    ...(captureInProgressCount > 0
      ? [dynamicCopy.captureInProgressForAppSummary(captureInProgressCount)]
      : []),
    ...(reviewPendingCount > 0
      ? [dynamicCopy.reviewPendingForAppSummary(reviewPendingCount)]
      : []),
    ...(rejectedCount > 0
      ? [dynamicCopy.rejectedForAppSummary(rejectedCount)]
      : []),
    ...(expiredCount > 0
      ? [dynamicCopy.expiredForAppSummary(expiredCount)]
      : []),
  ];
}

function createPopupRouteModel(
  model: SidePanelHomeViewModel,
  locale: UiLocale = 'en'
) {
  const dynamicCopy = getDynamicCopy(locale);
  const uiCopy = getUiShellCopy(locale);
  const readyCount = model.quickActions.length;
  const hasEvidenceQueue = Boolean(model.evidenceStatus?.items.length);
  const latestActivity = model.recentActivities[0];
  const blockerSummary = model.evidenceStatus?.blockerSummary;
  const evidenceSectionHref =
    model.evidenceStatus?.items[0]?.sectionHref ?? '#live-receipt-readiness';
  const actionItems = model.quickActions.map((action) => ({
    label: action.label,
    summary: action.summary,
    href: action.href,
    external: action.external,
  }));
  const directSecondaryRoute = hasEvidenceQueue
    ? undefined
    : latestActivity?.href &&
        !actionItems.some((item) => item.href === latestActivity.href)
      ? {
          label: uiCopy.popup.openLatestSourcePage,
          href: latestActivity.href,
          summary:
            latestActivity.summary ?? dynamicCopy.routeBackToMerchantSummary,
        }
      : model.latestOutputPreview?.href &&
          !actionItems.some(
            (item) => item.href === model.latestOutputPreview?.href
          )
        ? {
            label: uiCopy.popup.resumeLatestCapturedPage,
            href: model.latestOutputPreview.href,
            summary: dynamicCopy.latestCapturedRouteSummary,
          }
        : undefined;
  const directSecondaryOriginLabel = directSecondaryRoute
    ? directSecondaryRoute.href === latestActivity?.href
      ? uiCopy.common.routeOriginLabels.merchantSource
      : uiCopy.common.routeOriginLabels.capturedPage
    : undefined;

  if (blockerSummary?.sourceHref) {
    actionItems.push({
      label: blockerSummary.sourceLabel ?? uiCopy.common.openEvidenceSourcePage,
      summary: blockerSummary.nextStep ?? blockerSummary.summary,
      href: blockerSummary.sourceHref,
      external: true,
    });
  } else if (
    !readyCount &&
    latestActivity?.href &&
    !actionItems.some((item) => item.href === latestActivity.href) &&
    !directSecondaryRoute
  ) {
    actionItems.push({
      label: uiCopy.popup.openLatestSourcePage,
      summary: latestActivity.summary ?? dynamicCopy.routeBackToMerchantSummary,
      href: latestActivity.href,
      external: true,
    });
  }

  return {
    actionHeading:
      readyCount > 0
        ? uiCopy.popup.defaultActionHeading
        : hasEvidenceQueue
          ? uiCopy.sidePanel.claimBoundary
          : uiCopy.sidePanel.operatorNextStep,
    actionItems,
    actionEmptySummary:
      model.readiness.operatorNextStep ?? model.readiness.summary,
    primaryLabel:
      readyCount > 0
        ? uiCopy.popup.openSidePanelQuickActions
        : uiCopy.popup.openSidePanelReadinessSummary,
    primaryOriginLabel: uiCopy.common.routeOriginLabels.sidePanelSection,
    primaryHref: createLocalizedExtensionHref(
      'sidepanel.html',
      locale,
      readyCount > 0 ? 'quick-actions' : 'readiness-summary'
    ),
    primarySummary:
      readyCount > 0
        ? uiCopy.sidePanel.quickActionsIntro
        : dynamicCopy.reviewReadinessSummarySummary,
    secondaryLabel: hasEvidenceQueue
      ? evidenceSectionHref === '#live-receipt-evidence'
        ? uiCopy.popup.openSidePanelCaptureQueue
        : uiCopy.popup.openSidePanelReviewLane
      : directSecondaryRoute
        ? directSecondaryRoute.label
        : latestActivity
          ? uiCopy.popup.openSidePanelRecentActivity
          : uiCopy.popup.openSidePanelCurrentSiteSummary,
    secondaryHref: directSecondaryRoute
      ? directSecondaryRoute.href
      : createLocalizedExtensionHref(
          'sidepanel.html',
          locale,
          hasEvidenceQueue
            ? evidenceSectionHref.replace(/^#/, '')
            : latestActivity
              ? 'recent-activity'
              : 'current-site-summary'
        ),
    secondarySummary: hasEvidenceQueue
      ? (blockerSummary?.summary ?? dynamicCopy.reviewClaimGateSummary)
      : directSecondaryRoute
        ? directSecondaryRoute.summary
        : latestActivity
          ? dynamicCopy.checkRecentActivitySummaryReady
          : dynamicCopy.currentSiteSummaryRoute,
    secondaryOriginLabel: hasEvidenceQueue
      ? uiCopy.common.routeOriginLabels.evidenceGate
      : directSecondaryOriginLabel ??
        uiCopy.common.routeOriginLabels.sidePanelSection,
  };
}

function createEvidenceQueueSummaryLine(
  summary: EvidenceCaptureQueueSummary,
  locale: UiLocale = 'en'
) {
  const dynamicCopy = getDynamicCopy(locale);
  const parts = [];

  if (summary.needsCaptureCount > 0) {
    parts.push(dynamicCopy.captureQueueSummary(summary.needsCaptureCount));
  }

  if (summary.captureInProgressCount > 0) {
    parts.push(
      dynamicCopy.captureInProgressQueueSummary(summary.captureInProgressCount)
    );
  }

  if (summary.reviewPendingCount > 0) {
    parts.push(
      dynamicCopy.reviewPendingQueueSummary(summary.reviewPendingCount)
    );
  }

  if (summary.reviewedCount > 0 || parts.length === 0) {
    parts.push(dynamicCopy.reviewedQueueSummary(summary.reviewedCount));
  }

  return parts.join(' · ');
}

function resolveEvidenceRoute(
  record: EvidenceCaptureRecord | undefined,
  status: EvidenceCaptureRecord['status'],
  sources: EvidenceRouteSources,
  locale: UiLocale = 'en'
) {
  const commonCopy = getUiShellCopy(locale).common;
  if (record?.sourcePageUrl) {
    return {
      sourceHref: record.sourcePageUrl,
      sourceLabel:
        status === 'reviewed'
          ? commonCopy.openEvidenceSourcePage
          : getShopflowLocaleCatalog(locale).common.openCurrentCapturePage,
    };
  }

  const preferredHref =
    status === 'reviewed'
      ? (sources.latestSourceHref ?? sources.currentSourceHref)
      : (sources.currentSourceHref ?? sources.latestSourceHref);

  if (!preferredHref) {
    return {
      sourceHref: undefined,
      sourceLabel: undefined,
    };
  }

  if (status === 'reviewed') {
    return {
      sourceHref: preferredHref,
      sourceLabel: sources.latestSourceHref
        ? commonCopy.openLatestSourcePage
        : commonCopy.openSourcePage,
    };
  }

  return {
    sourceHref: preferredHref,
    sourceLabel:
      preferredHref === sources.currentSourceHref
        ? getShopflowLocaleCatalog(locale).common.openCurrentCapturePage
        : commonCopy.openLatestSourcePage,
  };
}

function createEvidenceBlockerSummary(
  app: RuntimeAppDefinition,
  records: EvidenceCaptureRecord[],
  summary: EvidenceCaptureQueueSummary | undefined,
  sources: EvidenceRouteSources,
  locale: UiLocale = 'en'
): NonNullable<SidePanelHomeViewModel['evidenceStatus']>['blockerSummary'] {
  const dynamicCopy = getDynamicCopy(locale);
  if (!app.requiredEvidence?.length || !summary || summary.totalCount === 0) {
    return undefined;
  }

  const nextRequirement =
    app.requiredEvidence.find(
      (requirement) => requirement.captureId === summary.nextCaptureId
    ) ?? app.requiredEvidence[0];
  const nextRecord = records.find(
    ({ captureId }) => captureId === nextRequirement.captureId
  );
  const nextStatus = nextRecord?.status ?? 'missing-live-receipt';
  const route = resolveEvidenceRoute(nextRecord, nextStatus, sources, locale);
  const queueSummary = createEvidenceQueueSummaryLine(summary, locale);
  const nextOperatorPathLabel = summary.nextOperatorPath
    ? formatLiveReceiptOperatorPathLabel(summary.nextOperatorPath, locale)
    : dynamicCopy.blockerSummaryReviewedLabel;

  if (summary.needsCaptureCount > 0) {
    return {
      label: nextOperatorPathLabel,
      summary: summary.blockerSummary,
      nextStep: getLiveReceiptNextStep(nextStatus, nextRequirement),
      ...route,
    };
  }

  if (summary.captureInProgressCount > 0) {
    return {
      label: nextOperatorPathLabel,
      summary: summary.blockerSummary,
      nextStep: getLiveReceiptNextStep(nextStatus, nextRequirement),
      ...route,
    };
  }

  if (summary.reviewPendingCount > 0) {
    return {
      label: nextOperatorPathLabel,
      summary: summary.blockerSummary,
      nextStep: getLiveReceiptNextStep(nextStatus, nextRequirement),
      ...route,
    };
  }

  return {
    label: nextOperatorPathLabel,
    summary: summary.blockerSummary || dynamicCopy.blockerSummaryReviewedSummary(queueSummary),
    nextStep: getLiveReceiptNextStep(nextStatus, nextRequirement),
    ...route,
  };
}

function formatLocaleDateTime(timestamp: string, locale: UiLocale = 'en') {
  return new Date(timestamp).toLocaleString(
    resolveUiLocale(locale) === 'zh-CN' ? 'zh-CN' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }
  );
}

function formatLocaleDate(timestamp: string, locale: UiLocale = 'en') {
  return new Date(timestamp).toLocaleDateString(
    resolveUiLocale(locale) === 'zh-CN' ? 'zh-CN' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
}

function useDetection(appId: string) {
  const [record, setRecord] = useState<DetectionRecord | undefined>();

  useEffect(() => {
    let cancelled = false;
    const storageKey = detectionRepository.keyFor(appId);

    const load = async () => {
      const next = await detectionRepository.get(appId);
      if (!cancelled) {
        setRecord(next);
      }
    };

    void load();

    const onChanged = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'local' || !(storageKey in changes)) {
        return;
      }

      const nextValue = changes[storageKey]?.newValue;
      setRecord(nextValue as DetectionRecord | undefined);
    };

    browser.storage.onChanged.addListener(onChanged);
    return () => {
      cancelled = true;
      browser.storage.onChanged.removeListener(onChanged);
    };
  }, [appId]);

  return record;
}

function useEvidenceCapture(app: RuntimeAppDefinition) {
  const [state, setState] = useState<EvidenceCaptureState>({
    records: [],
  });

  useEffect(() => {
    let cancelled = false;
    const storageKey = evidenceRepository.keyFor(app.appId);

    const load = async () => {
      if (app.requiredEvidence?.length) {
        const now = new Date().toISOString();
        await evidenceRepository.seedMissing(app.requiredEvidence, now);
      }

      const [records, summary] = await Promise.all([
        evidenceRepository.list(app.appId),
        evidenceRepository.summarize(app.appId, app.requiredEvidence ?? []),
      ]);
      if (!cancelled) {
        setState({
          records,
          summary,
        });
      }
    };

    void load();

    const onChanged = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'local' || !(storageKey in changes)) {
        return;
      }

      void load();
    };

    browser.storage.onChanged.addListener(onChanged);
    return () => {
      cancelled = true;
      browser.storage.onChanged.removeListener(onChanged);
    };
  }, [app]);

  return state;
}

function useRecentActivity(appId: string) {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const next = await activityRepository.list(appId);
      if (!cancelled) {
        setItems(next);
      }
    };

    void load();

    const onChanged = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'local' || !(activityStorageKey in changes)) {
        return;
      }

      const nextValue = changes[activityStorageKey]?.newValue;
      const parsed = Array.isArray(nextValue)
        ? (nextValue as ActivityItem[]).filter((item) => item.appId === appId)
        : [];
      setItems(parsed);
    };

    browser.storage.onChanged.addListener(onChanged);
    return () => {
      cancelled = true;
      browser.storage.onChanged.removeListener(onChanged);
    };
  }, [appId]);

  return items;
}

function useLatestOutput(appId: string) {
  const [record, setRecord] = useState<LatestOutputRecord | undefined>();

  useEffect(() => {
    let cancelled = false;
    const storageKey = latestOutputRepository.keyFor(appId);

    const load = async () => {
      const next = await latestOutputRepository.get(appId);
      if (!cancelled) {
        setRecord(next);
      }
    };

    void load();

    const onChanged = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'local' || !(storageKey in changes)) {
        return;
      }

      const nextValue = changes[storageKey]?.newValue;
      setRecord(nextValue as LatestOutputRecord | undefined);
    };

    browser.storage.onChanged.addListener(onChanged);
    return () => {
      cancelled = true;
      browser.storage.onChanged.removeListener(onChanged);
    };
  }, [appId]);

  return record;
}

function createEvidenceStatus(
  app: RuntimeAppDefinition,
  records: EvidenceCaptureRecord[],
  summary: EvidenceCaptureQueueSummary | undefined,
  sources: EvidenceRouteSources,
  locale: UiLocale = 'en'
): SidePanelHomeViewModel['evidenceStatus'] {
  const dynamicCopy = getDynamicCopy(locale);
  if (!app.requiredEvidence?.length) {
    return undefined;
  }

  const blockerSummary = createEvidenceBlockerSummary(
    app,
    records,
    summary,
    sources,
    locale
  );
  const items = app.requiredEvidence
    .map((requirement) => {
      const record = records.find(
        ({ captureId }) => captureId === requirement.captureId
      );
      const status = record?.status ?? 'missing-live-receipt';
      const route = resolveEvidenceRoute(record, status, sources, locale);

      return {
        captureId: requirement.captureId,
        title: requirement.title,
        verifiedScope: requirement.verifiedScope,
        status,
        sectionHref: getEvidenceSectionHref(status),
        summary: formatLiveReceiptItemSummary(
          {
            title: requirement.title,
            status,
            summary: record?.summary ?? requirement.missingSummary,
            reviewNotes: record?.reviewNotes,
            reviewSummary: record?.reviewSummary,
          },
          locale
        ),
        operatorHint: getLiveReceiptOperatorHint(requirement, record),
        packetSummary: getLiveReceiptPacketSummary(requirement),
        nextStep: getLiveReceiptNextStep(status, requirement),
        screenshotLabel: record?.screenshotLabel,
        updatedAtLabel: record?.updatedAt
          ? formatLocaleDateTime(record.updatedAt, locale)
          : undefined,
        reviewSummary: record?.reviewSummary,
        reviewLabel:
          record?.status === 'reviewed' && record.reviewedAt
            ? `${dynamicCopy.reviewedEvidence} ${formatLocaleDateTime(record.reviewedAt, locale)}${record.reviewedBy ? ` · ${record.reviewedBy}` : ''}`
            : record?.status === 'captured'
              ? dynamicCopy.capturedWaitingReview
              : record?.status === 'rejected'
                ? dynamicCopy.rejectedEvidence
                : record?.status === 'expired'
                  ? dynamicCopy.expiredEvidence
                  : undefined,
        expiresAtLabel: record?.expiresAt
          ? `${resolveUiLocale(locale) === 'zh-CN' ? '到期：' : 'Expires '} ${formatLocaleDate(record.expiresAt, locale)}`
          : undefined,
        actionSnapshot: record?.actionSnapshot,
        sourceHref: route.sourceHref,
        sourceLabel: route.sourceLabel,
      };
    })
    .sort((left, right) => {
      const stagePriority: Record<
        ReturnType<typeof getLiveReceiptOperatorStage>,
        number
      > = {
        'needs-capture': 0,
        'capture-in-progress': 1,
        'waiting-review': 2,
        reviewed: 3,
      };

      return (
        stagePriority[getLiveReceiptOperatorStage(left.status)] -
        stagePriority[getLiveReceiptOperatorStage(right.status)]
      );
    });

  return {
    headline:
      getShopflowLocaleCatalog(locale).sidePanel.liveReceiptReadinessHeading,
    blockerSummary,
    items,
  };
}

export function RuntimeSidePanelHomePage({
  app,
}: {
  app: RuntimeAppDefinition;
}) {
  const locale = resolveSurfaceLocaleFromLocation();
  document.documentElement.lang = locale;
  const record = useDetection(app.appId);
  const evidenceState = useEvidenceCapture(app);
  const recentActivity = useRecentActivity(app.appId);
  const localizedRecentActivity = useMemo(
    () => localizeRecentActivities(recentActivity, locale),
    [recentActivity, locale]
  );
  const latestOutput = useLatestOutput(app.appId);
  const model = useMemo(
    () =>
      record
        ? createHomeViewModel(
            app.title,
            app.siteName,
            record.detection,
            localizedRecentActivity,
            createEvidenceStatus(
              app,
              evidenceState.records,
              evidenceState.summary,
              {
                currentSourceHref: record.url,
                latestSourceHref: localizedRecentActivity[0]?.href,
              },
              locale
            ),
            {
              appSummary: app.summary,
              verifiedScopeCopy: app.verifiedScopeCopy,
              locale,
              latestOutput: latestOutput
                ? {
                    kind: latestOutput.kind,
                    headline: latestOutput.headline,
                    summary: latestOutput.summary,
                    previewLines: latestOutput.previewLines,
                    summaryDescriptor: latestOutput.summaryDescriptor,
                    detailEntries: latestOutput.detailEntries,
                    capturedAt: latestOutput.capturedAt,
                    pageUrl: latestOutput.pageUrl,
                  }
                : undefined,
            }
          )
        : createIdleModel(
            app,
            createEvidenceStatus(
              app,
              evidenceState.records,
              evidenceState.summary,
              {
                latestSourceHref: localizedRecentActivity[0]?.href,
              },
              locale
            ),
            locale
          ),
    [
      app,
      evidenceState.records,
      evidenceState.summary,
      latestOutput,
      localizedRecentActivity,
      record,
    ]
  );

  return (
    <SidePanelHomePage
      model={model}
      locale={locale}
      localeOptions={createCurrentSurfaceLocaleOptions(locale)}
    />
  );
}

export function RuntimePopupLauncher({ app }: { app: RuntimeAppDefinition }) {
  const locale = resolveSurfaceLocaleFromLocation();
  document.documentElement.lang = locale;
  const record = useDetection(app.appId);
  const evidenceState = useEvidenceCapture(app);
  const recentActivity = useRecentActivity(app.appId);
  const localizedRecentActivity = useMemo(
    () => localizeRecentActivities(recentActivity, locale),
    [recentActivity, locale]
  );
  const latestOutput = useLatestOutput(app.appId);
  const popup = summarizeDetection(record, locale);
  const popupModel = record
    ? createHomeViewModel(
        app.title,
        app.siteName,
        record.detection,
        localizedRecentActivity,
        createEvidenceStatus(
          app,
          evidenceState.records,
          evidenceState.summary,
          {
            currentSourceHref: record.url,
            latestSourceHref: localizedRecentActivity[0]?.href,
          },
          locale
        ),
        {
          appSummary: app.summary,
          verifiedScopeCopy: app.verifiedScopeCopy,
          locale,
          latestOutput: latestOutput
            ? {
                kind: latestOutput.kind,
                headline: latestOutput.headline,
                summary: latestOutput.summary,
                previewLines: latestOutput.previewLines,
                summaryDescriptor: latestOutput.summaryDescriptor,
                detailEntries: latestOutput.detailEntries,
                capturedAt: latestOutput.capturedAt,
                pageUrl: latestOutput.pageUrl,
              }
            : undefined,
        }
      )
    : createIdleModel(
        app,
        createEvidenceStatus(
          app,
          evidenceState.records,
          evidenceState.summary,
          {
            latestSourceHref: localizedRecentActivity[0]?.href,
          },
          locale
        ),
        locale
      );
  const routeModel = createPopupRouteModel(popupModel, locale);
  const uiCopy = getUiShellCopy(locale);

  return (
    <PopupLauncher
      title={app.title}
      statusLabel={popupModel.readiness.label}
      summary={popupModel.readiness.summary}
      actionHeading={routeModel.actionHeading}
      actionItems={routeModel.actionItems}
      actionEmptySummary={routeModel.actionEmptySummary}
      latestOutputPreview={
        popupModel.latestOutputPreview?.href &&
        popupModel.latestOutputPreview.href === routeModel.secondaryHref
          ? {
              ...popupModel.latestOutputPreview,
              href: undefined,
            }
          : popupModel.latestOutputPreview
      }
      latestSourceHref={
        popupModel.recentActivities[0]?.href &&
        popupModel.recentActivities[0]?.href !== routeModel.primaryHref &&
        popupModel.recentActivities[0]?.href !== routeModel.secondaryHref &&
        popupModel.recentActivities[0]?.href !==
          popupModel.latestOutputPreview?.href
          ? popupModel.recentActivities[0]?.href
          : undefined
      }
      latestSourceLabel={uiCopy.common.openLatestSourcePage}
      localeOptions={createCurrentSurfaceLocaleOptions(locale)}
      locale={locale}
      primaryHref={routeModel.primaryHref}
      primaryLabel={routeModel.primaryLabel}
      primaryOriginLabel={routeModel.primaryOriginLabel}
      primarySummary={routeModel.primarySummary}
      secondaryHref={routeModel.secondaryHref}
      secondaryLabel={routeModel.secondaryLabel}
      secondaryOriginLabel={routeModel.secondaryOriginLabel}
      secondarySummary={routeModel.secondarySummary}
      details={[
        popup.summary,
        ...(popupModel.readiness.claimBoundary
          ? [
              `${uiCopy.popup.claimBoundaryPrefix} ${popupModel.readiness.claimBoundary}`,
            ]
          : []),
        ...(popupModel.evidenceStatus?.blockerSummary
          ? [
              `${uiCopy.popup.evidenceQueuePrefix} ${popupModel.evidenceStatus.blockerSummary.summary}`,
              ...(popupModel.evidenceStatus.blockerSummary.nextStep
                ? [
                    `${uiCopy.popup.evidenceNextStepPrefix} ${popupModel.evidenceStatus.blockerSummary.nextStep}`,
                  ]
                : []),
              uiCopy.popup.ledgerNote,
            ]
          : []),
        ...(popupModel.readiness.operatorNextStep
          ? [
              `${uiCopy.popup.nextStepPrefix} ${popupModel.readiness.operatorNextStep}`,
            ]
          : []),
        ...(popupModel.recentActivities[0]
          ? [
              `${uiCopy.popup.recentActivityPrefix} ${popupModel.recentActivities[0].label}`,
              ...(popupModel.recentActivities[0].summary
                ? [popupModel.recentActivities[0].summary]
                : []),
              `${uiCopy.popup.seenPrefix} ${popupModel.recentActivities[0].timestampLabel}`,
            ]
          : []),
        ...popup.details,
        ...summarizeEvidence(app, evidenceState.summary, locale),
      ]}
    />
  );
}
