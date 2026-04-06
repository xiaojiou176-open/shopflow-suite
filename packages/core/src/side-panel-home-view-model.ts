import {
  capabilityIdValues,
  detectionResultSchema,
  workflowCopilotBriefSchema,
  type LiveReceiptActionSnapshot,
  type LiveReceiptPlanStatus,
  type CapabilityState,
  type DetectionResult,
  type StoreAdapter,
  type WorkflowCopilotBrief,
} from '@shopflow/contracts';
import {
  formatLatestOutputDetailLines,
  formatLatestOutputSummary,
  getDynamicCopy,
  toLocaleTimeString,
  type UiLocale,
} from './ui-locale';

export type SidePanelHomeViewModel = {
  appTitle: string;
  appStatus: 'live' | 'limited' | 'idle' | 'unsupported' | 'error';
  site: {
    siteId: string;
    siteName: string;
    host: string;
    pageKind: DetectionResult['pageKind'];
    pageKindLabel: string;
    urlLabel: string;
  };
  capabilities: Array<{
    id: CapabilityState['capability'];
    label: string;
    description: string;
    status: CapabilityState['status'];
    reason?: string;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    summary: string;
    href: string;
    variant: 'primary' | 'secondary' | 'ghost';
    disabled?: boolean;
    external?: boolean;
  }>;
  secondaryNavigation: Array<{
    id: string;
    label: string;
    summary: string;
    href?: string;
    actionLabel?: string;
  }>;
  recentActivities: Array<{
    id: string;
    label: string;
    summary?: string;
    timestampLabel: string;
    href?: string;
  }>;
  latestOutputPreview?: {
    label: string;
    title: string;
    summary: string;
    detailLines: string[];
    timestampLabel?: string;
    href?: string;
    hrefLabel?: string;
  };
  readiness: {
    label: string;
    summary: string;
    claimBoundary?: string;
    operatorNextStep?: string;
  };
  workflowBrief: WorkflowCopilotBrief;
  evidenceStatus?: {
    headline: string;
    blockerSummary?: {
      label: string;
      summary: string;
      nextStep?: string;
      sourceHref?: string;
      sourceLabel?: string;
    };
    items: Array<{
      captureId: string;
      title: string;
      verifiedScope: string;
      status: LiveReceiptPlanStatus;
      sectionHref?: string;
      summary: string;
      operatorHint?: string;
      packetSummary?: string;
      nextStep?: string;
      screenshotLabel?: string;
      updatedAtLabel?: string;
      reviewSummary?: string;
      reviewLabel?: string;
      expiresAtLabel?: string;
      actionSnapshot?: LiveReceiptActionSnapshot;
      sourceHref?: string;
      sourceLabel?: string;
    }>;
  };
};

