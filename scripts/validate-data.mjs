import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Phase 1 gates this aligned seed only. Older seed files are not schema-complete. */
export const ALIGNED_SEED = 'data/seed_triples_v0.3_aligned.json';
export const GRAPH_SCHEMA = 'data/graph_schema.json';
export const SOURCES_FILE = 'data/sources.json';

const EXCERPT_LIMIT = 1200;
const STAGE1_SOURCE_IDS = [
  'eat_to_heal',
  'how_not_to_die',
  'gut_brain',
  'amazing_veggie_soup',
  'china_study',
  'know_your_gut',
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
    if (sourcesRoot.schema_version !== '1.0') {
      errors.push('sources.json schema_version 必须为 "1.0"');
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
        const description = typeof row.description === 'string' ? row.description.trim() : '';
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
        if (!description) errors.push(`sources[${index}] 缺少 description`);
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
    if (typeof ev.limitations !== 'string' || ev.limitations.trim() === '') {
      errors.push(`${path} 缺少 limitations`);
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
          if (sourceFile !== book.file) {
            errors.push(`${path}.source_file 须与 sources[].file 一致`);
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
    for (const key of ['excerpt', 'limitations', 'source_title', 'source_file']) {
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

export function validateGraphFile(dataRel = ALIGNED_SEED, schemaRel = GRAPH_SCHEMA) {
  const data = JSON.parse(fs.readFileSync(path.join(root, dataRel), 'utf8'));
  const schema = JSON.parse(fs.readFileSync(path.join(root, schemaRel), 'utf8'));
  const sourcesPayload = JSON.parse(fs.readFileSync(path.join(root, SOURCES_FILE), 'utf8'));
  return validateGraphData(data, schema, { sourcesPayload });
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
}
