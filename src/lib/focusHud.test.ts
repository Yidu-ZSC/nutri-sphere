import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { FOCUS_HUD_LABEL, FOCUS_LOCK_LABEL, FOCUS_LOCK_OFF } from './exploreShell.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

test('NS-085: focus toggle lives in the canvas HUD rail after the view toggle', () => {
  const app = read('src/App.tsx');
  const hud = read('src/components/FocusHud.tsx');

  // The old top banner no longer renders from App; it lives inside FocusHud.
  assert.equal(app.includes('className="click-focus-banner"'), false);

  const controls = app.match(/<div className="canvas-hud-controls"[\s\S]*?<\/div>/)?.[0] ?? '';
  assert.match(controls, /data-testid="canvas-hud-controls"/);
  const view = controls.indexOf('{viewControls}');
  const rotate = controls.indexOf('{rotateControl}');
  const focus = controls.indexOf('{focusControls}');
  assert.ok(view >= 0 && focus > view, 'focus group renders after the view toggle');
  assert.ok(rotate > view && focus > rotate, 'focus group renders after the rotate control');

  assert.match(hud, /data-testid="focus-hud-toggle"/);
  assert.match(hud, /aria-pressed=\{hasFocus\}/);
  assert.match(hud, /aria-expanded=\{chipOpen\}/);
  assert.match(hud, /data-testid="click-focus-banner"/);
  assert.match(hud, /data-testid="focus-highlight-lock"/);
  assert.match(hud, /<circle /);
  assert.match(hud, /<path /);
});

test('NS-088: the chip shows only the bare label and a banner lock', () => {
  assert.equal(FOCUS_HUD_LABEL, '聚焦');
  assert.equal(FOCUS_LOCK_LABEL, '锁定浏览聚焦');
  assert.equal(FOCUS_LOCK_OFF, '解除浏览聚焦锁定');

  const hud = read('src/components/FocusHud.tsx');
  assert.match(hud, /\{focusLabel\}/);
  // The prefix and the old text clear button are gone; the lock lives on the chip.
  assert.doesNotMatch(hud, /已聚焦：/);
  assert.doesNotMatch(hud, /清除聚焦/);
  assert.doesNotMatch(hud, /clear-click-focus/);
  assert.doesNotMatch(hud, /theme-highlight-lock/);
});

test('NS-088: the lock is on the chip and no rail lock button remains', () => {
  const hud = read('src/components/FocusHud.tsx');
  const banner = hud.match(/className=\{`click-focus-banner[\s\S]*?<\/div>/)?.[0] ?? '';
  assert.match(banner, /data-testid="focus-highlight-lock"/);
  assert.match(banner, /aria-pressed=\{highlightBrowseLocked\}/);
  assert.ok(banner.includes('<LockIcon locked={highlightBrowseLocked} />'));
});

test('NS-085: chip pushes out from the right rail instead of sitting across the top', () => {
  const css = read('src/styles.css');
  const chip = css.match(/\.click-focus-banner\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(chip, /position:\s*absolute/);
  assert.match(chip, /right:\s*calc\(100%\s*\+\s*6px\)/);
  assert.match(chip, /height:\s*48px/);
  assert.match(chip, /opacity:\s*0/);
  assert.match(chip, /visibility:\s*hidden/);
  assert.match(chip, /transform:\s*translateX\(14px\)/);
  assert.match(chip, /transition:[^;]*200ms/);
  assert.equal(/left:\s*50%/.test(chip), false);
  assert.equal(/translateX\(-50%\)/.test(chip), false);

  const open = css.match(/\.click-focus-banner\.is-open\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(open, /opacity:\s*1/);
  assert.match(open, /visibility:\s*visible/);
  assert.match(open, /transform:\s*translateX\(0\)/);

  const toggle = css.match(/\.focus-hud-group button\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(toggle, /width:\s*40px/);
  assert.match(toggle, /height:\s*40px/);

  // Mobile no longer stretches the chip edge to edge.
  const mobileIdx = css.indexOf('@media (max-width: 768px)');
  assert.ok(mobileIdx >= 0);
  const mobile = css.slice(mobileIdx);
  assert.equal(/\.click-focus-banner[^{]*\{[^}]*left:\s*12px/s.test(mobile), false);
  assert.equal(/\.click-focus-banner[^{]*\{[^}]*right:\s*12px/s.test(mobile), false);

  // NS-083 stays put.
  assert.match(mobile, /\.rail-toggle\s*\{[^}]*left:\s*var\(--space-3\)/s);
});

test('NS-088: chip lock styles replace the old rail lock styles', () => {
  const css = read('src/styles.css');
  assert.match(css, /\.click-focus-lock\s*\{/);
  assert.match(css, /\.click-focus-lock\.is-locked\s*\{/);
  assert.equal(/\.focus-hud-lock\.is-locked\s*\{/.test(css), false);
  assert.equal(/\.click-focus-clear\s*\{/.test(css), false);
});

test('NS-085: the push-out transition is disabled under reduced motion', () => {
  const css = read('src/styles.css');
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.click-focus-banner\s*\{\s*transition:\s*none/s,
  );
});
