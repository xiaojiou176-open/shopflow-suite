import { z } from 'zod';

export const builderSurfaceStageValues = [
  'ready-now',
  'claim-gated',
  'needs-attention',
  'waiting-for-context',
] as const;
export type BuilderSurfaceStage = (typeof builderSurfaceStageValues)[number];

export const builderRouteOriginValues = [
  'merchant-source',
  'captured-page',
  'evidence-source',
  'sidepanel-section',
  'detected-page',
  'default-route',
] as const;

export type BuilderRouteOrigin = (typeof builderRouteOriginValues)[number];

export const operatorDecisionBriefSchema = z.object({
  surfaceId: z.literal('operator-decision-brief'),
  schemaVersion: z.literal('shopflow.operator-decision-brief.v1'),
  readOnly: z.literal(true),
  appTitle: z.string().min(1),
  stage: z.enum(builderSurfaceStageValues),
  summary: z.string().min(1),
  whyNow: z.array(z.string()).min(1),
  nextStep: z.string().min(1),
  primaryRouteLabel: z.string().min(1),
  primaryRouteHref: z.string().min(1),
  primaryRouteOrigin: z.enum(builderRouteOriginValues),
  claimBoundary: z.string().optional(),
});

export type OperatorDecisionBrief = z.infer<typeof operatorDecisionBriefSchema>;
