import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ALIGNED_SEED, GRAPH_SCHEMA, validateGraphData, validateGraphFile } from './validate-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

test('aligned seed passes schema and referential checks', () => {
  const result = validateGraphFile();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.counts.nodes, 24);
  assert.equal(result.counts.links, 20);
});

test('a broken link target fails validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  data.links[0].target = 'does_not_exist';
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /does_not_exist/);
});

test('duplicate node ids fail validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  data.nodes.push({ ...data.nodes[0] });
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /重复/);
});

test('missing limitations fail validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  delete data.links[1].limitations;
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /limitations/);
});
