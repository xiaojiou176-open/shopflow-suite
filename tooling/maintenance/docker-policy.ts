import { execFileSync } from 'node:child_process';

export const shopflowDockerLabelKey = 'com.shopflow.repo';
export const shopflowDockerLabelValue = 'shopflow-suite';
export const shopflowDockerLabel = `${shopflowDockerLabelKey}=${shopflowDockerLabelValue}`;

export type ShopflowDockerResourceKind =
  | 'container'
  | 'image'
  | 'volume'
  | 'network';

export type ShopflowDockerResource = {
  kind: ShopflowDockerResourceKind;
  id: string;
  name: string;
};

export type ShopflowDockerCleanupPlan = {
  generatedAt: string;
  apply: boolean;
  resources: ShopflowDockerResource[];
};

function readDockerLines(args: string[]) {
  try {
    const output = execFileSync('docker', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    return output ? output.split('\n') : [];
  } catch {
    return [];
  }
}

export function buildShopflowDockerListArgs(
  kind: ShopflowDockerResourceKind
) {
  return kind === 'container'
    ? [
        'ps',
        '-a',
        '--filter',
        `label=${shopflowDockerLabel}`,
        '--format',
        '{{.ID}}\t{{.Names}}',
      ]
    : kind === 'image'
      ? [
          'image',
          'ls',
          '--filter',
          `label=${shopflowDockerLabel}`,
          '--format',
          '{{.ID}}\t{{.Repository}}:{{.Tag}}',
        ]
      : kind === 'volume'
        ? [
            'volume',
            'ls',
            '--filter',
            `label=${shopflowDockerLabel}`,
            '--format',
            '{{.Name}}\t{{.Name}}',
          ]
        : [
            'network',
            'ls',
            '--filter',
            `label=${shopflowDockerLabel}`,
            '--format',
            '{{.ID}}\t{{.Name}}',
          ];
}

function parseDockerResourceLines(
  kind: ShopflowDockerResourceKind,
  lines: string[]
) {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, ...rest] = line.split('\t');
      return {
        kind,
        id,
        name: rest.join('\t') || id,
      } satisfies ShopflowDockerResource;
    });
}

export function listShopflowDockerResources() {
  return [
    ...parseDockerResourceLines(
      'container',
      readDockerLines(buildShopflowDockerListArgs('container'))
    ),
    ...parseDockerResourceLines(
      'image',
      readDockerLines(buildShopflowDockerListArgs('image'))
    ),
    ...parseDockerResourceLines(
      'volume',
      readDockerLines(buildShopflowDockerListArgs('volume'))
    ),
    ...parseDockerResourceLines(
      'network',
      readDockerLines(buildShopflowDockerListArgs('network'))
    ),
  ];
}

export function createShopflowDockerCleanupPlan(
  resources = listShopflowDockerResources(),
  options: { apply?: boolean; now?: number } = {}
): ShopflowDockerCleanupPlan {
  const now = options.now ?? Date.now();
  return {
    generatedAt: new Date(now).toISOString(),
    apply: options.apply ?? false,
    resources: [...resources].sort((left, right) =>
      `${left.kind}:${left.name}`.localeCompare(`${right.kind}:${right.name}`)
    ),
  };
}

export function applyShopflowDockerCleanupPlan(plan: ShopflowDockerCleanupPlan) {
  const removed: ShopflowDockerResource[] = [];

  for (const resource of plan.resources) {
    const args =
      resource.kind === 'container'
        ? ['rm', '-f', resource.id]
        : resource.kind === 'image'
          ? ['rmi', resource.id]
          : resource.kind === 'volume'
            ? ['volume', 'rm', resource.id]
            : ['network', 'rm', resource.id];

    execFileSync('docker', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
    removed.push(resource);
  }

  return removed;
}

export function formatShopflowDockerCleanupPlan(
  plan: ShopflowDockerCleanupPlan
) {
  const lines = [
    'Shopflow Docker cleanup plan',
    `Generated at: ${plan.generatedAt}`,
    `Label filter: ${shopflowDockerLabel}`,
    `Apply mode: ${plan.apply ? 'yes' : 'no (dry-run)'}`,
    `Matching resources: ${plan.resources.length}`,
  ];

  if (plan.resources.length === 0) {
    lines.push('No Shopflow-labeled Docker resources found.');
    return `${lines.join('\n')}\n`;
  }

  lines.push('');
  for (const resource of plan.resources) {
    lines.push(`- [${resource.kind}] ${resource.name}`, `  id: ${resource.id}`);
  }

  return `${lines.join('\n')}\n`;
}
