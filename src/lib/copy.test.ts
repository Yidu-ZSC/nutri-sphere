import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DISCLAIMER_SHORT,
  DISCLAIMER_TEXT,
  disclaimerSegments,
  evidenceAssurance,
  evidenceBadge,
  evidenceLabel,
  evidenceStatus,
  evidenceTrack,
  visibleGraphStats,
} from './copy.ts';

const SPEC_TEXT =
  '免责声明：ClearDiet 是教育与研究用途的知识图谱可视化工具，不是医疗器械，不提供诊断、治疗方案或个性化医疗建议。图中关联多来自书摘与公开资料中的机制/观察描述，存在局限，不能替代执业医师或注册营养专业人员的意见。健康决策请咨询具备资质的专业人员。';

test('disclaimer copy matches the Phase 1 spec exactly', () => {
  assert.equal(DISCLAIMER_TEXT, SPEC_TEXT);
  assert.equal(DISCLAIMER_SHORT, '教育/研究工具 · 非诊疗 · 非医疗建议 · 请咨询专业人员');
  const joined = disclaimerSegments(DISCLAIMER_TEXT).map((segment) => segment.value).join('');
  assert.equal(joined, DISCLAIMER_TEXT);
  assert.equal(
    disclaimerSegments(DISCLAIMER_TEXT).some((segment) => segment.strong && segment.value === '不提供'),
    true,
  );
});

test('visible graph stats name the rendered set', () => {
  assert.equal(visibleGraphStats(12, 7), '当前可见 12 节点 · 7 关联');
  assert.ok([...visibleGraphStats(0, 0)].length <= 20);
});

test('evidence chips use plain source names', () => {
  assert.equal(evidenceBadge('book_notes_mechanistic'), '书摘·机制');
  assert.equal(evidenceBadge('book_notes_observational_synthesis'), '书摘·观察综述');
  const assurance = evidenceAssurance('book_notes_mechanistic', 'moderate');
  assert.match(assurance, /书摘·机制/);
  assert.match(assurance, /非临床试验/);
  assert.equal(assurance.includes('GRADE'), false);
  assert.equal(evidenceStatus('interventional', {}), '尚未收录该级');
  assert.equal(evidenceStatus('book_notes_mechanistic', { book_notes_mechanistic: 18 }), '已收录 18');
  assert.equal(evidenceTrack('book_notes_mechanistic'), 'book_notes');
  assert.equal(evidenceTrack('book_notes_observational_synthesis'), 'book_notes');
  assert.equal(evidenceTrack('observational'), 'literature');
  assert.equal(evidenceTrack('expert_synthesis'), 'literature');
  assert.equal(evidenceTrack('interventional'), 'literature');
  for (const type of ['observational', 'mechanistic', 'interventional', 'ecological', 'expert_synthesis']) {
    assert.equal(evidenceLabel(type).includes('后续'), false, type);
    assert.equal(evidenceBadge(type).includes('书摘'), false, type);
    assert.equal(evidenceLabel(type).includes('GRADE'), false, type);
  }
  const literature = evidenceAssurance('observational', 'moderate');
  assert.equal(literature.includes('书摘'), false);
  assert.equal(literature.includes('GRADE'), false);
});
