import type { GraphData } from '../types/graph';
import { nodeTypeLabel } from './copy.ts';

/** Spec: debounce at least 200ms. */
export const SEARCH_DEBOUNCE_MS = 250;

export const SEARCH_RESULT_LIMIT = 20;

export interface SearchHit {
  kind: 'node' | 'link';
  id?: string;
  index?: number;
  title: string;
  subtitle: string;
}

export function searchGraph(
  query: string,
  graph: GraphData,
): { hits: SearchHit[]; truncated: boolean } {
  const needle = query.trim().toLowerCase();
  if (!needle) return { hits: [], truncated: false };

  const nodeHits: SearchHit[] = [];
  for (const node of graph.nodes) {
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
