import assert from 'node:assert/strict';
import test from 'node:test';
import { themeHintVisible, THEME_HINT_CLOSE } from './exploreShell.ts';
import { DIM_2D_LINK, DIM_2D_NODE, DIM_3D_LABEL, DIM_3D_LINK, DIM_3D_NODE } from './palette.ts';

test('NS-045 dimmed strengths are locked to the spec', () => {
  assert.equal(DIM_2D_NODE, 0.08);
  assert.equal(DIM_2D_LINK, 0.06);
  assert.equal(DIM_3D_NODE, 0.06);
  assert.equal(DIM_3D_LABEL, 0.08);
  assert.equal(DIM_3D_LINK, 0.05);
});

const base = {
  noTheme: true,
  filterEmpty: false,
  clickFocusId: null,
  hasSelection: false,
  dismissed: false,
};

test('theme hint shows only with no theme and nothing focused', () => {
  assert.equal(themeHintVisible(base), true);
  assert.equal(themeHintVisible({ ...base, noTheme: false }), false);
  assert.equal(themeHintVisible({ ...base, filterEmpty: true }), false);
});

test('theme hint hides on click focus, selection, or dismissal', () => {
  assert.equal(themeHintVisible({ ...base, clickFocusId: 'glycation' }), false);
  assert.equal(themeHintVisible({ ...base, hasSelection: true }), false);
  assert.equal(themeHintVisible({ ...base, dismissed: true }), false);
  assert.equal(THEME_HINT_CLOSE, '关闭');
});
