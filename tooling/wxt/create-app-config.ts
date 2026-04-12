import { resolve } from 'node:path';
import { defineConfig, type UserConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { storeTopology } from '../../packages/contracts/src/store-topology';

type AppConfigInput = {
  name: string;
  description: string;
  hostPermissions: string[];
};

const sharedPackageEntryPaths = {
  '@shopflow/contracts': 'packages/contracts/src/index.ts',
  '@shopflow/core': 'packages/core/src/index.ts',
  '@shopflow/runtime': 'packages/runtime/src/index.ts',
  '@shopflow/ui': 'packages/ui/src/index.ts',
  '@shopflow/testkit': 'packages/testkit/src/index.ts',
} as const;

export function createPackageAliases(baseDir: string) {
  return {
    ...Object.fromEntries(
      Object.entries(sharedPackageEntryPaths).map(([alias, relativePath]) => [
        alias,
        resolve(baseDir, `../../${relativePath}`),
      ])
    ),
    ...Object.fromEntries(
      storeTopology.map((entry) => [
        entry.storePackageImportName,
        resolve(baseDir, `../../${entry.storePackageEntryPath}`),
      ])
    ),
  };
}

export function createAppConfig(input: AppConfigInput): UserConfig {
  return defineConfig({
    modules: ['@wxt-dev/module-react'],
    vite: () => ({
      plugins: [tailwindcss()],
      resolve: {
        alias: createPackageAliases(import.meta.dirname),
      },
    }),
    manifest: {
      name: input.name,
      description: input.description,
      permissions: ['storage', 'sidePanel'],
      host_permissions: input.hostPermissions,
      action: {
        default_title: input.name,
        default_popup: 'popup.html',
      },
      side_panel: {
        default_path: 'sidepanel.html',
      },
    },
  });
}
