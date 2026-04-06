import { resolve } from 'node:path';

export const repoRoot = resolve(import.meta.dirname, '..', '..');

export function resolveFromRepo(...segments: string[]) {
  return resolve(repoRoot, ...segments);
}
