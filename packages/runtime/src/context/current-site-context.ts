import browser from 'webextension-polyfill';
import { z } from 'zod';
import {
  detectionResultSchema,
  type DetectionResult,
  type StoreAdapter,
} from '@shopflow/contracts';

const latestSiteContextKey = 'shopflow.currentSiteContext';

const currentSiteContextSchema = z.object({
  url: z.string().url(),
  detection: detectionResultSchema,
});

export type CurrentSiteContext = z.infer<typeof currentSiteContextSchema>;

export async function saveCurrentSiteContext(
  snapshot: CurrentSiteContext
): Promise<void> {
  const parsed = currentSiteContextSchema.parse(snapshot);

  await browser.storage.local.set({
    [latestSiteContextKey]: parsed,
  });
}

export async function readCurrentSiteContext(): Promise<CurrentSiteContext | null> {
  const stored = await browser.storage.local.get(latestSiteContextKey);
  const value = stored[latestSiteContextKey];

  if (!value) {
    return null;
  }

  return currentSiteContextSchema.parse(value);
}

export async function resolveCurrentDetection(
  adapter: StoreAdapter
): Promise<DetectionResult | null> {
  const activeUrl = await readCurrentActiveTabUrl();

  if (activeUrl && adapter.matches(activeUrl)) {
    return adapter.detect(activeUrl, createEmptyDocument());
  }

  const latest = await readCurrentSiteContext();

  if (!latest || latest.detection.storeId !== adapter.storeId) {
    return null;
  }

  return latest.detection;
}

async function readCurrentActiveTabUrl(): Promise<URL | null> {
  const [tab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  if (!tab?.url || tab.url.startsWith('chrome-extension://')) {
    return null;
  }

  return new URL(tab.url);
}

function createEmptyDocument() {
  return new DOMParser().parseFromString(
    '<!doctype html><html><body></body></html>',
    'text/html'
  );
}
