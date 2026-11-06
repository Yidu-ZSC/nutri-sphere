import type { GraphData, GraphNode } from '../types/graph';
import { nodeTypeLabel } from './copy.ts';

/** Spec: debounce at least 200ms. */
export const SEARCH_DEBOUNCE_MS = 250;

export const SEARCH_RESULT_LIMIT = 20;

/** Lobby suggestions stay short so the recommendation area remains in view. */
export const LOBBY_SEARCH_RESULT_LIMIT = 8;

export interface SearchHit {
  kind: 'node' | 'link';
  id?: string;
  index?: number;
  title: string;
  subtitle: string;
}

export interface SearchScope {
  nodeIds: ReadonlySet<string>;
  linkIndices: ReadonlySet<number>;
}

const QUERY_FRAGMENT_SEPARATOR = /[/／、\s]+/u;

function searchFragments(values: readonly string[]): string[] {
  return values.flatMap((value) => value.split(QUERY_FRAGMENT_SEPARATOR).filter(Boolean));
}

/**
 * Lobby search across the full graph. Only node labels and aliases participate.
 * Exact fragments beat prefix fragments; middle-of-fragment matches never score.
 */
export function searchNodes(
  query: string,
  nodes: readonly GraphNode[],
): SearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const ranked: Array<{
    node: GraphNode;
    tier: number;
    matchedLength: number;
  }> = [];

  for (const node of nodes) {
    let tier = 0;
    let matchedLength = Number.POSITIVE_INFINITY;
    for (const fragment of searchFragments([node.label, ...(node.aliases ?? [])])) {
      const normalized = fragment.toLowerCase();
      const nextTier =
        normalized === needle
          ? 3
          : normalized.startsWith(needle) && needle.length < normalized.length
            ? 2
            : 0;
      if (nextTier === 0) continue;
      if (nextTier > tier || (nextTier === tier && fragment.length < matchedLength)) {
        tier = nextTier;
        matchedLength = fragment.length;
      }
    }
    if (tier > 0) ranked.push({ node, tier, matchedLength });
  }

  ranked.sort(
    (a, b) =>
      b.tier - a.tier ||
      a.matchedLength - b.matchedLength ||
      a.node.label.localeCompare(b.node.label, 'zh') ||
      a.node.id.localeCompare(b.node.id),
  );

  return ranked.slice(0, LOBBY_SEARCH_RESULT_LIMIT).map(({ node }) => ({
    kind: 'node',
    id: node.id,
    title: node.label,
    subtitle: nodeTypeLabel(node.type),
  }));
}

export function searchGraph(
  query: string,
  graph: GraphData,
  scope?: SearchScope,
): { hits: SearchHit[]; truncated: boolean } {
  const needle = query.trim().toLowerCase();
  if (!needle) return { hits: [], truncated: false };

  const nodeHits: SearchHit[] = [];
  for (const node of graph.nodes) {
    if (scope && !scope.nodeIds.has(node.id)) continue;
    const haystack = [node.label, node.id, ...(node.aliases ?? [])];
    const matched = haystack.some((field) => field.toLowerCase().includes(needle));
    if (!matched) continue;
    nodeHits.push({
      kind: 'node',
      id: node.id,
      title: node.label,
      subtitle: nodeTypeLabel(node.type),
    });
  }

  const linkHits: SearchHit[] = [];
  graph.links.forEach((link, index) => {
    if (scope && !scope.linkIndices.has(index)) return;
    if (!link.relation.toLowerCase().includes(needle)) return;
    linkHits.push({
      kind: 'link',
      index,
      title: link.relation,
      subtitle: '关联',
    });
  });

  const combined = [...nodeHits, ...linkHits];
  return {
    hits: combined.slice(0, SEARCH_RESULT_LIMIT),
    truncated: combined.length > SEARCH_RESULT_LIMIT,
  };
}
