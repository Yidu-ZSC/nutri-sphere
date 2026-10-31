export type ShapeKind = 'rounded' | 'hex' | 'diamond' | 'octagon';

export function shapeKindForType(type: string): ShapeKind {
  switch (type) {
    case 'diet_pattern':
    case 'food_category':
    case 'food':
      return 'rounded';
    case 'nutrient':
    case 'compound':
    case 'metabolite':
      return 'hex';
    case 'mechanism':
      return 'diamond';
    case 'disease':
    case 'biomarker':
      return 'octagon';
    default:
      return 'rounded';
  }
}

/** World-unit scale. Degree and selection both change the silhouette. */
export function nodeScale(degree: number, type: string, selected: boolean): number {
  const clamped = Math.max(0, Math.min(degree, 8));
  const typeBias = type === 'disease' || type === 'biomarker' ? 1.1 : type === 'mechanism' ? 1.06 : 1;
  const scale = (2.2 + clamped * 0.26) * typeBias;
  return selected ? scale * 1.42 : scale;
}

/**
 * Per-line SpriteText height. Idle/bright stay inside 3.2–4.0; selection is larger.
 */
export function labelTextHeight(selected: boolean, bright: boolean): number {
  if (selected) return 4.6;
  if (bright) return 3.8;
  return 3.3;
}

export function labelShouldShow(options: {
  compact: boolean;
  bright: boolean;
  selected: boolean;
  column: number;
  homeColumn: number;
  nodeY?: number;
  focusY?: number;
  /** How far above the focus a label may sit. `yWindow` sets both sides. */
  above?: number;
  /** How far below the focus a label may sit. Kept shorter on phones so the legend stays clear. */
  below?: number;
  yWindow?: number;
}): boolean {
  if (!options.compact) return true;
  if (options.selected) return true;
  if (!options.bright) return false;
  if (options.column !== options.homeColumn) return false;
  if (options.nodeY == null || options.focusY == null) return true;
  const above = options.above ?? options.yWindow;
  const below = options.below ?? options.yWindow;
  if (above == null || below == null) return true;
  const delta = options.nodeY - options.focusY;
  return delta <= above && delta >= -below;
}
