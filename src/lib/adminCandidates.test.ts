import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildReviewedPackage,
  candidateEdgeKey,
  isEdgeDiscarded,
  markExported,
  pageSlice,
  presentCandidateRelation,
  resolveBatchStatus,
  setNodeRemap,
  setRelationOverride,
  toggleDiscardedEdge,
  toggleDiscardedEvidence,
  totalPages,
  validateCandidateRelation,
} from './adminCandidates.ts';
import {
  emptyAdminDrafts,
  parseAdminDrafts,
  saveBookDraft,
  saveCandidateBatchDraft,
  type CandidateBatchDraft,
} from './adminMaintenance.ts';
import {
  assertCandidateMeta,
  parseExtractChapters,
  type CandidateBatchDetail,
  type CandidateLink,
} from './loadCandidates.ts';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function link(partial: Partial<CandidateLink> = {}): CandidateLink {
  return {
    source: 'plant_based_diet',
    target: 'chronic_disease',
    relation: '以全食物植物为主的膳食模式与较低慢性病发生相关',
    merge_action: 'new',
    existing_endpoint_pair: false,
    evidences: [
      {
        excerpt: '观察叙述一句。',
        excerpt_id: 'ev_1',
        note_id: 'ev_1',
      },
      {
        excerpt: '另一条证据。',
        excerpt_id: 'ev_2',
        note_id: 'ev_2',
      },
    ],
    ...partial,
  };
}

test('candidate drafts parse with backward compatible empty candidates', () => {
  const legacy = parseAdminDrafts(JSON.stringify({ version: 1, books: {}, edges: {} }));
  assert.deepEqual(legacy.candidates, {});
  const withCand = parseAdminDrafts(
    JSON.stringify({
      version: 1,
      books: {},
      edges: {},
      candidates: {
        china_study: {
          discardedEdges: ['a~b'],
          discardedEvidences: { 'a~b': ['ev_1'] },
          relationOverrides: { 'a~b': '公共观察表述' },
          nodeRemaps: { cancer_overall: 'digestive_cancer_risk' },
          status: 'exported',
          exportedAt: '2026-11-05T00:00:00.000Z',
        },
        bad: { status: 'nope' },
      },
    }),
  );
  assert.equal(withCand.candidates?.china_study?.discardedEdges?.[0], 'a~b');
  assert.equal(withCand.candidates?.bad, undefined);
});

test('saving book drafts preserves candidate namespace', () => {
  let file = saveCandidateBatchDraft(emptyAdminDrafts(), 'china_study', {
    discardedEdges: ['x~y'],
  });
  file = saveBookDraft(
    file,
    'gut_brain',
    {
      authors: '甲',
      year: '2018',
      summary: '简介',
      url: '',
      status: 'index_only',
    },
    {
      authors: '乙',
      year: '2018',
      summary: '简介',
      url: '',
      status: 'index_only',
    },
  );
  assert.deepEqual(file.candidates?.china_study?.discardedEdges, ['x~y']);
});

test('relation validation keeps education boundary and length cap', () => {
  assert.equal(validateCandidateRelation('  '), '请填写关系表述');
  assert.equal(validateCandidateRelation('x'.repeat(241)), '关系表述超过可保存长度');
  assert.equal(
    validateCandidateRelation('书中写到膳食与结局相关'),
    '关系表述请使用公共观察句式，勿带书名框架',
  );
  assert.equal(
    validateCandidateRelation('该模式与结局相关，并提及治' + '愈'),
    '关系表述越过教育边界，请改成公共观察表述',
  );
  assert.equal(validateCandidateRelation('膳食模式与较低慢病发生相关'), null);
});

test('discard / relation / remap helpers and export package', () => {
  let draft: CandidateBatchDraft = {};
  const row = link();
  const key = candidateEdgeKey(row);
  draft = toggleDiscardedEdge(draft, key, true);
  assert.equal(isEdgeDiscarded(row, draft), true);
  draft = toggleDiscardedEvidence(draft, key, 'ev_1', true);
  draft = setRelationOverride(draft, key, '修订后的公共观察表述', row.relation);
  draft = setNodeRemap(draft, 'cancer_overall', 'digestive_cancer_risk');
  assert.equal(presentCandidateRelation(row, draft), '修订后的公共观察表述');

  const batch: CandidateBatchDetail = {
    meta: {
      source_id: 'china_study',
      source_title: '救命饮食：中国健康调查报告',
      themes: ['health'],
      status: 'pending_review',
      edge_count: 1,
      evidence_count: 2,
      new_node_count: 1,
      reuse_node_count: 0,
      append_count: 0,
      aligned_data_version: '2.1',
      aligned_schema_version: '0.7',
    },
    links: [row],
    newNodes: [{ id: 'cancer_overall', label: '癌症（总体）', type: 'disease' }],
    reuseNodes: [],
    chapters: [],
    extractNotes: '',
  };
  const exportedAt = '2026-11-05T12:00:00.000Z';
  const marked = markExported(draft, exportedAt);
  const pkg = buildReviewedPackage(batch, marked, exportedAt);
  assert.equal(pkg.meta.review_status, 'exported');
  assert.equal(pkg.candidate_links[0]?.discarded, true);
  assert.equal(pkg.candidate_links[0]?.evidences[0]?.discarded, true);
  assert.equal(pkg.candidate_links[0]?.relation, '修订后的公共观察表述');
  assert.equal(pkg.new_nodes[0]?.remap_to, 'digestive_cancer_risk');
  assert.match(pkg.meta.note, /Brent/);
  assert.equal(resolveBatchStatus(batch.meta, marked), 'exported');
});

test('edge table pagination helpers', () => {
  const rows = Array.from({ length: 45 }, (_, i) => i);
  assert.deepEqual(pageSlice(rows, 1, 20), rows.slice(0, 20));
  assert.deepEqual(pageSlice(rows, 3, 20), rows.slice(40));
  assert.equal(totalPages(45, 20), 3);
  assert.equal(totalPages(0, 20), 1);
});

test('load china_study meta smoke and parse chapter coverage', () => {
  const metaPath = path.join(root, 'data/candidates/china_study/meta.json');
  const notesPath = path.join(root, 'data/candidates/china_study/extract_notes.md');
  const meta = assertCandidateMeta(JSON.parse(fs.readFileSync(metaPath, 'utf8')));
  assert.equal(meta.source_id, 'china_study');
  assert.equal(meta.edge_count, 141);
  assert.equal(meta.evidence_count, 308);
  assert.equal(meta.new_node_count, 20);
  assert.equal(meta.append_count, 18);
  assert.equal(meta.aligned_data_version, '2.1');
  const chapters = parseExtractChapters(fs.readFileSync(notesPath, 'utf8'));
  assert.ok(chapters.length >= 30);
  const skipped = chapters.filter((row) => row.skipped);
  const covered = chapters.filter((row) => !row.skipped);
  assert.ok(skipped.length >= 10);
  assert.ok(covered.length >= 15);
  assert.ok(skipped.some((row) => row.spine === '0'));
});
