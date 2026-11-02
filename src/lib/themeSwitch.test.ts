import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('desktop header and mobile more panel share the theme switcher', () => {
  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  const switcher = fs.readFileSync(path.join(root, 'src/components/ThemeSwitcher.tsx'), 'utf8');
  const preference = fs.readFileSync(path.join(root, 'src/lib/themePreference.ts'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');

  assert.match(switcher, /aria-label="切换主题"/);
  assert.match(preference, /label: '深色'/);
  assert.match(preference, /label: '清新'/);
  assert.match(preference, /label: '柔和'/);
  assert.match(preference, /label: '护眼'/);
  assert.match(switcher, /THEME_OPTIONS/);
  assert.match(switcher, /aria-checked=\{selected\}/);
  assert.match(app, /!mobile && <ThemeSwitcher theme=\{appTheme\} onChange=\{onAppTheme\} \/>/);
  assert.match(app, /<ThemeOptions theme=\{appTheme\} onChange=\{onAppTheme\} \/>/);

  const morePanel = app.match(/data-testid="more-panel"[\s\S]*?<\/div>/)?.[0] ?? '';
  assert.match(morePanel, /ThemeOptions/);
  assert.equal(morePanel.includes('ThemeSwitcher'), false);

  const options = switcher.match(/export function ThemeOptions[\s\S]*$/)?.[0] ?? '';
  assert.match(options, />\s*主题\s*</);
  assert.equal(options.includes('ThemeSwitcher'), false);

  assert.match(css, /\.pattern-card\[data-highlighted='true'\]\s*\{[^}]*box-shadow:\s*inset 4px 0 0 var\(--brand\)/);
  assert.equal(app.includes('选择主题'), false);
});
