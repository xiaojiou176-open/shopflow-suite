import { describe, expect, it } from 'vitest';
import {
  buildShopflowDockerListArgs,
  createShopflowDockerCleanupPlan,
  formatShopflowDockerCleanupPlan,
  shopflowDockerLabel,
} from '../../tooling/maintenance/docker-policy';

describe('docker maintenance policy', () => {
  it('queries Docker only through the Shopflow label filter', () => {
    for (const kind of ['container', 'image', 'volume', 'network'] as const) {
      expect(buildShopflowDockerListArgs(kind)).toContain(
        `label=${shopflowDockerLabel}`
      );
    }
  });

  it('formats an empty dry-run plan without touching machine-wide roots', () => {
    const plan = createShopflowDockerCleanupPlan([], {
      apply: false,
      now: Date.parse('2026-04-04T12:00:00.000Z'),
    });

    expect(formatShopflowDockerCleanupPlan(plan)).toContain(
      'No Shopflow-labeled Docker resources found.'
    );
    expect(formatShopflowDockerCleanupPlan(plan)).not.toContain(
      'com.docker.docker'
    );
  });
});