export function createHomeViewModel(
  appTitle: string,
  siteName: string,
  detection: DetectionResult,
  recentActivities: SidePanelHomeViewModel['recentActivities'] = [],
  evidenceStatus?: SidePanelHomeViewModel['evidenceStatus'],
  options?: {
    appSummary?: string;
    verifiedScopeCopy?: string;
    locale?: UiLocale;
    latestOutput?: {
      kind: 'product' | 'search' | 'deal';
      headline: string;
      summary: string;
      previewLines: string[];
      summaryDescriptor?: {
        variant:
          | 'product-with-price'
          | 'product'
          | 'search-top-result'
          | 'search'
          | 'deal-lead'
          | 'deal';
        itemCount?: number;
        priceDisplayText?: string;
        leadTitle?: string;
      };
      detailEntries?: Array<{
        kind:
          | 'price'
          | 'availability'
          | 'sku'
          | 'results-count'
          | 'top-match'
          | 'lead-deal';
        value: string;
      }>;
      capturedAt: string;
      pageUrl: string;
    };
  }
): SidePanelHomeViewModel {
  const locale = options?.locale ?? 'en';
  const copy = getDynamicCopy(locale);
  const latestOutput = options?.latestOutput;
  const quickActions = deriveQuickActions(
    detection,
    recentActivities,
    evidenceStatus,
    latestOutput,
    locale
  );
  const secondaryNavigation = deriveSecondaryNavigation(
    detection,
    evidenceStatus,
    locale
  );
  const latestOutputPreview = deriveLatestOutputPreview(
    detection,
    recentActivities,
    latestOutput,
    locale
  );
  const readiness = deriveReadiness(detection, evidenceStatus, options, locale);
  const workflowBrief = deriveWorkflowBrief(
    detection,
    evidenceStatus,
    quickActions,
    readiness,
    locale
  );

  return {
    appTitle,
    appStatus: deriveAppStatus(detection),
    site: {
      siteId: detection.storeId,
      siteName,
      host: detection.matchedHost,
      pageKind: detection.pageKind,
      pageKindLabel: copy.pageKindLabel[detection.pageKind],
      urlLabel: detection.matchedHost,
    },
    capabilities: detection.capabilityStates.map((state) => ({
      id: state.capability,
      label: copy.capabilityLabel[state.capability],
      description: copy.capabilityDescription[state.capability],
      status: state.status,
      reason: state.reasonMessage,
    })),
    quickActions,
    secondaryNavigation,
    recentActivities,
    latestOutputPreview,
    readiness,
    workflowBrief,
    evidenceStatus,
  };
}

export function createPopupSummary(
  detection: DetectionResult,
  locale: UiLocale = 'en'
) {
  const copy = getDynamicCopy(locale);
  const readyLabels = detection.capabilityStates
    .filter((state) => state.status === 'ready')
    .map((state) => copy.capabilityLabel[state.capability]);

  if (readyLabels.length === 0) {
    return copy.popupSummaryNoReady(
      detection.matchedHost,
      copy.pageKindLabel[detection.pageKind]
    );
  }

  return copy.popupSummaryReady(
    detection.matchedHost,
    copy.pageKindLabel[detection.pageKind],
    readyLabels
  );
}

export function createUnsupportedDetection(
  adapter: Pick<StoreAdapter, 'storeId' | 'verifiedScopes'>,
  matchedHost = 'unsupported-site'
): DetectionResult {
  return detectionResultSchema.parse({
    storeId: adapter.storeId,
    verifiedScopes: adapter.verifiedScopes,
    matchedHost,
    pageKind: 'unsupported',
    confidence: 0,
    capabilityStates: capabilityIdValues.map((capability) => ({
      capability,
      status: 'unsupported_site',
      reasonMessage: getDynamicCopy().unsupportedSiteSummary,
    })),
  });
}

function deriveAppStatus(
  detection: DetectionResult
): SidePanelHomeViewModel['appStatus'] {
  if (detection.pageKind === 'unsupported') {
    return 'unsupported';
  }

  if (detection.capabilityStates.some((state) => state.status === 'ready')) {
    return 'live';
  }

  if (
    detection.capabilityStates.some(
      (state) =>
        state.status === 'blocked' ||
        state.status === 'degraded' ||
        state.status === 'permission_needed'
    )
  ) {
    return 'limited';
  }

  return 'idle';
}

