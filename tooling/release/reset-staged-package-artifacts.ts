import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const stagingRoot = resolve(
  process.cwd(),
  '.runtime-cache/release-artifacts/apps'
);

rmSync(stagingRoot, {
  recursive: true,
  force: true,
});

process.stdout.write(`Reset staged package artifacts under ${stagingRoot}.\n`);
