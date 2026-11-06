import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  HIERARCHY_BUDGET_NOTE,
  LOBBY_CONTRAST_NOTE,
  LOBBY_INTRO,
  LOBBY_OUTCOMES_SUMMARY,
  LOBBY_RECOMMENDED_HEADING,
  LOBBY_SEARCH_EMPTY,
  LOBBY_SEARCH_PLACEHOLDER,
} from './exploreShell.ts';
import { FLOW_BAND_BUDGET } from './flowLayout.ts';
import { LOBBY_RECOMMENDED } from './lobbyEntry.ts';
import { themeById } from './themes.ts';
import type { GraphData } from '../types/graph.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function seed(): GraphData {
  return JSON.parse(
    fs.readFileSync(path.join(root, 'data/seed_triples_v0.3_aligned.json'), 'utf8'),
  ) as GraphData;
}

test('lobby recommendations keep the curated order and anchors', () => {
  assert.deepEqual(
    LOBBY_RECOMMENDED.map((entry) => [entry.id, entry.kind, entry.anchorNodeId]),
    [
      ['plant-based', 'theme', 'plant_based_diet'],
      ['animal-foods', 'lens', 'animal_foods'],
      ['added-sugar', 'lens', 'added_sugar'],
    ],
  );
  const plantTheme = themeById(LOBBY_RECOMMENDED[0].id);
  assert.equal(plantTheme?.foodId, 'plant_based_diet');
});

test('contrast recommendation anchors exist with their expected node types', () => {
  const nodes = new Map(seed().nodes.map((node) => [node.id, node]));
  assert.equal(nodes.get('animal_foods')?.type, 'food_category');
  assert.equal(nodes.get('added_sugar')?.type, 'food_category');
});

test('new lobby copy stays within the educational boundary', () => {
  assert.equal(LOBBY_RECOMMENDED_HEADING, '先看这些');
  assert.equal(LOBBY_CONTRAST_NOTE, '对照着看资料里另一类食物如何被讨论');
  assert.equal(LOBBY_OUTCOMES_SUMMARY, '按结局浏览');
  assert.equal(
    HIERARCHY_BUDGET_NOTE,
    `这一视图画出 ${FLOW_BAND_BUDGET} 条关联，其余仍留在资料和搜索里。`,
  );
  const banned = [
    '治疗',
    '治愈',
    '处方',
    '请服用',
    '停药',
    '替代医生',
    'GRADE',
    '降低',
    '预防',
    '逆转',
    '疗效',
    '防治',
    '患者',
    '建议你吃',
  ];
  const copy = [
    LOBBY_INTRO,
    LOBBY_SEARCH_PLACEHOLDER,
    LOBBY_SEARCH_EMPTY,
    LOBBY_RECOMMENDED_HEADING,
    LOBBY_CONTRAST_NOTE,
    LOBBY_OUTCOMES_SUMMARY,
    HIERARCHY_BUDGET_NOTE,
  ].join('\n');
  for (const word of banned) assert.equal(copy.includes(word), false, word);
});
