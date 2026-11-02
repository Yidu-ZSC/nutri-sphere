import assert from 'node:assert/strict';
import test from 'node:test';
import { DIET_TWIN_STORAGE_KEY, buildSnapshot, type Band, type DietTwinAnswers } from './dietTwin.ts';
import {
  DIET_TWIN_INFERENCE_DAYS,
  DIET_TWIN_RECORD_LIMIT,
  DIET_TWIN_V1_STORAGE_KEY,
  FIBER_LEXICON,
  PLANT_LEXICON,
  UPF_LEXICON,
  addRecords,
  answersFromHypothesis,
  bandFromRatio,
  defaultBasedOn,
  deleteRecord,
  emptyDietTwinStore,
  formatLocalDate,
  hypothesisFromAnswers,
  hypothesisFromLegacyRaw,
  inferFromRecords,
  inflammationFromBands,
  inLastDays,
  inputsFromPaste,
  linesFromPaste,
  loadDietTwin,
  openDietTwin,
  parseDietTwinStore,
  recordsInRange,
  resolveSnapshot,
  saveDietTwin,
  shiftIsoDate,
  textHitsAny,
  withSnapshot,
  type DietHypothesis,
  type DietRecord,
  type DietTwinStorage,
  type DietTwinStore,
} from './dietTwinStore.ts';

const NOW = new Date(2026, 10, 2, 9, 30, 0);
const TODAY = '2026-11-02';

const ASSUMPTION: DietTwinAnswers = {
  plant: 'plant_high',
  upf: 'upf_rare',
  fiber: 'fiber_high',
};

const ANSWERS: DietTwinAnswers = {
  plant: 'plant_low',
  upf: 'upf_daily',
  fiber: 'fiber_low',
};

function memory(seed?: Record<string, string>): DietTwinStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(seed ?? {}));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

function record(partial: Partial<DietRecord> & Pick<DietRecord, 'id' | 'text' | 'date'>): DietRecord {
  return {
    meal: 'snack',
    createdAt: `${partial.date}T00:00:00.000Z`,
    ...partial,
  };
}

function storeWith(records: DietRecord[], hypothesis: DietHypothesis | null = null): DietTwinStore {
  return { version: 1, records, hypothesis, lastSnapshot: null };
}

test('lexicon stays on the locked lists', () => {
  assert.deepEqual(PLANT_LEXICON, ['蔬菜', '青菜', '豆', '大豆', '豆腐', '全谷', '糙米', '燕麦', '水果', '坚果', '素', '菌菇', '薯']);
  assert.deepEqual(UPF_LEXICON, ['零食', '薯片', '饮料', '可乐', '即食', '方便面', '罐头', '加工肉', '火腿', '香肠', '鸡块', '速冻', '风味']);
  assert.deepEqual(FIBER_LEXICON, ['纤维', '豆', '全谷', '燕麦', '糙米', '蔬菜', '青菜', '水果', '薯']);
  assert.equal(textHitsAny('Snack', ['snack']), true);
  assert.equal(textHitsAny('燕麦', ['snack']), false);
});

test('questionnaire enums map both ways without dropping a filled assumption', () => {
  const rows: DietTwinAnswers[] = [
    { plant: 'plant_low', upf: 'upf_rare', fiber: 'fiber_low' },
    { plant: 'plant_mid', upf: 'upf_weekly', fiber: 'fiber_mid' },
    { plant: 'plant_high', upf: 'upf_daily', fiber: 'fiber_high' },
  ];
  for (const answers of rows) {
    const hypothesis = hypothesisFromAnswers(answers);
    assert.deepEqual(answersFromHypothesis(hypothesis), answers);
  }
  assert.deepEqual(hypothesisFromAnswers(ASSUMPTION), {
    plantRatio: 'high',
    upfFreq: 'low',
    fiberFeel: 'high',
  });
  assert.deepEqual(hypothesisFromAnswers(ANSWERS), {
    plantRatio: 'low',
    upfFreq: 'high',
    fiberFeel: 'low',
  });
});

