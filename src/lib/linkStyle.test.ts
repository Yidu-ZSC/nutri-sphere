import assert from 'node:assert/strict';
import test from 'node:test';
import { LINK_OPACITY_3D, LINK_WIDTH_SCALE_3D, particleCount, styledLinkWidth } from './linkStyle.ts';

test('3d edges stay quieter than the phase 1.5 tubes', () => {
  assert.ok(LINK_WIDTH_SCALE_3D < 1);
  assert.ok(LINK_OPACITY_3D <= 0.55);
  const previousHigh = 2.5 * 1.45;
  assert.ok(styledLinkWidth('high', '3d', false) < previousHigh * 0.5);
  assert.ok(styledLinkWidth('high', '2d', false) > styledLinkWidth('low', '2d', false));
  assert.ok(styledLinkWidth('high', '2d', false) <= 3.2);
  assert.ok(styledLinkWidth('high', '2d', true) > styledLinkWidth('high', '2d', false));
});

test('particles stay off until a filter or selection asks for them', () => {
  assert.equal(particleCount({ coarse: false, selected: false, focused: true, filtered: false }), 0);
  assert.equal(particleCount({ coarse: false, selected: true, focused: true, filtered: false }), 2);
  assert.equal(particleCount({ coarse: true, selected: true, focused: true, filtered: true }), 0);
  assert.equal(particleCount({ coarse: false, selected: false, focused: true, filtered: true }), 1);
});
