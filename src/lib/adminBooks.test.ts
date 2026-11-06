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

const THIN: string[] = [
  // NS-078: body_story fully ingested; no remaining thin sources.
];

test('admin_books.json asserts 19 books with twelve ingested after NS-081', () => {
  const payload = readJson('data/admin_books.json');
  const data = assertAdminBooks(payload);
  assert.equal(data.schema_version, '1.2');
  assert.equal(data.books.length, 19);
  const ingested = data.books.filter((book) => book.status === 'ingested');
  assert.equal(ingested.length, 12);
  assert.deepEqual(ingested.map((b) => b.id).sort(), ['amazing_veggie_soup', 'body_story', 'body_unlimited', 'china_study', 'eat_to_heal', 'flow', 'gut_brain', 'how_not_to_die', 'know_your_gut', 'power_of_habit', 'quit_sugar', 'you_are_what_you_eat']);
  for (const id of ['gut_brain', 'eat_to_heal', 'amazing_veggie_soup', 'how_not_to_die', 'china_study', 'you_are_what_you_eat', 'know_your_gut', 'quit_sugar', 'body_story', 'body_unlimited', 'power_of_habit', 'flow']) {
    const book = data.books.find((row) => row.id === id);
    assert.equal(book?.status, 'ingested');
    assert.equal(book?.source_id, id);
  }
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
  assert.equal(ingested.length, 12);
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

test('runtime edge counts after NS-079 body_unlimited ingest', () => {
  const seed = readJson('data/seed_triples_v0.3_aligned.json') as GraphData;
  assert.equal(citingLinks(seed, 'gut_brain').length, 55);
  assert.equal(edgeCountForBook(seed, 'gut_brain'), 55);
  // NS-072 collapse: citingLinks counts unique edges (top-level or evidence cite)
  assert.equal(citingLinks(seed, 'eat_to_heal').length, 87);
  assert.equal(edgeCountForBook(seed, 'eat_to_heal'), 87);
  assert.equal(citingLinks(seed, 'amazing_veggie_soup').length, 70);
  assert.equal(edgeCountForBook(seed, 'amazing_veggie_soup'), 70);
  assert.equal(citingLinks(seed, 'how_not_to_die').length, 131);
  assert.equal(edgeCountForBook(seed, 'how_not_to_die'), 131);
  assert.equal(citingLinks(seed, 'china_study').length, 141);
  assert.equal(edgeCountForBook(seed, 'china_study'), 141);
  assert.equal(citingLinks(seed, 'you_are_what_you_eat').length, 176);
  assert.equal(edgeCountForBook(seed, 'you_are_what_you_eat'), 176);
  assert.equal(citingLinks(seed, 'know_your_gut').length, 219);
  assert.equal(edgeCountForBook(seed, 'know_your_gut'), 219);
  assert.equal(citingLinks(seed, 'quit_sugar').length, 197);
  assert.equal(edgeCountForBook(seed, 'quit_sugar'), 197);
  assert.equal(citingLinks(seed, 'body_story').length, 231);
  assert.equal(edgeCountForBook(seed, 'body_story'), 231);
  assert.equal(citingLinks(seed, 'body_unlimited').length, 201);
  assert.equal(edgeCountForBook(seed, 'body_unlimited'), 201);
  for (const id of THIN) {
    assert.equal(citingLinks(seed, id).length, 0, id);
    assert.equal(edgeCountForBook(seed, id), 0, id);
  }
  assert.equal(edgeCountForBook(seed, undefined), 0);
  assert.equal(edgeCountForBook(null, 'eat_to_heal'), 0);
});

test('kb body sync flag follows files committed under data/kb', () => {
  assert.equal(kbBodySynced('肠道菌群_菌群大脑.md'), true);
  assert.equal(kbBodySynced('植物性饮食与慢病_吃出自愈力.md'), true);
  assert.equal(kbBodySynced('植物性饮食与慢病_惊人的蔬菜汤.md'), true);
  assert.equal(kbBodySynced('植物性饮食与慢病_救命逆转和预防致命疾病的科学饮食.md'), true);
  assert.equal(kbBodySynced('植物性饮食与慢病_救命饮食中国健康调查报告.md'), true);
  assert.equal(kbBodySynced('营养基础_你是你吃出来的.md'), true);
  assert.equal(kbBodySynced('肠道菌群_晓肚知肠.md'), true);
  assert.equal(kbBodySynced('糖与代谢_戒糖.md'), true);
  assert.equal(kbBodySynced('营养基础_人体的故事.md'), true);
  assert.equal(kbBodySynced('身心与疾病_无限可能的身体.md'), true);
});
