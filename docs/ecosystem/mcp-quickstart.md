# Shopflow MCP Quickstart

Shopflow now exposes a **read-only stdio MCP surface** for AI tools that need
repo-truth, runtime seam, submission readiness, and distribution packet access.

In plain language:

> this is the local socket you plug into when you want AI to use Shopflow's
> real repo-owned read models instead of scraping prose.

## What This MCP Is

- a **stdio-only** MCP server
- **read-only**
- **no auth**
- backed by the same repo-owned JSON truth used by the existing read-only CLI

## What This MCP Is Not

- not a public HTTP MCP endpoint
- not a write-capable MCP
- not a public API
- not a public SDK
- not proof that any registry or marketplace entry already exists

## Start It

From the repo root:

```bash
pnpm mcp:stdio
```

## The 4 Tools

1. `get_integration_surface`
   - returns the current builder integration surface JSON
2. `get_runtime_seam`
   - returns the current provider runtime seam JSON
3. `get_submission_readiness`
   - returns the current submission-readiness report JSON
4. `get_public_distribution_bundle`
   - returns the current public distribution bundle JSON

## Example Client Config

Use the checked-in sample config:

- [`docs/ecosystem/examples/mcp-config.stdio.json`](./examples/mcp-config.stdio.json)

The exact path assumes the MCP client can spawn a local process in the repo
root.

## Honest Boundary

The truthful claim is:

> Shopflow ships a **repo-local read-only stdio MCP** today.
> Public transport, Docker packaging, registry publication, and marketplace
> listing remain later-stage work.
