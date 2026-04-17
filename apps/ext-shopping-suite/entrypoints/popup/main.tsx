import { createRoot } from 'react-dom/client';
import {
  createLocaleRouteHref,
  resolveShopflowLocaleFromUrl,
  uiLocaleValues,
} from '@shopflow/core';
import {
  createLocalizedExtensionHref,
  createLocalizedExtensionPath,
  createOpenSidePanelRouteAction,
  getUiShellCopy,
  PopupLauncher,
} from '@shopflow/ui';
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
    ? '先打开店铺入口，再看宣称门禁，然后才谈公开说法。'
    : 'Start with the store chooser, then check the claim gate before any public wording.';
const popupRouteDetails =
  locale === 'zh-CN'
    ? [
        '先用店铺入口进入正确的店铺壳层，不要把弹出窗当第二个控制台。',
        '宣称门禁会告诉你哪些说法还不能外放。',
      ]
    : [
        'Use the store chooser first so you enter the correct store shell instead of treating the popup like a second control room.',
        'The claim gate tells you which support wording still cannot move onto the public surface.',
      ];
const localeOptions = uiLocaleValues.map((nextLocale) => ({
  label: languageOptionLabels[nextLocale],
  href: createLocaleRouteHref(
    `${currentUrl.pathname.split('/').pop() ?? ''}${currentUrl.search}${currentUrl.hash}`,
    nextLocale
  ),
  active: locale === nextLocale,
}));

function createSuiteSidePanelPath(hash: string) {
  return createLocalizedExtensionPath(
    'sidepanel.html',
    locale,
    hash.replace(/^#/, '')
  );
}

const suiteActionItems = [
  ...appDefinition.startHere.slice(2).map((item) => ({
    label: item.ctaLabel,
    summary: item.summary,
    href: createLocalizedExtensionHref(
      'sidepanel.html',
      locale,
      item.href.replace(/^#/, '')
    ),
    onClick: createOpenSidePanelRouteAction(
      createSuiteSidePanelPath(item.href)
    ),
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
    primaryHref={createLocalizedExtensionHref(
      'sidepanel.html',
      locale,
      'start-here'
    )}
    primaryOnClick={createOpenSidePanelRouteAction(
      createSuiteSidePanelPath('#start-here')
    )}
    primaryLabel={suiteCopy.openSidePanelFamilyChooser}
    primarySummary={suiteCopy.currentRolloutSummary}
    secondaryHref={createLocalizedExtensionHref(
      'sidepanel.html',
      locale,
      'claim-readiness-board'
    )}
    secondaryOnClick={createOpenSidePanelRouteAction(
      createSuiteSidePanelPath('#claim-readiness-board')
    )}
    secondaryLabel={suiteCopy.openSidePanelClaimReadiness}
    secondarySummary={suiteCopy.claimReadinessSummary}
    details={[
      `${suiteCopy.internalAlphaOnly}. ${suiteCopy.operatorPromise}`,
      suiteCopy.priorityRoutesSummary,
      ...popupRouteDetails,
    ]}
  />
);
