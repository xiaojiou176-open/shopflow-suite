# Shopflow OpenClaw Public Fallback Scaffold

This directory is a **publicly installable fallback scaffold** for OpenClaw.

In plain language:

> Think of this folder as a boxed sample for a public shelf.
> It is ready to be copied into its own public GitHub repo, but it is **not**
> a claim that Shopflow already has an official OpenClaw listing or official
> OpenClaw org placement.

## What This Is

- a minimal OpenClaw plugin-shaped scaffold that follows the official
  hello-world layout closely
- a read-only Shopflow packet surface for install, discovery, and handoff
- a directory that L1 can later publish as a separate public GitHub repo

## What This Is Not

- not an official OpenClaw listing
- not an official OpenClaw org integration
- not a second Shopflow runtime or product fork
- not proof that the last external publish and install receipt already happened

## Public Install Path

This scaffold is meant to be installed through OpenClaw's **`customPlugins`**
path after it lives in a public GitHub repo.

Use the public repo source shape below:

```nix
programs.openclaw.instances.default = {
  enable = true;
  plugins = [
    { source = "github:<authorized-namespace>/shopflow-openclaw-plugin"; }
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

- this repo shape can become a **public fallback route**
- this scaffold can be consumed through `customPlugins`
- official OpenClaw-owned placement is still **external and approval-gated**

> Publicly installable fallback != official listing.
> It is the difference between putting a product on your own public table and
> being invited onto the platform's official front shelf.

## Packet Bundle

The files under [`packets/`](./packets/) are **copied reference payloads**
derived from the canonical Shopflow packet examples in the private source repo:

- `docs/ecosystem/examples/agent-target-packet.openclaw.json`
- `docs/ecosystem/examples/plugin-marketplace-metadata.openclaw.json`

These copies keep the Shopflow read-only packet truth, including the original
packet wording. Some fields still point back to canonical Shopflow paths and
commands on purpose, because they are packet references rather than live
runtime owned by this fallback scaffold.

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

`go run .` prints the fallback boundary and points readers at the packet files.

## Publish Handoff Notes

Before external publication:

1. create the public repo, for example `shopflow-openclaw-plugin`
2. push this directory as the repo root
3. replace `<authorized-namespace>` in `install.snippet.nix` and this README
4. only describe it as an official listing if a real OpenClaw-owned surface is
   approved later
