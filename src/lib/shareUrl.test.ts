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
    food: null,
    patterns: [],
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
    food: null,
    patterns: [],
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
  assert.match(query, /hide=0/);
  assert.equal(parseViewQuery(query).hideUnmatched, false);
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
    food: null,
    patterns: [],
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
  assert.equal(home.includes('hide='), false);
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
    food: null,
    patterns: [],
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
  assert.deepEqual(filtersFromShare(parsed), { disease: 'fatty_liver', mechanism: null, food: null });
  const themeOnly = parseViewQuery('?theme=gut-barrier');
  assert.equal(themeOnly.theme, 'gut-barrier');
  assert.equal(resolveScreen(themeOnly), 'explore');
  assert.deepEqual(filtersFromShare(themeOnly), { disease: null, mechanism: 'gut_barrier_leak', food: null });
  assert.equal(themeById('not_a_theme'), null);
  assert.equal(resolveScreen(parseViewQuery('?theme=not_a_theme')), 'home');
  assert.deepEqual(filtersFromShare(parseViewQuery('?theme=../etc')), {
    disease: null,
    mechanism: null,
    food: null,
  });
  assert.equal(resolveScreen(parseViewQuery('?screen=home&disease=fatty_liver')), 'home');
  assert.equal(parseViewQuery('?screen=atlas').screen, null);
});

test('hide=1 stays on and hide=0 stays off', () => {
  assert.equal(parseViewQuery('?screen=explore&theme=fatty_liver&hide=1').hideUnmatched, true);
  const off = parseViewQuery('?screen=explore&theme=fatty_liver&hide=0');
  assert.equal(off.hideUnmatched, false);
  assert.equal(off.theme, 'fatty_liver');
  const serialized = serializeViewQuery({
    screen: 'explore',
    theme: 'fatty_liver',
    disease: 'fatty_liver',
    mechanism: null,
    food: null,
    patterns: [],
    layer: 'layperson',
    layout: 'hierarchy',
    view: '2d',
    hideUnmatched: false,
    node: null,
    link: null,
  });
  assert.match(serialized, /hide=0/);
  assert.equal(parseViewQuery(serialized).hideUnmatched, false);
});

test('omitted hide defaults on only for explore with a theme anchor', () => {
  assert.equal(parseViewQuery('?screen=explore&theme=fatty_liver&layer=layperson').hideUnmatched, true);
  assert.equal(parseViewQuery('?theme=gut-barrier').hideUnmatched, true);
  assert.equal(parseViewQuery('?disease=cardiometabolic').hideUnmatched, true);
  assert.equal(parseViewQuery('?mechanism=chronic_inflammation').hideUnmatched, true);
  assert.equal(parseViewQuery('?screen=explore&node=soy').hideUnmatched, false);
  assert.equal(parseViewQuery('?screen=explore&link=gut_barrier_leak~lps').hideUnmatched, false);
  assert.equal(parseViewQuery('?screen=home').hideUnmatched, false);
  assert.equal(parseViewQuery('?screen=home&disease=fatty_liver').hideUnmatched, false);
  assert.equal(parseViewQuery('?theme=not_a_theme').hideUnmatched, false);
  assert.equal(parseViewQuery('?disease=cardiometabolic&hide=0').hideUnmatched, false);
  assert.equal(parseViewQuery('?hide=1').hideUnmatched, true);
});

