import assert from 'node:assert/strict';
import test from 'node:test';
import { findLinkIndex, parseViewQuery, resolveScreen, serializeViewQuery } from './shareUrl.ts';
import { filtersFromShare, themeById } from './themes.ts';

test('serialize never emits layer=; parse ignores legacy layer=', () => {
  const query = serializeViewQuery({
    screen: 'explore',
    theme: 'fatty_liver',
    disease: 'fatty_liver',
    mechanism: null,
    food: null,
    pattern: null,
    patterns: [],
    source: null,
    layout: 'hierarchy',
    view: '2d',
    hideUnmatched: true,
    node: null,
    link: null,
  });
  assert.equal(query.includes('layer='), false);
  const withLegacy = parseViewQuery(query + '&layer=expert');
  assert.equal('layer' in withLegacy, false);
  assert.equal(resolveScreen(withLegacy), 'explore');
});


test('share query round-trips the minimal filters', () => {
  const query = serializeViewQuery({
    screen: 'explore',
    theme: null,
    disease: 'cardiometabolic',
    mechanism: 'chronic_inflammation',
    food: null,
    pattern: null,
    patterns: [],
    source: null,
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
    pattern: null,
    patterns: [],
    source: null,
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
  assert.equal(resolveScreen(parsed), 'home');
  assert.equal(parseViewQuery('?screen=explore&view=flow').view, 'flow');
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
    pattern: null,
    patterns: [],
    source: null,
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

test('legacy ?layer= is ignored and does not restore a mode', () => {
  const parsed = parseViewQuery('?layer=expert');
  assert.equal(parsed.view, null);
  assert.equal(parsed.screen, null);
  assert.equal(resolveScreen(parsed), 'home');
  assert.equal('layer' in parsed, false);
  assert.equal(resolveScreen(parseViewQuery('?layer=glance')), 'home');
  assert.equal(resolveScreen(parseViewQuery('?layer=layperson')), 'home');
});

test('legacy disease, node, and link deep links infer explore', () => {
  const disease = parseViewQuery('?disease=cardiometabolic&layer=expert');
  assert.equal(disease.disease, 'cardiometabolic');
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
    pattern: null,
    patterns: [],
    source: null,
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
    pattern: null,
    patterns: [],
    source: null,
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
    pattern: null,
    patterns: ['plant_forward'],
    source: null,
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
    '?screen=home&theme=cardiometabolic&patterns=foo,plant_forward,lacto_ovo,plant_forward',
  );
  assert.equal(resolveScreen(parsed), 'home');
  assert.equal(parsed.hideUnmatched, false);
  assert.equal(parsed.theme, 'cardiometabolic');
  assert.deepEqual(parsed.patterns, ['plant_forward', 'lacto_ovo']);
  const query = serializeViewQuery({
    screen: 'home',
    theme: parsed.theme,
    disease: 'cardiometabolic',
    mechanism: null,
    food: null,
    pattern: null,
    patterns: parsed.patterns,
    source: null,
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
  assert.match(query, /patterns=plant_forward,lacto_ovo/);
  assert.deepEqual(parseViewQuery('?screen=home&patterns=foo,lacto_ovo').patterns, ['lacto_ovo']);
  assert.equal(parseViewQuery('?screen=home&theme=cardiometabolic&patterns=nope').patterns.length, 0);
});

function shareState(partial: Partial<import('./shareUrl.ts').ShareState> & { screen: import('./shareUrl.ts').ShareState['screen'] }): import('./shareUrl.ts').ShareState {
  return {
    theme: null,
    disease: null,
    mechanism: null,
    food: null,
    pattern: null,
    patterns: [],
    source: null,
    book: null,
    adminSection: 'books',
    edge: null,
    layout: 'hierarchy',
    view: '2d',
    hideUnmatched: false,
    node: null,
    link: null,
    ...partial,
  };
}

test('lens opens explore with hide on by default and supersedes theme anchors', () => {
  const parsed = parseViewQuery('?lens=animal_foods');
  assert.equal(parsed.lens, 'animal_foods');
  assert.equal(parsed.hideUnmatched, true);
  assert.equal(resolveScreen(parsed), 'explore');
  assert.deepEqual(filtersFromShare(parsed), { disease: null, mechanism: null, food: null });

  const mixed = parseViewQuery('?lens=plant_based_diet&theme=fatty_liver&disease=cardiometabolic');
  assert.equal(mixed.lens, 'plant_based_diet');
  assert.deepEqual(filtersFromShare(mixed), { disease: null, mechanism: null, food: null });
  assert.equal(parseViewQuery('?lens=animal_foods&hide=0').hideUnmatched, false);
  assert.equal(parseViewQuery('?lens=../etc').lens, null);
});

test('serializing a lens omits theme and filter anchors', () => {
  const query = serializeViewQuery(
    shareState({
      screen: 'explore',
      lens: 'animal_foods',
      theme: 'fatty_liver',
      disease: 'fatty_liver',
      mechanism: 'chronic_inflammation',
      food: 'ultra_processed',
      hideUnmatched: true,
      node: 'animal_foods',
    }),
  );
  assert.match(query, /lens=animal_foods/);
  assert.match(query, /node=animal_foods/);
  assert.match(query, /hide=1/);
  assert.equal(query.includes('theme='), false);
  assert.equal(query.includes('disease='), false);
  assert.equal(query.includes('mechanism='), false);
  assert.equal(query.includes('food='), false);
});

test('pattern and compare screens serialize only screen and pattern', () => {
  const patternQuery = serializeViewQuery(
    shareState({
      screen: 'pattern',
      pattern: 'plant_forward',
      theme: 'cardiometabolic',
      disease: 'cardiometabolic',
      food: 'ultra_processed',
      patterns: ['lacto_ovo'],
      view: '3d',
      layout: 'force',
      hideUnmatched: true,
      node: 'soy',
      link: 'soy~angiogenesis_defense',
    }),
  );
  assert.equal(patternQuery, '?screen=pattern&pattern=vegan_diet');
  const parsed = parseViewQuery(patternQuery);
  assert.equal(parsed.screen, 'pattern');
  assert.equal(parsed.pattern, 'vegan_diet');
    assert.equal(parsed.hideUnmatched, false);
  assert.equal(parsed.disease, null);
  assert.equal(parsed.node, null);
  assert.deepEqual(parsed.patterns, []);
  assert.equal(resolveScreen(parsed), 'pattern');

  const compareQuery = serializeViewQuery(
    shareState({
      screen: 'compare',
      pattern: 'lacto_ovo',
      patterns: ['plant_forward'],
      theme: 'cardiometabolic',
      hideUnmatched: true,
      disease: 'cardiometabolic',
    }),
  );
  assert.equal(compareQuery, '?screen=pattern&pattern=vegan_diet');
  const compare = parseViewQuery(compareQuery);
  assert.equal(resolveScreen(compare), 'pattern');
  assert.equal(compare.pattern, 'vegan_diet');
  assert.equal(compare.hideUnmatched, false);
  assert.equal(compare.disease, null);
});

test('pattern links open a detail only without explore anchors', () => {
  assert.equal(resolveScreen(parseViewQuery('?pattern=plant_forward')), 'pattern');
  assert.equal(parseViewQuery('?pattern=plant_forward').pattern, 'vegan_diet');
  assert.equal(parseViewQuery('?pattern=plant_forward').hideUnmatched, false);
  assert.equal(parseViewQuery('?pattern=plant_forward&hide=1').hideUnmatched, false);
  assert.equal(resolveScreen(parseViewQuery('?screen=pattern&pattern=lacto_ovo')), 'pattern');
  assert.equal(resolveScreen(parseViewQuery('?pattern=mediterranean')), 'home');
  assert.equal(parseViewQuery('?pattern=mediterranean').pattern, null);
  assert.equal(resolveScreen(parseViewQuery('?screen=pattern&pattern=dash')), 'home');
  assert.equal(resolveScreen(parseViewQuery('?screen=pattern&pattern=nope')), 'home');
  assert.equal(resolveScreen(parseViewQuery('?screen=pattern')), 'home');
  assert.equal(parseViewQuery('?pattern=nope').pattern, null);
  assert.equal(parseViewQuery('?pattern=../lacto_ovo').pattern, null);
  assert.equal(resolveScreen(parseViewQuery('?pattern=NOT')), 'home');
  assert.equal(resolveScreen(parseViewQuery('?pattern=plant_forward&disease=cardiometabolic')), 'explore');
  assert.equal(resolveScreen(parseViewQuery('?pattern=plant_forward&theme=cardiometabolic')), 'explore');
  assert.equal(resolveScreen(parseViewQuery('?pattern=plant_forward&food=ultra_processed')), 'explore');
  assert.equal(resolveScreen(parseViewQuery('?pattern=plant_forward&node=soy')), 'explore');
  assert.equal(resolveScreen(parseViewQuery('?pattern=plant_forward&mechanism=chronic_inflammation')), 'explore');
  assert.equal(resolveScreen(parseViewQuery('?screen=compare&pattern=lacto_ovo&hide=1')), 'pattern');
  assert.equal(parseViewQuery('?screen=compare&hide=1').pattern, 'vegan_diet');
  assert.equal(parseViewQuery('?screen=compare&hide=1').hideUnmatched, false);
  assert.equal(parseViewQuery('?screen=pattern&pattern=lacto_ovo&hide=1&disease=cardiometabolic').hideUnmatched, false);
  assert.equal(parseViewQuery('?screen=pattern&pattern=lacto_ovo&disease=cardiometabolic').disease, 'cardiometabolic');
  const home = serializeViewQuery(
    shareState({
      screen: 'home',
      pattern: 'lacto_ovo',
      patterns: ['lacto_ovo'],
      theme: 'cardiometabolic',
      hideUnmatched: true,
      disease: 'cardiometabolic',
    }),
  );
  assert.equal(/(^|[?&])pattern=/.test(home), false);
  assert.match(home, /patterns=lacto_ovo/);
  assert.match(home, /screen=home/);
  assert.equal(home.includes('hide='), false);
  const explore = serializeViewQuery(
    shareState({
      screen: 'explore',
      pattern: 'lacto_ovo',
      theme: 'fatty_liver',
      disease: 'fatty_liver',
      hideUnmatched: true,
    }),
  );
  assert.equal(/(^|[?&])pattern=/.test(explore), false);
  assert.match(explore, /screen=explore/);
  assert.match(explore, /hide=1/);
  assert.equal(resolveScreen(parseViewQuery('?screen=home&patterns=plant_forward,lacto_ovo')), 'home');
  assert.deepEqual(parseViewQuery('?screen=home&patterns=plant_forward,lacto_ovo').patterns, [
    'plant_forward',
    'lacto_ovo',
  ]);
});

test('twin screen is explicit and does not carry explore anchors', () => {
  const parsed = parseViewQuery('?screen=twin&layer=expert&node=soy&theme=plant-based&hide=1&disease=cardiometabolic');
  assert.equal(parsed.screen, 'twin');
  assert.equal(resolveScreen(parsed), 'twin');
    assert.equal(parsed.hideUnmatched, false);
  assert.equal(parsed.node, 'soy');
  const query = serializeViewQuery(
    shareState({
      screen: 'twin',
      theme: 'plant-based',
      disease: 'cardiometabolic',
      food: 'ultra_processed',
      pattern: 'lacto_ovo',
      patterns: ['lacto_ovo'],
      hideUnmatched: true,
      node: 'plant_based_diet',
      link: 'soy~angiogenesis_defense',
      view: '3d',
      layout: 'force',
    }),
  );
  assert.equal(query, '?screen=twin');
  assert.equal(resolveScreen(parseViewQuery(query)), 'twin');
  assert.equal(parseViewQuery('?screen=twin').hideUnmatched, false);
  assert.equal(resolveScreen(parseViewQuery('?screen=twin&pattern=plant_forward')), 'twin');
});


test('source screen round-trips and unknown source falls back to home', () => {
  const query = serializeViewQuery({
    screen: 'source',
    theme: null,
    disease: null,
    mechanism: null,
    food: null,
    pattern: null,
    patterns: [],
    source: 'china_study',
    layout: 'hierarchy',
    view: '2d',
    hideUnmatched: false,
    node: null,
    link: null,
  });
  assert.match(query, /screen=source/);
  assert.match(query, /source=china_study/);
  const parsed = parseViewQuery(query);
  assert.equal(parsed.screen, 'source');
  assert.equal(parsed.source, 'china_study');
  assert.equal(resolveScreen(parsed), 'source');

  const missing = parseViewQuery('?screen=source');
  assert.equal(missing.screen, 'source');
  assert.equal(missing.source, null);
  assert.equal(resolveScreen(missing), 'home');

  const bad = parseViewQuery('?screen=source&source=../etc');
  assert.equal(bad.source, null);
  assert.equal(resolveScreen(bad), 'home');
});

test('admin screen round-trips list and book detail; invalid book id stripped at parse', () => {
  const list = serializeViewQuery(
    shareState({
      screen: 'admin',
      theme: 'fatty_liver',
      disease: 'fatty_liver',
      hideUnmatched: true,
      node: 'soy',
      link: 'soy~angiogenesis_defense',
      view: '3d',
      layout: 'force',
    }),
  );
  assert.equal(list, '?screen=admin');
  assert.equal(resolveScreen(parseViewQuery(list)), 'admin');
  assert.equal(parseViewQuery(list).book, null);
  assert.equal(parseViewQuery(list).hideUnmatched, false);

  const detail = serializeViewQuery(shareState({ screen: 'admin', book: 'eat_to_heal' }));
  assert.equal(detail, '?screen=admin&book=eat_to_heal');
  const parsed = parseViewQuery(detail);
  assert.equal(parsed.screen, 'admin');
  assert.equal(parsed.book, 'eat_to_heal');
  assert.equal(resolveScreen(parsed), 'admin');

  const bad = parseViewQuery('?screen=admin&book=../etc');
  assert.equal(bad.screen, 'admin');
  assert.equal(bad.book, null);
  assert.equal(resolveScreen(bad), 'admin');

  const edges = serializeViewQuery(
    shareState({ screen: 'admin', adminSection: 'edges', edge: 'insulin_resistance~cardiometabolic', book: 'eat_to_heal' }),
  );
  assert.equal(edges, '?screen=admin&section=edges&edge=insulin_resistance%7Ecardiometabolic');
  const edgesParsed = parseViewQuery(edges);
  assert.equal(edgesParsed.adminSection, 'edges');
  assert.equal(edgesParsed.edge, 'insulin_resistance~cardiometabolic');
  assert.equal(edgesParsed.book, null);

  const nodes = serializeViewQuery(
    shareState({ screen: 'admin', adminSection: 'nodes', node: 'insulin_resistance' }),
  );
  assert.equal(nodes, '?screen=admin&section=nodes&node=insulin_resistance');

  assert.equal(
    serializeViewQuery(shareState({ screen: 'admin', adminSection: 'validate' })),
    '?screen=admin&section=validate',
  );
  assert.equal(
    serializeViewQuery(shareState({ screen: 'admin', adminSection: 'settings' })),
    '?screen=admin&section=settings',
  );
  assert.equal(
    serializeViewQuery(shareState({ screen: 'admin', adminSection: 'candidates' })),
    '?screen=admin&section=candidates',
  );
  assert.equal(
    serializeViewQuery(
      shareState({ screen: 'admin', adminSection: 'candidates', book: 'china_study' }),
    ),
    '?screen=admin&section=candidates&book=china_study',
  );
  assert.equal(parseViewQuery('?screen=admin&section=candidates&book=china_study').adminSection, 'candidates');
  assert.equal(parseViewQuery('?screen=admin&section=candidates&book=china_study').book, 'china_study');
  assert.equal(parseViewQuery('?screen=admin&section=nope').adminSection, null);
  assert.equal(parseViewQuery('?screen=admin&edge=bad').edge, null);
});

test('domain query defaults to health; illegal → health; omits health on serialize', () => {
  assert.equal(parseViewQuery('').domain, 'health');
  assert.equal(parseViewQuery('?domain=nutrition').domain, 'health');
  assert.equal(parseViewQuery('?domain=environment').domain, 'environment');
  assert.equal(parseViewQuery('?domain=culture&screen=explore').domain, 'culture');
  assert.equal(parseViewQuery('?screen=explore&domain=environment').domain, 'environment');

  const health = serializeViewQuery({
    screen: 'home',
    domain: 'health',
    theme: null,
    disease: null,
    mechanism: null,
    food: null,
    pattern: null,
    patterns: [],
    source: null,
    layout: 'hierarchy',
    view: '2d',
    hideUnmatched: false,
    node: null,
    link: null,
  });
  assert.equal(health.includes('domain='), false);

  const env = serializeViewQuery({
    screen: 'explore',
    domain: 'environment',
    theme: null,
    disease: null,
    mechanism: null,
    food: null,
    pattern: null,
    patterns: [],
    source: null,
    layout: 'hierarchy',
    view: '2d',
    hideUnmatched: false,
    node: null,
    link: null,
  });
  assert.match(env, /domain=environment/);
  assert.match(env, /screen=explore/);
  assert.equal(parseViewQuery(env).domain, 'environment');

  const twin = serializeViewQuery({
    screen: 'twin',
    domain: 'culture',
    theme: null,
    disease: null,
    mechanism: null,
    food: null,
    pattern: null,
    patterns: [],
    source: null,
    layout: 'hierarchy',
    view: '2d',
    hideUnmatched: false,
    node: null,
    link: null,
  });
  assert.match(twin, /domain=culture/);
  assert.match(twin, /screen=twin/);
});
