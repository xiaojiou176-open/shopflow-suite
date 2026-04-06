import { z } from 'zod';

export const activityStorageKey = 'shopflow.recentActivity';
export const activitySummaryKindValues = [
  'ready',
  'attention',
  'waiting',
] as const;
export type ActivitySummaryKind = (typeof activitySummaryKindValues)[number];

export const activityItemSchema = z.object({
  id: z.string(),
  appId: z.string().min(1),
  label: z.string(),
  summary: z.string().optional(),
  summaryKind: z.enum(activitySummaryKindValues).optional(),
  matchedHost: z.string().optional(),
  pageKind: z.string().optional(),
  readyCount: z.number().int().nonnegative().optional(),
  constrainedCount: z.number().int().nonnegative().optional(),
  occurredAt: z.string().optional(),
  timestampLabel: z.string(),
  href: z.string().optional(),
});

export type ActivityItem = z.infer<typeof activityItemSchema>;

export interface StorageAreaLike {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

export class ActivityRepository {
  constructor(
    private readonly storage: StorageAreaLike,
    private readonly storageKey = activityStorageKey,
    private readonly maxItems = 12
  ) {}

  async list(appId?: string): Promise<ActivityItem[]> {
    const value = (await this.storage.get<unknown>(this.storageKey)) ?? [];
    const items = z.array(activityItemSchema).parse(value);

    return appId ? items.filter((item) => item.appId === appId) : items;
  }

  async save(items: ActivityItem[]): Promise<void> {
    await this.storage.set(this.storageKey, items.slice(0, this.maxItems));
  }

  async record(item: ActivityItem): Promise<void> {
    const current = await this.list();
    await this.save([item, ...current.filter(({ id }) => id !== item.id)]);
  }

  key() {
    return this.storageKey;
  }
}
