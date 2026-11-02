import type { GraphView } from './graphView';
import type { LayoutMode } from './layout';
import { knownPatternId, parsePatternList } from './patternLinks.ts';
import { themeById } from './themes.ts';
import type { ViewLayer } from '../types/graph';

const ID = /^[a-z0-9_]+$/;
const THEME_ID = /^[a-z0-9_-]+$/;

/** Home, explore, pattern detail, compare, or the diet twin screen. Distinct from `view`, which stays `2d` | `3d`. */
export type ScreenMode = 'home' | 'explore' | 'pattern' | 'compare' | 'twin';

export interface ParsedShare {
  screen: ScreenMode | null;
  theme: string | null;
  disease: string | null;
  mechanism: string | null;
  food: string | null;
  pattern: string | null;
  patterns: string[];
  layer: ViewLayer | null;
  layout: LayoutMode | null;
  view: GraphView | null;
  hideUnmatched: boolean;
  node: string | null;
  link: string | null;
}

export interface ShareState {
  screen: ScreenMode;
  theme: string | null;
  disease: string | null;
  mechanism: string | null;
  food: string | null;
  pattern: string | null;
  patterns: readonly string[];
  layer: ViewLayer;
  layout: LayoutMode;
  view: GraphView;
  hideUnmatched: boolean;
  node: string | null;
  link: string | null;
}

function cleanId(value: string | null): string | null {
  if (!value || !ID.test(value)) return null;
  return value;
}

function parseLayer(value: string | null): ViewLayer | null {
  if (value === 'layperson' || value === 'expert') return value;
  return null;
}

function parseScreen(value: string | null): ScreenMode | null {
  if (value === 'home' || value === 'explore' || value === 'pattern' || value === 'compare' || value === 'twin') {
    return value;
  }
  return null;
}

function parseTheme(value: string | null): string | null {
  if (!value || !THEME_ID.test(value)) return null;
  return value;
}

/**
 * Missing `screen` is home, unless the link already points at a filter,
 * a food anchor, a node, a link, or a known theme — those open explore.
 * A lone known `pattern` id opens that detail. An explicit `screen` still wins,
 * except `screen=pattern` without a known id, which falls back to home.
 */
export function resolveScreen(
  parsed: Pick<ParsedShare, 'screen' | 'theme' | 'disease' | 'mechanism' | 'food' | 'pattern' | 'node' | 'link'>,
): ScreenMode {
  if (parsed.screen === 'pattern') return parsed.pattern ? 'pattern' : 'home';
  if (parsed.screen) return parsed.screen;
  if (parsed.disease || parsed.mechanism || parsed.food || parsed.node || parsed.link) return 'explore';
  if (themeById(parsed.theme)) return 'explore';
  if (parsed.pattern) return 'pattern';
  return 'home';
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
    theme: parseTheme(params.get('theme')),
    disease: cleanId(params.get('disease')),
    mechanism: cleanId(params.get('mechanism')),
    food: cleanId(params.get('food')),
    pattern: knownPatternId(params.get('pattern')),
    patterns: parsePatternList(params.get('patterns')),
    layer: parseLayer(params.get('layer')),
    layout: layout === 'hierarchy' || layout === 'force' ? layout : null,
    view: view === '2d' || view === '3d' ? view : null,
    hideUnmatched: false,
    node: cleanId(params.get('node')),
    link: link && /^[a-z0-9_]+~[a-z0-9_]+$/.test(link) ? link : null,
  };
  parsed.hideUnmatched = resolveHideUnmatched(params.get('hide'), parsed);
  return parsed;
}

/**
 * `hide=1` on, `hide=0` explicitly off.
 * Omitted on explore with a theme, disease, mechanism, or food anchor defaults on.
 * Home never uses the flag. Explore without an anchor stays off.
 * Pattern, compare, and twin screens stay off even if `hide` is present.
 */
export function resolveHideUnmatched(
  hideParam: string | null,
  parsed: Pick<ParsedShare, 'screen' | 'theme' | 'disease' | 'mechanism' | 'food' | 'pattern' | 'node' | 'link'>,
): boolean {
  const screen = resolveScreen(parsed);
  if (screen === 'pattern' || screen === 'compare' || screen === 'twin') return false;
  if (hideParam === '1') return true;
  if (hideParam === '0') return false;
  if (screen === 'explore' && (parsed.theme || parsed.disease || parsed.mechanism || parsed.food)) {
    return true;
  }
  return false;
}

export function serializeViewQuery(state: ShareState): string {
  if (state.screen === 'pattern' || state.screen === 'compare' || state.screen === 'twin') {
    const params = new URLSearchParams();
    params.set('screen', state.screen);
    if (state.screen === 'pattern' && state.pattern) params.set('pattern', state.pattern);
    params.set('layer', state.layer);
    return `?${params.toString()}`;
  }
  const params = new URLSearchParams();
  params.set('screen', state.screen);
  params.set('layer', state.layer);
  if (state.screen === 'explore') {
    if (state.theme) params.set('theme', state.theme);
    if (state.disease) params.set('disease', state.disease);
    if (state.mechanism) params.set('mechanism', state.mechanism);
    if (state.food) params.set('food', state.food);
    params.set('view', state.view);
    if (state.layout === 'force') params.set('layout', 'force');
    params.set('hide', state.hideUnmatched ? '1' : '0');
    if (state.node) params.set('node', state.node);
    else if (state.link) params.set('link', state.link);
  } else if (state.patterns.length > 0) {
    if (state.theme) params.set('theme', state.theme);
  }
  const text = params.toString();
  const query = text ? `?${text}` : '';
  if (state.screen === 'home' && state.patterns.length > 0) {
    const patterns = state.patterns.map((id) => encodeURIComponent(id)).join(',');
    return `${query}${query ? '&' : '?'}patterns=${patterns}`;
  }
  return query;
}
