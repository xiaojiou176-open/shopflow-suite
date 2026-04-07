import { formatLiveReceiptStatusLabel } from '@shopflow/contracts';
import {
  loadSuiteDetailMap,
  type ShopflowLocale,
  type SuiteCatalogItem,
  type SuiteDetailModel,
} from '@shopflow/core';
import {
  createSuiteControlPlaneRepositories,
  subscribeSuiteControlPlaneStorageChanges,
  type EvidenceCaptureRecord,
} from '@shopflow/runtime';
import { useEffect, useState } from 'react';

const repositories = createSuiteControlPlaneRepositories();

export function useSuiteControlPlane(
  items: readonly SuiteCatalogItem[],
  locale: ShopflowLocale = 'en'
) {
  const [detailMap, setDetailMap] = useState<Record<string, SuiteDetailModel>>(
    {}
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const next = await loadSuiteDetailMap(items, locale, repositories);
      if (!cancelled) {
        setDetailMap(next);
      }
    };

    void load();

    const dispose = subscribeSuiteControlPlaneStorageChanges(() => {
      void load();
    });

    return () => {
      cancelled = true;
      dispose();
    };
  }, [items, locale]);

  return detailMap;
}

export function formatSuiteEvidenceLabel(status: EvidenceCaptureRecord['status']) {
  return formatLiveReceiptStatusLabel(status);
}
