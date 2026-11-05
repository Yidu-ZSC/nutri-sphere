import assert from 'node:assert/strict';
import test from 'node:test';
import { filterAdminEdges, filterAdminNodes, findLinkByKey } from './adminCatalog.ts';
import type { GraphData } from '../types/graph.ts';

const graph: GraphData = {
  meta: {},
  nodes: [
    { id: 'dietary_fiber', type: 'nutrient', label: '膳食纤维', group: 'protective' },
    { id: 'insulin_resistance', type: 'mechanism', label: '胰岛素抵抗', group: 'risk' },
    { id: 'cardiometabolic', type: 'disease', label: '心血管与代谢问题', group: 'risk' },
  ],
  links: [
    {
      source: 'dietary_fiber',
      target: 'cardiometabolic',
      relation: '较高膳食纤维摄入',
      direction: 'protective',
      evidence_type: 'expert_synthesis',
      strength: 'high',
      source_title: 'Reynolds',
    },
    {
      id: 'ns009_insulin_cardio',
      source: 'insulin_resistance',
      target: 'cardiometabolic',
      relation: '胰岛素抵抗位于心血管与代谢风险的机制链上',
      direction: 'risk',
      evidence_type: 'book_notes_mechanistic',
      strength: 'moderate',
    },
  ],
};

test('edge filters match direction, strength, and label text', () => {
  const risk = filterAdminEdges(graph, { query: '胰岛素', direction: 'risk', strength: 'all' });
  assert.equal(risk.length, 1);
  assert.equal(risk[0]?.link.id, 'ns009_insulin_cardio');
  const high = filterAdminEdges(graph, { query: '', direction: 'all', strength: 'high' });
  assert.equal(high.length, 1);
  assert.equal(high[0]?.link.source, 'dietary_fiber');
});

test('node filter keeps mechanisms and link key resolves', () => {
  const mechanisms = filterAdminNodes(graph, { query: '', type: 'mechanism' });
  assert.deepEqual(mechanisms.map((node) => node.id), ['insulin_resistance']);
  const found = findLinkByKey(graph, 'insulin_resistance~cardiometabolic');
  assert.equal(found?.index, 1);
  assert.equal(findLinkByKey(graph, 'missing~node'), null);
});
