# Contributing

Thanks for helping improve Shopflow.

## Before You Start

Shopflow is a Chrome-first shopping extension monorepo. Please preserve the
repo's truth boundaries:

- `repo-verified` is not `public-claim-ready`
- review bundles are not signed release artifacts
- official listing language must stay below real external confirmation

## Local Setup

Requirements:

- Node `>=22`
- `pnpm >=10.22.0`

Install:

```bash
pnpm install
```

Core checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm verify:release-readiness
```

If you change checked-in builder examples:

```bash
pnpm builder:refresh-example-rack
```

## Pull Request Expectations

- keep changes surgical
- do not add fake tests or fake evidence
- do not overclaim official listing, public release, or reviewed live evidence
- update docs when you change public wording, package boundaries, or
  verification behavior

## Commit Style

Use conventional prefixes:

- `feat:`
- `fix:`
- `refactor:`
- `docs:`
- `test:`
- `chore:`

## Security and Sensitive Data

- never commit real secrets, tokens, cookies, or private keys
- do not commit real merchant account data
- use [`.env.example`](./.env.example) as the contract template
- if you find a security issue, follow [SECURITY.md](./SECURITY.md)
