import assert from 'node:assert/strict';
import test from 'node:test';
import { applyLayout, cameraDistanceForPixels, columnIndex, framingDistance } from './layout.ts';
import type { SimNode } from '../types/graph.ts';

function node(id: string, type: string, label = id): SimNode {
  return { id, type, label, group: 'neutral' };
}

test('columns run from diet and food to disease', () => {
  assert.equal(columnIndex('diet_pattern'), columnIndex('food'));
  assert.equal(columnIndex('food_category'), 0);
  assert.ok(columnIndex('food') < columnIndex('nutrient'));
  assert.equal(columnIndex('nutrient'), columnIndex('compound'));
  assert.equal(columnIndex('compound'), columnIndex('metabolite'));
  assert.ok(columnIndex('metabolite') < columnIndex('mechanism'));
  assert.ok(columnIndex('mechanism') < columnIndex('disease'));
  assert.equal(columnIndex('disease'), columnIndex('biomarker'));
});

test('hierarchy pins a column and spreads rows', () => {
  const nodes = [
    node('f1', 'food', '甲'),
    node('f2', 'food', '乙'),
    node('n1', 'nutrient', '丙'),
    node('m1', 'mechanism', '丁'),
    node('d1', 'disease', '戊'),
  ];
  applyLayout(nodes, 'hierarchy');
  const byId = Object.fromEntries(nodes.map((item) => [item.id, item]));
  assert.equal(byId.f1?.x, byId.f2?.x);
  assert.notEqual(byId.f1?.y, byId.f2?.y);
  assert.equal(byId.f1?.fx, byId.f1?.x);
  assert.ok((byId.f1?.x ?? 0) < (byId.n1?.x ?? 0));
  assert.ok((byId.n1?.x ?? 0) < (byId.m1?.x ?? 0));
  assert.ok((byId.m1?.x ?? 0) < (byId.d1?.x ?? 0));
});

test('force layout clears pins', () => {
  const nodes = [node('f1', 'food'), node('d1', 'disease')];
  applyLayout(nodes, 'hierarchy');
  applyLayout(nodes, 'force');
  assert.equal(nodes[0]?.fx, undefined);
  assert.equal(nodes[1]?.fy, undefined);
  assert.notEqual(nodes[0]?.x, nodes[1]?.x);
});

test('a wider graph is framed from farther away', () => {
  const near = framingDistance(
    [
      { x: 0, y: 0 },
      { x: 12, y: 8 },
    ],
    1200,
    800,
  );
  const far = framingDistance(
    [
      { x: -120, y: -40 },
      { x: 120, y: 70 },
    ],
    1200,
    800,
  );
  assert.ok(near.z > 40);
  assert.ok(far.z > near.z);
});

test('camera distance grows when pixels per unit shrink', () => {
  const close = cameraDistanceForPixels(600, 4);
  const far = cameraDistanceForPixels(600, 2);
  assert.ok(close > 0);
  assert.ok(far > close);
});
