import { z } from 'zod';
import { errorCodeValues } from './error-codes';

export const capabilityIdValues = [
  'extract_product',
  'extract_search',
  'extract_deals',
  'run_action',
  'export_data',
] as const;

export const capabilityStatusValues = [
  'ready',
  'unsupported_site',
  'unsupported_page',
  'permission_needed',
  'not_implemented',
  'degraded',
  'blocked',
] as const;

export type CapabilityId = (typeof capabilityIdValues)[number];
export type CapabilityStatus = (typeof capabilityStatusValues)[number];

export const capabilityStateSchema = z.object({
  capability: z.enum(capabilityIdValues),
  status: z.enum(capabilityStatusValues),
  reasonCode: z.enum(errorCodeValues).optional(),
  reasonMessage: z.string().optional(),
});

export type CapabilityState = z.infer<typeof capabilityStateSchema>;
