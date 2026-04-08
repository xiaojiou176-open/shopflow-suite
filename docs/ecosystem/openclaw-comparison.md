# OpenClaw Public-Ready Packet

This page keeps OpenClaw truthful inside Shopflow under the 2026-04-06
public-distribution uplift.

In plain language:

> OpenClaw no longer needs a separate main install box.
> the canonical install path now lives inside the main Shopflow repo, while the
> old standalone repo is only a legacy fallback.

Canonical boundary:

- `xiaojiou176-open/shopflow-suite` stays the canonical Shopflow repo
- canonical OpenClaw installs now point to
  `github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin`

## Current Honest Placement

OpenClaw now has a **canonical install path inside the canonical repo**.

That means Shopflow can truthfully show:

- a public install route through
  `github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin`
  and the upstream `nix-openclaw` community-plugin flow
- a public discovery route through public docs plus a ready-to-publish metadata
  packet
- a public proof loop that shows exactly what evidence to capture once the
  fallback install route is exercised live

It must still **not** be described today as:

- the canonical Shopflow repo
- an official OpenClaw listing that is already live
- an official OpenClaw org integration
- proof that official OpenClaw publication/auth is already complete

## Strongest Truthful Public Route

The strongest truthful public distribution surface today is:

1. the canonical Shopflow docs/proof front door
   `https://github.com/xiaojiou176-open/shopflow-suite`
2. the canonical install path through OpenClaw's documented `customPlugins`
   flow:
   `github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin`
3. discovered through this packet, the ready metadata, and the upstream
   `openclaw/nix-openclaw` public repo

Think of it like packing a product for a public shelf:

- the install path now comes from the main storefront itself
- the remaining outside step is any stronger official listing or official-org
  placement beyond that fallback route

## Public Install Path

OpenClaw's upstream public docs already verify the install shape:

- community plugins can be added from a public GitHub repo
- the repo reference lives in the user's flake config
- install happens through `home-manager switch`

Use this exact install shape today:

```nix
programs.openclaw.instances.default = {
  enable = true;
  plugins = [
    { source = "github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin"; }
  ];
};
```

Then apply it with:

```bash
home-manager switch --flake .#<user>
```

## Public Discovery Path

Use these in this order when a reader asks "where do I start?":

1. [OpenClaw Public-Ready Matrix](./openclaw-public-ready-matrix.md)
2. [Plugin Marketplace Metadata](./plugin-marketplace-metadata.ready.md)
3. [OpenClaw Publish Unblock Packet](./openclaw-publish-unblock-packet.ready.md)
4. [plugin-marketplace-metadata.openclaw.json](./examples/plugin-marketplace-metadata.openclaw.json)
5. [agent-target-packet.openclaw.json](./examples/agent-target-packet.openclaw.json)

If the reader wants the underlying upstream public route first, point them to:

- `https://github.com/openclaw/nix-openclaw`

## Public Proof Loop

Proof here means "a stranger can follow the route and we can show receipts."

Use this loop:

1. start from the canonical repo for docs and proof boundaries
   `https://github.com/xiaojiou176-open/shopflow-suite`
2. add the canonical subdir source to `customPlugins`
3. run `home-manager switch`
4. capture one install receipt and one runtime receipt
5. attach the evidence to the proof packet

Minimum proof bundle:

- public repo URL or official listing URL
- the exact flake snippet used for install
- `home-manager switch` success output
- one runtime proof that Shopflow's read-only packet is reachable after install

## Best Commands Around The Canonical Install Route

```bash
pnpm cli:read-only -- agent-target-packet --target openclaw
pnpm cli:read-only -- plugin-marketplace-metadata --target openclaw
pnpm cli:read-only -- public-distribution-bundle
pnpm cli:read-only -- agent-integration-bundle
```

Then read:

- [OpenClaw Public-Ready Matrix](./openclaw-public-ready-matrix.md)
- [Plugin Marketplace Metadata](./plugin-marketplace-metadata.ready.md)
- [OpenClaw Publish Unblock Packet](./openclaw-publish-unblock-packet.ready.md)

## Must Not Claim

- canonical Shopflow repo status
- official OpenClaw listing already live
- official OpenClaw org approval already granted
- public proof already captured if the canonical install route has not been run

## Why This Still Matters

The important upgrade is not "Shopflow magically shipped an official OpenClaw
integration."

The real upgrade is:

- install path is explicit and already publicly hosted
- discovery path is explicit
- proof path is explicit
- external-only blockers are packed into one exact packet instead of hiding
  behind vague future wording
