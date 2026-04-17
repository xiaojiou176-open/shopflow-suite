import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { repoRoot } from '../../tests/support/repo-paths';

type RepoProcessLockOptions = {
  lockRoot?: string;
  pollMs?: number;
  timeoutMs?: number;
};

const defaultLockRoot = resolve(repoRoot, '.runtime-cache/locks');

function sleep(ms: number) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

export async function withRepoProcessLock<T>(
  lockName: string,
  task: () => Promise<T> | T,
  options: RepoProcessLockOptions = {}
) {
  const lockRoot = options.lockRoot ?? defaultLockRoot;
  const pollMs = options.pollMs ?? 100;
  const timeoutMs = options.timeoutMs ?? 180_000;
  const lockDirectory = resolve(lockRoot, `${lockName}.lock`);
  const lockMetadataPath = resolve(lockDirectory, 'holder.json');
  const startedAt = Date.now();

  mkdirSync(lockRoot, { recursive: true });

  while (true) {
    try {
      mkdirSync(lockDirectory, { recursive: false });
      break;
    } catch (error) {
      if (
        !error ||
        typeof error !== 'object' ||
        !('code' in error) ||
        error.code !== 'EEXIST'
      ) {
        throw error;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        throw new Error(
          `Timed out waiting for repo process lock "${lockName}" under ${lockDirectory}.`,
          {
            cause: error,
          }
        );
      }

      await sleep(pollMs);
    }
  }

  try {
    writeFileSync(
      lockMetadataPath,
      `${JSON.stringify(
        {
          lockName,
          pid: process.pid,
          acquiredAt: new Date().toISOString(),
        },
        null,
        2
      )}\n`
    );
    return await task();
  } finally {
    rmSync(lockDirectory, { recursive: true, force: true });
  }
}
