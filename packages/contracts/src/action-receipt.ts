import { z } from 'zod';
import { errorCodeValues } from './error-codes';

export const actionKindValues = [
  'schedule_save_subscribe',
  'schedule_save_cancel',
  'capture_product',
  'capture_search_results',
  'capture_deals',
  'filter_non_local_warehouse',
] as const;

export type ActionKind = (typeof actionKindValues)[number];

export const actionInputSchema = z.discriminatedUnion('actionKind', [
  z.object({
    actionKind: z.literal('schedule_save_subscribe'),
    dryRun: z.boolean().optional(),
    limit: z.number().int().positive().optional(),
  }),
  z.object({
    actionKind: z.literal('schedule_save_cancel'),
    dryRun: z.boolean().optional(),
    limit: z.number().int().positive().optional(),
  }),
  z.object({
    actionKind: z.literal('filter_non_local_warehouse'),
    dryRun: z.boolean().optional(),
  }),
]);

export type ActionInput = z.infer<typeof actionInputSchema>;

export const actionReceiptSchema = z.object({
  actionKind: z.enum(actionKindValues),
  status: z.enum(['success', 'partial', 'failed']),
  attempted: z.number().int().nonnegative(),
  succeeded: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  errors: z.array(
    z.object({
      code: z.enum(errorCodeValues),
      message: z.string(),
      itemRef: z.string().optional(),
    })
  ),
});

export type ActionReceipt = z.infer<typeof actionReceiptSchema>;
