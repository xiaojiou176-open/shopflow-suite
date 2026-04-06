# Examples Index

This folder keeps the checked-in JSON examples that back Shopflow's builder-facing
read-only surfaces.

In plain language:

> this is the sample-card rack.
> it tells you which example to open first instead of making you guess from file names alone.

## Current Example Rack

The checked-in rack currently covers these current-scope apps:

- `ext-albertsons`
- `ext-amazon`
- `ext-kroger`
- `ext-temu`

It also now includes common agent/distribution example artifacts:

- [agent-integration-bundle.json](./agent-integration-bundle.json)
- [agent-target-packet.codex.json](./agent-target-packet.codex.json)
- [agent-target-packet.claude-code.json](./agent-target-packet.claude-code.json)
- [agent-target-packet.opencode.json](./agent-target-packet.opencode.json)
- [agent-target-packet.openhands.json](./agent-target-packet.openhands.json)
- [agent-target-packet.openclaw.json](./agent-target-packet.openclaw.json)
- [public-mcp-capability-map.json](./public-mcp-capability-map.json)
- [public-skills-catalog.json](./public-skills-catalog.json)
- [plugin-marketplace-metadata.codex.json](./plugin-marketplace-metadata.codex.json)
- [plugin-marketplace-metadata.claude-code.json](./plugin-marketplace-metadata.claude-code.json)
- [plugin-marketplace-metadata.openclaw.json](./plugin-marketplace-metadata.openclaw.json)

## Which Example Does What

| App              | Builder app snapshot                                   | Operator decision brief                                         | Workflow copilot brief                                         | Builder outcome bundle                                         |
| :--------------- | :----------------------------------------------------- | :-------------------------------------------------------------- | :------------------------------------------------------------- | :------------------------------------------------------------- |
| `ext-albertsons` | [snapshot](./builder-app-snapshot.ext-albertsons.json) | [decision brief](./operator-decision-brief.ext-albertsons.json) | [workflow brief](./workflow-copilot-brief.ext-albertsons.json) | [outcome bundle](./builder-outcome-bundle.ext-albertsons.json) |
| `ext-amazon`     | [snapshot](./builder-app-snapshot.ext-amazon.json)     | [decision brief](./operator-decision-brief.ext-amazon.json)     | [workflow brief](./workflow-copilot-brief.ext-amazon.json)     | [outcome bundle](./builder-outcome-bundle.ext-amazon.json)     |
| `ext-kroger`     | [snapshot](./builder-app-snapshot.ext-kroger.json)     | [decision brief](./operator-decision-brief.ext-kroger.json)     | [workflow brief](./workflow-copilot-brief.ext-kroger.json)     | [outcome bundle](./builder-outcome-bundle.ext-kroger.json)     |
| `ext-temu`       | [snapshot](./builder-app-snapshot.ext-temu.json)       | [decision brief](./operator-decision-brief.ext-temu.json)       | [workflow brief](./workflow-copilot-brief.ext-temu.json)       | [outcome bundle](./builder-outcome-bundle.ext-temu.json)       |

If you need repo-local generated runtime payload files instead of checked-in
samples, use `pnpm builder:write-runtime-payloads -- --app <appId>` for those
same current-scope apps.

If the checked-in rack needs to catch up with repo-owned generated truth, run:

```bash
pnpm builder:refresh-example-rack
```

That refresh command rewrites the checked-in examples from generated runtime
payload files and matching outcome bundles instead of relying on hand-maintained
JSON.

It also rewrites the common agent/distribution example artifacts listed above.

## Fastest Reading Order

1. Pick the app row first.
2. Open `builder-app-snapshot` if you want the raw app-state picture first.
3. Open `operator-decision-brief` if you want the shortest "why now / what next" answer.
4. Open `workflow-copilot-brief` if you want the AI-facing summary layer.
5. Open `builder-outcome-bundle` if you want one joined current-scope bundle.

## Pair These With

- [Builder Start Here](../builder-start-here.md) for the shortest truthful front door
- [Agent Distribution Artifacts](../agent-distribution-artifacts.md) for the checked-in agent/plugin/skills example rack
- [Integration Recipes](../integration-recipes.md) for task-shaped usage flows
- [Builder Read Models](../builder-read-models.md) for the schema and import layer

## What These Files Are Not

These files are not:

- public API responses
- public MCP payloads
- reviewed live-evidence packets
- proof that ready-to-sync copy has already been published
