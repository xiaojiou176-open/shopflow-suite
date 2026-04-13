import { useState } from 'react';
import {
  compareSuiteDetailPriority,
  getSuiteCockpitAction,
  getShopflowLocaleCatalog,
  type ProviderRuntimeConsumerSnapshot,
  type ShopflowLocale,
} from '@shopflow/core';
import { Card } from '../../../packages/ui/src/primitives';
import { surfaceTokens } from '../../../packages/ui/src/tokens';
import { useCurrentHash } from '../../../packages/ui/src/use-current-hash';
import {
  appDefinition,
  createSuiteAppDefinition,
  createSuiteCatalog,
  createSuiteStatusBoard,
  suiteCatalog,
  suiteEvidenceBlockers,
  suiteStatusBoard,
  suiteVerifiedScopeNavigator,
} from './app-definition';
import { useSuiteControlPlane } from './suite-control-plane';

type LocaleOption = {
  label: string;
  href: string;
  active: boolean;
};

export function SuiteAlphaPage({
  localeOptions = [],
  locale = 'en',
  runtimeConsumer,
}: {
  localeOptions?: LocaleOption[];
  locale?: ShopflowLocale;
  runtimeConsumer?: ProviderRuntimeConsumerSnapshot;
}) {
  const copy = getShopflowLocaleCatalog(locale).suite;
  const localizedAppDefinition =
    locale === 'en' ? appDefinition : createSuiteAppDefinition(locale);
  const localizedCatalog =
    locale === 'en' ? suiteCatalog : createSuiteCatalog(locale);
  const localizedStatusBoard =
    locale === 'en' ? suiteStatusBoard : createSuiteStatusBoard(locale);
  const currentHash = useCurrentHash();
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const detailMap = useSuiteControlPlane(localizedCatalog, locale);
  const priorityRoutes = derivePriorityRoutes(detailMap, locale);
  const claimGatedFocus = deriveClaimGatedFocus(detailMap, locale);
  const externalEvidenceRoutes = deriveExternalEvidenceRoutes(
    detailMap,
    locale
  );
  const featuredRoute = priorityRoutes[0] ?? null;
  const secondaryRoutes = priorityRoutes.slice(1);
  const priorityRoutesOpen = currentHash === '#priority-routes' || !featuredRoute;

  return (
    <main
      className={`shopflow-surface min-h-screen ${surfaceTokens.appBackground} px-4 py-5 ${surfaceTokens.headline}`}
    >
      <header className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              {getShopflowLocaleCatalog(locale).common.brand}
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              {localizedAppDefinition.title}
            </h1>
            <p className={`mt-1 text-sm ${surfaceTokens.body}`}>
              {localizedAppDefinition.summary}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
              {copy.internalAlphaOnly}
            </span>
            {localeOptions.length > 0 ? (
              <div className="flex flex-col items-end gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {getShopflowLocaleCatalog(locale).common.displayLanguageLabel}
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
        <p className={`mt-3 text-xs ${surfaceTokens.muted}`}>
          {localizedAppDefinition.operatorPromise}
        </p>
      </header>

      <div className="space-y-4">
        <div id="start-here">
          <Card className="overflow-hidden">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)]">
              <div className="rounded-[1.6rem] bg-stone-900 px-4 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-200">
                  {copy.startHereHeading}
                </p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-300">
                  {featuredRoute
                    ? featuredRoute.routeOriginLabel
                    : copy.priorityRoutesHeading}
                </p>
                <h2 className="mt-2 text-xl font-semibold">
                  {featuredRoute
                    ? featuredRoute.title
                    : localizedAppDefinition.startHere[0]?.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-stone-200">
                  {featuredRoute
                    ? featuredRoute.summary
                    : localizedAppDefinition.startHere[0]?.summary}
                </p>
                <p className="mt-3 max-w-2xl text-xs text-stone-300">
                  {featuredRoute
                    ? featuredRoute.nextStep
                    : localizedAppDefinition.operatorPromise}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {featuredRoute ? (
                    <>
                      <a
                        className="inline-flex rounded-xl bg-white px-3 py-2 text-xs font-medium text-stone-900"
                        href={featuredRoute.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {featuredRoute.label}
                      </a>
                      <a
                        className="inline-flex rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-white"
                        href={`#rollout-${featuredRoute.appId}`}
                      >
                        {copy.openRolloutRow(featuredRoute.title)}
                      </a>
                    </>
                  ) : (
                    <a
                      className="inline-flex rounded-xl bg-white px-3 py-2 text-xs font-medium text-stone-900"
                      href={localizedAppDefinition.startHere[0]?.href}
                    >
                      {localizedAppDefinition.startHere[0]?.ctaLabel}
                    </a>
                  )}
                  <a
                    className="inline-flex rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-white"
                    href="#verified-scope-navigator"
                  >
                    {copy.verifiedScopeHeading}
                  </a>
                </div>
                {secondaryRoutes.length > 0 ? (
                  <div className="mt-4 space-y-2 rounded-[1.35rem] border border-white/15 bg-white/8 px-3 py-3">
                    {secondaryRoutes.map((item, index) => (
                      <div
                        key={item.appId}
                        className={`px-1 py-3 ${
                          index > 0 ? 'border-t border-white/10' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-300">
                              {item.kicker}
                            </p>
                            <p className="mt-1 text-sm font-medium text-white">
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs text-stone-300">
                              {item.summary}
                            </p>
                          </div>
                          <a
                            className="inline-flex shrink-0 rounded-full bg-white px-3 py-2 text-xs font-medium text-stone-900"
                            aria-label={copy.priorityRouteAria(
                              item.title,
                              item.label
                            )}
                            href={item.href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.label}
                          </a>
                        </div>
                        <a
                          className="mt-3 inline-flex rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-white"
                          href={`#rollout-${item.appId}`}
                        >
                          {copy.openRolloutRow(item.title)}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-700">
                      {copy.internalAlphaOnly}
                    </span>
                    <a
                      className="inline-flex rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-700"
                      href="#alpha-guardrails"
                    >
                      {copy.alphaGuardrailsHeading}
                    </a>
                  </div>
                  <p className="mt-3 text-sm text-stone-700">
                    {localizedAppDefinition.operatorPromise}
                  </p>
                  {claimGatedFocus ? (
                    <div className="mt-4 rounded-[1.35rem] border border-amber-200 bg-amber-50 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                        {copy.claimReadinessHeading}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-stone-900">
                        {claimGatedFocus.title}
                      </p>
                      <p className="mt-1 text-xs text-stone-700">
                        {claimGatedFocus.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          className="inline-flex rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                          href={claimGatedFocus.routeHref}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {claimGatedFocus.routeLabel}
                        </a>
                        <a
                          className="inline-flex rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                          href="#evidence-gates"
                        >
                          {copy.evidenceGatesHeading}
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="rounded-[1.5rem] border border-stone-200 bg-white px-4 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      {copy.alphaGuardrailsHeading}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-900">
                      {claimGatedFocus?.title ??
                        localizedAppDefinition.startHere[0]?.title}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">
                      {claimGatedFocus?.summary ??
                        localizedAppDefinition.operatorPromise}
                    </p>
                  </div>
                  <div className="mt-4 space-y-2">
                    {localizedAppDefinition.startHere.map((item, index) => (
                      <div
                        key={item.title}
                        className={`rounded-[1.25rem] border border-stone-200 bg-stone-50 px-3 py-3 ${
                          index === 0 ? 'shadow-[0_10px_24px_rgba(58,49,38,0.06)]' : ''
                        }`}
                      >
                        <p className="text-sm font-medium text-stone-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          {item.summary}
                        </p>
                        <a
                          className="mt-3 inline-flex rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                          href={item.href}
                        >
                          {item.ctaLabel}
                        </a>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {localizedStatusBoard.map((item) => (
                      <a
                        key={item.id}
                        className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] font-medium text-stone-700"
                        href={item.href}
                      >
                        <span className="mr-2 font-semibold text-stone-900">
                          {item.count}
                        </span>
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div id="priority-routes">
          <Card>
            <details open={priorityRoutesOpen || undefined}>
              <summary className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-3">
                <div>
                  <h2 className="text-sm font-semibold">
                    {copy.priorityRoutesHeading}
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {copy.priorityRoutesSummary}
                  </p>
                  {featuredRoute ? (
                    <p className="mt-2 text-xs text-stone-600">
                      {featuredRoute.title} · {featuredRoute.routeOriginLabel}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-500">
                  {priorityRoutes.length}
                </span>
              </summary>
              <div className="mt-3 space-y-3">
                {priorityRoutes.map((item, index) => (
                  <div
                    key={item.appId}
                    className={`rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 ${
                      index === 0 ? 'bg-white shadow-[0_10px_24px_rgba(58,49,38,0.06)]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          {item.kicker}
                        </p>
                        <p className="mt-1 text-[11px] text-stone-500">
                          {item.routeOriginLabel}
                        </p>
                        <p className="mt-2 text-sm font-medium">{item.title}</p>
                        <p className="mt-1 text-xs text-stone-600">
                          {item.summary}
                        </p>
                        <p className="mt-2 text-xs text-stone-500">
                          {item.nextStep}
                        </p>
                      </div>
                      <a
                        className={`inline-flex shrink-0 rounded-xl px-3 py-2 text-xs font-medium ${
                          index === 0
                            ? 'bg-stone-900 text-white'
                            : 'border border-stone-200 bg-white text-stone-700'
                        }`}
                        aria-label={copy.priorityRouteAria(
                          item.title,
                          item.label
                        )}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.label}
                      </a>
                    </div>
                    <a
                      className={`mt-3 inline-flex rounded-xl px-3 py-2 text-xs font-medium ${
                        index === 0
                          ? 'border border-stone-200 bg-stone-50 text-stone-700'
                          : 'border border-stone-200 bg-white text-stone-700'
                      }`}
                      href={`#rollout-${item.appId}`}
                    >
                      {copy.openRolloutRow(item.title)}
                    </a>
                  </div>
                ))}
              </div>
            </details>
          </Card>
        </div>

        <div id="claim-readiness-board">
          <Card>
            <details
              open={currentHash === '#claim-readiness-board' || undefined}
            >
              <summary className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-3">
                <div>
                  <h2 className="text-sm font-semibold">
                    {copy.claimReadinessHeading}
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {copy.claimReadinessSummary}
                  </p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {localizedStatusBoard.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-medium text-stone-700"
                    >
                      <span className="mr-2 font-semibold text-stone-900">
                        {item.count}
                      </span>
                      {item.label}
                    </span>
                  ))}
                </div>
              </summary>
              <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                {localizedStatusBoard.map((item) => (
                  <div
                    key={item.id}
                    className="min-w-[190px] rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{item.count}</p>
                    <p className="mt-2 text-xs text-stone-600">{item.summary}</p>
                    <a
                      className="mt-3 inline-flex rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                      href={item.href}
                    >
                      {item.ctaLabel}
                    </a>
                    {item.id === 'repo-verified-claim-gated' &&
                    claimGatedFocus ? (
                      <div className="mt-3 rounded-xl border border-stone-200 bg-white px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          {copy.operatorNextStepHeading}
                        </p>
                        <p className="mt-2 text-sm font-semibold">
                          {claimGatedFocus.title}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          {claimGatedFocus.summary}
                        </p>
                        <p className="mt-2 text-xs text-stone-500">
                          {claimGatedFocus.nextStep}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <a
                            className="inline-flex rounded-xl border border-stone-200 bg-stone-900 px-3 py-2 text-xs font-medium text-white"
                            href={claimGatedFocus.routeHref}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {claimGatedFocus.routeLabel}
                          </a>
                          <a
                            className="inline-flex rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                            href={claimGatedFocus.verifiedScopeHref}
                          >
                            {copy.openVerifiedScopeClause(
                              claimGatedFocus.title
                            )}
                          </a>
                          <a
                            className="inline-flex rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                            href={claimGatedFocus.rolloutHref}
                          >
                            {copy.openRolloutRow(claimGatedFocus.title)}
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </details>
          </Card>
        </div>

        <div id="current-rollout-map">
          <Card>
            <details
              open={
                currentHash === '#current-rollout-map' ||
                currentHash.startsWith('#rollout-') ||
                undefined
              }
            >
              <summary className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-3">
                <div>
                  <h2 className="text-sm font-semibold">
                    {copy.currentRolloutHeading}
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {copy.currentRolloutSummary}
                  </p>
                </div>
                <span className="text-xs font-medium text-stone-500">
                  {getShopflowLocaleCatalog(locale).sidePanel.openRoute}
                </span>
              </summary>
              <div className="mt-3 space-y-3">
                {localizedCatalog.map((item) => (
                  <div
                    key={item.appId}
                    id={`rollout-${item.appId}`}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className={`text-xs ${surfaceTokens.muted}`}>
                          {item.wave} · {item.state}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        {detailMap[item.appId]?.routeHref ? (
                          <a
                            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700"
                            aria-label={`Rollout route for ${item.title}: ${detailMap[item.appId]?.routeLabel}`}
                            href={detailMap[item.appId]?.routeHref}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {detailMap[item.appId]?.routeLabel}
                          </a>
                        ) : null}
                        <button
                          type="button"
                          aria-expanded={expandedAppId === item.appId}
                          aria-label={copy.inspectStatusLabel(item.title)}
                          className="rounded-xl border border-stone-200 bg-transparent px-3 py-2 text-sm font-medium text-stone-700"
                          onClick={() =>
                            setExpandedAppId((current) =>
                              current === item.appId ? null : item.appId
                            )
                          }
                        >
                          {expandedAppId === item.appId
                            ? copy.hideStatusActionLabel
                            : copy.inspectStatusActionLabel}
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-stone-600">{item.note}</p>
                    {expandedAppId === item.appId ? (
                      <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-stone-600">
                      <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
                        <p className="font-semibold text-stone-700">
                          {copy.latestDetectionHeading}
                        </p>
                        <p className="mt-1">
                          {detailMap[item.appId]?.latestDetection ??
                            getShopflowLocaleCatalog(locale).common
                              .loadingDetection}
                        </p>
                      </div>
                      <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
                        <p className="font-semibold text-stone-700">
                          {copy.frontDoorHeading}
                        </p>
                        <p className="mt-1">
                          {detailMap[item.appId]?.routeHref
                            ? detailMap[item.appId]?.routeSummary
                            : getShopflowLocaleCatalog(locale).common
                                .loadingRoute}
                        </p>
                        {detailMap[item.appId]?.routeHref ? (
                          <a
                            className="mt-2 inline-flex rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700"
                            aria-label={copy.frontDoorAria(
                              item.title,
                              detailMap[item.appId]?.routeLabel ?? item.defaultRouteLabel
                            )}
                            href={detailMap[item.appId]?.routeHref}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {detailMap[item.appId]?.routeLabel}
                          </a>
                        ) : null}
                      </div>
                      <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
                        <p className="font-semibold text-stone-700">
                          {copy.operatorNextStepHeading}
                        </p>
                        <p className="mt-1">
                          {detailMap[item.appId]?.nextStep ??
                            getShopflowLocaleCatalog(locale).common
                              .loadingNextStep}
                        </p>
                        <a
                          className="mt-2 inline-flex rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700"
                          aria-label={copy.operatorNextStepAria(
                            item.title,
                            detailMap[item.appId]?.routeLabel ?? item.defaultRouteLabel
                          )}
                          href={
                            detailMap[item.appId]?.routeHref ??
                            item.defaultRouteUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          {detailMap[item.appId]?.routeLabel ??
                            item.defaultRouteLabel}
                        </a>
                      </div>
                      <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
                        <p className="font-semibold text-stone-700">
                          {copy.latestRecentActivityHeading}
                        </p>
                        <p className="mt-1">
                          {detailMap[item.appId]?.latestActivity ??
                            getShopflowLocaleCatalog(locale).common
                              .loadingActivity}
                        </p>
                        {detailMap[item.appId]?.latestActivityHref ? (
                          <a
                            className="mt-2 inline-flex rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700"
                            href={detailMap[item.appId]?.latestActivityHref}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {
                              getShopflowLocaleCatalog(locale).common
                                .jumpToSourcePage
                            }
                          </a>
                        ) : null}
                      </div>
                      <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
                        <p className="font-semibold text-stone-700">
                          {copy.latestCapturedOutputHeading}
                        </p>
                        <p className="mt-1">
                          {detailMap[item.appId]?.latestOutput ??
                            getShopflowLocaleCatalog(locale).common
                              .loadingOutput}
                        </p>
                        {detailMap[item.appId]?.latestOutputHref ? (
                          <a
                            className="mt-2 inline-flex rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-700"
                            href={detailMap[item.appId]?.latestOutputHref}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {
                              getShopflowLocaleCatalog(locale).common
                                .openLatestCapturedPage
                            }
                          </a>
                        ) : null}
                      </div>
                      <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
                        <p className="font-semibold text-stone-700">
                          {copy.evidenceQueueHeading}
                        </p>
                        <p className="mt-1">
                          {detailMap[item.appId]?.evidenceQueue ??
                            getShopflowLocaleCatalog(locale).common
                              .loadingQueue}
                        </p>
                        {detailMap[item.appId]?.evidenceSections?.length ? (
                          <div className="mt-3 space-y-2">
                            {detailMap[item.appId]!.evidenceSections.map(
                              (section) => (
                                <div key={section.title}>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                                    {section.title} ({section.count})
                                  </p>
                                  <div className="mt-2 space-y-2">
                                    {section.items.map((entry) => (
                                      <div
                                        key={entry.title}
                                        className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
                                      >
                                        <p className="text-xs font-semibold text-stone-700">
                                          {entry.title}
                                        </p>
                                        <p className="mt-1 text-xs text-stone-500">
                                          {entry.statusLabel}
                                        </p>
                                        <p className="mt-2 text-xs text-stone-600">
                                          {entry.note}
                                        </p>
                                        <a
                                          className="mt-2 inline-flex rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                                          href={entry.href}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          {entry.actionLabel}
                                        </a>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : null}
                      </div>
                      <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
                        <p className="font-semibold text-stone-700">
                          {copy.priorityPacketHeading}
                        </p>
                        {detailMap[item.appId]?.priorityQueueItem ? (
                          <>
                            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                              {
                                detailMap[item.appId]?.priorityQueueItem
                                  ?.operatorPathLabel
                              }
                            </p>
                            <p className="mt-2 text-xs font-semibold text-stone-700">
                              {detailMap[item.appId]?.priorityQueueItem?.title}
                            </p>
                            <p className="mt-1 text-xs text-stone-500">
                              {
                                detailMap[item.appId]?.priorityQueueItem
                                  ?.statusLabel
                              }
                            </p>
                            <p className="mt-2 text-xs text-stone-600">
                              {detailMap[item.appId]?.priorityQueueItem?.note}
                            </p>
                            <a
                              className="mt-2 inline-flex rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                              aria-label={copy.priorityPacketActionAria(
                                item.title,
                                detailMap[item.appId]?.priorityQueueItem?.actionLabel ??
                                  item.defaultRouteLabel
                              )}
                              href={
                                detailMap[item.appId]?.priorityQueueItem?.href
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              {
                                detailMap[item.appId]?.priorityQueueItem
                                  ?.actionLabel
                              }
                            </a>
                          </>
                        ) : (
                          <p className="mt-1">{copy.noOutstandingPacket}</p>
                        )}
                      </div>
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-3">
                        <p className="font-semibold text-stone-700">
                          {copy.decisionBriefHeading}
                        </p>
                        <p className="mt-1 text-xs text-stone-700">
                          {
                            detailMap[item.appId]?.operatorDecisionBrief
                              ?.summary
                          }
                        </p>
                        <div className="mt-3 space-y-2 text-xs text-stone-700">
                          {detailMap[
                            item.appId
                          ]?.operatorDecisionBrief?.whyNow.map((line) => (
                            <div
                              key={`${item.appId}-${line}`}
                              className="rounded-xl border border-indigo-200 bg-white px-3 py-3"
                            >
                              {line}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 rounded-xl border border-indigo-200 bg-white px-3 py-3 text-xs text-stone-700">
                          <p className="font-semibold text-stone-800">
                            {
                              detailMap[item.appId]?.operatorDecisionBrief
                                ?.primaryRouteLabel
                            }
                          </p>
                          <p className="mt-1">
                            {
                              detailMap[item.appId]?.operatorDecisionBrief
                                ?.nextStep
                            }
                          </p>
                          <a
                            className="mt-2 inline-flex rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-stone-700"
                            aria-label={copy.decisionBriefRouteAria(
                              item.title,
                              detailMap[item.appId]?.operatorDecisionBrief
                                ?.primaryRouteLabel ?? item.defaultRouteLabel
                            )}
                            href={
                              detailMap[item.appId]?.operatorDecisionBrief
                                ?.primaryRouteHref
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            {
                              detailMap[item.appId]?.operatorDecisionBrief
                                ?.primaryRouteLabel
                            }
                          </a>
                        </div>
                      </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </details>
          </Card>
        </div>

        <div id="evidence-gates">
          <Card>
            <details open={currentHash === '#evidence-gates' || undefined}>
              <summary className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-3">
                <div>
                  <h2 className="text-sm font-semibold">
                    {copy.evidenceGatesHeading}
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {copy.evidenceGatesSummary}
                  </p>
                </div>
                <span className="text-xs font-medium text-stone-500">
                  {getShopflowLocaleCatalog(locale).sidePanel.openRoute}
                </span>
              </summary>
              <div className="mt-3 space-y-3">
                {suiteEvidenceBlockers.map((item) => {
                  const route = externalEvidenceRoutes[item.appId];

                  return (
                    <div
                      key={item.appId}
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
                    >
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-stone-600">{item.note}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          className="inline-flex rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                          href={`#verified-scope-${item.appId}`}
                        >
                          {copy.openVerifiedScopeClause(route.publicName)}
                        </a>
                        <a
                          className="inline-flex rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                          href={`#rollout-${item.appId}`}
                        >
                          {copy.openRolloutRow(route.publicName)}
                        </a>
                        {route.href ? (
                          <a
                            className="inline-flex rounded-xl border border-stone-200 bg-stone-900 px-3 py-2 text-xs font-medium text-white"
                            href={route.href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {route.label}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          </Card>
        </div>

        <div id="verified-scope-navigator">
          <Card>
            <details
              open={
                currentHash === '#verified-scope-navigator' ||
                currentHash.startsWith('#verified-scope-') ||
                undefined
              }
            >
              <summary className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-3">
                <div>
                  <h2 className="text-sm font-semibold">
                    {copy.verifiedScopeHeading}
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {copy.verifiedScopeSummary}
                  </p>
                </div>
                <span className="text-xs font-medium text-stone-500">
                  {getShopflowLocaleCatalog(locale).sidePanel.openRoute}
                </span>
              </summary>
              <div className="mt-3 space-y-3">
                {suiteVerifiedScopeNavigator.map((item) => (
                  <div
                    key={item.publicName}
                    id={`verified-scope-${item.appId}`}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
                  >
                    <p className="text-sm font-medium">{item.publicName}</p>
                    <p className="mt-1 text-xs text-stone-600">
                      {item.verifiedScopeCopy}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        className="inline-flex rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                        href={`#rollout-${item.appId}`}
                      >
                        {copy.openRolloutRow(item.publicName)}
                      </a>
                      {detailMap[item.appId]?.routeHref ? (
                        <a
                          className="inline-flex rounded-xl border border-stone-200 bg-stone-900 px-3 py-2 text-xs font-medium text-white"
                          href={detailMap[item.appId]!.routeHref}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {detailMap[item.appId]!.routeLabel}
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </Card>
        </div>

        <div id="provider-runtime-seam">
          <Card>
            <details open={currentHash === '#provider-runtime-seam' || undefined}>
              <summary className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-3">
                <div>
                  <h2 className="text-sm font-semibold">
                    {copy.providerRuntimeSeamHeading}
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {copy.providerRuntimeSeamSummary}
                  </p>
                </div>
                <span className="text-xs font-medium text-stone-500">
                  {getShopflowLocaleCatalog(locale).sidePanel.openRoute}
                </span>
              </summary>
              {runtimeConsumer?.enabled ? (
                <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    {copy.providerRuntimeSeamBaseUrlHeading}
                  </p>
                  <p className="mt-2 text-sm font-medium text-stone-900">
                    {runtimeConsumer.baseUrl}
                  </p>
                  <p className="mt-2 text-xs text-stone-600">
                    {copy.providerRuntimeSeamRouteSummary(
                      runtimeConsumer.baseUrl!
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
                    {copy.providerRuntimeSeamBoundaryHeading}
                  </p>
                  <p className="mt-2 text-xs text-indigo-900">
                    {copy.providerRuntimeSeamBoundaryNote}
                  </p>
                  <p className="mt-2 text-xs text-indigo-800">
                    {copy.providerRuntimeSeamAcquisitionModes(
                      runtimeConsumer.acquisitionModes.join(', ')
                    )}
                  </p>
                </div>
                <div className="space-y-3">
                  {runtimeConsumer.routes.map((route) => {
                    const providerLabel = formatSwitchyardProviderLabel(
                      route.providerId
                    );

                    return (
                      <div
                        key={route.providerId}
                        className="rounded-xl border border-stone-200 bg-white px-3 py-3"
                      >
                        <p className="text-sm font-medium text-stone-900">
                          {providerLabel}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          {copy.providerRuntimeSeamProviderSummary(
                            providerLabel
                          )}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <a
                            className="inline-flex rounded-xl border border-stone-200 bg-stone-900 px-3 py-2 text-xs font-medium text-white"
                            href={route.startAcquisitionUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {copy.providerRuntimeSeamStartLabel(
                              providerLabel
                            )}
                          </a>
                          <a
                            className="inline-flex rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                            href={route.captureAcquisitionUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {copy.providerRuntimeSeamCaptureLabel(
                              providerLabel
                            )}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
                  <p className="text-sm font-medium text-stone-900">
                    {copy.providerRuntimeSeamNotConfigured}
                  </p>
                  <p className="mt-2 text-xs text-stone-600">
                    {copy.providerRuntimeSeamConfigureHint}
                  </p>
                  <code className="mt-3 block rounded-xl border border-stone-200 bg-white px-3 py-3 text-[11px] text-stone-700">
                    sidepanel.html?switchyardBaseUrl=http://127.0.0.1:4317#provider-runtime-seam
                  </code>
                </div>
              )}
            </details>
          </Card>
        </div>

        <div id="alpha-guardrails">
          <Card>
            <details open={currentHash === '#alpha-guardrails' || undefined}>
              <summary className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-3">
                <div>
                  <h2 className="text-sm font-semibold">
                    {copy.alphaGuardrailsHeading}
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {localizedAppDefinition.operatorPromise}
                  </p>
                </div>
                <span className="text-xs font-medium text-stone-500">
                  {getShopflowLocaleCatalog(locale).sidePanel.openRoute}
                </span>
              </summary>
              <ul className="mt-3 space-y-2 text-sm text-stone-700">
                {localizedAppDefinition.guardrails.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </details>
          </Card>
        </div>
      </div>
    </main>
  );
}

function derivePriorityRoutes(
  detailMap: ReturnType<typeof useSuiteControlPlane>,
  locale: ShopflowLocale = 'en'
) {
  const copy = getShopflowLocaleCatalog(locale).suite;
  const localizedCatalog =
    locale === 'en' ? suiteCatalog : createSuiteCatalog(locale);

  return localizedCatalog
    .map((item) => {
      const detail = detailMap[item.appId];
      if (!detail) {
        return null;
      }

      return {
        detail,
        appId: item.appId,
        title: item.title,
        href: detail.routeHref,
        label: detail.routeLabel,
        summary: detail.routeSummary,
        nextStep: detail.nextStep,
        kicker: copy.priorityLabels[detail.attentionState],
        routeOriginLabel: getRouteOriginLabel(detail.routeOrigin, locale),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => compareSuiteDetailPriority(left.detail, right.detail))
    .slice(0, 2);
}

function getRouteOriginLabel(
  routeOrigin: 'merchant-source' | 'captured-page' | 'detected-page' | 'default-route',
  locale: ShopflowLocale = 'en'
) {
  const labels = getShopflowLocaleCatalog(locale).common.routeOriginLabels;

  switch (routeOrigin) {
    case 'merchant-source':
      return labels.merchantSource;
    case 'captured-page':
      return labels.capturedPage;
    case 'detected-page':
      return labels.detectedPage;
    case 'default-route':
      return labels.defaultRoute;
  }
}

function formatSwitchyardProviderLabel(providerId: string) {
  switch (providerId) {
    case 'chatgpt':
      return 'ChatGPT';
    case 'gemini':
      return 'Gemini';
    case 'claude':
      return 'Claude';
    case 'grok':
      return 'Grok';
    case 'qwen':
      return 'Qwen';
    default:
      return providerId;
  }
}

function getSuiteCatalogMaps(locale: ShopflowLocale = 'en') {
  const localizedCatalog =
    locale === 'en' ? suiteCatalog : createSuiteCatalog(locale);

  return {
    publicNameByAppId: Object.fromEntries(
      localizedCatalog.map((item) => [item.appId, item.title])
    ) as Record<string, string>,
    defaultRouteLabelByAppId: Object.fromEntries(
      localizedCatalog.map((item) => [item.appId, item.defaultRouteLabel])
    ) as Record<string, string>,
  };
}

function deriveExternalEvidenceRoutes(
  detailMap: ReturnType<typeof useSuiteControlPlane>,
  locale: ShopflowLocale = 'en'
) {
  const copy = getShopflowLocaleCatalog(locale).suite;
  const suiteCatalogMaps = getSuiteCatalogMaps(locale);
  return Object.fromEntries(
    suiteEvidenceBlockers.map((item) => {
      const detail = detailMap[item.appId];
      const nextRoute = detail?.priorityQueueItem
        ? {
            href: detail.priorityQueueItem.href,
            label: detail.priorityQueueItem.actionLabel,
            summary: `${detail.priorityQueueItem.note} ${detail.nextStep}`,
          }
        : detail?.routeHref
          ? {
              href: detail.routeHref,
              label: detail.routeLabel,
              summary: `${detail.routeSummary} ${detail.nextStep}`,
            }
          : {
              href: undefined,
              label: undefined,
              summary: copy.fallbackEvidenceRouteSummary(
                suiteCatalogMaps.defaultRouteLabelByAppId[item.appId] ??
                  copy.defaultRouteLabelsByStoreId.amazon,
                item.title
              ),
            };

      return [
        item.appId,
        {
          publicName:
            suiteCatalogMaps.publicNameByAppId[item.appId] ?? item.title,
          href: nextRoute.href,
          label: nextRoute.label,
          summary: nextRoute.summary,
        },
      ] as const;
    })
  ) as Record<
    string,
    {
      publicName: string;
      href?: string;
      label?: string;
      summary: string;
    }
  >;
}

function deriveClaimGatedFocus(
  detailMap: ReturnType<typeof useSuiteControlPlane>,
  locale: ShopflowLocale = 'en'
) {
  const localizedCatalog =
    locale === 'en' ? suiteCatalog : createSuiteCatalog(locale);
  const focus = localizedCatalog
    .map((item) => {
      const detail = detailMap[item.appId];
      if (!detail || detail.decisionStage !== 'claim-gated') {
        return null;
      }

      const action = getSuiteCockpitAction(detail);

      return {
        detail,
        title: item.title,
        summary: detail.operatorDecisionBrief.summary,
        nextStep: action.nextStep,
        routeLabel: action.label,
        routeHref: action.href,
        verifiedScopeHref: `#verified-scope-${item.appId}`,
        rolloutHref: `#rollout-${item.appId}`,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((left, right) => compareSuiteDetailPriority(left.detail, right.detail))[0];

  if (!focus) {
    return null;
  }

  return {
    title: focus.title,
    summary: focus.summary,
    nextStep: focus.nextStep,
    routeLabel: focus.routeLabel,
    routeHref: focus.routeHref,
    verifiedScopeHref: focus.verifiedScopeHref,
    rolloutHref: focus.rolloutHref,
  };
}
