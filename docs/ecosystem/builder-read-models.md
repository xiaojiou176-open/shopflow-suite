# Builder Read Models

This page describes the smallest truthful builder-facing substrate that
Shopflow exposes today.

In plain language:

> builders can already read Shopflow's typed workflow truth.
> they still cannot call a public API or public HTTP MCP endpoint.

If you are entering this area for the first time, start with
[Builder Start Here](./builder-start-here.md) before diving into schemas or
commands. If you want the checked-in JSON first, use
[Builder Examples Index](./examples/README.md).

## Today-Ready Surface

Today Shopflow exposes a **read-only builder snapshot** built from existing
runtime truth:

- store and verified-scope metadata from `@shopflow/contracts`
- latest detection state
- latest captured output state
- recent activity state
- evidence queue summary state
- one best route back into the current workflow

Code entrypoint:

```ts
import { createBuilderAppSnapshot } from '@shopflow/runtime';
```

Snapshot schema:

```ts
import { builderAppSnapshotSchema } from '@shopflow/runtime';
```

Shopflow also exposes a **workflow decision brief** that turns the same runtime
truth into one concise operator-facing explanation:

```ts
import { operatorDecisionBriefSchema } from '@shopflow/contracts';
import { createOperatorDecisionBrief } from '@shopflow/core';
```

Shopflow also exposes a **workflow-copilot brief** contract for the same
main-flow explanation layer:

```ts
import { workflowCopilotBriefSchema } from '@shopflow/contracts';
```

Example payloads:

- [Builder examples index](./examples/README.md)
- the checked-in multi-app example rack currently covers `ext-albertsons`, `ext-amazon`, `ext-kroger`, and `ext-temu`

## API Substrate First

Shopflow already ships a machine-readable contract that keeps today's
builder-facing substrate separate from later API / MCP / CLI ambitions:

```ts
import {
  builderIntegrationSurface,
  builderIntegrationSurfaceSchema,
} from '@shopflow/contracts';
```

This is useful when a builder needs one honest answer to:

- what is real today
- what is moving into current-scope now
- what still belongs in later
- what is still no-go or owner-decision

Shopflow also ships one **read-only provider-runtime seam contract**:

```ts
import {
  providerRuntimeSeam,
  providerRuntimeSeamSchema,
} from '@shopflow/contracts';
```

What this means in plain language:

> this is the “power-strip boundary” for external runtime acquisition.
> it tells you where Switchyard-style provider/runtime work may plug in,
> while making it explicit that merchant live proof still belongs to Shopflow's
> own evidence discipline.

Use [ADR-004](../adr/ADR-004-switchyard-provider-runtime-seam.md) when you need
the longer explanation of that ownership split.

## Repo-Local Outcome Tooling

Shopflow now also ships one **repo-local, read-only outcome bundle command**:

```bash
pnpm builder:write-outcome-bundle
```

And one **repo-local runtime payload writer** for supported current-scope apps:

```bash
pnpm builder:write-runtime-payloads -- --app <appId>
```

And one **checked-in example rack refresh command**:

```bash
pnpm builder:refresh-example-rack
```

And one **repo-local read-only CLI prototype**:

```bash
pnpm cli:read-only -- agent-integration-bundle
pnpm cli:read-only -- agent-target-packet --target codex
pnpm cli:read-only -- agent-target-packet --target claude-code
pnpm cli:read-only -- agent-target-packet --target openclaw
pnpm cli:read-only -- integration-surface
pnpm cli:read-only -- runtime-seam
pnpm cli:read-only -- runtime-consumer --base-url http://127.0.0.1:4317
pnpm cli:read-only -- public-distribution-bundle
pnpm cli:read-only -- outcome-bundle --app ext-kroger
pnpm cli:read-only -- submission-readiness
```

What it does in plain language:

