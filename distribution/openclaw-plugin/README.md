# Shopflow OpenClaw Fallback Shell

This directory is the canonical OpenClaw install subdir inside the canonical
Shopflow repo.

In plain language:

> Think of this as the install box now stored inside the main Shopflow store.
> The old standalone repo is only a legacy shelf, not the recommended route.

## What This Is

- a minimal OpenClaw plugin-shaped scaffold that follows the official
  hello-world layout closely
- the source for the canonical OpenClaw install path
  `github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin`
- a read-only Shopflow packet surface for install, discovery, and handoff

The canonical Shopflow repo remains:

- `https://github.com/xiaojiou176-open/shopflow-suite`

## What This Is Not

- not the canonical Shopflow repo
- not the main product repo
- not an official OpenClaw listing
- not an official OpenClaw org integration
- not a second Shopflow runtime or product fork
- not proof that the last external publish and install receipt already happened

## Public Install Path

This canonical subdir is meant to be installed through OpenClaw's
**`customPlugins`** path.

Use the current live repo source shape below:

```nix
programs.openclaw.instances.default = {
  enable = true;
  plugins = [
    { source = "github:xiaojiou176-open/shopflow-suite?dir=distribution/openclaw-plugin"; }
  ];
};
```

Then apply the config with:

```bash
home-manager switch --flake .#<user>
```

The same snippet is checked in as [`install.snippet.nix`](./install.snippet.nix).

## Boundary Wording

The truthful boundary is simple:

- this subdir is the canonical OpenClaw install route inside `shopflow-suite`
- this shell can be consumed through `customPlugins`
- official OpenClaw-owned placement is still **external and approval-gated**

> Publicly installable fallback != official listing.
> It is the difference between putting a product on your own public table and
> being invited onto the platform's official front shelf.

## Packet Bundle

The files under [`packets/`](./packets/) are **copied reference payloads**
derived from the canonical Shopflow packet examples in the source repo:

- `docs/ecosystem/examples/agent-target-packet.openclaw.json`
- `docs/ecosystem/examples/plugin-marketplace-metadata.openclaw.json`

These copies keep the Shopflow read-only packet truth, including the original
packet wording. Some fields still point back to canonical Shopflow paths and
commands on purpose, because the canonical repo is still `shopflow-suite` and
this fallback shell only owns the target-specific install surface.

## Plugin Shell Layout

This scaffold intentionally mirrors the OpenClaw official hello-world example:

- `flake.nix` exports `packages.default`, `apps.default`, and `openclawPlugin`
- `main.go` is a tiny Go entrypoint
- `AGENTS.md` is a tiny plugin-local boundary note
- `skills/shopflow-read-only-packet/SKILL.md` provides one minimal skill entry

The extra Shopflow-specific additions are:

- this `README.md`
- `install.snippet.nix`
- `packets/` reference payload copies

## Local Sanity Checks

From this directory:

```bash
go build ./...
go run .
```

`go run .` prints the canonical install path and points readers at the packet
files inside the canonical repo.
