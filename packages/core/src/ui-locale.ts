import {
  createLocaleRouteHref,
  getShopflowLocaleCatalog,
  normalizeShopflowLocale,
  type ShopflowLocale,
} from './locale';

export type UiLocale = ShopflowLocale;
export const uiLocaleValues = ['en', 'zh-CN'] as const;
export type LocaleSwitchOption = {
  label: string;
  href: string;
  active: boolean;
};

export function resolveUiLocale(locale?: UiLocale | string): UiLocale {
  return normalizeShopflowLocale(locale);
}

export function getDynamicCopy(locale: UiLocale = 'en') {
  const catalog = getShopflowLocaleCatalog(locale);
  const { model } = catalog;

  return {
    unsupportedSiteLabel: model.unsupportedSiteLabel,
    popupSummaryNoReady: model.popupSummaryNoReady,
    popupSummaryReady: model.popupSummaryReady,
    unsupportedSiteSummary: model.unsupportedReason,
    routeIntoSupportedPageFirst: model.unsupportedOperatorNextStep,
    repoReadyClaimGated: model.repoReadyClaimGatedLabel,
    publicWordingBehindEvidenceReview: model
      .repoReadyClaimSummaryFallback('')
      .trim(),
    claimBoundaryUntilReview: (verifiedScopeCopy?: string) =>
      verifiedScopeCopy
        ? model.repoReadyClaimBoundaryWithScope(verifiedScopeCopy)
        : model.repoReadyClaimBoundaryWithoutScope,
    readyOnThisPage: model.readyOnThisPageLabel,
    needsOperatorAttention: model.needsOperatorAttentionLabel,
    needsOperatorAttentionSummary: model.needsOperatorAttentionSummary,
    waitingForSupportedPage: model.waitingForSupportedPageLabel,
    waitingForSupportedPageSummary: model.waitingForSupportedPageSummary,
    latestCapturedProduct: model.latestCapturedProductLabel,
    latestCapturedSearch: model.latestCapturedSearchLabel,
    latestCapturedDeals: model.latestCapturedDealsLabel,
    latestRunnableOutput: model.latestRunnableOutputLabel,
    openLatestCapturedPage: catalog.common.openLatestCapturedPage,
    jumpToSourcePage: catalog.common.jumpToSourcePage,
    reviewSupportState: model.reviewSupportStateLabel,
    reviewSupportStateLabel: model.reviewSupportStateLabel,
    openCurrentSiteSummary: model.openCurrentSiteSummary,
    supportStateUnsupportedSummary: model.supportStateUnsupportedSummary,
    supportStateReadySummary: model.supportStateReadySummary,
    supportStateAttentionSummary: model.supportStateAttentionSummary,
    supportStateWaitingSummary: model.supportStateWaitingSummary,
    openCaptureQueue: model.openCaptureQueue,
    openReviewLane: model.openReviewLane,
    openReadinessSummary: model.openReadinessSummary,
    openRecentActivity: model.openRecentActivity,
    checkRecentActivity: model.checkRecentActivityLabel,
    checkRecentActivityLabel: model.checkRecentActivityLabel,
    reviewSupportPolicy: model.reviewSupportPolicyLabel,
    reviewSupportPolicySummary: model.reviewSupportPolicySummary,
    captureQueueSummary: model.captureQueueSummary,
    captureInProgressQueueSummary: model.captureInProgressQueueSummary,
    reviewPendingQueueSummary: model.reviewPendingQueueSummary,
    reviewedQueueSummary: model.reviewedQueueSummary,
    captureLaneClearSummary: model.captureLaneClearSummary,
    noReviewLaneItems: model.noReviewLaneItems,
    reviewPendingSummary: model.reviewPendingSummary,
    reviewedCountSummary: model.reviewedCountSummary,
    reviewedEvidenceForAppSummary: model.reviewedEvidenceForAppSummary,
    missingEvidenceForAppSummary: model.missingEvidenceForAppSummary,
    captureInProgressForAppSummary: model.captureInProgressForAppSummary,
    reviewPendingForAppSummary: model.reviewPendingForAppSummary,
    rejectedCountSummary: model.rejectedCountSummary,
    expiredCountSummary: model.expiredCountSummary,
    rejectedForAppSummary: model.rejectedForAppSummary,
    expiredForAppSummary: model.expiredForAppSummary,
    blockerSummaryMissingLabel: model.blockerSummaryMissingLabel,
    blockerSummaryInProgressLabel: model.blockerSummaryInProgressLabel,
    blockerSummaryReviewPendingLabel: model.blockerSummaryReviewPendingLabel,
    blockerSummaryReviewedLabel: model.blockerSummaryReviewedLabel,
    blockerSummaryMissingSummary: model.blockerSummaryMissingSummary,
    blockerSummaryInProgressSummary: model.blockerSummaryInProgressSummary,
    blockerSummaryReviewPendingSummary:
      model.blockerSummaryReviewPendingSummary,
    blockerSummaryReviewedSummary: model.blockerSummaryReviewedSummary,
    noRunnableCapability: model.runnableNowEmpty,
    latestOutputSingle: model.latestOutputSingle,
    latestOutputMulti: model.latestOutputMulti,
    latestOutputSummaryProductWithPrice:
      model.latestOutputSummaryProductWithPrice,
    latestOutputSummaryProductGeneric: model.latestOutputSummaryProductGeneric,
    latestOutputSummarySearchTopResult:
      model.latestOutputSummarySearchTopResult,
    latestOutputSummarySearchGeneric: model.latestOutputSummarySearchGeneric,
    latestOutputSummaryDealLead: model.latestOutputSummaryDealLead,
    latestOutputSummaryDealGeneric: model.latestOutputSummaryDealGeneric,
    latestOutputDetailLabels: model.latestOutputDetailLabels,
    runnableNowSingle: model.runnableNowSingle,
    runnableNowMulti: model.runnableNowMulti,
    openSupportedPageToLoadState: model.waitingForSupportedPageSummary,
    reviewedEvidence: model.reviewedEvidenceSummary,
    missingLiveReceipt: model.evidenceMissingLabel,
    captureInProgress: model.evidenceInProgressLabel,
    capturedWaitingReview: model.evidenceReviewPendingLabel,
    rejectedEvidence: model.evidenceRejectedLabel,
    expiredEvidence: model.evidenceExpiredLabel,
    evidenceNavigationCaptureSummary: model.evidenceNavigationCaptureSummary,
    evidenceNavigationReviewSummary: model.evidenceNavigationReviewSummary,
    routeBackToMerchantSummary: model.routeBackToMerchantSummary,
    latestSourceRouteSummary: model.latestSourceRouteSummary,
    latestCapturedRouteSummary: model.latestCapturedRouteSummary,
    evidenceSourceRouteSummary: model.evidenceSourceRouteSummary,
    currentSiteSummaryRoute: model.currentSiteSummaryRoute,
    reviewClaimGateLabel: model.reviewClaimGateLabel,
    reviewClaimGateSummary: model.reviewClaimGateSummary,
    reviewReadinessSummaryLabel: model.reviewReadinessSummaryLabel,
    reviewReadinessSummarySummary: model.reviewReadinessSummarySummary,
    checkRecentActivitySummaryReady: model.checkRecentActivitySummaryReady,
    checkRecentActivitySummaryIdle: model.checkRecentActivitySummaryIdle,
    workflowCopilotHeading: model.workflowCopilotHeading,
    workflowReadySummary: model.workflowReadySummary,
    workflowClaimGatedSummary: model.workflowClaimGatedSummary,
    workflowNeedsAttentionSummary: model.workflowNeedsAttentionSummary,
    workflowUnsupportedSummary: model.workflowUnsupportedSummary,
    workflowBulletRunnableNow: model.workflowBulletRunnableNow,
    workflowBulletClaimGate: model.workflowBulletClaimGate,
    workflowBulletCurrentSurface: model.workflowBulletCurrentSurface,
    workflowBulletNextMove: model.workflowBulletNextMove,
    pageKindLabel: model.pageKindLabels,
    capabilityLabel: model.capabilityLabels,
    capabilityActionLabel: model.capabilityActionLabels,
    capabilityDescription: model.capabilityDescriptions,
    capabilityExecutionSummary: model.capabilityExecutionSummaries,
  };
}

