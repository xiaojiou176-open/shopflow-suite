export type ShopflowLocale = 'en' | 'zh-CN';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? DeepPartial<T[K]>
    : T[K];
};

type PageKindLabel =
  | 'product'
  | 'search'
  | 'deal'
  | 'cart'
  | 'manage'
  | 'account'
  | 'unsupported'
  | 'unknown';

type LocaleCatalog = {
  common: {
    brand: string;
    displayLanguageLabel: string;
    languageOptionLabels: Record<ShopflowLocale, string>;
    openLatestCapturedPage: string;
    jumpToSourcePage: string;
    openSourcePage: string;
    openEvidenceSourcePage: string;
    openCaptureSourcePage: string;
    openCurrentCapturePage: string;
    openLatestSourcePage: string;
    openLatestDetectedPage: string;
    openDefaultRoute: string;
    capturedAtPrefix: string;
    loadingRoute: string;
    loadingQueue: string;
    loadingDetection: string;
    loadingActivity: string;
    loadingOutput: string;
    loadingNextStep: string;
    routeOriginLabels: {
      merchantSource: string;
      capturedPage: string;
      evidenceSource: string;
      evidenceGate: string;
      sidePanelSection: string;
      detectedPage: string;
      defaultRoute: string;
    };
  };
  popup: {
    defaultActionHeading: string;
    supportingRoutesHeading: string;
    noRunnableCapability: string;
    openSidePanel: string;
    viewCurrentSupportState: string;
    openSidePanelQuickActions: string;
    openSidePanelReadinessSummary: string;
    openSidePanelCaptureQueue: string;
    openSidePanelReviewLane: string;
    openSidePanelRecentActivity: string;
    openSidePanelCurrentSiteSummary: string;
    resumeLatestCapturedPage: string;
    openLatestSourcePage: string;
    openMainSurfaceSummary: string;
    openSecondaryRouteSummary: string;
    latestSourceLabel: string;
    claimBoundaryPrefix: string;
    evidenceQueuePrefix: string;
    evidenceNextStepPrefix: string;
    ledgerNote: string;
    nextStepPrefix: string;
    recentActivityPrefix: string;
    seenPrefix: string;
    quickRouterHeading: string;
    quickRouterSummary: string;
    primaryRouteHeading: string;
    secondaryRouteHeading: string;
    jumpBackHeading: string;
    jumpBackSummary: string;
    sourceCapturedSplitSummary: string;
  };
  sidePanel: {
    introSummary: string;
    liveReceiptReadinessHeading: string;
    readinessSummaryHeading: string;
    whatThisPageCanDoHeading: string;
    bestRouteHeading: string;
    runnableNowHeading: string;
    needsAttentionHeading: string;
    claimBoundaryHeading: string;
    operatorNextStepHeading: string;
    currentSiteHeading: string;
    availableOnThisPageHeading: string;
    quickActionsHeading: string;
    quickActionsSummary: string;
    primarySupportedMove: string;
    supportedMove: string;
    noRunnableCapability: string;
    blockedPathHonesty: string;
    nextStepPrefix: string;
    primaryRouteHeading: string;
    nextRouteHeading: string;
    evidenceSystemSummary: string;
    evidenceOverviewHeading: string;
    reviewLaneHeading: string;
    rawPacketLedgerHeading: string;
    decisionBriefHeading: string;
    nextAssistantMove: string;
    packetPrefix: string;
    updatedPrefix: string;
    operatorNotePrefix: string;
    nextStepPrefixInline: string;
    latestProofPrefix: string;
    countsSummary: (snapshot: {
      attempted: number;
      succeeded: number;
      failed: number;
      skipped: number;
    }) => string;
    reviewPrefix: string;
    reviewNotePrefix: string;
    recentActivityHeading: string;
    noVerifiedActivity: string;
    nextRoutesHeading: string;
    openRoute: string;
    verifiedScopePrefix: string;
    bestRouteAria: (label: string) => string;
    nextRouteAria: (label: string) => string;
    operatorNextStepAria: (label: string) => string;
    statusLabels: Record<
      'live' | 'limited' | 'idle' | 'unsupported' | 'error',
      string
    >;
    capabilityStatusLabels: Record<
      | 'ready'
      | 'unsupported_page'
      | 'unsupported_site'
      | 'permission_needed'
      | 'not_implemented'
      | 'degraded'
      | 'blocked',
      string
    >;
    sourceCapturedSplitSummary: string;
  };
  model: {
    popupSummaryNoReady: (host: string, pageKind: string) => string;
    popupSummaryReady: (
      host: string,
      pageKind: string,
      labels: string[]
    ) => string;
    unsupportedReason: string;
    unsupportedSiteLabel: string;
    unsupportedOperatorNextStep: string;
    repoReadyClaimGatedLabel: string;
    repoReadyClaimBoundaryWithScope: (scopeCopy: string) => string;
    repoReadyClaimBoundaryWithoutScope: string;
    repoReadyClaimSummaryFallback: (runnableNowSummary: string) => string;
    readyOnThisPageLabel: string;
    needsOperatorAttentionLabel: string;
    needsOperatorAttentionSummary: string;
    waitingForSupportedPageLabel: string;
    waitingForSupportedPageSummary: string;
    latestCapturedProductLabel: string;
    latestCapturedSearchLabel: string;
    latestCapturedDealsLabel: string;
    latestRunnableOutputLabel: string;
    reviewSupportStateLabel: string;
    openCurrentSiteSummary: string;
    supportStateUnsupportedSummary: string;
    supportStateReadySummary: (count: number) => string;
    supportStateAttentionSummary: (count: number) => string;
    supportStateWaitingSummary: string;
    reviewSupportPolicyLabel: string;
    reviewSupportPolicySummary: string;
    openCaptureQueue: string;
    openReviewLane: string;
    openReadinessSummary: string;
    checkRecentActivityLabel: string;
    openRecentActivity: string;
    recentActivityReadySummary: string;
    recentActivityIdleSummary: string;
    latestOutputSingle: (label: string) => string;
    latestOutputMulti: (labels: string[]) => string;
    latestOutputSummaryProductWithPrice: (price: string) => string;
    latestOutputSummaryProductGeneric: string;
    latestOutputSummarySearchTopResult: (title: string) => string;
    latestOutputSummarySearchGeneric: (count: number) => string;
    latestOutputSummaryDealLead: (title: string) => string;
    latestOutputSummaryDealGeneric: (count: number) => string;
    latestOutputDetailLabels: Record<
      | 'price'
      | 'availability'
      | 'sku'
      | 'results-count'
      | 'top-match'
      | 'lead-deal',
      string
    >;
    runnableNowEmpty: string;
    runnableNowSingle: (label: string) => string;
    runnableNowMulti: (primaryLabel: string, remainingCount: number) => string;
    missingEvidenceSummary: string;
    captureInProgressSummary: string;
    capturedWaitingReviewSummary: string;
    reviewedEvidenceSummary: string;
    rejectedEvidenceSummary: string;
    expiredEvidenceSummary: string;
    captureLaneClearSummary: string;
    noReviewLaneItems: string;
    reviewPendingSummary: (count: number) => string;
    reviewedCountSummary: (count: number) => string;
    rejectedCountSummary: (count: number) => string;
    expiredCountSummary: (count: number) => string;
    capabilityLabels: Record<
      | 'extract_product'
      | 'extract_search'
      | 'extract_deals'
      | 'run_action'
      | 'export_data',
      string
    >;
    capabilityActionLabels: Record<
      | 'extract_product'
      | 'extract_search'
      | 'extract_deals'
      | 'run_action'
      | 'export_data',
      string
    >;
    capabilityDescriptions: Record<
      | 'extract_product'
      | 'extract_search'
      | 'extract_deals'
      | 'run_action'
      | 'export_data',
      string
    >;
    pageKindLabels: Record<PageKindLabel, string>;
    capabilityExecutionSummaries: Record<
      | 'extract_product'
      | 'extract_search'
      | 'extract_deals'
      | 'run_action'
      | 'export_data',
      string
    >;
    evidenceMissingLabel: string;
    evidenceInProgressLabel: string;
    evidenceReviewPendingLabel: string;
    evidenceReviewedLabel: string;
    evidenceRejectedLabel: string;
    evidenceExpiredLabel: string;
    captureQueueSummary: (count: number) => string;
    captureInProgressQueueSummary: (count: number) => string;
    reviewPendingQueueSummary: (count: number) => string;
    reviewedQueueSummary: (count: number) => string;
    reviewedEvidenceForAppSummary: (count: number) => string;
    missingEvidenceForAppSummary: (count: number) => string;
    captureInProgressForAppSummary: (count: number) => string;
    reviewPendingForAppSummary: (count: number) => string;
    rejectedForAppSummary: (count: number) => string;
    expiredForAppSummary: (count: number) => string;
    blockerSummaryMissingLabel: string;
    blockerSummaryInProgressLabel: string;
    blockerSummaryReviewPendingLabel: string;
    blockerSummaryReviewedLabel: string;
    blockerSummaryMissingSummary: (queueSummary: string) => string;
    blockerSummaryInProgressSummary: (queueSummary: string) => string;
    blockerSummaryReviewPendingSummary: (queueSummary: string) => string;
    blockerSummaryReviewedSummary: (queueSummary: string) => string;
    evidenceNavigationCaptureSummary: (statusLabel: string) => string;
    evidenceNavigationReviewSummary: (
      statusLabel: string,
      title: string
    ) => string;
    routeBackToMerchantSummary: string;
    latestSourceRouteSummary: (label: string, summary: string) => string;
    latestCapturedRouteSummary: string;
    evidenceSourceRouteSummary: string;
    currentSiteSummaryRoute: string;
    reviewClaimGateLabel: string;
    reviewClaimGateSummary: string;
    reviewReadinessSummaryLabel: string;
    reviewReadinessSummarySummary: string;
    checkRecentActivitySummaryReady: string;
    checkRecentActivitySummaryIdle: string;
    workflowCopilotHeading: string;
    workflowReadySummary: string;
    workflowClaimGatedSummary: string;
    workflowNeedsAttentionSummary: string;
    workflowUnsupportedSummary: string;
    workflowBulletRunnableNow: string;
    workflowBulletClaimGate: string;
    workflowBulletCurrentSurface: string;
    workflowBulletNextMove: string;
  };
  suite: {
    internalAlphaOnly: string;
    startHereHeading: string;
    alphaGuardrailsHeading: string;
    priorityRoutesHeading: string;
    priorityRoutesSummary: string;
    claimReadinessHeading: string;
    claimReadinessSummary: string;
    currentRolloutHeading: string;
    currentRolloutSummary: string;
    supportDesksHeading: string;
    supportDesksSummary: string;
    inspectStatusLabel: (publicName: string) => string;
    inspectStatusActionLabel: string;
    hideStatusActionLabel: string;
    priorityRouteAria: (publicName: string, label: string) => string;
    frontDoorAria: (publicName: string, label: string) => string;
    operatorNextStepAria: (publicName: string, label: string) => string;
    priorityPacketActionAria: (publicName: string, label: string) => string;
    decisionBriefRouteAria: (publicName: string, label: string) => string;
    openSidePanelFamilyChooserLabel: string;
    openSidePanelRolloutMapLabel: string;
    openSidePanelClaimReadinessLabel: string;
    latestDetectionHeading: string;
    latestRecentActivityHeading: string;
    latestCapturedOutputHeading: string;
    frontDoorHeading: string;
    evidenceQueueHeading: string;
    priorityPacketHeading: string;
    operatorNextStepHeading: string;
    decisionBriefHeading: string;
    noOutstandingPacket: string;
    providerRuntimeSeamHeading: string;
    providerRuntimeSeamSummary: string;
    providerRuntimeSeamBaseUrlHeading: string;
    providerRuntimeSeamBoundaryHeading: string;
    providerRuntimeSeamBoundaryNote: string;
    providerRuntimeSeamRouteSummary: (baseUrl: string) => string;
    providerRuntimeSeamAcquisitionModes: (modes: string) => string;
    providerRuntimeSeamProviderSummary: (providerName: string) => string;
    providerRuntimeSeamStartLabel: (providerName: string) => string;
    providerRuntimeSeamCaptureLabel: (providerName: string) => string;
    providerRuntimeSeamNotConfigured: string;
    providerRuntimeSeamConfigureHint: string;
    evidenceGatesHeading: string;
    evidenceGatesSummary: string;
    verifiedScopeHeading: string;
    verifiedScopeSummary: string;
    openRolloutRow: (publicName: string) => string;
    openVerifiedScopeClause: (publicName: string) => string;
    priorityLabels: Record<
      | 'waiting-for-review'
      | 'needs-capture'
      | 'ready-to-inspect'
      | 'seed-runtime',
      string
    >;
    defaultRouteLabelsByStoreId: Record<
      | 'albertsons'
      | 'kroger'
      | 'amazon'
      | 'costco'
      | 'walmart'
      | 'weee'
      | 'target'
      | 'temu',
      string
    >;
    noFreshContextSummary: (routeLabel: string, publicName: string) => string;
    appSummary: string;
    operatorPromise: string;
    guardrails: string[];
    startHereCards: Array<{ title: string; summary: string; ctaLabel: string }>;
    suiteNotesByAppId: Record<
      | 'ext-albertsons'
      | 'ext-kroger'
      | 'ext-amazon'
      | 'ext-costco'
      | 'ext-walmart'
      | 'ext-weee'
      | 'ext-target'
      | 'ext-temu',
      string
    >;
    statusBoard: {
      repoVerifiedClear: { label: string; summary: string; ctaLabel: string };
      repoVerifiedClaimGated: {
        label: string;
        summary: string;
        ctaLabel: string;
      };
      internalAlpha: { label: string; summary: string; ctaLabel: string };
    };
    waitingReviewRouteLabel: string;
    waitingReviewRouteSummary: (count: number) => string;
    reviewFromLatestCaptureLabel: string;
    reviewFromLatestCaptureSummary: (count: number) => string;
    resumeCapturePathLabel: string;
    resumeCapturePathSummary: (count: number) => string;
    resumeCaptureFromLatestCapturedPageLabel: string;
    resumeCaptureFromLatestCapturedPageSummary: (count: number) => string;
    inspectLatestSourcePageLabel: string;
    inspectLatestSourcePageSummary: string;
    inspectLatestCapturedPageLabel: string;
    inspectLatestCapturedPageSummary: string;
    inspectLatestDetectedPageLabel: string;
    inspectLatestDetectedPageSummary: string;
    openEvidenceSourcePageLabel: string;
    openCaptureSourcePageLabel: string;
    openLatestSourcePageLabel: string;
    resumeFromLatestSourcePageLabel: string;
    openLatestCapturedPageLabel: string;
    resumeFromLatestCapturedPageLabel: string;
    openLatestDetectedPageLabel: string;
    routeSurfaceLabels: {
      latestSourcePage: string;
      latestCapturedPage: string;
      latestDetectedPage: string;
      evidenceSourcePage: string;
      captureSourcePage: string;
      defaultStoreRoute: string;
    };
    noDetectionRecorded: string;
    noRecentActivity: string;
    noCapturedOutput: string;
    noRequiredQueue: string;
    evidenceQueueSummary: (
      reviewed: number,
      reviewPending: number,
      captureWork: number
    ) => string;
    nextStepInspectStoreApp: string;
    priorityQueueAction: {
      finishCapture: (suffix: string) => string;
      review: (suffix: string) => string;
      recapture: (suffix: string) => string;
      capture: (suffix: string) => string;
      open: (suffix: string) => string;
    };
    fallbackEvidenceRouteSummary: (
      defaultRouteLabel: string,
      title: string
    ) => string;
  };
};

