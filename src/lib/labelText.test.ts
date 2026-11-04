import assert from 'node:assert/strict';
import test from 'node:test';
import { pathwayLabelLines, wrapCjk } from './labelText.ts';

test('long pathway names wrap on the slash before hard breaks', () => {
  assert.deepEqual(wrapCjk('全食物植物性膳食 / 素食', 9), ['全食物植物性膳食', '素食']);
  assert.deepEqual(wrapCjk('慢性炎症', 9), ['慢性炎症']);
});

test('graph labels stay vernacular-only after ViewLayer retirement', () => {
  assert.deepEqual(pathwayLabelLines('慢性炎症'), ['慢性炎症']);
});
