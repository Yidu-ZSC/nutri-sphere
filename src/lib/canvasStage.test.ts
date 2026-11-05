import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { THEME_IDS } from './themePreference.ts';
import { CANVAS_BG, applyCanvasStageCss, canvasStageForTheme } from './canvasStage.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('canvas stage backgrounds differ per UI theme and stay dark for contrast', () => {
  const backgrounds = THEME_IDS.map((id) => canvasStageForTheme(id).bg);
  assert.equal(new Set(backgrounds).size, THEME_IDS.length);
  for (const bg of backgrounds) {
    assert.match(bg, /^#[0-9a-f]{6}$/i);
    const value = bg.replace('#', '');
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    assert.ok(luma < 40, `expected dark canvas, got ${bg}`);
  }
  assert.equal(CANVAS_BG, canvasStageForTheme('light').bg);
  assert.equal(CANVAS_BG, '#0a0c11');
});

test('tokens.css canvas variables match canvasStage backgrounds', () => {
  const tokens = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
  for (const theme of THEME_IDS) {
    const bg = canvasStageForTheme(theme).bg;
    if (theme === 'light') {
      assert.match(tokens, /--canvas-bg:\s*#0a0c11/);
      continue;
    }
    const block = tokens.match(new RegExp(`:root\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    assert.match(block, new RegExp(`--canvas-bg:\\s*${bg.replace('#', '#')}`));
  }
});

test('applyCanvasStageCss writes canvas variables on the document root', () => {
  const props = new Map<string, string>();
  const root = {
    style: {
      setProperty(name: string, value: string) {
        props.set(name, value);
      },
    },
  };
  applyCanvasStageCss('paper', root);
  assert.equal(props.get('--canvas-bg'), '#100e0b');
  assert.match(props.get('--canvas-frame-glow') ?? '', /rgba/);
});
