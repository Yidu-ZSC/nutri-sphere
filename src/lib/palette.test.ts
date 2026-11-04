import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EXPLORE_EMPTY_ACTION,
  EXPLORE_EMPTY_COPY,
  LOBBY_EDU_FOOTER,
  LOBBY_INTRO,
  LOBBY_KICKER,
  LOBBY_TAGLINE,
  LOBBY_TITLE,
  THEME_CTA,
} from './exploreShell.ts';
import { CANVAS_BG, PALETTE } from './palette.ts';
import { EXPLORE_THEMES } from './themes.ts';
import { DIET_TWIN_COPY } from './dietTwin.ts';
import { themeAccent } from './themeAccent.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('protective color is the PRO token and the retired green is gone from src', () => {
  assert.equal(PALETTE.protective, '#34d399');
  assert.equal(PALETTE.risk, '#f87171');
  assert.equal(PALETTE.mixed, '#fbbf24');
  assert.equal(PALETTE.neutral, '#94a3b8');
  assert.equal(CANVAS_BG, '#0b0d12');

  const tokens = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
  assert.match(tokens, /--dir-protective:\s*#34d399/);
  assert.match(tokens, /--bg:\s*#0b0d12/);
  assert.match(tokens, /--brand:\s*#22c55e/);
  assert.match(tokens, /--brand-hover:\s*#16a34a/);
  assert.equal(tokens.includes('#4ade80'), false);
  assert.equal(tokens.includes('--green'), false);

  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx|ts|css)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
        const text = fs.readFileSync(full, 'utf8');
        if (text.includes('#4ade80') || text.includes('--green')) hits.push(path.relative(root, full));
      }
    }
  };
  walk(path.join(root, 'src'));
  assert.deepEqual(hits, []);
});

const RETIRED_LOBBY_DISCLAIMER = '供科普学习与核对来源，不是医疗建议。';

test('locked lobby and explore shell strings stay short and non-clinical', () => {
  assert.equal(LOBBY_KICKER, '饮食自我探索之路');
  assert.equal(LOBBY_TITLE, '饮食科普');
  assert.equal(LOBBY_TAGLINE, '了解饮食与健康主题在图书与公开资料里都做了哪些描述');
  assert.equal(
    LOBBY_INTRO,
    '先选一个你想了解的问题，再看图书与公开资料里饮食与它常被怎么一起讨论。',
  );
  assert.equal(LOBBY_EDU_FOOTER, '下面说明图谱怎么读、证据怎么标。');
  assert.equal(LOBBY_INTRO.includes('不是医疗建议'), false);
  assert.equal(LOBBY_EDU_FOOTER.includes('不是医疗建议'), false);
  assert.equal(LOBBY_INTRO.includes(RETIRED_LOBBY_DISCLAIMER), false);
  assert.equal(LOBBY_EDU_FOOTER.includes(RETIRED_LOBBY_DISCLAIMER), false);
  assert.equal(THEME_CTA, '查看关联');
  assert.equal(EXPLORE_EMPTY_ACTION, '选择主题');
  assert.ok([...EXPLORE_EMPTY_COPY].length <= 20);
  assert.ok([...EXPLORE_EMPTY_ACTION].length <= 20);
  const lobby = fs.readFileSync(path.join(root, 'src/components/ThemeLobby.tsx'), 'utf8');
  assert.equal(lobby.includes('看清膳食，知道来源'), false);
  assert.equal(lobby.includes('查看相关主题'), false);
  assert.equal(lobby.includes('从饮食科普开始'), false);
  assert.equal(lobby.includes(RETIRED_LOBBY_DISCLAIMER), false);
  assert.ok(lobby.includes('LOBBY_TAGLINE'));
  assert.ok(lobby.includes('LOBBY_KICKER'));
  assert.ok(lobby.includes('LOBBY_TITLE'));
  assert.ok(lobby.includes('LOBBY_INTRO'));
  assert.ok(lobby.includes('VEGAN_DIET_SECTION_INTRO'));
  assert.ok(lobby.includes('pattern-facets'));
  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  assert.ok(app.includes('explore-rail'));
  assert.ok(app.includes('EXPLORE_EMPTY_COPY'));
});