test('legacy share links stay free of food and pattern params', () => {
  const legacy = [
    '',
    '?layer=expert',
    '?disease=cardiometabolic&layer=expert',
    '?node=soy',
    '?link=gut_barrier_leak~lps',
    '?mechanism=chronic_inflammation',
    '?theme=gut-barrier',
    '?theme=fatty_liver&hide=0',
    '?screen=home&disease=fatty_liver',
    '?screen=explore&theme=fatty_liver&layer=layperson',
    '?layout=force&view=2d',
    '?view=table&layer=layperson',
    '?hide=1',
    '?disease=cardiometabolic&hide=0',
    '?screen=explore&node=soy',
    '?screen=home',
  ];
  for (const query of legacy) {
    const parsed = parseViewQuery(query);
    assert.equal(parsed.food, null, query);
    assert.deepEqual(parsed.patterns, [], query);
  }
  const fatty = parseViewQuery('?theme=fatty_liver');
  assert.equal(resolveScreen(fatty), 'explore');
  assert.equal(fatty.hideUnmatched, true);
  assert.deepEqual(filtersFromShare(fatty), { disease: 'fatty_liver', mechanism: null, food: null });
  const homeDisease = parseViewQuery('?screen=home&disease=fatty_liver');
  assert.equal(resolveScreen(homeDisease), 'home');
  assert.equal(homeDisease.hideUnmatched, false);
  assert.deepEqual(filtersFromShare(homeDisease), { disease: 'fatty_liver', mechanism: null, food: null });
});

test('food themes serialize a food anchor and default hide on', () => {
  const query = serializeViewQuery({
    screen: 'explore',
    theme: 'ultra-processed',
    disease: null,
    mechanism: null,
    food: 'ultra_processed',
    patterns: ['mediterranean'],
    layer: 'layperson',
    layout: 'hierarchy',
    view: '2d',
    hideUnmatched: true,
    node: null,
    link: null,
  });
  assert.match(query, /theme=ultra-processed/);
  assert.match(query, /food=ultra_processed/);
  assert.match(query, /hide=1/);
  assert.equal(query.includes('patterns='), false);
  const parsed = parseViewQuery(query);
  assert.equal(parsed.food, 'ultra_processed');
  assert.deepEqual(parsed.patterns, []);
  assert.deepEqual(filtersFromShare(parsed), { disease: null, mechanism: null, food: 'ultra_processed' });
  assert.equal(parseViewQuery('?theme=ultra-processed').hideUnmatched, true);
  assert.equal(parseViewQuery('?food=ultra_processed').hideUnmatched, true);
  assert.equal(resolveScreen(parseViewQuery('?food=ultra_processed')), 'explore');
  assert.equal(parseViewQuery('?screen=explore&food=dietary_fiber&hide=0').hideUnmatched, false);
  assert.deepEqual(filtersFromShare(parseViewQuery('?food=plant_based_diet&theme=fatty_liver')), {
    disease: null,
    mechanism: null,
    food: 'plant_based_diet',
  });
  assert.deepEqual(filtersFromShare(parseViewQuery('?theme=dietary-fiber')), {
    disease: null,
    mechanism: null,
    food: 'dietary_fiber',
  });
  assert.equal(parseViewQuery('?food=../etc').food, null);
});

test('home pattern links keep the source theme and drop unknown ids', () => {
  const parsed = parseViewQuery(
    '?screen=home&layer=layperson&theme=cardiometabolic&patterns=foo,mediterranean,dash,mediterranean',
  );
  assert.equal(resolveScreen(parsed), 'home');
  assert.equal(parsed.hideUnmatched, false);
  assert.equal(parsed.theme, 'cardiometabolic');
  assert.deepEqual(parsed.patterns, ['mediterranean', 'dash']);
  const query = serializeViewQuery({
    screen: 'home',
    theme: parsed.theme,
    disease: 'cardiometabolic',
    mechanism: null,
    food: null,
    patterns: parsed.patterns,
    layer: 'layperson',
    layout: 'hierarchy',
    view: '2d',
    hideUnmatched: true,
    node: 'soy',
    link: null,
  });
  assert.equal(query.includes('hide='), false);
  assert.equal(query.includes('disease='), false);
  assert.equal(query.includes('node='), false);
  assert.match(query, /screen=home/);
  assert.match(query, /theme=cardiometabolic/);
  assert.match(query, /patterns=mediterranean,dash/);
  assert.deepEqual(parseViewQuery('?screen=home&patterns=foo,dash').patterns, ['dash']);
  assert.equal(parseViewQuery('?screen=home&theme=cardiometabolic&patterns=nope').patterns.length, 0);
});
