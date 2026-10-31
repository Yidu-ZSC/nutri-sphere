import assert from 'node:assert/strict';
import test from 'node:test';
import { assertGraph } from './assertGraph.ts';

const valid = {
  meta: { schema_version: '0.1' },
  nodes: [
    { id: 'a', type: 'food', label: '甲', group: 'protective' },
    { id: 'b', type: 'mechanism', label: '乙', group: 'risk' },
  ],
  links: [
    {
      source: 'a',
      target: 'b',
      relation: '相关',
      direction: 'protective',
      evidence_type: 'book_notes_mechanistic',
    },
  ],
};

test('accepts a minimal valid graph', () => {
  const graph = assertGraph(valid);
  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.links.length, 1);
});

test('rejects a link whose target is missing', () => {
  const broken = structuredClone(valid);
  broken.links[0].target = 'missing';
  assert.throws(() => assertGraph(broken), /不存在的节点/);
});

test('rejects duplicate node ids', () => {
  const broken = structuredClone(valid);
  broken.nodes.push({ ...broken.nodes[0] });
  assert.throws(() => assertGraph(broken), /重复/);
});
