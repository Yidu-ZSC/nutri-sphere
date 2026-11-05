import type {
  AdminBookRecord,
  AdminBookStatus,
  GraphLink,
  SourceRecord,
} from '../types/graph.ts';

/** Browser-local admin revisions. The public graph keeps reading seed JSON. */
export const ADMIN_DRAFTS_KEY = 'cleardiet.admin.drafts.v1';

const RELATION_MAX = 240;
const TEXT_MAX = 4000;

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface BookFieldDraft {
  authors: string;
  year: string;
  summary: string;
  url: string;
  status: AdminBookStatus;
}

export interface EvidenceFieldDraft {
  excerpt: string;
  limitations: string;
}

export interface EdgeFieldDraft {
  relation: string;
  excerpt: string;
  limitations: string;
  evidences: EvidenceFieldDraft[];
}

export interface AdminDraftFile {
  version: 1;
  books: Record<string, BookFieldDraft>;
  edges: Record<string, EdgeFieldDraft>;
}

export function emptyAdminDrafts(): AdminDraftFile {
  return { version: 1, books: {}, edges: {} };
}

function browserDraftStorage(): DraftStorage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function isStatus(value: unknown): value is AdminBookStatus {
  return value === 'ingested' || value === 'index_only';
}

function isBookDraft(value: unknown): value is BookFieldDraft {
  if (!value || typeof value !== 'object') return false;
  const row = value as BookFieldDraft;
  return (
    typeof row.authors === 'string' &&
    typeof row.year === 'string' &&
    typeof row.summary === 'string' &&
    typeof row.url === 'string' &&
    isStatus(row.status)
  );
}

function isEvidenceDraft(value: unknown): value is EvidenceFieldDraft {
  if (!value || typeof value !== 'object') return false;
  const row = value as EvidenceFieldDraft;
  return typeof row.excerpt === 'string' && typeof row.limitations === 'string';
}

function isEdgeDraft(value: unknown): value is EdgeFieldDraft {
  if (!value || typeof value !== 'object') return false;
  const row = value as EdgeFieldDraft;
  return (
    typeof row.relation === 'string' &&
    typeof row.excerpt === 'string' &&
    typeof row.limitations === 'string' &&
    Array.isArray(row.evidences) &&
    row.evidences.every(isEvidenceDraft)
  );
}

export function parseAdminDrafts(raw: string | null): AdminDraftFile {
  if (!raw) return emptyAdminDrafts();
  try {
    const data = JSON.parse(raw) as Partial<AdminDraftFile>;
    if (data.version !== 1 || !data.books || !data.edges) return emptyAdminDrafts();
    const books: Record<string, BookFieldDraft> = {};
    for (const [id, value] of Object.entries(data.books)) {
      if (isBookDraft(value)) books[id] = value;
    }
    const edges: Record<string, EdgeFieldDraft> = {};
    for (const [id, value] of Object.entries(data.edges)) {
      if (isEdgeDraft(value)) edges[id] = value;
    }
    return { version: 1, books, edges };
  } catch {
    return emptyAdminDrafts();
  }
}

export function readAdminDrafts(storage?: DraftStorage | null): AdminDraftFile {
  const store = storage === undefined ? browserDraftStorage() : storage;
  if (!store) return emptyAdminDrafts();
  try {
    return parseAdminDrafts(store.getItem(ADMIN_DRAFTS_KEY));
  } catch {
    return emptyAdminDrafts();
  }
}

export function writeAdminDrafts(file: AdminDraftFile, storage?: DraftStorage | null): void {
  const store = storage === undefined ? browserDraftStorage() : storage;
  if (!store) return;
  try {
    store.setItem(ADMIN_DRAFTS_KEY, JSON.stringify(file));
  } catch {
    // The caller still keeps the revision in memory for this view.
  }
}

export function bookBaseline(book: AdminBookRecord, source: SourceRecord | null): BookFieldDraft {
  const year = source?.year ?? book.year;
  return {
    authors: source?.authors ?? book.authors ?? '',
    year: year == null ? '' : String(year),
    summary: source?.summary ?? '',
    url: source?.url ?? '',
    status: book.status,
  };
}

export function normalizeBookDraft(draft: BookFieldDraft): BookFieldDraft {
  return {
    authors: draft.authors.trim(),
    year: draft.year.trim(),
    summary: draft.summary.trim(),
    url: draft.url.trim(),
    status: draft.status,
  };
}

export function bookDraftsEqual(a: BookFieldDraft, b: BookFieldDraft): boolean {
  const left = normalizeBookDraft(a);
  const right = normalizeBookDraft(b);
  return (
    left.authors === right.authors &&
    left.year === right.year &&
    left.summary === right.summary &&
    left.url === right.url &&
    left.status === right.status
  );
}

