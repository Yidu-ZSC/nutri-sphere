import assert from 'node:assert/strict';
import test from 'node:test';
import { selectionPinIds, visibleNodeIds } from './visibility.ts';

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

test('selection pins the chosen node or link ends only while hide has a focus', () => {
  const links = [{ source: 'a', target: 'b' }];
  assert.deepEqual([...selectionPinIds({ kind: 'node', id: 'c' }, links, true, new Set(['a']))], ['c']);
  assert.deepEqual(
    [...selectionPinIds({ kind: 'link', index: 0 }, links, true, new Set(['a']))].sort(),
    ['a', 'b'],
  );
  assert.equal(selectionPinIds({ kind: 'node', id: 'c' }, links, false, new Set(['a'])).size, 0);
  assert.equal(selectionPinIds({ kind: 'node', id: 'c' }, links, true, null).size, 0);
});
