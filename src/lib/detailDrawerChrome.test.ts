import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');

/** The mobile floating-card rule is the only `.workspace--detail .drawer` block with the inset token. */
function mobileDrawerRule(): string {
  return (
    css.match(
      /\.workspace--detail\s+\.drawer\s*\{([^}]*--detail-drawer-inset-top[^}]*)\}/s,
    )?.[1] ?? ''
  );
}

test('NS-087: mobile detail drawer floats above the HUD with a documented inset top', () => {
  const rule = mobileDrawerRule();
  assert.ok(rule.length > 0, 'mobile drawer override must exist');

  // Drawer sits above the view/focus rail (7) and rail toggle (8), below twin (30) / nav rail (59-60).
  assert.match(rule, /z-index:\s*28/);
  assert.match(rule, /position:\s*absolute/);

  // Top edge lands just below the first HUD row, tokenized for future tuning.
  assert.match(rule, /--detail-drawer-inset-top:\s*calc\(var\(--space-3\)\s*\+\s*56px\s*\+\s*44px\s*\+\s*6px\)/);
  assert.match(rule, /top:\s*var\(--detail-drawer-inset-top\)/);

  // Left/right/bottom insets keep the canvas visible around the card.
  assert.match(rule, /left:\s*var\(--space-3\)/);
  assert.match(rule, /--detail-drawer-inset-right:\s*calc\(var\(--space-3\)\s*\+\s*56px\)/);
  assert.match(rule, /right:\s*var\(--detail-drawer-inset-right\)/);
  assert.match(rule, /bottom:\s*calc\(var\(--space-3\)\s*\+\s*env\(safe-area-inset-bottom\)\)/);

  // Floating card chrome: full border, rounded panel, card shadow.
  assert.match(rule, /border:\s*var\(--border\)/);
  assert.match(rule, /border-radius:\s*var\(--radius-panel\)/);
  assert.match(rule, /box-shadow:\s*var\(--shadow-card\)/);
  assert.match(rule, /width:\s*auto/);
  assert.match(rule, /height:\s*auto/);

  // The old full-height right strip is gone from this rule.
  assert.equal(rule.includes('border-top'), false);
  assert.equal(rule.includes('border-left'), false);
  assert.equal(/top:\s*0/.test(rule), false);
  assert.equal(/bottom:\s*0/.test(rule), false);
});

test('NS-087: graph layout is the containing block for the floating drawer', () => {
  const layout = css.match(/\.graph-layout\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(layout, /position:\s*relative/);
});
