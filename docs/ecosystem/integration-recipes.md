# Integration Recipes

This page turns Shopflow's current builder-facing surfaces into concrete,
read-only recipes.

In plain language:

> it is the instruction card next to the machine, not a promise that the machine
> already lives on the public internet.

## Recipe 1: Inspect the Truth Buckets

Use this when you need one machine-readable answer to:

- what is real today
- what is current-scope now
- what is later
- what is no-go
- what still needs owner decision

```ts
import {
  builderIntegrationSurface,
  builderIntegrationSurfaceSchema,
} from '@shopflow/contracts';

const surface = builderIntegrationSurfaceSchema.parse(
  builderIntegrationSurface
);
console.log(surface.apiSubstrateFirst);
```

Why this matters:

> this is the contract layer, so it is safer than guessing from prose.

## Recipe 2: Emit One Joined Outcome Bundle

Use this when you want one read-only JSON bundle that joins:

- the builder integration surface
- generated runtime payload files when they exist, otherwise checked-in example payloads
- generated release-artifact summaries plus source pointers when those files already exist
- ready-to-sync copy pointers

```bash
pnpm builder:write-outcome-bundle -- --stdout
```

Write it to a file if you want a local artifact:

```bash
pnpm builder:write-outcome-bundle -- --output .runtime-cache/builder/builder-outcome-bundle.json
```

Why this matters:

> it gives a coding tool one box to open instead of three drawers to search.
> When release artifacts already exist, it also gives that tool the current
> app's real packaging and submission-readiness summary instead of only
> filenames.
> When repo-local builder payload files already exist in `.runtime-cache/builder`,
> it prefers those generated payloads over the checked-in example rack.

## Recipe 2.1: Inspect the Provider-Runtime Seam Without Overclaiming Runtime Ownership

Use this when you need the exact boundary between Shopflow truth and an
external runtime acquisition layer before wiring any builder or agent flow.

```ts
import {
  providerRuntimeSeam,
  providerRuntimeSeamSchema,
} from '@shopflow/contracts';

const seam = providerRuntimeSeamSchema.parse(providerRuntimeSeam);
console.log(seam.runtimeOwns, seam.shopflowOwns, seam.noGo);
```

Why this matters:

> this is the cleanest way to answer “where does Switchyard-style runtime work
> begin?” without accidentally turning that seam into merchant live-proof or a
> second Shopflow logic plane.

## Recipe 2.25: Use the Repo-Local Read-Only CLI Prototype

Use this when you want one local command entry for the same read-only surfaces
without claiming that Shopflow already ships a public CLI.

```bash
pnpm cli:read-only -- agent-integration-bundle
pnpm cli:read-only -- agent-target-packet --target codex
pnpm cli:read-only -- integration-surface
pnpm cli:read-only -- runtime-seam
pnpm cli:read-only -- runtime-consumer --base-url http://127.0.0.1:4317
pnpm cli:read-only -- public-distribution-bundle
pnpm cli:read-only -- outcome-bundle --app ext-kroger
pnpm cli:read-only -- submission-readiness
```

Why this matters:

> it is a local convenience wrapper around existing read-only surfaces.
> it is not a public CLI promise.
>
> `agent-integration-bundle` is the machine-readable onboarding packet for
> Codex / Claude Code / OpenClaw positioning, plus MCP/skills/plugin metadata
> scaffolds.
>
> `agent-target-packet --target <target>` is the smaller per-ecosystem packet
> when one tool only needs its own route instead of the full onboarding bundle.
>
> for `outcome-bundle`, this path now reads existing generated payloads or the
> checked-in example rack. It does **not** backfill `.runtime-cache/builder/*`
> as a hidden side effect.

## Recipe 2.26: Emit the Agent Integration Bundle

Use this when you need one repo-owned packet for:

- Codex quickstart routing
- Claude Code quickstart routing
- OpenClaw public-ready install / discovery / proof packet
- MCP capability prep
- skills catalog packet
- plugin / marketplace listing payload bundles

