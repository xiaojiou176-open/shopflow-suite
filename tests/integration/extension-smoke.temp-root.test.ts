import { existsSync, rmSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createExtensionTestUserDataDir,
  resolveExtensionBrowserTempRoot,
} from '../e2e/support/extension-smoke';

describe('extension smoke temp root', () => {
  it('creates repo-local Chromium user-data dirs under .runtime-cache/e2e-browser', () => {
    const userDataDir = createExtensionTestUserDataDir('ext-temu');
    const expectedRoot = resolveExtensionBrowserTempRoot();

    try {
      expect(userDataDir.startsWith(expectedRoot)).toBe(true);
      expect(existsSync(userDataDir)).toBe(true);
    } finally {
      rmSync(userDataDir, {
        recursive: true,
        force: true,
      });
    }
  });
});
