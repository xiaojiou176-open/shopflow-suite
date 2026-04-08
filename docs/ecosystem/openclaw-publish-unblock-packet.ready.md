# OpenClaw Publish Unblock Packet

This page is the exact outside-the-repo packet for the remaining
official-listing, namespace-change, or stronger-publication steps.

In plain language:

> the fallback shell is already public.
> this file is now the note for anything stronger than that fallback route.

## Exact External-Only Packet

Use this packet when the canonical repo and fallback shell are already live, but
the next move still needs official-listing auth, namespace change, or
maintainer help.

### Channel

- current live route: public GitHub plugin repo
  `https://github.com/xiaojiou176/shopflow-openclaw-plugin` consumed through
  OpenClaw `customPlugins`
- optional stronger route: official OpenClaw-owned mention or listing, only if
  a maintainer explicitly approves it

### Current public repo

- repo name: `shopflow-openclaw-plugin`
- namespace: `xiaojiou176`
- slug: `shopflow-openclaw-read-only-packet`

### Suggested short description

`Read-only Shopflow packet for OpenClaw workflows: typed contracts, outcome bundle, runtime boundary notes, and submission-readiness without overclaiming official integration.`

### Suggested README install block

```nix
programs.openclaw.instances.default = {
  enable = true;
  plugins = [
    { source = "github:xiaojiou176/shopflow-openclaw-plugin"; }
  ];
};
```

```bash
home-manager switch --flake .#<user>
```

### Suggested proof checklist

1. public repo URL
2. one screenshot or pasted snippet showing the `customPlugins` entry
3. `home-manager switch` success output
4. one runtime receipt proving the Shopflow packet is reachable after install

## Maintainer/Auth Packet

If official OpenClaw-owned placement is desired, send this message first:

```text
Hi OpenClaw maintainers,

We prepared Shopflow as a read-only OpenClaw plugin-style package. This is not
an official integration claim. The package only exposes typed contracts,
runtime-boundary notes, outcome bundles, and submission-readiness guidance.

What is ready now:
- public install snippet through customPlugins
- ready-to-publish metadata
- exact proof checklist

What we need from you:
- confirm whether this should stay a community-plugin repo or can be linked
  from an official OpenClaw surface
- confirm the approved namespace or listing surface
- tell us if any auth, org-invite, or additional review step is required

Reference packet:
- docs/ecosystem/openclaw-public-ready-matrix.md
- docs/ecosystem/examples/plugin-marketplace-metadata.openclaw.json
- docs/ecosystem/examples/agent-target-packet.openclaw.json
```

Upstream read-only research shows OpenClaw currently routes maintainer contact
through Discord `#golden-path-deployments` and rejects unapproved drive-by PRs,
so this message should go there first if official-org placement is requested.

## Namespace / Auth / Captcha Table

| Potential blocker | Exact ask | Owner of next move |
| :--- | :--- | :--- |
| stronger namespace desired | decide whether the current `xiaojiou176/shopflow-openclaw-plugin` repo is good enough or should move later | Shopflow owner |
| official org auth missing | ask whether OpenClaw wants community-plugin-only or official-org linkage | OpenClaw maintainer |
| captcha / login challenge | capture screenshot and exact URL if GitHub or Discord blocks the action | human operator doing the external publish or official-listing step |

## What This Packet Does Not Claim

- canonical Shopflow repo status for `shopflow-openclaw-plugin`
- official OpenClaw listing already live
- official OpenClaw maintainer approval already granted
- runtime proof already captured before the external install run happens
