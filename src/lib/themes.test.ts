import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EXPLORE_THEMES, HIERARCHY_HINT } from './themes.ts';

test('explore themes stay on the phase 1 seed and avoid treatment wording', () => {
  const seed = JSON.parse(
    fs.readFileSync(new URL('../../data/seed_triples_v0.3_aligned.json', import.meta.url), 'utf8'),
  ) as {
    nodes: { id: string; type: string }[];
    links: unknown[];
  };
  assert.equal(seed.nodes.length, 24);
  assert.equal(seed.links.length, 20);
  assert.ok(EXPLORE_THEMES.length >= 3);
  assert.equal(HIERARCHY_HINT.includes('防治'), false);
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
  }
});
