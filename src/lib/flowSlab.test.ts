import assert from 'node:assert/strict';
import test from 'node:test';
import { layoutSlabs, slabCameraHome, SLAB_YAW } from './flowSlab.ts';
import type { FlowEdgeInput, FlowNodeInput } from './flowLayout.ts';

const nodes: FlowNodeInput[] = [
  { id: 'sugar', label: '添加糖', type: 'food_category', group: 'risk' },
  { id: 'fiber', label: '膳食纤维', type: 'nutrient', group: 'protective' },
  { id: 'microbe', label: '肠道菌群', type: 'mechanism', group: 'protective' },
  { id: 'obesity', label: '肥胖', type: 'disease', group: 'risk' },
];

function edge(source: string, target: string, graphIndex: number): FlowEdgeInput {
  return {
    source,
    target,
    graphIndex,
    direction: 'risk',
    strength: 'moderate',
    relation: '常被一起讨论',
    evidenceCount: 2,
  };
}

test('column boards step back from food to disease and skip bands peel in depth', () => {
  const layout = layoutSlabs(nodes, [edge('sugar', 'obesity', 1), edge('sugar', 'fiber', 2)], 880);
  const sugar = layout.nodes.find((node) => node.id === 'sugar');
  const fiber = layout.nodes.find((node) => node.id === 'fiber');
  const obesity = layout.nodes.find((node) => node.id === 'obesity');
  assert.ok(sugar && fiber && obesity);
  assert.ok(sugar.x < fiber.x && fiber.x < obesity.x);
  assert.ok(sugar.z > fiber.z && fiber.z > obesity.z);
  assert.equal(layout.nodes.some((node) => node.id === 'microbe'), false);

  const skip = layout.bands.find((band) => band.edge.graphIndex === 1);
  const hop = layout.bands.find((band) => band.edge.graphIndex === 2);
  assert.ok(skip && hop);
  assert.equal(skip.span, 3);
  assert.notEqual(skip.points[1]!.z, (skip.points[0]!.z + skip.points[3]!.z) / 2);
  assert.equal(hop.span, 1);
  assert.equal(hop.points[1]!.z, (hop.points[0]!.z + hop.points[3]!.z) / 2);

  const foodBoard = layout.boards.find((board) => board.column === 0);
  assert.ok(foodBoard);
  assert.ok(foodBoard.z < sugar.z);
  assert.equal(foodBoard.label, '膳食/食物');
});

test('home camera looks from the front-right and stays inside the turn limit', () => {
  const layout = layoutSlabs(nodes, [edge('sugar', 'obesity', 1)], 880);
  const home = slabCameraHome(layout);
  assert.equal(home.yaw, SLAB_YAW);
  assert.ok(home.position.z > home.target.z);
  assert.ok(home.position.x > home.target.x);
  assert.ok(home.minDistance < home.maxDistance);
});
