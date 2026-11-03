import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('lobby theme cards use the locked surface without retuning global radii', () => {
  const tokens = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
  const lobby = fs.readFileSync(path.join(root, 'src/components/ThemeLobby.tsx'), 'utf8');
  const themeBar = fs.readFileSync(path.join(root, 'src/components/ThemeBar.tsx'), 'utf8');

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
  assert.match(card, /min-height:\s*148px/);
  assert.match(card, /padding:\s*var\(--space-4\)\s*;/);
  assert.match(card, /cursor:\s*pointer/);
  assert.equal(card.includes('var(--radius-card)'), false);
  assert.equal(card.includes('+ 3px'), false);
  assert.equal(card.includes('calc('), false);

  const top = css.match(/\.dir-top\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(top, /height:\s*3px/);
  assert.match(top, /left:\s*0/);
  assert.match(top, /right:\s*0/);
  assert.match(top, /top:\s*0/);
  assert.match(top, /background:\s*var\(--card-accent,\s*var\(--dir-neutral\)\)/);
  assert.equal(top.includes('width:'), false);

  const bar = css.match(/\.dir-bar\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(bar, /width:\s*3px/);
  assert.match(bar, /left:\s*0/);
  assert.match(bar, /top:\s*0/);
  assert.match(bar, /bottom:\s*0/);
  assert.match(bar, /background:\s*var\(--card-accent,\s*var\(--dir-neutral\)\)/);
  assert.match(themeBar, /className="dir-bar"/);

  const hover = css.match(/\.theme-card:hover\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(hover, /transform:\s*translateY\(-2px\)/);
  assert.match(hover, /border-color:\s*var\(--border-hover\)/);
  assert.match(hover, /background-color:\s*var\(--panel-hover\)/);
  assert.equal(hover.includes('rgba(255, 255, 255'), false);
  assert.match(css, /\.theme-card:hover \.dir-top\s*\{[^}]*filter:\s*brightness\(1\.15\)/);
  assert.equal(css.includes('.theme-card:hover .dir-bar'), false);

  const focus = css.match(/\.theme-card:focus-visible\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(focus, /outline:\s*2px solid var\(--brand\)/);
  assert.match(focus, /outline-offset:\s*2px/);

  const chevron = css.match(/\.theme-card-chevron\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(chevron, /color:\s*var\(--muted\)/);
  assert.match(
    css,
    /\.theme-card:hover \.theme-card-chevron,\s*\.theme-card:focus-visible \.theme-card-chevron\s*\{[^}]*color:\s*var\(--text\)/,
  );

  assert.match(css, /\.theme-card:active\s*\{[^}]*transform:\s*scale\(0\.99\)/);
  assert.equal(css.includes('.theme-cta'), false);

  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)/);
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /\.theme-card:hover/);
  assert.match(reduced, /\.theme-card:active/);
  assert.match(reduced, /\.diet-twin-entry:hover/);
  assert.match(reduced, /\.diet-twin-entry:active/);
  assert.match(reduced, /transition:\s*none/);
  assert.match(reduced, /transform:\s*none/);
  assert.equal(reduced.includes('.theme-cta'), false);
  assert.equal(reduced.includes('translateY'), false);

  const heading = lobby.slice(lobby.indexOf('function CardHeading'), lobby.indexOf('function ThemeCard'));
  assert.match(heading, /className="theme-card-chevron"/);
  assert.match(heading, /aria-hidden="true"/);

  const themeCard = lobby.slice(lobby.indexOf('function ThemeCard'), lobby.indexOf('function PatternCard'));
  assert.match(themeCard, /<button[\s\S]*type="button"[\s\S]*className="theme-card"/);
  assert.match(themeCard, /aria-label=\{theme\.title\}/);
  assert.match(themeCard, /onClick=\{\(\) => onEnter\(theme\)\}/);
  assert.match(themeCard, /className="dir-top"/);
  assert.match(themeCard, /<CardHeading title=\{theme\.title\} \/>/);
  assert.equal(themeCard.includes('<article'), false);
  assert.equal(themeCard.includes('theme-cta'), false);
  assert.equal(themeCard.includes('dir-bar'), false);
  assert.equal(themeCard.includes('THEME_CTA'), false);

  const portal = fs.readFileSync(path.join(root, 'src/components/DietTwinPortal.tsx'), 'utf8');
  assert.equal(lobby.includes('className="theme-card diet-twin-entry"'), false);
  assert.match(lobby, /<DietTwinPortal onOpen=\{onOpenTwin\} \/>/);
  assert.match(portal, /className="diet-twin-entry"/);
  assert.match(portal, /type="button"/);
  assert.match(portal, /<h2 className="diet-twin-title">/);
  assert.equal(portal.includes('theme-card'), false);
  assert.equal(portal.includes('CardHeading'), false);
  assert.equal(portal.includes('dir-top'), false);
  assert.equal(portal.includes('theme-cta'), false);
  assert.equal(portal.includes('theme-card-chevron'), false);
  assert.equal(portal.includes('data-direction'), false);
  assert.equal(portal.includes('--card-accent'), false);
  assert.equal(portal.includes('btn--primary'), false);
  assert.equal(/\.diet-twin-entry\s*\{[^}]*max-width:\s*520px/.test(css), false);

  assert.equal(lobby.includes('theme-cta'), false);
  assert.equal(lobby.includes('dir-bar'), false);
  assert.ok(lobby.includes('THEME_CTA'));
  assert.match(lobby, /className="pattern-card"/);
  assert.match(lobby, /className="btn btn--primary pattern-jump"/);
});
