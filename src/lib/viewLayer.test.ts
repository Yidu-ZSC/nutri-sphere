import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { VIEW_LAYERS } from '../types/graph.ts';

test('ViewLayer has only layperson and expert', () => {
  assert.deepEqual([...VIEW_LAYERS], ['layperson', 'expert']);
  const files = [
    '../types/graph.ts',
    '../components/ViewLayerToggle.tsx',
    '../lib/viewLayer.ts',
    '../lib/shareUrl.ts',
    '../components/DetailDrawer.tsx',
  ];
  for (const file of files) {
    const source = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.equal(source.includes('glance'), false, file);
  }
  const graph = fs.readFileSync(new URL('../types/graph.ts', import.meta.url), 'utf8');
  assert.match(graph, /export type ViewLayer = \(typeof VIEW_LAYERS\)\[number\]/);
});
