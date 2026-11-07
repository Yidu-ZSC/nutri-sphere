import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ENTRY_FOCUS_NONE,
  ENTRY_FOCUS_STORAGE_KEY,
  brightNodes,
  eligibleEntryFocusNodes,
  entryFocusDegree,
  entryFocusInsets,
  frameBright2d,
  frameBright3d,
  pickEntryFocusRoot,
  readEntryFocusStorage,
  resolveEntryFocusRoot,
  writeEntryFocusStorage,
  type EntryFocusNode,
} from './entryFocus.ts';

const mech = (id: string): EntryFocusNode => ({ id, type: 'mechanism' });
const other = (id: string): EntryFocusNode => ({ id, type: 'disease' });

function linksFor(degrees: Record<string, number>) {
  const links: { source: string; target: string }[] = [];
  let cursor = 0;
  for (const [id, degree] of Object.entries(degrees)) {
    for (let i = 0; i < degree; i += 1) {
      links.push({ source: id, target: `n${cursor}` });
      cursor += 1;
    }
  }
  return links;
}

test('eligible mechanisms honor the 3..12 degree band on the given graph', () => {
  const nodes = [mech('a'), mech('b'), mech('c'), mech('d'), mech('e'), other('x')];
  const links = linksFor({ a: 2, b: 3, c: 12, d: 13, e: 0, x: 5 });
  const eligible = eligibleEntryFocusNodes(nodes, links);
  assert.deepEqual(eligible, ['b', 'c']);
});

test('degree counts in+out and mechanism type is not depth', () => {
  const links = [
    { source: 'glycation', target: 'a' },
    { source: 'b', target: 'glycation' },
    { source: 'glycation', target: 'c' },
  ];
  assert.equal(entryFocusDegree('glycation', links), 3);
  const nodes: EntryFocusNode[] = [
    { id: 'glycation', type: 'mechanism' },
    { id: 'summary_node', type: 'mechanism' },
    { id: 'technical_node', type: 'mechanism' },
    { id: 'disease_node', type: 'disease' },
  ];
  const more = linksFor({ summary_node: 4, technical_node: 5, disease_node: 4 });
  const eligible = eligibleEntryFocusNodes(nodes, [...links, ...more]);
  assert.ok(eligible.includes('glycation'));
  assert.ok(eligible.includes('summary_node'));
  assert.ok(eligible.includes('technical_node'));
  assert.equal(eligible.includes('disease_node'), false);
});

test('degree 0, degree 1..2, and high-density hubs are excluded; empty is safe', () => {
  const nodes = [mech('zero'), mech('two'), mech('hub')];
  const eligible = eligibleEntryFocusNodes(nodes, linksFor({ zero: 0, two: 2, hub: 59 }));
  assert.deepEqual(eligible, []);
  assert.equal(pickEntryFocusRoot([], () => 0), null);
});

test('random pick is stable over sorted ids and honors injected rng', () => {
  const candidates = ['a', 'b', 'c'];
  assert.equal(pickEntryFocusRoot(candidates, () => 0), 'a');
  assert.equal(pickEntryFocusRoot(candidates, () => 0.999999), 'c');
  assert.equal(pickEntryFocusRoot(['only'], () => 0.5), 'only');
});

test('entry focus storage round-trips an id and the __none__ sentinel', () => {
  const store = new Map<string, string>();
  const fake = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };
  assert.equal(readEntryFocusStorage(fake), null);
  writeEntryFocusStorage('glycation', fake);
  assert.equal(store.get(ENTRY_FOCUS_STORAGE_KEY), 'glycation');
  assert.equal(readEntryFocusStorage(fake), 'glycation');
  writeEntryFocusStorage(ENTRY_FOCUS_NONE, fake);
  assert.equal(readEntryFocusStorage(fake), ENTRY_FOCUS_NONE);
});

test('resolution priority: node selection wins, link selection keeps no focus', () => {
  const base = {
    hasFilterContext: false,
    urlFocus: null,
    storedFocus: null,
    eligible: ['m1'],
    validNodeIds: new Set(['m1', 'n1']),
  };
  assert.deepEqual(resolveEntryFocusRoot({ ...base, selection: { kind: 'node', id: 'n1' } }), {
    focusRoot: 'n1',
    drewRandom: false,
  });
  assert.deepEqual(resolveEntryFocusRoot({ ...base, selection: { kind: 'link', index: 0 } }), {
    focusRoot: null,
    drewRandom: false,
  });
});

