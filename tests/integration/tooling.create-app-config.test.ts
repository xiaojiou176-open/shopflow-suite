import { readFileSync } from 'node:fs';
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

  it('keeps the Tailwind Vite plugin wired into the shared WXT app config', () => {
    const configSource = readFileSync(
      resolve(process.cwd(), 'tooling/wxt/create-app-config.ts'),
      'utf8'
    );

    expect(configSource).toContain("import tailwindcss from '@tailwindcss/vite';");
    expect(configSource).toContain('plugins: [tailwindcss()]');
  });

  it('loads the shared UI stylesheet from the primitives entrypoint', () => {
    const primitivesSource = readFileSync(
      resolve(process.cwd(), 'packages/ui/src/primitives.tsx'),
      'utf8'
    );

    expect(primitivesSource).toContain("import './styles.css';");
  });
});
