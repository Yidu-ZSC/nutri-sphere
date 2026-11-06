import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { LOBBY_RECOMMENDED } from './lobbyEntry.ts';
import { EXPLORE_THEMES } from './themes.ts';
import { themeAccent } from './themeAccent.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('rail recommendations and theme chips reuse the locked direction surface', () => {
  const tokens = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
  const recommendations = fs.readFileSync(path.join(root, 'src/components/RailRecommendations.tsx'), 'utf8');
  const themeBar = fs.readFileSync(path.join(root, 'src/components/ThemeBar.tsx'), 'utf8');

  assert.match(tokens, /--radius-card:\s*14px/);
  assert.match(tokens, /--radius-btn:\s*10px/);
  assert.match(tokens, /--border-hover:\s*rgba\(24,\s*24,\s*27,\s*0?\.16\)/);
  assert.match(tokens, /--shadow-card:\s*0 1px 2px rgba\(24,\s*24,\s*27,\s*0?\.04\)/);

  const card = css.match(/\.rail-recommendation\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(card, /border-radius:\s*var\(--radius-card\)/);
  assert.match(card, /background:\s*var\(--bg\)/);
  assert.match(card, /box-shadow:\s*var\(--shadow-card\)/);
  assert.match(card, /text-align:\s*left/);
  assert.equal(card.includes('backdrop-filter'), false);

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

  const hover = css.match(/\.rail-recommendation:hover,\s*\.rail-recommendation:focus-visible\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(hover, /border-color:\s*var\(--border-hover\)/);
  assert.match(hover, /background:\s*var\(--panel-hover\)/);
  assert.equal(hover.includes('rgba(255, 255, 255'), false);

  assert.match(recommendations, /className="dir-top"/);
  assert.match(recommendations, /data-testid=\{`theme-card-\$\{primaryTheme\.id\}`\}/);
  assert.match(recommendations, /data-direction=\{themeAccent\(primaryTheme\)\}/);
  assert.match(recommendations, /onClick=\{\(\) => onEnterTheme\(primaryTheme\)\}/);
  assert.match(recommendations, /data-testid=\{`lens-card-\$\{entry\.id\}`\}/);
  assert.match(recommendations, /onClick=\{\(\) => onOpenLens\(entry\.anchorNodeId\)\}/);
  assert.equal(recommendations.includes('ThemeLobby'), false);
  assert.equal(recommendations.includes('DietTwinPortal'), false);
});

test('recommendations keep the locked theme-first order from the retired lobby', () => {
  const primary = LOBBY_RECOMMENDED[0];
  assert.equal(primary.kind, 'theme');
  assert.ok(EXPLORE_THEMES.some((theme) => theme.id === primary.id));
  assert.ok(LOBBY_RECOMMENDED.slice(1).every((entry) => entry.kind !== 'theme'));
});

test('theme accent bars follow the seed anchor group', () => {
  const seed = JSON.parse(fs.readFileSync(path.join(root, 'data/seed_triples_v0.3_aligned.json'), 'utf8')) as {
    nodes: { id: string; group: string }[];
  };
  const byId = new Map(seed.nodes.map((node) => [node.id, node.group]));
  for (const theme of EXPLORE_THEMES) {
    const anchor = theme.diseaseId ?? theme.mechanismId ?? theme.foodId;
    assert.ok(anchor, theme.id);
    assert.equal(themeAccent(theme), byId.get(anchor), theme.id);
  }
});
