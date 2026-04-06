import { z } from 'zod';
import { detectionResultSchema, storeIdValues } from '@shopflow/contracts';
import { SiteContextCoordinator } from '../context/site-context-coordinator';
import { ActivityRepository, type ActivityItem } from '../storage/activity-repository';
import { DetectionRepository } from '../storage/detection-repository';
import {
  LatestOutputRepository,
  latestOutputKindValues,
  latestOutputRecordSchema,
} from '../storage/latest-output-repository';

const siteDetectedPayloadSchema = z.object({
  appId: z.string().min(1),
  url: z.string().min(1),
  detection: detectionResultSchema,
});

const outputCapturedPayloadSchema = latestOutputRecordSchema.extend({
  storeId: z.enum(storeIdValues),
  kind: z.enum(latestOutputKindValues),
});

type SiteDetectedPayload = z.infer<typeof siteDetectedPayloadSchema>;
type OutputCapturedPayload = z.infer<typeof outputCapturedPayloadSchema>;

export type RuntimeMessageMap = {
  'shopflow/ping': { appId: string };
  'shopflow/site-detected': SiteDetectedPayload;
  'shopflow/output-captured': OutputCapturedPayload;
};

type RuntimeMessage =
  | {
      type: 'shopflow/ping';
      payload: RuntimeMessageMap['shopflow/ping'];
    }
  | {
      type: 'shopflow/site-detected';
      payload: SiteDetectedPayload;
    }
  | {
      type: 'shopflow/output-captured';
      payload: OutputCapturedPayload;
    };

type RuntimeMessageSender = {
  tab?: {
    id?: number;
  };
};

type RuntimeLike = {
  onMessage: {
    addListener(
      listener: (
        message: RuntimeMessage | unknown,
        sender: RuntimeMessageSender
      ) => Promise<unknown> | unknown
    ): void;
  };
  sendMessage(message: RuntimeMessage): Promise<unknown>;
};

type ChromeApi = {
  runtime?: {
    onMessage: {
      addListener(
        listener: (
          message: RuntimeMessage | unknown,
          sender: RuntimeMessageSender
        ) => Promise<unknown> | unknown
      ): void;
    };
    sendMessage(
      message: RuntimeMessage,
      callback?: (response: unknown) => void
    ): void;
    lastError?: {
      message?: string;
    };
  };
  storage?: {
    local?: {
      get(
        key: string,
        callback: (items: Record<string, unknown>) => void
      ): void;
      set(
        items: Record<string, unknown>,
        callback?: () => void
      ): void;
    };
  };
};

type MessageBusOptions = {
  runtime?: RuntimeLike;
  storage?: DetectionRepositoryStorage;
  activityStorage?: ActivityRepositoryStorage;
  outputStorage?: LatestOutputRepositoryStorage;
  coordinator?: SiteContextCoordinator;
  now?: () => string;
};

type DetectionRepositoryStorage = ConstructorParameters<
  typeof DetectionRepository
>[0];

type ActivityRepositoryStorage = ConstructorParameters<
  typeof ActivityRepository
>[0];
type LatestOutputRepositoryStorage = ConstructorParameters<
  typeof LatestOutputRepository
>[0];

