import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import type { GraphData } from '../types/graph.ts';
import { focusedNodeIds } from './focus.ts';
import {
  EXPERT_LAYER_HINT,
  filterByLayer,
  isLaypersonThemeEmpty,
  LAYPERSON_LAYER_HINT,
  LAYPERSON_THEME_EMPTY,
  linkKeptOnLayperson,
  nodeKeptOnLayperson,
  renderVisibleGraph,
} from './layerFilter.ts';
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

test('layperson keeps summary or omitted mechanism nodes and drops the rest', () => {
  assert.equal(nodeKeptOnLayperson(food), true);
  assert.equal(nodeKeptOnLayperson(summary), true);
  assert.equal(nodeKeptOnLayperson(omittedDepth), true);
  assert.equal(nodeKeptOnLayperson({ id: 'blank', type: 'mechanism', mechanism_depth: '' }), true);
  assert.equal(nodeKeptOnLayperson(mid), false);
  assert.equal(nodeKeptOnLayperson(technical), false);
  assert.equal(linkKeptOnLayperson(edge('a', 'b')), true);
  assert.equal(linkKeptOnLayperson(edge('a', 'b', 'general')), true);
  assert.equal(linkKeptOnLayperson(edge('a', 'b', '')), true);
  assert.equal(linkKeptOnLayperson(edge('a', 'b', 'deep_reader')), false);
});

test('layperson hides deep_reader edges and non-summary mechanism nodes', () => {
  const visible = new Set(nodes.map((node) => node.id));
  const view = filterByLayer(nodes, links, visible, 'layperson');
  assert.deepEqual([...view.nodeIds].sort(), ['barrier', 'fatty_liver', 'plain', 'soy']);
  assert.equal(view.links.some((link) => link.audience === 'deep_reader'), false);
  assert.equal(view.links.some((link) => link.source === 'inflam' || link.target === 'lps'), false);
  const general = view.links.find((link) => link.source === 'soy' && link.target === 'plain');
  assert.equal(general?.graphIndex, 1);
  assert.equal(view.nodeIds.has('soy'), true);
  assert.equal(view.nodeIds.has('fatty_liver'), true);
});

test('expert keeps technical nodes and deep_reader edges inside the visible set', () => {
  const visible = new Set(['soy', 'lps', 'inflam', 'fatty_liver']);
  const view = filterByLayer(nodes, links, visible, 'expert');
  assert.deepEqual([...view.nodeIds].sort(), ['fatty_liver', 'inflam', 'lps', 'soy']);
  assert.equal(view.nodeIds.has('barrier'), false);
  const deep = view.links.find((link) => link.source === 'soy' && link.target === 'fatty_liver');
  assert.equal(deep?.audience, 'deep_reader');
  assert.equal(
    view.links.some((link) => link.source === 'lps' && link.target === 'inflam'),
    true,
  );
});

test('pipeline is focus, then hide, then layer', () => {
  const focus = new Set(['soy', 'lps', 'fatty_liver']);
  const hidden = renderVisibleGraph({
    nodes,
    links,
    focusIds: focus,
    hideUnmatched: true,
    pinnedIds: new Set(),
    layer: 'layperson',
  });
  assert.deepEqual([...hidden.nodeIds].sort(), ['fatty_liver', 'soy']);
  assert.equal(hidden.links.length, 0);

  const pinned = renderVisibleGraph({
    nodes,
    links,
    focusIds: focus,
    hideUnmatched: true,
    pinnedIds: new Set(['inflam']),
    layer: 'layperson',
  });
  assert.equal(pinned.nodeIds.has('inflam'), false);

  const open = renderVisibleGraph({
    nodes,
    links,
    focusIds: focus,
    hideUnmatched: false,
    pinnedIds: new Set(),
    layer: 'expert',
  });
  assert.equal(open.nodeIds.has('barrier'), true);
  assert.equal(open.nodeIds.has('lps'), true);
  assert.equal(open.links.some((link) => link.audience === 'deep_reader'), true);
});

