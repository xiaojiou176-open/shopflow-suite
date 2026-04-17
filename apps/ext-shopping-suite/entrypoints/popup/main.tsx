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
    ? '先打开店铺入口选择器找到正确店铺壳层，再去证据门和已验证范围，最后才谈公开说法。'
    : 'Open the family chooser first, then check the proof board and verified scope before you make public claims.';
const popupRouteDetails =
  locale === 'zh-CN'
    ? [
        '先用店铺入口选择器进入正确的店铺壳层，不要把弹出窗当第二个控制台。',
        '证据门会告诉你哪些说法还不能外放。',
        '已验证范围条款是最后一道诚实边界，不要跳过。',
      ]
    : [
      'Use the family chooser first so you enter the correct store shell instead of treating the popup like a second control room.',
      'The proof board tells you which claims still cannot move onto the public surface.',
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
    onClick: createOpenSidePanelRouteAction(createSuiteSidePanelPath(item.href)),
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
    primaryHref={createLocalizedExtensionHref('sidepanel.html', locale, 'start-here')}
    primaryOnClick={createOpenSidePanelRouteAction(createSuiteSidePanelPath('#start-here'))}
    primaryLabel={suiteCopy.openSidePanelFamilyChooser}
    primarySummary={suiteCopy.currentRolloutSummary}
    secondaryHref={createLocalizedExtensionHref(
      'sidepanel.html',
      locale,
      'claim-readiness-board'
    )}
    secondaryOnClick={createOpenSidePanelRouteAction(createSuiteSidePanelPath('#claim-readiness-board'))}
    secondaryLabel={suiteCopy.openSidePanelClaimReadiness}
    secondarySummary={suiteCopy.claimReadinessSummary}
    details={[
      `${suiteCopy.internalAlphaOnly}. ${suiteCopy.operatorPromise}`,
      suiteCopy.priorityRoutesSummary,
      ...popupRouteDetails,
    ]}
  />
);
