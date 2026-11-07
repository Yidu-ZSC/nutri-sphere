import type { GraphView } from './graphView';
import type { Domain } from '../types/graph';
import { normalizeDomain } from './domain.ts';
import type { LayoutMode } from './layout';
import { normalizeVeganDietPatternId, VEGAN_DIET_HUB_ID } from './dietPatternDetails.ts';
import { knownPatternId, parsePatternList } from './patternLinks.ts';
import { themeById } from './themes.ts';

const ID = /^[a-z0-9_]+$/;
const THEME_ID = /^[a-z0-9_-]+$/;

/** Home, explore, pattern detail, compare, or the diet twin screen. Distinct from `view` (`flow` | `2d` | `3d`). */
export type ScreenMode = 'home' | 'explore' | 'pattern' | 'compare' | 'twin' | 'source' | 'admin';

export const ADMIN_SECTIONS = ['books', 'edges', 'nodes', 'candidates', 'validate', 'settings'] as const;
export type AdminSection = (typeof ADMIN_SECTIONS)[number];

export interface ParsedShare {
  screen: ScreenMode | null;
  /** Always resolved; missing/illegal URL → health. */
  domain: Domain;
  theme: string | null;
  disease: string | null;
  mechanism: string | null;
  food: string | null;
  /** One-hop node lens. Mutually exclusive with theme/disease/mechanism/food anchors. */
  lens: string | null;
  pattern: string | null;
  patterns: string[];
  source: string | null;
  book: string | null;
  adminSection: AdminSection | null;
  edge: string | null;
  layout: LayoutMode | null;
  view: GraphView | null;
  hideUnmatched: boolean;
  node: string | null;
  link: string | null;
  /** Browsing focus root (TASK-NS-084). Never opens the detail drawer; never sets hide. */
  focus: string | null;
}

export interface ShareState {
  screen: ScreenMode;
  /** Omit or health → omit from URL; non-health must be written. */
  domain?: Domain;
  theme: string | null;
  disease: string | null;
  mechanism: string | null;
  food: string | null;
  /** Optional for older call sites; when set it suppresses theme/filter anchors in the URL. */
  lens?: string | null;
  pattern: string | null;
  patterns: readonly string[];
  source: string | null;
  book?: string | null;
  adminSection?: AdminSection;
  edge?: string | null;
  layout: LayoutMode;
  view: GraphView;
  hideUnmatched: boolean;
  node: string | null;
  link: string | null;
  focus?: string | null;
}

function cleanId(value: string | null): string | null {
  if (!value || !ID.test(value)) return null;
  return value;
}

function parseScreen(value: string | null): ScreenMode | null {
  if (
    value === 'home' ||
    value === 'explore' ||
    value === 'pattern' ||
    value === 'compare' ||
    value === 'twin' ||
    value === 'source' ||
    value === 'admin'
  ) {
    return value;
  }
  return null;
}

export function parseAdminSection(value: string | null): AdminSection | null {
  if (
    value === 'books' ||
    value === 'edges' ||
    value === 'nodes' ||
    value === 'candidates' ||
    value === 'validate' ||
    value === 'settings'
  ) {
    return value;
  }
  return null;
}

function parseEdgeKey(value: string | null): string | null {
  if (!value || !/^[a-z0-9_]+~[a-z0-9_]+$/.test(value)) return null;
  return value;
}

function parseTheme(value: string | null): string | null {
  if (!value || !THEME_ID.test(value)) return null;
  return value;
}

function writeDomain(params: URLSearchParams, domain: Domain | undefined): void {
  const resolved = normalizeDomain(domain);
  if (resolved !== 'health') params.set('domain', resolved);
}


/**
 * Missing `screen` opens the graph workspace. `screen=home` is kept as a legacy
 * alias for the graph. A lone known `pattern` id opens that reading layer.
 * Invalid pattern/source ids fall back to the graph rather than a lobby page.
 */
export function resolveScreen(
  parsed: Pick<
    ParsedShare,
    'screen' | 'theme' | 'disease' | 'mechanism' | 'food' | 'lens' | 'pattern' | 'source' | 'node' | 'link'
  >,
): ScreenMode {
  if (parsed.screen === 'pattern') return parsed.pattern ? 'pattern' : 'explore';
  if (parsed.screen === 'source') return parsed.source ? 'source' : 'explore';
  if (parsed.screen === 'admin') return 'admin';
  if (parsed.screen === 'home') return 'explore';
  if (parsed.screen) return parsed.screen;
  if (parsed.disease || parsed.mechanism || parsed.food || parsed.lens || parsed.node || parsed.link) return 'explore';
  if (themeById(parsed.theme)) return 'explore';
  if (parsed.pattern) return 'pattern';
  return 'explore';
}

export function linkKey(source: string, target: string): string {
  return `${source}~${target}`;
}

export function findLinkIndex(
  links: readonly { source: string; target: string }[],
  key: string | null,
): number | null {
  if (!key) return null;
  const parts = key.split('~');
  if (parts.length !== 2) return null;
  const source = cleanId(parts[0] ?? null);
  const target = cleanId(parts[1] ?? null);
  if (!source || !target) return null;
  const index = links.findIndex((link) => link.source === source && link.target === target);
  return index >= 0 ? index : null;
}

