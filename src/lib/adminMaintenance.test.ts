import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bookBaseline,
  bookDraftsEqual,
  citeMatches,
  edgeBaseline,
  edgeDraftKey,
  emptyAdminDrafts,
  normalizeEdgeDraft,
  parseAdminDrafts,
  presentEdge,
  readAdminDrafts,
  saveBookDraft,
  saveEdgeDraft,
  validateBookDraft,
  validateEdgeDraft,
  writeAdminDrafts,
  type BookFieldDraft,
  type DraftStorage,
  type EdgeFieldDraft,
} from './adminMaintenance.ts';
import type { AdminBookRecord, GraphLink, SourceRecord } from '../types/graph.ts';

class MemoryStorage implements DraftStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const book: AdminBookRecord = {
  id: 'gut_brain',
  title: '菌群大脑',
  theme: '肠道菌群',
  relevance: 'high',
  note_count: 73,
  kb_file: '肠道菌群_菌群大脑.md',
  source_id: 'gut_brain',
  status: 'ingested',
  authors: '目录作者',
};

const source: SourceRecord = {
  id: 'gut_brain',
  title: '菌群大脑',
  authors: '戴维·珀尔马特',
  year: 2018,
  type: 'book',
  summary: '教育向对照。',
  url: 'https://example.com/gut',
  file: 'data/kb/肠道菌群_菌群大脑.md',
};

function link(partial: Partial<GraphLink> = {}): GraphLink {
  return {
    source: 'coffee',
    target: 'polyphenols',
    relation: '提供多酚',
    direction: 'protective',
    evidence_type: 'book_notes_mechanistic',
    excerpt: '原文一句。',
    note_id: 'note-1',
    evidences: [
      {
        excerpt: '原文一句。',
        source_title: '菌群大脑',
        source_file: 'data/kb/肠道菌群_菌群大脑.md',
      },
    ],
    ...partial,
  };
}

test('parseAdminDrafts drops garbage and keeps valid rows', () => {
  assert.deepEqual(parseAdminDrafts(null), emptyAdminDrafts());
  assert.deepEqual(parseAdminDrafts('{'), emptyAdminDrafts());
  assert.deepEqual(parseAdminDrafts('{"version":2}'), emptyAdminDrafts());
  const parsed = parseAdminDrafts(
    JSON.stringify({
      version: 1,
      books: {
        gut_brain: {
          authors: '甲',
          year: '2018',
          summary: '简介',
          url: '',
          status: 'ingested',
        },
        bad: { authors: 1 },
      },
      edges: {
        ok: {
          relation: '相关',
          excerpt: '摘录',
          evidences: [],
        },
        bad: { relation: '缺字段' },
      },
    }),
  );
  assert.equal(parsed.books.gut_brain?.authors, '甲');
  assert.equal(parsed.books.bad, undefined);
  assert.equal(parsed.edges.ok?.relation, '相关');
  assert.equal(parsed.edges.bad, undefined);
});

test('book drafts round-trip and clear when they match the seed', () => {
  const storage = new MemoryStorage();
  const baseline = bookBaseline(book, source);
  assert.equal(baseline.authors, '戴维·珀尔马特');
  assert.equal(baseline.year, '2018');
  const edited: BookFieldDraft = { ...baseline, summary: '改过的简介。' };
  const stored = saveBookDraft(emptyAdminDrafts(), book.id, edited, baseline);
  writeAdminDrafts(stored, storage);
  const read = readAdminDrafts(storage);
  assert.equal(read.books.gut_brain?.summary, '改过的简介。');
  const cleared = saveBookDraft(read, book.id, baseline, baseline);
  assert.equal(cleared.books.gut_brain, undefined);
  assert.equal(validateBookDraft({ ...baseline, year: '18' }), '出版年请填写四位数字');
  assert.equal(validateBookDraft({ ...baseline, url: 'http://example.com' }), '外部链接请使用 https 地址');
  assert.equal(validateBookDraft({ ...baseline, summary: '  ' }), '已入库的图书需要简介');
  assert.equal(validateBookDraft({ ...baseline, authors: '  ' }), '请填写作者');
  assert.equal(bookDraftsEqual({ ...baseline, summary: ' 教育向对照。 ' }, baseline), true);
});

test('edge drafts keep identity on note_id and mirror the first evidence', () => {
  const row = link();
  const other = link({ note_id: 'note-2', relation: '另一条' });
  assert.notEqual(edgeDraftKey(row), edgeDraftKey(other));
  assert.equal(edgeDraftKey(row), edgeDraftKey({ ...row, relation: '改关系不影响键' }));
  const baseline = edgeBaseline(row);
  const edited: EdgeFieldDraft = {
    relation: '多酚相关',
    excerpt: '会被第一条证据覆盖',
    evidences: [{ excerpt: ' 新摘录 ' }],
  };
  const normalized = normalizeEdgeDraft(edited);
  assert.equal(normalized.excerpt, '新摘录');
  assert.equal(validateEdgeDraft({ ...edited, evidences: [{ excerpt: ' ' }] }), '请填写原文摘录');
  const stored = saveEdgeDraft(emptyAdminDrafts(), edgeDraftKey(row), edited, baseline);
  assert.equal(stored.edges[edgeDraftKey(row)]?.relation, '多酚相关');
  assert.equal(presentEdge(row, stored.edges[edgeDraftKey(row)]).excerpt, '新摘录');
  const cleared = saveEdgeDraft(stored, edgeDraftKey(row), baseline, baseline);
  assert.equal(cleared.edges[edgeDraftKey(row)], undefined);
});

test('cite search uses the revised relation and the direction filter', () => {
  const row = link();
  const draft: EdgeFieldDraft = { ...edgeBaseline(row), relation: '独有检索词' };
  assert.equal(citeMatches(row, draft, '咖啡', '多酚', '独有', 'all'), true);
  assert.equal(citeMatches(row, null, '咖啡', '多酚', '独有', 'all'), false);
  assert.equal(citeMatches(row, null, '咖啡', '多酚', '咖啡', 'risk'), false);
  assert.equal(citeMatches(row, null, '咖啡', '多酚', '', 'protective'), true);
});
