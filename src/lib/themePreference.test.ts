import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { canvasStageForTheme } from './canvasStage.ts';
import {
  THEME_IDS,
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
  applyTheme,
  readTheme,
  writeTheme,
  type AppTheme,
} from './themePreference.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function memoryStorage(initial?: string | null) {
  const values = new Map<string, string>();
  if (initial != null) values.set(THEME_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    values,
  };
}

test('theme preference defaults to light and round-trips the four slugs', () => {
  assert.equal(THEME_STORAGE_KEY, 'cleardiet.theme');
  assert.deepEqual([...THEME_IDS], ['light', 'paper', 'stone', 'contrast']);
  assert.deepEqual(
    THEME_OPTIONS.map((option) => option.label),
    ['标准', '纸本', '岩灰', '高对比'],
  );

  const empty = memoryStorage();
  assert.equal(readTheme(empty), 'light');
  assert.equal(empty.values.get(THEME_STORAGE_KEY), 'light');
  assert.equal(readTheme(null), 'light');

  const storage = memoryStorage();
  for (const theme of THEME_IDS) {
    writeTheme(theme, storage);
    assert.equal(readTheme(storage), theme);
  }
});

test('legacy theme slugs migrate to the professional shell palette', () => {
  assert.equal(readTheme(memoryStorage('dark')), 'light');
  assert.equal(readTheme(memoryStorage('fresh')), 'light');
  assert.equal(readTheme(memoryStorage('soft')), 'paper');
  assert.equal(readTheme(memoryStorage('eye')), 'stone');
  const storage = memoryStorage('dark');
  readTheme(storage);
  assert.equal(storage.values.get(THEME_STORAGE_KEY), 'light');
});

test('illegal theme values fall back to light and are written back', () => {
  for (const dirty of ['', 'light-mode', 'DARK', 'neon', 'cleardiet']) {
    const storage = memoryStorage(dirty);
    assert.equal(readTheme(storage), 'light');
    assert.equal(storage.values.get(THEME_STORAGE_KEY), 'light');
  }

  const throwing = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  };
  assert.equal(readTheme(throwing), 'light');
});

test('applyTheme sets data-theme on the document root', () => {
  const attrs = new Map<string, string>();
  const cssProps = new Map<string, string>();
  const node = {
    setAttribute(name: string, value: string) {
      attrs.set(name, value);
    },
    style: {
      setProperty(name: string, value: string) {
        cssProps.set(name, value);
      },
    },
  };
  for (const theme of THEME_IDS) {
    applyTheme(theme as AppTheme, node);
    assert.equal(attrs.get('data-theme'), theme);
    assert.equal(cssProps.get('--canvas-bg'), canvasStageForTheme(theme as AppTheme).bg);
  }
});

test('theme tokens keep direction colors and brand shared, and canvas stays dark', () => {
  const tokens = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
  const paper = tokens.match(/:root\[data-theme='paper'\]\s*\{([^}]*)\}/)?.[1] ?? '';
  const stone = tokens.match(/:root\[data-theme='stone'\]\s*\{([^}]*)\}/)?.[1] ?? '';
  const contrast = tokens.match(/:root\[data-theme='contrast'\]\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.ok(paper && stone && contrast);

  for (const block of [paper, stone, contrast]) {
    assert.equal(block.includes('--dir-'), false);
    assert.equal(block.includes('--brand'), false);
    assert.equal(block.includes('--card:'), false);
    assert.match(block, /--panel:/);
    assert.match(block, /--panel-hover:/);
    assert.match(block, /--border-hover:/);
    assert.match(block, /--shadow-card:/);
    assert.match(block, /color-scheme:/);
  }

  assert.match(paper, /color-scheme:\s*light/);
  assert.match(paper, /--bg:\s*#f7f6f3/);
  assert.match(paper, /--panel:\s*#fffcf8/);
  assert.match(stone, /--bg:\s*#ececef/);
  assert.match(contrast, /--text:\s*#09090b/);

  const rootBlock = tokens.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(rootBlock, /color-scheme:\s*light/);
  assert.match(rootBlock, /--bg:\s*#f4f4f5/);
  assert.match(rootBlock, /--panel:\s*#ffffff/);
  assert.match(rootBlock, /--text:\s*#18181b/);
  assert.match(rootBlock, /--brand:\s*#18181b/);
  assert.match(rootBlock, /--brand-hover:\s*#3f3f46/);
  assert.match(rootBlock, /--dir-protective:\s*#34d399/);
  assert.match(rootBlock, /--dir-risk:\s*#f87171/);
  assert.match(rootBlock, /--dir-mixed:\s*#fbbf24/);
  assert.match(rootBlock, /--dir-neutral:\s*#94a3b8/);
  assert.match(rootBlock, /--panel-solid:\s*var\(--panel\)/);
  assert.equal(tokens.includes('--card:'), false);

  const canvasStage = fs.readFileSync(path.join(root, 'src/lib/canvasStage.ts'), 'utf8');
  assert.match(canvasStage, /export const CANVAS_BG = STAGES\.light\.bg/);
  assert.match(canvasStage, /light:\s*\{[^}]*bg:\s*'#0a0c11'/);
  assert.match(canvasStage, /paper:\s*\{[^}]*bg:\s*'#100e0b'/);

  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /cleardiet\.theme/);
  assert.match(html, /document\.documentElement\.setAttribute\('data-theme', theme\)/);
  assert.match(html, /var theme = 'light'/);
  for (const theme of THEME_IDS) assert.match(html, new RegExp(`${theme}: 1`));
  const entry = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8');
  assert.match(entry, /applyTheme\(readTheme\(\)\)/);
});