test('migration keeps the assumption, then the answers, and deletes the old key only after a successful write', () => {
  const legacy = buildSnapshot(ANSWERS);
  legacy.assumption = ASSUMPTION;
  const storage = memory({ [DIET_TWIN_STORAGE_KEY]: JSON.stringify(legacy) });
  const loaded = loadDietTwin(storage, NOW);
  assert.deepEqual(loaded.hypothesis, hypothesisFromAnswers(ASSUMPTION));
  assert.deepEqual(loaded.records, []);
  assert.equal(loaded.lastSnapshot?.basedOn, 'hypothesis');
  assert.equal(loaded.lastSnapshot?.plantRatio, 'high');
  assert.equal(loaded.lastSnapshot?.upfFreq, 'low');
  assert.equal(loaded.lastSnapshot?.fiberFeel, 'high');
  assert.equal(loaded.lastSnapshot?.inflammationDir, 'low');
  assert.equal(loaded.lastSnapshot?.updatedAt, NOW.toISOString());
  assert.equal(storage.getItem(DIET_TWIN_STORAGE_KEY), null);
  assert.equal(storage.getItem(DIET_TWIN_V1_STORAGE_KEY)?.includes('"version":1'), true);
  const again = loadDietTwin(storage, NOW);
  assert.deepEqual(again.hypothesis, loaded.hypothesis);

  const answersOnly = memory({
    [DIET_TWIN_STORAGE_KEY]: JSON.stringify({ v: 1, answers: ANSWERS }),
  });
  const fromAnswers = loadDietTwin(answersOnly, NOW);
  assert.deepEqual(fromAnswers.hypothesis, hypothesisFromAnswers(ANSWERS));
  assert.equal(fromAnswers.lastSnapshot?.inflammationDir, 'high');
  assert.equal(answersOnly.getItem(DIET_TWIN_STORAGE_KEY), null);

  const assumptionOnly = memory({
    [DIET_TWIN_STORAGE_KEY]: JSON.stringify({ v: 1, assumption: ASSUMPTION }),
  });
  assert.deepEqual(loadDietTwin(assumptionOnly, NOW).hypothesis, hypothesisFromAnswers(ASSUMPTION));
  assert.equal(hypothesisFromLegacyRaw(null), null);
  assert.equal(hypothesisFromLegacyRaw('{'), null);
});

