import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { filterGraphByDomain, normalizeDomain } from './domain.ts';
import type { GraphData, GraphLink, GraphNode } from '../types/graph.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const seed = JSON.parse(
  readFileSync(join(root, 'data/seed_triples_v0.3_aligned.json'), 'utf8'),
) as GraphData;

test('normalizeDomain defaults missing and illegal to health', () => {
  assert.equal(normalizeDomain(undefined), 'health');
  assert.equal(normalizeDomain(null), 'health');
  assert.equal(normalizeDomain(''), 'health');
  assert.equal(normalizeDomain('nutrition'), 'health');
  assert.equal(normalizeDomain('HEALTH'), 'health');
  assert.equal(normalizeDomain('health'), 'health');
  assert.equal(normalizeDomain('environment'), 'environment');
  assert.equal(normalizeDomain('culture'), 'culture');
});

test('filterGraphByDomain keeps full health seed when active=health', () => {
  const filtered = filterGraphByDomain(seed, 'health');
  assert.equal(filtered.nodes.length, seed.nodes.length);
  assert.equal(filtered.links.length, seed.links.length);
  assert.equal(filtered.linkIndices.size, seed.links.length);
  assert.equal(filtered.nodes.length, 210);
  assert.equal(filtered.links.length, 1196);
});

test('filterGraphByDomain yields empty for environment and culture on current seed', () => {
  for (const domain of ['environment', 'culture'] as const) {
    const filtered = filterGraphByDomain(seed, domain);
    assert.equal(filtered.nodes.length, 0);
    assert.equal(filtered.links.length, 0);
    assert.equal(filtered.linkIndices.size, 0);
  }
});

test('filterGraphByDomain hides links whose domain or endpoints disagree', () => {
  const nodes: GraphNode[] = [
    { id: 'a', type: 'food', label: 'A', group: 'g', domain: 'environment' },
    { id: 'b', type: 'food', label: 'B', group: 'g', domain: 'environment' },
    { id: 'c', type: 'food', label: 'C', group: 'g', domain: 'health' },
  ];
  const links: GraphLink[] = [
    {
      source: 'a',
      target: 'b',
      relation: 'related',
      direction: 'protective',
      evidence_type: 'book',
      domain: 'environment',
    },
    {
      source: 'a',
      target: 'b',
      relation: 'related',
      direction: 'protective',
      evidence_type: 'book',
      domain: 'health',
    },
    {
      source: 'a',
      target: 'c',
      relation: 'related',
      direction: 'protective',
      evidence_type: 'book',
      domain: 'environment',
    },
  ];
  const filtered = filterGraphByDomain({ nodes, links }, 'environment');
  assert.equal(filtered.nodes.length, 2);
  assert.equal(filtered.links.length, 1);
  assert.deepEqual([...filtered.linkIndices], [0]);
  assert.equal(filtered.links[0]?.source, 'a');
  assert.equal(filtered.links[0]?.target, 'b');
});

test('omitted domain on nodes/links reads as health', () => {
  const nodes: GraphNode[] = [{ id: 'a', type: 'food', label: 'A', group: 'g' }];
  const links: GraphLink[] = [
    {
      source: 'a',
      target: 'a',
      relation: 'related',
      direction: 'protective',
      evidence_type: 'book',
    },
  ];
  const health = filterGraphByDomain({ nodes, links }, 'health');
  assert.equal(health.nodes.length, 1);
  assert.equal(health.links.length, 1);
  const env = filterGraphByDomain({ nodes, links }, 'environment');
  assert.equal(env.nodes.length, 0);
  assert.equal(env.links.length, 0);
});
