import {
  applyShopflowDockerCleanupPlan,
  createShopflowDockerCleanupPlan,
  formatShopflowDockerCleanupPlan,
} from './docker-policy';

function main() {
  const apply = process.argv.slice(2).includes('--apply');
  const plan = createShopflowDockerCleanupPlan(undefined, { apply });

  process.stdout.write(formatShopflowDockerCleanupPlan(plan));

  if (!apply) {
    process.stdout.write(
      'Dry-run only. Re-run with `--apply` to remove Shopflow-labeled Docker resources.\n'
    );
    return;
  }

  const applied = applyShopflowDockerCleanupPlan(plan);
  process.stdout.write(
    `Applied cleanup for ${applied.length} Shopflow-labeled Docker resource${applied.length === 1 ? '' : 's'}.\n`
  );
}

main();
