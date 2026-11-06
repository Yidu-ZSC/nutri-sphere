import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('method help is a centered overlay above the persistent disclaimer', () => {
  const bar = fs.readFileSync(path.join(root, 'src/components/DisclaimerBar.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');

  assert.match(bar, /data-testid="about-backdrop"/);
  assert.match(bar, /data-testid="methods-dialog"/);
  assert.match(bar, /aria-modal="true"/);
  assert.match(bar, /<details className="about-dev"/);
  assert.equal(/<details className="about-dev"[^>]*\sopen/.test(bar), false);
  assert.match(bar, /你能得到什么/);
  assert.match(bar, /怎么用/);
  assert.match(bar, /如何解读/);
  assert.match(bar, /重要提醒/);
  assert.match(bar, /\{DISCLAIMER_TEXT\}/);
  assert.match(bar, /\{DISCLAIMER_EN\}/);

  assert.match(css, /\.about-layer\s*\{[^}]*position:\s*fixed/s);
  assert.match(css, /\.about\s*\{[^}]*max-width:\s*560px/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('shell keeps the rail, one workspace, and the disclaimer as siblings', () => {
  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  const shell = fs.readFileSync(path.join(root, 'src/components/Shell.tsx'), 'utf8');
  const rail = fs.readFileSync(path.join(root, 'src/components/ShellRail.tsx'), 'utf8');
  const twin = fs.readFileSync(path.join(root, 'src/components/DietTwin.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');

  assert.match(app, /<Shell[\s\S]*rail=\{rail\}/);
  assert.match(app, /data-testid="rail-toggle"/);
  assert.match(app, /data-testid="workspace"/);
  assert.equal(app.includes('<main'), false, 'the workspace wrapper must not nest page-level mains');
  assert.equal(twin.includes('className="workspace workspace--twin"'), false, 'twin content must not nest a second workspace');
  assert.equal(app.includes('<ThemeLobby'), false);
  assert.equal(app.includes('className="topbar'), false);
  assert.ok(
    app.lastIndexOf('</Shell>') < app.lastIndexOf('<DisclaimerBar'),
    'disclaimer must stay outside the rail and drawer',
  );

  assert.match(rail, /role=\{drawer \? 'dialog' : undefined\}/);
  assert.match(rail, /aria-modal=\{drawer \? 'true' : undefined\}/);
  assert.match(shell, /data-testid="shell-rail-backdrop"/);
  assert.match(shell, /event\.key === 'Escape'/);
  assert.match(shell, /event\.key !== 'Tab'/);
  assert.match(shell, /triggerRef\.current\?\.focus\(\)/);

  assert.match(rail, /data-testid=\{drawer \? 'shell-rail-close' : 'shell-rail-collapse'\}/);
  assert.match(rail, /data-testid="shell-rail-expand"/);
  assert.match(rail, /title="明膳知源"/);
  assert.match(rail, /aria-label="明膳知源"/);

  const rootApp = css.match(/\.app\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(rootApp, /grid-template-rows:\s*minmax\(0,\s*1fr\)\s+auto/);
  assert.match(css, /\.shell--expanded\s*\{[^}]*grid-template-columns:\s*280px/s);
  assert.match(css, /\.shell--collapsed\s*\{[^}]*grid-template-columns:\s*64px/s);
  assert.match(css, /\.shell-rail\s*\{[^}]*height:\s*100%/s);
  assert.match(css, /\.shell-rail-backdrop\s*\{[^}]*position:\s*absolute/s);
  assert.match(css, /\.twin-workspace\s*\{[^}]*flex:\s*1/s);

  const mobile = css.slice(css.indexOf('@media (max-width: 768px)'));
  assert.match(mobile, /\.shell-rail\s*\{[^}]*width:\s*min\(360px,\s*calc\(100%\s*-\s*48px\)\)/s);
  assert.match(mobile, /\.shell-rail-backdrop\s*\{[^}]*inset:\s*0/s);
  assert.equal(/\.shell--collapsed\s*\{[^}]*display:\s*none/s.test(mobile), false);
});

test('retired lobby and topbar chrome is gone', () => {
  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');

  assert.equal(app.includes('shell-menu-trigger'), false);
  assert.equal(app.includes('back-to-home'), false);
  assert.equal(css.includes('.topbar'), false);
  assert.equal(css.includes('.shell-menu'), false);
  assert.equal(css.includes('.lobby {'), false);
  assert.equal(css.includes('.explore-rail'), false);
});
