# Apps

Each `apps/ext-*` directory owns one Chrome Web Store listing and one WXT app shell.

Shared logic must stay in `packages/*`.

This directory is the **primary Shopflow product lane**.

Use `apps/` when you mean the browser-first extension family itself.
Use `distribution/` when you mean companion packets, host-native skill folders,
or packet mirrors.

Those companion surfaces can help reviewers or agent hosts, but they do **not**
replace `apps/ext-*` as the main product identity and they do **not** prove
Chrome Web Store submission or listing by themselves.
