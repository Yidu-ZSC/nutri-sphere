import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { WEREAD_BOOK_MAP, WEREAD_SOURCE_IDS } from './weread-book-map.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Phase 1 gates this aligned seed only. Older seed files are not schema-complete. */
export const ALIGNED_SEED = 'data/seed_triples_v0.3_aligned.json';
export const GRAPH_SCHEMA = 'data/graph_schema.json';
export const SOURCES_FILE = 'data/sources.json';
export const ADMIN_BOOKS_FILE = 'data/admin_books.json';
export const WEREAD_DIR = 'data/weread';


const EXCERPT_LIMIT = 1200;
const STAGE1_SOURCE_IDS = [
  'eat_to_heal',
  'how_not_to_die',
  'gut_brain',
  'amazing_veggie_soup',
  'china_study',
  'you_are_what_you_eat',
  'know_your_gut',
  'quit_sugar',
];

/**
 * @param {unknown} data
 * @param {object} schema
 * @param {{ sourcesPayload?: unknown }} [options]
 * @returns {{ ok: boolean, errors: string[], warnings: string[], counts: { nodes: number, links: number } }}
 */
export function validateGraphData(data, schema, options = {}) {
  const errors = [];
  const warnings = [];
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    for (const issue of validate.errors ?? []) {
      errors.push(`${issue.instancePath || '/'} ${issue.message ?? 'schema 校验失败'}`.trim());
    }
  }

  const record = data && typeof data === 'object' ? /** @type {Record<string, unknown>} */ (data) : null;
  const nodes = Array.isArray(record?.nodes) ? record.nodes : [];
  const links = Array.isArray(record?.links) ? record.links : [];
  const ids = new Set();

  nodes.forEach((node, index) => {
    if (!node || typeof node !== 'object') return;
    const row = /** @type {{ id?: unknown, type?: unknown, mechanism_depth?: unknown }} */ (node);
    const id = row.id;
    if (typeof id === 'string' && id !== '') {
      if (ids.has(id)) errors.push(`nodes[${index}].id "${id}" 重复`);
      ids.add(id);
    }
    if (row.type !== 'mechanism' && row.mechanism_depth === 'technical') {
      const label = typeof id === 'string' && id !== '' ? ` "${id}"` : '';
      warnings.push(
        `nodes[${index}]${label} type 不是 mechanism，却将 mechanism_depth 标为 technical`,
      );
    }
  });

  /** @type {Map<string, { id: string, title: string, file: string }>} */
  const sourcesById = new Map();
  const sourcesPayload =
    options.sourcesPayload !== undefined
      ? options.sourcesPayload
      : JSON.parse(fs.readFileSync(path.join(root, SOURCES_FILE), 'utf8'));
  if (!sourcesPayload || typeof sourcesPayload !== 'object') {
    errors.push('sources.json 无法解析');
  } else {
    const sourcesRoot = /** @type {Record<string, unknown>} */ (sourcesPayload);
    if (sourcesRoot.schema_version !== '1.1') {
      errors.push('sources.json schema_version 必须为 "1.1"');
    }
    const list = Array.isArray(sourcesRoot.sources) ? sourcesRoot.sources : null;
    if (!list) {
      errors.push('sources.json 缺少 sources 数组');
    } else {
      if (list.length !== STAGE1_SOURCE_IDS.length) {
        errors.push(
          `sources.json 应恰有 ${STAGE1_SOURCE_IDS.length} 本书，实际 ${list.length}`,
        );
      }
      const allowedTypes = new Set(['book', 'review', 'paper']);
      const seen = new Set();
      for (const [index, raw] of list.entries()) {
        if (!raw || typeof raw !== 'object') {
          errors.push(`sources[${index}] 非法`);
          continue;
        }
        const row = /** @type {Record<string, unknown>} */ (raw);
        const id = typeof row.id === 'string' ? row.id : '';
        const title = typeof row.title === 'string' ? row.title : '';
        const file = typeof row.file === 'string' ? row.file : '';
        const authors = typeof row.authors === 'string' ? row.authors.trim() : '';
        const year = row.year;
        const type = typeof row.type === 'string' ? row.type.trim() : '';
        const summary = typeof row.summary === 'string' ? row.summary.trim() : '';
        if (!/^[a-z0-9_]+$/.test(id)) {
          errors.push(`sources[${index}].id 非法`);
          continue;
        }
        if (seen.has(id)) errors.push(`sources[${index}].id "${id}" 重复`);
        seen.add(id);
        if (!title) errors.push(`sources[${index}] 缺少 title`);
        if (!file) errors.push(`sources[${index}] 缺少 file`);
        if (!authors) errors.push(`sources[${index}] 缺少 authors`);
        if (typeof year !== 'number' || !Number.isInteger(year)) {
          errors.push(`sources[${index}] 缺少 year`);
        }
        if (!allowedTypes.has(type)) {
          errors.push(`sources[${index}] type 必须为 book|review|paper`);
        }
        if (!summary || summary.length < 40) {
          errors.push(`sources[${index}] 缺少合格 summary（至少约 40 字）`);
        } else {
          const sentenceMarks = (summary.match(/[。！？]/g) ?? []).length;
          if (sentenceMarks < 2) {
            errors.push(`sources[${index}].summary 须至少两句`);
          }
        }
        if (Object.prototype.hasOwnProperty.call(row, 'description')) {
          errors.push(`sources[${index}] 不得保留 description`);
        }
        if (Object.prototype.hasOwnProperty.call(row, 'edge_count')) {
          errors.push(`sources[${index}] 不得写入 edge_count`);
        }
        if (row.url !== undefined) {
          if (typeof row.url !== 'string' || !/^https:\/\//.test(row.url)) {
            errors.push(`sources[${index}].url 须以 https:// 开头`);
          }
        }
        sourcesById.set(id, { id, title, file });
      }
      for (const expected of STAGE1_SOURCE_IDS) {
        if (!sourcesById.has(expected)) {
          errors.push(`sources.json 缺少阶段 1 书目 id "${expected}"`);
        }
      }
      for (const id of sourcesById.keys()) {
        if (!STAGE1_SOURCE_IDS.includes(id)) {
          errors.push(`sources.json 含阶段 1 以外的 id "${id}"`);
        }
      }
    }
  }

  /**
   * @param {Record<string, unknown>} ev
   * @param {string} path
   * @param {{ enforceBookNotesType?: boolean }} [opts]
   */
  function validateEvidenceFields(ev, path, opts = {}) {
    if (typeof ev.excerpt !== 'string' || ev.excerpt.trim() === '') {
      errors.push(`${path} 缺少 excerpt`);
    } else if (ev.excerpt.length > EXCERPT_LIMIT) {
      errors.push(`${path}.excerpt 长度为 ${ev.excerpt.length}，超过 ${EXCERPT_LIMIT}`);
    }
    if (typeof ev.source_title !== 'string' || ev.source_title.trim() === '') {
      errors.push(`${path} 缺少 source_title`);
    }
    const sourceFile = typeof ev.source_file === 'string' ? ev.source_file : '';
    if (!sourceFile) {
      errors.push(`${path} 缺少 source_file`);
    } else if (sourceFile === 'literature') {
      if (ev.source_id != null) {
        errors.push(`${path} literature 不得带 source_id`);
      }
      if (ev.citation == null) {
        errors.push(`${path} literature 需要 citation`);
      } else {
        const citation = ev.citation;
        const title =
          citation && typeof citation === 'object' && !Array.isArray(citation) && typeof citation.title === 'string'
            ? citation.title
            : '';
        if (typeof ev.source_title === 'string' && title && ev.source_title !== title) {
          errors.push(`${path}.source_title 必须等于 citation.title`);
        }
      }
    } else {
      const sourceId = typeof ev.source_id === 'string' ? ev.source_id : '';
      if (!sourceId) {
        errors.push(`${path} 图书证据缺少 source_id`);
      } else {
        const book = sourcesById.get(sourceId);
        if (!book) {
          errors.push(`${path}.source_id "${sourceId}" 不在 sources.json`);
        } else {
          if (typeof ev.source_title === 'string' && ev.source_title !== book.title) {
            errors.push(`${path}.source_title 须与 sources[].title 一致`);
          }
          const wereadFile = `weread/${sourceId}.json`;
          if (sourceFile !== book.file && sourceFile !== wereadFile) {
            errors.push(
              `${path}.source_file 须与 sources[].file 一致或为 weread/<source_id>.json（NS-061）`,
            );
          }
          if (sourceFile === wereadFile) {
            const bm = typeof ev.weread_bookmark_id === 'string' ? ev.weread_bookmark_id.trim() : '';
            if (!bm) {
              errors.push(`${path} weread source_file 须带 weread_bookmark_id`);
            }
            const origin = ev.weread_origin;
            if (origin != null && origin !== 'personal' && origin !== 'best') {
              errors.push(`${path}.weread_origin 须为 personal|best`);
            }
          }
        }
      }
      if (ev.citation != null) {
        errors.push(`${path} 图书证据不得带 citation`);
      }
    }
    if (ev.citation != null) {
      const citation = ev.citation;
      const doi =
        citation && typeof citation === 'object' && !Array.isArray(citation) && typeof citation.doi === 'string'
          ? citation.doi.trim()
          : '';
      const pmid =
        citation && typeof citation === 'object' && !Array.isArray(citation) && typeof citation.pmid === 'string'
          ? citation.pmid.trim()
          : '';
      if (!doi && !pmid) {
        errors.push(`${path}.citation 需要非空 doi 或 pmid`);
      }
    }
  }

  links.forEach((link, index) => {
    if (!link || typeof link !== 'object') return;
    const row = /** @type {Record<string, unknown>} */ (link);
    if (typeof row.source === 'string' && !ids.has(row.source)) {
      errors.push(`links[${index}].source "${row.source}" 不存在于 nodes[].id`);
    }
    if (typeof row.target === 'string' && !ids.has(row.target)) {
      errors.push(`links[${index}].target "${row.target}" 不存在于 nodes[].id`);
    }
    if (!Array.isArray(row.evidences) || row.evidences.length < 1) {
      errors.push(`links[${index}] 需要 evidences 数组（长度 ≥ 1）`);
      return;
    }
    row.evidences.forEach((raw, ei) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        errors.push(`links[${index}].evidences[${ei}] 非法`);
        return;
      }
      validateEvidenceFields(/** @type {Record<string, unknown>} */ (raw), `links[${index}].evidences[${ei}]`);
    });
    const ev0 = /** @type {Record<string, unknown>} */ (row.evidences[0]);
    // top-level mirror of evidences[0]
    for (const key of ['excerpt', 'source_title', 'source_file']) {
      if (row[key] !== ev0[key]) {
        errors.push(`links[${index}].${key} 须与 evidences[0].${key} 镜像一致`);
      }
    }
    if (ev0.source_id != null) {
      if (row.source_id !== ev0.source_id) {
        errors.push(`links[${index}].source_id 须与 evidences[0].source_id 镜像一致`);
      }
    } else if (row.source_id != null) {
      errors.push(`links[${index}] evidences[0] 无 source_id 时顶层不得有 source_id`);
    }
    if (ev0.citation != null) {
      if (JSON.stringify(row.citation) !== JSON.stringify(ev0.citation)) {
        errors.push(`links[${index}].citation 须与 evidences[0].citation 镜像一致`);
      }
    } else if (row.citation != null) {
      errors.push(`links[${index}] evidences[0] 无 citation 时顶层不得有 citation`);
    }
    if (row.citation != null) {
      if (typeof row.evidence_type === 'string' && row.evidence_type.startsWith('book_notes_')) {
        errors.push(`links[${index}] 带 citation 时 evidence_type 不得以 book_notes_ 开头`);
      }
    }
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: { nodes: nodes.length, links: links.length },
  };
}


