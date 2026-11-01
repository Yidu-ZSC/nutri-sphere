import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EXPLORE_THEMES,
  HOME_HEALTH_THEMES,
  HOME_MECHANISM_THEMES,
  HIERARCHY_HINT,
  themeById,
} from './themes.ts';

test('explore themes still resolve on the aligned seed and avoid treatment wording', () => {
  const seed = JSON.parse(
    fs.readFileSync(new URL('../../data/seed_triples_v0.3_aligned.json', import.meta.url), 'utf8'),
  ) as {
    meta: { schema_version?: string; data_version?: string };
    nodes: { id: string; type: string }[];
    links: unknown[];
  };
  assert.equal(seed.meta.schema_version, '0.3');
  assert.equal(seed.meta.data_version, '0.6');
  assert.equal(seed.nodes.length, 70);
  assert.equal(seed.links.length, 126);
  assert.ok(EXPLORE_THEMES.length >= 3);
  assert.equal(HIERARCHY_HINT.includes('防治'), false);
  assert.deepEqual(
    HOME_HEALTH_THEMES.map((theme) => theme.diseaseId),
    [
      'cardiometabolic',
      'fatty_liver',
      'obesity_risk',
      'ibd_related',
      'liver_chronic',
      'digestive_cancer_risk',
      'autoimmune',
      'mental_health',
      'breast_prostate_risk',
    ],
  );
  assert.equal(HOME_HEALTH_THEMES.every((theme) => theme.kind === 'health_topic' && theme.mechanismId === null), true);
  assert.deepEqual(
    HOME_MECHANISM_THEMES.map((theme) => theme.id),
    ['chronic-inflammation', 'gut-barrier', 'glycation'],
  );
  assert.equal(
    HOME_MECHANISM_THEMES.every((theme) => theme.kind === 'mechanism_deep' && theme.diseaseId === null),
    true,
  );
  assert.equal(themeById('fatty_liver')?.diseaseId, 'fatty_liver');
  assert.equal(EXPLORE_THEMES[0]?.kind, 'health_topic');
  assert.deepEqual(
    HOME_HEALTH_THEMES.map((theme) => ({
      id: theme.id,
      label: theme.label,
      title: theme.title,
      prompt: theme.prompt,
      blurb: theme.blurb,
    })),
    [
      {
        id: 'cardiometabolic',
        label: '心血管 / 代谢',
        title: '想了解心血管与代谢相关饮食讨论',
        prompt: '这个主题和饮食常被怎样一起讨论？',
        blurb: '公开资料里常把饮食与这些主题放在一起说。',
      },
      {
        id: 'fatty_liver',
        label: '脂肪肝相关',
        title: '想了解脂肪肝相关饮食讨论',
        prompt: '这个主题和饮食常被怎样一起讨论？',
        blurb: '与代谢、炎症叙述常一起出现。',
      },
      {
        id: 'obesity_risk',
        label: '肥胖相关风险',
        title: '想看看体重相关饮食讨论',
        prompt: '这个主题和饮食常被怎样一起讨论？',
        blurb: '体重主题与饮食叙述常一起出现。',
      },
      {
        id: 'ibd_related',
        label: '炎症性肠病相关',
        title: '想了解炎症性肠病相关饮食讨论',
        prompt: '这个主题和饮食常被怎样一起讨论？',
        blurb: '屏障与炎症叙述里常被一起讨论。',
      },
      {
        id: 'liver_chronic',
        label: '慢性肝炎相关进展',
        title: '想了解肝脏相关饮食讨论',
        prompt: '这个主题和饮食常被怎样一起讨论？',
        blurb: '书摘与资料里与饮食、肝脏叙述常一起出现。',
      },
      {
        id: 'digestive_cancer_risk',
        label: '消化系统癌症风险',
        title: '想了解消化系统风险与饮食讨论',
        prompt: '这个主题和饮食常被怎样一起讨论？',
        blurb: '消化系统主题与饮食常被一起讨论。',
      },
      {
        id: 'autoimmune',
        label: '自身免疫相关',
        title: '想了解自身免疫相关饮食讨论',
        prompt: '这个主题和饮食常被怎样一起讨论？',
        blurb: '自身免疫主题与饮食叙述常被讨论。',
      },
      {
        id: 'mental_health',
        label: '心理健康 / 抑郁等',
        title: '想了解情绪与饮食的讨论',
        prompt: '这个主题和饮食常被怎样一起讨论？',
        blurb: '情绪相关主题与饮食常被一起讨论。',
      },
      {
        id: 'breast_prostate_risk',
        label: '乳腺与前列腺风险',
        title: '想了解这些风险与饮食的讨论',
        prompt: '这个主题和饮食常被怎样一起讨论？',
        blurb: '这些风险主题与饮食叙述常被讨论。',
      },
    ],
  );
  assert.deepEqual(
    HOME_MECHANISM_THEMES.map((theme) => ({ id: theme.id, title: theme.title, blurb: theme.blurb })),
    [
      { id: 'chronic-inflammation', title: '慢性炎症', blurb: '慢性炎症在资料里常被一起讨论。' },
      { id: 'gut-barrier', title: '肠道屏障', blurb: '屏障相关叙述与饮食常被讨论。' },
      { id: 'glycation', title: '糖化', blurb: '糖化叙述与饮食常被一起讨论。' },
    ],
  );
  const banned = ['治疗', '治愈', '处方', '请服用', '停药', '替代医生', 'GRADE', '降低', '预防', '逆转', '疗效', '防治', '患者'];
  for (const theme of EXPLORE_THEMES) {
    assert.equal(theme.label.includes('防治'), false);
    if (theme.diseaseId) {
      assert.equal(
        seed.nodes.some((node) => node.id === theme.diseaseId && node.type === 'disease'),
        true,
      );
    }
    if (theme.mechanismId) {
      assert.equal(
        seed.nodes.some((node) => node.id === theme.mechanismId && node.type === 'mechanism'),
        true,
      );
    }
    assert.ok([...theme.blurb].length > 0 && [...theme.blurb].length <= 40, theme.id);
    assert.equal(theme.blurb.includes('教育向整理'), false, theme.id);
    assert.equal(theme.blurb.includes('机制向深读'), false, theme.id);
    const copy = `${theme.label} ${theme.title} ${theme.prompt} ${theme.blurb}`;
    for (const word of banned) {
      assert.equal(copy.includes(word), false, `${theme.id} ${word}`);
    }
  }
});
