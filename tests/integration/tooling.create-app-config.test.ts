import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { storeTopology } from '@shopflow/contracts';
import { createPackageAliases } from '../../tooling/wxt/create-app-config';

describe('tooling create app config', () => {
  it('derives every store package alias from shared store topology', () => {
    const baseDir = '/virtual-repo/tooling/wxt';
    const aliases = createPackageAliases(baseDir);

    expect(
      Object.keys(aliases)
        .filter((alias) => alias.startsWith('@shopflow/store-'))
        .sort()
    ).toEqual(
      storeTopology.map((entry) => entry.storePackageImportName).sort()
    );

    for (const entry of storeTopology) {
      expect(aliases[entry.storePackageImportName]).toBe(
        resolve(baseDir, `../../${entry.storePackageEntryPath}`)
      );
    }
  });
});
