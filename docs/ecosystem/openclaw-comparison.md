# OpenClaw Public-Ready Packet

This page keeps OpenClaw truthful inside Shopflow under the 2026-04-06
public-distribution uplift.

In plain language:

> OpenClaw is no longer just the comparison shelf.
> It is now the boxed-up public-ready lane: the install recipe, discovery copy,
> and proof loop are prepared, while the last outside-the-repo publish step is
> still called out honestly.

## Current Honest Placement

OpenClaw is now **public-ready but not yet externally published** in this repo.

That means Shopflow can truthfully show:

- a public install route shape through the upstream `nix-openclaw`
  community-plugin flow
- a public discovery route through public docs plus a ready-to-publish metadata
  packet
- a public proof loop that shows exactly what evidence to capture once the
  final external repo or listing step lands

It must still **not** be described today as:

- an official OpenClaw listing that is already live
- an official OpenClaw org integration
- proof that the last external publish/auth step already happened

## Strongest Truthful Public Route

The strongest truthful public distribution surface today is:

1. a **public GitHub plugin repository** that exports the `openclawPlugin`
   contract
2. installed through OpenClaw's documented `customPlugins` path
3. discovered through this packet, the ready metadata, and the upstream
   `openclaw/nix-openclaw` public repo

Think of it like packing a product for a public shelf:

- this repo now prepares the box label, install card, and proof checklist
- the remaining outside step is physically putting that box onto the shelf

## Public Install Path

OpenClaw's upstream public docs already verify the install shape:

- community plugins can be added from a public GitHub repo
- the repo reference lives in the user's flake config
- install happens through `home-manager switch`

Use this exact public-ready install shape once the public plugin repo exists:

```nix
programs.openclaw.instances.default = {
  enable = true;
  plugins = [
    { source = "github:<authorized-namespace>/shopflow-openclaw-plugin"; }
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

1. publish the public plugin repo or approved listing surface
2. add the public GitHub source to `customPlugins`
3. run `home-manager switch`
4. capture one install receipt and one runtime receipt
5. attach the evidence to the publish packet

Minimum proof bundle:

- public repo URL or official listing URL
- the exact flake snippet used for install
- `home-manager switch` success output
- one runtime proof that Shopflow's read-only packet is reachable after install

## Best Commands Before the External Step

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

- official OpenClaw listing already live
- official OpenClaw org approval already granted
- public proof already captured if the public repo or listing is still missing

## Why This Still Matters

The important upgrade is not "Shopflow magically shipped an official OpenClaw
integration."

The real upgrade is:

- install path is explicit
- discovery path is explicit
- proof path is explicit
- external-only blockers are packed into one exact packet instead of hiding
  behind vague future wording
