import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('the single shell rail footer owns the appearance theme switcher', () => {
  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  const rail = fs.readFileSync(path.join(root, 'src/components/ShellRail.tsx'), 'utf8');
  const switcher = fs.readFileSync(path.join(root, 'src/components/ThemeSwitcher.tsx'), 'utf8');
  const preference = fs.readFileSync(path.join(root, 'src/lib/themePreference.ts'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');

  assert.match(switcher, /aria-label="切换主题"/);
  assert.match(preference, /label: '标准'/);
  assert.match(preference, /label: '纸本'/);
  assert.match(preference, /label: '岩灰'/);
  assert.match(preference, /label: '高对比'/);
  assert.match(switcher, /THEME_OPTIONS/);
  assert.match(switcher, /aria-checked=\{selected\}/);
  assert.match(app, /footer=\{<ThemeSwitcher theme=\{appTheme\} onChange=\{onAppTheme\} \/>\}/);
  assert.match(rail, /\{footer\}/);
  assert.equal(app.includes('ThemeOptions'), false);
  assert.equal(rail.includes('ThemeOptions'), false);

  assert.match(css, /\.shell-rail \.theme-menu\s*\{[^}]*bottom:\s*calc\(100% \+ 8px\)/s);
  assert.match(css, /\.rail-recommendation\s*\{[^}]*border-radius:\s*var\(--radius-card\)/s);
  assert.equal(css.includes('.pattern-card[data-highlighted'), false);
});
