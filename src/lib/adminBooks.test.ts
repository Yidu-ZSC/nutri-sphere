import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  defaultAdminBookFilters,
  edgeCountForBook,
  filterAndSortAdminBooks,
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

test('admin_books.json asserts 19 books with six ingested and no edge_count', () => {
  const payload = readJson('data/admin_books.json');
  const data = assertAdminBooks(payload);
  assert.equal(data.schema_version, '1.0');
  assert.equal(data.books.length, 19);
  const ingested = data.books.filter((book) => book.status === 'ingested');
  assert.equal(ingested.length, 6);
  for (const id of [
    'eat_to_heal',
    'how_not_to_die',
    'gut_brain',
    'amazing_veggie_soup',
    'china_study',
    'know_your_gut',
  ]) {
    const book = data.books.find((row) => row.id === id);
    assert.ok(book, id);
    assert.equal(book?.source_id, id);
    assert.equal(book?.status, 'ingested');
  }
  assert.equal(
    data.books.some((book) => Object.prototype.hasOwnProperty.call(book, 'edge_count')),
    false,
  );
});

test('default admin list sort is relevance then note_count desc then title', () => {
  const data = assertAdminBooks(readJson('data/admin_books.json'));
  const rows = filterAndSortAdminBooks(data.books, defaultAdminBookFilters());
  assert.equal(rows[0]?.id, 'gut_brain');
  assert.equal(rows[0]?.note_count, 73);
  const highCount = rows.filter((book) => book.relevance === 'high').length;
  const edgeStart = highCount;
  assert.equal(rows[edgeStart]?.relevance, 'edge');
  const lowStart = rows.findIndex((book) => book.relevance === 'low');
  assert.ok(lowStart > edgeStart);
  for (let i = 1; i < rows.length; i += 1) {
    const prev = rows[i - 1]!;
    const cur = rows[i]!;
    const rank = { high: 0, edge: 1, low: 2 } as const;
    if (rank[prev.relevance] === rank[cur.relevance]) {
      assert.ok(prev.note_count >= cur.note_count);
    } else {
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
  assert.equal(ingested.length, 6);
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

test('runtime edge counts for ingested books match citingLinks', () => {
  const seed = readJson('data/seed_triples_v0.3_aligned.json') as GraphData;
  const expected: Record<string, number> = {
    eat_to_heal: 44,
    gut_brain: 16,
    china_study: 7,
  };
  for (const [id, count] of Object.entries(expected)) {
    assert.equal(citingLinks(seed, id).length, count, id);
    assert.equal(edgeCountForBook(seed, id), count, id);
  }
  assert.equal(edgeCountForBook(seed, undefined), 0);
  assert.equal(edgeCountForBook(null, 'eat_to_heal'), 0);
});
