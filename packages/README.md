# Packages

Shared packages are the single engineering kitchen behind all Shopflow store apps.

- `contracts` stays runtime-free
- `core` stays store-agnostic
- `runtime` owns browser coordination
- `ui` owns shared surfaces
- `store-*` owns store-specific DOM and action behavior
- `testkit` owns reusable test helpers
