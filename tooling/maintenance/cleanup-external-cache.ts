import {
  applyExternalCacheCleanupPlan,
  createExternalCacheCleanupPlan,
  ensureShopflowCacheDirectories,
  formatExternalCacheCleanupPlan,
  resolveShopflowCachePolicy,
} from './cache-policy';

function main() {
  const apply = process.argv.slice(2).includes('--apply');
  const policy = resolveShopflowCachePolicy();
  ensureShopflowCacheDirectories(policy);
  const plan = createExternalCacheCleanupPlan(policy, { apply });

  process.stdout.write(formatExternalCacheCleanupPlan(plan));

  if (!apply) {
    process.stdout.write(
      'Dry-run only. Re-run with `--apply` to prune Shopflow-owned external cache entries.\n'
    );
    return;
  }

  const applied = applyExternalCacheCleanupPlan(plan);
  process.stdout.write(
    `Applied cleanup for ${applied.length} Shopflow-owned external cache path${applied.length === 1 ? '' : 's'}.\n`
  );
}

main();
