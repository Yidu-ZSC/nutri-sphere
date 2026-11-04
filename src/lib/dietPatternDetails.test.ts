import assert from 'node:assert/strict';
import test from 'node:test';
import { DIET_PATTERN_CARDS } from './dietPatterns.ts';
import {
  COMPARE_CELLS,
  COMPARE_COLUMNS,
  DIET_PATTERN_DETAILS,
  PATTERN_COMPARE_ROWS,
  PATTERN_SAMPLE_DISCLAIMER,
  PATTERN_SHELL,
  dietPatternById,
  patternSidebarDetailLabel,
} from './dietPatternDetails.ts';
import { themeById } from './themes.ts';

const banned = ['治愈', '疗效', '处方', '停药', '你患有', '诊断为', '包治', '必死', '替代就医', '防治', 'GRADE', '预防', '推荐', '建议采用'];

test('pattern details follow the locked copy and stay on known themes', () => {
  assert.deepEqual(
    DIET_PATTERN_DETAILS.map((detail) => detail.id),
    DIET_PATTERN_CARDS.map((card) => card.id),
  );
  assert.equal(PATTERN_SHELL.lobbyIntro.includes('个人方案'), false);
  assert.equal(PATTERN_SAMPLE_DISCLAIMER, '仅为说明模式特征的示例组合，非个人食谱或饮食医嘱。');

  for (const detail of DIET_PATTERN_DETAILS) {
    const card = DIET_PATTERN_CARDS.find((item) => item.id === detail.id);
    assert.ok(card);
    assert.equal(detail.title, card.title);
    assert.equal(detail.summary, card.summary);
    assert.equal(detail.practice_hint, card.practice_hint);
    assert.equal(detail.hook, card.hook, detail.id);
    assert.equal(detail.evidence_note, card.evidence_note);
    assert.deepEqual(detail.related_themes, card.related_themes);
    assert.equal(detail.sample_day.disclaimer, PATTERN_SAMPLE_DISCLAIMER);
    assert.ok(detail.limitations.trim().length > 0);
    assert.ok(detail.limitations.includes('健康决策请咨询专业人员'));
    assert.ok(detail.emphasize_items.length > 0);
    assert.ok(detail.limit_items.length > 0);
    assert.ok(detail.graph_paths.length > 0 && detail.graph_paths.length <= 2);
    for (const item of [...detail.emphasize_items, ...detail.limit_items]) {
      assert.ok(item.note.length > 0);
      assert.ok(item.note.length <= 40, item.note);
    }
    for (const themeId of detail.related_themes) assert.ok(themeById(themeId), themeId);
    for (const path of detail.graph_paths) assert.ok(themeById(path.theme_id), path.theme_id);
    const copy = JSON.stringify(detail);
    for (const word of banned) assert.equal(copy.includes(word), false, `${detail.id} ${word}`);
  }

  assert.equal(dietPatternById('plant_forward')?.evidence_badge, '书摘与观察');
  assert.equal(dietPatternById('lacto_ovo')?.evidence_badge, '书摘与综述');
  assert.equal(dietPatternById('vegan_whole')?.evidence_badge, '书摘与综述');
  assert.equal(dietPatternById('mediterranean'), null);
  assert.equal(dietPatternById('dash'), null);
  assert.equal(dietPatternById('nope'), null);
});

test('compare matrix uses only the four locked cell words and does not rank', () => {
  assert.deepEqual(
    COMPARE_COLUMNS.map((column) => column.id),
    ['plant_forward', 'lacto_ovo', 'vegan_whole'],
  );
  assert.deepEqual(COMPARE_COLUMNS.map((column) => column.title), ['以植物为主', '蛋奶素', '全食物全素']);
  assert.equal(PATTERN_COMPARE_ROWS.length, 6);
  const allowed = new Set<string>(COMPARE_CELLS);
  for (const row of PATTERN_COMPARE_ROWS) {
    assert.equal(row.cells.length, 3);
    for (const cell of row.cells) assert.equal(allowed.has(cell), true, cell);
  }
  assert.deepEqual(PATTERN_COMPARE_ROWS[2]?.cells, ['可选', '部分', '限制']);
  const shell = [PATTERN_SHELL.compareTitle, PATTERN_SHELL.compareNote, PATTERN_SHELL.compareLegend].join('\n');
  for (const word of ['更好', '最优', '最佳', '推荐采用', '建议你吃', '评分', '胜出', ...banned]) {
    assert.equal(shell.includes(word), false, word);
  }
  assert.match(PATTERN_SHELL.compareNote, /不是排名/);
});

test('sidebar detail labels match the locked short names', () => {
  assert.equal(patternSidebarDetailLabel('弹性素食 · 以植物为主'), '弹性素食详情');
  assert.equal(patternSidebarDetailLabel('蛋奶素食'), '蛋奶素食详情');
  assert.equal(PATTERN_SHELL.sidebarOne, '查看路径详情');
});
