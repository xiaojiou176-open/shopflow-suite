import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type CoverageMetric = {
  pct: number;
};

type CoverageSummary = {
  total: {
    statements: CoverageMetric;
    branches: CoverageMetric;
    functions: CoverageMetric;
    lines: CoverageMetric;
  };
};

const repoRoot = resolve(import.meta.dirname, '../..');
const summaryPath = resolve(
  repoRoot,
  '.runtime-cache/coverage/coverage-summary.json'
);

const regressionFloor = {
  statements: 72,
  branches: 57,
  functions: 80,
  lines: 73,
} as const;

async function waitForCoverageSummary(path: string, attempts = 10, delayMs = 100) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (existsSync(path)) {
      return;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
  }
}

async function main() {
  await waitForCoverageSummary(summaryPath);
  const summary = JSON.parse(
    readFileSync(summaryPath, 'utf8')
  ) as CoverageSummary;
  const failingMetrics = Object.entries(regressionFloor).filter(
    ([metric, floor]) =>
      summary.total[metric as keyof typeof regressionFloor].pct < floor
  );

  if (failingMetrics.length === 0) {
    process.stdout.write(
      `Coverage regression floor satisfied: statements>=${regressionFloor.statements}, branches>=${regressionFloor.branches}, functions>=${regressionFloor.functions}, lines>=${regressionFloor.lines}.\n`
    );
    return;
  }

  for (const [metric, floor] of failingMetrics) {
    const actual = summary.total[metric as keyof typeof regressionFloor].pct;
    console.error(
      `- Coverage regression floor failed for ${metric}: expected >= ${floor}, got ${actual.toFixed(2)}`
    );
  }

  process.exitCode = 1;
}

await main();