export function createLocaleSwitchOptions(
  href: string,
  locale: UiLocale = 'en'
): LocaleSwitchOption[] {
  const catalog = getShopflowLocaleCatalog(locale);

  return uiLocaleValues.map((nextLocale) => ({
    label: catalog.common.languageOptionLabels[nextLocale],
    href: createLocaleRouteHref(href, nextLocale),
    active: nextLocale === resolveUiLocale(locale),
  }));
}

export function toLocaleTimeString(timestamp: string, locale: UiLocale = 'en') {
  return new Date(timestamp).toLocaleTimeString(
    resolveUiLocale(locale) === 'zh-CN' ? 'zh-CN' : 'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
    }
  );
}

type ActivityLike = {
  label: string;
  summary?: string;
  summaryKind?: 'ready' | 'attention' | 'waiting';
  matchedHost?: string;
  pageKind?: string;
  readyCount?: number;
  constrainedCount?: number;
  occurredAt?: string;
  timestampLabel?: string;
};

type LatestOutputLike = {
  kind: 'product' | 'search' | 'deal';
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
};

export function formatRecentActivityLabel(
  item: Pick<ActivityLike, 'label' | 'matchedHost' | 'pageKind'>,
  locale: UiLocale = 'en'
) {
  const resolvedLocale = resolveUiLocale(locale);

  if (resolvedLocale !== 'zh-CN' || !item.matchedHost || !item.pageKind) {
    return item.label;
  }

  const pageKindLabel =
    getDynamicCopy(locale).pageKindLabel[
      item.pageKind as keyof ReturnType<typeof getDynamicCopy>['pageKindLabel']
    ] ?? item.pageKind;

  return `${item.matchedHost} · ${pageKindLabel}`;
}