export function parseViewQuery(search: string): ParsedShare {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const layout = params.get('layout');
  const view = params.get('view');
  const link = params.get('link');
  const parsed: ParsedShare = {
    screen: parseScreen(params.get('screen')),
    domain: normalizeDomain(params.get('domain')),
    theme: parseTheme(params.get('theme')),
    disease: cleanId(params.get('disease')),
    mechanism: cleanId(params.get('mechanism')),
    food: cleanId(params.get('food')),
    lens: cleanId(params.get('lens')),
    pattern: knownPatternId(params.get('pattern')),
    patterns: parsePatternList(params.get('patterns')),
    source: cleanId(params.get('source')),
    book: cleanId(params.get('book')),
    adminSection: parseAdminSection(params.get('section')),
    edge: parseEdgeKey(params.get('edge')),
    layout: layout === 'hierarchy' || layout === 'force' ? layout : null,
    view: view === 'flow' || view === '2d' || view === '3d' ? view : null,
    hideUnmatched: false,
    node: cleanId(params.get('node')),
    link: link && /^[a-z0-9_]+~[a-z0-9_]+$/.test(link) ? link : null,
    focus: cleanId(params.get('focus')),
  };
  parsed.hideUnmatched = resolveHideUnmatched(params.get('hide'), parsed);
  if (parsed.screen === 'compare') {
    parsed.screen = 'pattern';
    parsed.pattern = VEGAN_DIET_HUB_ID;
  }
  return parsed;
}

/**
 * `hide=1` on, `hide=0` explicitly off.
 * Omitted on explore with a theme, disease, mechanism, or food anchor defaults on.
 * The legacy home alias resolves to explore, so it follows the same anchor rule.
 * Explore without an anchor stays off.
 * Pattern, compare, and twin screens stay off even if `hide` is present.
 */
export function resolveHideUnmatched(
  hideParam: string | null,
  parsed: Pick<
    ParsedShare,
    'screen' | 'theme' | 'disease' | 'mechanism' | 'food' | 'lens' | 'pattern' | 'source' | 'node' | 'link'
  >,
): boolean {
  const screen = resolveScreen(parsed);
  if (screen === 'pattern' || screen === 'compare' || screen === 'twin' || screen === 'source' || screen === 'admin') return false;
  if (hideParam === '1') return true;
  if (hideParam === '0') return false;
  if (
    screen === 'explore' &&
    (themeById(parsed.theme) || parsed.disease || parsed.mechanism || parsed.food || parsed.lens)
  ) {
    return true;
  }
  return false;
}

export function serializeViewQuery(state: ShareState): string {
  if (state.screen === 'pattern' || state.screen === 'compare' || state.screen === 'twin') {
    const params = new URLSearchParams();
    const screen = state.screen === 'compare' ? 'pattern' : state.screen;
    params.set('screen', screen);
    if (screen === 'pattern') {
      params.set('pattern', normalizeVeganDietPatternId(state.pattern) ?? VEGAN_DIET_HUB_ID);
    }
    writeDomain(params, state.domain);
    return `?${params.toString()}`;
  }
  if (state.screen === 'source') {
    const params = new URLSearchParams();
    params.set('screen', 'source');
    if (state.source) params.set('source', state.source);
    writeDomain(params, state.domain);
    return `?${params.toString()}`;
  }
  if (state.screen === 'admin') {
    const params = new URLSearchParams();
    params.set('screen', 'admin');
    const section = state.adminSection ?? 'books';
    if (section !== 'books') params.set('section', section);
    if ((section === 'books' || section === 'candidates') && state.book) params.set('book', state.book);
    if (section === 'edges' && state.edge) params.set('edge', state.edge);
    if (section === 'nodes' && state.node) params.set('node', state.node);
    writeDomain(params, state.domain);
    return `?${params.toString()}`;
  }
  const params = new URLSearchParams();
  params.set('screen', state.screen);
  if (state.screen === 'explore') {
    if (state.lens) {
      params.set('lens', state.lens);
    } else {
      if (state.theme) params.set('theme', state.theme);
      if (state.disease) params.set('disease', state.disease);
      if (state.mechanism) params.set('mechanism', state.mechanism);
      if (state.food) params.set('food', state.food);
    }
    params.set('view', state.view);
    if (state.layout === 'force') params.set('layout', 'force');
    params.set('hide', state.hideUnmatched ? '1' : '0');
    if (state.node) params.set('node', state.node);
    else if (state.link) params.set('link', state.link);
    if (state.focus && !state.node) params.set('focus', state.focus);
  } else if (state.patterns.length > 0) {
    if (state.theme) params.set('theme', state.theme);
  }
  writeDomain(params, state.domain);
  const text = params.toString();
  const query = text ? `?${text}` : '';
  if (state.screen === 'home' && state.patterns.length > 0) {
    const patterns = state.patterns.map((id) => encodeURIComponent(id)).join(',');
    return `${query}${query ? '&' : '?'}patterns=${patterns}`;
  }
  return query;
}
