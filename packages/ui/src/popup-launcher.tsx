import type { UiLocale } from '../../core/src/ui-locale';
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
  const showSourceCapturedSplit =
    Boolean(latestSourceHref) &&
    Boolean(latestOutputPreview?.href) &&
    latestSourceHref !== latestOutputPreview?.href;

  return (
    <main
      className={`min-w-[320px] ${surfaceTokens.appBackground} p-4 ${surfaceTokens.headline}`}
    >
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              {copy.brand}
            </p>
            <h1 className="mt-2 text-lg font-semibold">{title}</h1>
            <p className={`mt-2 text-sm ${surfaceTokens.body}`}>{summary}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {statusLabel ? (
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
                {statusLabel}
              </span>
            ) : null}
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

        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            {copy.popup.quickRouter}
          </p>
          <p className="mt-1 text-xs text-stone-600">
            {copy.popup.quickRouterIntro}
          </p>
          {showSourceCapturedSplit ? (
            <p className="mt-2 text-xs text-stone-500">
              {copy.popup.sourceCapturedSplitSummary}
            </p>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              {copy.popup.primaryRoute}
            </p>
            {primaryOriginLabel ? (
              <p className="mt-1 text-[11px] text-stone-500">
                {primaryOriginLabel}
              </p>
            ) : null}
            <div className="mt-2">
              {primaryHref ? (
                <a
                  className="inline-flex rounded-xl bg-stone-900 px-3 py-2 text-sm font-medium text-white"
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
            <p className="mt-2 text-xs text-stone-600">
              {resolvedPrimarySummary}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              {copy.popup.secondaryRoute}
            </p>
            {secondaryOriginLabel ? (
              <p className="mt-1 text-[11px] text-stone-500">
                {secondaryOriginLabel}
              </p>
            ) : null}
            <div className="mt-2">
              {secondaryHref ? (
                <a
                  className="inline-flex rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700"
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
            <p className="mt-2 text-xs text-stone-600">
              {resolvedSecondarySummary}
            </p>
          </div>

          {latestSourceHref ? (
            <div className="rounded-xl border border-stone-200 bg-white px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                {copy.popup.jumpBack}
              </p>
              <p className="mt-1 text-[11px] text-stone-500">
                {copy.common.routeOriginLabels.merchantSource}
              </p>
              <a
                className="mt-2 inline-flex rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700"
                href={latestSourceHref}
                target="_blank"
                rel="noreferrer"
              >
                {resolvedLatestSourceLabel}
              </a>
              <p className="mt-2 text-xs text-stone-600">
                {copy.popup.jumpBackSummary}
              </p>
            </div>
          ) : null}
        </div>

        {latestOutputPreview ? (
          <div
            id="latest-output-preview"
            className="mt-4 rounded-xl border border-stone-200 bg-white px-3 py-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              {latestOutputPreview.label}
            </p>
            <p className="mt-1 text-[11px] text-stone-500">
              {copy.common.routeOriginLabels.capturedPage}
            </p>
            <p className="mt-2 text-sm font-medium text-stone-900">
              {latestOutputPreview.title}
            </p>
            <p className="mt-2 text-xs text-stone-600">
              {latestOutputPreview.summary}
            </p>
            {latestOutputPreview.detailLines.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-stone-600">
                {latestOutputPreview.detailLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
            {latestOutputPreview.timestampLabel ? (
              <p className="mt-2 text-xs text-stone-500">
                {copy.popup.latestCapturedAt(
                  latestOutputPreview.timestampLabel
                )}
              </p>
            ) : null}
            {latestOutputPreview.href ? (
              <a
                className="mt-2 inline-flex rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700"
                href={latestOutputPreview.href}
                target="_blank"
                rel="noreferrer"
              >
                {latestOutputPreview.hrefLabel ??
                  copy.common.openLatestCapturedPage}
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            {resolvedActionHeading}
          </p>
          {actionItems.length > 0 ? (
            structuredActionItems.length > 0 ? (
              <div className="mt-2 space-y-2">
                {structuredActionItems.map((item) => (
                  <div
                    key={`${item.label}-${item.href ?? 'static'}`}
                    className="rounded-xl border border-stone-200 bg-white px-3 py-3"
                  >
                    {item.href ? (
                      <a
                        className="inline-flex rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700"
                        href={item.href}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noreferrer' : undefined}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-stone-700">
                        {item.label}
                      </p>
                    )}
                    {item.summary ? (
                      <p className="mt-2 text-xs text-stone-600">
                        {item.summary}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {labelOnlyActionItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-stone-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )
          ) : (
            <p className="mt-2 text-xs text-stone-600">
              {resolvedActionEmptySummary}
            </p>
          )}
        </div>

        {details.length > 0 ? (
          <ul className={`mt-3 space-y-2 text-xs ${surfaceTokens.muted}`}>
            {details.map((detail) => (
              <li
                key={detail}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3"
              >
                {detail}
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </main>
  );
}
