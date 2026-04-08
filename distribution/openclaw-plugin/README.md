# Shopflow OpenClaw Fallback Shell

This directory is the source scaffold for the live
`xiaojiou176/shopflow-openclaw-plugin` repository.

In plain language:

> Think of this as one real install box on a side counter.
> It already exists publicly, but it is still not the main Shopflow storefront
> and still not an official OpenClaw listing.

## What This Is

- a minimal OpenClaw plugin-shaped scaffold that follows the official
  hello-world layout closely
- the source for the live public fallback repo
  `https://github.com/xiaojiou176/shopflow-openclaw-plugin`
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

This fallback shell is meant to be installed through OpenClaw's
**`customPlugins`** path.

Use the current live repo source shape below:

```nix
programs.openclaw.instances.default = {
  enable = true;
  plugins = [
    { source = "github:xiaojiou176/shopflow-openclaw-plugin"; }
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

- this repo is a **public OpenClaw-specific fallback route**
- this shell can be consumed through `customPlugins`
- this repo still points back to `shopflow-suite` as the canonical source
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

`go run .` prints the fallback boundary, says this repo is not canonical, and
points readers back to `shopflow-suite` plus the packet files.

## Namespace Migration Notes

If this repo ever moves to another namespace:

1. keep `shopflow-suite` as the canonical repo
2. update `install.snippet.nix` and this README together
3. announce the new repo URL from `shopflow-suite`
4. keep the wording as a fallback shell unless a real OpenClaw-owned surface is
   approved later