test('a valid new store is not overwritten, and bad legacy data does not throw', () => {
  const existing: DietTwinStore = storeWith(
    [record({ id: 'keep', text: '白粥', date: TODAY })],
    { plantRatio: 'low', upfFreq: 'low', fiberFeel: 'low' },
  );
  const storage = memory({
    [DIET_TWIN_V1_STORAGE_KEY]: JSON.stringify(existing),
    [DIET_TWIN_STORAGE_KEY]: JSON.stringify(buildSnapshot(ASSUMPTION)),
  });
  const loaded = loadDietTwin(storage, NOW);
  assert.equal(loaded.records[0]?.text, '白粥');
  assert.equal(loaded.hypothesis?.plantRatio, 'low');
  assert.equal(storage.getItem(DIET_TWIN_STORAGE_KEY)?.includes('plant_high'), true);

  const broken = memory({ [DIET_TWIN_STORAGE_KEY]: '{' });
  assert.deepEqual(loadDietTwin(broken, NOW), emptyDietTwinStore());
  assert.equal(broken.getItem(DIET_TWIN_STORAGE_KEY), '{');
  assert.equal(broken.getItem(DIET_TWIN_V1_STORAGE_KEY), null);

  const corruptNew = memory({
    [DIET_TWIN_V1_STORAGE_KEY]: '{',
    [DIET_TWIN_STORAGE_KEY]: JSON.stringify(buildSnapshot(ASSUMPTION)),
  });
  const migrated = loadDietTwin(corruptNew, NOW);
  assert.equal(migrated.hypothesis?.plantRatio, 'high');
  assert.equal(corruptNew.getItem(DIET_TWIN_STORAGE_KEY), null);
  assert.equal(parseDietTwinStore(corruptNew.getItem(DIET_TWIN_V1_STORAGE_KEY))?.version, 1);

  const fullDisk = memory({ [DIET_TWIN_STORAGE_KEY]: JSON.stringify(buildSnapshot(ASSUMPTION)) });
  const failing: DietTwinStorage = {
    getItem: (key) => fullDisk.getItem(key),
    setItem: () => {
      throw new Error('full');
    },
    removeItem: (key) => fullDisk.removeItem(key),
  };
  const unsaved = loadDietTwin(failing, NOW);
  assert.equal(unsaved.hypothesis?.fiberFeel, 'high');
  assert.equal(fullDisk.getItem(DIET_TWIN_STORAGE_KEY)?.includes('plant_high'), true);

  const exploding: DietTwinStorage = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {},
    removeItem: () => {},
  };
  assert.deepEqual(loadDietTwin(exploding, NOW), emptyDietTwinStore());
  assert.equal(parseDietTwinStore(null), null);
  assert.equal(parseDietTwinStore(''), null);
  assert.equal(parseDietTwinStore('{'), null);
  assert.equal(parseDietTwinStore('[]'), null);
  assert.equal(parseDietTwinStore(JSON.stringify({ version: 2, records: [] })), null);
  assert.equal(parseDietTwinStore(JSON.stringify({ version: 1 })), null);
});

test('bad rows inside a valid store are dropped instead of breaking the screen', () => {
  const raw = {
    version: 1,
    records: [
      record({ id: 'ok', text: '  燕麦  ', date: TODAY }),
      { id: '', date: TODAY, meal: 'snack', text: '燕麦', createdAt: NOW.toISOString() },
      { id: 'bad-date', date: '2026-02-31', meal: 'snack', text: '燕麦', createdAt: NOW.toISOString() },
      { id: 'bad-meal', date: TODAY, meal: 'brunch', text: '燕麦', createdAt: NOW.toISOString() },
      { id: 'long', date: TODAY, meal: 'snack', text: '豆'.repeat(201), createdAt: NOW.toISOString() },
    ],
    hypothesis: { plantRatio: 'huge' },
    lastSnapshot: { plantRatio: 'low' },
  };
  const parsed = parseDietTwinStore(JSON.stringify(raw));
  assert.equal(parsed?.records.length, 1);
  assert.equal(parsed?.records[0]?.text, '燕麦');
  assert.equal(parsed?.hypothesis, null);
  assert.equal(parsed?.lastSnapshot, null);
});