export function formatRecentActivitySummary(
  item: Pick<
    ActivityLike,
    'summary' | 'summaryKind' | 'readyCount' | 'constrainedCount'
  >,
  locale: UiLocale = 'en'
) {
  if (resolveUiLocale(locale) !== 'zh-CN') {
    return item.summary;
  }

  const dynamicCopy = getDynamicCopy(locale);

  if (item.summaryKind === 'ready' && typeof item.readyCount === 'number') {
    return dynamicCopy.supportStateReadySummary(item.readyCount);
  }

  if (
    item.summaryKind === 'attention' &&
    typeof item.constrainedCount === 'number'
  ) {
    return dynamicCopy.supportStateAttentionSummary(item.constrainedCount);
  }

  if (item.summaryKind === 'waiting') {
    return dynamicCopy.supportStateWaitingSummary;
  }

  if (typeof item.readyCount === 'number' && item.readyCount > 0) {
    return dynamicCopy.supportStateReadySummary(item.readyCount);
  }

  if (typeof item.constrainedCount === 'number' && item.constrainedCount > 0) {
    return dynamicCopy.supportStateAttentionSummary(item.constrainedCount);
  }

  return item.summary;
}

export function formatRecentActivityTimestamp(
  item: Pick<ActivityLike, 'occurredAt' | 'timestampLabel'>,
  locale: UiLocale = 'en'
) {
  return item.occurredAt
    ? toLocaleTimeString(item.occurredAt, locale)
    : item.timestampLabel;
}

export function formatLatestOutputSummary(
  latestOutput: LatestOutputLike,
  locale: UiLocale = 'en'
) {
  if (resolveUiLocale(locale) !== 'zh-CN' || !latestOutput.summaryDescriptor) {
    return latestOutput.summary;
  }

  const dynamicCopy = getDynamicCopy(locale);
  const descriptor = latestOutput.summaryDescriptor;

  switch (descriptor.variant) {
    case 'product-with-price':
      return dynamicCopy.latestOutputSummaryProductWithPrice(
        descriptor.priceDisplayText ?? ''
      );
    case 'product':
      return dynamicCopy.latestOutputSummaryProductGeneric;
    case 'search-top-result':
      return dynamicCopy.latestOutputSummarySearchTopResult(
        descriptor.leadTitle ?? ''
      );
    case 'search':
      return dynamicCopy.latestOutputSummarySearchGeneric(
        descriptor.itemCount ?? 0
      );
    case 'deal-lead':
      return dynamicCopy.latestOutputSummaryDealLead(
        descriptor.leadTitle ?? ''
      );
    case 'deal':
      return dynamicCopy.latestOutputSummaryDealGeneric(
        descriptor.itemCount ?? 0
      );
  }
}

export function formatLatestOutputDetailLines(
  latestOutput: LatestOutputLike,
  locale: UiLocale = 'en'
) {
  if (
    resolveUiLocale(locale) !== 'zh-CN' ||
    !latestOutput.detailEntries?.length
  ) {
    return latestOutput.previewLines;
  }

  const dynamicCopy = getDynamicCopy(locale);

  return latestOutput.detailEntries.map(
    (entry) =>
      `${dynamicCopy.latestOutputDetailLabels[entry.kind]}: ${entry.value}`
  );
}
