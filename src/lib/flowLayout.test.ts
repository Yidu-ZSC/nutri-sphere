import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FLOW_BAND_BUDGET,
  FLOW_PER_NODE_CAP,
  frameFlowCamera,
  frameFlowFocus,
  layoutFlow,
  panFlowCamera,
  selectFlowBands,
  zoomFlowCamera,
  type FlowEdgeInput,
  type FlowNodeInput,
} from './flowLayout.ts';

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

test('framing fits a wide pathway and centers a short one', () => {
  const wide = frameFlowCamera(1600, 400, 800, 600);
  assert.ok(wide.k < 1);
  assert.ok(Math.abs(wide.x + (1600 * wide.k - 800) / 2) < 0.01);
  const short = frameFlowCamera(600, 200, 800, 600);
  assert.equal(short.k, 1);
  assert.equal(short.y, (600 - 200) / 2);
});

test('zoom keeps the pointer anchor still and pan shifts the camera', () => {
  const start = { x: 40, y: 30, k: 1 };
  const zoomed = zoomFlowCamera(start, 100, 80, 2);
  assert.equal(zoomed.k, 2);
  assert.equal(zoomed.x, 100 - (100 - 40) * 2);
  assert.equal(zoomed.y, 80 - (80 - 30) * 2);
  assert.deepEqual(panFlowCamera(zoomed, 12, -4), { x: zoomed.x + 12, y: zoomed.y - 4, k: 2 });
  assert.equal(zoomFlowCamera(start, 0, 0, 20).k, 3.5);
});

test('focus mode preserves the root same-column mechanism edge', () => {
  const picked = selectFlowBands(
    nodes,
    [edge('microbe', 'inflammation', 1), edge('sugar', 'obesity', 0)],
    [],
    null,
    FLOW_BAND_BUDGET,
    FLOW_PER_NODE_CAP,
    'microbe',
  );
  assert.deepEqual(
    picked.bands.map((band) => band.graphIndex).sort((a, b) => a - b),
    [0, 1],
  );
  assert.equal(picked.omittedSameColumn, 0);
});

test('focus mode keeps every root incident edge past budget and per-node cap', () => {
  const focusNodes: FlowNodeInput[] = [
    { id: 'root', label: '根', type: 'mechanism', group: 'risk' },
    { id: 'm2', label: '机制二', type: 'mechanism', group: 'risk' },
    { id: 'f1', label: '食', type: 'food', group: 'neutral' },
    { id: 'f2', label: '食二', type: 'food', group: 'neutral' },
    { id: 'f3', label: '食三', type: 'food', group: 'neutral' },
    { id: 'd1', label: '病', type: 'disease', group: 'risk' },
  ];
  const incident = [
    edge('root', 'f1', 0),
    edge('root', 'f2', 1),
    edge('root', 'f3', 2),
    edge('root', 'd1', 3),
    edge('root', 'm2', 4),
    edge('f1', 'm2', 5),
  ];
  const picked = selectFlowBands(focusNodes, incident, [], null, 3, 1, 'root');
  const rootEdges = picked.bands.filter((band) => band.source === 'root' || band.target === 'root');
  assert.equal(rootEdges.length, 5);
  assert.equal(picked.bands.some((band) => band.graphIndex === 4), true);

  const plain = selectFlowBands(focusNodes, incident, [], null, 3, 1);
  assert.equal(plain.bands.some((band) => band.graphIndex === 4), false);
});

test('focus framing fits only the bright nodes and reacts to HUD insets', () => {
  const laid = layoutFlow(
    nodes,
    [edge('sugar', 'obesity', 0), edge('fiber', 'microbe', 1)],
    880,
  );
  const all = frameFlowFocus(laid.nodes, null, 800, 600);
  const focused = frameFlowFocus(laid.nodes, new Set(['sugar', 'obesity']), 800, 600);
  const crowded = frameFlowFocus(
    laid.nodes,
    new Set(['sugar', 'obesity']),
    800,
    600,
    { top: 120, right: 60, bottom: 120, left: 60 },
  );
  assert.ok(focused.k >= all.k);
  assert.ok(crowded.k <= focused.k);
  assert.ok(crowded.k >= 0.4);
});
