# Design System: Shopflow Wave 3 Sovereign UIUX

## 0. Sovereignty

This design system is governed by a single sovereignty stack:

- **Sovereign source:** `Linear`
- **Popup donor:** `Raycast` for quick-router behavior only
- **Public/front-door donor:** `Shopify` for first-touch trust framing only
- **Rhythm donor:** `Apple` for pacing and breathing room only
- **Comparison only:** `Vercel`, `Stripe`

Hard rule:

> Do not average the donors.
> Borrow by surface role, not by aesthetic collage.

## 1. Visual Theme & Atmosphere

Shopflow should feel like a **retail operator concierge**, not a dashboard
template.
The atmosphere is warm, restrained, and product-first: like a high-end field
notebook for shopping execution where the first thing you see is the next
correct door, not a pile of status boxes.

Density target:

- Popup: `3/10` airy and route-first
- Side Panel: `5/10` balanced and work-surface-first
- Suite: `4/10` lobby-first, with dense detail below the fold

Variance target:

- `7/10` offset and asymmetric enough to feel designed
- never chaotic, never centered-marketing-hero generic

Motion target:

- `4/10`
- subtle lift, shimmer, and staged reveal only where they clarify hierarchy

In plain language:

> Popup should feel like a hotel concierge pointing at the fastest elevator.
> Side Panel should feel like the actual room where the work happens.
> Suite should feel like the building lobby with a clear "start here" desk.
> docs/front door should feel like the front desk, not the archive room.

## 2. Color Palette & Roles

- **Paper Canvas** (`#f6f1e8`) — app-level background wash
- **Soft Surface** (`#fffdf8`) — primary cards and raised surfaces
- **Ink Charcoal** (`#1f1c17`) — primary text and headline ink
- **Weathered Stone** (`#6c665d`) — secondary text and metadata
- **Whisper Rule** (`rgba(58, 49, 38, 0.10)`) — borders and dividers
- **Evergreen Route** (`#1f6b57`) — the only accent; primary CTA, focus ring, active route
- **Amber Gate** (`#b7791f`) — claim-boundary and caution surfaces only

Rules:

- maximum one true accent color: **Evergreen Route**
- amber is semantic caution, not a second brand accent
- no cool/warm neutral mixing
- no pure black
- no neon glow, no purple, no electric blue dashboard energy

## 3. Typography Rules

- **Display:** `Outfit`, `Cabinet Grotesk`, `Geist`
  - track-tight
  - short lines
  - hierarchy by weight and contrast, not giant size
- **Body:** `Satoshi`, `Geist`
  - relaxed leading
  - 60-65 character reading width where blocks widen
- **Mono:** `JetBrains Mono`
  - timestamps
  - counts
  - review-state metadata

Banned:

- `Inter`
- generic serif stacks
- giant gradient headlines
- “label // year” AI typography

Headline rules:

- Popup H1 should fit in two compact lines max
- Side Panel and Suite H1 can be larger, but must still leave room for the first real action surface above the fold

## 4. Component Stylings

### Buttons

- primary actions use solid **Evergreen Route**
- secondary actions use soft-surface background with whisper border
- active state = `translateY(1px)` press, not hover glow
- focus ring = 2px evergreen outline with visible offset

### Cards

- use cards only when elevation explains hierarchy
- first-screen hero cards may be larger and darker for emphasis
- lower-priority detail zones should prefer:
  - divider-led lists
  - inset note panels
  - grouped sections
  instead of endless equal cards

### Status blocks

- readiness blocks must read as short decision summaries
- proof blocks must read as evidence hints, not full reports
- claim-boundary blocks should be warm and calm, not alarming

### Inputs / toggles

- label-above
- no floating labels
- no unnecessary chrome

### Loading

- use structural skeletons
- no circular spinners as the main loading identity

## 5. Layout Principles

- no overlapping elements
- no equal-rank white-card ladders
- no three-equal-card feature row
- use CSS Grid with explicit hierarchy
- keep `max-width` tight enough that the UI reads like a tool, not a marketing site

