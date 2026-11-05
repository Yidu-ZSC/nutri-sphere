import assert from 'node:assert/strict';
import test from 'node:test';
import { DIET_PATTERN_CARDS } from './dietPatterns.ts';
import {
  COMPARE_CELLS,
  COMPARE_COLUMNS,
  PATTERN_COMPARE_ROWS,
  PATTERN_SHELL,
  VEGAN_DIET_HUB_EVIDENCE,
  VEGAN_DIET_HUB_ID,
  isVeganDietHubPattern,
  normalizeVeganDietPatternId,
} from './dietPatternDetails.ts';

const banned = ['治愈', '疗效', '处方', '停药', '你患有', '诊断为', '包治', '必死', '替代就医', '防治', 'GRADE', '预防', '推荐', '建议采用'];

test('vegan diet hub normalizes legacy step ids to one detail screen', () => {
  assert.equal(normalizeVeganDietPatternId(VEGAN_DIET_HUB_ID), VEGAN_DIET_HUB_ID);
  assert.equal(normalizeVeganDietPatternId('plant_forward'), VEGAN_DIET_HUB_ID);
  assert.equal(normalizeVeganDietPatternId('lacto_ovo'), VEGAN_DIET_HUB_ID);
  assert.equal(normalizeVeganDietPatternId('vegan_whole'), VEGAN_DIET_HUB_ID);
  assert.equal(normalizeVeganDietPatternId('mediterranean'), null);
  assert.equal(isVeganDietHubPattern('plant_forward'), true);
  assert.equal(PATTERN_SHELL.sidebarOne, '查看素食饮食方式详情');
  assert.ok(VEGAN_DIET_HUB_EVIDENCE.evidence_note.includes('不是原创研究'));
});

test('compare matrix uses only the four locked cell words and does not rank', () => {
  assert.deepEqual(
    COMPARE_COLUMNS.map((column) => column.id),
    DIET_PATTERN_CARDS.map((card) => card.id),
  );
  assert.equal(PATTERN_COMPARE_ROWS.length, 6);
  const allowed = new Set<string>(COMPARE_CELLS);
  for (const row of PATTERN_COMPARE_ROWS) {
    assert.equal(row.cells.length, 3);
    for (const cell of row.cells) assert.equal(allowed.has(cell), true, cell);
  }
  const shell = [PATTERN_SHELL.hubTitle, PATTERN_SHELL.hubNote, PATTERN_SHELL.compareLegend].join('\n');
  for (const word of ['更好', '最优', '最佳', '推荐采用', '建议你吃', '评分', '胜出', ...banned]) {
    assert.equal(shell.includes(word), false, word);
  }
  assert.match(PATTERN_SHELL.hubNote, /不是三种互斥/);
});
