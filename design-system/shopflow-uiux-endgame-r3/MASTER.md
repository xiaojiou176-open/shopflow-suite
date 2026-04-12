# Shopflow UIUX Endgame R3 Master

## Role

This file is the R3 design-system source of truth for current Shopflow UIUX work.
Use it before any page override. If an override exists, it may narrow emphasis,
but it may not violate the rules below.

## Visual Theme

- mood: calm operator desk, not SaaS dashboard
- atmosphere: warm paper, dark ink, one route accent
- density: moderate by default, high density only below the fold
- variance: asymmetric vertical hierarchy, never equal-card sludge
- motion: restrained and quiet

In plain language:

> the UI should feel like a high-trust shopping copilot handing you the next
> correct door, not a BI tool, not a cyber dashboard, and not a giant report.

## Palette

- `Paper Canvas` `#f6f1e8` — app background
- `Soft Surface` `#fffdf8` — default raised surface
- `Ink Charcoal` `#1f1c17` — primary heading/text
- `Weathered Stone` `#6c665d` — secondary text/metadata
- `Whisper Border` `rgba(58,49,38,0.10)` — structural border
- `Evergreen Route` `#1f6b57` — the single primary action accent
- `Amber Gate` `#b7791f` — caution / claim-boundary surfaces only

Rules:

- maximum one true action accent
- no purple / neon / electric blue
- no pure black
- no warm/cool palette drift between surfaces

## Typography

- display: `Geist`, `Outfit`, or `Cabinet Grotesk`
- body: `Geist`, `Satoshi`
- mono: `JetBrains Mono`

Banned:

- `Inter`
- generic serif
- giant gradient type
- fake KPI / AI hero typography

## Layout Laws

- no 3 equal hero cards
- no repeated same-rank white card stacks
- no centered marketing hero for Suite
- no popup that reads like a mini-sidepanel
- no sidepanel that leads with audit depth
- no suite first screen that behaves like a ledger

## Component Laws

- use cards only when hierarchy requires elevation
- use dividers / grouped note panels for lower-priority detail
- primary CTA must always dominate secondary CTA
- proof blocks must remain hints, not full reports
- claim-boundary blocks must stay honest but visually secondary to the next route

## Interaction Laws

- every clickable element shows pointer + visual hover feedback
- reduced-motion fallback is required
- disclosure may hide dense detail, but required hash routes must auto-open the target disclosure

## Responsive Laws

- required breakpoints: `320px`, `375px`, `768px`, `1280px`
- no horizontal overflow
- mobile first
- first-screen decision frame must survive at narrow widths

## Explicit Rejections

The following R3 `ui-ux-pro-max` suggestions are rejected for Shopflow:

- `dark OLED`
- `glassmorphism`
- `data-dense dashboard`
- `brutalism`
- `zero interface`
- `portfolio grid`
- `horizontal scroll journey`

Why:

- they conflict with the Shopflow product-surface contract
- they make popup/sidepanel/suite drift toward the wrong product archetype

## Acceptance Smell Test

If a skeptical owner opens the latest screenshots, they should immediately know:

1. what this surface is for
2. what the strongest next action is
3. what is still claim-gated

If the answer becomes “read all these cards and infer the route yourself,” the design is wrong.
