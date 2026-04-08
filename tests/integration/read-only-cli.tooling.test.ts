import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { builderIntegrationSurfaceSchema } from '../../packages/contracts/src/builder-integration-surface';
import { providerRuntimeSeamSchema } from '../../packages/contracts/src/provider-runtime-seam';
import { builderOutcomeBundleSchema } from '../../packages/runtime/src/builder-outcome-bundle';
import {
  parseReadOnlyCliArgs,
  buildReadOnlyCliPayload,
  defaultOutputPathForCommand,
  renderReadOnlyCliHelp,
  readOnlyCliMain,
} from '../../tooling/cli/read-only';

describe('read-only cli tooling', () => {
  it('parses the repo-local read-only CLI command shape', () => {
    expect(
      parseReadOnlyCliArgs(['outcome-bundle', '--app', 'ext-kroger'])
    ).toMatchObject({
      command: 'outcome-bundle',
      appId: 'ext-kroger',
    });
  });

  it('renders a help surface that keeps commands, targets, and boundaries visible', () => {
    const help = renderReadOnlyCliHelp();

    expect(help).toContain('Shopflow read-only CLI');
    expect(help).toContain('agent-integration-bundle');
    expect(help).toContain('agent-target-packet');
    expect(help).toContain('public-mcp-capability-map');
    expect(help).toContain('public-skills-catalog');
    expect(help).toContain('plugin-marketplace-metadata --target codex');
    expect(help).toContain(
      'Allowed: codex, claude-code, opencode, openhands, openclaw'
    );
    expect(help).toContain('repo-local only');
    expect(help).toContain('not proof of published public CLI / MCP / skills / plugin surfaces');
  });

  it('maps default output paths for repo-local payload files', () => {
    expect(defaultOutputPathForCommand('public-distribution-bundle')).toContain(
      '.runtime-cache/cli/public-distribution-bundle.json'
    );
    expect(
      defaultOutputPathForCommand(
        'agent-target-packet',
        'ext-albertsons',
        'opencode'
      )
    ).toContain('.runtime-cache/cli/agent-target-packet.opencode.json');
  });

  it('emits the builder integration surface through one CLI entrypoint', () => {
    const payload = buildReadOnlyCliPayload({
      command: 'integration-surface',
    });

    expect(builderIntegrationSurfaceSchema.parse(payload).surfaceId).toBe(
      'builder-integration-surface'
    );
  });

  it('emits the agent integration bundle through one CLI entrypoint', () => {
    const payload = buildReadOnlyCliPayload({
      command: 'agent-integration-bundle',
    }) as {
      surfaceId: string;
      profiles: Array<{ target: string }>;
    };

    expect(payload.surfaceId).toBe('agent-integration-bundle');
    expect(payload.profiles.map((profile) => profile.target)).toEqual([
      'codex',
      'claude-code',
      'opencode',
      'openhands',
      'openclaw',
    ]);
  });

  it('emits a target-specific agent handoff packet through one CLI entrypoint', () => {
    const codexPacket = buildReadOnlyCliPayload({
      command: 'agent-target-packet',
      target: 'codex',
    }) as {
      surfaceId: string;
      target: string;
      capabilities: Array<{ id: string }>;
      skills: Array<{ id: string }>;
      pluginMetadata: { target: string } | null;
    };
    const openCodePacket = buildReadOnlyCliPayload({
      command: 'agent-target-packet',
      target: 'opencode',
    }) as {
      target: string;
      placement: string;
      pluginMetadata: { target: string } | null;
    };
    const openHandsPacket = buildReadOnlyCliPayload({
      command: 'agent-target-packet',
      target: 'openhands',
    }) as {
      target: string;
      placement: string;
      pluginMetadata: { target: string } | null;
    };

    expect(codexPacket.surfaceId).toBe('agent-target-packet');
    expect(codexPacket.target).toBe('codex');
    expect(
      codexPacket.capabilities.some(
        (entry) => entry.id === 'public-distribution-bundle'
      )
    ).toBe(true);
    expect(
      codexPacket.skills.some(
        (entry) => entry.id === 'shopflow-builder-facing-discoverability-and-ready-sync'
      )
    ).toBe(true);
    expect(codexPacket.pluginMetadata?.target).toBe('codex');
    expect(openCodePacket.target).toBe('opencode');
    expect(openCodePacket.placement).toBe('ecosystem-secondary');
    expect(openCodePacket.pluginMetadata).toBeNull();
    expect(openHandsPacket.target).toBe('openhands');
    expect(openHandsPacket.placement).toBe('ecosystem-secondary');
    expect(openHandsPacket.pluginMetadata).toBeNull();
  });

  it('explains the supported agent targets when a target-specific packet request is invalid', () => {
    expect(() =>
      buildReadOnlyCliPayload({
        command: 'agent-target-packet',
      })
    ).toThrow(
      'Missing --target for agent-target-packet. Allowed values: codex, claude-code, opencode, openhands, openclaw'
    );

    expect(() =>
      buildReadOnlyCliPayload({
        command: 'agent-target-packet',
        target: 'bad-target',
      })
    ).toThrow(
      'Unknown --target for agent-target-packet: bad-target. Allowed values: codex, claude-code, opencode, openhands, openclaw'
    );
  });

  it('emits the public MCP capability map through one CLI entrypoint', () => {
    const payload = buildReadOnlyCliPayload({
      command: 'public-mcp-capability-map',
    }) as {
      repoOwnedStatus: string;
      capabilities: Array<{ id: string }>;
    };

    expect(payload.repoOwnedStatus).toBe('ready-to-sync-packet');
    expect(payload.capabilities.some((capability) => capability.id === 'runtime-seam')).toBe(
      true
    );
  });

  it('emits the public skills catalog through one CLI entrypoint', () => {
    const payload = buildReadOnlyCliPayload({
      command: 'public-skills-catalog',
    }) as {
      repoOwnedStatus: string;
      entries: Array<{ id: string }>;
    };

    expect(payload.repoOwnedStatus).toBe(
      'plugin-level-public-distribution-bundle'
    );
    expect(
      payload.entries.some(
        (entry) => entry.id === 'shopflow-read-only-runtime-seam-consumption'
      )
    ).toBe(true);
  });

  it('emits the plugin marketplace packet and target-specific metadata through CLI entrypoints', () => {
    const packet = buildReadOnlyCliPayload({
      command: 'plugin-marketplace-metadata',
    }) as {
      repoOwnedStatus: string;
      entries: Array<{ target: string }>;
    };
    const openClawEntry = buildReadOnlyCliPayload({
      command: 'plugin-marketplace-metadata',
      target: 'openclaw',
    }) as {
      target: string;
      packagingState: string;
    };

    expect(packet.repoOwnedStatus).toBe(
      'plugin-level-public-distribution-bundle'
    );
    expect(packet.entries.some((entry) => entry.target === 'codex')).toBe(true);
    expect(openClawEntry.target).toBe('openclaw');
    expect(openClawEntry.packagingState).toBe('ready-to-publish-packet');
  });

  it('explains the supported plugin targets when an unknown target is requested', () => {
    expect(() =>
      buildReadOnlyCliPayload({
        command: 'plugin-marketplace-metadata',
        target: 'unknown-target',
      })
    ).toThrow(
      'Unknown --target for plugin-marketplace-metadata: unknown-target. Allowed values: codex, claude-code, openclaw'
    );
  });

  it('emits the provider-runtime seam through one CLI entrypoint', () => {
    const payload = buildReadOnlyCliPayload({
      command: 'runtime-seam',
    });

    expect(providerRuntimeSeamSchema.parse(payload).surfaceId).toBe(
      'provider-runtime-seam'
    );
  });

  it('parses the thin runtime consumer command shape', () => {
    expect(
      parseReadOnlyCliArgs([
        'runtime-consumer',
        '--base-url',
        'http://127.0.0.1:4317/',
      ])
    ).toMatchObject({
      command: 'runtime-consumer',
      baseUrl: 'http://127.0.0.1:4317/',
    });
  });

  it('emits a thin runtime consumer snapshot through one CLI entrypoint', () => {
    const payload = buildReadOnlyCliPayload({
      command: 'runtime-consumer',
      baseUrl: 'http://127.0.0.1:4317/',
    }) as {
      surfaceId: string;
      enabled: boolean;
      routes: Array<{ providerId: string }>;
    };

    expect(payload.surfaceId).toBe('provider-runtime-consumer');
    expect(payload.enabled).toBe(true);
    expect(payload.routes.some((route) => route.providerId === 'chatgpt')).toBe(
      true
    );
  });

  it('emits the public distribution bundle through one CLI entrypoint', () => {
    const payload = buildReadOnlyCliPayload({
      command: 'public-distribution-bundle',
    }) as {
      surfaceId: string;
      channels: Array<{ id: string }>;
    };

    expect(payload.surfaceId).toBe('public-distribution-bundle');
    expect(payload.channels.map((channel) => channel.id)).toEqual([
      'public-api',
      'public-mcp',
      'public-skills',
      'plugin-marketplace',
    ]);
  });

  it('emits a joined outcome bundle for a requested app', () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'shopflow-read-only-cli-'));
    const runtimePayloadDirectory = join(tempRoot, 'builder');

    try {
      const payload = buildReadOnlyCliPayload({
        command: 'outcome-bundle',
        appId: 'ext-kroger',
        generatedAt: '2026-04-03T19:00:00.000Z',
        runtimePayloadDirectory,
      });

      const bundle = builderOutcomeBundleSchema.parse(payload);

      expect(bundle.appId).toBe('ext-kroger');
      expect(bundle.generatedAt).toBe('2026-04-03T19:00:00.000Z');
      expect(bundle.payloadSources.builderAppSnapshot.kind).toBe(
        'checked-in-example'
      );
      expect(existsSync(runtimePayloadDirectory)).toBe(false);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  it('emits the current submission-readiness report', () => {
    const payload = buildReadOnlyCliPayload({
      command: 'submission-readiness',
    }) as { entries: Array<{ appId: string }> };

    expect(payload.entries.some((entry) => entry.appId === 'ext-albertsons')).toBe(
      true
    );
  });

  it('prints JSON through the repo-local CLI main entrypoint', async () => {
    const stdout = vi
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true);

    try {
      await readOnlyCliMain(['integration-surface']);

      expect(stdout).toHaveBeenCalledTimes(1);
      const printed = stdout.mock.calls[0]?.[0];
      expect(
        builderIntegrationSurfaceSchema.parse(JSON.parse(String(printed)))
          .surfaceId
      ).toBe('builder-integration-surface');
    } finally {
      stdout.mockRestore();
    }
  });
});
