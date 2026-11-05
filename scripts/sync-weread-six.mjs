#!/usr/bin/env node
/**
 * TASK-NS-060: export WeChat Reading info + personal highlights + popular highlights
 * for the six ingested ClearDiet books into data/weread/<source_id>.json.
 *
 * Requires box/dev machine `weread` CLI + WEREAD_API_KEY (env or credentials.env).
 * Never prints or writes the API key. CI must NOT run this script.
 *
 * Usage: node scripts/sync-weread-six.mjs
 * Optional: --skip-admin  (only write weread JSON; do not patch admin_books/sources)
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

import { WEREAD_BOOK_MAP } from './weread-book-map.mjs';
export { WEREAD_BOOK_MAP };

const OUT_DIR = path.join(root, 'data', 'weread');
const ADMIN_BOOKS = path.join(root, 'data', 'admin_books.json');
const SOURCES = path.join(root, 'data', 'sources.json');

function shanghaiIsoNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}+08:00`;
}

function runWeread(args) {
  const result = spawnSync('weread', args, {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    env: process.env,
  });
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || '').trim().slice(0, 400);
    throw new Error(`weread ${args[0]} failed (exit ${result.status}): ${err}`);
  }
  const text = (result.stdout || '').trim();
  if (!text) throw new Error(`weread ${args[0]} returned empty stdout`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`weread ${args[0]} stdout is not JSON`);
  }
}

function pickMeta(info) {
  /** @type {Record<string, unknown>} */
  const meta = {};
  const strKeys = [
    'author',
    'translator',
    'publisher',
    'isbn',
    'cover',
    'publishTime',
    'category',
    'deepLink',
    'readerLink',
  ];
  for (const key of strKeys) {
    const value = info[key];
    if (typeof value === 'string' && value.trim() !== '') meta[key] = value;
  }
  if (typeof info.newRating === 'number') meta.newRating = info.newRating;
  if (typeof info.newRatingCount === 'number') meta.newRatingCount = info.newRatingCount;
  return meta;
}

function buildBookmarks(highlights) {
  const chapters = Array.isArray(highlights.chapters) ? highlights.chapters : [];
  const titleByUid = new Map();
  for (const ch of chapters) {
    if (ch && typeof ch === 'object' && typeof ch.chapterUid === 'number' && typeof ch.title === 'string') {
      titleByUid.set(ch.chapterUid, ch.title);
    }
  }
  const updated = Array.isArray(highlights.updated) ? highlights.updated : [];
  const seen = new Set();
  const bookmarks = [];
  for (const raw of updated) {
    if (!raw || typeof raw !== 'object') continue;
    const bookmarkId = typeof raw.bookmarkId === 'string' ? raw.bookmarkId : '';
    const markText = typeof raw.markText === 'string' ? raw.markText : '';
    if (!bookmarkId || !markText) continue;
    if (seen.has(bookmarkId)) continue;
    seen.add(bookmarkId);
    /** @type {Record<string, unknown>} */
    const row = {
      bookmarkId,
      chapterUid: raw.chapterUid,
      range: typeof raw.range === 'string' ? raw.range : '',
      markText,
      createTime: raw.createTime,
    };
    if (typeof raw.chapterIdx === 'number') row.chapterIdx = raw.chapterIdx;
    const chapterTitle = titleByUid.get(raw.chapterUid);
    if (chapterTitle) row.chapterTitle = chapterTitle;
    if (typeof raw.colorStyle === 'number') row.colorStyle = raw.colorStyle;
    if (typeof raw.type === 'number') row.type = raw.type;
    bookmarks.push(row);
  }
  return bookmarks;
}

function buildBest(best) {
  const itemsRaw = Array.isArray(best.items) ? best.items : [];
  const items = itemsRaw.map((raw) => {
    if (!raw || typeof raw !== 'object') return null;
    /** @type {Record<string, unknown>} */
    const row = {
      bookmarkId: typeof raw.bookmarkId === 'string' ? raw.bookmarkId : '',
      chapterUid: raw.chapterUid,
      range: typeof raw.range === 'string' ? raw.range : '',
      markText: typeof raw.markText === 'string' ? raw.markText : '',
    };
    if (typeof raw.totalCount === 'number') row.totalCount = raw.totalCount;
    if (!row.bookmarkId || !row.markText) return null;
    return row;
  }).filter(Boolean);
  return {
    totalCount: typeof best.totalCount === 'number' ? best.totalCount : items.length,
    items,
  };
}