test('adding, pasting, and deleting honor text, date, meal, and the 200 cap', () => {
  let next = 0;
  const ids = () => `id-${next++}`;
  const empty = emptyDietTwinStore();
  const trimmed = addRecords(empty, [{ date: TODAY, meal: 'lunch', text: '  燕麦  ' }], NOW, ids);
  assert.equal(trimmed.added[0]?.text, '燕麦');
  assert.equal(trimmed.added[0]?.meal, 'lunch');
  assert.equal(trimmed.added[0]?.createdAt, NOW.toISOString());
  assert.equal(empty.records.length, 0);
  assert.deepEqual(Object.keys(trimmed.added[0] ?? {}).sort(), ['createdAt', 'date', 'id', 'meal', 'text']);

  const rejected = addRecords(
    empty,
    [
      { date: TODAY, meal: 'snack', text: '   ' },
      { date: TODAY, meal: 'snack', text: '豆'.repeat(201) },
      { date: '2026-02-31', meal: 'snack', text: '燕麦' },
      { date: '2026-13-01', meal: 'snack', text: '燕麦' },
      { date: 'today', meal: 'snack', text: '燕麦' },
      { date: TODAY, meal: 'brunch', text: '燕麦' },
      { date: TODAY, meal: 'snack', text: '豆'.repeat(200) },
    ],
    NOW,
    ids,
  );
  assert.deepEqual(
    rejected.rejected.map((item) => item.reason),
    ['text', 'text', 'date', 'date', 'date', 'meal'],
  );
  assert.equal(rejected.added.length, 1);
  assert.equal(rejected.added[0]?.text.length, 200);

  assert.deepEqual(linesFromPaste(' \n燕麦\r\n\r\n  可乐  \n'), ['燕麦', '可乐']);
  const pasted = addRecords(empty, inputsFromPaste(' \n燕麦\r\n\n可乐\n', TODAY), NOW, ids);
  assert.deepEqual(
    pasted.added.map((item) => ({ meal: item.meal, date: item.date, text: item.text })),
    [
      { meal: 'snack', date: TODAY, text: '燕麦' },
      { meal: 'snack', date: TODAY, text: '可乐' },
    ],
  );

  const almost = storeWith(
    Array.from({ length: DIET_TWIN_RECORD_LIMIT - 1 }, (_, index) =>
      record({ id: `filled-${index}`, text: '水', date: TODAY, createdAt: new Date(2026, 10, 2, 8, 0, index).toISOString() }),
    ),
  );
  const capped = addRecords(
    almost,
    [
      { date: TODAY, meal: 'snack', text: '第一' },
      { date: TODAY, meal: 'snack', text: '第二' },
      { date: TODAY, meal: 'snack', text: '第三' },
    ],
    NOW,
    ids,
  );
  assert.equal(capped.added.length, 1);
  assert.equal(capped.added[0]?.text, '第一');
  assert.deepEqual(
    capped.rejected.map((item) => item.reason),
    ['limit', 'limit'],
  );
  assert.equal(capped.store.records.length, DIET_TWIN_RECORD_LIMIT);
  assert.equal(capped.store.records[0]?.id, 'filled-0');
  assert.equal(almost.records.length, DIET_TWIN_RECORD_LIMIT - 1);
  const blocked = addRecords(capped.store, [{ date: TODAY, meal: 'snack', text: '再来' }], NOW, ids);
  assert.equal(blocked.added.length, 0);
  assert.equal(blocked.rejected[0]?.reason, 'limit');
  assert.equal(blocked.store.records.length, DIET_TWIN_RECORD_LIMIT);

  const removed = deleteRecord(trimmed.store, trimmed.added[0]?.id ?? '');
  assert.equal(removed.records.length, 0);
  assert.equal(deleteRecord(removed, 'missing'), removed);
});

test('seven-day windows, list ranges, and ratio cutoffs', () => {
  assert.equal(formatLocalDate(NOW), TODAY);
  assert.equal(shiftIsoDate('2026-01-01', -6), '2025-12-26');
  assert.equal(inLastDays('2026-10-27', TODAY, 7), true);
  assert.equal(inLastDays('2026-10-26', TODAY, 7), false);
  assert.equal(inLastDays(TODAY, TODAY, 7), true);
  assert.equal(inLastDays('2026-11-03', TODAY, 7), false);
  assert.equal(inLastDays('2026-10-04', TODAY, 30), true);
  assert.equal(inLastDays('2026-10-03', TODAY, 30), false);
  assert.equal(DIET_TWIN_INFERENCE_DAYS, 7);

  const records = [
    record({ id: 'newer', text: '晚餐', date: TODAY, createdAt: '2026-11-02T02:00:00.000Z' }),
    record({ id: 'older', text: '早餐', date: TODAY, createdAt: '2026-11-02T01:00:00.000Z' }),
    record({ id: 'edge', text: '燕麦', date: '2026-10-27' }),
    record({ id: 'day8', text: '可乐', date: '2026-10-26' }),
    record({ id: 'future', text: '水果', date: '2026-11-03' }),
  ];
  assert.deepEqual(
    recordsInRange(records, TODAY, 7).map((item) => item.id),
    ['newer', 'older', 'edge'],
  );
  assert.deepEqual(recordsInRange(records, TODAY, 30).map((item) => item.id), ['newer', 'older', 'edge', 'day8']);

  const ratioCases: [number, number, Band][] = [
    [0, 1, 'low'],
    [1, 1, 'high'],
    [0, 3, 'low'],
    [1, 3, 'mid'],
    [2, 3, 'high'],
    [1, 6, 'low'],
    [2, 6, 'mid'],
    [3, 6, 'mid'],
    [4, 6, 'high'],
    [1, 4, 'low'],
    [2, 4, 'mid'],
  ];
  for (const [hits, total, band] of ratioCases) {
    assert.equal(bandFromRatio(hits, total), band, `${hits}/${total}`);
  }
});

