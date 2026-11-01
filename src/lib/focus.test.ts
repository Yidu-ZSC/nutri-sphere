import assert from 'node:assert/strict';
import test from 'node:test';
import { focusedNodeIds, isFocusEmpty, linkIsFocused } from './focus.ts';

const links = [
  { source: 'chronic_inflammation', target: 'liver_chronic' },
  { source: 'glycation', target: 'chronic_inflammation' },
  { source: 'gut_microbiome', target: 'mental_health' },
];

test('no filters leave the full graph visible', () => {
  assert.equal(focusedNodeIds(links, null, null), null);
  assert.equal(isFocusEmpty(null, ['liver_chronic']), false);
});

test('a disease filter keeps the node and its neighbors', () => {
  const focus = focusedNodeIds(links, 'liver_chronic', null);
  assert.deepEqual([...(focus ?? [])].sort(), ['chronic_inflammation', 'liver_chronic']);
  assert.equal(linkIsFocused(links[0], focus), true);
  assert.equal(linkIsFocused(links[1], focus), false);
});

test('disease and mechanism filters intersect', () => {
  const focus = focusedNodeIds(links, 'liver_chronic', 'chronic_inflammation');
  assert.equal(focus?.has('liver_chronic'), true);
  assert.equal(focus?.has('chronic_inflammation'), true);
  assert.equal(focus?.has('glycation'), false);
});

test('a food anchor keeps the node and its one-hop neighbors', () => {
  const foodLinks = [
    { source: 'ultra_processed', target: 'cardiometabolic' },
    { source: 'ultra_processed', target: 'obesity_risk' },
    { source: 'dietary_fiber', target: 'scfa' },
  ];
  const focus = focusedNodeIds(foodLinks, null, null, 'ultra_processed');
  assert.deepEqual([...(focus ?? [])].sort(), ['cardiometabolic', 'obesity_risk', 'ultra_processed']);
  assert.equal(linkIsFocused(foodLinks[0], focus), true);
  assert.equal(linkIsFocused(foodLinks[2], focus), false);
  assert.equal(focusedNodeIds(foodLinks, null, null, null), null);
});

test('food intersects with a disease anchor', () => {
  const foodLinks = [
    { source: 'ultra_processed', target: 'cardiometabolic' },
    { source: 'ultra_processed', target: 'obesity_risk' },
    { source: 'dietary_fiber', target: 'cardiometabolic' },
  ];
  const focus = focusedNodeIds(foodLinks, 'cardiometabolic', null, 'ultra_processed');
  assert.equal(focus?.has('cardiometabolic'), true);
  assert.equal(focus?.has('ultra_processed'), true);
  assert.equal(focus?.has('obesity_risk'), false);
  assert.equal(focus?.has('dietary_fiber'), false);
});

test('filters with no shared neighborhood are empty', () => {
  const focus = focusedNodeIds(links, 'mental_health', 'glycation');
  assert.equal(
    isFocusEmpty(focus, ['mental_health', 'glycation', 'gut_microbiome', 'chronic_inflammation']),
    true,
  );
});
