import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import type { GraphData, GraphLink } from '../types/graph.ts';
import {
  citingLinks,
  filterCitingByDirection,
  sourceTypeLabel,
} from './sourceCitations.ts';

function link(partial: Partial<GraphLink> & Pick<GraphLink, 'source' | 'target' | 'direction'>): GraphLink {
  return {
    relation: 'rel',
    evidence_type: 'book_notes_mechanistic',
    ...partial,
  };
}

function graph(links: GraphLink[]): GraphData {
  return {
    meta: { schema_version: '0.5', data_version: '1.0' },
    nodes: [
      { id: 'a', type: 'food', label: 'A', group: 'protective' },
      { id: 'b', type: 'mechanism', label: 'B', group: 'protective' },
      { id: 'c', type: 'disease', label: 'C', group: 'risk' },
    ],
    links,
  };
}

test('citingLinks matches top-level source_id', () => {
  const g = graph([
    link({ source: 'a', target: 'b', direction: 'protective', source_id: 'eat_to_heal' }),
    link({ source: 'a', target: 'c', direction: 'risk', source_id: 'other' }),
  ]);
  const hits = citingLinks(g, 'eat_to_heal');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].index, 0);
});

test('citingLinks matches evidences[].source_id when top-level differs', () => {
  const g = graph([
    link({
      source: 'a',
      target: 'b',
      direction: 'protective',
      source_id: 'eat_to_heal',
      evidences: [
        {
          excerpt: 'x',
          source_title: 't',
          source_file: 'f',
          source_id: 'eat_to_heal',
        },
        {
          excerpt: 'x2',
          source_title: 't2',
          source_file: 'f2',
          source_id: 'gut_brain',
        },
      ],
    }),
  ]);
  const hits = citingLinks(g, 'gut_brain');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].index, 0);
});

test('citingLinks dedupes when both top-level and evidence cite the same book', () => {
  const g = graph([
    link({
      source: 'a',
      target: 'b',
      direction: 'protective',
      source_id: 'china_study',
      evidences: [
        {
          excerpt: 'x',
          source_title: 't',
          source_file: 'f',
          source_id: 'china_study',
        },
      ],
    }),
  ]);
  assert.equal(citingLinks(g, 'china_study').length, 1);
});

test('filterCitingByDirection default all keeps mixed/neutral; protective excludes them', () => {
  const items = [
    { link: link({ source: 'a', target: 'b', direction: 'protective' }), index: 0 },
    { link: link({ source: 'a', target: 'c', direction: 'risk' }), index: 1 },
    { link: link({ source: 'a', target: 'b', direction: 'mixed' }), index: 2 },
    { link: link({ source: 'a', target: 'c', direction: 'neutral' }), index: 3 },
  ];
  assert.equal(filterCitingByDirection(items, 'all').length, 4);
  const protective = filterCitingByDirection(items, 'protective');
  assert.deepEqual(
    protective.map((row) => row.link.direction),
    ['protective'],
  );
  const risk = filterCitingByDirection(items, 'risk');
  assert.deepEqual(
    risk.map((row) => row.link.direction),
    ['risk'],
  );
});

test('sourceTypeLabel maps book/review/paper', () => {
  assert.equal(sourceTypeLabel('book'), '图书');
  assert.equal(sourceTypeLabel('review'), '综述');
  assert.equal(sourceTypeLabel('paper'), '论文');
});

test('SourceDetail markup: breadcrumb, filter default, no description/file, summary', () => {
  const source = fs.readFileSync(new URL('../components/SourceDetail.tsx', import.meta.url), 'utf8');
  assert.match(source, /data-testid="source-breadcrumb"/);
  assert.match(source, /图谱/);
  assert.match(source, /来源/);
  assert.match(source, /data-testid="source-dir-filter"/);
  assert.match(source, /useState<SourceDirFilter>\('all'\)/);
  assert.match(source, /data-testid="source-edge-count"/);
  assert.match(source, /本系统引用了 \{edgeCount\} 条相关描述/);
  assert.match(source, /data-testid="source-summary"/);
  assert.match(source, /source\.summary/);
  assert.equal(/source\.description/.test(source), false);
  assert.equal(/source\.file/.test(source), false);
  assert.equal(/来源简介/.test(source), false);
  assert.match(source, /borderLeftColor:\s*semanticColor\(link\.direction\)/);
  assert.match(source, /directionLabel\(link\.direction\)/);
  assert.match(source, /当前筛选下暂无引用边/);
  assert.match(source, /citingLinks/);
});

test('seed data_version is 2.9 after NS-081 flow ingest; schema is 0.7', () => {
  const seed = JSON.parse(
    fs.readFileSync(new URL('../../data/seed_triples_v0.3_aligned.json', import.meta.url), 'utf8'),
  ) as { meta: { data_version: string; schema_version: string } };
  assert.equal(seed.meta.data_version, '2.9');
  assert.equal(seed.meta.schema_version, '0.7');
});
