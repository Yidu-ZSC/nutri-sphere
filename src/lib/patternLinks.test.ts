import assert from 'node:assert/strict';
import test from 'node:test';
import { knownPatternId, parsePatternList, patternsForTheme, THEME_PATTERN_LINKS } from './patternLinks.ts';

test('pattern links map themes to vegetarian journey cards', () => {
  assert.deepEqual(THEME_PATTERN_LINKS.cardiometabolic, ['plant_forward', 'lacto_ovo', 'vegan_whole']);
  assert.deepEqual(THEME_PATTERN_LINKS['chronic-inflammation'], ['plant_forward', 'lacto_ovo', 'vegan_whole']);
  assert.deepEqual(THEME_PATTERN_LINKS['plant-based'], ['lacto_ovo', 'vegan_whole']);
  assert.deepEqual(patternsForTheme('cardiometabolic'), ['plant_forward', 'lacto_ovo', 'vegan_whole']);
  assert.deepEqual(patternsForTheme('plant-based'), ['lacto_ovo', 'vegan_whole']);
  assert.deepEqual(patternsForTheme('fatty_liver'), []);
  assert.deepEqual(patternsForTheme(null), []);
});

test('pattern lists keep known ids and drop unknown ones', () => {
  assert.deepEqual(parsePatternList(null), []);
  assert.deepEqual(parsePatternList(''), []);
  assert.deepEqual(parsePatternList('plant_forward,lacto_ovo'), ['plant_forward', 'lacto_ovo']);
  assert.deepEqual(parsePatternList('foo,lacto_ovo'), ['lacto_ovo']);
  assert.deepEqual(parsePatternList('foo,lacto_ovo,lacto_ovo,vegan_whole'), ['lacto_ovo', 'vegan_whole']);
  assert.deepEqual(parsePatternList('Mediterranean,not a id,plant_forward'), ['plant_forward']);
  assert.deepEqual(parsePatternList(' , ,lacto_ovo'), ['lacto_ovo']);
  assert.deepEqual(parsePatternList('ultra-processed'), []);
  assert.equal(knownPatternId('lacto_ovo'), 'lacto_ovo');
  assert.equal(knownPatternId('mediterranean'), null);
  assert.equal(knownPatternId('dash'), null);
  assert.equal(knownPatternId('nope'), null);
});
