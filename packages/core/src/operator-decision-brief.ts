import {
  operatorDecisionBriefSchema,
  type BuilderRouteOrigin,
  type OperatorDecisionBrief,
} from '@shopflow/contracts';
import type { SidePanelHomeViewModel } from './side-panel-home-view-model';

export function createOperatorDecisionBrief(
  model: SidePanelHomeViewModel
): OperatorDecisionBrief {
  const currentSurface =
    model.workflowBrief.bullets.find(
      (item) => item.value === `${model.site.host} · ${model.site.pageKindLabel}`
    )?.value ?? `${model.site.host} · ${model.site.pageKindLabel}`;
  const runnableNow =
    model.workflowBrief.bullets.find((item) =>
      model.quickActions.some((action) => item.value.includes(action.label))
    )?.value ??
    model.readiness.summary;
  const whyNow = [
    currentSurface,
    runnableNow,
    ...(model.evidenceStatus?.blockerSummary
      ? [model.evidenceStatus.blockerSummary.summary]
      : []),
  ];

  const primaryRoute = model.quickActions[0]
    ? {
        label: model.quickActions[0].label,
        href: model.quickActions[0].href,
      }
    : model.secondaryNavigation[0]?.href
      ? {
          label:
            model.secondaryNavigation[0].actionLabel ??
            model.secondaryNavigation[0].label,
          href: model.secondaryNavigation[0].href,
        }
      : {
          label:
            model.workflowBrief.nextAction?.label ??
            model.secondaryNavigation[0]?.actionLabel ??
            model.secondaryNavigation[0]?.label,
          href: '#current-site-summary',
        };

  const stage =
    model.workflowBrief.tone === 'unsupported'
      ? 'waiting-for-context'
      : model.workflowBrief.tone;

  return operatorDecisionBriefSchema.parse({
    surfaceId: 'operator-decision-brief',
    schemaVersion: 'shopflow.operator-decision-brief.v1',
    readOnly: true,
    appTitle: model.appTitle,
    stage,
    summary: model.readiness.summary,
    whyNow,
    nextStep:
      model.readiness.operatorNextStep ??
      model.workflowBrief.nextAction?.reason ??
      model.secondaryNavigation[0]?.summary ??
      model.readiness.summary,
    primaryRouteLabel: primaryRoute.label,
    primaryRouteHref: primaryRoute.href,
    primaryRouteOrigin: derivePrimaryRouteOrigin(model, primaryRoute.href),
    claimBoundary: model.readiness.claimBoundary,
  });
}

function derivePrimaryRouteOrigin(
  model: SidePanelHomeViewModel,
  href: string
): BuilderRouteOrigin {
  if (href.startsWith('#')) {
    return 'sidepanel-section';
  }

  if (
    model.evidenceStatus?.blockerSummary?.sourceHref === href ||
    model.evidenceStatus?.items.some((item) => item.sourceHref === href)
  ) {
    return 'evidence-source';
  }

  if (model.recentActivities.some((item) => item.href === href)) {
    return 'merchant-source';
  }

  if (model.latestOutputPreview?.href === href) {
    return 'captured-page';
  }

  return 'merchant-source';
}
