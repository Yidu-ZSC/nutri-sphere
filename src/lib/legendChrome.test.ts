import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  LEGEND_EXPANDED_KEY,
  readLegendExpanded,
  writeLegendExpanded,
} from './legendChrome.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('legend expand sessionStorage key and read/write semantics', () => {
  assert.equal(LEGEND_EXPANDED_KEY, 'cleardiet.legendExpanded');

  const store = new Map<string, string>();
  const fake = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };

  assert.equal(readLegendExpanded(fake), false);
  fake.setItem(LEGEND_EXPANDED_KEY, '0');
  assert.equal(readLegendExpanded(fake), false);
  fake.setItem(LEGEND_EXPANDED_KEY, 'nope');
  assert.equal(readLegendExpanded(fake), false);
  writeLegendExpanded(true, fake);
  assert.equal(store.get(LEGEND_EXPANDED_KEY), '1');
  assert.equal(readLegendExpanded(fake), true);
  writeLegendExpanded(false, fake);
  assert.equal(store.get(LEGEND_EXPANDED_KEY), '0');
  assert.equal(readLegendExpanded(fake), false);
});

test('Legend compact collapse wiring and desktop always-open', () => {
  const legend = fs.readFileSync(path.join(root, 'src/components/Legend.tsx'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');

  assert.match(legend, /cleardiet\.legendExpanded|LEGEND_EXPANDED_KEY|readLegendExpanded/);
  assert.match(legend, /data-testid="legend-toggle"/);
  assert.match(legend, /aria-expanded/);
  assert.match(legend, /图例/);
  assert.match(legend, /compact/);
  assert.match(legend, /protective/);
  assert.match(legend, /risk/);
  assert.match(legend, /neutral/);
  assert.match(legend, /mixed/);
  // Desktop path: no toggle when !compact
  assert.match(legend, /if\s*\(\s*!compact\s*\)/);

  assert.match(app, /compact=\{mobile\}/);
  assert.match(app, /hud--legend-collapsed/);
  assert.match(app, /onExpandedChange/);
});

test('NS-051 CSS: muted tokens, HUD 180/280, compact rail targets', () => {
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');

  const shape = css.match(/\.shape-icon\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(shape, /stroke:\s*var\(--muted\)/);
  assert.equal(shape.includes('#d5deea'), false);

  const line = css.match(/\.legend-line\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(line, /background:\s*var\(--muted\)/);
  assert.equal(line.includes('#d5deea'), false);

  assert.match(css, /\.legend[^{]*\{[^}]*pointer-events:\s*auto/s);
  assert.match(css, /\.legend-toggle[^{]*\{[^}]*pointer-events:\s*auto/s);

  const mobileIdx = css.indexOf('@media (max-width: 768px)');
  assert.ok(mobileIdx >= 0);
  const mobile = css.slice(mobileIdx);
  assert.match(mobile, /\.graph-canvas-stage\s+\.hud\.hud--legend-collapsed\s*\{[^}]*max-width:\s*180px/);
  assert.match(
    mobile,
    /\.graph-canvas-stage\s+\.hud:not\(\.hud--legend-collapsed\)\s*\{[^}]*max-width:\s*min\(280px,\s*calc\(100%\s*-\s*16px\)\)/,
  );
  assert.equal(css.includes('.topbar'), false);
  assert.match(css, /\.shell-rail--collapsed \.theme-switch-btn,[^{]*\.shell-rail--collapsed \.shell-rail-icon-btn\s*\{[^}]*width:\s*44px/s);
  assert.match(css, /\.shell-rail--collapsed \.shell-rail-item\s*\{[^}]*min-height:\s*44px/s);

  // Desktop explore HUD baseline remains 300
  assert.match(css, /\.graph-canvas-stage\s+\.hud\s*\{[^}]*max-width:\s*min\(300px,\s*calc\(100%\s*-\s*24px\)\)/s);
});
