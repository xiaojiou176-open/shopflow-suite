import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import {
  applyExternalCacheCleanupPlan,
  buildShopflowCacheEnvironment,
  createExternalCacheCleanupPlan,
  ensureShopflowCacheDirectories,
  resolveShopflowCachePolicy,
} from './cache-policy';

function parseCommand(argv: string[]) {
  const separatorIndex = argv.indexOf('--');
  const parts = separatorIndex >= 0 ? argv.slice(separatorIndex + 1) : argv;
  if (parts.length === 0) {
    throw new Error(
      'Expected a shell command after `--`, for example `tsx tooling/maintenance/run-with-cache-governance.ts -- pnpm lint`.'
    );
  }

  return parts.join(' ');
}

function commandNeedsPlaywrightBrowsers(command: string) {
  return /\bplaywright\s+test\b/.test(command);
}

function hasPlaywrightBrowsersInstalled(playwrightRoot: string) {
  if (!existsSync(playwrightRoot)) {
    return false;
  }

  return readdirSync(playwrightRoot).some((entry) => !entry.startsWith('.'));
}

function ensurePlaywrightChromium(
  command: string,
  policy: ReturnType<typeof resolveShopflowCachePolicy>
) {
  if (!commandNeedsPlaywrightBrowsers(command)) {
    return;
  }

  if (hasPlaywrightBrowsersInstalled(policy.msPlaywrightDir)) {
    return;
  }

  execFileSync('pnpm', ['exec', 'playwright', 'install', 'chromium'], {
    stdio: 'inherit',
    env: {
      ...buildShopflowCacheEnvironment(policy),
      SHOPFLOW_CACHE_GOVERNANCE_ACTIVE: '1',
    },
  });
}

function signalExitCode(signal: NodeJS.Signals) {
  const codes: Partial<Record<NodeJS.Signals, number>> = {
    SIGINT: 130,
    SIGTERM: 143,
  };

  return codes[signal] ?? 1;
}

async function main() {
  const command = parseCommand(process.argv.slice(2));
  const policy = resolveShopflowCachePolicy();
  ensureShopflowCacheDirectories(policy);

  if (process.env.SHOPFLOW_CACHE_GOVERNANCE_ACTIVE !== '1') {
    const prunePlan = createExternalCacheCleanupPlan(policy, { apply: true });
    applyExternalCacheCleanupPlan(prunePlan);
  }

  ensurePlaywrightChromium(command, policy);

  const child = spawn(command, {
    shell: true,
    stdio: 'inherit',
    env: {
      ...buildShopflowCacheEnvironment(policy),
      SHOPFLOW_CACHE_GOVERNANCE_ACTIVE: '1',
    },
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.exit(signalExitCode(signal));
      return;
    }
    process.exit(code ?? 1);
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
