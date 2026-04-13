import type { UiLocale } from '@shopflow/core';
import { Button, Card } from './primitives';
import { surfaceTokens } from './tokens';
import { getUiShellCopy } from './ui-copy';

type PopupActionItem =
  | string
  | {
      label: string;
      summary?: string;
      href?: string;
      external?: boolean;
    };

type LocaleOption = {
  label: string;
  href: string;
  active: boolean;
};

export function PopupLauncher({
  title,
  summary,
  claimBoundaryNote,
  details = [],
  actionHeading,
  actionItems = [],
  actionEmptySummary,
  latestOutputPreview,
  latestSourceHref,
  primaryHref,
  secondaryHref,
  statusLabel,
  primaryLabel,
  secondaryLabel,
  primaryOriginLabel,
  secondaryOriginLabel,
  primarySummary,
  secondarySummary,
  latestSourceLabel,
  localeOptions = [],
  locale = 'en',
}: {
  title: string;
  summary: string;
  claimBoundaryNote?: string;
  details?: string[];
  actionHeading?: string;
  actionItems?: PopupActionItem[];
  actionEmptySummary?: string;
  latestOutputPreview?: {
    label: string;
    title: string;
    summary: string;
    detailLines: string[];
    timestampLabel?: string;
    href?: string;
    hrefLabel?: string;
  };
  latestSourceHref?: string;
  primaryHref?: string;
  secondaryHref?: string;
  statusLabel?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryOriginLabel?: string;
  secondaryOriginLabel?: string;
  primarySummary?: string;
  secondarySummary?: string;
  latestSourceLabel?: string;
  localeOptions?: LocaleOption[];
  locale?: UiLocale;
}) {
  const copy = getUiShellCopy(locale);
  const resolvedActionHeading =
    actionHeading ?? copy.popup.defaultActionHeading;
  const resolvedActionEmptySummary =
    actionEmptySummary ?? copy.sidePanel.noRunnableCapability;
  const resolvedPrimaryLabel = primaryLabel ?? copy.popup.openSidePanel;
  const resolvedSecondaryLabel =
    secondaryLabel ?? copy.popup.viewCurrentSupportState;
  const resolvedPrimarySummary =
    primarySummary ?? copy.popup.openMainSurfaceSummary;
  const resolvedSecondarySummary =
    secondarySummary ?? copy.popup.openSecondaryRouteSummary;
  const resolvedLatestSourceLabel =
    latestSourceLabel ?? copy.popup.latestSourceLabel;
  const structuredActionItems = actionItems.filter(
    (item): item is Exclude<PopupActionItem, string> => typeof item !== 'string'
  );
  const labelOnlyActionItems = actionItems.filter(
    (item): item is string => typeof item === 'string'
  );
  const featuredActionItem = structuredActionItems[0];
  const extraStructuredActionItems = structuredActionItems.slice(1);
  const supportingDetails = details.slice(0, 4);
  const showSourceCapturedSplit =
    Boolean(latestSourceHref) &&
    Boolean(latestOutputPreview?.href) &&
    latestSourceHref !== latestOutputPreview?.href;
  const showProofHint = Boolean(latestOutputPreview) || Boolean(latestSourceHref);
  const showActionDrawer =
    Boolean(featuredActionItem) ||
    showProofHint ||
    extraStructuredActionItems.length > 0 ||
    labelOnlyActionItems.length > 0 ||
    supportingDetails.length > 0;

  return (
    <main
      className={`shopflow-surface min-w-[320px] ${surfaceTokens.appBackground} p-4 ${surfaceTokens.headline}`}
    >
      <div className="space-y-3">
        <Card className="overflow-hidden bg-[rgba(255,253,248,0.92)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#756d62]">
                {copy.brand}
              </p>
              <h1 className="mt-2 text-[1.32rem] font-semibold leading-tight">
                {title}
              </h1>
              <p className="mt-2 inline-flex rounded-full border border-[rgba(58,49,38,0.10)] bg-[#f1ebe0] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6c665d]">
                {copy.popup.quickRouter}
              </p>
              <p className={`mt-3 text-sm ${surfaceTokens.body}`}>{summary}</p>
              <p className="mt-2 text-xs text-[#756d62]">
                {copy.popup.quickRouterIntro}
              </p>
              {claimBoundaryNote ? (
                <p className="mt-2 text-xs text-[#8a6330]">
                  {claimBoundaryNote}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {statusLabel ? (
                <span className="rounded-full border border-[rgba(58,49,38,0.08)] bg-[#f1ebe0] px-3 py-1 text-[11px] text-[#6c665d]">
                  {statusLabel}
                </span>
              ) : null}
              {localeOptions.length > 0 ? (
                <div className="flex flex-col items-end gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#756d62]">
                    {copy.common.displayLanguageLabel}
                  </p>
                  <div className="inline-flex rounded-2xl border border-[rgba(58,49,38,0.10)] bg-white p-1 shadow-[0_6px_18px_rgba(58,49,38,0.05)]">
                    {localeOptions.map((option) => (
                      <a
                        key={option.href}
                        aria-current={option.active ? 'page' : undefined}
                        className={`rounded-xl px-3 py-1 text-xs font-medium ${
                          option.active
                            ? 'bg-[#1f1c17] text-white'
                            : 'text-[#514a42]'
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

          <div className="mt-4 space-y-3">
            <section
              id="popup-primary-route"
              className="rounded-[1.75rem] bg-[#1f1c17] px-4 py-4 text-white shadow-[0_14px_32px_rgba(31,28,23,0.22)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e9e2d8]">
                {copy.popup.primaryRoute}
              </p>
              {primaryOriginLabel ? (
                <p className="mt-1 text-[11px] text-[#d9cfbf]">
                  {primaryOriginLabel}
                </p>
              ) : null}
              <div className="mt-3">
                {primaryHref ? (
                  <a
                    className="inline-flex rounded-2xl bg-[#1f6b57] px-3 py-2 text-sm font-medium text-white shadow-[0_10px_24px_rgba(31,107,87,0.24)]"
                    href={primaryHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {resolvedPrimaryLabel}
                  </a>
                ) : (
                  <Button tone="primary">{resolvedPrimaryLabel}</Button>
                )}
              </div>
              <p className="mt-3 text-sm text-[#ede7de]">
                {resolvedPrimarySummary}
              </p>
            </section>

            <section
              id="popup-secondary-route"
              className="rounded-[1.5rem] border border-[rgba(58,49,38,0.10)] bg-[#fff8ef] px-4 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#756d62]">
                {copy.popup.secondaryRoute}
              </p>
              {secondaryOriginLabel ? (
                <p className="mt-1 text-[11px] text-[#756d62]">
                  {secondaryOriginLabel}
                </p>
              ) : null}
              <div className="mt-3">
                {secondaryHref ? (
                  <a
                    className="inline-flex rounded-2xl border border-[rgba(58,49,38,0.10)] bg-white px-3 py-2 text-sm font-medium text-[#514a42]"
                    href={secondaryHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {resolvedSecondaryLabel}
                  </a>
                ) : (
                  <Button tone="ghost">{resolvedSecondaryLabel}</Button>
                )}
              </div>
              <p className="mt-3 text-xs text-[#6c665d]">
                {resolvedSecondarySummary}
              </p>
            </section>

            {showProofHint ? (
              <section
                id="latest-output-preview"
                className="rounded-[1.5rem] border border-[rgba(183,121,31,0.16)] bg-[#fff8ef] px-4 py-3"
              >
                <div
                  id="popup-proof-hint"
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6330]">
                      {latestOutputPreview?.label ?? copy.popup.jumpBack}
                    </p>
                    <p className="mt-1 text-[11px] text-[#8a6330]">
                      {latestOutputPreview
                        ? copy.common.routeOriginLabels.capturedPage
                        : copy.common.routeOriginLabels.merchantSource}
                    </p>
                  </div>
                  {latestOutputPreview?.timestampLabel ? (
                    <span className="rounded-full border border-[rgba(183,121,31,0.18)] bg-white px-2.5 py-1 text-[11px] text-[#8a6330]">
                      {copy.popup.latestCapturedAt(
                        latestOutputPreview.timestampLabel
                      )}
                    </span>
                  ) : null}
                </div>

                {latestOutputPreview ? (
                  <>
                    <p className="mt-2 text-sm font-semibold text-[#1f1c17]">
                      {latestOutputPreview.title}
                    </p>
                    <p className="mt-1 text-xs text-[#6c665d]">
                      {latestOutputPreview.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {latestOutputPreview.href ? (
                        <a
                          className="inline-flex rounded-2xl border border-[rgba(58,49,38,0.10)] bg-white px-3 py-2 text-sm font-medium text-[#514a42]"
                          href={latestOutputPreview.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {latestOutputPreview.hrefLabel ??
                            copy.common.openLatestCapturedPage}
                        </a>
                      ) : null}
                      {showSourceCapturedSplit ? (
                        <a
                          className="inline-flex rounded-2xl border border-[rgba(58,49,38,0.10)] bg-white px-3 py-2 text-sm font-medium text-[#514a42]"
                          href={latestSourceHref}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {resolvedLatestSourceLabel}
                        </a>
                      ) : null}
                    </div>
                    {latestOutputPreview.detailLines[0] ? (
                      <p className="mt-2 text-xs text-[#514a42]">
                        {latestOutputPreview.detailLines[0]}
                      </p>
                    ) : null}
                  </>
                ) : latestSourceHref ? (
                  <>
                    <a
                      className="mt-3 inline-flex rounded-2xl border border-[rgba(58,49,38,0.10)] bg-white px-3 py-2 text-sm font-medium text-[#514a42]"
                      href={latestSourceHref}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {resolvedLatestSourceLabel}
                    </a>
                    <p className="mt-3 text-xs text-[#6c665d]">
                      {copy.popup.jumpBackSummary}
                    </p>
                  </>
                ) : null}

                {showSourceCapturedSplit ? (
                  <p className="mt-3 border-t border-[rgba(183,121,31,0.16)] pt-3 text-xs text-[#6c665d]">
                    {copy.popup.sourceCapturedSplitSummary}
                  </p>
                ) : null}
              </section>
            ) : null}

            {featuredActionItem ? (
              <section className="rounded-[1.5rem] border border-[rgba(58,49,38,0.10)] bg-[rgba(255,253,248,0.72)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#756d62]">
                  {resolvedActionHeading}
                </p>
                {featuredActionItem.href ? (
                  <a
                    className="mt-3 inline-flex rounded-2xl border border-[rgba(58,49,38,0.10)] bg-white px-3 py-2 text-sm font-medium text-[#514a42]"
                    href={featuredActionItem.href}
                    target={featuredActionItem.external ? '_blank' : undefined}
                    rel={featuredActionItem.external ? 'noreferrer' : undefined}
                  >
                    {featuredActionItem.label}
                  </a>
                ) : (
                  <p className="mt-3 text-sm font-medium text-[#1f1c17]">
                    {featuredActionItem.label}
                  </p>
                )}
                {featuredActionItem.summary ? (
                  <p className="mt-2 text-xs text-[#6c665d]">
                    {featuredActionItem.summary}
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        </Card>

        {showActionDrawer &&
        (extraStructuredActionItems.length > 0 ||
          labelOnlyActionItems.length > 0 ||
          supportingDetails.length > 0) ? (
          <details className="group">
            <summary className="flex items-center justify-between rounded-[1.5rem] border border-[rgba(58,49,38,0.10)] bg-[rgba(255,253,248,0.72)] px-4 py-3 text-left">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#756d62]">
                  {resolvedActionHeading}
                </p>
                {!featuredActionItem &&
                extraStructuredActionItems.length === 0 &&
                labelOnlyActionItems.length === 0 ? (
                  <p className="mt-1 text-xs text-[#6c665d]">
                    {resolvedActionEmptySummary}
                  </p>
                ) : null}
              </div>
              <span className="rounded-full border border-[rgba(58,49,38,0.10)] bg-white px-2.5 py-1 text-[11px] font-medium text-[#514a42]">
                {copy.sidePanel.openRoute}
              </span>
            </summary>
            <div className="mt-3 space-y-3">
              {extraStructuredActionItems.length > 0
                ? extraStructuredActionItems.map((item) => (
                  <div
                    key={`${item.label}-${item.href ?? 'static'}`}
                    className="rounded-[1.5rem] border border-[rgba(58,49,38,0.10)] bg-white px-4 py-4"
                  >
                    {item.href ? (
                      <a
                        className="inline-flex rounded-2xl border border-[rgba(58,49,38,0.10)] bg-[#f6f1e8] px-3 py-2 text-sm font-medium text-[#514a42]"
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noreferrer' : undefined}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-[#1f1c17]">
                        {item.label}
                      </p>
                    )}
                    {item.summary ? (
                      <p className="mt-2 text-xs text-[#6c665d]">
                        {item.summary}
                      </p>
                    ) : null}
                  </div>
                ))
                : null}

              {labelOnlyActionItems.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {labelOnlyActionItems.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[rgba(58,49,38,0.10)] bg-white px-3 py-1 text-xs font-medium text-[#514a42]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}

              {supportingDetails.length > 0 ? (
                <div className="rounded-[1.5rem] border border-[rgba(58,49,38,0.10)] bg-white px-4 py-4">
                  <div className={`space-y-2 text-xs ${surfaceTokens.muted}`}>
                    {supportingDetails.map((detail) => (
                      <p key={detail}>{detail}</p>
                    ))}
                  </div>
                  {supportingDetails.length > 0 ? (
                    <p className="mt-3 text-xs text-[#756d62]">
                      {copy.popup.ledgerNote}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </details>
        ) : null}
      </div>
    </main>
  );
}
