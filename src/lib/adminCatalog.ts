import type { GraphData, GraphLink, GraphNode } from '../types/graph.ts';

export interface AdminEdgeFilters {
  query: string;
  direction: string | 'all';
  strength: string | 'all';
}

export interface AdminNodeFilters {
  query: string;
  type: string | 'all';
}

export interface IndexedLink {
  link: GraphLink;
  index: number;
}

export function defaultAdminEdgeFilters(): AdminEdgeFilters {
  return { query: '', direction: 'all', strength: 'all' };
}

export function defaultAdminNodeFilters(): AdminNodeFilters {
  return { query: '', type: 'all' };
}

export function nodeById(graph: GraphData, id: string): GraphNode | undefined {
  return graph.nodes.find((node) => node.id === id);
}

export function labelOf(graph: GraphData, id: string): string {
  return nodeById(graph, id)?.label ?? id;
}

export function evidenceCount(link: GraphLink): number {
  return link.evidences?.length ?? (link.excerpt ? 1 : 0);
}

export function linkDegree(graph: GraphData, id: string): number {
  return graph.links.filter((link) => link.source === id || link.target === id).length;
}

export function relatedLinks(graph: GraphData, id: string): IndexedLink[] {
  const rows: IndexedLink[] = [];
  graph.links.forEach((link, index) => {
    if (link.source === id || link.target === id) rows.push({ link, index });
  });
  return rows;
}

function matchesQuery(haystack: string, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle);
}

export function filterAdminEdges(
  graph: GraphData,
  filters: AdminEdgeFilters,
): IndexedLink[] {
  const rows: IndexedLink[] = [];
  graph.links.forEach((link, index) => {
    if (filters.direction !== 'all' && link.direction !== filters.direction) return;
    if (filters.strength !== 'all' && (link.strength ?? 'low') !== filters.strength) return;
    const text = [
      labelOf(graph, link.source),
      labelOf(graph, link.target),
      link.relation,
      link.source_title ?? '',
      link.id ?? '',
    ].join(' ');
    if (!matchesQuery(text, filters.query)) return;
    rows.push({ link, index });
  });
  return rows;
}

export function filterAdminNodes(graph: GraphData, filters: AdminNodeFilters): GraphNode[] {
  return graph.nodes.filter((node) => {
    if (filters.type !== 'all' && node.type !== filters.type) return false;
    const text = [node.label, node.id, ...(node.aliases ?? [])].join(' ');
    return matchesQuery(text, filters.query);
  });
}

export function findLinkByKey(graph: GraphData, key: string | null): IndexedLink | null {
  if (!key) return null;
  const parts = key.split('~');
  if (parts.length !== 2) return null;
  const index = graph.links.findIndex((link) => link.source === parts[0] && link.target === parts[1]);
  if (index < 0) return null;
  const link = graph.links[index];
  if (!link) return null;
  return { link, index };
}

export function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