function syncOne(sourceId, bookId, syncedAt) {
  console.log(`[sync] ${sourceId} bookId=${bookId} …`);
  const info = runWeread(['info', bookId]);
  const highlights = runWeread(['highlights', bookId]);
  const best = runWeread(['call', '/book/bestbookmarks', JSON.stringify({ bookId })]);
  const titleWeread = typeof info.title === 'string' ? info.title : '';
  if (!titleWeread) throw new Error(`${sourceId}: info.title missing`);
  const bookmarks = buildBookmarks(highlights);
  const bestbookmarks = buildBest(best);
  const corpus = {
    schema_version: '1.0',
    source_id: sourceId,
    bookId: String(bookId),
    title_weread: titleWeread,
    synced_at: syncedAt,
    meta: pickMeta(info),
    bookmarks,
    bestbookmarks,
    stats: {
      bookmark_count: bookmarks.length,
      bestbookmark_item_count: bestbookmarks.items.length,
    },
  };
  // Hard ban: never persist reviews/ideas
  if ('review' in corpus || 'reviews' in corpus || 'ideas' in corpus) {
    throw new Error('internal: review fields must not appear');
  }
  const outPath = path.join(OUT_DIR, `${sourceId}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(corpus, null, 2)}\n`, 'utf8');
  console.log(
    `[sync] wrote ${path.relative(root, outPath)} bookmarks=${bookmarks.length} best_items=${bestbookmarks.items.length} best_total=${bestbookmarks.totalCount}`,
  );
  return corpus;
}

function patchAdminAndSources(corpora) {
  const admin = JSON.parse(fs.readFileSync(ADMIN_BOOKS, 'utf8'));
  admin.schema_version = '1.1';
  const byId = new Map(admin.books.map((b) => [b.id, b]));
  for (const [sourceId, bookId] of Object.entries(WEREAD_BOOK_MAP)) {
    const book = byId.get(sourceId);
    if (!book) throw new Error(`admin_books missing ${sourceId}`);
    const corpus = corpora.get(sourceId);
    book.weread_book_id = bookId;
    const meta = corpus?.meta ?? {};
    if (typeof meta.publisher === 'string') book.publisher = meta.publisher;
    if (typeof meta.isbn === 'string') book.isbn = meta.isbn;
    if (typeof meta.cover === 'string') book.cover_url = meta.cover;
    if (typeof meta.translator === 'string') book.translator = meta.translator;
  }
  // Ensure non-six books do not carry empty weread fields
  for (const book of admin.books) {
    if (!WEREAD_BOOK_MAP[book.id]) {
      delete book.weread_book_id;
      // leave publisher/isbn/cover/translator untouched if somehow present on others — none expected
    }
  }
  fs.writeFileSync(ADMIN_BOOKS, `${JSON.stringify(admin, null, 2)}\n`, 'utf8');
  console.log('[sync] updated admin_books.json → schema 1.1');

  const sources = JSON.parse(fs.readFileSync(SOURCES, 'utf8'));
  let urlWrites = 0;
  for (const row of sources.sources) {
    const corpus = corpora.get(row.id);
    if (!corpus) continue;
    const deepLink = corpus.meta?.deepLink;
    if ((!row.url || row.url === '') && typeof deepLink === 'string' && deepLink.startsWith('https://')) {
      row.url = deepLink;
      urlWrites += 1;
    }
  }
  fs.writeFileSync(SOURCES, `${JSON.stringify(sources, null, 2)}\n`, 'utf8');
  console.log(`[sync] sources.json url writes: ${urlWrites} (schema stays 1.1; summaries untouched)`);
}

function main() {
  const skipAdmin = process.argv.includes('--skip-admin');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const syncedAt = shanghaiIsoNow();
  /** @type {Map<string, any>} */
  const corpora = new Map();
  for (const [sourceId, bookId] of Object.entries(WEREAD_BOOK_MAP)) {
    const corpus = syncOne(sourceId, bookId, syncedAt);
    corpora.set(sourceId, corpus);
  }
  if (!skipAdmin) patchAdminAndSources(corpora);
  console.log(`[sync] done at ${syncedAt}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (err) {
    console.error(`[sync] FAILED: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}