> It emits one joined JSON bundle that combines the integration-surface
> contract, checked-in builder read-model examples, and generated artifact
> summaries plus source pointers when release artifacts already exist.
>
> On the `pnpm cli:read-only -- outcome-bundle` path, Shopflow now reuses
> existing generated payload files or the checked-in example rack. It does
> **not** silently regenerate `.runtime-cache/builder/*` behind a read-only
> command.

This is useful when a builder wants:

- one machine-readable bundle instead of separate fragments
- one machine-readable onboarding packet for Codex / Claude Code / OpenClaw
- one smaller target-specific handoff packet when the full onboarding bundle is more than they need for Codex, Claude Code, or OpenClaw
- a stable local entry that does **not** pretend Shopflow already has a public
  CLI or API platform
- one thin consumer snapshot that turns the Switchyard seam into concrete
  acquisition routes when a real base URL is available
- one repo-local CLI-shaped wrapper for the same read-only surfaces without
  turning that convenience layer into a public CLI commitment
- a truthful bridge from read models to outcome tooling
- repo-local generated payload files that can be consumed as `generated-runtime-file`
  inputs when they already exist, instead of silently backfilling them from a
  read-only path
- a multi-app current-scope path for `ext-albertsons`, `ext-amazon`, `ext-kroger`, and `ext-temu` without pretending every store app already has the same runtime payload depth
- a refreshable checked-in example rack for those same apps instead of a one-app sample shelf

Output artifact:

- `.runtime-cache/builder/builder-outcome-bundle.json`
- `stdout` when called with `--stdout`

Checked-in examples:

- [Builder examples index](./examples/README.md)
- refreshable checked-in examples now cover `ext-albertsons`, `ext-amazon`, `ext-kroger`, and `ext-temu`

That bundle now also includes:

- builder discoverability routes
- payload source metadata that says whether each payload came from a generated runtime file, an explicit input file, or a checked-in example
- generated summaries from the repo-owned release manifest and submission-readiness report when those artifacts exist
- companion public-copy references

Use [Integration Recipes](./integration-recipes.md) when you want the shortest
command or file path for a concrete read-only consumption flow.

## What This Is Good For

This surface is useful when a builder wants to:

- inspect which store app is active
- explain why public wording is still claim-gated
- route an operator back to the best current page
- turn typed runtime truth into downstream prompts, reports, or read-only tools
- render a concise decision brief without inventing a generic assistant panel

## What This Is Not

This is **not**:

- a public HTTP API
- a public MCP server
- a generated SDK package
- a write-capable automation interface

Those remain later-stage surfaces.

## Example Payload

- [Builder examples index](./examples/README.md)
- refresh the checked-in rack with `pnpm builder:refresh-example-rack` when repo-owned generated truth changes

## Today / Current-Scope Now / Later / No-Go / Owner-Decision

Today:

- read-only builder snapshot schema
- read-only provider-runtime seam contract
- read-only provider-runtime consumer snapshot for thin Switchyard route consumption
- read-only operator decision brief schema
- workflow-copilot brief schema
- repo-local read-only builder outcome bundle command
- repo-local read-only CLI prototype for integration-surface, runtime-seam,
  runtime-consumer, outcome-bundle, and submission-readiness
- existing typed contracts and runtime records
- review-bundle and submission-readiness artifacts

Current-scope now:

- keep the builder-facing integration substrate machine-readable and stable
- keep builder docs English-first
- keep product UI English-default with `zh-CN` support through shared locale catalogs
- keep new user-visible strings out of scattered bilingual literals

Later:

- read-only MCP backed by the same runtime truth
- read-only API transport
- CLI wrapper or skills pack built on the same read models
- generated client or thin SDK

No-go for current stage:

- write-capable MCP
- hosted control-plane service
- public wording that implies a current API platform

Owner-decision:

- official marketplace or plugin packaging for external AI coding ecosystems
- public CLI commitments
- public skills distribution
- public API publication beyond the current repo-owned substrate