function deriveReadiness(
  detection: DetectionResult,
  evidenceStatus?: SidePanelHomeViewModel['evidenceStatus'],
  options?: {
    appSummary?: string;
    verifiedScopeCopy?: string;
  },
  locale: UiLocale = 'en'
): SidePanelHomeViewModel['readiness'] {
  const copy = getDynamicCopy(locale);
  const readyCount = detection.capabilityStates.filter(
    (state) => state.status === 'ready'
  ).length;
  const constrainedState = detection.capabilityStates.find(
    (state) =>
      state.status === 'blocked' ||
      state.status === 'degraded' ||
      state.status === 'permission_needed'
  );
  const missingEvidence = evidenceStatus?.items.find((item) =>
    ['missing-live-receipt', 'rejected', 'expired'].includes(item.status)
  );
  const pendingEvidence = evidenceStatus?.items.find((item) =>
    ['capture-in-progress', 'captured'].includes(item.status)
  );
  const blockerSummary = evidenceStatus?.blockerSummary;
  const runnableNowSummary = formatRunnableNowSummary(detection, locale);

  if (detection.pageKind === 'unsupported') {
    return {
      label: copy.unsupportedSiteLabel,
      summary: options?.appSummary ?? copy.unsupportedSiteSummary,
      operatorNextStep: copy.routeIntoSupportedPageFirst,
    };
  }

  if (readyCount > 0 && (missingEvidence || pendingEvidence)) {
    return {
      label: copy.repoReadyClaimGated,
      summary:
        blockerSummary?.summary ??
        [runnableNowSummary, copy.publicWordingBehindEvidenceReview]
          .filter(Boolean)
          .join(' '),
      claimBoundary: copy.claimBoundaryUntilReview(options?.verifiedScopeCopy),
      operatorNextStep:
        blockerSummary?.nextStep ??
        missingEvidence?.nextStep ??
        missingEvidence?.operatorHint ??
        pendingEvidence?.operatorHint ??
        pendingEvidence?.nextStep,
    };
  }

  if (readyCount > 0) {
    return {
      label: copy.readyOnThisPage,
      summary: runnableNowSummary,
      claimBoundary: options?.verifiedScopeCopy,
    };
  }

  if (constrainedState) {
    return {
      label: copy.needsOperatorAttention,
      summary:
        constrainedState.reasonMessage ??
        copy.needsOperatorAttentionSummary,
      claimBoundary: options?.verifiedScopeCopy,
      operatorNextStep:
        blockerSummary?.nextStep ??
        missingEvidence?.nextStep ??
        pendingEvidence?.nextStep ??
        pendingEvidence?.operatorHint,
    };
  }

  return {
    label: copy.waitingForSupportedPage,
    summary:
      options?.appSummary ?? copy.waitingForSupportedPageSummary,
    claimBoundary: options?.verifiedScopeCopy,
  };
}

function deriveLatestOutputPreview(
  detection: DetectionResult,
  recentActivities: SidePanelHomeViewModel['recentActivities'],
  latestOutput?: NonNullable<
    NonNullable<Parameters<typeof createHomeViewModel>[5]>['latestOutput']
  >,
  locale: UiLocale = 'en'
): SidePanelHomeViewModel['latestOutputPreview'] {
  const copy = getDynamicCopy(locale);
  const actionSummary = formatLatestOutputActionSummary(detection, locale);

  if (latestOutput) {
    return {
      label:
        latestOutput.kind === 'product'
          ? copy.latestCapturedProduct
          : latestOutput.kind === 'search'
            ? copy.latestCapturedSearch
            : copy.latestCapturedDeals,
      title: latestOutput.headline,
      summary: [
        formatLatestOutputSummary(latestOutput, locale),
        actionSummary,
      ]
        .filter(Boolean)
        .join(' '),
      detailLines: formatLatestOutputDetailLines(latestOutput, locale),
      timestampLabel: toLocaleTimeString(latestOutput.capturedAt, locale),
      href: latestOutput.pageUrl,
      hrefLabel: copy.openLatestCapturedPage,
    };
  }

  const latestActivity = recentActivities[0];
  const summary = [latestActivity?.summary, actionSummary]
    .filter(Boolean)
    .join(' ');

  if (latestActivity && summary) {
    return {
      label: copy.latestRunnableOutput,
      title: latestActivity.label,
      summary,
      detailLines: [],
      timestampLabel: latestActivity.timestampLabel,
      href: latestActivity.href,
      hrefLabel: copy.jumpToSourcePage,
    };
  }

  if (detection.pageKind === 'unsupported' || !actionSummary) {
    return undefined;
  }

  return {
    label: copy.latestRunnableOutput,
    title: `${detection.matchedHost} · ${copy.pageKindLabel[detection.pageKind]}`,
    summary: actionSummary,
    detailLines: [],
  };
}

