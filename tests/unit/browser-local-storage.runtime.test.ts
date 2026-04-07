import { afterEach, describe, expect, it } from 'vitest';
import { BrowserLocalStorage } from '../../packages/runtime/src/storage/browser-local-storage';

type MockChromeStorageApi = {
  get: (key: string, callback: (items: Record<string, unknown>) => void) => void;
  set: (items: Record<string, unknown>, callback: () => void) => void;
};

function setMockChromeStorage(api?: MockChromeStorageApi) {
  const root = globalThis as typeof globalThis & {
    chrome?: {
      storage?: {
        local?: MockChromeStorageApi;
      };
    };
  };

  if (!api) {
    delete root.chrome;
    return;
  }

  root.chrome = {
    storage: {
      local: api,
    },
  };
}

describe('BrowserLocalStorage', () => {
  afterEach(() => {
    setMockChromeStorage();
  });

  it('reads values through the browser local storage API', async () => {
    setMockChromeStorage({
      get: (key, callback) => callback({ [key]: 'ready' }),
      set: (_items, callback) => callback(),
    });

    const storage = new BrowserLocalStorage();

    await expect(storage.get<string>('shopflow.key')).resolves.toBe('ready');
  });

  it('writes values through the browser local storage API', async () => {
    let written: Record<string, unknown> | undefined;

    setMockChromeStorage({
      get: (_key, callback) => callback({}),
      set: (items, callback) => {
        written = items;
        callback();
      },
    });

    const storage = new BrowserLocalStorage();
    await storage.set('shopflow.key', 'value');

    expect(written).toEqual({ 'shopflow.key': 'value' });
  });

  it('fails clearly when browser local storage is unavailable', async () => {
    setMockChromeStorage();

    const storage = new BrowserLocalStorage();

    await expect(storage.get('shopflow.key')).rejects.toThrow(
      'Browser local storage API is unavailable.'
    );
  });
});
