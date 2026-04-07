import type { ActivityItem } from './activity-repository';
import { ActivityRepository, activityStorageKey } from './activity-repository';
import type { DetectionRecord } from './detection-repository';
import {
  DetectionRepository,
  detectionStorageKeyPrefix,
} from './detection-repository';
import type { EvidenceCaptureRecord } from './evidence-capture-repository';
import {
  EvidenceCaptureRepository,
  evidenceCaptureStorageKeyPrefix,
} from './evidence-capture-repository';
export type { EvidenceCaptureRecord } from './evidence-capture-repository';
import type { LatestOutputRecord } from './latest-output-repository';
import {
  LatestOutputRepository,
  latestOutputStorageKeyPrefix,
} from './latest-output-repository';
import { BrowserLocalStorage } from './browser-local-storage';

type SharedStorageLike = {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
};

type StorageChangeRecord = Record<
  string,
  {
    newValue?: unknown;
    oldValue?: unknown;
  }
>;

type StorageApi = {
  onChanged: {
    addListener: (
      listener: (changes: StorageChangeRecord, areaName: string) => void
    ) => void;
    removeListener: (
      listener: (changes: StorageChangeRecord, areaName: string) => void
    ) => void;
  };
};

function getStorageApi(): StorageApi {
  const storage = (
    globalThis as typeof globalThis & {
      chrome?: {
        storage?: StorageApi;
      };
    }
  ).chrome?.storage;

  if (!storage?.onChanged) {
    throw new Error('Browser storage change API is unavailable.');
  }

  return storage;
}

export type SuiteControlPlaneSource = {
  detection?: DetectionRecord;
  recentActivities: ActivityItem[];
  latestOutput?: LatestOutputRecord;
  evidenceRecords: EvidenceCaptureRecord[];
};

export type SuiteControlPlaneRepositories = {
  detectionRepository: Pick<DetectionRepository, 'get'>;
  activityRepository: Pick<ActivityRepository, 'list'>;
  evidenceRepository: Pick<EvidenceCaptureRepository, 'list'>;
  latestOutputRepository: Pick<LatestOutputRepository, 'get'>;
};

export function createSuiteControlPlaneRepositories(
  storage: SharedStorageLike = new BrowserLocalStorage()
): SuiteControlPlaneRepositories {
  return {
    detectionRepository: new DetectionRepository(storage),
    activityRepository: new ActivityRepository(storage),
    evidenceRepository: new EvidenceCaptureRepository(storage),
    latestOutputRepository: new LatestOutputRepository(storage),
  };
}

export async function loadSuiteControlPlaneSource(
  appId: string,
  repositories: SuiteControlPlaneRepositories
): Promise<SuiteControlPlaneSource> {
  const [detection, recentActivities, latestOutput, evidenceRecords] =
    await Promise.all([
      repositories.detectionRepository.get(appId),
      repositories.activityRepository.list(appId),
      repositories.latestOutputRepository.get(appId),
      repositories.evidenceRepository.list(appId),
    ]);

  return {
    detection,
    recentActivities,
    latestOutput,
    evidenceRecords,
  };
}

export function hasSuiteControlPlaneStorageChange(
  changes: Record<string, unknown>
) {
  return Object.keys(changes).some((key) => {
    return (
      key === activityStorageKey ||
      key.startsWith(detectionStorageKeyPrefix) ||
      key.startsWith(latestOutputStorageKeyPrefix) ||
      key.startsWith(evidenceCaptureStorageKeyPrefix)
    );
  });
}

export function subscribeSuiteControlPlaneStorageChanges(
  listener: () => void
) {
  const storage = getStorageApi();

  const onChanged = (changes: StorageChangeRecord, areaName: string) => {
    if (areaName !== 'local') {
      return;
    }

    if (!hasSuiteControlPlaneStorageChange(changes)) {
      return;
    }

    listener();
  };

  storage.onChanged.addListener(onChanged);

  return () => {
    storage.onChanged.removeListener(onChanged);
  };
}
