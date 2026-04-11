import {
  getDynamicCopy,
  type SidePanelHomeViewModel,
  type UiLocale,
} from '@shopflow/core';
import { formatLiveReceiptStatusLabel } from '@shopflow/contracts';
import { Compass, PackageSearch, ReceiptText, Sparkles } from 'lucide-react';
import { Card } from './primitives';
import { surfaceTokens } from './tokens';
import { getUiShellCopy } from './ui-copy';

type LocaleOption = {
  label: string;
  href: string;
  active: boolean;
};

export function SidePanelHomePage({
  model,
  localeOptions = [],
  locale = 'en',
}: {
  model: SidePanelHomeViewModel;
  localeOptions?: LocaleOption[];
  locale?: UiLocale;
}) {
  const copy = getUiShellCopy(locale);
  const readyCapabilities = model.capabilities.filter(
    (capability) => capability.status === 'ready'
  ).length;
  const constrainedCapabilities = model.capabilities.filter((capability) =>
    ['blocked', 'degraded', 'permission_needed'].includes(capability.status)
  ).length;
  const quickRoutes = deriveQuickRoutes(model, locale);
  const primaryRoute = quickRoutes[0];
  const recentProof = deriveRecentProofBlock(model, locale);
  const followUpRoute =
    quickRoutes[1] ??
    (model.secondaryNavigation[0]
      ? {
          label:
            model.secondaryNavigation[0].actionLabel ??
            model.secondaryNavigation[0].label,
          summary: model.secondaryNavigation[0].summary,
          href: model.secondaryNavigation[0].href,
          external: model.secondaryNavigation[0].href
            ? /^https?:/i.test(model.secondaryNavigation[0].href)
            : false,
          originLabel: copy.common.routeOriginLabels.sidePanelSection,
        }
      : null);

  return (
    <main
      className={`min-h-screen ${surfaceTokens.appBackground} px-4 py-5 ${surfaceTokens.headline}`}
    >
      <header className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              {copy.brand}
            </p>
            <h1 className="mt-2 text-2xl font-semibold">{model.appTitle}</h1>
            <p className={`mt-1 text-sm ${surfaceTokens.body}`}>
              {copy.sidePanel.intro}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
              {copy.sidePanel.statusLabels[model.appStatus]}
            </span>
            {localeOptions.length > 0 ? (
              <div className="flex flex-col items-end gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {copy.common.displayLanguageLabel}
                </p>
                <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1">
                  {localeOptions.map((option) => (
                    <a
                      key={option.href}
                      aria-current={option.active ? 'page' : undefined}
                      className={`rounded-lg px-3 py-1 text-xs font-medium ${
                        option.active
                          ? 'bg-stone-900 text-white'
                          : 'text-stone-700'
                      }`}
                      href={option.href}
                    >
                      {option.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <div id="readiness-summary">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              {copy.sidePanel.readinessSummary}
            </p>
            <p className="mt-2 text-base font-semibold">
              {model.readiness.label}
            </p>
            <p className="mt-2 text-sm text-stone-700">
              {model.readiness.summary}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-xs text-stone-600">
                <p className="font-semibold uppercase tracking-[0.18em] text-stone-500">
                  1. {copy.sidePanel.primaryRoute}
                </p>
                <p className="mt-2 text-sm font-medium text-stone-900">
                  {primaryRoute?.label ?? copy.sidePanel.noRunnableCapability}
                </p>
                <p className="mt-2 text-xs text-stone-600">
                  {primaryRoute?.summary ?? copy.sidePanel.noRunnableCapabilityTail}
                </p>
                {primaryRoute ? (
                  <a
                    className="mt-3 inline-flex rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700"
                    aria-label={copy.sidePanel.bestRouteAria(primaryRoute.label)}
                    href={primaryRoute.href}
                    target={primaryRoute.external ? '_blank' : undefined}
                    rel={primaryRoute.external ? 'noreferrer' : undefined}
                  >
                    {primaryRoute.originLabel}
                  </a>
                ) : null}
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4 text-xs text-stone-600">
                <p className="font-semibold uppercase tracking-[0.18em] text-stone-500">
                  2. {recentProof ? recentProof.heading : copy.sidePanel.recentActivityHeading}
                </p>
                <p className="mt-2 text-sm font-medium text-stone-900">
                  {recentProof?.title ?? copy.sidePanel.noVerifiedActivity}
                </p>
                <p className="mt-2 text-xs text-stone-600">
                  {recentProof?.summary ?? copy.sidePanel.noRunnableCapabilityTail}
                </p>
                {recentProof?.href ? (
                  <a
                    className="mt-3 inline-flex rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700"
                    href={recentProof.href}
                    target={recentProof.external ? '_blank' : undefined}
                    rel={recentProof.external ? 'noreferrer' : undefined}
                  >
                    {recentProof.hrefLabel}
                  </a>
                ) : null}
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-xs text-amber-900">
                <p className="font-semibold uppercase tracking-[0.18em] text-amber-700">
                  3. {copy.sidePanel.claimBoundary}
                </p>
                <p className="mt-2 text-sm font-medium text-stone-900">
                  {model.readiness.claimBoundary ?? copy.sidePanel.operatorNextStep}
                </p>
                <p className="mt-2 text-xs text-amber-900">
                  {model.readiness.operatorNextStep ??
                    copy.sidePanel.noRunnableCapabilityTail}
                </p>
                {followUpRoute ? (
                  <a
                    className="mt-3 inline-flex rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-900"
                    aria-label={copy.sidePanel.nextRouteAria(followUpRoute.label)}
                    href={followUpRoute.href}
                    target={followUpRoute.external ? '_blank' : undefined}
                    rel={followUpRoute.external ? 'noreferrer' : undefined}
                  >
                    {followUpRoute.label}
                  </a>
                ) : null}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-stone-900 bg-stone-900 px-4 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-200">
                  {copy.sidePanel.primaryRoute}
                </p>
                {primaryRoute ? (
                  <>
                    <p className="mt-1 text-[11px] text-stone-200">
                      {primaryRoute.originLabel}
                    </p>
                    <p className="mt-2 text-base font-semibold">
                      {primaryRoute.label}
                    </p>
                    <p className="mt-2 text-sm text-stone-200">
                      {primaryRoute.summary}
                    </p>
                    <a
                      className="mt-4 inline-flex rounded-xl bg-white px-3 py-2 text-sm font-medium text-stone-900"
                      aria-label={copy.sidePanel.bestRouteAria(
                        primaryRoute.label
                      )}
                      href={primaryRoute.href}
                      target={primaryRoute.external ? '_blank' : undefined}
                      rel={primaryRoute.external ? 'noreferrer' : undefined}
                    >
                      {primaryRoute.label}
                    </a>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-stone-200">
                    {copy.sidePanel.noRunnableCapability}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 text-xs text-stone-600">
                <p className="font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {copy.sidePanel.bestRoute}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="uppercase tracking-[0.18em] text-stone-500">
                      {copy.sidePanel.runnableNowHeading}
                    </p>
                    <p className="mt-1 text-sm font-medium text-stone-900">
                      {readyCapabilities}
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                    <p className="uppercase tracking-[0.18em] text-stone-500">
                      {copy.sidePanel.needsAttentionHeading}
                    </p>
                    <p className="mt-1 text-sm font-medium text-stone-900">
                      {constrainedCapabilities}
                    </p>
                  </div>
                </div>
                {model.readiness.operatorNextStep ? (
                  <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
                    <p className="font-semibold uppercase tracking-[0.18em] text-stone-500">
                      {copy.sidePanel.operatorNextStep}
                    </p>
                    <p className="mt-1 text-xs text-stone-700">
                      {model.readiness.operatorNextStep}
                    </p>
                  </div>
                ) : null}
                {model.readiness.claimBoundary ? (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                    <p className="font-semibold uppercase tracking-[0.18em] text-amber-700">
                      {copy.sidePanel.claimBoundary}
                    </p>
                    <p className="mt-1 text-xs text-amber-900">
                      {model.readiness.claimBoundary}
                    </p>
                  </div>
                ) : null}
              </div>

              {recentProof ? (
                <div
                  id="latest-output-preview"
                  className="rounded-2xl border border-stone-200 bg-white px-4 py-4 text-xs text-stone-600"
                >
                  <div id="recent-proof-block">
                    <p className="font-semibold uppercase tracking-[0.18em] text-stone-500">
                      {recentProof.heading}
                    </p>
                    <p className="mt-1 text-[11px] text-stone-500">
                      {recentProof.originLabel}
                    </p>
                    <p className="mt-2 text-sm font-medium text-stone-900">
                      {recentProof.title}
                    </p>
                    <p className="mt-2 text-xs text-stone-600">
                      {recentProof.summary}
                    </p>
                    {recentProof.detailLines.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs text-stone-600">
                        {recentProof.detailLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                    {recentProof.timestampLabel ? (
                      <p className="mt-2 text-xs text-stone-500">
                        {recentProof.timestampLabel}
                      </p>
                    ) : null}
                    {recentProof.href ? (
                      <a
                        className="mt-2 inline-flex text-xs font-medium text-stone-700 underline underline-offset-2"
                        href={recentProof.href}
                        target={recentProof.external ? '_blank' : undefined}
                        rel={recentProof.external ? 'noreferrer' : undefined}
                      >
                        {recentProof.hrefLabel}
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <div id="current-site-summary">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                  {copy.sidePanel.currentSite}
                </p>
                <p className="mt-2 text-sm font-medium">
                  {model.site.siteName}
                </p>
                <p className={`text-xs ${surfaceTokens.muted}`}>
                  {model.site.host} · {model.site.pageKindLabel}
                </p>
                <p className={`mt-1 text-xs ${surfaceTokens.muted}`}>
                  {model.site.urlLabel}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
                  {copy.sidePanel.statusLabels[model.appStatus]}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                  {readyCapabilities}{' '}
                  {copy.sidePanel.statusLabels.live.toLowerCase()}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Compass className="h-4 w-4" />
            <h2 className="text-sm font-semibold">
              {copy.sidePanel.availableOnPage}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {model.capabilities.map((capability) => (
              <div
                key={capability.id}
                className={`rounded-xl border px-3 py-3 ${
                  capability.status === 'ready'
                    ? 'border-emerald-200 bg-emerald-50'
                    : capability.status === 'blocked' ||
                        capability.status === 'degraded' ||
                        capability.status === 'permission_needed'
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-stone-200 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{capability.label}</p>
                  <span className="text-xs text-stone-500">
                    {copy.sidePanel.capabilityStatusLabels[capability.status] ??
                      capability.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-600">
                  {capability.description}
                </p>
                {capability.reason ? (
                  <p className="mt-2 text-xs text-stone-500">
                    {copy.sidePanel.whyUnavailable} {capability.reason}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <div id="quick-actions">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <h2 className="text-sm font-semibold">
                {copy.sidePanel.quickActions}
              </h2>
            </div>
            <p className="mb-3 text-xs text-stone-500">
              {copy.sidePanel.quickActionsIntro}
            </p>
            <div className="grid grid-cols-1 gap-3">
              {model.quickActions.length > 0 ? (
                model.quickActions.map((action, index) => (
                  <div
                    key={action.id}
                    className={`rounded-xl border px-3 py-3 ${
                      index === 0
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-stone-50 text-stone-900'
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                        index === 0 ? 'text-stone-200' : 'text-stone-500'
                      }`}
                    >
                      {index === 0
                        ? copy.sidePanel.primaryRoute
                        : copy.sidePanel.supportedMove}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{action.label}</p>
                    <p
                      className={`mt-1 text-xs ${
                        index === 0 ? 'text-stone-200' : 'text-stone-600'
                      }`}
                    >
                      {action.summary}
                    </p>
                    <a
                      className={`mt-3 inline-flex rounded-xl px-3 py-2 text-sm font-medium ${
                        index === 0
                          ? 'bg-white text-stone-900'
                          : 'border border-stone-200 bg-white text-stone-700'
                      }`}
                      href={action.href}
                      target={action.external ? '_blank' : undefined}
                      rel={action.external ? 'noreferrer' : undefined}
                    >
                      {action.label}
                    </a>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
                  <p className="text-sm font-medium text-stone-900">
                    {copy.sidePanel.noRunnableCapability}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    {copy.sidePanel.noRunnableCapabilityTail}
                    {model.readiness.operatorNextStep
                      ? ` ${copy.sidePanel.nextStepPrefix} ${model.readiness.operatorNextStep}`
                      : ''}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {model.evidenceStatus?.items.length ? (
          <div id="live-receipt-readiness" className="space-y-4">
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <ReceiptText className="h-4 w-4" />
                <h2 className="text-sm font-semibold">
                  {model.evidenceStatus.headline}
                </h2>
              </div>
              <p className="text-sm text-stone-600">
                {copy.sidePanel.liveReceiptThreeLayers}
              </p>
            </Card>

            <div id="live-receipt-evidence">
              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <ReceiptText className="h-4 w-4" />
                  <h2 className="text-sm font-semibold">
                    {copy.sidePanel.evidenceOverview}
                  </h2>
                </div>
                {model.evidenceStatus.blockerSummary ? (
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
                    <p className="text-sm font-medium">
                      {model.evidenceStatus.blockerSummary.label}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">
                      {model.evidenceStatus.blockerSummary.summary}
                    </p>
                    {model.evidenceStatus.blockerSummary.nextStep ? (
                      <p className="mt-2 text-xs text-stone-500">
                        {copy.sidePanel.nextStepPrefixInline}{' '}
                        {model.evidenceStatus.blockerSummary.nextStep}
                      </p>
                    ) : null}
                    {model.evidenceStatus.blockerSummary.sourceHref ? (
                      <a
                        className="mt-2 inline-flex text-xs font-medium text-stone-700 underline underline-offset-2"
                        href={model.evidenceStatus.blockerSummary.sourceHref}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {model.evidenceStatus.blockerSummary.sourceLabel ??
                          copy.common.openSourcePage}
                      </a>
                    ) : null}
                  </div>
                ) : null}
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  {createEvidenceOverviewLines(model.evidenceStatus.items).map(
                    (line) => (
                      <li
                        key={line}
                        className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
                      >
                        {line}
                      </li>
                    )
                  )}
                </ul>
              </Card>
            </div>

            <div id="live-receipt-review">
              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <ReceiptText className="h-4 w-4" />
                  <h2 className="text-sm font-semibold">
                    {copy.sidePanel.reviewLane}
                  </h2>
                </div>
                <ul className="space-y-2 text-sm text-stone-600">
                  {createReviewLaneLines(model.evidenceStatus.items).map(
                    (line) => (
                      <li
                        key={line}
                        className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
                      >
                        {line}
                      </li>
                    )
                  )}
                </ul>
                <div className="mt-3 space-y-3">
                  {model.evidenceStatus.items
                    .filter(isReviewLaneItem)
                    .map((item) => (
                      <div
                        key={item.captureId}
                        className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className={`text-xs ${surfaceTokens.muted}`}>
                              {formatLiveReceiptStatusLabel(
                                item.status,
                                locale
                              )}
                            </p>
                          </div>
                          {item.reviewLabel ? (
                            <span className="text-xs text-stone-500">
                              {item.reviewLabel}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-stone-600">
                          {item.summary}
                        </p>
                        {item.reviewSummary ? (
                          <p className="mt-2 text-xs text-stone-500">
                            {copy.sidePanel.reviewNotePrefix}{' '}
                            {item.reviewSummary}
                          </p>
                        ) : null}
                        {item.nextStep ? (
                          <p className="mt-2 text-xs text-stone-500">
                            {copy.sidePanel.nextStepPrefixInline}{' '}
                            {item.nextStep}
                          </p>
                        ) : null}
                        {item.sourceHref ? (
                          <a
                            className="mt-2 inline-flex text-xs font-medium text-stone-700 underline underline-offset-2"
                            href={item.sourceHref}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.sourceLabel ?? copy.common.openSourcePage}
                          </a>
                        ) : null}
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            <div id="live-receipt-packets">
              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <ReceiptText className="h-4 w-4" />
                  <h2 className="text-sm font-semibold">
                    {copy.sidePanel.rawPacketLedger}
                  </h2>
                </div>
                <div className="space-y-3">
                  {model.evidenceStatus.items.map((item) => (
                    <div
                      key={item.captureId}
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className={`text-xs ${surfaceTokens.muted}`}>
                            {copy.sidePanel.verifiedScopePrefix}{' '}
                            {item.verifiedScope}
                          </p>
                        </div>
                        <span className="text-xs text-stone-500">
                          {formatLiveReceiptStatusLabel(item.status, locale)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-600">
                        {item.summary}
                      </p>
                      {item.packetSummary ? (
                        <p className="mt-2 text-xs text-stone-500">
                          {copy.sidePanel.packetPrefix} {item.packetSummary}
                        </p>
                      ) : null}
                      {item.updatedAtLabel ? (
                        <p className="mt-2 text-xs text-stone-500">
                          {copy.sidePanel.updatedPrefix} {item.updatedAtLabel}
                        </p>
                      ) : null}
                      {item.operatorHint ? (
                        <p className="mt-2 text-xs text-stone-500">
                          {copy.sidePanel.operatorNotePrefix}{' '}
                          {item.operatorHint}
                        </p>
                      ) : null}
                      {item.nextStep ? (
                        <p className="mt-2 text-xs text-stone-500">
                          {copy.sidePanel.nextStepPrefixInline} {item.nextStep}
                        </p>
                      ) : null}
                      {item.sourceHref ? (
                        <a
                          className="mt-2 inline-flex text-xs font-medium text-stone-700 underline underline-offset-2"
                          href={item.sourceHref}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.sourceLabel ?? copy.common.openSourcePage}
                        </a>
                      ) : null}
                      {item.screenshotLabel ? (
                        <p className="mt-2 text-xs text-stone-500">
                          {copy.sidePanel.latestProofPrefix}{' '}
                          {item.screenshotLabel}
                        </p>
                      ) : null}
                      {item.actionSnapshot ? (
                        <p className="mt-2 text-xs text-stone-500">
                          {copy.sidePanel.countsSummary(item.actionSnapshot)}
                        </p>
                      ) : null}
                      {item.reviewLabel ? (
                        <p className="mt-2 text-xs text-stone-500">
                          {copy.sidePanel.reviewPrefix} {item.reviewLabel}
                        </p>
                      ) : null}
                      {item.reviewSummary ? (
                        <p className="mt-2 text-xs text-stone-500">
                          {copy.sidePanel.reviewNotePrefix} {item.reviewSummary}
                        </p>
                      ) : null}
                      {item.expiresAtLabel ? (
                        <p className="mt-2 text-xs text-stone-500">
                          {item.expiresAtLabel}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : null}

        <div id="recent-activity">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <ReceiptText className="h-4 w-4" />
              <h2 className="text-sm font-semibold">
                {copy.sidePanel.recentActivityHeading}
              </h2>
            </div>
            {model.recentActivities.length > 0 ? (
              <ul className="space-y-2 text-sm text-stone-700">
                {model.recentActivities.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
                  >
                    <p className="font-medium">{item.label}</p>
                    {item.summary ? (
                      <p className="mt-1 text-xs text-stone-600">
                        {item.summary}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-stone-500">
                      {item.timestampLabel}
                    </p>
                    {item.href ? (
                      <a
                        className="mt-2 inline-flex text-xs font-medium text-stone-700 underline underline-offset-2"
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.common.jumpToSourcePage}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">
                {copy.sidePanel.noVerifiedActivity}
              </p>
            )}
          </Card>
        </div>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <PackageSearch className="h-4 w-4" />
            <h2 className="text-sm font-semibold">
              {copy.sidePanel.nextRoutesHeading}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {model.secondaryNavigation.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {item.summary}
                    </p>
                  </div>
                  <a
                    className="rounded-xl px-3 py-2 text-sm font-medium text-stone-700 underline underline-offset-2"
                    href={item.href ?? '#readiness-summary'}
                  >
                    {item.actionLabel ?? copy.sidePanel.openRoute}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}

type SidePanelRoute = {
  id: string;
  label: string;
  href: string;
  summary: string;
  originLabel: string;
  external?: boolean;
};

type RecentProofBlock = {
  heading: string;
  originLabel: string;
  title: string;
  summary: string;
  detailLines: string[];
  timestampLabel?: string;
  href?: string;
  hrefLabel: string;
  external?: boolean;
};

function deriveRecentProofBlock(
  model: SidePanelHomeViewModel,
  locale: UiLocale = 'en'
): RecentProofBlock | undefined {
  const copy = getUiShellCopy(locale);

  if (model.latestOutputPreview) {
    return {
      heading: model.latestOutputPreview.label,
      originLabel: copy.common.routeOriginLabels.capturedPage,
      title: model.latestOutputPreview.title,
      summary: model.latestOutputPreview.summary,
      detailLines: model.latestOutputPreview.detailLines,
      timestampLabel: model.latestOutputPreview.timestampLabel
        ? copy.popup.latestCapturedAt(model.latestOutputPreview.timestampLabel)
        : undefined,
      href: model.latestOutputPreview.href,
      hrefLabel:
        model.latestOutputPreview.hrefLabel ??
        copy.common.openLatestCapturedPage,
      external: Boolean(model.latestOutputPreview.href),
    };
  }

  const latestActivity = model.recentActivities[0];
  if (latestActivity) {
    return {
      heading: copy.sidePanel.recentActivityHeading,
      originLabel: copy.common.routeOriginLabels.merchantSource,
      title: latestActivity.label,
      summary: latestActivity.summary ?? copy.sidePanel.noVerifiedActivity,
      detailLines: [],
      timestampLabel: latestActivity.timestampLabel,
      href: latestActivity.href,
      hrefLabel: copy.common.jumpToSourcePage,
      external: Boolean(latestActivity.href),
    };
  }

  const evidenceItem = model.evidenceStatus?.items[0];
  if (evidenceItem) {
    return {
      heading:
        model.evidenceStatus?.headline ?? copy.sidePanel.evidenceOverview,
      originLabel: copy.common.routeOriginLabels.evidenceGate,
      title: evidenceItem.title,
      summary: evidenceItem.summary,
      detailLines: [],
      timestampLabel: evidenceItem.updatedAtLabel,
      href: evidenceItem.sourceHref,
      hrefLabel: evidenceItem.sourceLabel ?? copy.common.openSourcePage,
      external: Boolean(evidenceItem.sourceHref),
    };
  }

  return undefined;
}

function deriveQuickRoutes(
  model: SidePanelHomeViewModel,
  locale: UiLocale = 'en'
): SidePanelRoute[] {
  const copy = getUiShellCopy(locale);
  const dynamicCopy = getDynamicCopy(locale);
  const latestActivity = model.recentActivities[0];
  const latestOutputRoute = model.latestOutputPreview?.href
    ? {
        href: model.latestOutputPreview.href,
        label:
          model.latestOutputPreview.hrefLabel ??
          copy.common.openLatestCapturedPage,
        summary:
          model.latestOutputPreview.summary ||
          'Return to the freshest captured page when no fresher source page has been recorded yet.',
      }
    : undefined;
  const blockerRoute = model.evidenceStatus?.blockerSummary?.sourceHref
    ? {
        href: model.evidenceStatus.blockerSummary.sourceHref,
        label:
          model.evidenceStatus.blockerSummary.sourceLabel ??
          copy.common.openEvidenceSourcePage,
        summary:
          model.evidenceStatus.blockerSummary.nextStep ??
          model.evidenceStatus.blockerSummary.summary,
      }
    : undefined;
  const evidenceSource = model.evidenceStatus?.items.find(
    (item) => item.sourceHref
  );
  const evidenceSectionHref =
    model.evidenceStatus?.items[0]?.sectionHref ?? '#live-receipt-readiness';

  const routes: SidePanelRoute[] = [
    blockerRoute
      ? {
          id: 'blocker-route',
          label: blockerRoute.label,
          href: blockerRoute.href,
          summary: blockerRoute.summary,
          originLabel: copy.common.routeOriginLabels.evidenceSource,
          external: true,
        }
      : latestActivity?.href
        ? {
            id: 'latest-source',
            label: copy.common.openLatestSourcePage,
            href: latestActivity.href,
            summary: latestActivity.summary
              ? dynamicCopy.latestSourceRouteSummary(
                  latestActivity.label,
                  latestActivity.summary
                )
              : dynamicCopy.routeBackToMerchantSummary,
            originLabel: copy.common.routeOriginLabels.merchantSource,
            external: true,
          }
        : latestOutputRoute
          ? {
              id: 'latest-output',
              label: latestOutputRoute.label,
              href: latestOutputRoute.href,
              summary: dynamicCopy.latestCapturedRouteSummary,
              originLabel: copy.common.routeOriginLabels.capturedPage,
              external: true,
            }
          : evidenceSource?.sourceHref
            ? {
                id: 'evidence-source',
                label:
                  evidenceSource.sourceLabel ??
                  copy.common.openEvidenceSourcePage,
                href: evidenceSource.sourceHref,
                summary: dynamicCopy.evidenceSourceRouteSummary,
                originLabel: copy.common.routeOriginLabels.evidenceSource,
                external: true,
              }
            : {
                id: 'support-state',
                label: dynamicCopy.reviewSupportStateLabel,
                href: '#current-site-summary',
                summary: dynamicCopy.currentSiteSummaryRoute,
                originLabel: copy.common.routeOriginLabels.sidePanelSection,
              },
  ];

  if (
    latestActivity?.href &&
    !routes.some((route) => route.href === latestActivity.href)
  ) {
    routes.push({
      id: 'latest-source',
      label: copy.common.openLatestSourcePage,
      href: latestActivity.href,
      summary: latestActivity.summary
        ? dynamicCopy.latestSourceRouteSummary(
            latestActivity.label,
            latestActivity.summary
          )
        : dynamicCopy.routeBackToMerchantSummary,
      originLabel: copy.common.routeOriginLabels.merchantSource,
      external: true,
    });
  }

  if (
    latestOutputRoute &&
    !routes.some((route) => route.href === latestOutputRoute.href)
  ) {
    routes.push({
      id: 'latest-output',
      label: latestOutputRoute.label,
      href: latestOutputRoute.href,
      summary: dynamicCopy.latestCapturedRouteSummary,
      originLabel: copy.common.routeOriginLabels.capturedPage,
      external: true,
    });
  }

  routes.push(
    model.evidenceStatus?.items.length
      ? {
          id: 'claim-gate',
          label: dynamicCopy.reviewClaimGateLabel,
          href: evidenceSectionHref,
          summary:
            model.evidenceStatus?.blockerSummary?.summary ??
            dynamicCopy.reviewClaimGateSummary,
          originLabel: copy.common.routeOriginLabels.evidenceGate,
        }
      : {
          id: 'readiness-summary',
          label: dynamicCopy.reviewReadinessSummaryLabel,
          href: '#readiness-summary',
          summary: dynamicCopy.reviewReadinessSummarySummary,
          originLabel: copy.common.routeOriginLabels.sidePanelSection,
        }
  );

  return routes.filter(
    (route, index) =>
      routes.findIndex(
        (candidate) =>
          candidate.href === route.href && candidate.label === route.label
      ) === index
  );
}

function createEvidenceOverviewLines(
  items: NonNullable<SidePanelHomeViewModel['evidenceStatus']>['items'],
  locale: UiLocale = 'en'
) {
  const copy = getUiShellCopy(locale).sidePanel;
  const missingCount = items.filter(
    (item) => item.status === 'missing-live-receipt'
  ).length;
  const inProgressCount = items.filter(
    (item) => item.status === 'capture-in-progress'
  ).length;

  if (missingCount === 0 && inProgressCount === 0) {
    return [copy.captureLaneClearSummary];
  }

  return [
    ...(missingCount > 0 ? [copy.captureQueueSummary(missingCount)] : []),
    ...(inProgressCount > 0
      ? [copy.captureInProgressQueueSummary(inProgressCount)]
      : []),
  ];
}

function createReviewLaneLines(
  items: NonNullable<SidePanelHomeViewModel['evidenceStatus']>['items'],
  locale: UiLocale = 'en'
) {
  const copy = getUiShellCopy(locale).sidePanel;
  const pendingCount = items.filter(
    (item) => item.status === 'captured'
  ).length;
  const reviewedCount = items.filter(
    (item) => item.status === 'reviewed'
  ).length;
  const rejectedCount = items.filter(
    (item) => item.status === 'rejected'
  ).length;
  const expiredCount = items.filter((item) => item.status === 'expired').length;

  if (
    pendingCount === 0 &&
    reviewedCount === 0 &&
    rejectedCount === 0 &&
    expiredCount === 0
  ) {
    return [copy.noReviewLaneItems];
  }

  return [
    ...(pendingCount > 0 ? [copy.reviewPendingSummary(pendingCount)] : []),
    ...(reviewedCount > 0 ? [copy.reviewedCountSummary(reviewedCount)] : []),
    ...(rejectedCount > 0 ? [copy.rejectedCountSummary(rejectedCount)] : []),
    ...(expiredCount > 0 ? [copy.expiredCountSummary(expiredCount)] : []),
  ];
}

function isReviewLaneItem(
  item: NonNullable<SidePanelHomeViewModel['evidenceStatus']>['items'][number]
) {
  return (
    item.status === 'captured' ||
    item.status === 'reviewed' ||
    item.status === 'rejected' ||
    item.status === 'expired'
  );
}