/**
 * Validate data/admin_books.json (catalog of 19; independent of graph schema).
 * @param {unknown} [payload]
 * @param {unknown} [sourcesPayload]
 * @returns {{ ok: boolean, errors: string[], counts: { books: number, ingested: number } }}
 */
export function validateAdminBooks(payload, sourcesPayload) {
  const errors = [];
  const adminPayload =
    payload !== undefined
      ? payload
      : JSON.parse(fs.readFileSync(path.join(root, ADMIN_BOOKS_FILE), 'utf8'));
  const sources =
    sourcesPayload !== undefined
      ? sourcesPayload
      : JSON.parse(fs.readFileSync(path.join(root, SOURCES_FILE), 'utf8'));

  const sourceIds = new Set();
  if (sources && typeof sources === 'object' && Array.isArray(sources.sources)) {
    for (const row of sources.sources) {
      if (row && typeof row === 'object' && typeof row.id === 'string') sourceIds.add(row.id);
    }
  } else {
    errors.push('sources.json 无法解析（admin_books 交叉校验）');
  }

  if (!adminPayload || typeof adminPayload !== 'object') {
    errors.push('admin_books.json 无法解析');
    return { ok: false, errors, counts: { books: 0, ingested: 0 } };
  }
  const rootObj = /** @type {Record<string, unknown>} */ (adminPayload);
  if (rootObj.schema_version !== '1.2') {
    errors.push('admin_books.json schema_version 必须为 "1.2"');
  }
  const books = Array.isArray(rootObj.books) ? rootObj.books : null;
  if (!books) {
    errors.push('admin_books.json 缺少 books 数组');
    return { ok: false, errors, counts: { books: 0, ingested: 0 } };
  }
  if (books.length !== 19) {
    errors.push(`admin_books.json 应恰有 19 本，实际 ${books.length}`);
  }

  const relevanceOk = new Set(['high', 'edge', 'low']);
  const statusOk = new Set(['ingested', 'index_only']);
  const seen = new Set();
  let ingested = 0;

  for (const [index, raw] of books.entries()) {
    if (!raw || typeof raw !== 'object') {
      errors.push(`admin_books.books[${index}] 非法`);
      continue;
    }
    const row = /** @type {Record<string, unknown>} */ (raw);
    const id = typeof row.id === 'string' ? row.id : '';
    if (!/^[a-z0-9_]+$/.test(id)) {
      errors.push(`admin_books.books[${index}].id 非法`);
      continue;
    }
    if (seen.has(id)) errors.push(`admin_books.books[${index}].id "${id}" 重复`);
    seen.add(id);
    if (typeof row.title !== 'string' || !row.title.trim()) {
      errors.push(`admin_books.books[${index}] 缺少 title`);
    }
    if (typeof row.theme !== 'string' || !row.theme.trim()) {
      errors.push(`admin_books.books[${index}] 缺少 theme`);
    }
    if (!relevanceOk.has(/** @type {string} */ (row.relevance))) {
      errors.push(`admin_books.books[${index}].relevance 须为 high|edge|low`);
    }
    if (Object.prototype.hasOwnProperty.call(row, 'note_count')) {
      errors.push(`admin_books.books[${index}] 不得含 note_count（NS-066）`);
    }
    if (typeof row.kb_file !== 'string' || !row.kb_file.trim()) {
      errors.push(`admin_books.books[${index}] 缺少 kb_file`);
    }
    if (!statusOk.has(/** @type {string} */ (row.status))) {
      errors.push(`admin_books.books[${index}].status 须为 ingested|index_only`);
    }
    if (Object.prototype.hasOwnProperty.call(row, 'edge_count')) {
      errors.push(`admin_books.books[${index}] 不得写入 edge_count`);
    }
    // NS-066: weread_book_id hard lock removed; optional shape check only.
    if (Object.prototype.hasOwnProperty.call(row, 'weread_book_id')) {
      const wid = row.weread_book_id;
      if (typeof wid !== 'string' || !/^[0-9]+$/.test(wid)) {
        errors.push(`admin_books.books[${index}].weread_book_id 须匹配 /^[0-9]+$/`);
      }
    }
    const sourceId = typeof row.source_id === 'string' && row.source_id !== '' ? row.source_id : null;
    if (sourceId) {
      ingested += 1;
      if (row.status !== 'ingested') {
        errors.push(`admin_books.books[${index}] 有 source_id 时 status 须为 ingested`);
      }
      if (!sourceIds.has(sourceId)) {
        errors.push(`admin_books.books[${index}].source_id "${sourceId}" 不在 sources.json`);
      }
    } else if (row.status !== 'index_only') {
      errors.push(`admin_books.books[${index}] 无 source_id 时 status 须为 index_only`);
    }
  }

  for (const expected of STAGE1_SOURCE_IDS) {
    if (!seen.has(expected)) {
      errors.push(`admin_books.json 缺少已入库书目 id "${expected}"`);
    }
  }
  // NS-077: +quit_sugar ingested (was index_only). NS-076: +know_your_gut.
  if (books.length === 19) {
    const gut = books.find((b) => b && typeof b === 'object' && /** @type {any} */ (b).id === 'gut_brain');
    if (!gut || /** @type {any} */ (gut).status !== 'ingested' || /** @type {any} */ (gut).source_id !== 'gut_brain') {
      errors.push('admin_books.json gut_brain 须保持 ingested + source_id');
    }
    const eth = books.find((b) => b && typeof b === 'object' && /** @type {any} */ (b).id === 'eat_to_heal');
    if (!eth || /** @type {any} */ (eth).status !== 'ingested' || /** @type {any} */ (eth).source_id !== 'eat_to_heal') {
      errors.push('admin_books.json eat_to_heal 须保持 ingested + source_id');
    }
    const avs = books.find((b) => b && typeof b === 'object' && /** @type {any} */ (b).id === 'amazing_veggie_soup');
    if (!avs || /** @type {any} */ (avs).status !== 'ingested' || /** @type {any} */ (avs).source_id !== 'amazing_veggie_soup') {
      errors.push('admin_books.json amazing_veggie_soup 须保持 ingested + source_id');
    }
    const hntd = books.find((b) => b && typeof b === 'object' && /** @type {any} */ (b).id === 'how_not_to_die');
    if (!hntd || /** @type {any} */ (hntd).status !== 'ingested' || /** @type {any} */ (hntd).source_id !== 'how_not_to_die') {
      errors.push('admin_books.json how_not_to_die 须为 ingested + source_id（NS-071）');
    }
    const cs = books.find((b) => b && typeof b === 'object' && /** @type {any} */ (b).id === 'china_study');
    if (!cs || /** @type {any} */ (cs).status !== 'ingested' || /** @type {any} */ (cs).source_id !== 'china_study') {
      errors.push('admin_books.json china_study 须为 ingested + source_id（NS-074）');
    }
    const yawye = books.find((b) => b && typeof b === 'object' && /** @type {any} */ (b).id === 'you_are_what_you_eat');
    if (!yawye || /** @type {any} */ (yawye).status !== 'ingested' || /** @type {any} */ (yawye).source_id !== 'you_are_what_you_eat') {
      errors.push('admin_books.json you_are_what_you_eat 须为 ingested + source_id（NS-075）');
    }
    const kyg = books.find((b) => b && typeof b === 'object' && /** @type {any} */ (b).id === 'know_your_gut');
    if (!kyg || /** @type {any} */ (kyg).status !== 'ingested' || /** @type {any} */ (kyg).source_id !== 'know_your_gut') {
      errors.push('admin_books.json know_your_gut 须为 ingested + source_id（NS-076）');
    }
    const qs = books.find((b) => b && typeof b === 'object' && /** @type {any} */ (b).id === 'quit_sugar');
    if (!qs || /** @type {any} */ (qs).status !== 'ingested' || /** @type {any} */ (qs).source_id !== 'quit_sugar') {
      errors.push('admin_books.json quit_sugar 须为 ingested + source_id（NS-077）');
    }
    if (ingested !== 8) {
      errors.push(`admin_books.json NS-077 后应恰有 8 本 ingested（+quit_sugar），实为 ${ingested}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    counts: { books: books.length, ingested },
  };
}


/**
 * Validate data/weread/<source_id>.json for ingested books (weread gate deprecated).
 * @returns {{ ok: boolean, errors: string[], counts: { files: number, bookmarks: number } }}
 */
export function validateWereadCorpora() {
  const errors = [];
  let files = 0;
  let bookmarks = 0;
  const dir = path.join(root, WEREAD_DIR);
  if (!fs.existsSync(dir)) {
    // NS-066: weread ingest path deprecated.
    return { ok: true, skipped: true, errors: [], counts: { files: 0, bookmarks: 0 } };
  }
  const jsonFiles = fs.readdirSync(dir).filter((name) => name.endsWith('.json'));
  if (jsonFiles.length === 0) {
    return { ok: true, skipped: true, errors: [], counts: { files: 0, bookmarks: 0 } };
  }
  for (const sourceId of WEREAD_SOURCE_IDS) {
    const expectedBookId = WEREAD_BOOK_MAP[sourceId];
    const filePath = path.join(dir, `${sourceId}.json`);
    if (!fs.existsSync(filePath)) {
      errors.push(`${WEREAD_DIR}/${sourceId}.json 缺失`);
      continue;
    }
    files += 1;
    let payload;
    try {
      payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      errors.push(`${WEREAD_DIR}/${sourceId}.json 无法解析`);
      continue;
    }
    if (!payload || typeof payload !== 'object') {
      errors.push(`${sourceId}.json 根对象无效`);
      continue;
    }
    const row = /** @type {Record<string, unknown>} */ (payload);
    if (row.schema_version !== '1.0') {
      errors.push(`${sourceId}.json schema_version 须为 "1.0"`);
    }
    if (row.source_id !== sourceId) {
      errors.push(`${sourceId}.json source_id 须为 "${sourceId}"`);
    }
    if (row.bookId !== expectedBookId) {
      errors.push(`${sourceId}.json bookId 须为 A2 "${expectedBookId}"`);
    }
    if (typeof row.title_weread !== 'string' || !row.title_weread.trim()) {
      errors.push(`${sourceId}.json 缺少 title_weread`);
    }
    if (typeof row.synced_at !== 'string' || !row.synced_at.trim()) {
      errors.push(`${sourceId}.json 缺少 synced_at`);
    }
    if (!row.meta || typeof row.meta !== 'object' || Array.isArray(row.meta)) {
      errors.push(`${sourceId}.json 缺少 meta`);
    }
    if (Object.prototype.hasOwnProperty.call(row, 'review') || Object.prototype.hasOwnProperty.call(row, 'reviews') || Object.prototype.hasOwnProperty.call(row, 'ideas')) {
      errors.push(`${sourceId}.json 不得含 review/ideas 顶层键`);
    }
    if (!Array.isArray(row.bookmarks)) {
      errors.push(`${sourceId}.json bookmarks 须为数组`);
    } else {
      bookmarks += row.bookmarks.length;
      const seen = new Set();
      for (const [i, bm] of row.bookmarks.entries()) {
        if (!bm || typeof bm !== 'object') {
          errors.push(`${sourceId}.json bookmarks[${i}] 非法`);
          continue;
        }
        const b = /** @type {Record<string, unknown>} */ (bm);
        if (typeof b.bookmarkId !== 'string' || !b.bookmarkId) {
          errors.push(`${sourceId}.json bookmarks[${i}] 缺少 bookmarkId`);
        } else if (seen.has(b.bookmarkId)) {
          errors.push(`${sourceId}.json bookmarks[${i}] bookmarkId 重复`);
        } else {
          seen.add(b.bookmarkId);
        }
        if (typeof b.markText !== 'string' || !b.markText.trim()) {
          errors.push(`${sourceId}.json bookmarks[${i}] 缺少 markText`);
        }
      }
    }
    const best = row.bestbookmarks;
    if (!best || typeof best !== 'object' || Array.isArray(best)) {
      errors.push(`${sourceId}.json 缺少 bestbookmarks`);
    } else {
      const bestObj = /** @type {Record<string, unknown>} */ (best);
      if (typeof bestObj.totalCount !== 'number') {
        errors.push(`${sourceId}.json bestbookmarks.totalCount 非法`);
      }
      if (!Array.isArray(bestObj.items)) {
        errors.push(`${sourceId}.json bestbookmarks.items 须为数组`);
      }
    }
    const stats = row.stats;
    if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
      errors.push(`${sourceId}.json 缺少 stats`);
    } else {
      const statsObj = /** @type {Record<string, unknown>} */ (stats);
      const bmLen = Array.isArray(row.bookmarks) ? row.bookmarks.length : -1;
      if (statsObj.bookmark_count !== bmLen) {
        errors.push(`${sourceId}.json stats.bookmark_count 须等于 bookmarks.length`);
      }
      const itemsLen =
        best && typeof best === 'object' && !Array.isArray(best) && Array.isArray(best.items)
          ? best.items.length
          : -1;
      if (statsObj.bestbookmark_item_count !== itemsLen) {
        errors.push(`${sourceId}.json stats.bestbookmark_item_count 须等于 items.length`);
      }
    }
  }
  // No extra JSON beyond the six (+ mapping_report.json NS-061; README is fine)
  const WEREAD_EXTRA_JSON = new Set(['mapping_report.json']);
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    if (WEREAD_EXTRA_JSON.has(name)) continue;
    const id = name.replace(/\.json$/, '');
    if (!WEREAD_BOOK_MAP[id]) {
      errors.push(`${WEREAD_DIR}/${name} 不在 A2 六书集合内`);
    }
  }
  return {
    ok: errors.length === 0,
    errors,
    counts: { files, bookmarks },
  };
}

export function validateGraphFile(dataRel = ALIGNED_SEED, schemaRel = GRAPH_SCHEMA) {
  const data = JSON.parse(fs.readFileSync(path.join(root, dataRel), 'utf8'));
  const schema = JSON.parse(fs.readFileSync(path.join(root, schemaRel), 'utf8'));
  const sourcesPayload = JSON.parse(fs.readFileSync(path.join(root, SOURCES_FILE), 'utf8'));
  return validateGraphData(data, schema, { sourcesPayload });
}


/** Optional NS-061 mapping_report shape check (present after map script). */
export function validateWereadMappingReport() {
  const file = path.join(root, WEREAD_DIR, 'mapping_report.json');
  if (!fs.existsSync(file)) {
    return { ok: true, skipped: true, errors: [] };
  }
  const errors = [];
  let report;
  try {
    report = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return { ok: false, errors: [`mapping_report.json 无法解析: ${err.message}`] };
  }
  if (report.schema_version !== '1.0') errors.push('mapping_report.schema_version 须为 "1.0"');
  if (!report.hard_gate || typeof report.hard_gate.ok !== 'boolean') {
    errors.push('mapping_report.hard_gate.ok 缺失');
  }
  if (!Array.isArray(report.attached)) errors.push('mapping_report.attached 须为数组');
  if (!Array.isArray(report.skipped)) errors.push('mapping_report.skipped 须为数组');
  if (!report.per_book || typeof report.per_book !== 'object') errors.push('mapping_report.per_book 缺失');
  if (!report.personal_bookmark_outcomes || typeof report.personal_bookmark_outcomes !== 'object') {
    errors.push('mapping_report.personal_bookmark_outcomes 缺失');
  } else {
    let n = 0;
    for (const id of WEREAD_SOURCE_IDS) {
      const rows = report.personal_bookmark_outcomes[id];
      if (!Array.isArray(rows)) {
        errors.push(`mapping_report.personal_bookmark_outcomes.${id} 须为数组`);
        continue;
      }
      n += rows.length;
    }
    if (n !== 156) errors.push(`mapping_report 个人划线结局应为 156，实为 ${n}`);
  }
  if (report.hard_gate && report.hard_gate.ok === false) {
    errors.push('mapping_report.hard_gate.ok 为 false（须 ≥25 挂载且 ≥4 书）');
  }
  return { ok: errors.length === 0, errors, counts: { attached: report.attached?.length ?? 0 } };
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  return pathToFileURL(path.resolve(entry)).href === import.meta.url;
}

if (isMain()) {
  const result = validateGraphFile();
  for (const warning of result.warnings) console.warn(`WARN ${warning}`);
  if (!result.ok) {
    for (const error of result.errors) console.error(`ERROR ${error}`);
    console.error(`validate:data 失败（${ALIGNED_SEED}）`);
    process.exit(1);
  }
  console.log(
    `OK ${result.counts.nodes} nodes, ${result.counts.links} links — ${ALIGNED_SEED}`,
  );
  const admin = validateAdminBooks();
  if (!admin.ok) {
    for (const error of admin.errors) console.error(`ERROR ${error}`);
    console.error(`validate:data 失败（${ADMIN_BOOKS_FILE}）`);
    process.exit(1);
  }
  console.log(
    `OK ${admin.counts.books} admin books (${admin.counts.ingested} ingested) — ${ADMIN_BOOKS_FILE}`,
  );
  const weread = validateWereadCorpora();
  if (!weread.ok) {
    for (const error of weread.errors) console.error(`ERROR ${error}`);
    console.error(`validate:data 失败（${WEREAD_DIR}/）`);
    process.exit(1);
  }
  if (weread.skipped) {
    console.log(`OK weread corpora skipped (deprecated NS-066) — ${WEREAD_DIR}/`);
  } else {
    console.log(
      `OK ${weread.counts.files} weread corpora (${weread.counts.bookmarks} bookmarks) — ${WEREAD_DIR}/`,
    );
  }
  const mapping = validateWereadMappingReport();
  if (!mapping.ok) {
    for (const error of mapping.errors) console.error(`ERROR ${error}`);
    console.error(`validate:data 失败（${WEREAD_DIR}/mapping_report.json）`);
    process.exit(1);
  }
  if (!mapping.skipped) {
    console.log(`OK weread mapping_report (${mapping.counts.attached} attached) — ${WEREAD_DIR}/mapping_report.json`);
  }
}
