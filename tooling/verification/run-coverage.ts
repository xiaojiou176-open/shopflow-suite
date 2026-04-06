import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '../..');
const canonicalCoverageDirectory = resolve(repoRoot, '.runtime-cache/coverage');
const coverageScratchRoot = resolve(repoRoot, '.runtime-cache/coverage-runs');

function main() {
  mkdirSync(coverageScratchRoot, { recursive: true });

  const tempCoverageDirectory = mkdtempSync(
    resolve(coverageScratchRoot, 'run-')
  );

  mkdirSync(resolve(tempCoverageDirectory, '.tmp'), { recursive: true });

  try {
    execFileSync(
      'pnpm',
      [
        'exec',
        'vitest',
        'run',
        'tests/unit',
        'tests/contract',
        'tests/integration',
        '--coverage.enabled',
        '--coverage.clean=true',
        '--coverage.provider=v8',
        '--coverage.reporter=text-summary',
        '--coverage.reporter=json-summary',
        `--coverage.reportsDirectory=${tempCoverageDirectory}`,
      ],
      {
        stdio: 'inherit',
        env: process.env,
      }
    );

    rmSync(canonicalCoverageDirectory, { recursive: true, force: true });
    renameSync(tempCoverageDirectory, canonicalCoverageDirectory);
  } finally {
    if (existsSync(tempCoverageDirectory)) {
      rmSync(tempCoverageDirectory, { recursive: true, force: true });
    }
  }
}

main();
