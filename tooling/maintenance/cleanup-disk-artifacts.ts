import {
  applyCleanupPlan,
  cleanupModeValues,
  createCleanupPlan,
  formatCleanupPlan,
  resolvePnpmStorePath,
  type CleanupMode,
} from './disk-artifacts';

function parseCleanupMode(argv: string[]): CleanupMode {
  const mode = argv[0];

  if (!cleanupModeValues.includes(mode as CleanupMode)) {
    throw new Error(
      `Expected cleanup mode ${cleanupModeValues.join(', ')} but received ${mode ?? '<missing>'}.`
    );
  }

  return mode as CleanupMode;
}

function main() {
  const args = process.argv.slice(2);
  const mode = parseCleanupMode(args);
  const apply = args.includes('--apply');
  const plan = createCleanupPlan(process.cwd(), mode, { apply });

  process.stdout.write(formatCleanupPlan(plan));

  if (!apply) {
    process.stdout.write(
      mode === 'external-cache'
        ? 'Dry-run only. Re-run with `--apply` to remove the listed Shopflow-owned external cache artifacts.\n'
        : 'Dry-run only. Re-run with `--apply` to remove the listed repo-local artifacts.\n'
    );
    return;
  }

  const applied = applyCleanupPlan(plan, {
    pnpmStorePath: resolvePnpmStorePath(process.cwd()),
  });
  process.stdout.write(
    mode === 'external-cache'
      ? `Applied cleanup for ${applied.length} Shopflow-owned external cache path${applied.length === 1 ? '' : 's'}.\n`
      : `Applied cleanup for ${applied.length} repo-local artifact path${applied.length === 1 ? '' : 's'}.\n`
  );
}

main();
