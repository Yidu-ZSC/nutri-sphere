import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { themeById } from './themes.ts';
import {
  DIET_TWIN_BASED_ON,
  DIET_TWIN_COPY,
  DIET_TWIN_INDICATORS,
  DIET_TWIN_QUESTIONS,
  DIET_TWIN_READINGS,
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
    ...Object.values(DIET_TWIN_READINGS),
    ...Object.values(DIET_TWIN_BASED_ON),
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

test('locked readings and record notes stay exact', () => {
  assert.equal(DIET_TWIN_COPY.persistent, LOCKED_SENTENCE);
  assert.equal(DIET_TWIN_COPY.openGraph, '查看图谱里的相关讨论');
  assert.equal(DIET_TWIN_READINGS.plant, '公开资料中常把更高比例的植物性食物选择与膳食模式讨论联系起来。');
  assert.equal(DIET_TWIN_READINGS.upf, '公开资料中常把更频繁的超加工食品选择与相关机制/观察描述联系起来。');
  assert.equal(DIET_TWIN_READINGS.fiber, '公开资料中常把膳食纤维摄入感受与消化及代谢相关讨论联系起来。');
  assert.equal(DIET_TWIN_READINGS.inflammation, '公开资料中常把多种饮食选择的组合与慢性炎症相关讨论联系起来。');
  assert.equal(DIET_TWIN_BASED_ON.records, '基于你的本地记录（教育模拟）');
  assert.equal(DIET_TWIN_BASED_ON.hypothesis, '基于假设（教育模拟）');
});

test('chain-back targets still exist in the aligned seed and theme list', () => {
  const seed = JSON.parse(
    fs.readFileSync(new URL('../../data/seed_triples_v0.3_aligned.json', import.meta.url), 'utf8'),
  ) as { nodes: { id: string }[] };
  const ids = new Set(seed.nodes.map((node) => node.id));
  for (const link of Object.values(TWIN_LINKS)) {
    assert.equal(ids.has(link.nodeId), true, link.nodeId);
    assert.equal(themeById(link.themeId)?.id, link.themeId);
  }
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