test('layperson theme with only non-summary mechanisms is empty', () => {
  const onlyMechanisms = [mid, technical];
  const between = [edge('lps', 'inflam', 'general')];
  const focus = new Set(['lps', 'inflam']);
  const view = renderVisibleGraph({
    nodes: onlyMechanisms,
    links: between,
    focusIds: focus,
    hideUnmatched: true,
    pinnedIds: new Set(),
    layer: 'layperson',
  });
  assert.equal(view.nodeIds.size, 0);
  assert.equal(view.links.length, 0);
  assert.equal(
    isLaypersonThemeEmpty('layperson', focus, view.nodeIds, onlyMechanisms.map((node) => node.id)),
    true,
  );
  const expert = renderVisibleGraph({
    nodes: onlyMechanisms,
    links: between,
    focusIds: focus,
    hideUnmatched: true,
    pinnedIds: new Set(),
    layer: 'expert',
  });
  assert.equal(expert.nodeIds.size, 2);
  assert.equal(isLaypersonThemeEmpty('expert', focus, expert.nodeIds, ['lps', 'inflam']), false);
  assert.equal(isLaypersonThemeEmpty('layperson', null, new Set(), ['lps']), false);
  assert.equal(isLaypersonThemeEmpty('layperson', new Set(['missing']), new Set(), ['soy']), false);
  assert.equal(LAYPERSON_LAYER_HINT, '已简化显示');
  assert.equal(EXPERT_LAYER_HINT, '已展开全部证据');
  assert.equal(LAYPERSON_THEME_EMPTY, '暂无匹配，可切专家层');
  assert.ok([...LAYPERSON_LAYER_HINT].length <= 20);
  assert.ok([...EXPERT_LAYER_HINT].length <= 20);
  assert.ok([...LAYPERSON_THEME_EMPTY].length <= 20);
});

test('seed layperson view drops non-summary mechanisms and deep_reader edges', () => {
  const seed = JSON.parse(
    fs.readFileSync(new URL('../../data/seed_triples_v0.3_aligned.json', import.meta.url), 'utf8'),
  ) as GraphData;
  const summaryCount = seed.nodes.filter(
    (node) =>
      node.type === 'mechanism' &&
      (node.mechanism_depth == null || node.mechanism_depth === 'summary'),
  ).length;
  assert.equal(summaryCount, 0);

  for (const theme of [...HOME_HEALTH_THEMES, ...HOME_MECHANISM_THEMES]) {
    const focusIds = focusedNodeIds(seed.links, theme.diseaseId, theme.mechanismId);
    const lay = renderVisibleGraph({
      nodes: seed.nodes,
      links: seed.links,
      focusIds,
      hideUnmatched: true,
      pinnedIds: new Set(),
      layer: 'layperson',
    });
    const expert = renderVisibleGraph({
      nodes: seed.nodes,
      links: seed.links,
      focusIds,
      hideUnmatched: true,
      pinnedIds: new Set(),
      layer: 'expert',
    });
    assert.ok(lay.nodeIds.size <= 15, `${theme.id} layperson nodes ${lay.nodeIds.size}`);
    for (const id of lay.nodeIds) {
      const node = seed.nodes.find((item) => item.id === id);
      assert.ok(node);
      if (node.type === 'mechanism') {
        assert.ok(node.mechanism_depth == null || node.mechanism_depth === 'summary', node.id);
      }
    }
    for (const link of lay.links) {
      assert.ok(link.audience == null || link.audience === 'general');
      assert.equal(lay.nodeIds.has(link.source) && lay.nodeIds.has(link.target), true);
    }
    assert.ok(expert.nodeIds.size >= lay.nodeIds.size, theme.id);
    assert.equal(
      isLaypersonThemeEmpty(
        'layperson',
        focusIds,
        lay.nodeIds,
        seed.nodes.map((node) => node.id),
      ),
      lay.nodeIds.size === 0,
    );
  }

  const breast = focusedNodeIds(seed.links, 'breast_prostate_risk', null);
  const breastLay = renderVisibleGraph({
    nodes: seed.nodes,
    links: seed.links,
    focusIds: breast,
    hideUnmatched: true,
    pinnedIds: new Set(),
    layer: 'layperson',
  });
  const breastExpert = renderVisibleGraph({
    nodes: seed.nodes,
    links: seed.links,
    focusIds: breast,
    hideUnmatched: true,
    pinnedIds: new Set(),
    layer: 'expert',
  });
  assert.equal(breastLay.nodeIds.has('igf1_signaling'), false);
  assert.equal(breastExpert.nodeIds.has('igf1_signaling'), true);

  const digestion = focusedNodeIds(seed.links, 'digestive_cancer_risk', null);
  const digestionLay = renderVisibleGraph({
    nodes: seed.nodes,
    links: seed.links,
    focusIds: digestion,
    hideUnmatched: true,
    pinnedIds: new Set(),
    layer: 'layperson',
  });
  const digestionExpert = renderVisibleGraph({
    nodes: seed.nodes,
    links: seed.links,
    focusIds: digestion,
    hideUnmatched: true,
    pinnedIds: new Set(),
    layer: 'expert',
  });
  assert.equal(
    digestionLay.links.some((link) => link.audience === 'deep_reader'),
    false,
  );
  assert.equal(
    digestionExpert.links.some(
      (link) => link.source === 'gut_microbiome' && link.target === 'digestive_cancer_risk',
    ),
    true,
  );
});

