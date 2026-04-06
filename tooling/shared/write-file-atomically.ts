import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function tempPathFor(targetPath: string) {
  return `${targetPath}.${process.pid}.${Date.now()}.tmp`;
}

export function writeFileAtomically(targetPath: string, contents: string) {
  const absoluteTargetPath = resolve(targetPath);
  const parentDirectory = dirname(absoluteTargetPath);
  const tempPath = tempPathFor(absoluteTargetPath);

  mkdirSync(parentDirectory, { recursive: true });

  try {
    writeFileSync(tempPath, contents);
    renameSync(tempPath, absoluteTargetPath);
  } finally {
    if (existsSync(tempPath)) {
      rmSync(tempPath, { force: true });
    }
  }
}
