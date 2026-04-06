import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@shopflow/contracts': resolve(
        __dirname,
        'packages/contracts/src/index.ts'
      ),
      '@shopflow/core': resolve(__dirname, 'packages/core/src/index.ts'),
      '@shopflow/runtime': resolve(__dirname, 'packages/runtime/src/index.ts'),
      '@shopflow/ui': resolve(__dirname, 'packages/ui/src/index.ts'),
      '@shopflow/testkit': resolve(__dirname, 'packages/testkit/src/index.ts'),
      '@shopflow/store-albertsons': resolve(
        __dirname,
        'packages/store-albertsons/src/index.ts'
      ),
      '@shopflow/store-amazon': resolve(
        __dirname,
        'packages/store-amazon/src/index.ts'
      ),
      '@shopflow/store-target': resolve(
        __dirname,
        'packages/store-target/src/index.ts'
      ),
      '@shopflow/store-costco': resolve(
        __dirname,
        'packages/store-costco/src/index.ts'
      ),
      '@shopflow/store-kroger': resolve(
        __dirname,
        'packages/store-kroger/src/index.ts'
      ),
      '@shopflow/store-walmart': resolve(
        __dirname,
        'packages/store-walmart/src/index.ts'
      ),
      '@shopflow/store-weee': resolve(
        __dirname,
        'packages/store-weee/src/index.ts'
      ),
      '@shopflow/store-temu': resolve(
        __dirname,
        'packages/store-temu/src/index.ts'
      ),
    },
  },
  test: {
    environment: 'jsdom',
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
      'tests/**/*.spec.ts',
      'tests/**/*.spec.tsx',
    ],
  },
});
