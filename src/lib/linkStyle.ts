import { linkWidthForStrength } from './palette.ts';

/**
 * Phase 1.5 drew 3D tubes at 1.45× strength and 0.92 opacity.
 * Explore mode stays well under that so edges read as links, not a hairball.
 * 2D widths are screen pixels: force-graph divides them by the current zoom.
 */
export const LINK_WIDTH_SCALE_3D = 0.4;
export const LINK_OPACITY_3D = 0.4;
export const LINK_WIDTH_SCALE_2D = 1.2;
export const LINK_PARTICLE_WIDTH_3D = 0.8;

export function styledLinkWidth(
  strength: string | undefined,
  surface: '2d' | '3d',
  selected: boolean,
): number {
  const scale = surface === '2d' ? LINK_WIDTH_SCALE_2D : LINK_WIDTH_SCALE_3D;
  const base = linkWidthForStrength(strength) * scale;
  if (!selected) return base;
  return base + (surface === '2d' ? 1.15 : 0.35);
}

/** Idle graphs stay still. Motion is reserved for a selection or an active filter. */
export function particleCount(options: {
  coarse: boolean;
  selected: boolean;
  focused: boolean;
  filtered: boolean;
}): number {
  if (options.coarse) return 0;
  if (options.selected) return 2;
  if (options.filtered && options.focused) return 1;
  return 0;
}
