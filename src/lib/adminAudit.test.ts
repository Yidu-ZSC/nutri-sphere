import assert from 'node:assert/strict';
import test from 'node:test';
import { auditLoadedGraph } from './adminAudit.ts';
import type { GraphData, SourcesData } from '../types/graph.ts';

const sources: SourcesData = {
  schema_version: '1.1',
  sources: [
    {
      id: 'eat_to_heal',
      title: '吃出自愈力',
      authors: 'Will Bulsiewicz',
      year: 2020,
      type: 'book',
      summary: '第一句。第二句。',
      file: 'book.md',
    },
  ],
};

function graph(partial: Partial<GraphData>): GraphData {
  return {
    meta: {},
    nodes: [
      { id: 'a', type: 'food', label: '甲', group: 'protective' },
      { id: 'b', type: 'mechanism', label: '乙', group: 'risk' },
    ],
    links: [],
    ...partial,
  };
}

test('audit flags a dangling target', () => {
  const report = auditLoadedGraph(
    graph({
      links: [
        {
          source: 'a',
          target: 'missing',
          relation: '相连',
          direction: 'risk',
          evidence_type: 'book_notes_mechanistic',
          evidences: [
            {
              excerpt: '摘录',
              source_title: '吃出自愈力',
              source_file: 'book.md',
              source_id: 'eat_to_heal',
            },
          ],
        },
      ],
    }),
    sources,
  );
  assert.ok(report.errors.some((issue) => issue.message.includes('不存在')));
});

test('audit accepts a minimal consistent edge', () => {
  const report = auditLoadedGraph(
    graph({
      links: [
        {
          source: 'a',
          target: 'b',
          relation: '相连',
          direction: 'protective',
          evidence_type: 'book_notes_mechanistic',
          excerpt: '摘录',
          evidences: [
            {
              excerpt: '摘录',
              source_title: '吃出自愈力',
              source_file: 'book.md',
              source_id: 'eat_to_heal',
            },
          ],
        },
      ],
    }),
    sources,
  );
  assert.equal(report.errors.length, 0);
  assert.equal(report.counts.links, 1);
});
