import {
  formatLiveReceiptStatusLabel,
} from '@shopflow/contracts';
import {
  ActivityRepository,
  activityStorageKey,
  DetectionRepository,
  detectionStorageKeyPrefix,
  EvidenceCaptureRepository,
  evidenceCaptureStorageKeyPrefix,
  LatestOutputRepository,
  latestOutputStorageKeyPrefix,
  type EvidenceCaptureRecord,
} from '@shopflow/runtime';
import type { ShopflowLocale } from '@shopflow/core';
import { useEffect, useState } from 'react';
import {
  createSuiteDetailModel,
  type SuiteCatalogItem,
  type SuiteDetailModel,
} from './suite-control-plane-model';

class BrowserLocalStorage {
  async get<T>(key: string): Promise<T | undefined> {
    return await new Promise<T | undefined>((resolve) => {
      chrome.storage.local.get(key, (items) => {
        resolve(items[key] as T | undefined);
      });
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve());
    });
  }
}

const detectionRepository = new DetectionRepository(new BrowserLocalStorage());
const activityRepository = new ActivityRepository(new BrowserLocalStorage());
const evidenceRepository = new EvidenceCaptureRepository(new BrowserLocalStorage());
const latestOutputRepository = new LatestOutputRepository(new BrowserLocalStorage());

async function loadSuiteDetails(
  items: readonly SuiteCatalogItem[],
  locale: ShopflowLocale
): Promise<Record<string, SuiteDetailModel>> {
  const detailEntries = await Promise.all(
    items.map(async (item) => {
      const [detection, recentActivities, latestOutput, evidenceRecords] =
        await Promise.all([
        detectionRepository.get(item.appId),
        activityRepository.list(item.appId),
        latestOutputRepository.get(item.appId),
        evidenceRepository.list(item.appId),
      ]);

      return [
        item.appId,
        createSuiteDetailModel(item, {
          detection,
          recentActivities,
          latestOutput,
          evidenceRecords,
        }, locale),
      ] as const;
    })
  );

  return Object.fromEntries(detailEntries);
}

export function useSuiteControlPlane(
  items: readonly SuiteCatalogItem[],
  locale: ShopflowLocale = 'en'
) {
  const [detailMap, setDetailMap] = useState<Record<string, SuiteDetailModel>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const next = await loadSuiteDetails(items, locale);
      if (!cancelled) {
        setDetailMap(next);
      }
    };

    void load();

    const onChanged = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== 'local') {
        return;
      }

      const relevantChange = Object.keys(changes).some((key) => {
        return (
          key === activityStorageKey ||
          key.startsWith(detectionStorageKeyPrefix) ||
          key.startsWith(latestOutputStorageKeyPrefix) ||
          key.startsWith(evidenceCaptureStorageKeyPrefix)
        );
      });

      if (!relevantChange) {
        return;
      }

      void load();
    };

    chrome.storage.onChanged.addListener(onChanged);
    return () => {
      cancelled = true;
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, [items, locale]);

  return detailMap;
}

export function formatSuiteEvidenceLabel(status: EvidenceCaptureRecord['status']) {
  return formatLiveReceiptStatusLabel(status);
}
