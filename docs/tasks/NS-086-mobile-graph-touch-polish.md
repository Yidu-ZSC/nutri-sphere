# NS-086: Mobile 2D graph polish (touch, labels, columns, legend chip)

Branch: `feat/mobile-graph-touch-polish` (already checked out).

## User-visible goals (mobile / `compact` explore, hierarchy 2D view)

1. **Column captions overlap** — The four header pills (膳食/食物, 营养素/代谢物, 机制, 健康/疾病) crowd each other. Increase horizontal spacing between the four hierarchy columns on mobile (and ensure captions still frame correctly). Primary knob: `COLUMN_X` in `src/lib/layout.ts` (currently `[-135, -45, 45, 135]`) and/or mobile-specific scaling in framing (`frameGraph2d`, `GraphScene2D` `MOBILE_ZOOM`). Do not break desktop 2D framing.

2. **Inconsistent node labels** — Some visible nodes show name plates, others do not. Root cause is `labelShouldShow` in `src/lib/nodeStyle.ts` used from `GraphScene2D.tsx` `describe()`: on `compact`, labels only show for `bright` nodes in `homeColumn` within a Y window around `focusY`. User wants **all currently visible on-screen nodes** to show labels on mobile (or at least all nodes in the focused neighborhood — interpret as: every rendered node in compact 2D should get `showLabel: true` unless unreadable; avoid empty graph). Update logic + tests in `src/lib/nodeStyle.test.ts`.

3. **Touch targets** — Hard to tap nodes and edges with a finger. Investigate `react-force-graph-2d`:
   - `nodePointerAreaPaint` in `paintNode2d.ts` (`paintGraphNodeHit`) — hit area may be tiny vs visual.
   - `linkHoverPrecision={8}` in `GraphScene2D.tsx` — increase for `props.coarse`.
   - Consider larger hit radius multiplier when `coarse`/`compact`, include label box in hit area always (even when label hidden), and/or minimum screen-pixel hit target (~44px) via `globalScale`.
   - `GraphCanvas.tsx` already sets `coarse` from `(pointer: coarse)`.

4. **Legend collapsed chip** — Bottom-left HUD when legend is collapsed (`hud--legend-collapsed`, `legend--collapsed`). Make the collapsed card **smaller**. Toggle row: text **vertically centered**, **horizontally right-aligned** (likely `legend-toggle` in `src/styles.css` + `Legend.tsx`). Mobile rules near `@media (max-width: 760px)` — currently `max-width: 180px` for collapsed HUD. Adjust styles; keep `src/lib/legendChrome.test.ts` passing (update expectations if intentional).

## Engineering constraints

- Run `npm test` before commit; fix any failures.
- Prefer mobile/compact-scoped changes; don't regress desktop.
- Commit on this branch with message like: `ui: mobile 2D graph touch, labels, column spacing, legend chip`
- Do not merge to main; leave ready for review.

## Key files

- `src/lib/layout.ts` — `COLUMN_X`, framing
- `src/lib/nodeStyle.ts` — `labelShouldShow`
- `src/components/GraphScene2D.tsx` — ForceGraph2D props, mobile zoom
- `src/components/paintNode2d.ts` — paint + hit areas + column captions
- `src/styles.css` — legend / hud mobile
- `src/components/Legend.tsx`
- `src/lib/legendChrome.test.ts`
