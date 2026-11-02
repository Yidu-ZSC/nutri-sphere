import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
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

test('theme preference defaults to dark and round-trips the four slugs', () => {
  assert.equal(THEME_STORAGE_KEY, 'cleardiet.theme');
  assert.deepEqual([...THEME_IDS], ['dark', 'fresh', 'soft', 'eye']);
  assert.deepEqual(
    THEME_OPTIONS.map((option) => option.label),
    ['深色', '清新', '柔和', '护眼'],
  );

  const empty = memoryStorage();
  assert.equal(readTheme(empty), 'dark');
  assert.equal(empty.values.has(THEME_STORAGE_KEY), false);
  assert.equal(readTheme(null), 'dark');

  const storage = memoryStorage();
  for (const theme of THEME_IDS) {
    writeTheme(theme, storage);
    assert.equal(readTheme(storage), theme);
  }
});

test('illegal theme values fall back to dark and are written back', () => {
  for (const dirty of ['', 'light', 'DARK', 'neon', 'cleardiet']) {
    const storage = memoryStorage(dirty);
    assert.equal(readTheme(storage), 'dark');
    assert.equal(storage.values.get(THEME_STORAGE_KEY), 'dark');
  }

  const throwing = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  };
  assert.equal(readTheme(throwing), 'dark');
});

test('applyTheme sets data-theme on the document root', () => {
  const attrs = new Map<string, string>();
  const node = {
    setAttribute(name: string, value: string) {
      attrs.set(name, value);
    },
  };
  for (const theme of THEME_IDS) {
    applyTheme(theme as AppTheme, node);
    assert.equal(attrs.get('data-theme'), theme);
  }
});

test('theme tokens keep direction colors and brand shared, and canvas stays dark', () => {
  const tokens = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
  const fresh = tokens.match(/:root\[data-theme='fresh'\]\s*\{([^}]*)\}/)?.[1] ?? '';
  const soft = tokens.match(/:root\[data-theme='soft'\]\s*\{([^}]*)\}/)?.[1] ?? '';
  const eye = tokens.match(/:root\[data-theme='eye'\]\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.ok(fresh && soft && eye);

  for (const block of [fresh, soft, eye]) {
    assert.equal(block.includes('--dir-'), false);
    assert.equal(block.includes('--brand'), false);
    assert.equal(block.includes('--card:'), false);
    assert.match(block, /--panel:/);
    assert.match(block, /--panel-hover:/);
    assert.match(block, /--border-hover:/);
    assert.match(block, /--shadow-card:/);
    assert.match(block, /color-scheme:/);
  }

  assert.match(fresh, /color-scheme:\s*light/);
  assert.match(fresh, /--bg:\s*#f8fafc/);
  assert.match(fresh, /--panel:\s*#ffffff/);
  assert.match(fresh, /--text:\s*#1e293b/);
  assert.match(fresh, /--panel-hover:\s*#f1f5f9/);
  assert.match(fresh, /--muted:\s*#64748b/);
  assert.match(fresh, /--faint:\s*#94a3b8/);
  assert.match(soft, /--bg:\s*#f1f5f9/);
  assert.match(soft, /--text:\s*#334155/);
  assert.match(soft, /--panel-hover:\s*#e2e8f0/);
  assert.match(eye, /color-scheme:\s*dark/);
  assert.match(eye, /--bg:\s*#1c1917/);
  assert.match(eye, /--panel:\s*#292524/);
  assert.match(eye, /--text:\s*#fafaf9/);
  assert.match(eye, /--panel-hover:\s*#44403c/);
  assert.match(eye, /--muted:\s*#a8a29e/);
  assert.match(eye, /--faint:\s*#78716c/);

  const rootBlock = tokens.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(rootBlock, /color-scheme:\s*dark/);
  assert.match(rootBlock, /--bg:\s*#0b0d12/);
  assert.match(rootBlock, /--panel:\s*#16181d/);
  assert.match(rootBlock, /--text:\s*#f1f3f5/);
  assert.match(rootBlock, /--brand:\s*#10b981/);
  assert.match(rootBlock, /--dir-protective:\s*#34d399/);
  assert.match(rootBlock, /--dir-risk:\s*#f87171/);
  assert.match(rootBlock, /--dir-mixed:\s*#fbbf24/);
  assert.match(rootBlock, /--dir-neutral:\s*#94a3b8/);
  assert.match(rootBlock, /--panel-solid:\s*var\(--panel\)/);
  assert.equal(tokens.includes('--card:'), false);

  const palette = fs.readFileSync(path.join(root, 'src/lib/palette.ts'), 'utf8');
  assert.match(palette, /export const CANVAS_BG = '#0b0d12'/);
  assert.equal(palette.includes("CANVAS_BG = '#f8fafc'"), false);

  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /cleardiet\.theme/);
  assert.match(html, /document\.documentElement\.setAttribute\('data-theme', theme\)/);
  for (const theme of THEME_IDS) assert.match(html, new RegExp(`stored === '${theme}'`));
  const entry = fs.readFileSync(path.join(root, 'src/main.tsx'), 'utf8');
  assert.match(entry, /applyTheme\(readTheme\(\)\)/);
});
