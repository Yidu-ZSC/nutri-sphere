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
