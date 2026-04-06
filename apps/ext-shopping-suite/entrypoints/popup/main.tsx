import { createRoot } from 'react-dom/client';
import {
  createLocaleRouteHref,
  resolveShopflowLocaleFromUrl,
  uiLocaleValues,
} from '@shopflow/core';
import { getUiShellCopy, PopupLauncher } from '@shopflow/ui';
import { createSuiteAppDefinition } from '../../src/app-definition';

const currentUrl = new URL(window.location.href);
const locale = resolveShopflowLocaleFromUrl(
  currentUrl.search,
  document.documentElement.lang ?? navigator.language
);
document.documentElement.lang = locale;
const uiCopy = getUiShellCopy(locale);
const suiteCopy = uiCopy.suite;
const appDefinition = createSuiteAppDefinition(locale);
const languageOptionLabels = uiCopy.common.languageOptionLabels;
const localeOptions = uiLocaleValues.map((nextLocale) => ({
  label: languageOptionLabels[nextLocale],
  href: createLocaleRouteHref(
    `${currentUrl.pathname.split('/').pop() ?? ''}${currentUrl.search}${currentUrl.hash}`,
    nextLocale
  ),
  active: locale === nextLocale,
}));

function createSuiteSidePanelHref(hash: string) {
  const sidePanelHref = chrome.runtime.getURL(`sidepanel.html${hash}`);
  return locale === 'en'
    ? sidePanelHref
    : createLocaleRouteHref(sidePanelHref, locale);
}

createRoot(document.getElementById('root')!).render(
  <PopupLauncher
    title={appDefinition.title}
    summary={appDefinition.summary}
    locale={locale}
    actionHeading={suiteCopy.priorityRoutes}
    actionItems={appDefinition.startHere.map((item) => ({
      label: item.ctaLabel,
      summary: item.summary,
      href: createSuiteSidePanelHref(item.href),
      external: true,
    }))}
    localeOptions={localeOptions}
    primaryHref={createSuiteSidePanelHref('#current-rollout-map')}
    primaryLabel={suiteCopy.openSidePanelRolloutMap}
    primarySummary={suiteCopy.currentRolloutSummary}
    secondaryHref={createSuiteSidePanelHref('#claim-readiness-board')}
    secondaryLabel={suiteCopy.openSidePanelClaimReadiness}
    secondarySummary={suiteCopy.claimReadinessSummary}
    details={[
      `${suiteCopy.internalAlphaOnly}. ${suiteCopy.operatorPromise}`,
      suiteCopy.priorityRoutesSummary,
      suiteCopy.claimReadinessSummary,
    ]}
  />
);
