import assert from 'node:assert/strict';
import test from 'node:test';
import {
  pickBestEdge,
  scoreCandidate,
  truncateAtSentence,
  normalizeExcerpt,
} from './map-weread-to-evidences.mjs';

const nodesById = new Map([
  [
    'mushrooms',
    { id: 'mushrooms', type: 'food', label: '蘑菇', aliases: ['白蘑菇'] },
  ],
  [
    'beta_glucan',
    { id: 'beta_glucan', type: 'compound', label: 'β-葡聚糖', aliases: ['葡聚糖'] },
  ],
  [
    'epigenetic_positive',
    { id: 'epigenetic_positive', type: 'mechanism', label: '有益表观遗传修饰', aliases: ['表观遗传', 'DNA'] },
  ],
  [
    'omega3',
    { id: 'omega3', type: 'nutrient', label: 'ω-3', aliases: ['多不饱和脂肪酸'] },
  ],
]);

test('dual-end hit → pass / attach', () => {
  const link = {
    source: 'mushrooms',
    target: 'beta_glucan',
    relation: '提供 β-葡聚糖',
    source_id: 'eat_to_heal',
    evidences: [{ excerpt: '短摘录', limitations: '书摘', source_title: 't', source_file: 'x.md', source_id: 'eat_to_heal' }],
  };
  const T = '白蘑菇是生物活性物质的良好来源，包括刺激免疫系统的膳食纤维β-葡聚糖。';
  const scored = scoreCandidate(T, link, nodesById);
  assert.equal(scored.bothEnds, true);
  assert.ok(scored.score >= 3);
  assert.equal(scored.pass, true);
  const pick = pickBestEdge(T, [link], nodesById);
  assert.equal(pick.status, 'attach');
});

test('low score / hub oneStrong-only → skip', () => {
  const link = {
    source: 'omega3',
    target: 'epigenetic_positive',
    relation: 'ω-3多不饱和脂肪酸具有抗氧化作用，可以对抗自由基造成的DNA破坏',
    source_id: 'eat_to_heal',
    evidences: [{ excerpt: 'x'.repeat(250), limitations: '书摘', source_title: 't', source_file: 'x.md', source_id: 'eat_to_heal' }],
  };
  // Only broad epigenetic/DNA tokens — no omega3 food side → should not auto-pass
  const T = '端粒保护染色体末端免受损伤，从而在保护DNA方面发挥着重要作用。表观遗传也会随年龄变化。';
  const scored = scoreCandidate(T, link, nodesById);
  assert.equal(scored.pass, false);
  const pick = pickBestEdge(T, [link], nodesById);
  assert.equal(pick.status, 'skipped');
});

test('truncateAtSentence respects 1200 and sentence boundary', () => {
  const long = `${'甲'.repeat(100)}。${'乙'.repeat(1100)}。${'丙'.repeat(50)}`;
  const out = truncateAtSentence(long, 1200);
  assert.ok(out.length <= 1200);
  assert.ok(out.endsWith('。') || out.length === 1200);
});

test('normalizeExcerpt collapses whitespace and NFKC', () => {
  assert.equal(normalizeExcerpt('你好  世界\n！'), '你好世界!');
});
