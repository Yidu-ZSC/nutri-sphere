# NS-088: Focus chip — drop prefix, lock replaces clear

Branch: `feat/focus-chip-lock-ns088` (checked out).

## User goals

1. **Remove visible copy `已聚焦：`** — The push-out chip shows only the focused node **label** (e.g. `膳食脂肪`), not the prefix.
2. **Replace 「清除聚焦」 with a lock icon** on that chip — same row as the label, not a text button.
3. **Lock semantics (unified browsing lock):**
   - **Locked:** Canvas bright set / focus root **does not change** when the user taps other nodes or edges (detail drawer still opens).
   - **Locked:** The horizontal chip **must not auto-open** when the user taps a node; it only expands/collapses when the user taps the **focus (crosshair) icon** on the view rail.
   - **Unlocked:** Existing behavior — tapping a node updates click-focus and may open the chip / reframing as today.

## Recommended implementation (study conclusion)

Today there are **two** lock concepts; **merge into one** for clarity:

| Current | Problem |
|---------|---------|
| `themeHighlightLocked` + rail `theme-highlight-lock` button | Only when theme/lens filters active; clears `clickFocusId` on lock — fights click-focus chip in screenshot |
| `clear-click-focus` text button | Clears focus; user wants **hold** focus, not clear |
| `useEffect` sets `focusChipOpen` when `clickFocusId` changes | Violates “no auto popup when locked” |

### Proposed model

- Rename mentally to **`highlightBrowseLocked`** (keep state name or refactor `themeHighlightLocked` → `highlightBrowseLocked` if it reduces confusion).
- **Single lock control** in `click-focus-banner` (chip), **remove** duplicate lock button from `focus-hud-group` rail segment.
- **When lock turns ON:** snapshot the frozen browse root:
  - Prefer current `clickFocusId` if set; else if theme/lens context, keep theme bright via existing `resolveCanvasFocus` filter branch (`focusRoot: null`, `brightIds: focusIds`).
  - Do **not** clear `clickFocusId` when locking (fix `onThemeHighlightLockToggle`).
- **When locked:**
  - `selectNode`: only `setSelection` — never `setClickFocusId`.
  - `selectLink`: only `setSelection` (already).
  - `resolveCanvasFocus`: pass `locked: true` and use snapshotted root / filter (extend `resolveCanvasFocus` or add `lockedFocusRoot: string | null`).
  - `anchorId`: do not follow selection on mobile when locked (already partially for theme).
  - **Chip open state:** remove auto-open on focus change when locked:
    ```ts
    useEffect(() => {
      if (clickFocusId != null && !highlightBrowseLocked) setFocusChipOpen(true);
    }, [clickFocusId, highlightBrowseLocked]);
    ```
  - On node/link select while locked: **do not** set `focusChipOpen(true)` (ensure no other code path opens chip).
- **When lock turns OFF:** next node tap may move click-focus again; chip may auto-open on new focus if unlocked (current effect).
- **Accessibility:** lock button `aria-pressed`, labels from `exploreShell.ts` (repurpose `THEME_HIGHLIGHT_*` or rename to `FOCUS_LOCK_*`; drop reliance on `CLEAR_CLICK_FOCUS` in UI; keep clearing logic only if unlock should clear — **product:** lock toggled off = browse unlocked, focus **unchanged** unless user taps focus icon to clear — document choice: **unlock does not clear focus**; user changes focus by tapping nodes when unlocked, or add long-press later).

### UI (`FocusHud.tsx`)

- Chip: `<span>{focusLabel}</span>` only (no `CLICK_FOCUS_PREFIX`).
- Replace `click-focus-clear` with lock toggle using existing `LockIcon`; `data-testid="focus-highlight-lock"` (deprecate `clear-click-focus` and `theme-highlight-lock` on rail).
- Show chip lock whenever `focusLabel != null` **or** `hasThemeHighlightContext` with an active bright filter (if chip is shown for theme-only, show label from theme anchor node label).

### Copy / tests

- Update `src/lib/focusHud.test.ts` (no prefix in component; lock in banner; no rail lock).
- Update `src/lib/exploreShell.ts` constants; adjust tests that assert `CLICK_FOCUS_PREFIX` in rendered HUD if any.
- Extend `src/lib/focus.test.ts` for locked + click-root snapshot behavior if logic moves there.
- Style: `.click-focus-clear` → `.click-focus-lock` (reuse lock active styles from `.focus-hud-lock.is-locked`).

### Regression checks

- Theme entry still sensible: optional default locked on `enterTheme` — **keep** `setHighlightBrowseLocked(true)` on theme enter if product still wants that, but chip should not pop until focus icon unless unlocked auto-open rules say otherwise.
- Focus icon without focus: still draws random mechanism when unlocked; when locked with theme, only toggles chip if `clickFocusId` — refine so theme-only locked can still expand chip via focus icon showing theme anchor name.

## Verification

- `npm test` all green
- Commit: `ui: focus chip label and browse lock on banner`
- Do not merge

## Key files

- `src/components/FocusHud.tsx`
- `src/App.tsx`
- `src/lib/focus.ts`
- `src/lib/exploreShell.ts`
- `src/styles.css` (chip lock button)
- `src/lib/focusHud.test.ts`