class ChromeLocalStorage {
  async get<T>(key: string): Promise<T | undefined> {
    const storage = getChromeStorageArea();

    return await new Promise<T | undefined>((resolve) => {
      storage.get(key, (items) => {
        resolve(items[key] as T | undefined);
      });
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    const storage = getChromeStorageArea();

    await new Promise<void>((resolve) => {
      storage.set({ [key]: value }, () => resolve());
    });
  }
}

const siteContextCoordinator = new SiteContextCoordinator();
const detectionRepository = new DetectionRepository(new ChromeLocalStorage());
const activityRepository = new ActivityRepository(new ChromeLocalStorage());
const latestOutputRepository = new LatestOutputRepository(new ChromeLocalStorage());
const registeredRuntimes = new WeakSet<object>();

export function createPingMessage(appId: string): RuntimeMessage {
  return {
    type: 'shopflow/ping',
    payload: {
      appId,
    },
  };
}

export function createMessageBusHandler(options: MessageBusOptions = {}) {
  const coordinator = options.coordinator ?? siteContextCoordinator;
  const repository =
    options.storage != null
      ? new DetectionRepository(options.storage)
      : detectionRepository;
  const activityLog =
    options.activityStorage != null
      ? new ActivityRepository(options.activityStorage)
      : activityRepository;
  const outputLog =
    options.outputStorage != null
      ? new LatestOutputRepository(options.outputStorage)
      : latestOutputRepository;
  const now = options.now ?? (() => new Date().toISOString());

  return async (
    message: RuntimeMessage | unknown,
    sender: RuntimeMessageSender = {}
  ) => {
    const parsed = parseRuntimeMessage(message);
    if (!parsed) {
      return undefined;
    }

    if (parsed.type === 'shopflow/ping') {
      return {
        type: 'shopflow/pong' as const,
        payload: {
          appId: parsed.payload.appId,
          ok: true,
        },
      };
    }

    if (parsed.type === 'shopflow/output-captured') {
      const payload = outputCapturedPayloadSchema.parse(parsed.payload);
      await outputLog.save(payload);
      return undefined;
    }

    const payload = siteDetectedPayloadSchema.parse(parsed.payload);
    const tabId = sender.tab?.id;

    if (tabId != null) {
      coordinator.set({
        appId: payload.appId,
        tabId,
        url: payload.url,
        detection: payload.detection,
      });
    }

    await repository.save({
      appId: payload.appId,
      url: payload.url,
      tabId,
      updatedAt: now(),
      detection: payload.detection,
    });

    await activityLog.record(createRecentActivityItem(payload, now()));

    return undefined;
  };
}

export function registerMessageBus(options: MessageBusOptions = {}) {
  const runtime = options.runtime ?? getDefaultRuntime();
  if (registeredRuntimes.has(runtime as object)) {
    return true;
  }

  registeredRuntimes.add(runtime as object);
  runtime.onMessage.addListener((message, sender) =>
    createMessageBusHandler(options)(message, sender)
  );

  return true;
}

export async function reportSiteDetection(payload: SiteDetectedPayload) {
  const parsed = siteDetectedPayloadSchema.parse(payload);
  await getDefaultRuntime().sendMessage({
    type: 'shopflow/site-detected',
    payload: parsed,
  });
}

export async function reportCapturedOutput(payload: OutputCapturedPayload) {
  const parsed = outputCapturedPayloadSchema.parse(payload);
  await getDefaultRuntime().sendMessage({
    type: 'shopflow/output-captured',
    payload: parsed,
  });
}

export async function getLatestSiteContext(appId: string) {
  return siteContextCoordinator.getLatestForApp(appId) ?? null;
}

function createRecentActivityItem(
  payload: SiteDetectedPayload,
  updatedAt: string
): ActivityItem {
  const readyCount = payload.detection.capabilityStates.filter(
    (state) => state.status === 'ready'
  ).length;
  const constrainedCount = payload.detection.capabilityStates.filter((state) =>
    ['blocked', 'degraded', 'permission_needed'].includes(state.status)
  ).length;

  return {
    id: `${payload.appId}:${payload.url}`,
    appId: payload.appId,
    label: `${payload.detection.matchedHost} · ${payload.detection.pageKind}`,
    summaryKind:
      readyCount > 0
        ? 'ready'
        : constrainedCount > 0
          ? 'attention'
          : 'waiting',
    summary:
      readyCount > 0
        ? `${payload.detection.matchedHost} exposes ${readyCount} ready ${readyCount === 1 ? 'capability' : 'capabilities'} on the latest detected page.`
        : constrainedCount > 0
          ? `${payload.detection.matchedHost} still has ${constrainedCount} ${constrainedCount === 1 ? 'capability constraint' : 'capability constraints'} needing operator attention.`
          : `${payload.detection.matchedHost} has no ready capability on the latest detected page yet.`,
    matchedHost: payload.detection.matchedHost,
    pageKind: payload.detection.pageKind,
    readyCount,
    constrainedCount,
    occurredAt: updatedAt,
    timestampLabel: new Date(updatedAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    href: payload.url,
  };
}

function parseRuntimeMessage(
  message: RuntimeMessage | unknown
): RuntimeMessage | null {
  if (!message || typeof message !== 'object' || !('type' in message)) {
    return null;
  }

  if (
    (message as { type?: unknown }).type === 'shopflow/ping' &&
    'payload' in message
  ) {
    const payload = z
      .object({
        appId: z.string().min(1),
      })
      .parse((message as { payload: unknown }).payload);

    return {
      type: 'shopflow/ping',
      payload,
    };
  }

  if (
    (message as { type?: unknown }).type === 'shopflow/site-detected' &&
    'payload' in message
  ) {
    return {
      type: 'shopflow/site-detected',
      payload: siteDetectedPayloadSchema.parse(
        (message as { payload: unknown }).payload
      ),
    };
  }

  if (
    (message as { type?: unknown }).type === 'shopflow/output-captured' &&
    'payload' in message
  ) {
    return {
      type: 'shopflow/output-captured',
      payload: outputCapturedPayloadSchema.parse(
        (message as { payload: unknown }).payload
      ),
    };
  }

  return null;
}

function getDefaultRuntime(): RuntimeLike {
  const chromeApi = getChromeApi();
  const runtime = chromeApi.runtime;

  if (!runtime) {
    throw new Error(
      'chrome.runtime is unavailable; Shopflow runtime messaging requires an extension context.'
    );
  }

  return {
    onMessage: runtime.onMessage,
    async sendMessage(message) {
      return await new Promise<unknown>((resolve, reject) => {
        runtime.sendMessage(message, (response) => {
          const error = runtime.lastError;
          if (error) {
            reject(new Error(error.message ?? 'chrome.runtime.sendMessage failed.'));
            return;
          }

          resolve(response);
        });
      });
    },
  };
}

function getChromeStorageArea() {
  const storage = getChromeApi().storage?.local;

  if (!storage) {
    throw new Error(
      'chrome.storage.local is unavailable; Shopflow detection persistence requires an extension context.'
    );
  }

  return storage;
}

function getChromeApi(): ChromeApi {
  return (globalThis as { chrome?: ChromeApi }).chrome ?? {};
}
