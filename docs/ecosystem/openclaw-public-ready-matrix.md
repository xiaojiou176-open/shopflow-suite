# OpenClaw Public-Ready Matrix

This page is the one-screen control card for OpenClaw's current public-ready
state.

In plain language:

> If the main packet is the travel folder, this matrix is the boarding pass.
> It tells you what is ready inside the repo, what still needs one outside
> action, and what receipt proves the trip really happened.

## OpenClaw Public-Ready Matrix

| Surface | Repo-owned now | Strongest truthful public path | Proof to capture | External-only blocker |
| :--- | :--- | :--- | :--- | :--- |
| install path | exact install snippet, metadata packet, and canonical subdir route already exist | use `github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin`, add it to OpenClaw `customPlugins`, and run `home-manager switch` | flake snippet plus successful `home-manager switch` output | fresh install receipt still needs a human/operator run |
| discovery path | docs, ready metadata, checked-in example JSON, and the canonical subdir route already exist | point readers to this matrix, the canonical repo `shopflow-suite`, the canonical subdir install path, and the upstream `openclaw/nix-openclaw` repo | public repo URL or official listing URL | official OpenClaw listing placement is still unknown |
| proof loop | receipt checklist is prepared | capture install receipt plus one runtime receipt against the canonical subdir route | install log, runtime log, screenshot or transcript | someone must perform the real install/runtime proof run |
| metadata/listing copy | ready-to-publish draft exists | paste the metadata into the canonical repo docs or a future official listing form | final pasted copy or listing draft URL | maintainer auth if using official OpenClaw-owned surfaces |
| official org linkage | packet is prepared | ask OpenClaw maintainers whether this should stay community-plugin-only or be linked from an official surface | Discord thread URL or maintainer reply | Discord/maintainer auth boundary |

## Strongest Public Route Today

The best truthful route today is **not** "claim an official marketplace."

It is:

1. use the canonical repo subdir route
   `github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin`
2. install it through OpenClaw's documented `customPlugins` flow
3. capture the proof loop
4. keep `shopflow-openclaw-plugin` only as an archived legacy compatibility
   route if an older pin still exists

That is like using a real front desk that already exists, instead of pretending
we own the whole mall.

## Copy-Paste Install Snippet

```nix
programs.openclaw.instances.default = {
  enable = true;
  plugins = [
    { source = "github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin"; }
  ];
};
```

```bash
home-manager switch --flake .#<user>
```

## Exact Discovery Bundle

Hand these together:

1. this page
2. [OpenClaw Public-Ready Packet](./openclaw-comparison.md)
3. [OpenClaw Publish Unblock Packet](./openclaw-publish-unblock-packet.ready.md)
4. [plugin-marketplace-metadata.openclaw.json](./examples/plugin-marketplace-metadata.openclaw.json)
5. [agent-target-packet.openclaw.json](./examples/agent-target-packet.openclaw.json)

## Boundary Reminder

- `shopflow-suite` remains the canonical Shopflow repo
- `shopflow-openclaw-plugin` is now an archived legacy fallback shell, not the
  main product repo and not the recommended install path
- public-ready does **not** mean officially listed
- ready-to-publish does **not** mean already published
- official OpenClaw org placement still needs real maintainer approval if that
  route is chosen
