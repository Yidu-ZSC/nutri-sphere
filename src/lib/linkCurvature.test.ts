import assert from 'node:assert/strict';
import test from 'node:test';
import { computeLinkCurvature, LONG_COLLINEAR_CURVATURE } from './linkCurvature.ts';

test('curves long collinear edge when a shorter hop shares the same target', () => {
  const positions = new Map([
    ['dietary_fiber', { x: -39, y: -60 }],
    ['insulin_resistance', { x: 39, y: -110 }],
    ['cardiometabolic', { x: 117, y: -120 }],
  ]);
  const links = [
    { source: 'dietary_fiber', target: 'cardiometabolic' },
    { source: 'insulin_resistance', target: 'cardiometabolic' },
  ];
  const curvatures = computeLinkCurvature(links, positions);
  assert.equal(curvatures[1], 0);
  assert.ok(Math.abs(curvatures[0]) === LONG_COLLINEAR_CURVATURE);
});

test('leaves unrelated edges straight', () => {
  const positions = new Map([
    ['a', { x: 0, y: 0 }],
    ['b', { x: 40, y: 0 }],
    ['c', { x: 40, y: 40 }],
  ]);
  const links = [
    { source: 'a', target: 'b' },
    { source: 'b', target: 'c' },
  ];
  const curvatures = computeLinkCurvature(links, positions);
  assert.deepEqual(curvatures, [0, 0]);
});

test('curves long edge when intermediate lies on same source fan-out', () => {
  const positions = new Map([
    ['a', { x: 0, y: 0 }],
    ['b', { x: 80, y: 10 }],
    ['c', { x: 160, y: 20 }],
  ]);
  const links = [
    { source: 'a', target: 'c' },
    { source: 'a', target: 'b' },
  ];
  const curvatures = computeLinkCurvature(links, positions);
  assert.equal(curvatures[1], 0);
  assert.ok(Math.abs(curvatures[0]) === LONG_COLLINEAR_CURVATURE);
});
