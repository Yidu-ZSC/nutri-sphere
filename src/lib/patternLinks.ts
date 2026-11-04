import { normalizeVeganDietPatternId } from './dietPatternDetails.ts';
import { DIET_PATTERN_CARDS } from './dietPatterns.ts';

/**
 * Theme id → diet-pattern card ids on the ClearDiet vegetarian journey.
 */
export const THEME_PATTERN_LINKS: Readonly<Record<string, readonly string[]>> = {
  cardiometabolic: ['plant_forward', 'lacto_ovo', 'vegan_whole'],
  'chronic-inflammation': ['plant_forward', 'lacto_ovo', 'vegan_whole'],
  'plant-based': ['lacto_ovo', 'vegan_whole'],
};

const PATTERN_ID = /^[a-z0-9_]+$/;

const KNOWN_PATTERN_IDS = new Set(DIET_PATTERN_CARDS.map((card) => card.id));

export function patternsForTheme(themeId: string | null | undefined): readonly string[] {
  if (!themeId) return [];
  return THEME_PATTERN_LINKS[themeId] ?? [];
}

export function knownPatternId(value: string | null | undefined): string | null {
  return normalizeVeganDietPatternId(value);
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