function deriveSecondaryNavigation(
  detection: DetectionResult,
  evidenceStatus?: SidePanelHomeViewModel['evidenceStatus'],
  locale: UiLocale = 'en'
): SidePanelHomeViewModel['secondaryNavigation'] {
  const copy = getDynamicCopy(locale);
  const readyCount = detection.capabilityStates.filter(
    (state) => state.status === 'ready'
  ).length;
  const constrainedCount = detection.capabilityStates.filter((state) =>
    ['blocked', 'degraded', 'permission_needed'].includes(state.status)
  ).length;
  const evidenceItem = evidenceStatus?.items[0];
  const blockerSummary = evidenceStatus?.blockerSummary;
  const evidenceSectionHref =
    evidenceItem?.sectionHref ?? '#live-receipt-readiness';
  const evidenceNavigation = deriveEvidenceNavigation(
    evidenceItem,
    blockerSummary,
    evidenceSectionHref,
    locale
  );

  return [
    {
      id: 'support-state',
      label: copy.reviewSupportState,
      href: '#current-site-summary',
      actionLabel: copy.openCurrentSiteSummary,
      summary:
        detection.pageKind === 'unsupported'
          ? copy.supportStateUnsupportedSummary
          : readyCount > 0
            ? copy.supportStateReadySummary(readyCount)
            : constrainedCount > 0
              ? copy.supportStateAttentionSummary(constrainedCount)
              : copy.supportStateWaitingSummary,
    },
    {
      id: 'evidence-gate',
      label: evidenceNavigation.label,
      href: evidenceItem ? evidenceSectionHref : '#readiness-summary',
      actionLabel:
        evidenceSectionHref === '#live-receipt-evidence'
          ? copy.openCaptureQueue
          : evidenceSectionHref === '#live-receipt-review'
            ? copy.openReviewLane
            : copy.openReadinessSummary,
      summary: evidenceNavigation.summary,
    },
    {
      id: 'activity-log',
      label: copy.checkRecentActivity,
      href: '#recent-activity',
      actionLabel: copy.openRecentActivity,
      summary:
        readyCount > 0
          ? copy.checkRecentActivitySummaryReady
          : copy.checkRecentActivitySummaryIdle,
    },
  ];
}

type EvidenceNavigationItem =
  NonNullable<SidePanelHomeViewModel['evidenceStatus']>['items'][number];
type EvidenceNavigationBlockerSummary =
  NonNullable<SidePanelHomeViewModel['evidenceStatus']>['blockerSummary'];

function deriveQuickActions(
  detection: DetectionResult,
  recentActivities: SidePanelHomeViewModel['recentActivities'],
  evidenceStatus?: SidePanelHomeViewModel['evidenceStatus'],
  latestOutput?: NonNullable<
    NonNullable<Parameters<typeof createHomeViewModel>[5]>['latestOutput']
  >,
  locale: UiLocale = 'en'
): SidePanelHomeViewModel['quickActions'] {
  const copy = getDynamicCopy(locale);
  const routeTarget = deriveCapabilityRouteTarget(
    recentActivities,
    evidenceStatus,
    latestOutput,
    locale
  );

  return detection.capabilityStates
    .filter((state) => state.status === 'ready')
    .slice(0, 3)
    .map((state, index) => ({
      id: state.capability,
      label: copy.capabilityActionLabel[state.capability],
      summary: `${routeTarget.summary} ${copy.capabilityExecutionSummary[state.capability]}`,
      href: routeTarget.href,
      variant: index === 0 ? 'primary' : 'secondary',
      external: routeTarget.external,
    }));
}

