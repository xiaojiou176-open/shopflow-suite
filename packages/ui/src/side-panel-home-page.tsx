import {
  getDynamicCopy,
  type SidePanelHomeViewModel,
  type UiLocale,
} from '@shopflow/core';
import { formatLiveReceiptStatusLabel } from '@shopflow/contracts';
import { Compass, PackageSearch, ReceiptText, Sparkles } from 'lucide-react';
import { useCurrentHash } from './use-current-hash';
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
  const currentHash = useCurrentHash();
  const evidenceHubOpen =
    currentHash === '#live-receipt-readiness' ||
    currentHash === '#live-receipt-evidence' ||
    currentHash === '#live-receipt-review' ||
    currentHash === '#live-receipt-packets';
  const constrainedCapabilities = model.capabilities.filter((capability) =>
    ['blocked', 'degraded', 'permission_needed'].includes(capability.status)
  ).length;
  const quickRoutes = deriveQuickRoutes(model, locale);
  const primaryRoute = quickRoutes[0];
  const recentProof = deriveRecentProofBlock(model, locale);
  const operatorRoute = model.evidenceStatus?.blockerSummary?.sourceHref
    ? {
        label:
          model.evidenceStatus.blockerSummary.sourceLabel ??
          copy.common.openSourcePage,
        summary:
          model.evidenceStatus.blockerSummary.nextStep ??
          model.evidenceStatus.blockerSummary.summary,
        href: model.evidenceStatus.blockerSummary.sourceHref,
        external: /^https?:/i.test(
          model.evidenceStatus.blockerSummary.sourceHref
        ),
      }
    : recentProof?.href
      ? {
          label: recentProof.hrefLabel,
          summary: recentProof.summary,
          href: recentProof.href,
          external: Boolean(recentProof.external),
        }
      : primaryRoute
        ? {
            label: primaryRoute.label,
            summary: primaryRoute.summary,
            href: primaryRoute.href,
            external: Boolean(primaryRoute.external),
          }
        : null;
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
  const recentActivityPreview = model.recentActivities[0] ?? null;
  const recentActivityOverflow = model.recentActivities.slice(1, 3);
  const secondaryNavigationPreview = model.secondaryNavigation[0] ?? null;
  const recentActivityOpen = currentHash === '#recent-activity';
  const nextRoutesOpen = currentHash === '#next-routes';
  const currentSiteOpen =
    currentHash === '#current-site-summary' || model.quickActions.length === 0;
  const capabilityGridOpen =
    currentHash === '#capability-grid' || model.quickActions.length === 0;
  const capabilityGridPreview =
    primaryRoute?.label ??
    model.capabilities[0]?.label ??
    copy.sidePanel.noRunnableCapability;

  return (
    <main
      className={`shopflow-surface min-h-screen ${surfaceTokens.appBackground} px-4 py-5 ${surfaceTokens.headline}`}
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
                        className={`rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap ${
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
          <Card className="overflow-hidden bg-[rgba(255,253,248,0.92)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              {copy.sidePanel.readinessSummary}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.2fr_0.85fr]">
              <section className="shopflow-hero-panel rounded-[2rem] px-5 py-5 text-white">
                <div className="flex flex-wrap gap-2">
                  <span className="shopflow-chip border-white/10 bg-white/10 text-[#e9e2d8]">
                    {copy.sidePanel.bestRoute}
                  </span>
                  <span className="shopflow-chip border-white/10 bg-white/10 text-[#e9e2d8]">
                    {model.site.siteName} · {model.site.pageKindLabel}
                  </span>
                </div>
                <p className="mt-4 text-lg font-semibold">
                  {primaryRoute?.label ?? model.readiness.label}
                </p>
                <p className="mt-2 text-sm text-[#ede7de]">
                  {model.readiness.summary}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d9cfbf]">
                      {copy.sidePanel.runnableNowHeading}
                    </p>
                    <p className="mt-2 text-base font-semibold">
                      {readyCapabilities}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d9cfbf]">
                      {copy.sidePanel.needsAttentionHeading}
                    </p>
                    <p className="mt-2 text-base font-semibold">
                      {constrainedCapabilities}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-[#d9cfbf]">
                  {primaryRoute?.originLabel ??
                    copy.common.routeOriginLabels.sidePanelSection}
                </p>
                {primaryRoute ? (
                  <a
                    className="mt-3 inline-flex rounded-2xl bg-[#1f6b57] px-3 py-2 text-sm font-medium text-white shadow-[0_10px_24px_rgba(31,107,87,0.24)]"
                    aria-label={copy.sidePanel.bestRouteAria(
                      primaryRoute.label
                    )}
                    href={primaryRoute.href}
                    target={primaryRoute.external ? '_blank' : undefined}
                    rel={primaryRoute.external ? 'noreferrer' : undefined}
                  >
                    {primaryRoute.label}
                  </a>
                ) : null}
                <p className="mt-3 text-xs text-[#d9cfbf]">
                  {primaryRoute?.summary ??
                    copy.sidePanel.noRunnableCapabilityTail}
                </p>
              </section>

              <div className="space-y-3">
                <section className="shopflow-soft-panel rounded-[1.85rem] px-4 py-4 text-xs text-[#6c665d]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="shopflow-kicker text-[color:var(--shopflow-muted)]">
                      {copy.sidePanel.operatorNextStep}
                    </p>
                    <span className="shopflow-chip shopflow-chip--accent">
                      {copy.sidePanel.claimBoundary}
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="rounded-[1.35rem] border border-[rgba(31,107,87,0.16)] bg-[rgba(237,246,242,0.84)] px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {model.readiness.claimBoundary ? (
                          <span className="shopflow-chip shopflow-chip--accent">
                            {model.readiness.claimBoundary}
                          </span>
                        ) : null}
                        {primaryRoute?.originLabel ? (
                          <span className="shopflow-chip">
                            {primaryRoute.originLabel}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-[#1f1c17]">
                        {operatorRoute?.label ??
                          copy.sidePanel.noRunnableCapability}
                      </p>
                      <p className="mt-2 text-xs text-[#4d645d]">
                        {operatorRoute?.summary ??
                          model.readiness.operatorNextStep}
                      </p>
                      {operatorRoute ? (
                        <a
                          className="mt-3 inline-flex rounded-[1.05rem] border border-[rgba(31,107,87,0.16)] bg-white px-3 py-2 text-sm font-medium text-[var(--shopflow-accent)] shadow-[0_8px_18px_rgba(24,92,84,0.08)]"
                          href={operatorRoute.href}
                          target={operatorRoute.external ? '_blank' : undefined}
                          rel={
                            operatorRoute.external ? 'noreferrer' : undefined
                          }
                        >
                          {operatorRoute.label}
                        </a>
                      ) : null}
                    </div>

                    <div>
                      <section
                        id="latest-output-preview"
                        className="rounded-[1.3rem] border border-[color:var(--shopflow-line)] bg-white/88 px-3 py-3"
                      >
                        <div id="recent-proof-block">
                          <p className="shopflow-kicker text-[color:var(--shopflow-muted)]">
                            {recentProof?.heading ??
                              copy.sidePanel.recentActivityHeading}
                          </p>
                          <p className="mt-1 text-[11px] text-stone-500">
                            {recentProof?.originLabel ??
                              copy.common.routeOriginLabels.merchantSource}
                          </p>
                          <p className="mt-2 text-sm font-medium text-[#1f1c17]">
                            {recentProof?.title ??
                              copy.sidePanel.noVerifiedActivity}
                          </p>
                          <p className="mt-2 text-xs text-[#6c665d]">
                            {recentProof?.summary ??
                              copy.sidePanel.noRunnableCapabilityTail}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {recentProof?.timestampLabel ? (
                              <span className="shopflow-chip">
                                {recentProof.timestampLabel}
                              </span>
                            ) : null}
                            {recentProof?.detailLines
                              .slice(0, 2)
                              .map((line) => (
                                <span key={line} className="shopflow-chip">
                                  {line}
                                </span>
                              ))}
                            {recentProof?.href ? (
                              <a
                                className="inline-flex text-xs font-medium text-stone-700 underline underline-offset-2"
                                href={recentProof.href}
                                target={
                                  recentProof.external ? '_blank' : undefined
                                }
                                rel={
                                  recentProof.external
                                    ? 'noreferrer'
                                    : undefined
                                }
                              >
                                {recentProof.hrefLabel}
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </section>
                    </div>

                    {followUpRoute &&
                    followUpRoute.href !== operatorRoute?.href ? (
                      <section className="rounded-[1.3rem] border border-[color:var(--shopflow-line)] bg-[var(--shopflow-surface-soft)] px-3 py-3 text-xs text-[#6c665d]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="shopflow-kicker text-[color:var(--shopflow-muted)]">
                              {copy.sidePanel.nextRoute}
                            </p>
                            <p className="mt-2 text-sm font-medium text-[#1f1c17]">
                              {followUpRoute.label}
                            </p>
                            <p className="mt-1 text-xs text-[#6c665d]">
                              {followUpRoute.summary}
                            </p>
                          </div>
                          <a
                            className="inline-flex shrink-0 rounded-full border border-[color:var(--shopflow-line)] bg-white px-3 py-2 text-xs font-medium text-[#514a42]"
                            aria-label={copy.sidePanel.nextRouteAria(
                              followUpRoute.label
                            )}
                            href={followUpRoute.href}
                            target={
                              followUpRoute.external ? '_blank' : undefined
                            }
                            rel={
                              followUpRoute.external ? 'noreferrer' : undefined
                            }
                          >
                            {copy.sidePanel.openRoute}
                          </a>
                        </div>
                        {followUpRoute.originLabel ? (
                          <p className="mt-2 text-[11px] text-stone-500">
                            {followUpRoute.originLabel}
                          </p>
                        ) : null}
                      </section>
                    ) : null}
                  </div>
                </section>
              </div>
            </div>
          </Card>
        </div>

        <div id="capability-grid">
          <Card className="overflow-hidden bg-[rgba(255,253,248,0.82)]">
            <details open={capabilityGridOpen || undefined}>
              <summary className="shopflow-soft-panel flex items-center justify-between gap-3 rounded-[1.5rem] px-4 py-4">
                <div className="flex min-w-0 items-start gap-2">
                  <Compass className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold">
                      {copy.sidePanel.availableOnPage}
                    </h2>
                    <p className="mt-1 truncate text-xs text-stone-500">
                      {capabilityGridPreview}
                    </p>
                    <p className="mt-2 text-xs text-stone-600">
                      {readyCapabilities}{' '}
                      {copy.sidePanel.statusLabels.live.toLowerCase()} ·{' '}
                      {model.capabilities.length}{' '}
                      {model.capabilities.length === 1
                        ? 'capability'
                        : 'capabilities'}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-500">
                  {model.capabilities.length}
                </span>
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {model.capabilities.map((capability) => (
                  <div
                    key={capability.id}
                    className={`rounded-[1.15rem] border px-3 py-3 ${
                      capability.status === 'ready'
                        ? 'border-emerald-200 bg-[rgba(236,244,239,0.92)]'
                        : capability.status === 'blocked' ||
                            capability.status === 'degraded' ||
                            capability.status === 'permission_needed'
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-stone-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{capability.label}</p>
                      <span className="text-xs text-stone-500">
                        {copy.sidePanel.capabilityStatusLabels[
                          capability.status
                        ] ?? capability.status}
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
            </details>
          </Card>
        </div>

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
                    className={`rounded-[1.15rem] border px-3 py-3 ${
                      index === 0
                        ? 'shopflow-soft-panel--tint text-[#1f1c17]'
                        : 'border-stone-200 bg-stone-50 text-stone-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                            index === 0 ? 'text-[#1f6b57]' : 'text-stone-500'
                          }`}
                        >
                          {index === 0
                            ? copy.sidePanel.primaryRoute
                            : copy.sidePanel.supportedMove}
                        </p>
                        <p className="mt-2 text-sm font-semibold">
                          {action.label}
                        </p>
                        <p
                          className={`mt-1 text-xs ${
                            index === 0 ? 'text-[#4d645d]' : 'text-stone-600'
                          }`}
                        >
                          {action.summary}
                        </p>
                      </div>
                      <a
                        className={`shrink-0 rounded-xl px-3 py-2 text-sm font-medium ${
                          index === 0
                            ? 'bg-[#1f6b57] text-white'
                            : 'border border-stone-200 bg-white text-stone-700'
                        }`}
                        href={action.href}
                        target={action.external ? '_blank' : undefined}
                        rel={action.external ? 'noreferrer' : undefined}
                      >
                        {action.label}
                      </a>
                    </div>
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

        <div id="current-site-summary">
          <Card className="overflow-hidden bg-[rgba(255,253,248,0.82)]">
            <details open={currentSiteOpen || undefined}>
              <summary className="shopflow-soft-panel flex items-center justify-between gap-3 rounded-[1.5rem] px-4 py-4">
                <div className="flex min-w-0 items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold">
                      {copy.sidePanel.currentSite}
                    </h2>
                    <p className="mt-1 truncate text-xs text-stone-500">
                      {model.site.siteName} · {model.site.pageKindLabel}
                    </p>
                    <p className="mt-2 text-xs text-stone-600">
                      {model.workflowBrief.summary}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-500">
                  {copy.sidePanel.openRoute}
                </span>
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
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
                </div>

                <section className="shopflow-soft-panel rounded-[1.5rem] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    {copy.sidePanel.workflowCopilot}
                  </p>
                  <p className="mt-2 text-xs text-[#6c665d]">
                    {model.workflowBrief.summary}
                  </p>
                  <ul className="mt-3 divide-y divide-[rgba(58,49,38,0.10)] rounded-[1.25rem] border border-[rgba(58,49,38,0.10)] bg-white/90 px-3">
                    {model.workflowBrief.bullets.slice(0, 3).map((item) => (
                      <li key={`${item.label}-${item.value}`} className="py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm text-[#1f1c17]">
                          {item.value}
                        </p>
                      </li>
                    ))}
                  </ul>
                  {model.workflowBrief.nextAction ? (
                    <div className="mt-3 rounded-2xl border border-[rgba(31,107,87,0.16)] bg-[#edf6f2] px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1f6b57]">
                        {copy.sidePanel.nextAssistantMove}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#1f1c17]">
                        {model.workflowBrief.nextAction.label}
                      </p>
                      <p className="mt-1 text-xs text-[#4d645d]">
                        {model.workflowBrief.nextAction.reason}
                      </p>
                    </div>
                  ) : null}
                </section>
              </div>
            </details>
          </Card>
        </div>

        <div id="recent-activity">
          <Card className="overflow-hidden bg-[rgba(255,253,248,0.82)]">
            <details open={recentActivityOpen || undefined}>
              <summary className="shopflow-soft-panel flex items-center justify-between gap-3 rounded-[1.5rem] px-4 py-4">
                <div className="flex min-w-0 items-start gap-2">
                  <ReceiptText className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold">
                      {copy.sidePanel.recentActivityHeading}
                    </h2>
                    <p className="mt-1 truncate text-xs text-stone-500">
                      {recentActivityPreview?.label ??
                        copy.sidePanel.noVerifiedActivity}
                    </p>
                    {recentActivityPreview?.summary ? (
                      <p className="mt-2 text-xs text-stone-600">
                        {recentActivityPreview.summary}
                      </p>
                    ) : null}
                  </div>
                </div>
                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-500">
                  {model.recentActivities.length}
                </span>
              </summary>
              {model.recentActivities.length > 0 ? (
                <ul className="mt-3 divide-y divide-[rgba(58,49,38,0.10)] rounded-2xl border border-[rgba(58,49,38,0.10)] bg-white px-3">
                  {[recentActivityPreview, ...recentActivityOverflow]
                    .filter(
                      (
                        item
                      ): item is NonNullable<typeof recentActivityPreview> =>
                        Boolean(item)
                    )
                    .map((item) => (
                      <li key={item.id} className="py-3 text-sm text-stone-700">
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
                <p className="mt-3 rounded-2xl border border-[rgba(58,49,38,0.10)] bg-white px-3 py-3 text-sm text-stone-500">
                  {copy.sidePanel.noVerifiedActivity}
                </p>
              )}
            </details>
          </Card>
        </div>

        <div id="next-routes">
          <Card className="overflow-hidden bg-[rgba(255,253,248,0.82)]">
            <details open={nextRoutesOpen || undefined}>
              <summary className="shopflow-soft-panel flex items-center justify-between gap-3 rounded-[1.5rem] px-4 py-4">
                <div className="flex min-w-0 items-start gap-2">
                  <PackageSearch className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold">
                      {copy.sidePanel.nextRoutesHeading}
                    </h2>
                    <p className="mt-1 truncate text-xs text-stone-500">
                      {secondaryNavigationPreview?.label ??
                        copy.sidePanel.noRunnableCapability}
                    </p>
                    {secondaryNavigationPreview?.summary ? (
                      <p className="mt-2 text-xs text-stone-600">
                        {secondaryNavigationPreview.summary}
                      </p>
                    ) : null}
                  </div>
                </div>
                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-500">
                  {model.secondaryNavigation.length}
                </span>
              </summary>
              <div className="mt-3 divide-y divide-[rgba(58,49,38,0.10)] rounded-2xl border border-[rgba(58,49,38,0.10)] bg-white px-3">
                {model.secondaryNavigation.map((item) => (
                  <div key={item.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          {item.summary}
                        </p>
                      </div>
                      <a
                        className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700"
                        href={item.href ?? '#readiness-summary'}
                      >
                        {item.actionLabel ?? copy.sidePanel.openRoute}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </Card>
        </div>

        {model.evidenceStatus?.items.length ? (
          <div id="live-receipt-readiness">
            <Card className="overflow-hidden">
              <details open={evidenceHubOpen || undefined}>
                <summary className="rounded-[1.5rem] bg-[#f8f3eb] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        {model.evidenceStatus.headline}
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#1f1c17]">
                        {copy.sidePanel.liveReceiptThreeLayers}
                      </p>
                      <p className="mt-2 text-xs text-[#6c665d]">
                        {model.evidenceStatus.blockerSummary?.summary ??
                          createReviewLaneLines(
                            model.evidenceStatus.items,
                            locale
                          )[0] ??
                          copy.sidePanel.noReviewLaneItems}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-stone-500">
                      {copy.sidePanel.openRoute}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-[rgba(58,49,38,0.10)] bg-white px-3 py-3 text-left">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                        {copy.sidePanel.evidenceOverview}
                      </p>
                      <p className="mt-2 text-base font-semibold text-[#1f1c17]">
                        {
                          model.evidenceStatus.items.filter(
                            (item) =>
                              item.status === 'missing-live-receipt' ||
                              item.status === 'capture-in-progress'
                          ).length
                        }
                      </p>
                      <p className="mt-1 text-xs text-[#6c665d]">
                        {createEvidenceOverviewLines(
                          model.evidenceStatus.items,
                          locale
                        )[0] ?? copy.sidePanel.captureLaneClearSummary}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[rgba(58,49,38,0.10)] bg-white px-3 py-3 text-left">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                        {copy.sidePanel.reviewLane}
                      </p>
                      <p className="mt-2 text-base font-semibold text-[#1f1c17]">
                        {
                          model.evidenceStatus.items.filter((item) =>
                            isReviewLaneItem(item)
                          ).length
                        }
                      </p>
                      <p className="mt-1 text-xs text-[#6c665d]">
                        {createReviewLaneLines(
                          model.evidenceStatus.items,
                          locale
                        )[0] ?? copy.sidePanel.noReviewLaneItems}
                      </p>
                    </div>
                  </div>
                </summary>

                <div className="mt-4 space-y-4">
                  <div id="live-receipt-evidence">
                    <Card>
                      <div className="mb-3 flex items-center gap-2">
                        <ReceiptText className="h-4 w-4" />
                        <h2 className="text-sm font-semibold">
                          {copy.sidePanel.evidenceOverview}
                        </h2>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            {copy.sidePanel.evidenceOverview}
                          </p>
                          <p className="mt-2 text-xl font-semibold text-stone-900">
                            {
                              model.evidenceStatus.items.filter(
                                (item) =>
                                  item.status === 'missing-live-receipt' ||
                                  item.status === 'capture-in-progress'
                              ).length
                            }
                          </p>
                          <p className="mt-1 text-xs text-stone-600">
                            {createEvidenceOverviewLines(
                              model.evidenceStatus.items,
                              locale
                            )[0] ?? copy.sidePanel.captureLaneClearSummary}
                          </p>
                        </div>
                        <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            {copy.sidePanel.reviewLane}
                          </p>
                          <p className="mt-2 text-xl font-semibold text-stone-900">
                            {
                              model.evidenceStatus.items.filter((item) =>
                                isReviewLaneItem(item)
                              ).length
                            }
                          </p>
                          <p className="mt-1 text-xs text-stone-600">
                            {createReviewLaneLines(
                              model.evidenceStatus.items,
                              locale
                            )[0] ?? copy.sidePanel.noReviewLaneItems}
                          </p>
                        </div>
                      </div>
                      {model.evidenceStatus.blockerSummary ? (
                        <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
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
                              href={
                                model.evidenceStatus.blockerSummary.sourceHref
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              {model.evidenceStatus.blockerSummary
                                .sourceLabel ?? copy.common.openSourcePage}
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </Card>
                  </div>

                  <div id="live-receipt-review">
                    <Card>
                      <details
                        open={
                          currentHash === '#live-receipt-review' || undefined
                        }
                      >
                        <summary className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-3">
                          <div className="flex items-center gap-2">
                            <ReceiptText className="h-4 w-4" />
                            <div>
                              <h2 className="text-sm font-semibold">
                                {copy.sidePanel.reviewLane}
                              </h2>
                              <p className="mt-1 text-xs text-stone-500">
                                {createReviewLaneLines(
                                  model.evidenceStatus.items,
                                  locale
                                )[0] ?? copy.sidePanel.noReviewLaneItems}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-stone-500">
                            {copy.sidePanel.openRoute}
                          </span>
                        </summary>
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
                                    <p className="text-sm font-medium">
                                      {item.title}
                                    </p>
                                    <p
                                      className={`text-xs ${surfaceTokens.muted}`}
                                    >
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
                                <p className="mt-2 text-xs text-stone-600">
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
                                    {item.sourceLabel ??
                                      copy.common.openSourcePage}
                                  </a>
                                ) : null}
                              </div>
                            ))}
                        </div>
                      </details>
                    </Card>
                  </div>

                  <div id="live-receipt-packets">
                    <Card>
                      <details
                        open={
                          currentHash === '#live-receipt-packets' || undefined
                        }
                      >
                        <summary className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-3">
                          <div className="flex items-center gap-2">
                            <ReceiptText className="h-4 w-4" />
                            <div>
                              <h2 className="text-sm font-semibold">
                                {copy.sidePanel.rawPacketLedger}
                              </h2>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-stone-500">
                            {copy.sidePanel.openRoute}
                          </span>
                        </summary>
                        <div className="space-y-3">
                          {model.evidenceStatus.items.map((item) => (
                            <div
                              key={item.captureId}
                              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium">
                                    {item.title}
                                  </p>
                                  <p
                                    className={`text-xs ${surfaceTokens.muted}`}
                                  >
                                    {copy.sidePanel.verifiedScopePrefix}{' '}
                                    {item.verifiedScope}
                                  </p>
                                </div>
                                <span className="text-xs text-stone-500">
                                  {formatLiveReceiptStatusLabel(
                                    item.status,
                                    locale
                                  )}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-stone-600">
                                {item.summary}
                              </p>
                              <div className="mt-2 space-y-1 text-xs text-stone-500">
                                {item.packetSummary ? (
                                  <p>
                                    {copy.sidePanel.packetPrefix}{' '}
                                    {item.packetSummary}
                                  </p>
                                ) : null}
                                {item.updatedAtLabel ? (
                                  <p>
                                    {copy.sidePanel.updatedPrefix}{' '}
                                    {item.updatedAtLabel}
                                  </p>
                                ) : null}
                                {item.operatorHint ? (
                                  <p>
                                    {copy.sidePanel.operatorNotePrefix}{' '}
                                    {item.operatorHint}
                                  </p>
                                ) : null}
                              </div>
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
                                  {item.sourceLabel ??
                                    copy.common.openSourcePage}
                                </a>
                              ) : null}
                              {(item.screenshotLabel ||
                                item.actionSnapshot ||
                                item.reviewLabel ||
                                item.reviewSummary ||
                                item.expiresAtLabel) && (
                                <div className="mt-2 space-y-1 text-xs text-stone-500">
                                  {item.screenshotLabel ? (
                                    <p>
                                      {copy.sidePanel.latestProofPrefix}{' '}
                                      {item.screenshotLabel}
                                    </p>
                                  ) : null}
                                  {item.actionSnapshot ? (
                                    <p>
                                      {copy.sidePanel.countsSummary(
                                        item.actionSnapshot
                                      )}
                                    </p>
                                  ) : null}
                                  {item.reviewLabel ? (
                                    <p>
                                      {copy.sidePanel.reviewPrefix}{' '}
                                      {item.reviewLabel}
                                    </p>
                                  ) : null}
                                  {item.reviewSummary ? (
                                    <p>
                                      {copy.sidePanel.reviewNotePrefix}{' '}
                                      {item.reviewSummary}
                                    </p>
                                  ) : null}
                                  {item.expiresAtLabel ? (
                                    <p>{item.expiresAtLabel}</p>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    </Card>
                  </div>
                </div>
              </details>
            </Card>
          </div>
        ) : null}
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
