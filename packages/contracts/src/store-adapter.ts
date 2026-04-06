import { z } from 'zod';
import {
  storeIdValues,
  type DetectionResult,
  type StoreId,
  type VerifiedScope,
} from './detection-result';
import type { ActionInput, ActionReceipt } from './action-receipt';

export const moneyValueSchema = z.object({
  currency: z.string(),
  amount: z.number(),
  displayText: z.string(),
});

export const normalizedProductSchema = z.object({
  sourceStoreId: z.enum(storeIdValues),
  sourceUrl: z.string().url(),
  title: z.string(),
  imageUrl: z.string().url().optional(),
  price: moneyValueSchema.optional(),
  availabilityLabel: z.string().optional(),
  sku: z.string().optional(),
});

export const searchResultItemSchema = z.object({
  sourceStoreId: z.enum(storeIdValues),
  sourceUrl: z.string().url(),
  title: z.string(),
  imageUrl: z.string().url().optional(),
  price: moneyValueSchema.optional(),
  position: z.number().int().nonnegative(),
});

export const dealItemSchema = z.object({
  sourceStoreId: z.enum(storeIdValues),
  sourceUrl: z.string().url(),
  title: z.string(),
  dealLabel: z.string(),
  price: moneyValueSchema.optional(),
});

export type MoneyValue = z.infer<typeof moneyValueSchema>;
export type NormalizedProduct = z.infer<typeof normalizedProductSchema>;
export type SearchResultItem = z.infer<typeof searchResultItemSchema>;
export type DealItem = z.infer<typeof dealItemSchema>;

export interface StoreAdapter {
  storeId: StoreId;
  verifiedScopes: VerifiedScope[];
  matches(url: URL): boolean;
  detect(url: URL, document: Document): DetectionResult;
  extractProduct?: (document: Document) => Promise<NormalizedProduct>;
  extractSearchResults?: (document: Document) => Promise<SearchResultItem[]>;
  extractDeals?: (document: Document) => Promise<DealItem[]>;
  runAction?: (
    document: Document,
    input: ActionInput
  ) => Promise<ActionReceipt>;
}
