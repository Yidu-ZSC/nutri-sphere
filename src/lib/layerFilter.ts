import type { ViewLayer } from '../types/graph';
import { visibleNodeIds } from './visibility.ts';

/** Layperson status shown beside the layer control. */
export const LAYPERSON_LAYER_HINT = '已简化显示';

/** Expert status shown beside the layer control. */
export const EXPERT_LAYER_HINT = '已展开全部证据';

/** Shown when the active theme survives focus but not the layperson layer. */
export const LAYPERSON_THEME_EMPTY = '暂无匹配，可切专家层';

export function layerHint(layer: ViewLayer): string {
  return layer === 'expert' ? EXPERT_LAYER_HINT : LAYPERSON_LAYER_HINT;
}

export interface LayerNode {
  id: string;
  type: string;
  /** Omitted means summary. Ignored unless `type` is `mechanism`. */
  mechanism_depth?: string | null;
}

export interface LayerLink {
  source: string;
  target: string;
  /** Omitted means general. */
  audience?: string | null;
}

/**
 * Layperson keeps every non-mechanism node.
 * Mechanism nodes stay only when depth is omitted or `summary`.
 * `mechanism` and `technical` are expert-only.
 */
export function nodeKeptOnLayperson(node: LayerNode): boolean {
  if (node.type !== 'mechanism') return true;
  const depth = node.mechanism_depth;
  return depth == null || depth === '' || depth === 'summary';
}

/** Layperson keeps omitted and `general` edges. `deep_reader` is expert-only. */
export function linkKeptOnLayperson(link: LayerLink): boolean {
  const audience = link.audience;
  return audience == null || audience === '' || audience === 'general';
}

/**
 * Layer mask applied after focus and hide-unmatched.
 * Dropping a node also drops every edge that touches it.
 * Dropping an edge leaves its endpoints in place.
 */
export function filterByLayer<T extends LayerLink>(
  nodes: readonly LayerNode[],
  links: readonly T[],
  visibleIds: ReadonlySet<string>,
  layer: ViewLayer,
): { nodeIds: Set<string>; links: Array<T & { graphIndex: number }> } {
  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (!visibleIds.has(node.id)) continue;
    if (layer === 'layperson' && !nodeKeptOnLayperson(node)) continue;
    nodeIds.add(node.id);
  }
  const kept: Array<T & { graphIndex: number }> = [];
  links.forEach((link, graphIndex) => {
    if (!nodeIds.has(link.source) || !nodeIds.has(link.target)) return;
    if (layer === 'layperson' && !linkKeptOnLayperson(link)) return;
    kept.push({ ...link, graphIndex });
  });
  return { nodeIds, links: kept };
}

/** Focus, then hide-unmatched, then the layperson/expert layer. */
export function renderVisibleGraph<T extends LayerLink>(input: {
  nodes: readonly LayerNode[];
  links: readonly T[];
  focusIds: ReadonlySet<string> | null;
  hideUnmatched: boolean;
  pinnedIds: ReadonlySet<string>;
  layer: ViewLayer;
}): { nodeIds: Set<string>; links: Array<T & { graphIndex: number }> } {
  const visible = visibleNodeIds(
    input.nodes.map((node) => node.id),
    input.focusIds,
    input.hideUnmatched,
    input.pinnedIds,
  );
  return filterByLayer(input.nodes, input.links, visible, input.layer);
}

/**
 * True when a theme focus exists, layperson removed every focused node,
 * and the focus still names at least one real graph node (expert can reveal it).
 * A focus that matches nothing in the graph is the existing "无匹配" state.
 */
export function isLaypersonThemeEmpty(
  layer: ViewLayer,
  focusIds: ReadonlySet<string> | null,
  renderedNodeIds: ReadonlySet<string>,
  graphNodeIds: readonly string[],
): boolean {
  if (layer !== 'layperson' || focusIds == null) return false;
  let focusHitsGraph = false;
  for (const id of graphNodeIds) {
    if (focusIds.has(id)) {
      focusHitsGraph = true;
      break;
    }
  }
  if (!focusHitsGraph) return false;
  for (const id of focusIds) {
    if (renderedNodeIds.has(id)) return false;
  }
  return true;
}