function formatLatestOutputActionSummary(
  detection: DetectionResult,
  locale: UiLocale = 'en'
) {
  const copy = getDynamicCopy(locale);
  const readyLabels = detection.capabilityStates
    .filter((state) => state.status === 'ready')
    .map((state) => copy.capabilityActionLabel[state.capability]);

  if (readyLabels.length === 0) {
    return undefined;
  }

  if (readyLabels.length === 1) {
    return copy.latestOutputSingle(readyLabels[0]);
  }

  return copy.latestOutputMulti(readyLabels);
}

function formatRunnableNowSummary(
  detection: DetectionResult,
  locale: UiLocale = 'en'
) {
  const copy = getDynamicCopy(locale);
  const readyActions = detection.capabilityStates
    .filter((state) => state.status === 'ready')
    .map((state) => copy.capabilityActionLabel[state.capability]);

  if (readyActions.length === 0) {
    return copy.noRunnableCapability;
  }

  if (readyActions.length === 1) {
    return copy.runnableNowSingle(readyActions[0]);
  }

  return copy.runnableNowMulti(readyActions[0], readyActions.length - 1);
}

function deriveEvidenceNavigation(
  evidenceItem: EvidenceNavigationItem | undefined,
  blockerSummary: EvidenceNavigationBlockerSummary | undefined,
  evidenceSectionHref: string,
  locale: UiLocale = 'en'
) {
  const copy = getDynamicCopy(locale);
  if (!evidenceItem) {
    return {
      label: copy.reviewSupportPolicy,
      summary: copy.reviewSupportPolicySummary,
    };
  }

  if (evidenceSectionHref === '#live-receipt-evidence') {
    return {
      label: copy.openCaptureQueue,
      summary:
        blockerSummary?.summary ??
        copy.evidenceNavigationCaptureSummary(
          formatEvidenceState(evidenceItem.status, locale)
        ),
    };
  }

  return {
    label: copy.openReviewLane,
    summary:
      blockerSummary?.summary ??
      copy.evidenceNavigationReviewSummary(
        formatEvidenceState(evidenceItem.status, locale),
        evidenceItem.title.toLowerCase()
      ),
  };
}

function deriveCapabilityRouteTarget(
  recentActivities: SidePanelHomeViewModel['recentActivities'],
  evidenceStatus?: SidePanelHomeViewModel['evidenceStatus'],
  latestOutput?: NonNullable<
    NonNullable<Parameters<typeof createHomeViewModel>[5]>['latestOutput']
  >,
  locale: UiLocale = 'en'
) {
  const copy = getDynamicCopy(locale);
  const latestActivity = recentActivities[0];
  const evidenceSource =
    evidenceStatus?.blockerSummary?.sourceHref ??
    evidenceStatus?.items.find((item) => item.sourceHref)?.sourceHref;

  if (latestActivity?.href) {
    return {
      href: latestActivity.href,
      external: true,
      summary: copy.routeBackToMerchantSummary,
    };
  }

  if (latestOutput?.pageUrl) {
    return {
      href: latestOutput.pageUrl,
      external: true,
      summary: copy.latestCapturedRouteSummary,
    };
  }

  if (evidenceSource) {
    return {
      href: evidenceSource,
      external: true,
      summary: copy.evidenceSourceRouteSummary,
    };
  }

  return {
    href: '#current-site-summary',
    external: false,
    summary: copy.currentSiteSummaryRoute,
  };
}

