import assert from 'node:assert/strict';
import test from 'node:test';
import { visibleNodeIds } from './visibility.ts';

const ids = ['a', 'b', 'c'];

test('hiding is a no-op until a focus set exists', () => {
  assert.deepEqual([...visibleNodeIds(ids, null, true, new Set())].sort(), ids);
});

test('hide unmatched keeps the focus set and pinned nodes', () => {
  const visible = visibleNodeIds(ids, new Set(['a']), true, new Set(['c']));
  assert.deepEqual([...visible].sort(), ['a', 'c']);
});

test('dimming mode keeps every node', () => {
  const visible = visibleNodeIds(ids, new Set(['a']), false, new Set());
  assert.deepEqual([...visible].sort(), ids);
});
