import { z } from 'zod';
import { capabilityStateSchema } from './capabilities';

export const storeIdValues = [
  'albertsons',
  'kroger',
  'amazon',
  'costco',
  'walmart',
  'weee',
  'target',
  'temu',
] as const;

export const verifiedScopeValues = [
  'safeway',
  'fred-meyer',
  'qfc',
  'amazon',
  'costco',
  'walmart',
  'weee',
  'target',
  'temu',
] as const;

export const pageKindValues = [
  'product',
  'search',
  'deal',
  'cart',
  'manage',
  'account',
  'unsupported',
  'unknown',
] as const;

export type StoreId = (typeof storeIdValues)[number];
export type VerifiedScope = (typeof verifiedScopeValues)[number];
export type PageKind = (typeof pageKindValues)[number];

export const detectionResultSchema = z.object({
  storeId: z.enum(storeIdValues),
  verifiedScopes: z.array(z.enum(verifiedScopeValues)),
  matchedHost: z.string(),
  pageKind: z.enum(pageKindValues),
  confidence: z.number().min(0).max(1),
  capabilityStates: z.array(capabilityStateSchema),
});

export type DetectionResult = z.infer<typeof detectionResultSchema>;
