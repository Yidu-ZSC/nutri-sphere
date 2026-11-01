import { DIET_PATTERN_CARDS } from './dietPatterns.ts';

/**
 * Theme id → diet-pattern card ids.
 * Locked to the product mapping. Do not invert `related_themes`:
 * `plant_forward` lists `cardiometabolic`, and that card stays off this map.
 */
export const THEME_PATTERN_LINKS: Readonly<Record<string, readonly string[]>> = {
  cardiometabolic: ['mediterranean', 'dash'],
  'chronic-inflammation': ['plant_forward'],
};

const PATTERN_ID = /^[a-z0-9_]+$/;

const KNOWN_PATTERN_IDS = new Set(DIET_PATTERN_CARDS.map((card) => card.id));

export function patternsForTheme(themeId: string | null | undefined): readonly string[] {
  if (!themeId) return [];
  return THEME_PATTERN_LINKS[themeId] ?? [];
}

/** Keep known pattern ids, drop unknown or malformed ones, and preserve first-seen order. */
export function parsePatternList(value: string | null | undefined): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const raw of value.split(',')) {
    const id = raw.trim();
    if (!PATTERN_ID.test(id) || !KNOWN_PATTERN_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}
