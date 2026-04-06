import { z } from 'zod';
import {
  storeIdValues,
  verifiedScopeValues,
  type StoreId,
} from './detection-result';

export const claimStateValues = [
  'planned',
  'fixture-ready',
  'repo-verified',
  'public-claim-ready',
] as const;

export type ClaimState = (typeof claimStateValues)[number];

export const familyStoreIds = ['albertsons', 'kroger'] as const;
export type FamilyStoreId = (typeof familyStoreIds)[number];

export const publicClaimBoundarySchema = z.object({
  storeId: z.enum(storeIdValues),
  publicName: z.string(),
  verifiedScopes: z.array(z.enum(verifiedScopeValues)),
  claimState: z.enum(claimStateValues),
  verifiedScopeCopy: z.string().optional(),
});

export type PublicClaimBoundary = z.infer<typeof publicClaimBoundarySchema>;

export function requiresVerifiedScopeClause(storeId: StoreId): boolean {
  return familyStoreIds.includes(storeId as FamilyStoreId);
}

export function isPublicClaimReady(claimState: ClaimState): boolean {
  return claimState === 'public-claim-ready';
}
