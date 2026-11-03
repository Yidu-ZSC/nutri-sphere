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
  assert.ok(lobby.includes('THEME_CTA'));
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
    'className="theme-card diet-twin-entry"',
    'heading="h2"',
    '常见健康主题',
    '从食物/模式看',
    '健康饮食方式',
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

  const peer = css.match(/\.lobby-intro h2,\s*\.diet-twin-entry \.theme-card-heading h2\s*\{([^}]*)\}/)?.[1] ?? '';
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
