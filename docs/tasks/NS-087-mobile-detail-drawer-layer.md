# NS-087: Mobile detail drawer — z-index + inset floating panel

Branch: `feat/mobile-detail-drawer-layer` (checked out).

## Problem (confirmed in code)

On viewports ≤1024px, `.workspace--detail .drawer` (`src/styles.css` ~3602) pins the detail drawer `top:0; right:0; bottom:0; width: min(380px, 100%)` — on phones this is effectively **full screen**.

Base `.drawer` has `z-index: 4`; `.canvas-hud-controls` has `z-index: 7` — the right view/focus rail **stacks above** the drawer, matching the user screenshot.

The generic `@media (max-width: 768px) .drawer` bottom-sheet rules lose to `.workspace--detail .drawer` specificity.

## Product intent (user + recommended approach)

**Adopt the user’s goals** with a slightly clearer pattern: treat the mobile explore detail drawer as a **floating card** over the canvas (map stays visible around edges), not a full-bleed layer under the HUD.

1. **Drawer on top** — When `workspace--detail` on mobile (`max-width: 768px`), detail drawer `z-index` must exceed `.canvas-hud-controls` (7), `.hud`, and `.rail-toggle` (8), but stay **below** shell nav drawer backdrop/rail (59–60), diet twin entry (`z-index: 30` is ok to sit under drawer while reading detail — user wants detail on top of view rail; twin icon can remain above or equal — prefer drawer `z-index: 28` and leave twin at 30 so avatar still reachable, OR drawer at 32 only when detail open — choose what looks best; **minimum** is above hud controls).

2. **Smaller drawer with breathing room**
   - **Left**: inset ~`var(--space-3)` (8–12px) from canvas edge
   - **Right**: inset enough that content isn’t hidden under the vertical hud stack (~52–56px from right safe area)
   - **Top**: top edge **between the first and second row** of `.canvas-hud-controls`. Controls anchor at `top: calc(var(--space-3) + 56px)` with `gap: 6px` and ~44px-tall buttons — second row starts ~`calc(var(--space-3) + 56px + 44px + 3px)` (~115px). Place drawer `top` around **halfway between first row bottom and second row top** OR align top to **just below first row** (~`calc(var(--space-3) + 56px + 44px + 6px)`). Document chosen token as CSS variable e.g. `--detail-drawer-inset-top` in mobile block.
   - **Bottom**: clear disclaimer — use `bottom: calc(var(--space-3) + env(safe-area-inset-bottom))` or match existing disclaimer height; do not cover entire footer if possible.
   - Rounded corners (`border-radius: var(--radius-panel)`), subtle `box-shadow`, optional light backdrop **on canvas only** (pointer-events none) is optional — only if trivial; not required.

3. **Desktop / tablet** — Do not regress `workspace--detail` side panel above 768px (or keep 1024px split as today).

## Implementation hints

- Add `@media (max-width: 768px) { .workspace--detail .drawer { ... } }` overrides: `position: absolute;` explicit `top/left/right/bottom`, `width: auto`, `height: auto`, higher `z-index`, `border` all around, remove full-height right strip behavior.
- Ensure `.graph-layout` stays `position: relative` so absolute drawer is scoped to canvas stage.
- Check `entryFocusInsets` / `GraphCanvas` only if bottom inset for graph framing must account for shorter drawer (may be unchanged).
- Add or extend a small CSS guard test (e.g. `src/lib/uiChrome.test.ts` or new `detailDrawerChrome.test.ts`) asserting mobile rule contains expected z-index and inset-top pattern.

## Verify

- `npm test` all green
- Commit: `ui: mobile detail drawer above hud with inset panel`
- Do not merge
