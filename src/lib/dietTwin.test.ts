import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DIET_TWIN_COPY,
  DIET_TWIN_INDICATORS,
  DIET_TWIN_QUESTIONS,
  DIET_TWIN_STORAGE_KEY,
  TWIN_LINKS,
  bandLabel,
  buildSnapshot,
  indicatorBand,
  inflammationBand,
  parseDietTwinSnapshot,
  readDietTwin,
  twinExploreTarget,
  withAssumption,
  writeDietTwin,
  type DietTwinAnswers,
} from './dietTwin.ts';

const LOCKED_SENTENCE = '这是教育模拟，不是你个人的健康检测或诊断。';

const LOW_ASSOCIATION: DietTwinAnswers = {
  plant: 'plant_high',
  upf: 'upf_rare',
  fiber: 'fiber_high',
};

const HIGH_ASSOCIATION: DietTwinAnswers = {
  plant: 'plant_low',
  upf: 'upf_daily',
  fiber: 'fiber_low',
};

function memoryStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial != null) data.set(DIET_TWIN_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    raw: () => data.get(DIET_TWIN_STORAGE_KEY) ?? null,
  };
}

test('twin copy stays educational and hides score language', () => {
  assert.equal(DIET_TWIN_COPY.persistent, LOCKED_SENTENCE);
  assert.equal(DIET_TWIN_STORAGE_KEY, 'cleardiet.dietTwin');
  const visible = [
    ...Object.values(DIET_TWIN_COPY),
    ...DIET_TWIN_QUESTIONS.flatMap((question) => [question.prompt, ...question.options.map((option) => option.label)]),
    ...DIET_TWIN_INDICATORS.flatMap((indicator) => [indicator.label, indicator.caption ?? '']),
  ];
  for (const text of visible) {
    assert.equal(text.includes('分'), false, text);
    assert.equal(text.includes('风险'), false, text);
    assert.equal(text.includes('推荐'), false, text);
    assert.equal(text.includes('处方'), false, text);
    assert.equal(text.includes('疗效'), false, text);
  }
  assert.equal(DIET_TWIN_QUESTIONS.length, 3);
  assert.deepEqual(
    DIET_TWIN_QUESTIONS.map((question) => question.options.length),
    [3, 3, 3],
  );
});

test('direct bars follow one question and inflammation is a three-band weight', () => {
  assert.equal(indicatorBand('plant', LOW_ASSOCIATION), 'high');
  assert.equal(indicatorBand('plant', HIGH_ASSOCIATION), 'low');
  assert.equal(indicatorBand('upf', { ...LOW_ASSOCIATION, upf: 'upf_weekly' }), 'mid');
  assert.equal(indicatorBand('fiber', { ...LOW_ASSOCIATION, fiber: 'fiber_low' }), 'low');
  assert.equal(inflammationBand(LOW_ASSOCIATION), 'low');
  assert.equal(inflammationBand(HIGH_ASSOCIATION), 'high');
  assert.equal(
    inflammationBand({ plant: 'plant_mid', upf: 'upf_weekly', fiber: 'fiber_mid' }),
    'mid',
  );
  assert.equal(inflammationBand({ plant: 'plant_high', upf: 'upf_weekly', fiber: 'fiber_high' }), 'low');
  assert.equal(inflammationBand({ plant: 'plant_high', upf: 'upf_daily', fiber: 'fiber_high' }), 'mid');
  assert.equal(inflammationBand({ plant: 'plant_low', upf: 'upf_daily', fiber: 'fiber_high' }), 'mid');
  assert.equal(inflammationBand({ plant: 'plant_low', upf: 'upf_daily', fiber: 'fiber_mid' }), 'high');
  assert.equal(bandLabel('low'), '低');
  assert.equal(bandLabel('mid'), '中');
  assert.equal(bandLabel('high'), '高');
  const shifted = { ...LOW_ASSOCIATION, upf: 'upf_daily' as const };
  assert.notEqual(indicatorBand('upf', LOW_ASSOCIATION), indicatorBand('upf', shifted));
  assert.notEqual(inflammationBand(LOW_ASSOCIATION), inflammationBand(HIGH_ASSOCIATION));
});

test('storage overwrites one snapshot and drops corrupt data', () => {
  const store = memoryStorage();
  const first = buildSnapshot(LOW_ASSOCIATION);
  writeDietTwin(first, store);
  const changed = withAssumption(first, HIGH_ASSOCIATION);
  writeDietTwin(changed, store);
  const restored = readDietTwin(store);
  assert.deepEqual(restored?.answers, LOW_ASSOCIATION);
  assert.deepEqual(restored?.assumption, HIGH_ASSOCIATION);
  assert.equal(restored?.v, 1);
  const raw = JSON.parse(store.raw() ?? '{}') as { v: number; answers: unknown; assumption: unknown };
  assert.deepEqual(Object.keys(raw).sort(), ['answers', 'assumption', 'v']);
  assert.equal(parseDietTwinSnapshot(null), null);
  assert.equal(parseDietTwinSnapshot(''), null);
  assert.equal(parseDietTwinSnapshot('{'), null);
  assert.equal(parseDietTwinSnapshot('[]'), null);
  assert.equal(parseDietTwinSnapshot(JSON.stringify({ v: 2, answers: first.answers, assumption: first.assumption })), null);
  assert.equal(parseDietTwinSnapshot(JSON.stringify({ v: 1, answers: first.answers })), null);
  assert.equal(
    parseDietTwinSnapshot(
      JSON.stringify({ v: 1, answers: { ...first.answers, plant: 'lots' }, assumption: first.assumption }),
    ),
    null,
  );
  assert.equal(readDietTwin(memoryStorage('not-json')), null);
});

test('chain-back prefers the locked node and falls back to the theme', () => {
  assert.deepEqual(TWIN_LINKS.plant, { nodeId: 'plant_based_diet', themeId: 'plant-based' });
  assert.deepEqual(TWIN_LINKS.upf, { nodeId: 'ultra_processed', themeId: 'ultra-processed' });
  assert.deepEqual(TWIN_LINKS.fiber, { nodeId: 'dietary_fiber', themeId: 'dietary-fiber' });
  assert.deepEqual(TWIN_LINKS.inflammation, { nodeId: 'chronic_inflammation', themeId: 'chronic-inflammation' });
  const present = new Set(['plant_based_diet', 'ultra_processed', 'dietary_fiber', 'chronic_inflammation']);
  assert.deepEqual(twinExploreTarget('fiber', present), {
    nodeId: 'dietary_fiber',
    themeId: 'dietary-fiber',
  });
  assert.deepEqual(twinExploreTarget('inflammation', new Set(['plant_based_diet'])), {
    nodeId: null,
    themeId: 'chronic-inflammation',
  });
  assert.deepEqual(twinExploreTarget('plant', null), { nodeId: null, themeId: 'plant-based' });
});
