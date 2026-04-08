# Packet Copies

These JSON files are **copied reference payloads** from the canonical Shopflow
packet examples inside the canonical source repo:

- `https://github.com/xiaojiou176-open/shopflow-suite`

Canonical source files:

- `docs/ecosystem/examples/agent-target-packet.openclaw.json`
- `docs/ecosystem/examples/plugin-marketplace-metadata.openclaw.json`

Why they are copied here:

- this fallback scaffold should stay self-contained enough for a future public
  repo handoff
- L1 can keep this install shell self-contained without pretending it is the
  canonical Shopflow repo
- the packet wording stays truthful and read-only

Important boundary:

> These are packet copies, not proof that this fallback shell itself owns the
> canonical Shopflow CLI or the canonical docs paths mentioned inside the JSON.