test('lobby pillars place science and diet twin as peers above the full-width grids', () => {
  const lobby = fs.readFileSync(path.join(root, 'src/components/ThemeLobby.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
  const bar = fs.readFileSync(path.join(root, 'src/components/DisclaimerBar.tsx'), 'utf8');
  const marks = [
    'className="kicker lobby-lead"',
    'className="lobby-pillars"',
    'className="lobby-intro"',
    '<h2>{LOBBY_TITLE}</h2>',
    'className="lobby-twin"',
    '<DietTwinPortal onOpen={onOpenTwin} />',
    '常见健康主题',
    '从食物/模式看',
    '{VEGAN_DIET_SECTION_TITLE}',
    'className="mechanism-fold"',
  ];
  let cursor = -1;
  for (const mark of marks) {
    const at = lobby.indexOf(mark);
    assert.ok(at > cursor, mark);
    cursor = at;
  }

  assert.match(lobby, /<h1 className="sr-only">\{LOBBY_KICKER\}<\/h1>/);
  assert.equal(lobby.includes('<h1>{LOBBY_TITLE}</h1>'), false);
  assert.equal(lobby.includes('theme-cta'), false);

  const pillars = css.match(/\.lobby-pillars\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(pillars, /display:\s*grid/);
  assert.match(pillars, /grid-template-columns:\s*1fr 1fr/);
  assert.match(pillars, /gap:\s*16px/);
  assert.equal(/\.diet-twin-entry\s*\{[^}]*max-width:\s*520px/.test(css), false);

  const peer = css.match(/\.lobby-intro h2,\s*\.diet-twin-title\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(peer, /font-size:\s*20px/);
  assert.match(peer, /font-weight:\s*600/);

  const mobile = css.slice(
    css.indexOf('@media (max-width: 768px)'),
    css.indexOf('@media (prefers-reduced-motion: reduce)'),
  );
  assert.match(mobile, /\.lobby-pillars\s*\{[^}]*grid-template-columns:\s*1fr/);

  const leadStart = bar.indexOf('className="about-lead"');
  const lead = bar.slice(leadStart, bar.indexOf('</div>', leadStart));
  assert.ok(leadStart > 0);
  assert.match(lead, /\{LOBBY_EDU_FOOTER\}/);
  assert.equal(lead.includes('不是医疗建议'), false);
  assert.equal(lead.includes(RETIRED_LOBBY_DISCLAIMER), false);
  assert.match(bar, /重要提醒/);
  assert.match(bar, /\{DISCLAIMER_TEXT\}/);
  assert.equal(bar.includes(RETIRED_LOBBY_DISCLAIMER), false);

  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx|ts|css)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
        if (fs.readFileSync(full, 'utf8').includes(RETIRED_LOBBY_DISCLAIMER)) hits.push(path.relative(root, full));
      }
    }
  };
  walk(path.join(root, 'src'));
  assert.deepEqual(hits, []);
});

