import assert from 'node:assert/strict';
import test from 'node:test';
import { DIET_PATTERN_CARDS } from './dietPatterns.ts';
import { knownPatternId, parsePatternList, patternsForTheme, THEME_PATTERN_LINKS } from './patternLinks.ts';

test('pattern links follow the locked theme map and ignore related_themes inversion', () => {
  assert.deepEqual(THEME_PATTERN_LINKS.cardiometabolic, ['mediterranean', 'dash']);
  assert.deepEqual(THEME_PATTERN_LINKS['chronic-inflammation'], ['plant_forward']);
  assert.deepEqual(patternsForTheme('cardiometabolic'), ['mediterranean', 'dash']);
  assert.deepEqual(patternsForTheme('chronic-inflammation'), ['plant_forward']);
  assert.deepEqual(patternsForTheme('fatty_liver'), []);
  assert.deepEqual(patternsForTheme('glycation'), []);
  assert.deepEqual(patternsForTheme('gut-barrier'), []);
  assert.deepEqual(patternsForTheme('ultra-processed'), []);
  assert.deepEqual(patternsForTheme('plant-based'), []);
  assert.deepEqual(patternsForTheme('dietary-fiber'), []);
  assert.deepEqual(patternsForTheme(null), []);
  assert.deepEqual(patternsForTheme(undefined), []);

  const plantForward = DIET_PATTERN_CARDS.find((card) => card.id === 'plant_forward');
  assert.ok(plantForward);
  assert.equal(plantForward.related_themes.includes('cardiometabolic'), true);
  assert.equal(THEME_PATTERN_LINKS.cardiometabolic.includes('plant_forward'), false);
});

test('pattern lists keep known ids and drop unknown ones', () => {
  assert.deepEqual(parsePatternList(null), []);
  assert.deepEqual(parsePatternList(''), []);
  assert.deepEqual(parsePatternList('mediterranean,dash'), ['mediterranean', 'dash']);
  assert.deepEqual(parsePatternList('foo,dash'), ['dash']);
  assert.deepEqual(parsePatternList('foo,dash,dash,mediterranean'), ['dash', 'mediterranean']);
  assert.deepEqual(parsePatternList('Mediterranean,not a id,plant_forward'), ['plant_forward']);
  assert.deepEqual(parsePatternList(' , ,dash'), ['dash']);
  assert.deepEqual(parsePatternList('ultra-processed'), []);
  assert.equal(knownPatternId('dash'), 'dash');
  assert.equal(knownPatternId('nope'), null);
  assert.equal(knownPatternId('Mediterranean'), null);
});
