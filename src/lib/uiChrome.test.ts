import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('method help is a centered overlay and narrow explore keeps the primary path', () => {
  const bar = fs.readFileSync(path.join(root, 'src/components/DisclaimerBar.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');

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

  assert.match(app, /aria-label="菜单"/);
  assert.match(app, /data-testid="more-menu"/);
  assert.match(app, /data-testid="back-to-home"/);
  assert.match(app, /data-testid="shell-menu-backdrop"/);
  assert.match(app, /data-testid="rail-toggle"/);
  assert.match(app, /topbar--narrow/);
  assert.equal(app.includes('exploring && !mobile && graph'), false);
  assert.match(app, /className="btn btn--primary"/);
});
