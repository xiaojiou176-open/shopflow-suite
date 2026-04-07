import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const appDirs = process.argv.slice(2);

if (appDirs.length === 0) {
  throw new Error('Expected at least one app directory argument.');
}

for (const appDir of appDirs) {
  for (const cachePath of ['.output', '.wxt']) {
    rmSync(resolve(process.cwd(), appDir, cachePath), {
      recursive: true,
      force: true,
    });
  }
}

process.stdout.write(
  `Reset build outputs and WXT caches for ${appDirs.length} app director${
    appDirs.length === 1 ? 'y' : 'ies'
  }.\n`
);
