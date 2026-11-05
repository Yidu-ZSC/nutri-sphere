import type { AdminBookRecord, AdminBooksData, AdminBookStatus, AdminRelevance } from '../types/graph.ts';

const RELEVANCE = new Set<AdminRelevance>(['high', 'edge', 'low']);
const STATUS = new Set<AdminBookStatus>(['ingested', 'index_only']);
const ID = /^[a-z0-9_]+$/;
const WEREAD_ID = /^[0-9]+$/;
const ADMIN_SCHEMA = '1.2';

export function adminBooksDataUrl(): string {
  return `${import.meta.env.BASE_URL}data/admin_books.json`;
}

export async function loadAdminBooks(url: string = adminBooksDataUrl()): Promise<AdminBooksData> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('无法连接图书目录文件');
  }
  if (!response.ok) {
    throw new Error(`图书目录请求失败（${response.status}）`);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('图书目录不是合法 JSON');
  }
  return assertAdminBooks(payload);
}

export function assertAdminBooks(payload: unknown): AdminBooksData {
  if (!payload || typeof payload !== 'object') {
    throw new Error('图书目录结构无效');
  }
  const root = payload as Record<string, unknown>;
  if (root.schema_version !== ADMIN_SCHEMA) {
    throw new Error('图书目录 schema_version 无效');
  }
  if (!Array.isArray(root.books)) {
    throw new Error('图书目录缺少 books');
  }
  const books: AdminBookRecord[] = root.books.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`books[${index}] 无效`);
    }
    const row = item as Record<string, unknown>;
    if (
      typeof row.id !== 'string' ||
      typeof row.title !== 'string' ||
      typeof row.theme !== 'string' ||
      typeof row.relevance !== 'string' ||
      typeof row.kb_file !== 'string' ||
      typeof row.status !== 'string'
    ) {
      throw new Error(`books[${index}] 字段不完整`);
    }
    if (Object.prototype.hasOwnProperty.call(row, 'note_count')) {
      throw new Error(`books[${index}] 不得含 note_count`);
    }
    if (!ID.test(row.id)) {
      throw new Error(`books[${index}].id 非法`);
    }
    if (!RELEVANCE.has(row.relevance as AdminRelevance)) {
      throw new Error(`books[${index}].relevance 非法`);
    }
    if (!STATUS.has(row.status as AdminBookStatus)) {
      throw new Error(`books[${index}].status 非法`);
    }
    if ('edge_count' in row) {
      throw new Error(`books[${index}] 不得含 edge_count`);
    }
    const hasSource = typeof row.source_id === 'string' && row.source_id !== '';
    if (hasSource && row.status !== 'ingested') {
      throw new Error(`books[${index}] 有 source_id 时 status 须为 ingested`);
    }
    if (!hasSource && row.status !== 'index_only') {
      throw new Error(`books[${index}] 无 source_id 时 status 须为 index_only`);
    }
    if (hasSource && !ID.test(row.source_id as string)) {
      throw new Error(`books[${index}].source_id 非法`);
    }
    if (row.weread_book_id !== undefined) {
      if (typeof row.weread_book_id !== 'string' || !WEREAD_ID.test(row.weread_book_id)) {
        throw new Error(`books[${index}].weread_book_id 非法`);
      }
    }
    const record: AdminBookRecord = {
      id: row.id,
      title: row.title,
      theme: row.theme,
      relevance: row.relevance as AdminRelevance,
      kb_file: row.kb_file,
      status: row.status as AdminBookStatus,
    };
    if (hasSource) record.source_id = row.source_id as string;
    if (typeof row.authors === 'string') record.authors = row.authors;
    if (typeof row.year === 'number' && Number.isInteger(row.year)) record.year = row.year;
    if (typeof row.weread_book_id === 'string') record.weread_book_id = row.weread_book_id;
    if (typeof row.publisher === 'string') record.publisher = row.publisher;
    if (typeof row.isbn === 'string') record.isbn = row.isbn;
    if (typeof row.cover_url === 'string') record.cover_url = row.cover_url;
    if (typeof row.translator === 'string') record.translator = row.translator;
    return record;
  });
  return { schema_version: ADMIN_SCHEMA, books };
}

export function adminBookById(
  data: AdminBooksData | null | undefined,
  id: string | null | undefined,
): AdminBookRecord | null {
  if (!data || !id) return null;
  return data.books.find((item) => item.id === id) ?? null;
}
