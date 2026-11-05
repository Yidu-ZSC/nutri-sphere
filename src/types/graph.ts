export interface GraphMeta {
  schema_version?: string;
  data_version?: string;
  disclaimer?: string;
  extracted_from?: string;
  extraction_date?: string;
  note?: string;
}

/** Content fit of an edge. Not a presentation switch. */
export type Audience = 'general' | 'deep_reader';

/** Narrative depth of a mechanism node. Stored as words so it is not read as strength. */
export type MechanismDepth = 'summary' | 'mechanism' | 'technical';

/** Theme domain. Seed writes required; omitted-at-runtime means health. Not ViewLayer, not evidence grade, not audience. */
export type Domain = 'health' | 'environment' | 'culture';

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  group: string;
  /** Theme domain. Omitted means health at read time. Not ViewLayer. */
  domain?: Domain;
  description?: string;
  aliases?: string[];
  sources?: string[];
  /** Narrative depth. Omitted means summary. Not an evidence grade and not ViewLayer. */
  mechanism_depth?: MechanismDepth;
  metadata?: Record<string, unknown>;
}

/** Optional literature identifier. doi or pmid is required when the object is present. */
export interface GraphCitation {
  title?: string;
  authors?: string;
  year?: number;
  doi?: string;
  pmid?: string;
  url?: string;
}

/** One evidence item on an edge (schema 0.5). Top-level link fields mirror evidences[0]. */
export interface GraphEvidence {
  excerpt: string;
  source_title: string;
  source_file: string;
  /** Book id into data/sources.json. Absent on literature evidence. */
  source_id?: string;
  note_id?: string;
  citation?: GraphCitation;
  /** WeRead bookmark id when evidence came from data/weread (NS-061). */
  weread_bookmark_id?: string;
  weread_chapter_title?: string;
  weread_origin?: 'personal' | 'best';
}

export interface GraphLink {
  id?: string;
  source: string;
  target: string;
  relation: string;
  direction: string;
  /** Theme domain. Omitted means health at read time. Not ViewLayer. */
  domain?: Domain;
  evidence_type: string;
  strength?: string;
  weight?: number;
  source_file?: string;
  /** User-visible book or literature title (schema 0.4+). */
  source_title?: string;
  /** Book id into data/sources.json. Absent on literature edges. */
  source_id?: string;
  note_id?: string;
  excerpt?: string;
  dose_response?: string;
  population?: string;
  /** Who this edge is written for. Omitted means general. Not ViewLayer. */
  audience?: Audience;
  citation?: GraphCitation;
  /** Multi-evidence array (schema 0.5). Required; top-level fields mirror [0]. */
  evidences?: GraphEvidence[];
  metadata?: Record<string, unknown>;
}

export type SourceType = 'book' | 'review' | 'paper';

export interface SourceRecord {
  id: string;
  title: string;
  authors: string;
  year: number;
  type: SourceType;
  summary: string;
  /** Optional public https URL. Never show `file` in UI. */
  url?: string;
  file: string;
}

export interface SourcesData {
  schema_version: string;
  sources: SourceRecord[];
}

export interface GraphData {
  meta: GraphMeta;
  nodes: GraphNode[];
  links: GraphLink[];
}

export type Selection =
  | { kind: 'node'; id: string }
  | { kind: 'link'; index: number };

export interface SimNode extends GraphNode {
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  /** Layout Y before a canvas-down flip. Label windows stay in this space. */
  layoutY?: number;
}

export interface SimLink extends Omit<GraphLink, 'source' | 'target'> {
  source: string | SimNode;
  target: string | SimNode;
}

export type AdminRelevance = 'high' | 'edge' | 'low';
export type AdminBookStatus = 'ingested' | 'index_only';

export interface AdminBookRecord {
  id: string;
  title: string;
  theme: string;
  relevance: AdminRelevance;
  /** Removed from admin_books 1.2 (NS-066); optional for older drafts. */
  note_count?: number;
  kb_file: string;
  source_id?: string;
  authors?: string;
  year?: number;
  status: AdminBookStatus;
  /** WeChat Reading bookId for the six ingested books (admin_books 1.1). */
  weread_book_id?: string;
  publisher?: string;
  isbn?: string;
  cover_url?: string;
  translator?: string;
}

export interface WereadBookmark {
  bookmarkId: string;
  chapterUid: number;
  chapterIdx?: number;
  chapterTitle?: string;
  range: string;
  markText: string;
  createTime: number;
  colorStyle?: number;
  type?: number;
}

export interface WereadBestBookmarkItem {
  bookmarkId: string;
  chapterUid: number;
  range: string;
  markText: string;
  totalCount?: number;
}

export interface WereadCorpus {
  schema_version: string;
  source_id: string;
  bookId: string;
  title_weread: string;
  synced_at: string;
  meta: Record<string, unknown>;
  bookmarks: WereadBookmark[];
  bestbookmarks: {
    totalCount: number;
    items: WereadBestBookmarkItem[];
  };
  stats: {
    bookmark_count: number;
    bestbookmark_item_count: number;
  };
}

export interface AdminBooksData {
  schema_version: string;
  books: AdminBookRecord[];
}
