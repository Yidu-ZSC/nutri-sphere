import assert from 'node:assert/strict';
import test from 'node:test';
import { FLOW_BAND_BUDGET, type FlowEdgeInput } from './flowLayout.ts';
import { selectHierarchyLinks } from './hierarchyBudget.ts';

function edge(
  source: string,
  target: string,
  graphIndex: number,
  strength: FlowEdgeInput['strength'] = 'low',
  evidenceCount = 1,
): FlowEdgeInput {
  return {
    source,
    target,
    graphIndex,
    direction: 'risk',
    strength,
    relation: '常被一起讨论',
    evidenceCount,
  };
}

test('hierarchy drawing keeps at most the shared edge budget', () => {
  const links = Array.from({ length: FLOW_BAND_BUDGET + 5 }, (_, index) =>
    edge('food', `target_${index}`, index),
  );
  const picked = selectHierarchyLinks(links, [], null);
  assert.equal(picked.links.length, FLOW_BAND_BUDGET);
  assert.equal(picked.omittedBudget, 5);
});

test('anchor edges outrank stronger interior edges in the hierarchy', () => {
  const links = Array.from({ length: FLOW_BAND_BUDGET }, (_, index) =>
    edge(`source_${index}`, `target_${index}`, index, 'high', 12),
  );
  links.push(edge('anchor', 'neighbor', FLOW_BAND_BUDGET, 'low', 1));
  const picked = selectHierarchyLinks(links, ['anchor'], null);
  assert.equal(picked.links.some((link) => link.graphIndex === FLOW_BAND_BUDGET), true);
  assert.equal(picked.links.length, FLOW_BAND_BUDGET);
});

test('a selected hierarchy edge stays drawn past the budget', () => {
  const links = Array.from({ length: FLOW_BAND_BUDGET + 1 }, (_, index) =>
    edge(`source_${index}`, `target_${index}`, index),
  );
  const picked = selectHierarchyLinks(links, [], FLOW_BAND_BUDGET);
  assert.equal(picked.links.some((link) => link.graphIndex === FLOW_BAND_BUDGET), true);
  assert.equal(picked.links.length, FLOW_BAND_BUDGET);
});
