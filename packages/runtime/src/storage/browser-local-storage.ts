type BrowserLocalStorageApi = {
  get: (key: string, callback: (items: Record<string, unknown>) => void) => void;
  set: (items: Record<string, unknown>, callback: () => void) => void;
};

function getBrowserLocalStorageApi(): BrowserLocalStorageApi {
  const api = (
    globalThis as typeof globalThis & {
      chrome?: {
        storage?: {
          local?: BrowserLocalStorageApi;
        };
      };
    }
  ).chrome?.storage?.local;

  if (!api) {
    throw new Error('Browser local storage API is unavailable.');
  }

  return api;
}

export class BrowserLocalStorage {
  async get<T>(key: string): Promise<T | undefined> {
    const api = getBrowserLocalStorageApi();
    return await new Promise<T | undefined>((resolve) => {
      api.get(key, (items) => {
        resolve(items[key] as T | undefined);
      });
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    const api = getBrowserLocalStorageApi();
    await new Promise<void>((resolve) => {
      api.set({ [key]: value }, () => resolve());
    });
  }
}