```bash
pnpm cli:read-only -- agent-integration-bundle
pnpm cli:read-only -- agent-target-packet --target codex
pnpm cli:read-only -- agent-target-packet --target claude-code
pnpm cli:read-only -- agent-target-packet --target openclaw
pnpm cli:read-only -- public-mcp-capability-map
pnpm cli:read-only -- public-skills-catalog
pnpm cli:read-only -- plugin-marketplace-metadata
```

Why this matters:

> it gives coding-agent consumers both one full onboarding packet and one
> smaller per-target packet instead of making them infer the route from five
> different docs pages.

## Recipe 2.4: Emit the Public Distribution Packet Without Pretending Publication Already Happened

Use this when you need one repo-owned packet for:

- public read-only API prep
- public read-only MCP prep
- public skills packet prep
- plugin / marketplace metadata and checklist prep

```bash
pnpm cli:read-only -- public-distribution-bundle
```

Why this matters:

> it turns Wave 18 from a list of future nouns into one concrete handoff
> packet, while still keeping the public release boundary honest.

## Recipe 2.3: Consume the Switchyard Seam Through a Real Thin Consumer

Use this when you already have a real Switchyard base URL and need one
repo-local route map that consumes the seam instead of stopping at the contract
description.

```bash
pnpm cli:read-only -- runtime-consumer --base-url http://127.0.0.1:4317
```

Why this matters:

> this is the first thin consumer slice.
> it proves Shopflow can consume the seam through a real route map without
> pretending Switchyard is merchant live proof or a public runtime product.

## Recipe 2.5: Generate Runtime Payload Files First

Use this when you want repo-local generated payload files for a supported
current-scope app before emitting the joined bundle.

```bash
pnpm builder:write-runtime-payloads -- --app ext-temu
```

What this writes:

- `.runtime-cache/builder/builder-app-snapshot.ext-temu.json`
- `.runtime-cache/builder/operator-decision-brief.ext-temu.json`
- `.runtime-cache/builder/workflow-copilot-brief.ext-temu.json`
- the same three files also work today for `ext-albertsons`, `ext-amazon`, and `ext-kroger`

Why this matters:

> it turns the current builder-facing payloads into generated runtime files that
> the outcome bundle can consume without silently treating checked-in examples
> as if they were live runtime output.

## Recipe 3: Consume Checked-In Examples Without Running Commands

Use this when you only need sample payloads and want zero runtime work.

- [Examples Index](./examples/README.md)
- the checked-in rack currently covers `ext-albertsons`, `ext-amazon`, `ext-kroger`, and `ext-temu`

Why this matters:

> examples are the fastest demo path, but they are still samples, not a public API surface.

## Recipe 3.5: Refresh the Checked-In Multi-App Example Rack

Use this when repo-owned generated payload truth changed and you need the
checked-in examples to catch up without hand-editing JSON.

```bash
pnpm builder:refresh-example-rack
```

What this refreshes:

- `docs/ecosystem/examples/builder-app-snapshot.<appId>.json`
- `docs/ecosystem/examples/operator-decision-brief.<appId>.json`
- `docs/ecosystem/examples/workflow-copilot-brief.<appId>.json`
- `docs/ecosystem/examples/builder-outcome-bundle.<appId>.json`

Current example-rack apps:

- `ext-albertsons`
- `ext-amazon`
- `ext-kroger`
- `ext-temu`

Why this matters:

> it keeps the checked-in rack tied to repo-owned generated truth, not a hand-maintained sample shelf.

## Recipe 4: Keep Sync Copy Out of the Public Shelf

Use this when repo truth is ahead of external permissions and you need to keep
public docs clean while still preserving sync material for the next operator.

- public readers should stay on:
  - [Builder Start Here](./builder-start-here.md)
  - [Agent Quickstarts](./agent-quickstarts.md)
  - [Agent Distribution Artifacts](./agent-distribution-artifacts.md)
- L1-owned sync copy packets now live off the public docs shelf

Why this matters:

> public docs should explain the product and the real read-only surfaces.
> sync copy is still useful, but it belongs in the operator packet drawer, not
> in the customer-facing aisle.

## Recipe 5: Keep Ecosystem References Honest

Use this when you need to name ecosystem targets without turning Shopflow into a
fake public platform.

