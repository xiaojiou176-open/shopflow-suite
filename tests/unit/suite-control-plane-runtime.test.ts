import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createSuiteControlPlaneRepositories,
  hasSuiteControlPlaneStorageChange,
  loadSuiteControlPlaneSource,
  subscribeSuiteControlPlaneStorageChanges,
} from '../../packages/runtime/src/storage/suite-control-plane-runtime';

type MockStorageChangeRecord = Record<
  string,
  {
    newValue?: unknown;
    oldValue?: unknown;
  }
>;

function installMockStorageEvents() {
  const listeners = new Set<
    (changes: MockStorageChangeRecord, areaName: string) => void
  >();

  (
    globalThis as typeof globalThis & {
      chrome?: {
        storage?: {
          onChanged?: {
            addListener: (
              listener: (changes: MockStorageChangeRecord, areaName: string) => void
            ) => void;
            removeListener: (
              listener: (changes: MockStorageChangeRecord, areaName: string) => void
            ) => void;
          };
        };
      };
    }
  ).chrome = {
    storage: {
      onChanged: {
        addListener: (listener) => {
          listeners.add(listener);
        },
        removeListener: (listener) => {
          listeners.delete(listener);
        },
      },
    },
  };

  return {
    emit(changes: MockStorageChangeRecord, areaName: string) {
      for (const listener of listeners) {
        listener(changes, areaName);
      }
    },
  };
}

describe('suite control-plane runtime helpers', () => {
  afterEach(() => {
    delete (
      globalThis as typeof globalThis & {
        chrome?: unknown;
      }
    ).chrome;
  });

  it('detects relevant suite storage changes', () => {
    expect(
      hasSuiteControlPlaneStorageChange({
        'shopflow.recentActivity': { newValue: [] },
      })
    ).toBe(true);
    expect(
      hasSuiteControlPlaneStorageChange({
        'shopflow.siteDetection.ext-albertsons': { newValue: {} },
      })
    ).toBe(true);
    expect(
      hasSuiteControlPlaneStorageChange({
        unrelated: { newValue: {} },
      })
    ).toBe(false);
  });

  it('loads suite control-plane source from shared repositories', async () => {
    const repositories = {
      detectionRepository: {
        get: vi.fn().mockResolvedValue({ appId: 'ext-albertsons' }),
      },
      activityRepository: {
        list: vi.fn().mockResolvedValue([{ id: 'a1' }]),
      },
      evidenceRepository: {
        list: vi.fn().mockResolvedValue([{ captureId: 'c1' }]),
      },
      latestOutputRepository: {
        get: vi.fn().mockResolvedValue({ headline: 'output' }),
      },
    };

    await expect(
      loadSuiteControlPlaneSource('ext-albertsons', repositories)
    ).resolves.toEqual({
      detection: { appId: 'ext-albertsons' },
      recentActivities: [{ id: 'a1' }],
      latestOutput: { headline: 'output' },
      evidenceRecords: [{ captureId: 'c1' }],
    });
  });

  it('subscribes only to relevant local storage changes', () => {
    const events = installMockStorageEvents();
    const listener = vi.fn();

    const dispose = subscribeSuiteControlPlaneStorageChanges(listener);

    events.emit({ unrelated: { newValue: true } }, 'local');
    events.emit({ 'shopflow.recentActivity': { newValue: [] } }, 'sync');
    events.emit({ 'shopflow.recentActivity': { newValue: [] } }, 'local');

    expect(listener).toHaveBeenCalledTimes(1);

    dispose();
    events.emit({ 'shopflow.recentActivity': { newValue: [] } }, 'local');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('creates runtime repositories against a shared storage object', async () => {
    const backingStore = new Map<string, unknown>();
    const storage = {
      async get<T>(key: string) {
        return backingStore.get(key) as T | undefined;
      },
      async set<T>(key: string, value: T) {
        backingStore.set(key, value);
      },
    };

    const repositories = createSuiteControlPlaneRepositories(storage);

    await repositories.detectionRepository.get('ext-albertsons');
    await repositories.activityRepository.list('ext-albertsons');
    await repositories.evidenceRepository.list('ext-albertsons');
    await repositories.latestOutputRepository.get('ext-albertsons');

    expect(repositories).toHaveProperty('detectionRepository');
    expect(repositories).toHaveProperty('activityRepository');
    expect(repositories).toHaveProperty('evidenceRepository');
    expect(repositories).toHaveProperty('latestOutputRepository');
  });
});
