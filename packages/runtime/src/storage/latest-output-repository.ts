import { z } from 'zod';
import { storeIdValues } from '@shopflow/contracts';

export const latestOutputKindValues = ['product', 'search', 'deal'] as const;
export type LatestOutputKind = (typeof latestOutputKindValues)[number];
export const latestOutputSummaryVariantValues = [
  'product-with-price',
  'product',
  'search-top-result',
  'search',
  'deal-lead',
  'deal',
] as const;
export type LatestOutputSummaryVariant =
  (typeof latestOutputSummaryVariantValues)[number];
export const latestOutputDetailKindValues = [
  'price',
  'availability',
  'sku',
  'results-count',
  'top-match',
  'lead-deal',
] as const;
export type LatestOutputDetailKind =
  (typeof latestOutputDetailKindValues)[number];

export const latestOutputSummaryDescriptorSchema = z.object({
  variant: z.enum(latestOutputSummaryVariantValues),
  itemCount: z.number().int().nonnegative().optional(),
  priceDisplayText: z.string().min(1).optional(),
  leadTitle: z.string().min(1).optional(),
});

export type LatestOutputSummaryDescriptor = z.infer<
  typeof latestOutputSummaryDescriptorSchema
>;

export const latestOutputDetailEntrySchema = z.object({
  kind: z.enum(latestOutputDetailKindValues),
  value: z.string().min(1),
});

export type LatestOutputDetailEntry = z.infer<
  typeof latestOutputDetailEntrySchema
>;

export const latestOutputRecordSchema = z.object({
  appId: z.string().min(1),
  storeId: z.enum(storeIdValues),
  kind: z.enum(latestOutputKindValues),
  pageUrl: z.string().url(),
  capturedAt: z.string().min(1),
  headline: z.string(),
  summary: z.string(),
  previewLines: z.array(z.string()),
  summaryDescriptor: latestOutputSummaryDescriptorSchema.optional(),
  detailEntries: z.array(latestOutputDetailEntrySchema).optional(),
});

export type LatestOutputRecord = z.infer<typeof latestOutputRecordSchema>;

export interface LatestOutputStorageAreaLike {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

export const latestOutputStorageKeyPrefix = 'shopflow.latestOutput';

export class LatestOutputRepository {
  constructor(
    private readonly storage: LatestOutputStorageAreaLike,
    private readonly storageKeyPrefix = latestOutputStorageKeyPrefix
  ) {}

  async get(appId: string): Promise<LatestOutputRecord | undefined> {
    const value = await this.storage.get<unknown>(this.keyFor(appId));
    return value ? latestOutputRecordSchema.parse(value) : undefined;
  }

  async save(record: LatestOutputRecord): Promise<void> {
    const parsed = latestOutputRecordSchema.parse(record);
    await this.storage.set(this.keyFor(parsed.appId), parsed);
  }

  keyFor(appId: string) {
    return `${this.storageKeyPrefix}.${appId}`;
  }
}