- [Agent and MCP Positioning](./agent-and-mcp-positioning.md)

Current truthful stance:

- `Codex` and `Claude Code` are front-door builder-fit examples
- `OpenCode` and `OpenHands` are ecosystem-secondary
- `OpenClaw` is now a public-ready route for install, discovery, and proof
- `MCP` transport and public API transport remain later
- package / plugin / skills / catalog / marketplace distribution work is current-scope now

If you need the target-specific entrypoints instead of the matrix language, use:

- [Agent Quickstarts](./agent-quickstarts.md)
- [Agent Distribution Artifacts](./agent-distribution-artifacts.md)
- [Codex Quickstart](./codex-quickstart.md)
- [Claude Code Quickstart](./claude-code-quickstart.md)
- [OpenClaw Public-Ready Packet](./openclaw-comparison.md)

## Official Ecosystem Shapes We Verified

This table is intentionally conservative. It only lists shapes we verified from
current official docs or official project repos. It does **not** imply that
Shopflow already ships first-class integration for any of them.

| Ecosystem     | Official shapes we verified                                                                 | Safe wording for Shopflow now                                            | Keep out of the main builder front door? |
| :------------ | :------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------- | :--------------------------------------- |
| `Codex`       | cloud/web experience, CLI, IDE extension, GitHub `@codex`, docs MCP, SDK, Slack integration | strong builder-fit example for consuming read-only Shopflow surfaces     | No                                       |
| `Claude Code` | terminal tool, skills, hooks, MCP, GitHub Actions                                           | strong builder-fit example for consuming read-only Shopflow surfaces     | No                                       |
| `OpenCode`    | plugins, GitHub integration, SDK, MCP support                                               | useful comparison or later-facing packaging reference                    | Yes                                      |
| `OpenHands`   | CLI, cloud UI, GitHub integration, MCP, microagents                                         | useful comparison for agentic workflow and read-only integration recipes | Yes                                      |
| `OpenClaw`    | ClawHub official plugin surface, npm fallback, and plugin-style packaging in the official ecosystem repo | public-ready install/discovery/proof route below official-live claims | No                                       |

## Safe Wording and Unsafe Wording

### Safe wording

- `Shopflow already exposes read-only builder surfaces that fit terminal and agentic coding workflows such as Codex or Claude Code.`
- `Shopflow's current builder-facing layer is repo-local, read-only, and machine-readable.`
- `OpenCode` and `OpenHands` are useful comparison ecosystems when planning later packaging or integration paths.`
- `OpenClaw` is now a public-ready secondary route with an explicit install path, discovery path, and proof loop.`

### Unsafe wording

- `Shopflow ships an official Codex integration today.`
- `Shopflow already has a public MCP for Claude Code.`
- `Shopflow now ships an SDK or plugin package across coding-agent marketplaces.`
- `Shopflow already supports OpenCode/OpenHands/OpenClaw as first-class integrations.`

## Official Sources

- [OpenAI Codex cloud](https://developers.openai.com/codex/cloud)
- [OpenAI Docs MCP](https://developers.openai.com/learn/docs-mcp)
- [OpenAI Codex GA announcement](https://openai.com/index/codex-now-generally-available/)
- [Claude Code slash commands and skills](https://docs.anthropic.com/en/docs/claude-code/slash-commands)
- [Claude Code settings, hooks, and MCP](https://docs.anthropic.com/en/docs/claude-code/settings)
- [OpenCode plugins](https://opencode.ai/docs/plugins/)
- [OpenCode GitHub integration](https://opencode.ai/docs/github/)
- [OpenCode SDK](https://opencode.ai/docs/sdk/)
- [OpenHands MCP settings](https://docs.all-hands.dev/openhands/usage/settings/mcp-settings)
- [OpenHands CLI](https://docs.all-hands.dev/openhands/usage/cli/terminal)
- [OpenHands GitHub installation](https://docs.all-hands.dev/openhands/usage/cloud/github-installation)
- [OpenHands microagents](https://docs.all-hands.dev/openhands/usage/microagents/microagents-org)
- [OpenClaw ecosystem repo](https://github.com/openclaw/nix-openclaw)
