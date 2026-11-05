import assert from 'node:assert/strict';
import test from 'node:test';
import { DIET_PATTERN_CARDS } from './dietPatterns.ts';
import { themeById } from './themes.ts';

const banned = ['治疗', '治愈', '处方', '请服用', '停药', '替代医生', 'GRADE', '降低', '预防', '逆转', '疗效', '防治', '患者'];

test('diet pattern cards match the ClearDiet vegetarian journey and resolve to existing themes', () => {
  assert.equal(DIET_PATTERN_CARDS.length, 3);
  assert.deepEqual(DIET_PATTERN_CARDS.map((card) => card.id), ['plant_forward', 'lacto_ovo', 'vegan_whole']);
  assert.deepEqual(
    DIET_PATTERN_CARDS.map((card) => card.journey_stage),
    ['起步', '进阶', '深入'],
  );

  const hooks = new Set(DIET_PATTERN_CARDS.map((card) => card.hook));
  assert.equal(hooks.size, 3, 'each lobby card needs a distinct hook');

  for (const card of DIET_PATTERN_CARDS) {
    assert.ok(card.hook.trim().length > 0, card.id);
    assert.equal(card.lobby_facets.length, 3, card.id);
    assert.deepEqual(
      card.lobby_facets.map((facet) => facet.kind),
      ['plate', 'belief', 'try'],
    );
    assert.ok(themeById(card.primary_theme), `${card.id} primary_theme`);
    assert.ok(card.practice_hint.trim().length > 0, card.id);
    assert.ok(card.related_themes.length > 0, card.id);
    for (const themeId of card.related_themes) {
      assert.ok(themeById(themeId), `${card.id} related theme ${themeId}`);
    }
    const copy = [
      card.title,
      card.hook,
      ...card.lobby_facets.map((f) => f.body),
      card.summary,
      card.practice_hint,
      card.emphasize,
      card.limit,
      card.evidence_note,
    ].join('\n');
    for (const word of banned) {
      assert.equal(copy.includes(word), false, `${card.id} ${word}`);
    }
  }
});
