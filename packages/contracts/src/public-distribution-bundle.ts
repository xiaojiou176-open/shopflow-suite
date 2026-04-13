import { z } from 'zod';

export const publicDistributionChannelValues = [
  'public-api',
  'public-mcp',
  'public-skills',
  'plugin-marketplace',
] as const;

export type PublicDistributionChannelId =
  (typeof publicDistributionChannelValues)[number];

export const publicDistributionArtifactKindValues = [
  'doc',
  'command',
  'json',
  'checklist',
] as const;

export type PublicDistributionArtifactKind =
  (typeof publicDistributionArtifactKindValues)[number];

export const publicDistributionArtifactSchema = z.object({
  kind: z.enum(publicDistributionArtifactKindValues),
  label: z.string().min(1),
  value: z.string().min(1),
});

export const publicDistributionRepoOwnedStatusValues = [
  'ready-to-sync-packet',
  'plugin-level-public-distribution-bundle',
] as const;

export const publicDistributionChannelSchema = z.object({
  id: z.enum(publicDistributionChannelValues),
  label: z.string().min(1),
  repoOwnedStatus: z.enum(publicDistributionRepoOwnedStatusValues),
  publicReleaseState: z.literal('not-yet-published'),
  summary: z.string().min(1),
  primaryCommand: z.string().min(1),
  artifacts: z.array(publicDistributionArtifactSchema).min(1),
  mustNotClaim: z.array(z.string().min(1)).min(1),
  nextHumanStep: z.string().min(1),
});

export const publicDistributionBundleSchema = z.object({
  surfaceId: z.literal('public-distribution-bundle'),
  schemaVersion: z.literal('shopflow.public-distribution-bundle.v1'),
  readOnly: z.literal(true),
  boundaryNote: z.string().min(1),
  discoverabilitySources: z.array(z.string().min(1)).min(2),
  channels: z.array(publicDistributionChannelSchema).length(4),
});

export type PublicDistributionArtifact = z.infer<
  typeof publicDistributionArtifactSchema
>;
export type PublicDistributionChannel = z.infer<
  typeof publicDistributionChannelSchema
>;
export type PublicDistributionBundle = z.infer<
  typeof publicDistributionBundleSchema
>;

