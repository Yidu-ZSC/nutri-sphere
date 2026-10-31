import assert from 'node:assert/strict';
import test from 'node:test';
import type { GraphData } from '../types/graph.ts';
import { SEARCH_DEBOUNCE_MS, SEARCH_RESULT_LIMIT, searchGraph } from './search.ts';

function graph(): GraphData {
  return {
    meta: {},
    nodes: [
      { id: 'liver_chronic', type: 'disease', label: '慢性肝炎相关进展', group: 'risk' },
      { id: 'soy', type: 'food', label: '大豆食品', group: 'protective', aliases: ['Soy'] },
      ...Array.from({ length: 24 }, (_, index) => ({
        id: `extra_${index}`,
        type: 'food',
        label: `样本${index}`,
        group: 'neutral' as const,
      })),
    ],
    links: [
      {
        source: 'soy',
        target: 'liver_chronic',
        relation: '肠漏允许LPS等进入血液',
        direction: 'risk',
        evidence_type: 'book_notes_mechanistic',
      },
    ],
  };
}

test('debounce is at least 200ms and results cap at 20', () => {
  assert.ok(SEARCH_DEBOUNCE_MS >= 200);
  assert.equal(SEARCH_RESULT_LIMIT, 20);
});

test('search matches label, alias, id, and relation without case sensitivity', () => {
  const data = graph();
  assert.equal(searchGraph('肝炎', data).hits[0]?.id, 'liver_chronic');
  assert.equal(searchGraph('SOY', data).hits[0]?.id, 'soy');
  assert.equal(searchGraph('liver_chronic', data).hits.some((hit) => hit.kind === 'node'), true);
  const relation = searchGraph('lps', data).hits.find((hit) => hit.kind === 'link');
  assert.equal(relation?.index, 0);
  assert.equal(relation?.subtitle, '关联');
});

test('search returns at most 20 hits and marks truncation', () => {
  const result = searchGraph('样本', graph());
  assert.equal(result.hits.length, 20);
  assert.equal(result.truncated, true);
  assert.equal(result.hits.every((hit) => hit.kind === 'node'), true);
});

test('empty query yields no hits', () => {
  const result = searchGraph('   ', graph());
  assert.deepEqual(result.hits, []);
  assert.equal(result.truncated, false);
});