const en: LocaleCatalog = {
  common: {
    brand: 'Shopflow',
    displayLanguageLabel: 'Display language',
    languageOptionLabels: {
      en: 'English',
      'zh-CN': '简体中文',
    },
    openLatestCapturedPage: 'Open latest captured page',
    jumpToSourcePage: 'Jump to source page',
    openSourcePage: 'Open source page',
    openEvidenceSourcePage: 'Open evidence source page',
    openCaptureSourcePage: 'Open capture source page',
    openCurrentCapturePage: 'Open current capture page',
    openLatestSourcePage: 'Jump to latest source page',
    openLatestDetectedPage: 'Open latest detected page',
    openDefaultRoute: 'Open default route',
    capturedAtPrefix: 'Captured',
    loadingRoute: 'Loading the next useful route...',
    loadingQueue: 'Loading evidence queue...',
    loadingDetection: 'Loading the latest shared runtime context...',
    loadingActivity: 'Loading recent operator activity...',
    loadingOutput: 'Loading the latest captured output...',
    loadingNextStep: 'Loading next step...',
    routeOriginLabels: {
      merchantSource: 'Merchant source page',
      capturedPage: 'Latest captured page',
      evidenceSource: 'Evidence source page',
      evidenceGate: 'Evidence gate',
      sidePanelSection: 'Side Panel section',
      detectedPage: 'Latest detected page',
      defaultRoute: 'Default store route',
    },
  },
  popup: {
    defaultActionHeading: 'What this page can do now',
    supportingRoutesHeading: 'Supporting routes',
    noRunnableCapability:
      'No runnable capability is available on this page yet.',
    openSidePanel: 'Open Side Panel',
    viewCurrentSupportState: 'View current support state',
    openSidePanelQuickActions: 'Open Side Panel quick actions',
    openSidePanelReadinessSummary: 'Open Side Panel readiness summary',
    openSidePanelCaptureQueue: 'Open Side Panel capture queue',
    openSidePanelReviewLane: 'Open Side Panel review lane',
    openSidePanelRecentActivity: 'Open Side Panel recent activity',
    openSidePanelCurrentSiteSummary: 'Open Side Panel current site summary',
    resumeLatestCapturedPage: 'Resume latest captured page',
    openLatestSourcePage: 'Open latest source page',
    openMainSurfaceSummary:
      'Open the main Shopflow surface for the current page.',
    openSecondaryRouteSummary:
      'Jump to the next support or claim-boundary view without turning popup into a second console.',
    latestSourceLabel: 'Jump to latest source page',
    claimBoundaryPrefix: 'Claim boundary:',
    evidenceQueuePrefix: 'Evidence queue:',
    evidenceNextStepPrefix: 'Evidence next step:',
    ledgerNote:
      'Ledger note: the repo-owned ledger tracks packet state only and never replaces the reviewed live bundle.',
    nextStepPrefix: 'Next step:',
    recentActivityPrefix: 'Recent activity:',
    seenPrefix: 'Seen',
    quickRouterHeading: 'Quick router',
    quickRouterSummary:
      'Use popup for the first route. Use the Side Panel for the real work.',
    primaryRouteHeading: 'Primary route',
    secondaryRouteHeading: 'Secondary route',
    jumpBackHeading: 'Jump back',
    jumpBackSummary:
      'Return to the freshest known merchant page from shared runtime context.',
    sourceCapturedSplitSummary:
      'Latest source page routes you back into the live merchant flow. Latest captured page reopens the freshest captured output.',
  },
  sidePanel: {
    introSummary:
      'Start with what this page can do now, then follow the claim and evidence gates before making support statements.',
    liveReceiptReadinessHeading: 'Live receipt readiness',
    readinessSummaryHeading: 'Readiness summary',
    whatThisPageCanDoHeading: 'What this page can do now',
    bestRouteHeading: 'Best route right now',
    runnableNowHeading: 'Runnable now',
    needsAttentionHeading: 'Needs attention',
    claimBoundaryHeading: 'Claim boundary',
    operatorNextStepHeading: 'Operator next step',
    currentSiteHeading: 'Current site',
    availableOnThisPageHeading: 'Available on this page',
    quickActionsHeading: 'Quick actions',
    quickActionsSummary:
      'These cards are real capability routes. Pick the move you want, then jump straight into the page or section that can actually run it.',
    primarySupportedMove: 'Primary supported move',
    supportedMove: 'Supported move',
    noRunnableCapability:
      'No runnable capability is available on this page yet.',
    blockedPathHonesty:
      'The app stays explicit instead of pretending a blocked path can run.',
    nextStepPrefix: 'Next step:',
    primaryRouteHeading: 'Primary route',
    nextRouteHeading: 'Next route',
    evidenceSystemSummary:
      'Use this operator system in three layers: evidence overview for capture work, review lane for review outcomes, and raw packet ledger for audit detail.',
    evidenceOverviewHeading: 'Evidence overview',
    reviewLaneHeading: 'Review lane',
    rawPacketLedgerHeading: 'Raw packet ledger',
    decisionBriefHeading: 'Decision brief',
    nextAssistantMove: 'Next assistant move',
    packetPrefix: 'Packet:',
    updatedPrefix: 'Updated:',
    operatorNotePrefix: 'Operator note:',
    nextStepPrefixInline: 'Next step:',
    latestProofPrefix: 'Latest proof:',
    countsSummary: (snapshot) =>
      `Counts: attempted ${snapshot.attempted} · succeeded ${snapshot.succeeded} · failed ${snapshot.failed} · skipped ${snapshot.skipped}`,
    reviewPrefix: 'Review:',
    reviewNotePrefix: 'Review note:',
    recentActivityHeading: 'Recent activity',
    noVerifiedActivity:
      'No verified activity has been recorded yet for this browser session.',
    nextRoutesHeading: 'Next routes',
    openRoute: 'Open route',
    verifiedScopePrefix: 'Verified scope:',
    bestRouteAria: (label) => `Best route right now: ${label}`,
    nextRouteAria: (label) => `Next route: ${label}`,
    operatorNextStepAria: (label) => `Operator next step: ${label}`,
    statusLabels: {
      live: 'Ready now',
      limited: 'Limited',
      idle: 'Waiting',
      unsupported: 'Unsupported',
      error: 'Attention',
    },
    capabilityStatusLabels: {
      ready: 'Ready',
      unsupported_page: 'Unsupported page',
      unsupported_site: 'Unsupported site',
      permission_needed: 'Permission needed',
      not_implemented: 'Not implemented',
      degraded: 'Degraded',
      blocked: 'Blocked',
    },
    sourceCapturedSplitSummary:
      'Latest source page returns to the live merchant flow. Latest captured page reopens the freshest captured output.',
  },
  model: {
    popupSummaryNoReady: (host, pageKind) =>
      `${host} · ${pageKind}. No ready capabilities on this page yet.`,
    popupSummaryReady: (host, pageKind, labels) =>
      `${host} · ${pageKind}. Ready: ${labels.join(', ')}.`,
    unsupportedReason:
      'Open a supported store page before claiming live capability support.',
    unsupportedSiteLabel: 'Unsupported site',
    unsupportedOperatorNextStep: 'Route into a supported store page first.',
    repoReadyClaimGatedLabel: 'Repo-ready, claim-gated',
    repoReadyClaimBoundaryWithScope: (scopeCopy) =>
      `${scopeCopy} Public wording stays gated until live receipt review is complete.`,
    repoReadyClaimBoundaryWithoutScope:
      'Keep public wording inside the verified claim boundary until live receipt review is complete.',
    repoReadyClaimSummaryFallback: (runnableNowSummary) =>
      `${runnableNowSummary} Public wording still stays behind evidence review.`,
    readyOnThisPageLabel: 'Ready on this page',
    needsOperatorAttentionLabel: 'Needs operator attention',
    needsOperatorAttentionSummary:
      'This page is recognized, but the current state is not fully runnable yet.',
    waitingForSupportedPageLabel: 'Waiting for a supported page',
    waitingForSupportedPageSummary:
      'Open a supported page to load current readiness and evidence guidance.',
    latestCapturedProductLabel: 'Latest captured product',
    latestCapturedSearchLabel: 'Latest captured search',
    latestCapturedDealsLabel: 'Latest captured deals',
    latestRunnableOutputLabel: 'Latest runnable output',
    reviewSupportStateLabel: 'Review support state',
    openCurrentSiteSummary: 'Open current site summary',
    supportStateUnsupportedSummary:
      'This page is outside the current support boundary.',
    supportStateReadySummary: (count) =>
      `${count} ${count === 1 ? 'capability is' : 'capabilities are'} ready right now.`,
    supportStateAttentionSummary: (count) =>
      `${count} ${count === 1 ? 'capability needs' : 'capabilities need'} operator attention before they can run.`,
    supportStateWaitingSummary:
      'Open a supported page to load the current support state.',
    reviewSupportPolicyLabel: 'Review support policy',
    reviewSupportPolicySummary:
      'Use this surface for repo truth, not for public-ready wording.',
    openCaptureQueue: 'Open capture queue',
    openReviewLane: 'Open review lane',
    openReadinessSummary: 'Open readiness summary',
    checkRecentActivityLabel: 'Check recent activity',
    openRecentActivity: 'Open recent activity',
    recentActivityReadySummary:
      'Use recent activity to confirm the latest supported output on this page.',
    recentActivityIdleSummary:
      'Recent activity stays lightweight so this page remains a router, not a log console.',
    latestOutputSingle: (label) => `Latest runnable output: ${label}.`,
    latestOutputMulti: (labels) =>
      `Latest runnable outputs: ${labels.join(', ')}.`,
    latestOutputSummaryProductWithPrice: (price) =>
      `Captured product details with price ${price}.`,
    latestOutputSummaryProductGeneric:
      'Captured product details from the current page.',
    latestOutputSummarySearchTopResult: (title) => `Top result: ${title}.`,
    latestOutputSummarySearchGeneric: (count) =>
      `Captured ${count} search result${count === 1 ? '' : 's'} from the current page.`,
    latestOutputSummaryDealLead: (title) => `Lead deal: ${title}.`,
    latestOutputSummaryDealGeneric: (count) =>
      `Captured ${count} deal${count === 1 ? '' : 's'} from the current page.`,
    latestOutputDetailLabels: {
      price: 'Price',
      availability: 'Availability',
      sku: 'SKU',
      'results-count': 'Results',
      'top-match': 'Top match',
      'lead-deal': 'Lead deal',
    },
    runnableNowEmpty: 'No runnable capability is available on this page yet.',
    runnableNowSingle: (label) => `${label} is runnable right now.`,
    runnableNowMulti: (primaryLabel, remainingCount) =>
      `${primaryLabel} and ${remainingCount} more ${remainingCount === 1 ? 'move are' : 'moves are'} runnable right now.`,
    missingEvidenceSummary: 'Missing live receipt',
    captureInProgressSummary: 'Capture in progress',
    capturedWaitingReviewSummary: 'Capture recorded and waiting for review',
    reviewedEvidenceSummary: 'Reviewed evidence',
    rejectedEvidenceSummary: 'Rejected evidence',
    expiredEvidenceSummary: 'Expired evidence',
    captureLaneClearSummary:
      'Capture lane is clear. Every required packet is either waiting for review or already has a review outcome.',
    noReviewLaneItems: 'No packet has entered the review lane yet.',
    reviewPendingSummary: (count) =>
      `${count} captured packet${count === 1 ? '' : 's'} are waiting for explicit review.`,
    reviewedCountSummary: (count) =>
      `${count} packet${count === 1 ? '' : 's'} already passed review and can support release decisioning.`,
    rejectedCountSummary: (count) =>
      `${count} packet${count === 1 ? '' : 's'} were rejected and must go back through capture before another review pass.`,
    expiredCountSummary: (count) =>
      `${count} packet${count === 1 ? '' : 's'} expired and must be recaptured before reuse.`,
    capabilityLabels: {
      extract_product: 'Extract Product',
      extract_search: 'Extract Search Results',
      extract_deals: 'Find Deals',
      run_action: 'Run Actions',
      export_data: 'Export Data',
    },
    capabilityActionLabels: {
      extract_product: 'Extract this product',
      extract_search: 'Capture search results',
      extract_deals: 'Review current deals',
      run_action: 'Open supported workflow',
      export_data: 'Export structured data',
    },
    capabilityDescriptions: {
      extract_product: 'Capture normalized product details for this page.',
      extract_search:
        'Collect structured search results from the current page.',
      extract_deals: 'List current deal surfaces without guessing support.',
      run_action: 'Run supported multi-step workflows when the page allows it.',
      export_data: 'Export captured data in a stable machine-readable shape.',
    },
    pageKindLabels: {
      product: 'product',
      search: 'search',
      deal: 'deal',
      cart: 'cart',
      manage: 'manage',
      account: 'account',
      unsupported: 'unsupported',
      unknown: 'unknown',
    },
    capabilityExecutionSummaries: {
      extract_product:
        'Use the current product page as the execution surface for product capture.',
      extract_search:
        'Use the current search page as the execution surface for search capture.',
      extract_deals:
        'Use the current deals surface as the execution surface for deal review.',
      run_action:
        'Use the current supported workflow page as the execution surface for the next operator move.',
      export_data:
        'Use the freshest captured or detected page context before exporting structured data.',
    },
    evidenceMissingLabel: 'Live receipt capture still missing',
    evidenceInProgressLabel: 'Operator packet assembly in progress',
    evidenceReviewPendingLabel: 'Captured packets waiting for review',
    evidenceReviewedLabel: 'Reviewed live receipt queue',
    evidenceRejectedLabel: 'Rejected live receipt queue',
    evidenceExpiredLabel: 'Expired live receipt queue',
    blockerSummaryMissingLabel: 'Still missing reviewable evidence',
    blockerSummaryInProgressLabel: 'Capture still in progress',
    blockerSummaryReviewPendingLabel: 'Waiting for explicit evidence review',
    blockerSummaryReviewedLabel: 'Reviewed packets recorded in repo ledger',
    blockerSummaryMissingSummary: (queueSummary) =>
      `${queueSummary}. Public wording stays blocked until a reviewable packet exists.`,
    blockerSummaryInProgressSummary: (queueSummary) =>
      `${queueSummary}. In-progress packets are not reviewable evidence yet.`,
    blockerSummaryReviewPendingSummary: (queueSummary) =>
      `${queueSummary}. Captured packets still need an explicit review pass before release decisioning.`,
    blockerSummaryReviewedSummary: (queueSummary) =>
      `${queueSummary}. The repo-owned ledger tracks packet state only and does not replace the external live bundle.`,
    evidenceNavigationCaptureSummary: (statusLabel) =>
      `${statusLabel} is still blocking public wording until fresh capture work is complete.`,
    evidenceNavigationReviewSummary: (statusLabel, title) =>
      `${statusLabel} still defines the current claim boundary for ${title}.`,
    captureQueueSummary: (count) =>
      `${count} packet${count === 1 ? ' still needs' : 's still need'} capture or recapture`,
    captureInProgressQueueSummary: (count) =>
      `${count} packet${count === 1 ? '' : 's'} still in progress`,
    reviewPendingQueueSummary: (count) =>
      `${count} packet${count === 1 ? '' : 's'} waiting for explicit review`,
    reviewedQueueSummary: (count) =>
      `${count} packet${count === 1 ? '' : 's'} reviewed`,
    reviewedEvidenceForAppSummary: (count) =>
      count === 1
        ? 'All required live receipt captures were reviewed for this app.'
        : `${count} required live receipt captures were reviewed for this app.`,
    missingEvidenceForAppSummary: (count) =>
      `${count} live receipt capture${count === 1 ? '' : 's'} still missing for this app.`,
    captureInProgressForAppSummary: (count) =>
      `${count} operator packet${count === 1 ? '' : 's'} still in progress for this app and not reviewable yet.`,
    reviewPendingForAppSummary: (count) =>
      `${count} live receipt capture${count === 1 ? '' : 's'} recorded and waiting for review.`,
    rejectedForAppSummary: (count) =>
      `${count} packet${count === 1 ? '' : 's'} were rejected in review and now require recapture.`,
    expiredForAppSummary: (count) =>
      `${count} packet${count === 1 ? '' : 's'} expired and must be recaptured before reuse.`,
    routeBackToMerchantSummary:
      'Route back to the freshest known merchant page before you run this capability.',
    latestSourceRouteSummary: (label, summary) =>
      `Return to ${label}. ${summary}`,
    latestCapturedRouteSummary:
      'Use the latest captured page when you need a real route but no fresher source page was recorded.',
    evidenceSourceRouteSummary:
      'Resume from the evidence-linked source page so the next operator move starts in the right place.',
    currentSiteSummaryRoute:
      'Open the current site summary first to confirm the active host and page kind before you route deeper.',
    reviewClaimGateLabel: 'Review claim gate',
    reviewClaimGateSummary:
      'Inspect evidence status and verified-scope cues before using public wording.',
    reviewReadinessSummaryLabel: 'Review readiness summary',
    reviewReadinessSummarySummary:
      'Use the top summary card to separate runnable-now truth from follow-up operator work.',
    checkRecentActivitySummaryReady:
      'Confirm the latest recorded output and use its jump-back link if you need the source page.',
    checkRecentActivitySummaryIdle:
      'Recent activity stays lightweight so this surface remains a router, not a second console.',
    workflowCopilotHeading: 'Workflow copilot',
    workflowReadySummary:
      'Repo verification is strong enough to inspect this path. Stay inside the runnable-now truth and use the freshest page context.',
    workflowClaimGatedSummary:
      'Repo verification is strong enough to inspect this path, but public wording still stays behind evidence review.',
    workflowNeedsAttentionSummary:
      'The page is recognized, but the next operator move still needs attention before this route becomes safely runnable.',
    workflowUnsupportedSummary:
      'This surface is outside the current supported boundary. Route into a supported page before making support statements.',
    workflowBulletRunnableNow: 'Runnable now',
    workflowBulletClaimGate: 'Claim gate',
    workflowBulletCurrentSurface: 'Current surface',
    workflowBulletNextMove: 'Next move',
  },
  suite: {
    internalAlphaOnly: 'Internal alpha only',
    startHereHeading: 'Start here',
    alphaGuardrailsHeading: 'Alpha guardrails',
    priorityRoutesHeading: 'Priority routes',
    priorityRoutesSummary:
      'Think of this as the concierge desk. It points to the fastest useful store route right now instead of making operators open every shell manually.',
    claimReadinessHeading: 'Claim readiness board',
    claimReadinessSummary:
      'Read this as a routing board, not a launch board. It tells operators where claim work is still blocked.',
    currentRolloutHeading: 'Current rollout map',
    currentRolloutSummary:
      'Each row tells you which store shell to inspect next, why it is still in its current state, and what the latest shared runtime context says right now.',
    supportDesksHeading: 'Support desks',
    supportDesksSummary:
      'Keep verified-scope clauses, evidence queues, provider seam previews, and alpha rules one layer down. Open these desks only when you need deeper governance detail.',
    inspectStatusLabel: (publicName) => `Inspect status for ${publicName}`,
    inspectStatusActionLabel: 'Inspect status',
    hideStatusActionLabel: 'Hide status',
    priorityRouteAria: (publicName, label) =>
      `Priority route for ${publicName}: ${label}`,
    frontDoorAria: (publicName, label) =>
      `Front door for ${publicName}: ${label}`,
    operatorNextStepAria: (publicName, label) =>
      `Operator next step for ${publicName}: ${label}`,
    priorityPacketActionAria: (publicName, label) =>
      `Priority packet action for ${publicName}: ${label}`,
    decisionBriefRouteAria: (publicName, label) =>
      `Decision brief route for ${publicName}: ${label}`,
    openSidePanelFamilyChooserLabel: 'Open Side Panel family chooser',
    openSidePanelRolloutMapLabel: 'Open Side Panel rollout map',
    openSidePanelClaimReadinessLabel: 'Open Side Panel claim readiness board',
    latestDetectionHeading: 'Latest detection',
    latestRecentActivityHeading: 'Latest recent activity',
    latestCapturedOutputHeading: 'Latest captured output',
    frontDoorHeading: 'Front door for this app',
    evidenceQueueHeading: 'Evidence queue',
    priorityPacketHeading: 'Priority packet',
    operatorNextStepHeading: 'Operator next step',
    decisionBriefHeading: 'Decision brief',
    noOutstandingPacket:
      'No outstanding live receipt packet is waiting right now.',
    providerRuntimeSeamHeading: 'Provider runtime seam',
    providerRuntimeSeamSummary:
      'This internal-alpha section is the first real Shopflow runtime consumer for Switchyard-style provider routes. It stays read-only and does not replace merchant live proof.',
    providerRuntimeSeamBaseUrlHeading: 'Configured runtime base URL',
    providerRuntimeSeamBoundaryHeading: 'Boundary note',
    providerRuntimeSeamBoundaryNote:
      'These routes only hand BYOK / web-login / auth-session work toward the external runtime layer. Shopflow still owns storefront truth, claim wording, and reviewed merchant evidence.',
    providerRuntimeSeamRouteSummary: (baseUrl) =>
      `Use these route previews only when the external runtime is already reachable at ${baseUrl}.`,
    providerRuntimeSeamAcquisitionModes: (modes) =>
      `Acquisition modes: ${modes}.`,
    providerRuntimeSeamProviderSummary: (providerName) =>
      `${providerName} can reuse the same read-only seam without turning Shopflow into a provider runtime.`,
    providerRuntimeSeamStartLabel: (providerName) =>
      `Start ${providerName} acquisition`,
    providerRuntimeSeamCaptureLabel: (providerName) =>
      `Capture ${providerName} acquisition`,
    providerRuntimeSeamNotConfigured:
      'No Switchyard base URL is configured for this Suite session yet.',
    providerRuntimeSeamConfigureHint:
      'Open this internal-alpha side panel with a switchyardBaseUrl query parameter when you want to preview the real runtime handoff routes without overclaiming a public runtime product.',
    evidenceGatesHeading: 'Evidence gates still blocking public wording',
    evidenceGatesSummary:
      'Some routes still need capture work. Others are already waiting for explicit review. Repo verification alone does not clear either gate.',
    verifiedScopeHeading: 'Verified scope navigator',
    verifiedScopeSummary:
      "Use these clauses when checking whether public wording is still inside today's verified boundary.",
    openRolloutRow: (publicName) => `Open rollout row for ${publicName}`,
    openVerifiedScopeClause: (publicName) =>
      `Open verified scope clause for ${publicName}`,
    priorityLabels: {
      'waiting-for-review': 'Fastest path to unblock claim review',
      'needs-capture': 'Needs fresh capture',
      'ready-to-inspect': 'Ready for live inspection',
      'seed-runtime': 'Needs first runtime context',
    },
    defaultRouteLabelsByStoreId: {
      albertsons: 'Open Safeway home',
      kroger: 'Open Fred Meyer home',
      amazon: 'Open Amazon home',
      costco: 'Open Costco home',
      walmart: 'Open Walmart home',
      weee: 'Open Weee home',
      target: 'Open Target home',
      temu: 'Open Temu home',
    },
    noFreshContextSummary: (routeLabel, publicName) =>
      `No fresh page context exists yet. ${routeLabel} so Suite can capture runtime context for ${publicName}.`,
    appSummary:
      'Internal-only alpha composition shell for capability navigation, rollout visibility, and evidence readiness.',
    operatorPromise:
      'Use this internal alpha surface to route into the right store app, inspect claim gates, and review which evidence gate still keeps public wording closed.',
    guardrails: [
      'No public claim',
      'No second logic plane',
      'Routes into store apps instead of replacing them',
    ],
    startHereCards: [
      {
        title: 'Route into the right store shell',
        summary:
          'Start with rollout state and verified scope so operators open the correct store app instead of guessing from brand names alone.',
        ctaLabel: 'Open rollout map',
      },
      {
        title: 'Inspect claim gates before release talk',
        summary:
          'Keep repo-verified progress separate from public-ready wording by checking evidence gates first.',
        ctaLabel: 'Open claim readiness board',
      },
      {
        title: 'Use Suite as the lobby, not the workflow engine',
        summary:
          'Verified scope, evidence gates, provider seam previews, and alpha rules still stay available, but they should not outrank the first route.',
        ctaLabel: 'Open support desks',
      },
    ],
    suiteNotesByAppId: {
      'ext-albertsons':
        '当前已验证范围：Safeway。public-ready 仍被实时证据挡住。',
      'ext-kroger':
        'Family 壳层已 repo-verified，但 public-ready 仍需要 Fred Meyer + QFC 的已验证范围证据。',
      'ext-amazon': 'Storefront shell 基线已通过。',
      'ext-costco': 'Storefront shell 基线已通过。',
      'ext-walmart': 'Storefront shell 基线已通过。',
      'ext-weee': 'Wave 3 storefront shell 基线已通过。',
      'ext-target': 'Deals 能力 storefront shell 基线已通过。',
      'ext-temu':
        '差异化 warehouse filter 已 repo-verified，但 public-ready 仍需要实时证据。',
    },
    statusBoard: {
      repoVerifiedClear: {
        label: 'Repo-verified and not waiting on extra evidence',
        summary:
          'Use the rollout map to inspect shells that are repo-verified without an active extra evidence blocker.',
        ctaLabel: 'Open rollout map',
      },
      repoVerifiedClaimGated: {
        label: 'Repo-verified but still claim-gated by evidence',
        summary:
          'Use evidence gates to capture or review the next packet before you let repo-verified progress drift into public-ready wording.',
        ctaLabel: 'Open evidence gates',
      },
      internalAlpha: {
        label: 'Internal alpha only surfaces',
        summary:
          'Use alpha guardrails when you need to confirm Suite is still routing into store apps instead of behaving like a second workflow engine.',
        ctaLabel: 'Open alpha guardrails',
      },
    },
    waitingReviewRouteLabel: 'Review waiting evidence on source page',
    waitingReviewRouteSummary: (count) =>
      `${count} packet${count === 1 ? '' : 's'} are waiting for review. Start from the freshest known operator page for this app.`,
    reviewFromLatestCaptureLabel: 'Review waiting evidence from latest capture',
    reviewFromLatestCaptureSummary: (count) =>
      `${count} packet${count === 1 ? '' : 's'} are waiting for review. Open the latest captured page before you inspect the review lane.`,
    resumeCapturePathLabel: 'Resume capture path',
    resumeCapturePathSummary: (count) =>
      `${count} packet${count === 1 ? '' : 's'} still need capture work. Start from the freshest known source page for this app.`,
    resumeCaptureFromLatestCapturedPageLabel:
      'Resume capture from latest captured page',
    resumeCaptureFromLatestCapturedPageSummary: (count) =>
      `${count} packet${count === 1 ? '' : 's'} still need capture work. Open the latest captured page and continue from there.`,
    inspectLatestSourcePageLabel: 'Inspect latest source page',
    inspectLatestSourcePageSummary:
      'Return to the freshest known operator page for this app.',
    inspectLatestCapturedPageLabel: 'Inspect latest captured page',
    inspectLatestCapturedPageSummary:
      'Open the page behind the freshest captured output for this app.',
    inspectLatestDetectedPageLabel: 'Inspect latest detected page',
    inspectLatestDetectedPageSummary:
      'Open the most recently detected page for this app.',
    openEvidenceSourcePageLabel: 'Open evidence source page',
    openCaptureSourcePageLabel: 'Open capture source page',
    openLatestSourcePageLabel: 'Open latest source page',
    resumeFromLatestSourcePageLabel: 'Resume from latest source page',
    openLatestCapturedPageLabel: 'Open latest captured page',
    resumeFromLatestCapturedPageLabel: 'Resume from latest captured page',
    openLatestDetectedPageLabel: 'Open latest detected page',
    routeSurfaceLabels: {
      latestSourcePage: 'latest source page',
      latestCapturedPage: 'latest captured page',
      latestDetectedPage: 'latest detected page',
      evidenceSourcePage: 'evidence source page',
      captureSourcePage: 'capture source page',
      defaultStoreRoute: 'default store route',
    },
    noDetectionRecorded: 'No recent store-page detection captured yet.',
    noRecentActivity: 'No recent operator activity recorded for this app yet.',
    noCapturedOutput: 'No captured output has been recorded for this app yet.',
    noRequiredQueue: 'No required live receipt queue for this app.',
    evidenceQueueSummary: (reviewed, reviewPending, captureWork) =>
      `${reviewed} reviewed · ${reviewPending} waiting for review · ${captureWork} still needing capture work`,
    nextStepInspectStoreApp:
      'Open the matching store app to inspect page-level readiness and recent output details.',
    priorityQueueAction: {
      finishCapture: (suffix) => `Finish capture on ${suffix}`,
      review: (suffix) => `Review on ${suffix}`,
      recapture: (suffix) => `Recapture from ${suffix}`,
      capture: (suffix) => `Start capture on ${suffix}`,
      open: (suffix) => `Open ${suffix}`,
    },
    fallbackEvidenceRouteSummary: (defaultRouteLabel, title) =>
      `Open the verified scope clause and rollout row first, then ${defaultRouteLabel.toLowerCase()} so Suite can capture fresh runtime context for ${title}.`,
  },
};

