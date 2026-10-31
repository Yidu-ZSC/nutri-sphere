import assert from 'node:assert/strict';
import test from 'node:test';
import { DISCLAIMER_SHORT, DISCLAIMER_TEXT, disclaimerSegments } from './copy.ts';

const SPEC_TEXT =
  '免责声明：NutriSphere 是教育与研究用途的知识图谱可视化工具，不是医疗器械，不提供诊断、治疗方案或个性化医疗建议。图中关联多来自书摘与公开资料中的机制/观察描述，存在局限，不能替代执业医师或注册营养专业人员的意见。健康决策请咨询具备资质的专业人员。';

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
