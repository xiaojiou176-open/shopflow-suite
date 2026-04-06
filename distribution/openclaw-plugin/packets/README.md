# Packet Copies

These JSON files are **copied reference payloads** from the canonical Shopflow
packet examples inside the private source repository.

Canonical source files:

- `docs/ecosystem/examples/agent-target-packet.openclaw.json`
- `docs/ecosystem/examples/plugin-marketplace-metadata.openclaw.json`

Why they are copied here:

- this fallback scaffold should stay self-contained enough for a future public
  repo handoff
- L1 can publish this directory without needing to expose the full private
  Shopflow repo
- the packet wording stays truthful and read-only

Important boundary:

> These are packet copies, not proof that this scaffold itself owns the private
> Shopflow CLI or the private docs paths mentioned inside the JSON.