const zhCnOverrides: DeepPartial<LocaleCatalog> = {
  common: {
    displayLanguageLabel: '界面语言',
    jumpToSourcePage: '跳回来源页面',
    openLatestCapturedPage: '打开最新捕获页面',
    openSourcePage: '打开来源页面',
    openEvidenceSourcePage: '打开证据来源页面',
    openCaptureSourcePage: '打开采集来源页面',
    openCurrentCapturePage: '打开当前捕获页面',
    openLatestSourcePage: '跳回最新来源页面',
    openLatestDetectedPage: '打开最新检测页面',
    openDefaultRoute: '打开默认路线',
    capturedAtPrefix: '捕获于',
    loadingRoute: '正在加载下一条有用路线...',
    loadingQueue: '正在加载证据队列...',
    loadingDetection: '正在加载最新共享运行时上下文...',
    loadingActivity: '正在加载最近操作员活动...',
    loadingOutput: '正在加载最新捕获输出...',
    loadingNextStep: '正在加载下一步...',
    languageOptionLabels: {
      en: 'English',
      'zh-CN': '简体中文',
    },
    routeOriginLabels: {
      merchantSource: '商家来源页面',
      capturedPage: '最新捕获页面',
      evidenceSource: '证据来源页面',
      evidenceGate: '证据门禁',
      sidePanelSection: '侧边面板分区',
      detectedPage: '最新检测页面',
      defaultRoute: '默认商家入口',
    },
  },
  popup: {
    defaultActionHeading: '当前页面现在能做什么',
    supportingRoutesHeading: '补充路线',
    noRunnableCapability: '当前页面还没有可立即执行的能力。',
    openSidePanel: '打开侧边面板',
    viewCurrentSupportState: '查看当前支持状态',
    openMainSurfaceSummary: '打开当前页面对应的主 Shopflow 工作面板。',
    openSecondaryRouteSummary:
      '跳到下一条支持状态或 claim 边界路线，而不是把 popup 变成第二个控制台。',
    latestSourceLabel: '跳回最新来源页面',
    claimBoundaryPrefix: '宣称边界：',
    evidenceQueuePrefix: '证据队列：',
    evidenceNextStepPrefix: '证据下一步：',
    ledgerNote:
      '账本说明：repo 内账本只跟踪证据包状态，不能替代已审核的 live bundle。',
    nextStepPrefix: '下一步：',
    recentActivityPrefix: '最近活动：',
    seenPrefix: '看到于',
    quickRouterHeading: '快速路由',
    quickRouterSummary: '先用弹出窗找入口，再去侧边面板做真正操作。',
    primaryRouteHeading: '主路线',
    secondaryRouteHeading: '次路线',
    jumpBackHeading: '返回现场',
    jumpBackSummary: '回到共享 runtime 里记录的最新商家页面。',
    sourceCapturedSplitSummary:
      '最新来源页面会带你回到真实商家流程；最新捕获页面会重新打开最近一次捕获到的结果。',
    openSidePanelQuickActions: '打开侧边面板快捷操作',
    openSidePanelReadinessSummary: '打开侧边面板准备度摘要',
    openSidePanelCaptureQueue: '打开侧边面板采集队列',
    openSidePanelReviewLane: '打开侧边面板审核通道',
    openSidePanelRecentActivity: '打开侧边面板最近活动',
    openSidePanelCurrentSiteSummary: '打开侧边面板当前站点摘要',
    resumeLatestCapturedPage: '回到最新捕获页面',
    openLatestSourcePage: '打开最新来源页面',
  },
  sidePanel: {
    introSummary:
      '先看这页现在能做什么，再沿着宣称与证据门往下走，不要把仓内验证直接写成公开支持。',
    readinessSummaryHeading: '当前准备度',
    liveReceiptReadinessHeading: 'Live receipt 准备情况',
    whatThisPageCanDoHeading: '当前页面能做什么',
    bestRouteHeading: '当前最佳路线',
    runnableNowHeading: '当前可运行',
    needsAttentionHeading: '需要关注',
    claimBoundaryHeading: '宣称边界',
    operatorNextStepHeading: '操作员下一步',
    currentSiteHeading: '当前站点',
    availableOnThisPageHeading: '当前页面可用能力',
    noRunnableCapability: '当前页面还没有可立即执行的能力。',
    quickActionsHeading: '快捷操作',
    quickActionsSummary:
      '这些卡片都是真实能力路线。先选你要走的动作，再直接跳到真正能执行它的页面或分区。',
    primarySupportedMove: '主可用动作',
    supportedMove: '可用动作',
    blockedPathHonesty:
      '这里会直接说明哪条路径被挡住，而不是假装被阻塞的动作还能运行。',
    primaryRouteHeading: '主路线',
    nextRouteHeading: '下一条路线',
    evidenceOverviewHeading: '证据概览',
    reviewLaneHeading: '审核通道',
    evidenceSystemSummary:
      '把这个操作员证据系统分成三层看：证据概览负责采集工作，审核通道负责审核结果，原始证据包账本负责审计细节。',
    rawPacketLedgerHeading: '原始证据包账本',
    decisionBriefHeading: '决策简报',
    nextAssistantMove: '下一步辅助动作',
    packetPrefix: '证据包：',
    updatedPrefix: '更新于：',
    operatorNotePrefix: '操作员备注：',
    nextStepPrefix: '下一步：',
    nextStepPrefixInline: '下一步：',
    latestProofPrefix: '最新证据：',
    reviewPrefix: '审核状态：',
    reviewNotePrefix: '审核备注：',
    recentActivityHeading: '最近活动',
    noVerifiedActivity: '当前浏览器会话里还没有记录到已验证活动。',
    nextRoutesHeading: '下一步路线',
    sourceCapturedSplitSummary:
      '最新来源页面负责带你回到真实商家流程；最新捕获页面负责重新打开最近一次捕获结果。',
    verifiedScopePrefix: '已验证范围：',
    bestRouteAria: (label) => `当前最佳路线：${label}`,
    nextRouteAria: (label) => `下一条路线：${label}`,
    operatorNextStepAria: (label) => `操作员下一步：${label}`,
    openRoute: '打开路线',
    statusLabels: {
      live: '当前可运行',
      limited: '受限',
      idle: '等待中',
      unsupported: '未支持',
      error: '需关注',
    },
    capabilityStatusLabels: {
      ready: '可运行',
      unsupported_page: '未支持页面',
      unsupported_site: '未支持站点',
      permission_needed: '需要权限',
      not_implemented: '未实现',
      degraded: '降级',
      blocked: '已阻塞',
    },
    countsSummary: (snapshot) =>
      `统计：已尝试 ${snapshot.attempted} · 已成功 ${snapshot.succeeded} · 已失败 ${snapshot.failed} · 已跳过 ${snapshot.skipped}`,
  },
  model: {
    repoReadyClaimGatedLabel: '仓内已验证，但公开宣称仍被证据门禁限制',
    repoReadyClaimBoundaryWithScope: (scopeCopy) =>
      `${scopeCopy} 公开说法在实时证据审核完成前继续保持门禁。`,
    repoReadyClaimBoundaryWithoutScope:
      '在实时证据审核完成前，公开说法都必须保持在已验证 claim 边界内。',
    repoReadyClaimSummaryFallback: (runnableNowSummary) =>
      `${runnableNowSummary} 公开说法在证据审核完成前仍需保持门禁。`,
    readyOnThisPageLabel: '当前页面可运行',
    needsOperatorAttentionLabel: '需要操作员关注',
    waitingForSupportedPageLabel: '等待支持页面',
    latestCapturedProductLabel: '最新捕获商品',
    latestCapturedSearchLabel: '最新捕获搜索结果',
    latestCapturedDealsLabel: '最新捕获优惠信息',
    latestRunnableOutputLabel: '最新可运行输出',
    reviewSupportStateLabel: '查看支持状态',
    openCurrentSiteSummary: '打开当前站点摘要',
    supportStateUnsupportedSummary: '当前页面还不在支持边界内。',
    supportStateReadySummary: (count) =>
      `当前有 ${count} 个${count === 1 ? '' : ''}能力可以直接运行。`,
    supportStateAttentionSummary: (count) =>
      `当前有 ${count} 个能力还需要操作员先处理，之后才能运行。`,
    supportStateWaitingSummary: '先打开支持页面，再回来查看当前支持状态。',
    reviewSupportPolicyLabel: '查看支持策略',
    reviewSupportPolicySummary:
      '这个页面讲的是仓内事实，不是已经可以公开宣称的市场文案。',
    openCaptureQueue: '打开采集队列',
    openReviewLane: '打开审核通道',
    openReadinessSummary: '打开准备度摘要',
    checkRecentActivityLabel: '查看最近活动',
    openRecentActivity: '打开最近活动',
    recentActivityReadySummary:
      '先核对最近活动里记录的最新输出，再决定是否跳回来源页面。',
    recentActivityIdleSummary:
      '最近活动保持轻量，目的是让这里继续像路由台，而不是第二个日志控制台。',
    latestOutputSingle: (label) => `最新可运行输出：${label}。`,
    latestOutputMulti: (labels) => `最新可运行输出：${labels.join('、')}。`,
    latestOutputSummaryProductWithPrice: (price) =>
      `已捕获商品详情，价格为 ${price}。`,
    latestOutputSummaryProductGeneric: '已从当前页面捕获商品详情。',
    latestOutputSummarySearchTopResult: (title) => `当前首条结果：${title}。`,
    latestOutputSummarySearchGeneric: (count) =>
      `已从当前页面捕获 ${count} 条搜索结果。`,
    latestOutputSummaryDealLead: (title) => `当前主优惠：${title}。`,
    latestOutputSummaryDealGeneric: (count) =>
      `已从当前页面捕获 ${count} 条优惠信息。`,
    latestOutputDetailLabels: {
      price: '价格',
      availability: '库存',
      sku: 'SKU',
      'results-count': '结果数',
      'top-match': '首条结果',
      'lead-deal': '主优惠',
    },
    runnableNowEmpty: '当前页面还没有可立即执行的能力。',
    runnableNowSingle: (label) => `${label} 当前可以直接运行。`,
    runnableNowMulti: (primaryLabel, remainingCount) =>
      `${primaryLabel}，以及另外 ${remainingCount} 个动作当前都可以直接运行。`,
    pageKindLabels: {
      product: '商品页',
      search: '搜索页',
      deal: '优惠页',
      cart: '购物车页',
      manage: '管理页',
      account: '账户页',
      unsupported: '未支持页面',
      unknown: '未知页面',
    },
    routeBackToMerchantSummary:
      '先回到最新记录的商家页面，再从真实页面上下文里继续这个能力。',
    latestSourceRouteSummary: (label, summary) => `先回到 ${label}。${summary}`,
    latestCapturedRouteSummary:
      '当没有更新的来源页面时，优先从最新捕获页面继续，这样路线来自真实现场而不是装饰性文案。',
    evidenceSourceRouteSummary:
      '从证据绑定的来源页面继续，保证下一步操作从正确现场开始。',
    currentSiteSummaryRoute:
      '先打开当前站点摘要，确认 host 和 page kind，再继续往下走。',
    reviewClaimGateLabel: '查看 claim 门禁',
    reviewClaimGateSummary:
      '先检查证据状态和 verified-scope 提示，再决定公开说法。',
    reviewReadinessSummaryLabel: '查看准备度摘要',
    reviewReadinessSummarySummary:
      '先把“现在能跑什么”和“接下来还要补什么”分开看，再往下操作。',
    checkRecentActivitySummaryReady:
      '确认最新记录的输出；如果需要返回现场，就直接用那条跳转路线。',
    checkRecentActivitySummaryIdle:
      '最近活动会保持轻量，避免把这个页面变成第二个控制台。',
    captureQueueSummary: (count) => `${count} 个证据包仍需补采或重采。`,
    captureInProgressQueueSummary: (count) => `${count} 个证据包仍在处理中。`,
    reviewPendingQueueSummary: (count) => `${count} 个证据包等待明确审核。`,
    reviewedQueueSummary: (count) => `${count} 个证据包已审核。`,
    reviewedEvidenceForAppSummary: () =>
      '这个应用要求的实时证据都已经审核完成。',
    missingEvidenceForAppSummary: (count) =>
      `这个应用还有 ${count} 个实时证据缺失。`,
    captureInProgressForAppSummary: (count) =>
      `这个应用还有 ${count} 个操作员证据包正在处理中，暂时还不能拿来审核。`,
    reviewPendingForAppSummary: (count) =>
      `这个应用已有 ${count} 个实时证据已记录，正在等待审核。`,
    rejectedForAppSummary: (count) =>
      `这个应用有 ${count} 个证据包在审核中被退回，需要重新采集。`,
    expiredForAppSummary: (count) =>
      `这个应用有 ${count} 个证据包已经过期，复用前必须重新采集。`,
    workflowCopilotHeading: '工作流副驾',
    workflowReadySummary:
      '仓内验证已经足够支撑你检查这条路线。先沿着可运行事实走，再用最新页面上下文继续。',
    workflowClaimGatedSummary:
      '仓内验证已经足够支撑你检查这条路线，但公开说法仍然必须等证据审核通过。',
    workflowNeedsAttentionSummary:
      '这条路线已经被识别出来了，但下一步仍需要操作员先处理，不能假装已经可跑。',
    workflowUnsupportedSummary:
      '当前页面还不在支持边界内。先进入支持页面，再谈支持状态。',
    capabilityLabels: {
      extract_product: '提取商品',
      extract_search: '提取搜索结果',
      extract_deals: '查看优惠',
      run_action: '执行动作',
      export_data: '导出数据',
    },
    capabilityActionLabels: {
      extract_product: '提取当前商品',
      extract_search: '捕获搜索结果',
      extract_deals: '查看当前优惠',
      run_action: '打开支持的工作流',
      export_data: '导出结构化数据',
    },
    capabilityDescriptions: {
      extract_product: '提取当前页面的标准化商品详情。',
      extract_search: '从当前页面采集结构化搜索结果。',
      extract_deals: '查看当前优惠面，而不是猜测支持状态。',
      run_action: '在页面允许时，运行支持的多步骤工作流。',
      export_data: '以稳定的机器可读格式导出当前捕获数据。',
    },
    capabilityExecutionSummaries: {
      extract_product: '把当前商品页当作商品提取的执行现场。',
      extract_search: '把当前搜索页当作搜索结果提取的执行现场。',
      extract_deals: '把当前优惠页当作优惠检查的执行现场。',
      run_action: '把当前支持的工作流页面当作下一步操作的执行现场。',
      export_data:
        '在导出结构化数据前，先回到最新捕获或最新检测到的页面上下文。',
    },
    workflowBulletRunnableNow: '当前可运行',
    workflowBulletClaimGate: '宣称门禁',
    workflowBulletCurrentSurface: '当前页面',
    workflowBulletNextMove: '下一步动作',
  },
  suite: {
    internalAlphaOnly: '仅限内部 Alpha',
    appSummary:
      '用于能力导览、推进状态可见性和证据准备度的内部 Alpha 组合壳层。',
    operatorPromise:
      '用这个内部 Alpha 面板进入正确的店铺 app、查看公开说法门禁，并确认哪条证据门仍然挡着当前公开表述。',
    startHereCards: [
      {
        title: '先进入正确的店铺壳层',
        summary:
          '先看推进状态与已验证范围，再进入正确的店铺 app，不要只靠品牌名猜入口。',
        ctaLabel: '打开推进地图',
      },
      {
        title: '先看公开说法门禁，再谈发布',
        summary:
          '先检查证据门，保持 repo-verified 与 public-ready wording 分层。',
        ctaLabel: '打开公开说法准备度面板',
      },
      {
        title: '把 Suite 当作大厅，不是工作流引擎',
        summary:
          '已验证范围、证据门、外部运行时接缝和 Alpha 规则都还在，但它们不应该抢过第一条路线。',
        ctaLabel: '打开辅助服务台',
      },
    ],
    startHereHeading: '从这里开始',
    alphaGuardrailsHeading: 'Alpha 护栏',
    priorityRoutesHeading: '优先路线',
    priorityRoutesSummary:
      '把这里当成驾驶舱的首发路线区，而不是状态陈列区。它会把你先送到当前最值得执行的真实入口。',
    claimReadinessHeading: '公开说法准备度面板',
    claimReadinessSummary:
      '把这里当成门禁路由板，不是发布倒计时。它告诉你哪条公开表述路径还被证据挡着。',
    currentRolloutHeading: '当前推进地图',
    currentRolloutSummary:
      '每一行都告诉你下一步该检查哪个 store shell、它为什么还停在当前状态、以及最新共享运行时上下文指向哪里。',
    supportDesksHeading: '辅助服务台',
    supportDesksSummary:
      '把已验证范围、证据队列、外部运行时接缝和 Alpha 规则压到第二层。只有在需要治理细节时，再打开这些服务台。',
    inspectStatusLabel: (publicName) => `查看 ${publicName} 状态`,
    inspectStatusActionLabel: '查看状态',
    hideStatusActionLabel: '收起状态',
    priorityRouteAria: (publicName, label) =>
      `${publicName} 的优先路线：${label}`,
    frontDoorAria: (publicName, label) => `${publicName} 的入口路线：${label}`,
    operatorNextStepAria: (publicName, label) =>
      `${publicName} 的下一步操作：${label}`,
    priorityPacketActionAria: (publicName, label) =>
      `${publicName} 的优先证据动作：${label}`,
    decisionBriefRouteAria: (publicName, label) =>
      `${publicName} 的决策简报路线：${label}`,
    openSidePanelFamilyChooserLabel: '打开侧边面板店铺入口选择器',
    openSidePanelRolloutMapLabel: '打开侧边面板推进地图',
    openSidePanelClaimReadinessLabel: '打开侧边面板公开说法准备度面板',
    latestDetectionHeading: '最新检测结果',
    latestRecentActivityHeading: '最新最近活动',
    latestCapturedOutputHeading: '最新捕获输出',
    frontDoorHeading: '这个 app 的入口路线',
    evidenceQueueHeading: '证据队列',
    priorityPacketHeading: '优先证据包',
    operatorNextStepHeading: '操作员下一步',
    decisionBriefHeading: '决策简报',
    noOutstandingPacket: '当前没有等待处理的实时证据包。',
    providerRuntimeSeamHeading: '外部运行时接缝',
    providerRuntimeSeamSummary:
      '这是 Suite 内部 Alpha 里第一个真正消费 Switchyard 风格外部运行时路线的入口。它仍然只是只读交接，不是商家实时证明。',
    providerRuntimeSeamBaseUrlHeading: '当前运行时基础地址',
    providerRuntimeSeamBoundaryHeading: '边界说明',
    providerRuntimeSeamBoundaryNote:
      '这些路线只把 BYOK / Web 登录 / auth-session 工作移交给外部运行时层。Shopflow 继续持有 storefront truth、claim wording 和 merchant reviewed evidence。',
    providerRuntimeSeamRouteSummary: (baseUrl) =>
      `只有当外部运行时已经在 ${baseUrl} 可达时，才使用这些路线预览。`,
    providerRuntimeSeamAcquisitionModes: (modes) => `当前接入模式：${modes}。`,
    providerRuntimeSeamProviderSummary: (providerName) =>
      `${providerName} 可以复用同一条只读接缝，而不会把 Shopflow 变成外部运行时产品。`,
    providerRuntimeSeamStartLabel: (providerName) =>
      `开始 ${providerName} 接入`,
    providerRuntimeSeamCaptureLabel: (providerName) =>
      `采集 ${providerName} 接入`,
    providerRuntimeSeamNotConfigured:
      '这个 Suite 会话还没有配置 Switchyard base URL。',
    providerRuntimeSeamConfigureHint:
      '当你想预览真实运行时交接路线、但又不把它夸成 public runtime product 时，就给这个 internal-alpha side panel 加上 switchyardBaseUrl 查询参数。',
    openRolloutRow: (publicName) => `打开 ${publicName} 的推进行`,
    openVerifiedScopeClause: (publicName) =>
      `打开 ${publicName} 的已验证范围条款`,
    statusBoard: {
      repoVerifiedClear: {
        label: '已通过 repo 验证，且不再等待额外证据',
        summary:
          '用推进地图检查那些已经通过 repo 验证、且当前没有额外证据阻塞的 shell。',
        ctaLabel: '打开推进地图',
      },
      repoVerifiedClaimGated: {
        label: '已通过 repo 验证，但仍被证据门挡住公开说法',
        summary:
          '先去证据门完成采集或审核，再让 repo-verified 进度往 public-ready wording 漂移。',
        ctaLabel: '打开证据门',
      },
      internalAlpha: {
        label: '仅限内部 Alpha 的表面',
        summary:
          '需要确认 Suite 仍然只是导览大厅，而不是第二套工作流引擎时，就回到 Alpha 护栏。',
        ctaLabel: '打开 Alpha 护栏',
      },
    },
    defaultRouteLabelsByStoreId: {
      albertsons: '打开 Safeway 首页',
      kroger: '打开 Fred Meyer 首页',
      amazon: '打开 Amazon 首页',
      costco: '打开 Costco 首页',
      walmart: '打开 Walmart 首页',
      weee: '打开 Weee 首页',
      target: '打开 Target 首页',
      temu: '打开 Temu 首页',
    },
    noFreshContextSummary: (routeLabel, publicName) =>
      `当前还没有新的页面上下文。先${routeLabel}，让 Suite 为 ${publicName} 捕获运行时上下文。`,
    waitingReviewRouteLabel: '在来源页面审核待处理证据',
    waitingReviewRouteSummary: (count) =>
      `${count} 个证据包正在等待审核。先从这个应用最新记录的操作页面开始。`,
    reviewFromLatestCaptureLabel: '从最新捕获页审核待处理证据',
    reviewFromLatestCaptureSummary: (count) =>
      `${count} 个证据包正在等待审核。先打开最新捕获页面，再进入审核通道。`,
    resumeCapturePathLabel: '继续采集路径',
    resumeCapturePathSummary: (count) =>
      `${count} 个证据包仍需继续采集。先从这个应用最新记录的来源页面开始。`,
    resumeCaptureFromLatestCapturedPageLabel: '从最新捕获页继续采集',
    resumeCaptureFromLatestCapturedPageSummary: (count) =>
      `${count} 个证据包仍需继续采集。先打开最新捕获页面，再从那里继续。`,
    inspectLatestSourcePageLabel: '查看最新来源页面',
    inspectLatestSourcePageSummary: '回到这个应用最新记录的操作页面。',
    inspectLatestCapturedPageLabel: '查看最新捕获页面',
    inspectLatestCapturedPageSummary: '打开这个应用最新捕获输出背后的页面。',
    inspectLatestDetectedPageLabel: '查看最新检测页面',
    inspectLatestDetectedPageSummary: '打开这个应用最近一次检测到的页面。',
    openEvidenceSourcePageLabel: '打开证据来源页面',
    openCaptureSourcePageLabel: '打开采集来源页面',
    openLatestSourcePageLabel: '打开最新来源页面',
    resumeFromLatestSourcePageLabel: '从最新来源页面继续',
    openLatestCapturedPageLabel: '打开最新捕获页面',
    resumeFromLatestCapturedPageLabel: '从最新捕获页面继续',
    openLatestDetectedPageLabel: '打开最新检测页面',
    routeSurfaceLabels: {
      latestSourcePage: '最新来源页面',
      latestCapturedPage: '最新捕获页面',
      latestDetectedPage: '最新检测页面',
      evidenceSourcePage: '证据来源页面',
      captureSourcePage: '采集来源页面',
      defaultStoreRoute: '默认商家入口',
    },
    noDetectionRecorded: '还没有记录到最近的店铺页面检测。',
    noRecentActivity: '这个 app 还没有记录到最近的操作员活动。',
    noCapturedOutput: '这个 app 还没有记录到捕获输出。',
    noRequiredQueue: '这个 app 当前没有必需的实时证据队列。',
    nextStepInspectStoreApp:
      '打开对应的店铺 app，检查页面级准备度和最新输出细节。',
    priorityQueueAction: {
      finishCapture: (suffix) => `在${suffix}完成采集`,
      review: (suffix) => `在${suffix}上审核`,
      recapture: (suffix) => `从${suffix}重新采集`,
      capture: (suffix) => `在${suffix}开始采集`,
      open: (suffix) => `打开${suffix}`,
    },
    evidenceGatesHeading: '仍然挡住公开说法的证据门',
    evidenceGatesSummary:
      '有些路线还需要继续采集，另一些已经在等待明确审核。仅有 repo verification 还不能越过这两道门。',
    verifiedScopeHeading: '已验证范围导航',
    verifiedScopeSummary:
      '检查公开说法是否还落在今天的已验证边界内时，就用这些条款当导航。',
    priorityLabels: {
      'waiting-for-review': '最快解除公开说法审核阻塞的路径',
      'needs-capture': '仍需新的采集',
      'ready-to-inspect': '可直接进入实时检查',
      'seed-runtime': '仍需首次运行时上下文',
    },
  },
};

