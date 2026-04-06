import { createRoot } from 'react-dom/client';
import {
  createLocaleRouteHref,
  createProviderRuntimeConsumer,
  resolveShopflowLocaleFromUrl,
  type ProviderRuntimeConsumerSnapshot,
  uiLocaleValues,
} from '@shopflow/core';
import { getUiShellCopy } from '@shopflow/ui';
import { SuiteAlphaPage } from '../../src/suite-alpha-page';

const currentUrl = new URL(window.location.href);
const locale = resolveShopflowLocaleFromUrl(
  currentUrl.search,
  document.documentElement.lang ?? navigator.language
);
document.documentElement.lang = locale;
const languageOptionLabels = getUiShellCopy(locale).common.languageOptionLabels;
const localeOptions = uiLocaleValues.map((nextLocale) => ({
  label: languageOptionLabels[nextLocale],
  href: createLocaleRouteHref(
    `${currentUrl.pathname.split('/').pop() ?? ''}${currentUrl.search}${currentUrl.hash}`,
    nextLocale
  ),
  active: locale === nextLocale,
}));

function resolveSwitchyardConsumer(
  currentUrl: URL
): ProviderRuntimeConsumerSnapshot {
  return createProviderRuntimeConsumer({
    baseUrl: currentUrl.searchParams.get('switchyardBaseUrl')?.trim(),
  });
}

createRoot(document.getElementById('root')!).render(
  <SuiteAlphaPage
    locale={locale}
    localeOptions={localeOptions}
    runtimeConsumer={resolveSwitchyardConsumer(currentUrl)}
  />
);
