import assert from 'node:assert/strict';
import test from 'node:test';
import {
  effectiveFocusIds,
  focusedNodeIds,
  isFocusEmpty,
  linkIsBrightInFocus,
  linkIsFocused,
  linkIsRootIncident,
  neighborhood,
} from './focus.ts';

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

test('neighborhood is one hop including the root', () => {
  const ids = neighborhood('chronic_inflammation', links);
  assert.deepEqual([...ids].sort(), ['chronic_inflammation', 'glycation', 'liver_chronic']);
});

test('a lone lens keeps the node and its one-hop neighbors', () => {
  const focus = focusedNodeIds(links, null, null, null, 'chronic_inflammation');
  assert.deepEqual([...(focus ?? [])].sort(), ['chronic_inflammation', 'glycation', 'liver_chronic']);
});

test('a lens intersects with the other anchors when both are present', () => {
  const focus = focusedNodeIds(links, 'liver_chronic', null, null, 'glycation');
  assert.deepEqual([...(focus ?? [])].sort(), ['chronic_inflammation']);
  assert.equal(focus?.has('mental_health'), false);
});

test('effectiveFocusIds with no click keeps filter focus', () => {
  const filter = focusedNodeIds(links, 'liver_chronic', null);
  assert.equal(effectiveFocusIds(filter, null, links), filter);
  assert.equal(effectiveFocusIds(null, null, links), null);
});

test('effectiveFocusIds with only click uses one-hop neighborhood', () => {
  const focus = effectiveFocusIds(null, 'chronic_inflammation', links);
  assert.deepEqual([...(focus ?? [])].sort(), ['chronic_inflammation', 'glycation', 'liver_chronic']);
});

test('effectiveFocusIds ANDs click neighborhood with filter focus', () => {
  const filter = focusedNodeIds(links, 'liver_chronic', null);
  const focus = effectiveFocusIds(filter, 'chronic_inflammation', links);
  assert.deepEqual([...(focus ?? [])].sort(), ['chronic_inflammation', 'liver_chronic']);
  assert.equal(focus?.has('glycation'), false);
});

test('clearing click focus restores filter-only bright set', () => {
  const filter = focusedNodeIds(links, 'liver_chronic', null);
  const withClick = effectiveFocusIds(filter, 'chronic_inflammation', links);
  assert.equal(withClick?.has('glycation'), false);
  const cleared = effectiveFocusIds(filter, null, links);
  assert.deepEqual([...(cleared ?? [])].sort(), [...(filter ?? [])].sort());
});

test('root incident edges are exactly the in+out edges of the browsing root', () => {
  const rootLinks = [
    { source: 'root', target: 'a' },
    { source: 'b', target: 'root' },
    { source: 'a', target: 'b' },
    { source: 'c', target: 'd' },
  ];
  assert.equal(linkIsRootIncident(rootLinks[0]!, 'root'), true);
  assert.equal(linkIsRootIncident(rootLinks[1]!, 'root'), true);
  assert.equal(linkIsRootIncident(rootLinks[2]!, 'root'), false);
  assert.equal(linkIsRootIncident(rootLinks[3]!, 'root'), false);
  assert.equal(linkIsRootIncident(rootLinks[0]!, null), false);
});

test('neighbor—neighbor edges stay dim while root incident edges stay bright', () => {
  const root = 'root';
  const focus = new Set(['root', 'a', 'b']);
  assert.equal(linkIsBrightInFocus({ source: 'root', target: 'a' }, root, focus), true);
  assert.equal(linkIsBrightInFocus({ source: 'b', target: 'root' }, root, focus), true);
  assert.equal(linkIsBrightInFocus({ source: 'a', target: 'b' }, root, focus), false);
  // Without a root, fall back to the induced-subgraph rule.
  assert.equal(linkIsBrightInFocus({ source: 'a', target: 'b' }, null, focus), true);
  assert.equal(linkIsBrightInFocus({ source: 'a', target: 'b' }, null, null), true);
});