function mergeCatalog<T extends Record<string, unknown>>(
  base: T,
  overrides?: DeepPartial<T>
): T {
  if (!overrides) {
    return base;
  }

  const output: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof output[key] === 'object' &&
      output[key] != null &&
      !Array.isArray(output[key])
    ) {
      output[key] = mergeCatalog(
        output[key] as Record<string, unknown>,
        value as DeepPartial<Record<string, unknown>>
      );
    } else if (value !== undefined) {
      output[key] = value;
    }
  }

  return output as T;
}

export function normalizeShopflowLocale(locale?: string): ShopflowLocale {
  return locale?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

export function resolveShopflowLocale(
  locale?: ShopflowLocale | string
): ShopflowLocale {
  if (locale) {
    return normalizeShopflowLocale(locale);
  }

  if (typeof navigator !== 'undefined') {
    return normalizeShopflowLocale(navigator.language);
  }

  return 'en';
}

export function resolveShopflowLocaleFromUrl(
  search: string,
  fallback?: ShopflowLocale | string
): ShopflowLocale {
  const requestedLocale = new URLSearchParams(search).get('locale');
  return resolveShopflowLocale(requestedLocale ?? fallback);
}

export function createLocaleRouteHref(
  href: string,
  locale: ShopflowLocale
): string {
  const isAbsolute = /^https?:\/\//.test(href);
  const normalizedHref = isAbsolute
    ? href
    : href.startsWith('/')
      ? `https://shopflow.local${href}`
      : `https://shopflow.local/${href}`;
  const url = new URL(normalizedHref);
  if (locale === 'en') {
    url.searchParams.delete('locale');
  } else {
    url.searchParams.set('locale', locale);
  }

  if (isAbsolute) {
    return url.toString();
  }

  const relativeHref = `${url.pathname.replace(/^\//, '')}${url.search}${url.hash}`;
  return href.startsWith('/') ? `/${relativeHref}` : relativeHref;
}

export function getShopflowLocaleCatalog(
  locale: ShopflowLocale = 'en'
): LocaleCatalog {
  return locale === 'zh-CN' ? mergeCatalog(en, zhCnOverrides) : en;
}
