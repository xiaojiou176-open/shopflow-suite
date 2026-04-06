import { z } from 'zod';
import { detectionResultSchema } from '@shopflow/contracts';

export const detectionRecordSchema = z.object({
  appId: z.string().min(1),
  url: z.string().min(1),
  tabId: z.number().int().nonnegative().optional(),
  updatedAt: z.string().min(1),
  detection: detectionResultSchema,
});

export type DetectionRecord = z.infer<typeof detectionRecordSchema>;

export interface DetectionStorageAreaLike {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

export const detectionStorageKeyPrefix = 'shopflow.siteDetection';

export class DetectionRepository {
  constructor(
    private readonly storage: DetectionStorageAreaLike,
    private readonly storageKeyPrefix = detectionStorageKeyPrefix
  ) {}

  async get(appId: string): Promise<DetectionRecord | undefined> {
    const value = await this.storage.get<unknown>(this.keyFor(appId));
    return value ? detectionRecordSchema.parse(value) : undefined;
  }

  async save(record: DetectionRecord): Promise<void> {
    const parsed = detectionRecordSchema.parse(record);
    await this.storage.set(this.keyFor(parsed.appId), parsed);
  }

  keyFor(appId: string) {
    return `${this.storageKeyPrefix}.${appId}`;
  }
}