test('word hits and the inflammation table follow the locked rules', () => {
  const one = (text: string) => inferFromRecords([record({ id: 'only', text, date: TODAY })], TODAY);
  const nuts = one('坚果');
  assert.equal(nuts?.plantRatio, 'high');
  assert.equal(nuts?.upfFreq, 'low');
  assert.equal(nuts?.fiberFeel, 'low');
  assert.equal(nuts?.inflammationDir, 'mid');

  const oats = one('燕麦');
  assert.equal(oats?.plantRatio, 'high');
  assert.equal(oats?.fiberFeel, 'high');
  assert.equal(oats?.upfFreq, 'low');
  assert.equal(oats?.inflammationDir, 'low');

  const cola = one('可乐');
  assert.equal(cola?.plantRatio, 'low');
  assert.equal(cola?.upfFreq, 'high');
  assert.equal(cola?.fiberFeel, 'low');
  assert.equal(cola?.inflammationDir, 'high');

  const colaFiber = one('可乐纤维');
  assert.equal(colaFiber?.plantRatio, 'low');
  assert.equal(colaFiber?.upfFreq, 'high');
  assert.equal(colaFiber?.fiberFeel, 'high');
  assert.equal(colaFiber?.inflammationDir, 'mid');

  const chips = one('薯片');
  assert.equal(chips?.plantRatio, 'high');
  assert.equal(chips?.upfFreq, 'high');
  assert.equal(chips?.fiberFeel, 'high');
  assert.equal(textHitsAny('维生素片', PLANT_LEXICON), true);
  assert.equal(textHitsAny('维生素片', FIBER_LEXICON), false);

  const repeated = one('蔬菜蔬菜蔬菜');
  assert.equal(repeated?.plantRatio, 'high');
  assert.equal(repeated?.fiberFeel, 'high');

  const outside = inferFromRecords([record({ id: 'old', text: '可乐', date: '2026-10-26' })], TODAY);
  assert.equal(outside, null);

  const exactThird = inferFromRecords(
    [
      record({ id: 'a', text: '坚果', date: TODAY }),
      record({ id: 'b', text: '水', date: TODAY }),
      record({ id: 'c', text: '水', date: TODAY }),
    ],
    TODAY,
  );
  assert.equal(exactThird?.plantRatio, 'mid');
  assert.equal(exactThird?.upfFreq, 'low');

  const twoThirds = inferFromRecords(
    [
      record({ id: 'a', text: '坚果', date: TODAY }),
      record({ id: 'b', text: '坚果', date: TODAY }),
      record({ id: 'c', text: '水', date: TODAY }),
    ],
    TODAY,
  );
  assert.equal(twoThirds?.plantRatio, 'high');
  assert.equal(twoThirds?.inflammationDir, 'mid');

  const bands: Band[] = ['low', 'mid', 'high'];
  for (const plant of bands) {
    for (const upf of bands) {
      for (const fiber of bands) {
        let expected: Band = 'mid';
        if (upf === 'high' && plant === 'low') expected = 'high';
        else if (upf === 'low' && plant === 'high') expected = 'low';
        if (fiber === 'low' && expected === 'low') expected = 'mid';
        if (fiber === 'high' && expected === 'high') expected = 'mid';
        assert.equal(inflammationFromBands(plant, upf, fiber), expected, `${plant}/${upf}/${fiber}`);
      }
    }
  }
});