test('diet twin lobby entry is a silhouette portal with only the title visible', () => {
  const lobby = fs.readFileSync(path.join(root, 'src/components/ThemeLobby.tsx'), 'utf8');
  const portal = fs.readFileSync(path.join(root, 'src/components/DietTwinPortal.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
  const copy = fs.readFileSync(path.join(root, 'src/lib/copy.ts'), 'utf8');

  assert.equal(DIET_TWIN_COPY.entryTitle, '我的饮食孪生');
  assert.equal(DIET_TWIN_COPY.entryAria, '我的饮食孪生，教育模拟，非诊断');
  assert.equal(DIET_TWIN_COPY.entryKicker, '饮食观察 · 非诊断');
  assert.equal(DIET_TWIN_COPY.entryPrompt, '用三道短问对照公开资料里的饮食叙述');
  assert.equal(DIET_TWIN_COPY.entryBlurb, '模拟对照，不是个人检测');

  assert.equal(lobby.includes('entryKicker'), false);
  assert.equal(lobby.includes('entryPrompt'), false);
  assert.equal(lobby.includes('entryBlurb'), false);
  assert.equal(lobby.includes('theme-card diet-twin-entry'), false);
  assert.match(lobby, /<section className="lobby-twin"/);
  assert.match(lobby, /<DietTwinPortal onOpen=\{onOpenTwin\} \/>/);

  assert.match(portal, /data-testid="diet-twin-entry"/);
  assert.match(portal, /aria-label=\{DIET_TWIN_COPY\.entryAria\}/);
  assert.match(portal, /<h2 className="diet-twin-title">\{DIET_TWIN_COPY\.entryTitle\}<\/h2>/);
  assert.match(portal, /<svg className="diet-twin-silhouette"/);
  assert.match(portal, /<circle className="diet-twin-ring"/);
  assert.match(portal, /diet-twin-arm--left/);
  assert.match(portal, /diet-twin-arm--right/);
  assert.match(portal, /diet-twin-forearm--left/);
  assert.match(portal, /diet-twin-forearm--right/);
  assert.match(portal, /diet-twin-leg--left/);
  assert.match(portal, /diet-twin-leg--right/);
  assert.match(portal, /diet-twin-shin--left/);
  assert.match(portal, /diet-twin-shin--right/);
  assert.equal(portal.includes('diet-twin-meridian'), false);
  assert.equal(portal.includes('entryKicker'), false);
  assert.equal(portal.includes('entryPrompt'), false);
  assert.equal(portal.includes('entryBlurb'), false);
  assert.equal(portal.includes('饮食观察 · 非诊断'), false);
  assert.equal(portal.includes(DIET_TWIN_COPY.entryPrompt), false);
  assert.equal(portal.includes(DIET_TWIN_COPY.entryBlurb), false);
  assert.equal(portal.includes('theme-card'), false);
  assert.equal(portal.includes('theme-prompt'), false);
  assert.equal(portal.includes('theme-blurb'), false);
  assert.equal(portal.includes('title='), false);
  assert.equal(portal.includes('from \'three\''), false);
  assert.equal(portal.includes('WebGL'), false);
  assert.equal((portal.match(/className="diet-twin-hotspot/g) ?? []).length, 3);

  const entry = css.match(/\.diet-twin-entry\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(entry, /min-height:\s*44px/);
  assert.match(entry, /--twin-glow:\s*0\.32/);
  assert.match(entry, /background:\s*transparent/);
  assert.match(entry, /border:\s*0/);
  assert.equal(entry.includes('var(--shadow-card)'), false);
  assert.equal(entry.includes('backdrop-filter'), false);

  const stage = css.match(/\.diet-twin-stage\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(stage, /height:\s*168px/);
  const figure = css.match(/\.diet-twin-figure-wrap\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(figure, /height:\s*148px/);
  const ring = css.match(/\.diet-twin-ring\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.equal(ring.includes('stroke-dasharray'), false);
  const spot = css.match(/\.diet-twin-hotspot\s*\{([^}]*)\}/)?.[1] ?? '';
  assert.match(spot, /width:\s*8px/);
  assert.match(spot, /height:\s*8px/);
  assert.match(spot, /#22c55e/);
  assert.match(spot, /pointer-events:\s*none/);
  assert.equal(spot.includes('#f87171'), false);
  assert.equal(css.includes('.diet-twin-hotspot:hover'), false);

  for (const theme of ['fresh', 'soft', 'eye']) {
    const block = css.match(new RegExp(`:root\\[data-theme='${theme}'\\] \\.diet-twin-entry\\s*\\{([^}]*)\\}`))?.[1] ?? '';
    assert.match(block, /--twin-glow:/, theme);
    assert.match(block, /--twin-figure:/, theme);
    assert.match(block, /--twin-hotspot:/, theme);
    assert.equal(/#[0-9a-fA-F]{3,8}/.test(block), false, theme);
    assert.equal(block.includes('d='), false, theme);
  }

  const mobile = css.slice(
    css.indexOf('@media (max-width: 768px)'),
    css.indexOf('@media (prefers-reduced-motion: reduce)'),
  );
  assert.match(mobile, /\.diet-twin-entry\s*\{[^}]*flex-direction:\s*row/);
  assert.match(mobile, /\.diet-twin-stage\s*\{[^}]*height:\s*44px/);
  assert.match(mobile, /\.diet-twin-figure-wrap\s*\{[^}]*height:\s*40px/);
  assert.equal(/\.diet-twin-stage\s*\{[^}]*height:\s*136px/.test(mobile), false);

  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /\.diet-twin-hotspot,\s*\.diet-twin-glow\s*\{[^}]*animation:\s*none/);
  assert.match(reduced, /\.diet-twin-arm,\s*\.diet-twin-ring\s*\{[^}]*animation:\s*none/);
  assert.match(reduced, /\.diet-twin-forearm,\s*\.diet-twin-leg,\s*\.diet-twin-shin\s*\{[^}]*animation:\s*none/);

  assert.match(copy, /export const DISCLAIMER_TEXT/);
  assert.match(copy, /export const DISCLAIMER_SHORT/);
  assert.match(copy, /export const DISCLAIMER_EN/);
  assert.equal(portal.includes('DISCLAIMER_'), false);
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

test('brand title always shows full 明膳知源 without short label', () => {
  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
  assert.match(app, /data-testid="brand-title"/);
  assert.match(app, /aria-label="明膳知源"/);
  assert.match(app, /title="明膳知源"/);
  assert.match(app, />\s*明膳知源\s*</);
  assert.equal(app.includes('brand-title-short'), false);
  assert.equal(app.includes('aria-hidden="true">明膳<'), false);
  assert.equal(css.includes('.brand-title-short'), false);
  assert.equal(css.includes('.brand-title-full'), false);
  assert.equal(/@media \(max-width:\s*639px\)/.test(css), false);
});

