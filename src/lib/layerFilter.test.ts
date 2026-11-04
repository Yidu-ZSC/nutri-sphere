import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import type { GraphData } from '../types/graph.ts';
import { focusedNodeIds } from './focus.ts';
import { filterVisibleLinks, renderVisibleGraph } from './layerFilter.ts';
import { HOME_FOOD_THEMES, HOME_HEALTH_THEMES, HOME_MECHANISM_THEMES } from './themes.ts';

const food = { id: 'soy', type: 'food', mechanism_depth: 'technical' };
const summary = { id: 'barrier', type: 'mechanism', mechanism_depth: 'summary' };
const omittedDepth = { id: 'plain', type: 'mechanism' };
const mid = { id: 'inflam', type: 'mechanism', mechanism_depth: 'mechanism' };
const technical = { id: 'lps', type: 'mechanism', mechanism_depth: 'technical' };
const disease = { id: 'fatty_liver', type: 'disease' };

const nodes = [food, summary, omittedDepth, mid, technical, disease];

function edge(
  source: string,
  target: string,
  audience?: string,
): { source: string; target: string; audience?: string } {
  return audience === undefined ? { source, target } : { source, target, audience };
}

const links = [
  edge('soy', 'barrier'),
  edge('soy', 'plain', 'general'),
  edge('soy', 'fatty_liver', 'deep_reader'),
  edge('inflam', 'fatty_liver', 'general'),
  edge('lps', 'inflam', 'general'),
  edge('barrier', 'fatty_liver', 'deep_reader'),
];

test('default render keeps technical mechanism nodes and deep_reader edges', () => {
  const visible = new Set(nodes.map((node) => node.id));
  const view = filterVisibleLinks(nodes, links, visible);
  assert.deepEqual(
    [...view.nodeIds].sort(),
    ['barrier', 'fatty_liver', 'inflam', 'lps', 'plain', 'soy'],
  );
  assert.equal(view.links.some((link) => link.audience === 'deep_reader'), true);
  assert.equal(view.nodeIds.has('lps'), true);
  assert.equal(view.nodeIds.has('inflam'), true);
});

test('pipeline is focus then hide; no ViewLayer mask', () => {
  const focus = new Set(['soy', 'lps', 'fatty_liver']);
  const hidden = renderVisibleGraph({
    nodes,
    links,
    focusIds: focus,
    hideUnmatched: true,
    pinnedIds: new Set(),
  });
  assert.deepEqual([...hidden.nodeIds].sort(), ['fatty_liver', 'lps', 'soy']);
  assert.equal(
    hidden.links.some((link) => link.source === 'soy' && link.target === 'fatty_liver'),
    true,
  );

  const pinned = renderVisibleGraph({
    nodes,
    links,
    focusIds: focus,
    hideUnmatched: true,
    pinnedIds: new Set(['inflam']),
  });
  assert.equal(pinned.nodeIds.has('inflam'), true);
});

test('seed themes keep non-summary mechanisms and deep_reader edges visible', () => {
  const seed = JSON.parse(
    fs.readFileSync(new URL('../../data/seed_triples_v0.3_aligned.json', import.meta.url), 'utf8'),
  ) as GraphData;
  for (const theme of [...HOME_HEALTH_THEMES, ...HOME_MECHANISM_THEMES, ...HOME_FOOD_THEMES]) {
    const focus = focusedNodeIds(seed.links, theme.diseaseId, theme.mechanismId, theme.foodId);
    const view = renderVisibleGraph({
      nodes: seed.nodes,
      links: seed.links,
      focusIds: focus,
      hideUnmatched: true,
      pinnedIds: new Set(),
    });
    for (const node of seed.nodes) {
      if (!view.nodeIds.has(node.id)) continue;
      if (node.type === 'mechanism' && (node.mechanism_depth === 'mechanism' || node.mechanism_depth === 'technical')) {
        assert.equal(view.nodeIds.has(node.id), true, `${theme.id} should keep ${node.id}`);
      }
    }
    for (const link of view.links) {
      if (link.audience === 'deep_reader') {
        assert.equal(view.nodeIds.has(link.source) && view.nodeIds.has(link.target), true);
      }
    }
  }
});

test('dietary fiber theme shows deep_reader edges and gut_microbiome', () => {
  const seed = JSON.parse(
    fs.readFileSync(new URL('../../data/seed_triples_v0.3_aligned.json', import.meta.url), 'utf8'),
  ) as GraphData;
  const theme = HOME_FOOD_THEMES.find((item) => item.foodId === 'dietary_fiber') ?? HOME_FOOD_THEMES[0];
  const focus = focusedNodeIds(seed.links, theme.diseaseId, theme.mechanismId, theme.foodId);
  const view = renderVisibleGraph({
    nodes: seed.nodes,
    links: seed.links,
    focusIds: focus,
    hideUnmatched: true,
    pinnedIds: new Set(),
  });
  const touchesFiber = (link: { source: string; target: string }) =>
    link.source === 'dietary_fiber' || link.target === 'dietary_fiber';
  const fiber = view.links.filter(touchesFiber);
  assert.ok(fiber.filter((link) => link.audience === 'deep_reader').length >= 1);
  assert.equal(view.nodeIds.has('gut_microbiome'), true);
});