test('food themes reuse layperson filtering and keep the anchor visible', () => {
  const seed = JSON.parse(
    fs.readFileSync(new URL('../../data/seed_triples_v0.3_aligned.json', import.meta.url), 'utf8'),
  ) as GraphData;

  for (const theme of HOME_FOOD_THEMES) {
    assert.ok(theme.foodId, theme.id);
    const focusIds = focusedNodeIds(seed.links, null, null, theme.foodId);
    assert.equal(focusIds?.has(theme.foodId), true, theme.id);
    const lay = renderVisibleGraph({
      nodes: seed.nodes,
      links: seed.links,
      focusIds,
      hideUnmatched: true,
      pinnedIds: new Set(),
      layer: 'layperson',
    });
    const expert = renderVisibleGraph({
      nodes: seed.nodes,
      links: seed.links,
      focusIds,
      hideUnmatched: true,
      pinnedIds: new Set(),
      layer: 'expert',
    });
    assert.equal(lay.nodeIds.has(theme.foodId), true, theme.id);
    assert.ok(lay.links.length > 0, theme.id);
    assert.ok(lay.nodeIds.size <= 15, `${theme.id} layperson nodes ${lay.nodeIds.size}`);
    assert.ok(expert.links.length >= lay.links.length, theme.id);
    for (const link of lay.links) {
      assert.ok(link.audience == null || link.audience === 'general', theme.id);
    }
    assert.equal(
      isLaypersonThemeEmpty(
        'layperson',
        focusIds,
        lay.nodeIds,
        seed.nodes.map((node) => node.id),
      ),
      false,
      theme.id,
    );
  }

  const fiber = HOME_FOOD_THEMES.find((theme) => theme.id === 'dietary-fiber');
  assert.ok(fiber?.foodId);
  const focusIds = focusedNodeIds(seed.links, null, null, fiber.foodId);
  const lay = renderVisibleGraph({
    nodes: seed.nodes,
    links: seed.links,
    focusIds,
    hideUnmatched: true,
    pinnedIds: new Set(),
    layer: 'layperson',
  });
  const expert = renderVisibleGraph({
    nodes: seed.nodes,
    links: seed.links,
    focusIds,
    hideUnmatched: true,
    pinnedIds: new Set(),
    layer: 'expert',
  });
  // Two deep_reader edges, plus the general edge into expert-only gut_microbiome.
  // That mechanism's other in-neighborhood edges drop with it, so the full view differs by 5.
  const touchesFiber = (link: { source: string; target: string }) =>
    link.source === 'dietary_fiber' || link.target === 'dietary_fiber';
  const layFiber = lay.links.filter(touchesFiber);
  const expertFiber = expert.links.filter(touchesFiber);
  assert.equal(expertFiber.filter((link) => link.audience === 'deep_reader').length, 2);
  assert.equal(layFiber.some((link) => link.audience === 'deep_reader'), false);
  assert.equal(layFiber.length, 10);
  assert.equal(expertFiber.length, 13);
  assert.equal(lay.nodeIds.has('gut_microbiome'), false);
  assert.equal(expert.nodeIds.has('gut_microbiome'), true);
  assert.equal(expert.links.length - lay.links.length, 5);
});
