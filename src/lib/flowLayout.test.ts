import assert from 'node:assert/strict';
import test from 'node:test';
import { layoutFlow, selectFlowBands, type FlowEdgeInput, type FlowNodeInput } from './flowLayout.ts';

const nodes: FlowNodeInput[] = [
  { id: 'sugar', label: '添加糖', type: 'food_category', group: 'risk' },
  { id: 'fiber', label: '膳食纤维', type: 'nutrient', group: 'protective' },
  { id: 'microbe', label: '肠道菌群', type: 'mechanism', group: 'protective' },
  { id: 'inflammation', label: '慢性炎症', type: 'mechanism', group: 'risk' },
  { id: 'obesity', label: '肥胖', type: 'disease', group: 'risk' },
  { id: 'liver', label: '脂肪肝', type: 'disease', group: 'risk' },
];

function edge(
  source: string,
  target: string,
  graphIndex: number,
  strength: FlowEdgeInput['strength'] = 'low',
  evidenceCount = 1,
): FlowEdgeInput {
  return {
    source,
    target,
    graphIndex,
    direction: 'risk',
    strength,
    relation: '常被一起讨论',
    evidenceCount,
  };
}

test('same-column edges stay off the pathway', () => {
  const picked = selectFlowBands(
    nodes,
    [edge('sugar', 'obesity', 0), edge('microbe', 'inflammation', 1)],
    [],
    null,
  );
  assert.deepEqual(
    picked.bands.map((band) => band.graphIndex),
    [0],
  );
  assert.equal(picked.omittedSameColumn, 1);
  assert.equal(picked.omittedBudget, 0);
});

test('anchor edges outrank a stronger edge that misses the anchor', () => {
  const picked = selectFlowBands(
    nodes,
    [edge('fiber', 'liver', 0, 'high', 8), edge('sugar', 'obesity', 1, 'low', 1)],
    ['sugar'],
    null,
    1,
    4,
  );
  assert.deepEqual(
    picked.bands.map((band) => band.graphIndex),
    [1],
  );
  assert.equal(picked.omittedBudget, 1);
});

test('per-node cap lets a second hub onto the pathway', () => {
  const links = [
    edge('sugar', 'obesity', 0, 'high', 4),
    edge('sugar', 'liver', 1, 'high', 4),
    edge('sugar', 'microbe', 2, 'moderate', 2),
    edge('fiber', 'obesity', 3, 'moderate', 2),
    edge('fiber', 'liver', 4, 'low', 1),
  ];
  const picked = selectFlowBands(nodes, links, [], null, 4, 2);
  const fromSugar = picked.bands.filter((band) => band.source === 'sugar' || band.target === 'sugar');
  assert.equal(fromSugar.length <= 2, true);
  assert.equal(picked.bands.some((band) => band.source === 'fiber' || band.target === 'fiber'), true);
  assert.equal(picked.bands.length, 4);
});

test('a pinned cross-column link stays visible past the budget', () => {
  const picked = selectFlowBands(
    nodes,
    [edge('fiber', 'liver', 0, 'high', 6), edge('sugar', 'obesity', 1, 'low', 1)],
    [],
    1,
    1,
    4,
  );
  assert.equal(picked.bands.some((band) => band.graphIndex === 1), true);
  assert.equal(picked.bands.length, 1);
  assert.equal(picked.omittedBudget, 1);
});

test('layout places food to the left of disease and draws a curve', () => {
  const bands = [edge('sugar', 'obesity', 0, 'moderate', 3)];
  const layout = layoutFlow(nodes, bands, 880);
  const sugar = layout.nodes.find((node) => node.id === 'sugar');
  const obesity = layout.nodes.find((node) => node.id === 'obesity');
  assert.ok(sugar);
  assert.ok(obesity);
  assert.ok(sugar.x < obesity.x);
  assert.equal(layout.captions.length, 4);
  assert.match(layout.bands[0]?.d ?? '', /^M /);
  assert.match(layout.bands[0]?.d ?? '', / C /);
  assert.ok((layout.bands[0]?.width ?? 0) > 3);
});
