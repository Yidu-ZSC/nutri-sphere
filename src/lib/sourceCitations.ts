import type { GraphData, GraphLink } from '../types/graph';

/** Links that cite a book source (top-level source_id or any evidence.source_id). Deduped; sorted by links index. */
export function citingLinks(
  graph: GraphData,
  sourceId: string,
): { link: GraphLink; index: number }[] {
  return graph.links
    .map((link, index) => ({ link, index }))
    .filter(({ link }) => {
      if (link.source_id === sourceId) return true;
      return (link.evidences ?? []).some((ev) => ev.source_id === sourceId);
    });
}

export type SourceDirFilter = 'all' | 'protective' | 'risk';

export function filterCitingByDirection(
  items: { link: GraphLink; index: number }[],
  filter: SourceDirFilter,
): { link: GraphLink; index: number }[] {
  if (filter === 'all') return items;
  return items.filter(({ link }) => link.direction === filter);
}

export const SOURCE_TYPE_LABEL: Record<string, string> = {
  book: '图书',
  review: '综述',
  paper: '论文',
};

export function sourceTypeLabel(type: string): string {
  return SOURCE_TYPE_LABEL[type] ?? type;
}
