import { AsyncLocalStorage } from 'node:async_hooks';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { repoRoot } from '../../tests/support/repo-paths';

type RepoProcessLockOptions = {
  lockRoot?: string;
  pollMs?: number;
  timeoutMs?: number;
};

const defaultLockRoot = resolve(repoRoot, '.runtime-cache/locks');
const lockContextStorage = new AsyncLocalStorage<Set<string>>();

function sleep(ms: number) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function isPidAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'EPERM'
    ) {
      return true;
    }

    return false;
  }
}

function tryClearStaleLock(lockDirectory: string, lockMetadataPath: string) {
  if (!existsSync(lockMetadataPath)) {
    return false;
  }

  try {
    const metadata = JSON.parse(readFileSync(lockMetadataPath, 'utf8')) as {
      pid?: number;
    };
    if (typeof metadata.pid !== 'number' || Number.isNaN(metadata.pid)) {
      return false;
    }

    if (isPidAlive(metadata.pid)) {
      return false;
    }

    rmSync(lockDirectory, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
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

  if (lockContextStorage.getStore()?.has(lockDirectory)) {
    return await task();
  }

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

      if (tryClearStaleLock(lockDirectory, lockMetadataPath)) {
        continue;
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
    const inheritedLocks = lockContextStorage.getStore();
    const nextLocks = new Set(inheritedLocks ?? []);
    nextLocks.add(lockDirectory);

    return await lockContextStorage.run(nextLocks, async () => task());
  } finally {
    rmSync(lockDirectory, { recursive: true, force: true });
  }
}
