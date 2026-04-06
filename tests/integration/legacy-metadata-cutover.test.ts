import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { repoRoot } from '../support/repo-paths';

const scanRoots = [
  join(repoRoot, 'apps'),
  join(repoRoot, 'packages'),
  join(repoRoot, 'tooling'),
] as const;

const allowedExtensions = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs', '.json']);
const forbiddenMarkers = [
  'metadata/scripts.json',
  'metadata/install-manifest.json',
  'Terry_Tampermonkey',
] as const;

describe('legacy metadata cutover guardrail', () => {
  it('keeps runtime and app code from reading Terry metadata as a hidden truth plane', () => {
    const offenders: string[] = [];

    for (const root of scanRoots) {
      walkFiles(root, offenders);
    }

    expect(offenders).toEqual([]);
  });
});

function walkFiles(path: string, offenders: string[]) {
  const entries = readdirSync(path, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.output' || entry.name === '.wxt') {
      continue;
    }

    const fullPath = join(path, entry.name);

    if (entry.isDirectory()) {
      walkFiles(fullPath, offenders);
      continue;
    }

    if (!entry.isFile() || !allowedExtensions.has(extname(entry.name))) {
      continue;
    }

    if (!statSync(fullPath).isFile()) {
      continue;
    }

    const content = readFileSync(fullPath, 'utf8');
    const hit = forbiddenMarkers.find((marker) => content.includes(marker));

    if (hit) {
      offenders.push(`${fullPath} -> ${hit}`);
    }
  }
}
