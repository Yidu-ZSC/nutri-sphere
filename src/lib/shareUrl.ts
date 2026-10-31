import type { LayoutMode } from './layout';
import type { ViewLayer } from '../types/graph';

const ID = /^[a-z0-9_]+$/;

export interface ParsedShare {
  disease: string | null;
  mechanism: string | null;
  layer: ViewLayer | null;
  layout: LayoutMode | null;
  hideUnmatched: boolean;
  node: string | null;
  link: string | null;
}

export interface ShareState {
  disease: string | null;
  mechanism: string | null;
  layer: ViewLayer;
  layout: LayoutMode;
  hideUnmatched: boolean;
  node: string | null;
  link: string | null;
}

function cleanId(value: string | null): string | null {
  if (!value || !ID.test(value)) return null;
  return value;
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
  const layer = params.get('layer');
  const layout = params.get('layout');
  const link = params.get('link');
  return {
    disease: cleanId(params.get('disease')),
    mechanism: cleanId(params.get('mechanism')),
    layer: layer === 'layperson' || layer === 'expert' ? layer : null,
    layout: layout === 'hierarchy' || layout === 'force' ? layout : null,
    hideUnmatched: params.get('hide') === '1',
    node: cleanId(params.get('node')),
    link: link && /^[a-z0-9_]+~[a-z0-9_]+$/.test(link) ? link : null,
  };
}

export function serializeViewQuery(state: ShareState): string {
  const params = new URLSearchParams();
  if (state.disease) params.set('disease', state.disease);
  if (state.mechanism) params.set('mechanism', state.mechanism);
  params.set('layer', state.layer);
  if (state.layout === 'force') params.set('layout', 'force');
  if (state.hideUnmatched) params.set('hide', '1');
  if (state.node) params.set('node', state.node);
  else if (state.link) params.set('link', state.link);
  const text = params.toString();
  return text ? `?${text}` : '';
}
