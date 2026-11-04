import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('ViewLayer runtime files are gone', () => {
  const root = new URL('..', import.meta.url);
  assert.equal(fs.existsSync(new URL('components/ViewLayerToggle.tsx', root)), false);
  assert.equal(fs.existsSync(new URL('lib/viewLayer.ts', root)), false);
  const graph = fs.readFileSync(new URL('types/graph.ts', root), 'utf8');
  assert.equal(/export type ViewLayer/.test(graph), false);
  assert.equal(/VIEW_LAYERS/.test(graph), false);
});

test('App no longer mounts ViewLayerToggle or layer hints', () => {
  const app = fs.readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
  assert.equal(app.includes('ViewLayerToggle'), false);
  assert.equal(app.includes('layer-hint'), false);
  assert.equal(app.includes('layperson-empty'), false);
  assert.equal(app.includes('switch-expert'), false);
  assert.equal(app.includes('setLayer'), false);
});
