import { visibleNodeIds } from './visibility.ts';

export interface LayerNode {
  id: string;
  type: string;
  /** Omitted means summary. Kept on the node for data; no longer masks the graph. */
  mechanism_depth?: string | null;
}

export interface LayerLink {
  source: string;
  target: string;
  /** Omitted means general. Kept on the edge for data; no longer masks the graph. */
  audience?: string | null;
}

/**
 * Keep every node and edge that survived focus + hide-unmatched.
 * Dropping a node also drops every edge that touches it.
 * Audience / mechanism_depth no longer hide content (ViewLayer retired).
 */
export function filterVisibleLinks<T extends LayerLink>(
  nodes: readonly LayerNode[],
  links: readonly T[],
  visibleIds: ReadonlySet<string>,
): { nodeIds: Set<string>; links: Array<T & { graphIndex: number }> } {
  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (!visibleIds.has(node.id)) continue;
    nodeIds.add(node.id);
  }
  const kept: Array<T & { graphIndex: number }> = [];
  links.forEach((link, graphIndex) => {
    if (!nodeIds.has(link.source) || !nodeIds.has(link.target)) return;
    kept.push({ ...link, graphIndex });
  });
  return { nodeIds, links: kept };
}

/** Focus, then hide-unmatched. No ViewLayer mask. */
export function renderVisibleGraph<T extends LayerLink>(input: {
  nodes: readonly LayerNode[];
  links: readonly T[];
  focusIds: ReadonlySet<string> | null;
  hideUnmatched: boolean;
  pinnedIds: ReadonlySet<string>;
}): { nodeIds: Set<string>; links: Array<T & { graphIndex: number }> } {
  const visible = visibleNodeIds(
    input.nodes.map((node) => node.id),
    input.focusIds,
    input.hideUnmatched,
    input.pinnedIds,
  );
  return filterVisibleLinks(input.nodes, input.links, visible);
}