test('an empty record window falls back to the hypothesis, and neither source shows a snapshot', () => {
  const hypothesis = hypothesisFromAnswers(ASSUMPTION);
  const quiet = storeWith([record({ id: 'old', text: '可乐', date: '2026-10-26' })], hypothesis);
  const fallback = resolveSnapshot(quiet, 'records', TODAY, NOW.toISOString());
  assert.equal(fallback?.basedOn, 'hypothesis');
  assert.equal(fallback?.plantRatio, 'high');
  assert.equal(fallback?.inflammationDir, 'low');
  assert.equal(resolveSnapshot(storeWith([]), 'records', TODAY, NOW.toISOString()), null);
  assert.equal(resolveSnapshot(storeWith([]), 'hypothesis', TODAY, NOW.toISOString()), null);

  const direct = resolveSnapshot(
    storeWith([record({ id: 'now', text: '可乐', date: TODAY })], hypothesis),
    'records',
    TODAY,
    NOW.toISOString(),
  );
  assert.equal(direct?.basedOn, 'records');
  assert.equal(direct?.upfFreq, 'high');
  const assumed = resolveSnapshot(
    storeWith([record({ id: 'now', text: '可乐', date: TODAY })], hypothesis),
    'hypothesis',
    TODAY,
    NOW.toISOString(),
  );
  assert.equal(assumed?.basedOn, 'hypothesis');
  assert.equal(assumed?.plantRatio, 'high');
  assert.equal(defaultBasedOn(quiet, TODAY), 'hypothesis');
  assert.equal(defaultBasedOn(storeWith([record({ id: 'now', text: '水', date: TODAY })]), TODAY), 'records');
});

test('opening the twin screen defaults to records when the week has entries and does not write an empty store', () => {
  const storage = memory();
  const openedEmpty = openDietTwin(storage, NOW);
  assert.equal(openedEmpty.mode, 'hypothesis');
  assert.equal(openedEmpty.store.lastSnapshot, null);
  assert.equal(storage.getItem(DIET_TWIN_V1_STORAGE_KEY), null);

  const week: DietTwinStore = {
    version: 1,
    records: [record({ id: 'now', text: '可乐', date: TODAY })],
    hypothesis: hypothesisFromAnswers(ASSUMPTION),
    lastSnapshot: {
      plantRatio: 'high',
      upfFreq: 'low',
      fiberFeel: 'high',
      inflammationDir: 'low',
      basedOn: 'hypothesis',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
  };
  const saved = memory({ [DIET_TWIN_V1_STORAGE_KEY]: JSON.stringify(week) });
  const opened = openDietTwin(saved, NOW);
  assert.equal(opened.mode, 'records');
  assert.equal(opened.store.lastSnapshot?.basedOn, 'records');
  assert.equal(opened.store.lastSnapshot?.upfFreq, 'high');
  assert.equal(opened.store.hypothesis?.plantRatio, 'high');
  const persisted = parseDietTwinStore(saved.getItem(DIET_TWIN_V1_STORAGE_KEY));
  assert.equal(persisted?.lastSnapshot?.basedOn, 'records');

  const unchanged = withSnapshot(opened.store, 'records', NOW);
  assert.equal(unchanged, opened.store);
  saveDietTwin(opened.store, saved);
  assert.equal(parseDietTwinStore(saved.getItem(DIET_TWIN_V1_STORAGE_KEY))?.records.length, 1);
});