test('resolution priority: filter context, url focus, stored id, __none__, then random', () => {
  const base = {
    selection: null,
    urlFocus: null,
    storedFocus: null,
    eligible: ['m1', 'm2'],
    validNodeIds: new Set(['m1', 'm2', 'focus_x']),
  };
  assert.deepEqual(
    resolveEntryFocusRoot({ ...base, hasFilterContext: true }, () => 0),
    { focusRoot: null, drewRandom: false },
  );
  assert.deepEqual(
    resolveEntryFocusRoot({ ...base, hasFilterContext: false, urlFocus: 'focus_x' }, () => 0),
    { focusRoot: 'focus_x', drewRandom: false },
  );
  assert.deepEqual(
    resolveEntryFocusRoot({ ...base, hasFilterContext: false, storedFocus: 'm2' }, () => 0),
    { focusRoot: 'm2', drewRandom: false },
  );
  assert.deepEqual(
    resolveEntryFocusRoot({ ...base, hasFilterContext: false, storedFocus: ENTRY_FOCUS_NONE }, () => 0),
    { focusRoot: null, drewRandom: false },
  );
  assert.deepEqual(
    resolveEntryFocusRoot({ ...base, hasFilterContext: false }, () => 0),
    { focusRoot: 'm1', drewRandom: true },
  );
});

test('a valid url focus outranks a stored __none__ sentinel', () => {
  assert.equal(
    resolveEntryFocusRoot({
      hasFilterContext: false,
      selection: null,
      urlFocus: 'focus_x',
      storedFocus: ENTRY_FOCUS_NONE,
      eligible: [],
      validNodeIds: new Set(['focus_x']),
    }).focusRoot,
    'focus_x',
  );
});

test('HUD insets react to mobile, legend, banner, and detail overlay', () => {
  const desktop = entryFocusInsets({ mobile: false, legendExpanded: false, focusBanner: false, detailOverlay: false });
  const banner = entryFocusInsets({ mobile: false, legendExpanded: false, focusBanner: true, detailOverlay: false });
  const legend = entryFocusInsets({ mobile: false, legendExpanded: true, focusBanner: false, detailOverlay: false });
  const overlay = entryFocusInsets({ mobile: false, legendExpanded: false, focusBanner: false, detailOverlay: true });
  const mobile = entryFocusInsets({ mobile: true, legendExpanded: false, focusBanner: false, detailOverlay: false });
  assert.ok(banner.top > desktop.top);
  assert.ok(legend.bottom > desktop.bottom);
  assert.ok(overlay.right > desktop.right);
  assert.ok(mobile.top > desktop.top);
  assert.ok(mobile.left > desktop.left);
  for (const insets of [desktop, banner, legend, overlay, mobile]) {
    assert.ok(insets.top >= 0 && insets.right >= 0 && insets.bottom >= 0 && insets.left >= 0);
  }
});

test('2D bright fit shrinks when the HUD eats more of the viewport', () => {
  const nodes = [
    { x: 0, y: 0 },
    { x: 60, y: 40 },
  ];
  const roomy = frameBright2d(nodes, 400, 800, { top: 0, right: 0, bottom: 0, left: 0 });
  const crowded = frameBright2d(nodes, 400, 800, { top: 120, right: 60, bottom: 120, left: 60 });
  assert.ok(crowded.k < roomy.k);
  assert.equal(frameBright2d([], 400, 800, { top: 0, right: 0, bottom: 0, left: 0 }).k, 0.5);
});

test('3D bright fit reduces the usable viewport by insets', () => {
  const nodes = [
    { x: 0, y: 0 },
    { x: 60, y: 40 },
  ];
  const roomy = frameBright3d(nodes, 800, 600, { top: 0, right: 0, bottom: 0, left: 0 });
  const crowded = frameBright3d(nodes, 800, 600, { top: 0, right: 300, bottom: 0, left: 300 });
  assert.ok(crowded.z > roomy.z);
});

test('brightNodes falls back to all nodes when the focus set is empty', () => {
  const nodes = [{ id: 'a' }, { id: 'b' }];
  assert.equal(brightNodes(nodes, null).length, 2);
  assert.equal(brightNodes(nodes, new Set(['a'])).length, 1);
  assert.equal(brightNodes(nodes, new Set(['missing'])).length, 2);
});
