import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { withRepoProcessLock } from '../../tooling/shared/with-repo-process-lock';

function sleep(ms: number) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

describe('repo process lock tooling', () => {
  const cleanupPaths: string[] = [];

  afterEach(() => {
    for (const target of cleanupPaths.splice(0)) {
      rmSync(target, { recursive: true, force: true });
    }
  });

  it('serializes concurrent tasks that share the same repo-local lock', async () => {
    const lockRoot = mkdtempSync(join(tmpdir(), 'shopflow-locks-'));
    cleanupPaths.push(lockRoot);

    let activeCount = 0;
    let maxActiveCount = 0;
    const order: string[] = [];

    const runTask = (label: string, pauseMs: number) =>
      withRepoProcessLock(
        'ui-surface-capture',
        async () => {
          activeCount += 1;
          maxActiveCount = Math.max(maxActiveCount, activeCount);
          order.push(`start:${label}`);
          await sleep(pauseMs);
          order.push(`end:${label}`);
          activeCount -= 1;
        },
        {
          lockRoot,
          pollMs: 10,
          timeoutMs: 1_000,
        }
      );

    await Promise.all([runTask('first', 60), runTask('second', 10)]);

    expect(maxActiveCount).toBe(1);
    expect(order).toEqual([
      'start:first',
      'end:first',
      'start:second',
      'end:second',
    ]);
  });

  it('writes lock metadata while the task owns the repo-local lock', async () => {
    const lockRoot = mkdtempSync(join(tmpdir(), 'shopflow-locks-meta-'));
    cleanupPaths.push(lockRoot);

    const metadataSnapshot = await withRepoProcessLock(
      'ui-surface-capture',
      async () => {
        const metadataPath = join(
          lockRoot,
          'ui-surface-capture.lock',
          'holder.json'
        );

        expect(existsSync(metadataPath)).toBe(true);
        return JSON.parse(readFileSync(metadataPath, 'utf8')) as {
          lockName: string;
          pid: number;
        };
      },
      {
        lockRoot,
        pollMs: 10,
        timeoutMs: 1_000,
      }
    );

    expect(metadataSnapshot.lockName).toBe('ui-surface-capture');
    expect(metadataSnapshot.pid).toBe(process.pid);
  });

  it('allows reentrant use of the same repo-local lock inside one process', async () => {
    const lockRoot = mkdtempSync(join(tmpdir(), 'shopflow-locks-reentrant-'));
    cleanupPaths.push(lockRoot);
    const order: string[] = [];

    await withRepoProcessLock(
      'ui-surface-capture',
      async () => {
        order.push('outer-start');
        await withRepoProcessLock(
          'ui-surface-capture',
          async () => {
            order.push('inner');
            expect(
              existsSync(
                join(lockRoot, 'ui-surface-capture.lock', 'holder.json')
              )
            ).toBe(true);
          },
          {
            lockRoot,
            pollMs: 10,
            timeoutMs: 1_000,
          }
        );
        order.push('outer-end');
      },
      {
        lockRoot,
        pollMs: 10,
        timeoutMs: 1_000,
      }
    );

    expect(order).toEqual(['outer-start', 'inner', 'outer-end']);
    expect(existsSync(join(lockRoot, 'ui-surface-capture.lock'))).toBe(false);
  });

  it('clears a stale repo-local lock when the recorded holder pid is already gone', async () => {
    const lockRoot = mkdtempSync(join(tmpdir(), 'shopflow-locks-stale-'));
    cleanupPaths.push(lockRoot);
    const lockDirectory = join(lockRoot, 'ui-surface-capture.lock');
    mkdirSync(lockDirectory, { recursive: true });
    writeFileSync(
      join(lockDirectory, 'holder.json'),
      JSON.stringify(
        {
          lockName: 'ui-surface-capture',
          pid: 999_999,
          acquiredAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    const result = await withRepoProcessLock(
      'ui-surface-capture',
      async () => 'recovered',
      {
        lockRoot,
        pollMs: 10,
        timeoutMs: 1_000,
      }
    );

    expect(result).toBe('recovered');
    expect(existsSync(join(lockRoot, 'ui-surface-capture.lock'))).toBe(false);
  });
});
