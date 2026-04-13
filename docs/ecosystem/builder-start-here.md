# Builder Start Here

This is the quickest honest front door for builder-facing Shopflow surfaces.

In plain language:

> if you only have 10-30 seconds, this page tells you which door to open first.

## What You Can Consume Today

Shopflow already exposes a truthful, read-only builder layer:

- typed contracts
- read-only provider-runtime seam contract
- a read-only stdio MCP surface for four core repo-truth tools
- builder app snapshots
- workflow decision briefs
- workflow-copilot briefs
- repo-local outcome bundle tooling
- review-bundle and submission-readiness artifact pointers

What it still does **not** expose today:

- public API transport
- public MCP endpoint
- public SDK
- public CLI commitment
- an automatic official plugin or marketplace listing where the target ecosystem does not actually provide one

## Pick the Right Door

| If you need...                                                                           | Start here                                                                                                      | Why this is the shortest truthful path                                                                                                                                                                   |
| :--------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| one machine-readable map of `today / current-scope now / later / no-go / owner-decision` | `@shopflow/contracts:builderIntegrationSurface` and [Builder Read Models](./builder-read-models.md)             | this is the contract layer that names what is real now versus future-facing                                                                                                                              |
| the explicit boundary between Shopflow truth and external provider/runtime acquisition    | `@shopflow/contracts:providerRuntimeSeam` and [ADR-004](../adr/ADR-004-switchyard-provider-runtime-seam.md)     | this is the cleanest way to see that Switchyard-style runtime acquisition is a read-only seam contract here, not merchant live-proof or a second Shopflow logic plane                                   |
| one thin consumer snapshot wired to a real Switchyard base URL                            | `pnpm cli:read-only -- runtime-consumer --base-url http://127.0.0.1:4317` and [Integration Recipes](./integration-recipes.md) | this consumes the seam through a real repo-local route map without turning Shopflow into a provider runtime product                                                                                     |
| repo-local generated payload files before you emit the joined bundle                     | `pnpm builder:write-runtime-payloads -- --app ext-amazon` and [Integration Recipes](./integration-recipes.md)   | this writes builder snapshot / decision brief / workflow brief JSON under `.runtime-cache/builder` for supported current-scope apps such as `ext-albertsons`, `ext-amazon`, `ext-kroger`, and `ext-temu` |
| one joined read-only bundle for a coding tool or agent                                   | `pnpm builder:write-outcome-bundle -- --stdout`                                                                 | this emits one repo-local JSON bundle instead of making you stitch examples and artifact pointers by hand                                                                                                |
| one real MCP server that an AI tool can attach to today                                   | `pnpm mcp:stdio` and [MCP Quickstart](./mcp-quickstart.md)                                                       | this is the live repo-local stdio transport for the core read-only surfaces, not just a packet describing future MCP work                                                                                |
| one repo-local CLI-shaped entry for the same read-only surfaces                          | `pnpm cli:read-only -- integration-surface` or `pnpm cli:read-only -- runtime-seam`                           | this is a local convenience wrapper around existing read-only surfaces, not a public CLI commitment                                                                                                     |
| the shortest agent-specific start for Codex, Claude Code, or OpenClaw                  | [Agent Quickstarts](./agent-quickstarts.md) and `pnpm cli:read-only -- agent-target-packet --target <target>` | this keeps agent onboarding concrete while separating real public-distribution work from ecosystems that do or do not have an official public surface                                                    |
| checked-in example payloads without running any command                                  | [Examples Index](./examples/README.md)                                                                          | this is the fastest no-runtime path when you need the multi-app current-scope example rack for `ext-albertsons`, `ext-amazon`, `ext-kroger`, and `ext-temu`                                              |
| refresh the checked-in example rack before review or docs sync                           | `pnpm builder:refresh-example-rack` and [Examples Index](./examples/README.md)                                  | this refreshes the checked-in multi-app example rack from repo-owned generated runtime payloads instead of relying on hand-maintained JSON                                                               |
| step-by-step integration recipes                                                         | [Integration Recipes](./integration-recipes.md)                                                                 | this page translates the current-scope surfaces into concrete read-only usage flows                                                                                                                      |
| checked-in distribution examples without internal sync packets                           | [Agent Distribution Artifacts](./agent-distribution-artifacts.md)                                                | this keeps public readers on the current artifact rack instead of routing them into L1-owned sync copy drawers                                                                                          |
| one repo-owned packet for current package / plugin / skills / marketplace execution, plus future API / MCP transport | `pnpm cli:read-only -- public-distribution-bundle` and [Agent Quickstarts](./agent-quickstarts.md)              | this keeps the machine-readable distribution story visible without treating a ready-to-sync packet as a public front-door page                                                                           |
| ecosystem wording boundaries for Codex / Claude Code / OpenCode / OpenHands / OpenClaw   | [Agent and MCP Positioning](./agent-and-mcp-positioning.md) and [Integration Recipes](./integration-recipes.md) | these pages keep ecosystem references truthful and prevent marketplace or plugin overclaim                                                                                                               |

## Fastest Current-Scope Path

1. Read [Builder Read Models](./builder-read-models.md) if you need the contract and schema layer.
2. Read [ADR-004](../adr/ADR-004-switchyard-provider-runtime-seam.md) if your builder flow also needs the explicit external runtime seam boundary.
3. Run `pnpm cli:read-only -- runtime-consumer --base-url http://127.0.0.1:4317` if you want a real repo-local consumer of the Switchyard seam before you touch any public-surface story.
4. Run `pnpm builder:write-runtime-payloads -- --app ext-amazon` if you want repo-local generated payload files first.
5. Run `pnpm builder:refresh-example-rack` if you need the checked-in multi-app rack refreshed before review or docs sync.
6. Run `pnpm builder:write-outcome-bundle -- --stdout` if you need one joined read-only bundle immediately.
7. Run `pnpm mcp:stdio` when you need a real repo-local MCP transport instead of only packet JSON.
8. Run `pnpm cli:read-only -- integration-surface` or `pnpm cli:read-only -- runtime-seam` if you want one repo-local CLI-shaped entry without turning that into a public CLI promise.
9. Open [Integration Recipes](./integration-recipes.md) if you are wiring a builder, agent, or coding tool to the current repo-owned surfaces.
10. Open [Agent Quickstarts](./agent-quickstarts.md) or run `pnpm cli:read-only -- agent-target-packet --target codex` when you need a Codex / Claude Code / OpenClaw-specific entry without inventing an official listing where none exists.
11. Run `pnpm cli:read-only -- public-distribution-bundle` when you need the repo-owned package / plugin / skills / plugin-marketplace packet without overclaiming publication.
12. Keep external sync copy in the L1-owned governance lane; the public builder shelf stops at reader-facing docs, commands, and checked-in examples.

## Do Not Assume These Yet

- do not assume a public API already exists
- do not assume a public MCP already exists
- do not assume a public SDK or CLI commitment already exists
- do not confuse the repo-local CLI prototype with a public CLI commitment
- do not treat ready-to-sync copy as already synced copy
- do not treat builder-facing docs as proof of public-ready support
