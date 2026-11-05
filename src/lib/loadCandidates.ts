import type { CandidateBatchStatus } from './adminMaintenance.ts';

const ID = /^[a-z0-9_]+$/;
const INDEX_SCHEMA = '1.0';

export interface CandidateIndexEntry {
  source_id: string;
  dir: string;
}

export interface CandidateIndex {
  schema_version: string;
  batches: CandidateIndexEntry[];
}

export interface CandidateMeta {
  source_id: string;
  source_title: string;
  themes: string[];
  status: CandidateBatchStatus;
  edge_count: number;
  evidence_count: number;
  new_node_count: number;
  reuse_node_count: number;
  append_count: number;
  aligned_data_version: string;
  aligned_schema_version: string;
}

export interface CandidateEvidence {
  excerpt: string;
  excerpt_id: string;
  note_id?: string;
  source_id?: string;
  source_title?: string;
  source_file?: string;
  citation?: string;
}

export interface CandidateLink {
  source: string;
  target: string;
  relation: string;
  domain?: string;
  evidence_type?: string;
  strength?: string;
  source_id?: string;
  source_title?: string;
  source_file?: string;
  excerpt?: string;
  excerpt_id?: string;
  note_id?: string;
  merge_action?: string;
  existing_endpoint_pair?: boolean;
  existing_sources?: string[];
  evidences: CandidateEvidence[];
}

export interface CandidateNode {
  id: string;
  domain?: string;
  type?: string;
  label: string;
  group?: string;
  description?: string;
  aliases?: string[];
}

export interface CandidateNodesFile {
  meta: Record<string, unknown>;
  new_nodes: CandidateNode[];
  reuse_nodes: CandidateNode[];
}

export interface CandidateLinksFile {
  meta: Record<string, unknown>;
  candidate_links: CandidateLink[];
}

export interface CandidateChapterRow {
  spine: string;
  title: string;
  excerpts: string;
  skipped: boolean;
  skipReason: string | null;
}

export interface CandidateBatchDetail {
  meta: CandidateMeta;
  links: CandidateLink[];
  newNodes: CandidateNode[];
  reuseNodes: CandidateNode[];
  chapters: CandidateChapterRow[];
  extractNotes: string;
}

export function candidatesIndexUrl(): string {
  return `${import.meta.env.BASE_URL}data/candidates/index.json`;
}

