import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { GraphData } from '../types/graph.ts';
import {
  LOBBY_SEARCH_RESULT_LIMIT,
  SEARCH_DEBOUNCE_MS,
  SEARCH_RESULT_LIMIT,
  searchGraph,
  searchNodes,
} from './search.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function seed(): GraphData {
  return JSON.parse(
    fs.readFileSync(path.join(root, 'data/seed_triples_v0.3_aligned.json'), 'utf8'),
  ) as GraphData;
}

function graph(): GraphData {
  return {
    meta: {},
    nodes: [
      { id: 'liver_chronic', type: 'disease', label: '慢性肝炎进展', group: 'risk' },
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

test('lobby node search ranks exact aliases before prefix-only matches', () => {
  const hits = searchNodes('糖尿病', seed().nodes);
  assert.equal(hits[0]?.id, 'type2_diabetes');
  const exact = hits.findIndex((hit) => hit.id === 'type2_diabetes');
  const prefix = hits.findIndex((hit) => hit.id === 'chronic_wounds');
  assert.ok(exact >= 0);
  assert.ok(prefix > exact);
});

test('lobby node search does not match middle-of-fragment text', () => {
  const nodes = seed().nodes;
  const vegetarian = searchNodes('素食', nodes);
  assert.equal(vegetarian[0]?.id, 'plant_based_diet');
  assert.equal(vegetarian.some((hit) => hit.id === 'tomato'), false);
});

test('lobby node search covers requested Chinese concepts', () => {
  const nodes = seed().nodes;
  assert.equal(searchNodes('痛风', nodes)[0]?.id, 'gout_uric_acid');
  assert.equal(searchNodes('脂肪肝', nodes)[0]?.id, 'fatty_liver');
});

test('lobby node search ignores relations, empty queries, and missing concepts', () => {
  const data = graph();
  assert.deepEqual(searchNodes('   ', data.nodes), []);
  assert.deepEqual(searchNodes('lps', data.nodes), []);
  assert.deepEqual(searchNodes('不存在的概念', data.nodes), []);
});

test('lobby node search caps suggestions at eight', () => {
  const nodes = Array.from({ length: 12 }, (_, index) => ({
    id: `sample_${index}`,
    type: 'food',
    label: `样本${index}`,
    group: 'neutral' as const,
  }));
  assert.equal(LOBBY_SEARCH_RESULT_LIMIT, 8);
  assert.equal(searchNodes('样本', nodes).length, 8);
});