Surface-specific rules:

- **Popup**
  - one dominant route block
  - one supporting route block
  - one compressed proof hint
  - the checklist / extra notes area must feel visibly lower-priority
  - if something can be demoted behind disclosure without hiding truth, demote it
- **Side Panel**
  - first viewport should stack:
    - readiness snapshot
    - primary route
    - claim boundary / next step
    - proof hint
  - capability matrix and evidence system come later
  - report lanes must collapse or demote before they visually compete with the
    main workspace
- **Suite**
  - first viewport should stack:
    - start-here desk
    - one or two priority routes
    - compressed claim-readiness cue
  - rollout map, evidence gates, verified scope, and seam surfaces move below
  - per-app inspect slabs belong below the lobby moment, not inside it
- **docs/front door**
  - first screen should answer:
    - what Shopflow is
    - why it is worth opening now
    - what the first honest route is
    - where help or deeper docs live
  - deep docs atlases, question grids, and builder shelves belong below the
    first-touch route

## 6. Motion & Interaction

- spring-like easing only
- hover lift no more than `-1px`
- prefer opacity / transform only
- honor `prefers-reduced-motion`

Perpetual micro-motion is optional and should stay minimal:

- a gentle shimmer or glow on the dominant route only
- never animate every card
- never create attention competition between primary and secondary sections

## 7. Copy Tone

- product-first
- route-first
- calm and explicit
- no packet-speak on the first screen unless the user is already inside an evidence lane
- no archive-room or docs-warehouse phrasing on the front row

Do:

- “Open Side Panel quick actions”
- “Review claim gate”
- “Jump to latest source page”

Avoid:

- “Explore capabilities”
- “Unlock seamless workflows”
- “System performance metrics”
- filler words that sound like an AI landing page

## 8. Platform Guardrails

- Popup is a short-lived quick-routing surface, not a long-lived workflow host
- Side Panel is the persistent companion surface and should complement the
  current browsing task with minimal distraction
- first-touch public surfaces should use progressive disclosure:
  - first screen = what / why / get started / help
  - deeper structure = linked shelves and task pages
- disclosure hierarchy defaults to:
  - `Collapsible / Accordion`
  - `Dialog / Drawer`
  - `AlertDialog`

## 9. Surface Grammar

### Popup

- should read as `switchboard`
- should not read as `mini-sidepanel`

### Side Panel

- should read as `primary work surface`
- should not read as `report wall`

### Suite

- should read as `concierge lobby`
- should not read as `internal console`

### docs/front door

- should read as `product-first front desk`
- should not read as `packet shelf`

## 10. Anti-Patterns (Banned)

- no emoji icons
- no `Inter`
- no pure black
- no neon or outer-glow shadows
- no generic SaaS dashboard look
- no 3 equal cards in a row
- no repeated same-rank white card stacks from top to bottom
- no fake metrics or made-up counts
- no centered hero marketing layout for Suite
- no popup that behaves like a mini sidepanel
- no Side Panel that reads like a report wall
- no Suite first screen that feels like an audit spreadsheet
- no docs/front door body that feels like a packet atlas before the product is
  explained

## 11. Implementation Notes

- prefer semantic color classes via shared tokens
- use `gap-*` instead of `space-*` when composing stacked sections
- reuse primitive composition, but do not let primitives force visual sameness across every section
- introduce stronger section differentiation through:
  - background contrast
  - border softness
  - typography scale
  - spacing rhythm
  - disclosure depth

- prefer hierarchy and demotion before palette changes
- prefer one strong first action over several equal-weight cards
- prefer inline disclosure before modal escalation

## 12. Artifact Rule

All high-fidelity design artifacts for this endgame lane must be stored under:

- `.stitch/designs/`

If Stitch MCP is unavailable, the design artifact can be a repo-local high-fidelity mock rendered from this design system, but it still must obey the same visual rules above.
