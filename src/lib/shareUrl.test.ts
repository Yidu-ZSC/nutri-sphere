import assert from 'node:assert/strict';
import test from 'node:test';
import { findLinkIndex, parseViewQuery, serializeViewQuery } from './shareUrl.ts';

test('share query round-trips the minimal filters', () => {
  const query = serializeViewQuery({
    disease: 'cardiometabolic',
    mechanism: 'chronic_inflammation',
    layer: 'expert',
    layout: 'hierarchy',
    hideUnmatched: true,
    node: 'dietary_fiber',
    link: null,
  });
  const parsed = parseViewQuery(query);
  assert.equal(parsed.disease, 'cardiometabolic');
  assert.equal(parsed.mechanism, 'chronic_inflammation');
  assert.equal(parsed.layer, 'expert');
  assert.equal(parsed.layout, null);
  assert.equal(parsed.hideUnmatched, true);
  assert.equal(parsed.node, 'dietary_fiber');
  assert.equal(query.includes('layout='), false);
});

test('force layout is explicit and bad ids are dropped', () => {
  const parsed = parseViewQuery('?layout=force&disease=../etc&layer=nope&link=gut_barrier_leak~lps');
  assert.equal(parsed.layout, 'force');
  assert.equal(parsed.disease, null);
  assert.equal(parsed.layer, null);
  assert.equal(parsed.link, 'gut_barrier_leak~lps');
  assert.equal(findLinkIndex([{ source: 'gut_barrier_leak', target: 'lps' }], parsed.link), 0);
  assert.equal(findLinkIndex([{ source: 'a', target: 'b' }], parsed.link), null);
});

test('a node selection wins over a link in the serialized query', () => {
  const query = serializeViewQuery({
    disease: null,
    mechanism: null,
    layer: 'layperson',
    layout: 'force',
    hideUnmatched: false,
    node: 'soy',
    link: 'soy~angiogenesis_defense',
  });
  assert.equal(parseViewQuery(query).node, 'soy');
  assert.equal(parseViewQuery(query).link, null);
  assert.match(query, /layout=force/);
});