export const publicDistributionBundle = publicDistributionBundleSchema.parse({
  surfaceId: 'public-distribution-bundle',
  schemaVersion: 'shopflow.public-distribution-bundle.v1',
  readOnly: true,
  boundaryNote:
    'These packets are repo-owned distribution bundles. They make public API / MCP / skills / plugin-marketplace work concrete enough for starter bundles, sample configs, proof loops, and listing payloads, but they do not prove any public surface is already shipped or officially listed.',
  discoverabilitySources: [
    'docs/ecosystem/agent-distribution-artifacts.md',
    'docs/ecosystem/agent-quickstarts.md',
    'docs/ecosystem/builder-start-here.md',
  ],
  channels: [
    {
      id: 'public-api',
      label: 'Public read-only API packet',
      repoOwnedStatus: 'ready-to-sync-packet',
      publicReleaseState: 'not-yet-published',
      summary:
        'Defines the read-only API publication packet as docs, contract pointers, and boundary notes without claiming a live public transport already exists.',
      primaryCommand: 'pnpm cli:read-only -- public-distribution-bundle',
      artifacts: [
        {
          kind: 'doc',
          label: 'Ready-to-sync packet',
          value: 'docs/ecosystem/public-distribution-bundle.ready.md',
        },
        {
          kind: 'doc',
          label: 'Current-scope roadmap',
          value: 'docs/ecosystem/integration-surface-roadmap.md',
        },
        {
          kind: 'checklist',
          label: 'Boundary reminder',
          value:
            'Keep this as read-only publication prep; do not claim a live public API transport until deployment and external publication actually happen.',
        },
      ],
      mustNotClaim: [
        'Public API already shipped',
        'Public transport already reachable',
      ],
      nextHumanStep:
        'Use the packet to decide where the public read-only API should be published once external hosting/publishing is intentionally opened.',
    },
    {
      id: 'public-mcp',
      label: 'Read-only MCP surface',
      repoOwnedStatus: 'ready-to-sync-packet',
      publicReleaseState: 'not-yet-published',
      summary:
        'Ships a live repo-local read-only stdio MCP for the core four repo-truth surfaces while keeping public transport and registry publication explicitly later.',
      primaryCommand: 'pnpm mcp:stdio',
      artifacts: [
        {
          kind: 'doc',
          label: 'MCP quickstart',
          value: 'docs/ecosystem/mcp-quickstart.md',
        },
        {
          kind: 'json',
          label: 'Sample stdio config',
          value: 'docs/ecosystem/examples/mcp-config.stdio.json',
        },
        {
          kind: 'doc',
          label: 'Agent and MCP positioning',
          value: 'docs/ecosystem/agent-and-mcp-positioning.md',
        },
        {
          kind: 'doc',
          label: 'Agent quickstarts',
          value: 'docs/ecosystem/agent-quickstarts.md',
        },
        {
          kind: 'doc',
          label: 'Ready-to-sync packet',
          value: 'docs/ecosystem/public-mcp-capability-map.ready.md',
        },
        {
          kind: 'command',
          label: 'Machine-readable capability map',
          value: 'pnpm cli:read-only -- public-mcp-capability-map',
        },
        {
          kind: 'command',
          label: 'Full onboarding bundle',
          value: 'pnpm cli:read-only -- agent-integration-bundle',
        },
      ],
      mustNotClaim: [
        'Public HTTP MCP already published',
        'Write-capable MCP exists',
      ],
      nextHumanStep:
        'Use the repo-local stdio MCP today, and only choose public transport, Docker, or registry publication after those external surfaces are intentionally opened.',
    },
    {
      id: 'public-skills',
      label: 'Public skills packet',
      repoOwnedStatus: 'plugin-level-public-distribution-bundle',
      publicReleaseState: 'not-yet-published',
      summary:
        'Packages the current Claude Code skills-facing story into a plugin-level public distribution bundle with starter artifacts, sample config, and proof commands without pretending a public skills pack is already distributed.',
      primaryCommand: 'pnpm cli:read-only -- public-skills-catalog',
      artifacts: [
        {
          kind: 'doc',
          label: 'Ready-to-sync packet',
          value: 'docs/ecosystem/public-skills-catalog.ready.md',
        },
        {
          kind: 'doc',
          label: 'Local skill scaffold reference',
          value:
            '.agents/skills/shopflow-read-only-runtime-seam-consumption/SKILL.md',
        },
        {
          kind: 'command',
          label: 'Machine-readable skills packet',
          value: 'pnpm cli:read-only -- public-skills-catalog',
        },
        {
          kind: 'command',
          label: 'Claude Code handoff packet',
          value:
            'pnpm cli:read-only -- agent-target-packet --target claude-code',
        },
        {
          kind: 'doc',
          label: 'Claude Code install path',
          value: 'docs/ecosystem/claude-code-quickstart.md',
        },
        {
          kind: 'json',
          label: 'Claude Code sample config',
          value: 'docs/ecosystem/examples/agent-target-packet.claude-code.json',
        },
        {
          kind: 'json',
          label: 'Skills catalog sample config',
          value: 'docs/ecosystem/examples/public-skills-catalog.json',
        },
        {
          kind: 'command',
          label: 'Proof loop export',
          value:
            'pnpm cli:read-only -- public-skills-catalog --output .runtime-cache/cli/public-skills-catalog.json',
        },
      ],
      mustNotClaim: [
        'Public skills pack already shipped',
        'Official skill distribution already exists',
      ],
      nextHumanStep:
        'If a real official Claude Code or skills surface is later confirmed, sync this bundle there; otherwise keep this repo-owned bundle as the strongest truthful public distribution surface.',
    },
    {
      id: 'plugin-marketplace',
      label: 'Plugin / marketplace packet',
      repoOwnedStatus: 'plugin-level-public-distribution-bundle',
      publicReleaseState: 'not-yet-published',
      summary:
        'Packages Codex and Claude Code starter bundles, sample configs, install docs, proof loops, and listing payloads as a repo-owned plugin-level public distribution bundle without implying that any official marketplace entry already exists.',
      primaryCommand: 'pnpm cli:read-only -- plugin-marketplace-metadata',
      artifacts: [
        {
          kind: 'doc',
          label: 'Ready-to-sync packet',
          value: 'docs/ecosystem/plugin-marketplace-metadata.ready.md',
        },
        {
          kind: 'doc',
          label: 'Codex install path',
          value: 'docs/ecosystem/codex-quickstart.md',
        },
        {
          kind: 'doc',
          label: 'Claude Code install path',
          value: 'docs/ecosystem/claude-code-quickstart.md',
        },
        {
          kind: 'command',
          label: 'Codex proof loop export',
          value:
            'pnpm cli:read-only -- plugin-marketplace-metadata --target codex --output .runtime-cache/cli/plugin-marketplace-metadata.codex.json',
        },
        {
          kind: 'command',
          label: 'Claude Code proof loop export',
          value:
            'pnpm cli:read-only -- plugin-marketplace-metadata --target claude-code --output .runtime-cache/cli/plugin-marketplace-metadata.claude-code.json',
        },
        {
          kind: 'command',
          label: 'Machine-readable metadata packet',
          value: 'pnpm cli:read-only -- plugin-marketplace-metadata',
        },
        {
          kind: 'command',
          label: 'Codex starter bundle packet',
          value: 'pnpm cli:read-only -- agent-target-packet --target codex',
        },
        {
          kind: 'command',
          label: 'Claude Code starter bundle packet',
          value:
            'pnpm cli:read-only -- agent-target-packet --target claude-code',
        },
        {
          kind: 'json',
          label: 'Codex sample config',
          value: 'docs/ecosystem/examples/agent-target-packet.codex.json',
        },
        {
          kind: 'json',
          label: 'Claude Code sample config',
          value: 'docs/ecosystem/examples/agent-target-packet.claude-code.json',
        },
        {
          kind: 'json',
          label: 'Codex listing payload',
          value:
            'docs/ecosystem/examples/plugin-marketplace-metadata.codex.json',
        },
        {
          kind: 'json',
          label: 'Claude Code listing payload',
          value:
            'docs/ecosystem/examples/plugin-marketplace-metadata.claude-code.json',
        },
      ],
      mustNotClaim: [
        'Marketplace package already live',
        'Official plugin already published',
        'Official listing already confirmed',
      ],
      nextHumanStep:
        'Use this bundle on the strongest truthful public distribution surface today, and only move into an official listing flow after the real official surface and auth path are confirmed.',
    },
  ],
});