export function validateBookDraft(draft: BookFieldDraft): string | null {
  const next = normalizeBookDraft(draft);
  if (!next.authors) return '请填写作者';
  if (next.authors.length > 200) return '作者超过可保存长度';
  if (next.year && !/^\d{4}$/.test(next.year)) return '出版年请填写四位数字';
  if (next.year) {
    const year = Number(next.year);
    if (year < 1000 || year > 2100) return '出版年请填写四位数字';
  }
  if (next.url && !/^https:\/\/\S+$/.test(next.url)) return '外部链接请使用 https 地址';
  if (next.status === 'ingested' && !next.summary) return '已入库的图书需要简介';
  if (next.summary.length > TEXT_MAX) return '简介超过可保存长度';
  return null;
}

export function saveBookDraft(
  file: AdminDraftFile,
  bookId: string,
  draft: BookFieldDraft,
  baseline: BookFieldDraft,
): AdminDraftFile {
  const books = { ...file.books };
  const next = normalizeBookDraft(draft);
  if (bookDraftsEqual(next, baseline)) delete books[bookId];
  else books[bookId] = next;
  return { version: 1, books, edges: file.edges };
}

export function edgeDraftKey(link: GraphLink): string {
  const id = link.id || link.note_id || `${link.relation}\u001f${(link.excerpt ?? '').slice(0, 80)}`;
  return `${link.source}~${link.target}~${id}`;
}

export function edgeBaseline(link: GraphLink): EdgeFieldDraft {
  const evidences = (link.evidences ?? []).map((item) => ({
    excerpt: item.excerpt ?? '',
    limitations: item.limitations ?? '',
  }));
  return {
    relation: link.relation,
    excerpt: link.excerpt ?? evidences[0]?.excerpt ?? '',
    limitations: link.limitations ?? evidences[0]?.limitations ?? '',
    evidences,
  };
}

export function presentEdge(link: GraphLink, draft: EdgeFieldDraft | null | undefined): EdgeFieldDraft {
  return draft ?? edgeBaseline(link);
}

export function normalizeEdgeDraft(draft: EdgeFieldDraft): EdgeFieldDraft {
  const evidences = draft.evidences.map((item) => ({
    excerpt: item.excerpt.trim(),
    limitations: item.limitations.trim(),
  }));
  const first = evidences[0];
  return {
    relation: draft.relation.trim(),
    excerpt: (first?.excerpt ?? draft.excerpt).trim(),
    limitations: (first?.limitations ?? draft.limitations).trim(),
    evidences,
  };
}

export function edgeDraftsEqual(a: EdgeFieldDraft, b: EdgeFieldDraft): boolean {
  const left = normalizeEdgeDraft(a);
  const right = normalizeEdgeDraft(b);
  if (left.relation !== right.relation || left.excerpt !== right.excerpt || left.limitations !== right.limitations) {
    return false;
  }
  if (left.evidences.length !== right.evidences.length) return false;
  return left.evidences.every(
    (item, index) =>
      item.excerpt === right.evidences[index]?.excerpt && item.limitations === right.evidences[index]?.limitations,
  );
}

export function validateEdgeDraft(draft: EdgeFieldDraft): string | null {
  const next = normalizeEdgeDraft(draft);
  if (!next.relation) return '请填写关系表述';
  if (next.relation.length > RELATION_MAX) return '关系表述超过可保存长度';
  const rows = next.evidences.length > 0 ? next.evidences : [{ excerpt: next.excerpt, limitations: next.limitations }];
  for (const row of rows) {
    if (!row.excerpt) return '请填写原文摘录';
    if (!row.limitations) return '请填写局限';
    if (row.excerpt.length > TEXT_MAX || row.limitations.length > TEXT_MAX) return '摘录或局限超过可保存长度';
  }
  return null;
}

export function saveEdgeDraft(
  file: AdminDraftFile,
  key: string,
  draft: EdgeFieldDraft,
  baseline: EdgeFieldDraft,
): AdminDraftFile {
  const edges = { ...file.edges };
  const next = normalizeEdgeDraft(draft);
  if (edgeDraftsEqual(next, baseline)) delete edges[key];
  else edges[key] = next;
  return { version: 1, books: file.books, edges };
}

export function citeMatches(
  link: GraphLink,
  draft: EdgeFieldDraft | null | undefined,
  sourceLabel: string,
  targetLabel: string,
  query: string,
  direction: string,
): boolean {
  if (direction !== 'all' && link.direction !== direction) return false;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const shown = presentEdge(link, draft);
  const hay = [sourceLabel, targetLabel, shown.relation, link.source_title ?? ''].join('\n').toLowerCase();
  return hay.includes(needle);
}
