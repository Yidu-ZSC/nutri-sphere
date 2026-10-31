import assert from 'node:assert/strict';
import test from 'node:test';
import { GRAPH_VIEW_STORAGE_KEY, readGraphView, writeGraphView } from './graphView.ts';

function memoryStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial) values.set(GRAPH_VIEW_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

test('graph view defaults to the 2d pathway', () => {
  assert.equal(readGraphView(memoryStorage()), '2d');
  assert.equal(readGraphView(memoryStorage('nope')), '2d');
  assert.equal(readGraphView(null), '2d');
});

test('graph view preference round-trips', () => {
  const storage = memoryStorage();
  writeGraphView('3d', storage);
  assert.equal(readGraphView(storage), '3d');
  writeGraphView('2d', storage);
  assert.equal(readGraphView(storage), '2d');
});
