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
const popupRouteSummary =
  locale === 'zh-CN'
    ? '先打开 family chooser 找到正确 store shell，再跳去 claim readiness 和 verified scope，最后才谈 public wording。'
    : 'Open the family chooser first, then jump to claim readiness and verified scope before you talk about public wording.';
const popupRouteDetails =
  locale === 'zh-CN'
    ? [
        '先用 family chooser 进入正确的 store shell，不要把 popup 当第二个控制台。',
        'claim readiness board 负责告诉你哪些说法还不能外放。',
        'verified scope clauses 是最后一道诚实边界，不要跳过。',
      ]
    : [
        'Use the family chooser first so you enter the correct store shell instead of treating the popup like a second control room.',
        'Claim readiness tells you which wording still cannot move onto the public surface.',
        'Verified scope clauses are the final honesty gate before any release-facing claim.',
      ];
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

const suiteActionItems = [
  ...appDefinition.startHere.slice(2).map((item) => ({
    label: item.ctaLabel,
    summary: item.summary,
    href: createSuiteSidePanelHref(item.href),
    external: true,
  })),
];

createRoot(document.getElementById('root')!).render(
  <PopupLauncher
    title={appDefinition.title}
    summary={popupRouteSummary}
    locale={locale}
    actionHeading={suiteCopy.priorityRoutes}
    actionItems={suiteActionItems}
    localeOptions={localeOptions}
    primaryHref={createSuiteSidePanelHref('#start-here')}
    primaryLabel={suiteCopy.openSidePanelFamilyChooser}
    primarySummary={suiteCopy.currentRolloutSummary}
    secondaryHref={createSuiteSidePanelHref('#claim-readiness-board')}
    secondaryLabel={suiteCopy.openSidePanelClaimReadiness}
    secondarySummary={suiteCopy.claimReadinessSummary}
    details={[
      `${suiteCopy.internalAlphaOnly}. ${suiteCopy.operatorPromise}`,
      suiteCopy.priorityRoutesSummary,
      ...popupRouteDetails,
    ]}
  />
);