export function candidateDirUrl(dir: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}data/candidates/${dir}/`;
}

async function fetchJson(url: string, label: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(`无法连接${label}`);
  }
  if (!response.ok) {
    throw new Error(`${label}请求失败（${response.status}）`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(`${label}不是合法 JSON`);
  }
}

async function fetchText(url: string, label: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(`无法连接${label}`);
  }
  if (!response.ok) {
    throw new Error(`${label}请求失败（${response.status}）`);
  }
  return response.text();
}

export function assertCandidateIndex(payload: unknown): CandidateIndex {
  if (!payload || typeof payload !== 'object') {
    throw new Error('候选索引结构无效');
  }
  const root = payload as Record<string, unknown>;
  if (root.schema_version !== INDEX_SCHEMA) {
    throw new Error('候选索引 schema_version 无效');
  }
  if (!Array.isArray(root.batches)) {
    throw new Error('候选索引缺少 batches');
  }
  const batches: CandidateIndexEntry[] = root.batches.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`batches[${index}] 无效`);
    }
    const row = item as Record<string, unknown>;
    if (typeof row.source_id !== 'string' || !ID.test(row.source_id)) {
      throw new Error(`batches[${index}].source_id 非法`);
    }
    if (typeof row.dir !== 'string' || !/^[a-z0-9_/-]+$/.test(row.dir)) {
      throw new Error(`batches[${index}].dir 非法`);
    }
    return { source_id: row.source_id, dir: row.dir };
  });
  return { schema_version: INDEX_SCHEMA, batches };
}

export function assertCandidateMeta(payload: unknown): CandidateMeta {
  if (!payload || typeof payload !== 'object') {
    throw new Error('候选 meta 结构无效');
  }
  const row = payload as Record<string, unknown>;
  if (typeof row.source_id !== 'string' || !ID.test(row.source_id)) {
    throw new Error('候选 meta.source_id 非法');
  }
  if (typeof row.source_title !== 'string' || !row.source_title.trim()) {
    throw new Error('候选 meta.source_title 非法');
  }
  if (!Array.isArray(row.themes) || !row.themes.every((item) => typeof item === 'string')) {
    throw new Error('候选 meta.themes 非法');
  }
  const status = row.status;
  if (status !== 'pending_review' && status !== 'exported' && status !== 'ingested') {
    throw new Error('候选 meta.status 非法');
  }
  for (const key of [
    'edge_count',
    'evidence_count',
    'new_node_count',
    'reuse_node_count',
    'append_count',
  ] as const) {
    if (typeof row[key] !== 'number' || !Number.isFinite(row[key])) {
      throw new Error(`候选 meta.${key} 非法`);
    }
  }
  if (typeof row.aligned_data_version !== 'string' || typeof row.aligned_schema_version !== 'string') {
    throw new Error('候选 meta 对齐版本非法');
  }
  return {
    source_id: row.source_id,
    source_title: row.source_title,
    themes: row.themes as string[],
    status,
    edge_count: row.edge_count as number,
    evidence_count: row.evidence_count as number,
    new_node_count: row.new_node_count as number,
    reuse_node_count: row.reuse_node_count as number,
    append_count: row.append_count as number,
    aligned_data_version: row.aligned_data_version,
    aligned_schema_version: row.aligned_schema_version,
  };
}

function assertEvidence(row: unknown, path: string): CandidateEvidence {
  if (!row || typeof row !== 'object') {
    throw new Error(`${path} 无效`);
  }
  const item = row as Record<string, unknown>;
  if (typeof item.excerpt !== 'string' || typeof item.excerpt_id !== 'string') {
    throw new Error(`${path} 缺少 excerpt/excerpt_id`);
  }
  const evidence: CandidateEvidence = {
    excerpt: item.excerpt,
    excerpt_id: item.excerpt_id,
  };
  if (typeof item.note_id === 'string') evidence.note_id = item.note_id;
  if (typeof item.source_id === 'string') evidence.source_id = item.source_id;
  if (typeof item.source_title === 'string') evidence.source_title = item.source_title;
  if (typeof item.source_file === 'string') evidence.source_file = item.source_file;
  if (typeof item.citation === 'string') evidence.citation = item.citation;
  return evidence;
}

function assertCandidateLink(row: unknown, index: number): CandidateLink {
  if (!row || typeof row !== 'object') {
    throw new Error(`candidate_links[${index}] 无效`);
  }
  const item = row as Record<string, unknown>;
  if (typeof item.source !== 'string' || !ID.test(item.source)) {
    throw new Error(`candidate_links[${index}].source 非法`);
  }
  if (typeof item.target !== 'string' || !ID.test(item.target)) {
    throw new Error(`candidate_links[${index}].target 非法`);
  }
  if (typeof item.relation !== 'string') {
    throw new Error(`candidate_links[${index}].relation 非法`);
  }
  if (!Array.isArray(item.evidences)) {
    throw new Error(`candidate_links[${index}].evidences 非法`);
  }
  const evidences = item.evidences.map((ev, evIndex) =>
    assertEvidence(ev, `candidate_links[${index}].evidences[${evIndex}]`),
  );
  const link: CandidateLink = {
    source: item.source,
    target: item.target,
    relation: item.relation,
    evidences,
  };
  if (typeof item.domain === 'string') link.domain = item.domain;
  if (typeof item.evidence_type === 'string') link.evidence_type = item.evidence_type;
  if (typeof item.strength === 'string') link.strength = item.strength;
  if (typeof item.source_id === 'string') link.source_id = item.source_id;
  if (typeof item.source_title === 'string') link.source_title = item.source_title;
  if (typeof item.source_file === 'string') link.source_file = item.source_file;
  if (typeof item.excerpt === 'string') link.excerpt = item.excerpt;
  if (typeof item.excerpt_id === 'string') link.excerpt_id = item.excerpt_id;
  if (typeof item.note_id === 'string') link.note_id = item.note_id;
  if (typeof item.merge_action === 'string') link.merge_action = item.merge_action;
  if (typeof item.existing_endpoint_pair === 'boolean') {
    link.existing_endpoint_pair = item.existing_endpoint_pair;
  }
  if (Array.isArray(item.existing_sources) && item.existing_sources.every((s) => typeof s === 'string')) {
    link.existing_sources = item.existing_sources as string[];
  }
  return link;
}

function assertCandidateNode(row: unknown, path: string): CandidateNode {
  if (!row || typeof row !== 'object') {
    throw new Error(`${path} 无效`);
  }
  const item = row as Record<string, unknown>;
  if (typeof item.id !== 'string' || !ID.test(item.id)) {
    throw new Error(`${path}.id 非法`);
  }
  if (typeof item.label !== 'string') {
    throw new Error(`${path}.label 非法`);
  }
  const node: CandidateNode = { id: item.id, label: item.label };
  if (typeof item.domain === 'string') node.domain = item.domain;
  if (typeof item.type === 'string') node.type = item.type;
  if (typeof item.group === 'string') node.group = item.group;
  if (typeof item.description === 'string') node.description = item.description;
  if (Array.isArray(item.aliases) && item.aliases.every((a) => typeof a === 'string')) {
    node.aliases = item.aliases as string[];
  }
  return node;
}

export function assertCandidateLinksFile(payload: unknown): CandidateLinksFile {
  if (!payload || typeof payload !== 'object') {
    throw new Error('候选边文件结构无效');
  }
  const root = payload as Record<string, unknown>;
  if (!root.meta || typeof root.meta !== 'object') {
    throw new Error('候选边文件缺少 meta');
  }
  if (!Array.isArray(root.candidate_links)) {
    throw new Error('候选边文件缺少 candidate_links');
  }
  return {
    meta: root.meta as Record<string, unknown>,
    candidate_links: root.candidate_links.map(assertCandidateLink),
  };
}

export function assertCandidateNodesFile(payload: unknown): CandidateNodesFile {
  if (!payload || typeof payload !== 'object') {
    throw new Error('候选节点文件结构无效');
  }
  const root = payload as Record<string, unknown>;
  if (!root.meta || typeof root.meta !== 'object') {
    throw new Error('候选节点文件缺少 meta');
  }
  if (!Array.isArray(root.new_nodes) || !Array.isArray(root.reuse_nodes)) {
    throw new Error('候选节点文件缺少 new_nodes/reuse_nodes');
  }
  return {
    meta: root.meta as Record<string, unknown>,
    new_nodes: root.new_nodes.map((row, index) => assertCandidateNode(row, `new_nodes[${index}]`)),
    reuse_nodes: root.reuse_nodes.map((row, index) => assertCandidateNode(row, `reuse_nodes[${index}]`)),
  };
}

/** Parse covered / skipped chapters from extract_notes.md tables. */
export function parseExtractChapters(notes: string): CandidateChapterRow[] {
  const lines = notes.split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s*章节覆盖/.test(line.trim()));
  if (start < 0) return [];
  const rows: CandidateChapterRow[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (/^##\s+/.test(line.trim()) && rows.length > 0) break;
    const match = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|$/);
    if (!match) continue;
    const spine = match[1].trim();
    const title = match[2].trim();
    const excerpts = match[3].trim();
    if (spine === 'spine' || /^-+$/.test(spine) || spine === '---') continue;
    const skipped = /^skip[：:]/i.test(excerpts) || excerpts.toLowerCase().startsWith('skip');
    const skipReason = skipped
      ? excerpts.replace(/^skip[：:]\s*/i, '').trim() || excerpts
      : null;
    rows.push({ spine, title, excerpts, skipped, skipReason });
  }
  return rows;
}

export async function loadCandidateIndex(
  url: string = candidatesIndexUrl(),
): Promise<CandidateIndex> {
  return assertCandidateIndex(await fetchJson(url, '候选索引'));
}

export async function loadCandidateMeta(dir: string): Promise<CandidateMeta> {
  const url = `${candidateDirUrl(dir)}meta.json`;
  return assertCandidateMeta(await fetchJson(url, `候选 meta（${dir}）`));
}

export async function loadCandidateBatch(dir: string): Promise<CandidateBatchDetail> {
  const base = candidateDirUrl(dir);
  const [metaPayload, linksPayload, nodesPayload, notes] = await Promise.all([
    fetchJson(`${base}meta.json`, `候选 meta（${dir}）`),
    fetchJson(`${base}candidate_links.json`, `候选边（${dir}）`),
    fetchJson(`${base}candidate_nodes.json`, `候选节点（${dir}）`),
    fetchText(`${base}extract_notes.md`, `抽取说明（${dir}）`),
  ]);
  const meta = assertCandidateMeta(metaPayload);
  const linksFile = assertCandidateLinksFile(linksPayload);
  const nodesFile = assertCandidateNodesFile(nodesPayload);
  return {
    meta,
    links: linksFile.candidate_links,
    newNodes: nodesFile.new_nodes,
    reuseNodes: nodesFile.reuse_nodes,
    chapters: parseExtractChapters(notes),
    extractNotes: notes,
  };
}

export async function loadCandidateBatchSummaries(
  index?: CandidateIndex,
): Promise<CandidateMeta[]> {
  const resolved = index ?? (await loadCandidateIndex());
  const metas: CandidateMeta[] = [];
  for (const entry of resolved.batches) {
    metas.push(await loadCandidateMeta(entry.dir));
  }
  return metas;
}
