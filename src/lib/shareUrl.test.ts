import assert from 'node:assert/strict';
import test from 'node:test';
import { findLinkIndex, parseViewQuery, resolveScreen, serializeViewQuery } from './shareUrl.ts';
import { filtersFromShare, themeById } from './themes.ts';

test('share query round-trips the minimal filters', () => {
  const query = serializeViewQuery({
    screen: 'explore',
    theme: null,
    disease: 'cardiometabolic',
    mechanism: 'chronic_inflammation',
    layer: 'expert',
    layout: 'hierarchy',
    view: '2d',
    hideUnmatched: true,
    node: 'dietary_fiber',
    link: null,
  });
  const parsed = parseViewQuery(query);
  assert.equal(parsed.screen, 'explore');
  assert.equal(parsed.theme, null);
  assert.equal(parsed.disease, 'cardiometabolic');
  assert.equal(parsed.mechanism, 'chronic_inflammation');
  assert.equal(parsed.layer, 'expert');
  assert.equal(parsed.layout, null);
  assert.equal(parsed.view, '2d');
  assert.equal(parsed.hideUnmatched, true);
  assert.equal(parsed.node, 'dietary_fiber');
  assert.equal(query.includes('layout='), false);
  assert.match(query, /view=2d/);
  assert.equal(query.includes('view=home'), false);
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
    screen: 'explore',
    theme: null,
    disease: null,
    mechanism: null,
    layer: 'layperson',
    layout: 'force',
    view: '3d',
    hideUnmatched: false,
    node: 'soy',
    link: 'soy~angiogenesis_defense',
  });
  assert.equal(parseViewQuery(query).node, 'soy');
  assert.equal(parseViewQuery(query).link, null);
  assert.match(query, /layout=force/);
  assert.match(query, /view=3d/);
});

test('unknown view values are dropped', () => {
  const parsed = parseViewQuery('?view=table&layer=layperson');
  assert.equal(parsed.view, null);
  assert.equal(parsed.layer, 'layperson');
  assert.equal(resolveScreen(parsed), 'home');
});

test('default screen is home when the query has no deep link', () => {
  const parsed = parseViewQuery('');
  assert.equal(parsed.screen, null);
  assert.equal(parsed.theme, null);
  assert.equal(resolveScreen(parsed), 'home');
  const home = serializeViewQuery({
    screen: 'home',
    theme: 'fatty_liver',
    disease: 'fatty_liver',
    mechanism: null,
    layer: 'layperson',
    layout: 'hierarchy',
    view: '2d',
    hideUnmatched: true,
    node: null,
    link: null,
  });
  assert.match(home, /screen=home/);
  assert.equal(home.includes('theme='), false);
  assert.equal(home.includes('disease='), false);
  assert.equal(home.includes('view='), false);
  assert.equal(resolveScreen(parseViewQuery(home)), 'home');
});

test('legacy layer=expert stays on layperson/expert and does not open the graph', () => {
  const parsed = parseViewQuery('?layer=expert');
  assert.equal(parsed.layer, 'expert');
  assert.equal(parsed.view, null);
  assert.equal(parsed.screen, null);
  assert.equal(resolveScreen(parsed), 'home');
  assert.equal(parseViewQuery('?layer=glance').layer, null);
});

test('legacy disease, node, and link deep links infer explore', () => {
  const disease = parseViewQuery('?disease=cardiometabolic&layer=expert');
  assert.equal(disease.disease, 'cardiometabolic');
  assert.equal(disease.layer, 'expert');
  assert.equal(disease.screen, null);
  assert.equal(disease.view, null);
  assert.equal(resolveScreen(disease), 'explore');
  assert.equal(resolveScreen(parseViewQuery('?node=soy')), 'explore');
  assert.equal(resolveScreen(parseViewQuery('?link=gut_barrier_leak~lps')), 'explore');
  assert.equal(resolveScreen(parseViewQuery('?mechanism=chronic_inflammation')), 'explore');
});

test('theme maps to a disease or mechanism filter and does not reuse view', () => {
  const query = serializeViewQuery({
    screen: 'explore',
    theme: 'fatty_liver',
    disease: 'fatty_liver',
    mechanism: null,
    layer: 'layperson',
    layout: 'hierarchy',
    view: '2d',
    hideUnmatched: true,
    node: null,
    link: null,
  });
  const parsed = parseViewQuery(query);
  assert.equal(parsed.screen, 'explore');
  assert.equal(parsed.theme, 'fatty_liver');
  assert.equal(parsed.view, '2d');
  assert.equal(resolveScreen(parsed), 'explore');
  assert.deepEqual(filtersFromShare(parsed), { disease: 'fatty_liver', mechanism: null });
  const themeOnly = parseViewQuery('?theme=gut-barrier');
  assert.equal(themeOnly.theme, 'gut-barrier');
  assert.equal(resolveScreen(themeOnly), 'explore');
  assert.deepEqual(filtersFromShare(themeOnly), { disease: null, mechanism: 'gut_barrier_leak' });
  assert.equal(themeById('not_a_theme'), null);
  assert.equal(resolveScreen(parseViewQuery('?theme=not_a_theme')), 'home');
  assert.deepEqual(filtersFromShare(parseViewQuery('?theme=../etc')), {
    disease: null,
    mechanism: null,
  });
  assert.equal(resolveScreen(parseViewQuery('?screen=home&disease=fatty_liver')), 'home');
  assert.equal(parseViewQuery('?screen=atlas').screen, null);
});
