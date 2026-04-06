import { z } from 'zod';

export const workflowCopilotToneValues = [
  'ready-now',
  'claim-gated',
  'needs-attention',
  'unsupported',
] as const;

export const workflowCopilotBulletSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const workflowCopilotBriefSchema = z.object({
  tone: z.enum(workflowCopilotToneValues),
  title: z.string().min(1),
  summary: z.string().min(1),
  bullets: z.array(workflowCopilotBulletSchema).min(2).max(4),
  nextAction: z
    .object({
      label: z.string().min(1),
      reason: z.string().min(1),
    })
    .optional(),
});

export type WorkflowCopilotBrief = z.infer<typeof workflowCopilotBriefSchema>;
