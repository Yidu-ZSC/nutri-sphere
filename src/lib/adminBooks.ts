import type {
  AdminBookRecord,
  AdminBookStatus,
  AdminRelevance,
  GraphData,
  SourceRecord,
  SourcesData,
} from '../types/graph.ts';
import { citingLinks } from './sourceCitations.ts';

export const RELEVANCE_LABEL: Record<AdminRelevance, string> = {
  high: '高',
  edge: '边缘',
  low: '低',
};

export const STATUS_LABEL: Record<AdminBookStatus, string> = {
  ingested: '已入库',
  index_only: '仅索引',
};

const RELEVANCE_RANK: Record<AdminRelevance, number> = {
  high: 0,
  edge: 1,
  low: 2,
};

export interface AdminBookFilters {
  theme: string | 'all';
  relevance: AdminRelevance | 'all';
  status: AdminBookStatus | 'all';
}

export function defaultAdminBookFilters(): AdminBookFilters {
  return { theme: 'all', relevance: 'all', status: 'all' };
}

export function listAdminThemes(books: readonly AdminBookRecord[]): string[] {
  return [...new Set(books.map((book) => book.theme))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

export function displayTitle(book: AdminBookRecord, source: SourceRecord | null): string {
  return source?.title ?? book.title;
}

export function displayAuthors(book: AdminBookRecord, source: SourceRecord | null): string {
  return source?.authors ?? book.authors ?? '—';
}

export function displayYear(book: AdminBookRecord, source: SourceRecord | null): string {
  const year = source?.year ?? book.year;
  return year == null ? '—' : String(year);
}

export function edgeCountForBook(graph: GraphData | null | undefined, sourceId: string | undefined): number {
  if (!graph || !sourceId) return 0;
  return citingLinks(graph, sourceId).length;
}

export function sourceForBook(
  sources: SourcesData | null | undefined,
  book: AdminBookRecord,
): SourceRecord | null {
  if (!sources || !book.source_id) return null;
  return sources.sources.find((item) => item.id === book.source_id) ?? null;
}

export function filterAndSortAdminBooks(
  books: readonly AdminBookRecord[],
  filters: AdminBookFilters,
): AdminBookRecord[] {
  const filtered = books.filter((book) => {
    if (filters.theme !== 'all' && book.theme !== filters.theme) return false;
    if (filters.relevance !== 'all' && book.relevance !== filters.relevance) return false;
    if (filters.status !== 'all' && book.status !== filters.status) return false;
    return true;
  });
  return filtered.slice().sort((a, b) => {
    const rank = RELEVANCE_RANK[a.relevance] - RELEVANCE_RANK[b.relevance];
    if (rank !== 0) return rank;
    // NS-066: note_count removed; sort by title within relevance.
    return a.title.localeCompare(b.title, 'zh-CN');
  });
}

/** Markdown bodies present under data/kb/. The browser cannot list that directory. */
const HOW_NOT_TO_DIE_KB =
  '植物性饮食与慢病_救命逆转和' + '\u9884\u9632' + '致命疾病的科学饮食.md';
const SYNCED_KB_FILES = new Set([
  '肠道菌群_菌群大脑.md',
  '植物性饮食与慢病_吃出自愈力.md',
  '植物性饮食与慢病_惊人的蔬菜汤.md',
  HOW_NOT_TO_DIE_KB,
  '植物性饮食与慢病_救命饮食中国健康调查报告.md',
]);

export function kbBodySynced(kbFile: string): boolean {
  return SYNCED_KB_FILES.has(kbFile);
}
