import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  defaultAdminBookFilters,
  edgeCountForBook,
  filterAndSortAdminBooks,
  kbBodySynced,
  RELEVANCE_LABEL,
  STATUS_LABEL,
} from './adminBooks.ts';
import { assertAdminBooks } from './loadAdminBooks.ts';
import { citingLinks } from './sourceCitations.ts';
import type { GraphData } from '../types/graph.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function readJson(rel: string) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

const THIN = [
  'eat_to_heal',
  'how_not_to_die',
  'amazing_veggie_soup',
  'china_study',
  'know_your_gut',
];

test('admin_books.json asserts 19 books with one ingested (gut_brain) after NS-066', () => {
  const payload = readJson('data/admin_books.json');
  const data = assertAdminBooks(payload);
  assert.equal(data.schema_version, '1.2');
  assert.equal(data.books.length, 19);
  const ingested = data.books.filter((book) => book.status === 'ingested');
  assert.equal(ingested.length, 1);
  assert.equal(ingested[0]?.id, 'gut_brain');
  assert.equal(ingested[0]?.source_id, 'gut_brain');
  for (const id of THIN) {
    const book = data.books.find((row) => row.id === id);
    assert.ok(book, id);
    assert.equal(book?.status, 'index_only');
    assert.equal(book?.source_id, undefined);
  }
  assert.equal(
    data.books.some((book) => Object.prototype.hasOwnProperty.call(book, 'edge_count')),
    false,
  );
  assert.equal(
    data.books.some((book) => Object.prototype.hasOwnProperty.call(book, 'note_count')),
    false,
  );
  assert.equal(
    data.books.some((book) => Object.prototype.hasOwnProperty.call(book, 'weread_book_id')),
    false,
  );
});

test('default admin list sort is relevance then title (NS-066)', () => {
  const data = assertAdminBooks(readJson('data/admin_books.json'));
  const rows = filterAndSortAdminBooks(data.books, defaultAdminBookFilters());
  assert.equal(rows[0]?.relevance, 'high');
  const high = rows.filter((book) => book.relevance === 'high');
  for (let i = 1; i < high.length; i += 1) {
    assert.ok(high[i - 1]!.title.localeCompare(high[i]!.title, 'zh-CN') <= 0);
  }
  const edgeStart = high.length;
  assert.equal(rows[edgeStart]?.relevance, 'edge');
  const lowStart = rows.findIndex((book) => book.relevance === 'low');
  assert.ok(lowStart > edgeStart);
  for (let i = 1; i < rows.length; i += 1) {
    const prev = rows[i - 1]!;
    const cur = rows[i]!;
    const rank = { high: 0, edge: 1, low: 2 } as const;
    if (rank[prev.relevance] !== rank[cur.relevance]) {
      assert.ok(rank[prev.relevance] < rank[cur.relevance]);
    }
  }
});

test('admin filters theme / relevance / status', () => {
  const data = assertAdminBooks(readJson('data/admin_books.json'));
  const ingested = filterAndSortAdminBooks(data.books, {
    theme: 'all',
    relevance: 'all',
    status: 'ingested',
  });
  assert.equal(ingested.length, 1);
  const gut = filterAndSortAdminBooks(data.books, {
    theme: '肠道菌群',
    relevance: 'all',
    status: 'all',
  });
  assert.equal(gut.length, 3);
  const low = filterAndSortAdminBooks(data.books, {
    theme: 'all',
    relevance: 'low',
    status: 'all',
  });
  assert.equal(low.length, 4);
  assert.equal(RELEVANCE_LABEL.high, '高');
  assert.equal(STATUS_LABEL.index_only, '仅索引');
});

test('runtime edge counts: only gut_brain has booknote edges after NS-066', () => {
  const seed = readJson('data/seed_triples_v0.3_aligned.json') as GraphData;
  assert.equal(citingLinks(seed, 'gut_brain').length, 55);
  assert.equal(edgeCountForBook(seed, 'gut_brain'), 55);
  for (const id of THIN) {
    assert.equal(citingLinks(seed, id).length, 0, id);
    assert.equal(edgeCountForBook(seed, id), 0, id);
  }
  assert.equal(edgeCountForBook(seed, undefined), 0);
  assert.equal(edgeCountForBook(null, 'eat_to_heal'), 0);
});

test('kb body sync flag follows files committed under data/kb', () => {
  assert.equal(kbBodySynced('肠道菌群_菌群大脑.md'), true);
  assert.equal(kbBodySynced('肠道菌群_晓肚知肠.md'), false);
});
