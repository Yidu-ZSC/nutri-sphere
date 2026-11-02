import type { PALETTE } from './palette.ts';
import type { ExploreTheme } from './themes.ts';

type Direction = keyof typeof PALETTE;

/**
 * Visual accent for a lobby card and the matching left-rail chip.
 * Values mirror the anchor node's `group` in the seed. Theme ids stay unchanged.
 */
const THEME_ACCENT: Record<string, Direction> = {
  cardiometabolic: 'risk',
  fatty_liver: 'risk',
  obesity_risk: 'risk',
  ibd_related: 'risk',
  liver_chronic: 'risk',
  digestive_cancer_risk: 'risk',
  autoimmune: 'risk',
  mental_health: 'risk',
  breast_prostate_risk: 'risk',
  'chronic-inflammation': 'risk',
  'gut-barrier': 'risk',
  glycation: 'risk',
  'ultra-processed': 'risk',
  'plant-based': 'protective',
  'dietary-fiber': 'protective',
};

export function themeAccent(theme: ExploreTheme): Direction {
  return THEME_ACCENT[theme.id] ?? 'neutral';
}
