# OpenClaw Publish Unblock Packet

This page is the exact outside-the-repo packet for the last publish step.

In plain language:

> The repo has already packed the product card.
> This file is the note you hand to the human at the front desk when the last
> door still needs a key.

## Exact External-Only Packet

Use this packet when repo-owned work is done but the final public publish step
still needs namespace, auth, or maintainer help.

### Channel

- primary route: public GitHub plugin repo consumed through OpenClaw
  `customPlugins`
- optional stronger route: official OpenClaw-owned mention or listing, only if
  a maintainer explicitly approves it

### Suggested public repo

- repo name: `shopflow-openclaw-plugin`
- namespace: `<authorized-namespace>`
- slug: `shopflow-openclaw-read-only-packet`

### Suggested short description

`Read-only Shopflow packet for OpenClaw workflows: typed contracts, outcome bundle, runtime boundary notes, and submission-readiness without overclaiming official integration.`

### Suggested README install block

```nix
programs.openclaw.instances.default = {
  enable = true;
  plugins = [
    { source = "github:<authorized-namespace>/shopflow-openclaw-plugin"; }
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
| namespace missing | choose the public GitHub namespace that may host `shopflow-openclaw-plugin` | Shopflow owner |
| official org auth missing | ask whether OpenClaw wants community-plugin-only or official-org linkage | OpenClaw maintainer |
| captcha / login challenge | capture screenshot and exact URL if GitHub or Discord blocks the action | human operator doing the external publish |

## What This Packet Does Not Claim

- official OpenClaw listing already live
- official OpenClaw maintainer approval already granted
- runtime proof already captured before the external install run happens