function deriveWorkflowBrief(
  detection: DetectionResult,
  evidenceStatus: SidePanelHomeViewModel['evidenceStatus'] | undefined,
  quickActions: SidePanelHomeViewModel['quickActions'],
  readiness: SidePanelHomeViewModel['readiness'],
  locale: UiLocale = 'en'
) {
  const copy = getDynamicCopy(locale);
  const runnableNow = formatRunnableNowSummary(detection, locale);
  const nextMove =
    readiness.operatorNextStep ??
    evidenceStatus?.blockerSummary?.nextStep ??
    quickActions[0]?.summary ??
    copy.routeIntoSupportedPageFirst;
  const currentSurface = `${detection.matchedHost} · ${copy.pageKindLabel[detection.pageKind]}`;

  if (detection.pageKind === 'unsupported') {
    return workflowCopilotBriefSchema.parse({
      tone: 'unsupported',
      title: copy.workflowCopilotHeading,
      summary: copy.workflowUnsupportedSummary,
      bullets: [
        {
          label: copy.workflowBulletCurrentSurface,
          value: currentSurface,
        },
        {
          label: copy.workflowBulletNextMove,
          value: copy.routeIntoSupportedPageFirst,
        },
      ],
      nextAction: {
        label: copy.openCurrentSiteSummary,
        reason: copy.routeIntoSupportedPageFirst,
      },
    });
  }

  if (evidenceStatus?.items.length) {
    return workflowCopilotBriefSchema.parse({
      tone: 'claim-gated',
      title: copy.workflowCopilotHeading,
      summary: copy.workflowClaimGatedSummary,
      bullets: [
        {
          label: copy.workflowBulletRunnableNow,
          value: runnableNow,
        },
        {
          label: copy.workflowBulletClaimGate,
          value:
            evidenceStatus.blockerSummary?.summary ??
            copy.reviewSupportPolicy,
        },
        {
          label: copy.workflowBulletCurrentSurface,
          value: currentSurface,
        },
      ],
      nextAction: {
        label:
          evidenceStatus.items[0]?.sectionHref === '#live-receipt-review'
            ? copy.openReviewLane
            : evidenceStatus.items[0]?.sectionHref === '#live-receipt-evidence'
              ? copy.openCaptureQueue
              : quickActions[0]?.label ?? copy.openCurrentSiteSummary,
        reason: nextMove,
      },
    });
  }

  const constrainedState = detection.capabilityStates.find((state) =>
    ['blocked', 'degraded', 'permission_needed'].includes(state.status)
  );

  if (constrainedState) {
    return workflowCopilotBriefSchema.parse({
      tone: 'needs-attention',
      title: copy.workflowCopilotHeading,
      summary: copy.workflowNeedsAttentionSummary,
      bullets: [
        {
          label: copy.workflowBulletCurrentSurface,
          value: currentSurface,
        },
        {
          label: copy.workflowBulletRunnableNow,
          value: runnableNow,
        },
        {
          label: copy.workflowBulletNextMove,
          value: nextMove,
        },
      ],
      nextAction: {
        label: quickActions[0]?.label ?? copy.openCurrentSiteSummary,
        reason: nextMove,
      },
    });
  }

  return workflowCopilotBriefSchema.parse({
    tone: 'ready-now',
    title: copy.workflowCopilotHeading,
    summary: copy.workflowReadySummary,
    bullets: [
      {
        label: copy.workflowBulletRunnableNow,
        value: runnableNow,
      },
      {
        label: copy.workflowBulletCurrentSurface,
        value: currentSurface,
      },
      {
        label: copy.workflowBulletNextMove,
        value: nextMove,
      },
    ],
    nextAction: {
      label: quickActions[0]?.label ?? copy.openCurrentSiteSummary,
      reason: nextMove,
    },
  });
}

function formatEvidenceState(
  status: LiveReceiptPlanStatus,
  locale: UiLocale = 'en'
) {
  const copy = getDynamicCopy(locale);
  switch (status) {
    case 'missing-live-receipt':
      return copy.missingLiveReceipt;
    case 'capture-in-progress':
      return copy.captureInProgress;
    case 'captured':
      return copy.capturedWaitingReview;
    case 'reviewed':
      return copy.reviewedEvidence;
    case 'rejected':
      return copy.rejectedEvidence;
    case 'expired':
      return copy.expiredEvidence;
  }
}
