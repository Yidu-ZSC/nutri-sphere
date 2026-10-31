import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Phase 1 gates this aligned seed only. Older seed files are not schema-complete. */
export const ALIGNED_SEED = 'data/seed_triples_v0.3_aligned.json';
export const GRAPH_SCHEMA = 'data/graph_schema.json';

const EXCERPT_LIMIT = 300;

/**
 * @param {unknown} data
 * @param {object} schema
 * @returns {{ ok: boolean, errors: string[], warnings: string[], counts: { nodes: number, links: number } }}
 */
export function validateGraphData(data, schema) {
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

  links.forEach((link, index) => {
    if (!link || typeof link !== 'object') return;
    const row = /** @type {Record<string, unknown>} */ (link);
    if (typeof row.source === 'string' && !ids.has(row.source)) {
      errors.push(`links[${index}].source "${row.source}" 不存在于 nodes[].id`);
    }
    if (typeof row.target === 'string' && !ids.has(row.target)) {
      errors.push(`links[${index}].target "${row.target}" 不存在于 nodes[].id`);
    }
    if (typeof row.limitations !== 'string' || row.limitations.trim() === '') {
      errors.push(`links[${index}] 缺少 limitations`);
    }
    if (typeof row.excerpt === 'string' && row.excerpt.length > EXCERPT_LIMIT) {
      errors.push(`links[${index}].excerpt 长度为 ${row.excerpt.length}，超过 ${EXCERPT_LIMIT}`);
    }
    if (row.citation != null) {
      const citation = row.citation;
      const doi =
        citation && typeof citation === 'object' && !Array.isArray(citation) && typeof citation.doi === 'string'
          ? citation.doi.trim()
          : '';
      const pmid =
        citation && typeof citation === 'object' && !Array.isArray(citation) && typeof citation.pmid === 'string'
          ? citation.pmid.trim()
          : '';
      if (!doi && !pmid) {
        errors.push(`links[${index}].citation 需要非空 doi 或 pmid`);
      }
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
  return validateGraphData(data, schema);
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
