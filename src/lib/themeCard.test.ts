import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('lobby theme cards use the locked surface without retuning global radii', () => {
  const tokens = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');

  assert.match(tokens, /--radius-card:\s*10px/);
  assert.match(tokens, /--radius-btn:\s*6px/);
  assert.match(tokens, /--radius-theme-card:\s*12px/);
  assert.match(tokens, /--radius-theme-cta:\s*8px/);
  assert.match(tokens, /--border-hover:\s*rgba\(255,\s*255,\s*255,\s*0?\.22\)/);
  assert.match(tokens, /--shadow-card:\s*0 8px 24px rgba\(0,\s*0,\s*0,\s*0?\.35\)/);

  const card = css.match(/\.theme-card\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(card, /border-radius:\s*var\(--radius-theme-card\)/);
  assert.match(
    card,
    /background:\s*linear-gradient\(180deg,\s*color-mix\(in srgb,\s*var\(--panel\)\s*92%,\s*transparent\),\s*var\(--panel\)\)/,
  );
  assert.match(card, /backdrop-filter:\s*blur\(8px\)/);
  assert.match(card, /box-shadow:\s*var\(--shadow-card\)/);
  assert.equal(card.includes('var(--radius-card)'), false);

  const bar = css.match(/\.dir-bar\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(bar, /width:\s*3px/);
  assert.match(bar, /background:\s*var\(--card-accent,\s*var\(--dir-neutral\)\)/);

  const hover = css.match(/\.theme-card:hover\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(hover, /transform:\s*translateY\(-2px\)/);
  assert.match(hover, /border-color:\s*var\(--border-hover\)/);
  assert.match(hover, /background-color:\s*var\(--panel-hover\)/);
  assert.equal(hover.includes('rgba(255, 255, 255'), false);

  const cta = css.match(/\.theme-cta\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(cta, /height:\s*36px/);
  assert.match(cta, /width:\s*100%/);
  assert.match(cta, /border-radius:\s*var\(--radius-theme-cta\)/);
  assert.match(css, /\.theme-cta:active[\s\S]*transform:\s*scale\(0\.99\)/);
  assert.match(css, /\.theme-card:hover \.dir-bar\s*\{[^}]*filter:\s*brightness\(1\.15\)/);

  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /\.theme-card:hover/);
  assert.match(reduced, /transform:\s*none/);
  assert.match(reduced, /\.theme-cta:active/);
});
