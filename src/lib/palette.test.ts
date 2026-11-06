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
  LOBBY_OUTCOMES_SUMMARY,
  LOBBY_RECOMMENDED_HEADING,
  LOBBY_SEARCH_EMPTY,
  LOBBY_SEARCH_PLACEHOLDER,
  LOBBY_TAGLINE,
  LOBBY_TITLE,
  SHELL_CLOSE_NAV,
  SHELL_COLLAPSE_NAV,
  SHELL_EXPAND_NAV,
  SHELL_GRAPH_LABEL,
  SHELL_METHODS_LABEL,
  SHELL_OPEN_NAV,
  SHELL_RECORD_LABEL,
  SHELL_SEARCH_LABEL,
  SHELL_TWIN_LABEL,
  SHELL_VEGAN_ENTRY,
  THEME_CTA,
} from './exploreShell.ts';
import { CANVAS_BG, PALETTE } from './palette.ts';
import { EXPLORE_THEMES } from './themes.ts';
import { themeAccent } from './themeAccent.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readSource = (relative: string) => fs.readFileSync(path.join(root, relative), 'utf8');

test('protective color is the PRO token and the retired green is gone from src', () => {
  assert.equal(PALETTE.protective, '#34d399');
  assert.equal(PALETTE.risk, '#f87171');
  assert.equal(PALETTE.mixed, '#fbbf24');
  assert.equal(PALETTE.neutral, '#94a3b8');
  assert.equal(CANVAS_BG, '#0a0c11');

  const tokens = readSource('src/styles/tokens.css');
  assert.match(tokens, /--dir-protective:\s*#34d399/);
  assert.match(tokens, /--bg:\s*#f4f4f5/);
  assert.match(tokens, /--brand:\s*#18181b/);
  assert.match(tokens, /--brand-hover:\s*#3f3f46/);
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

test('locked shell copy stays short, local, and non-clinical', () => {
  assert.equal(LOBBY_KICKER, '饮食自我探索之路');
  assert.equal(LOBBY_TITLE, '饮食科普');
  assert.equal(LOBBY_TAGLINE, '了解饮食与健康主题在图书与公开资料里都做了哪些描述');
  assert.equal(LOBBY_INTRO, '输入想了解的食物、机制或健康主题，或从下面几项看资料里的讨论。');
  assert.equal(LOBBY_SEARCH_PLACEHOLDER, '输入想了解的概念');
  assert.equal(LOBBY_SEARCH_EMPTY, '资料里还没有这个概念');
  assert.equal(LOBBY_RECOMMENDED_HEADING, '先看这些');
  assert.equal(LOBBY_OUTCOMES_SUMMARY, '按结局浏览');
  assert.equal(LOBBY_EDU_FOOTER, '下面说明图谱怎么读、证据怎么标。');
  assert.equal(THEME_CTA, '查看关联');
  assert.equal(EXPLORE_EMPTY_ACTION, SHELL_OPEN_NAV);
  assert.equal(SHELL_GRAPH_LABEL, '图谱');
  assert.equal(SHELL_TWIN_LABEL, '我的饮食');
  assert.equal(SHELL_OPEN_NAV, '打开导航');
  assert.equal(SHELL_CLOSE_NAV, '关闭导航');
  assert.equal(SHELL_COLLAPSE_NAV, '收起导航');
  assert.equal(SHELL_EXPAND_NAV, '展开导航');
  assert.equal(SHELL_SEARCH_LABEL, '搜索');
  assert.equal(SHELL_RECORD_LABEL, '记录');
  assert.equal(SHELL_METHODS_LABEL, '方法说明');
  assert.equal(SHELL_VEGAN_ENTRY, '素食饮食方式');
  assert.ok([...EXPLORE_EMPTY_COPY].length <= 20);
  assert.ok([...EXPLORE_EMPTY_ACTION].length <= 20);
  assert.equal(LOBBY_INTRO.includes('不是医疗建议'), false);
  assert.equal(LOBBY_EDU_FOOTER.includes('不是医疗建议'), false);
  assert.equal(LOBBY_INTRO.includes(RETIRED_LOBBY_DISCLAIMER), false);
  assert.equal(LOBBY_EDU_FOOTER.includes(RETIRED_LOBBY_DISCLAIMER), false);

  const recommendations = readSource('src/components/RailRecommendations.tsx');
  const app = readSource('src/App.tsx');
  const bar = readSource('src/components/DisclaimerBar.tsx');
  assert.match(recommendations, /\{LOBBY_RECOMMENDED_HEADING\}/);
  assert.match(recommendations, /data-testid="lobby-recommended-grid"/);
  assert.match(app, /placeholder=\{LOBBY_SEARCH_PLACEHOLDER\}/);
  assert.match(app, /emptyText=\{LOBBY_SEARCH_EMPTY\}/);
  assert.match(app, /EXPLORE_EMPTY_COPY/);
  assert.match(bar, /\{LOBBY_EDU_FOOTER\}/);
  assert.equal(bar.includes('不是医疗建议'), false);
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

test('the rail owns search, themes, recommendations, filters, and workspace controls', () => {
  const app = readSource('src/App.tsx');
  const rail = readSource('src/components/ShellRail.tsx');
  const recommendations = readSource('src/components/RailRecommendations.tsx');

  assert.match(app, /const activeWorkspace: WorkspaceId = screen === 'twin' \? 'twin' : 'explore'/);
  assert.match(app, /const twin = useDietTwinController\(\)/);
  assert.match(app, /<ShellRail[\s\S]*activeWorkspace=\{activeWorkspace\}/);
  assert.match(app, /activeWorkspace === 'explore' \? \([\s\S]*graphRailTools[\s\S]*\) : \([\s\S]*<DietTwinControls/);
  assert.match(app, /<SearchBar[\s\S]*inputRef=\{searchInputRef\}/);
  assert.match(app, /searchNodes\(query, exploreNodes\)/);
  assert.match(app, /if \(hit\.kind === 'node' && hit\.id\) enterLens\(hit\.id\)/);
  assert.match(app, /<DomainSwitcher domain=\{activeDomain\} onChange=\{onDomainChange\}/);
  assert.match(app, /<RailRecommendations/);
  assert.match(app, /<ThemeBar[\s\S]*onTheme=\{onTheme\}/);
  assert.match(app, /<FilterPanel/);
  assert.match(app, /data-testid="rail-vegan-detail"/);
  assert.match(app, /screen === 'twin' && <DietTwinCanvas controller=\{twin\}/);
  assert.match(recommendations, /onEnterTheme\(primaryTheme\)/);

  assert.match(rail, /aria-label=\{label\}/);
  assert.match(rail, /label=\{SHELL_GRAPH_LABEL\}/);
  assert.match(rail, /label=\{SHELL_TWIN_LABEL\}/);
  assert.match(rail, /current=\{activeWorkspace === 'explore'\}/);
  assert.match(rail, /current=\{activeWorkspace === 'twin'\}/);
  assert.match(rail, /data-testid="shell-rail-tools"/);
  assert.match(rail, /data-testid="shell-rail-expand"/);
  assert.match(app, /onMethods=\{openAbout\}/);
});

test('the retired lobby is not shipped beside the shell', () => {
  assert.equal(fs.existsSync(path.join(root, 'src/components/ThemeLobby.tsx')), false);
  assert.equal(fs.existsSync(path.join(root, 'src/components/DietTwinPortal.tsx')), false);
  assert.equal(readSource('src/App.tsx').includes('ThemeLobby'), false);
  assert.equal(readSource('src/styles.css').includes('.lobby {'), false);
});

test('theme accent bars follow the seed anchor group', () => {
  const seed = JSON.parse(readSource('data/seed_triples_v0.3_aligned.json')) as {
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
  const rail = readSource('src/components/ShellRail.tsx');
  const css = readSource('src/styles.css');
  assert.match(rail, /data-testid="brand-title"/);
  assert.match(rail, /aria-label="明膳知源"/);
  assert.match(rail, /title="明膳知源"/);
  assert.match(rail, />\s*明膳知源\s*</);
  assert.equal(rail.includes('brand-title-short'), false);
  assert.equal(rail.includes('aria-hidden="true">明膳<'), false);
  assert.equal(css.includes('.brand-title-short'), false);
  assert.equal(css.includes('.brand-title-full'), false);
  assert.equal(/@media \(max-width:\s*639px\)/.test(css), false);
});
