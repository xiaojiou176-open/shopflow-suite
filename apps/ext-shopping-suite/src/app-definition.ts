import {
  getLiveReceiptBlockerSummaries,
  publicClaimBoundaries,
  storeCatalog,
  type StoreAppId,
  type StoreWave,
} from '@shopflow/contracts';
import {
  getShopflowLocaleCatalog,
  type ShopflowLocale,
} from '@shopflow/core';

export function createSuiteAppDefinition(locale: ShopflowLocale = 'en') {
  const copy = getShopflowLocaleCatalog(locale).suite;

  return {
    appId: 'ext-shopping-suite',
    title: 'Shopflow Suite',
    summary: copy.appSummary,
    mode: 'internal-alpha',
    operatorPromise: copy.operatorPromise,
    guardrails: copy.guardrails,
    startHere: [
      {
        ...copy.startHereCards[0],
        href: '#current-rollout-map',
      },
      {
        ...copy.startHereCards[2],
        href: '#verified-scope-navigator',
      },
      {
        ...copy.startHereCards[1],
        href: '#claim-readiness-board',
      },
    ],
  } as const;
}

export const appDefinition = createSuiteAppDefinition();

export const suiteEvidenceBlockers = getLiveReceiptBlockerSummaries();

const evidenceBlockedAppIds = new Set<StoreAppId>(
  suiteEvidenceBlockers.map(({ appId }) => appId)
);

function formatWaveLabel(wave: StoreWave) {
  return wave.replace('wave-', 'Wave ');
}

function deriveSuiteState(appId: StoreAppId, claimState: string) {
  if (claimState === 'repo-verified' && evidenceBlockedAppIds.has(appId)) {
    return 'repo-verified-claim-gated';
  }

  return claimState;
}

export function createSuiteCatalog(locale: ShopflowLocale = 'en') {
  const copy = getShopflowLocaleCatalog(locale).suite;

  return Object.values(storeCatalog).map((entry) => {
    const boundary = publicClaimBoundaries[entry.storeId];
    const defaultRouteLabel = copy.defaultRouteLabelsByStoreId[entry.storeId];

    return {
      appId: entry.appId,
      title: boundary.publicName,
      wave: formatWaveLabel(entry.wave),
      state: deriveSuiteState(entry.appId, boundary.claimState),
      note: copy.suiteNotesByAppId[entry.appId],
      defaultRouteUrl: `https://${entry.defaultHosts[0]}/`,
      defaultRouteLabel,
      defaultRouteSummary: copy.noFreshContextSummary(
        defaultRouteLabel,
        boundary.publicName
      ),
    };
  });
}

export const suiteCatalog = createSuiteCatalog();

export function createSuiteStatusBoard(locale: ShopflowLocale = 'en') {
  const copy = getShopflowLocaleCatalog(locale).suite;
  const localizedCatalog = createSuiteCatalog(locale);

  return [
    {
      id: 'repo-verified-clear',
      label: copy.statusBoard.repoVerifiedClear.label,
      count: localizedCatalog.filter((item) => item.state === 'repo-verified')
        .length,
      summary: copy.statusBoard.repoVerifiedClear.summary,
      href: '#current-rollout-map',
      ctaLabel: copy.statusBoard.repoVerifiedClear.ctaLabel,
    },
    {
      id: 'repo-verified-claim-gated',
      label: copy.statusBoard.repoVerifiedClaimGated.label,
      count: localizedCatalog.filter(
        (item) => item.state === 'repo-verified-claim-gated'
      ).length,
      summary: copy.statusBoard.repoVerifiedClaimGated.summary,
      href: '#evidence-gates',
      ctaLabel: copy.statusBoard.repoVerifiedClaimGated.ctaLabel,
    },
    {
      id: 'internal-alpha',
      label: copy.statusBoard.internalAlpha.label,
      count: 1,
      summary: copy.statusBoard.internalAlpha.summary,
      href: '#alpha-guardrails',
      ctaLabel: copy.statusBoard.internalAlpha.ctaLabel,
    },
  ] as const;
}

export const suiteStatusBoard = createSuiteStatusBoard();

export const suiteVerifiedScopeNavigator = Object.values(publicClaimBoundaries)
  .filter((boundary) => boundary.verifiedScopeCopy)
  .map((boundary) => ({
    appId: storeCatalog[boundary.storeId].appId,
    publicName: boundary.publicName,
    verifiedScopeCopy: boundary.verifiedScopeCopy!,
  }));
