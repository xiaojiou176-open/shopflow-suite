# Agent Quickstarts

This page is the shortest honest map for coding tools that want to consume
Shopflow's current repo-local, read-only surfaces.

In plain language:

> this is the boarding gate sign for agent users.
> it tells Codex and Claude Code where to queue first, and it now gives
> OpenClaw a real public-ready lane instead of leaving it parked on the
> comparison shelf.

If you want the **actual MCP transport** first instead of target-specific
packets, start here:

- [MCP Quickstart](./mcp-quickstart.md)
- `pnpm mcp:stdio`

## Fastest Honest Entry by Target

| Target        | Current placement   | Start here                                               | Fastest command                                                  | No-runtime artifact                                                                       |
| :------------ | :------------------ | :------------------------------------------------------- | :--------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| `Codex`       | front-door primary  | [Codex Quickstart](./codex-quickstart.md)                | `pnpm cli:read-only -- agent-target-packet --target codex`       | [`agent-target-packet.codex.json`](./examples/agent-target-packet.codex.json)             |
| `Claude Code` | front-door primary  | [Claude Code Quickstart](./claude-code-quickstart.md)    | `pnpm cli:read-only -- agent-target-packet --target claude-code` | [`agent-target-packet.claude-code.json`](./examples/agent-target-packet.claude-code.json) |
| `OpenCode`    | ecosystem secondary | [Integration Recipes](./integration-recipes.md)          | `pnpm cli:read-only -- agent-target-packet --target opencode`    | [`agent-target-packet.opencode.json`](./examples/agent-target-packet.opencode.json)       |
| `OpenHands`   | ecosystem secondary | [Integration Recipes](./integration-recipes.md)          | `pnpm cli:read-only -- agent-target-packet --target openhands`   | [`agent-target-packet.openhands.json`](./examples/agent-target-packet.openhands.json)     |
| `OpenClaw`    | public-ready target | [OpenClaw Public-Ready Packet](./openclaw-comparison.md) | `pnpm cli:read-only -- agent-target-packet --target openclaw`    | [`agent-target-packet.openclaw.json`](./examples/agent-target-packet.openclaw.json)       |

## One Machine-Readable Packet

Use this when you want the same answer as JSON instead of prose:

```bash
pnpm cli:read-only -- agent-integration-bundle
pnpm cli:read-only -- agent-target-packet --target codex
pnpm cli:read-only -- agent-target-packet --target claude-code
pnpm cli:read-only -- agent-target-packet --target opencode
pnpm cli:read-only -- agent-target-packet --target openhands
pnpm cli:read-only -- agent-target-packet --target openclaw
pnpm cli:read-only -- public-mcp-capability-map
pnpm cli:read-only -- public-skills-catalog
pnpm cli:read-only -- plugin-marketplace-metadata
```

That packet now includes:

- agent-specific onboarding profiles
- smaller target-specific handoff packets
- a repo-owned MCP capability map
- a repo-owned skills catalog packet
- plugin / marketplace listing payloads plus starter-bundle companion fields

If you need a live repo-local MCP transport instead of JSON packet exports, run:

```bash
pnpm mcp:stdio
```

If you want the CLI to show the exact supported commands, targets, and `--output`
shape first, run:

```bash
pnpm cli:read-only --help
```

If you want checked-in JSON examples instead of the live CLI output, open
[Agent Distribution Artifacts](./agent-distribution-artifacts.md).

## Codex / Claude Code Public Distribution Matrix

This is the current truthful matrix for the two front-door targets.

| Target        | Current bundle state                    | Starter bundle                                                       | Sample config                                                         | Install docs                               | Proof loop                                                                                                                            | Metadata / listing payload                     | Must not claim                             |
| :------------ | :-------------------------------------- | :------------------------------------------------------------------- | :-------------------------------------------------------------------- | :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------- | :----------------------------------------- |
| `Codex`       | plugin-level public distribution bundle | `agent-target-packet.codex.json` + quickstart                        | `agent-target-packet.codex.json`                                      | `docs/ecosystem/codex-quickstart.md`       | `pnpm cli:read-only -- plugin-marketplace-metadata --target codex --output .runtime-cache/cli/plugin-marketplace-metadata.codex.json` | `plugin-marketplace-metadata.codex.json`       | Codex-owned publication surface or listing |
| `Claude Code` | plugin-level public distribution bundle | `agent-target-packet.claude-code.json` + quickstart + skills catalog | `agent-target-packet.claude-code.json` + `public-skills-catalog.json` | `docs/ecosystem/claude-code-quickstart.md` | `pnpm cli:read-only -- public-skills-catalog --output .runtime-cache/cli/public-skills-catalog.json`                                  | `plugin-marketplace-metadata.claude-code.json` | official Claude Code listing               |

In plain language:

> these two are no longer just metadata skeletons on a clipboard.
> they now have boxed starter bundles you can hand to a user or another tool.
> what they still do **not** have is proof of an official store shelf.

## 30-Second Target-Specific Copy Path

Use this when you want the shortest copy-paste path instead of the full matrix:

| Target        | Best first command                                               | Best second command                                                   | Best companion doc                                       | Must not claim                                                                                                          |
| :------------ | :--------------------------------------------------------------- | :-------------------------------------------------------------------- | :------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| `Codex`       | `pnpm cli:read-only -- agent-target-packet --target codex`       | `pnpm cli:read-only -- plugin-marketplace-metadata --target codex`    | [Codex Quickstart](./codex-quickstart.md)                | official Codex integration, or claiming Shopflow is already listed or published on a Codex-owned publication surface    |
| `Claude Code` | `pnpm cli:read-only -- agent-target-packet --target claude-code` | `pnpm cli:read-only -- public-skills-catalog`                         | [Claude Code Quickstart](./claude-code-quickstart.md)    | official Claude Code integration, or claiming Shopflow is already listed or published on Claude Code's official surface |
| `OpenCode`    | `pnpm cli:read-only -- agent-target-packet --target opencode`    | `pnpm cli:read-only -- public-distribution-bundle`                    | [Integration Recipes](./integration-recipes.md)          | main hero placement or official OpenCode package                                                                        |
| `OpenHands`   | `pnpm cli:read-only -- agent-target-packet --target openhands`   | `pnpm cli:read-only -- public-distribution-bundle`                    | [Integration Recipes](./integration-recipes.md)          | main hero placement or official OpenHands package                                                                       |
| `OpenClaw`    | `pnpm cli:read-only -- agent-target-packet --target openclaw`    | `pnpm cli:read-only -- plugin-marketplace-metadata --target openclaw` | [OpenClaw Public-Ready Packet](./openclaw-comparison.md) | fake official listing, or pretending the GitHub/customPlugins route is already the official OpenClaw distribution lane  |

## Boundary Reminder

- these are **repo-local** and **read-only** onboarding surfaces
- they are not proof that Shopflow already ships a public HTTP MCP, public API,
  or published plugin/skills pack
- a repo-local read-only stdio MCP does exist today
- Codex and Claude Code are strong-fit examples today
- OpenClaw is now a public-ready target, but its GitHub/customPlugins route is
  still different from being officially listed on an OpenClaw-owned surface
