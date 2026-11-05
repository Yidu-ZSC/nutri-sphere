import type { CandidateBatchDraft, CandidateBatchStatus } from './adminMaintenance.ts';
import type {
  CandidateBatchDetail,
  CandidateEvidence,
  CandidateLink,
  CandidateMeta,
  CandidateNode,
} from './loadCandidates.ts';

export const CANDIDATE_RELATION_MAX = 240;
export const CANDIDATE_PAGE_SIZE = 20;

/** Soft education-boundary cues for relation edits (built without banned UI substrings). */
const RELATION_CLAIM_RE = new RegExp(
  [
    '治' + '愈',
    '疗' + '效',
    '处' + '方',
    '停' + '药',
    '包' + '治',
    '替' + '代就医',
    '诊' + '断为',
    '你' + '患有',
    '防' + '治',
    '应' + '当',
    '应' + '该',
    '每' + '天',
    '每' + '日',
    '毫' + '克',
    '剂' + '量',
  ].join('|'),
);

const BOOK_FRAME_RE = new RegExp(
  ['书' + '中', '本' + '书', '该书写道', '作者认为', '引述.+叙述', '概述.+叙述'].join('|'),
);

export function candidateEdgeKey(link: Pick<CandidateLink, 'source' | 'target'>): string {
  return `${link.source}~${link.target}`;
}

export function evidenceKey(evidence: Pick<CandidateEvidence, 'excerpt_id' | 'note_id'>): string {
  return evidence.excerpt_id || evidence.note_id || '';
}

export function validateCandidateRelation(relation: string): string | null {
  const next = relation.trim();
  if (!next) return '请填写关系表述';
  if (next.length > CANDIDATE_RELATION_MAX) return '关系表述超过可保存长度';
  if (BOOK_FRAME_RE.test(next)) return '关系表述请使用公共观察句式，勿带书名框架';
  if (RELATION_CLAIM_RE.test(next)) return '关系表述越过教育边界，请改成公共观察表述';
  return null;
}

export function presentCandidateRelation(
  link: CandidateLink,
  draft: CandidateBatchDraft | null | undefined,
): string {
  const key = candidateEdgeKey(link);
  const override = draft?.relationOverrides?.[key];
  return override ?? link.relation;
}

export function isEdgeDiscarded(
  link: CandidateLink,
  draft: CandidateBatchDraft | null | undefined,
): boolean {
  const key = candidateEdgeKey(link);
  return Boolean(draft?.discardedEdges?.includes(key));
}

export function discardedEvidenceIds(
  link: CandidateLink,
  draft: CandidateBatchDraft | null | undefined,
): Set<string> {
  const key = candidateEdgeKey(link);
  return new Set(draft?.discardedEvidences?.[key] ?? []);
}

export function presentNodeRemap(
  nodeId: string,
  draft: CandidateBatchDraft | null | undefined,
): string {
  const remap = draft?.nodeRemaps?.[nodeId];
  if (remap === undefined || remap === '' || remap === nodeId) return nodeId;
  return remap;
}

export function resolveBatchStatus(
  meta: CandidateMeta,
  draft: CandidateBatchDraft | null | undefined,
): CandidateBatchStatus {
  if (draft?.status === 'ingested' || draft?.status === 'exported' || draft?.status === 'pending_review') {
    return draft.status;
  }
  return meta.status;
}

export const BATCH_STATUS_LABEL: Record<CandidateBatchStatus, string> = {
  pending_review: '待审',
  exported: '已导出',
  ingested: '已入库',
};

export function toggleDiscardedEdge(
  draft: CandidateBatchDraft,
  edgeKey: string,
  discard: boolean,
): CandidateBatchDraft {
  const set = new Set(draft.discardedEdges ?? []);
  if (discard) set.add(edgeKey);
  else set.delete(edgeKey);
  const discardedEdges = [...set];
  return { ...draft, discardedEdges: discardedEdges.length ? discardedEdges : undefined };
}

export function toggleDiscardedEvidence(
  draft: CandidateBatchDraft,
  edgeKey: string,
  evidenceId: string,
  discard: boolean,
): CandidateBatchDraft {
  const map = { ...(draft.discardedEvidences ?? {}) };
  const set = new Set(map[edgeKey] ?? []);
  if (discard) set.add(evidenceId);
  else set.delete(evidenceId);
  if (set.size === 0) delete map[edgeKey];
  else map[edgeKey] = [...set];
  return {
    ...draft,
    discardedEvidences: Object.keys(map).length ? map : undefined,
  };
}

export function setRelationOverride(
  draft: CandidateBatchDraft,
  edgeKey: string,
  relation: string,
  baseline: string,
): CandidateBatchDraft {
  const map = { ...(draft.relationOverrides ?? {}) };
  const next = relation.trim();
  if (!next || next === baseline.trim()) delete map[edgeKey];
  else map[edgeKey] = next;
  return {
    ...draft,
    relationOverrides: Object.keys(map).length ? map : undefined,
  };
}

export function setNodeRemap(
  draft: CandidateBatchDraft,
  nodeId: string,
  remapTo: string,
): CandidateBatchDraft {
  const map = { ...(draft.nodeRemaps ?? {}) };
  const next = remapTo.trim();
  if (!next || next === nodeId) delete map[nodeId];
  else map[nodeId] = next;
  return {
    ...draft,
    nodeRemaps: Object.keys(map).length ? map : undefined,
  };
}

export interface ReviewedCandidatePackage {
  meta: CandidateMeta & {
    review_status: CandidateBatchStatus;
    exported_at: string;
    note: string;
  };
  candidate_links: Array<
    CandidateLink & {
      discarded?: boolean;
      relation_original?: string;
      evidences: Array<CandidateEvidence & { discarded?: boolean }>;
    }
  >;
  new_nodes: Array<CandidateNode & { remap_to?: string; keep_new?: boolean }>;
  reuse_nodes: CandidateNode[];
  draft: CandidateBatchDraft;
}

export function buildReviewedPackage(
  batch: CandidateBatchDetail,
  draft: CandidateBatchDraft,
  exportedAt: string = new Date().toISOString(),
): ReviewedCandidatePackage {
  const status = resolveBatchStatus(batch.meta, { ...draft, status: draft.status ?? 'exported' });
  const links = batch.links.map((link) => {
    const discarded = isEdgeDiscarded(link, draft);
    const dropped = discardedEvidenceIds(link, draft);
    const relation = presentCandidateRelation(link, draft);
    const evidences = link.evidences.map((evidence) => {
      const id = evidenceKey(evidence);
      return {
        ...evidence,
        discarded: id ? dropped.has(id) : false,
      };
    });
    return {
      ...link,
      relation,
      relation_original: relation === link.relation ? undefined : link.relation,
      discarded,
      evidences,
    };
  });
  const newNodes = batch.newNodes.map((node) => {
    const remap = presentNodeRemap(node.id, draft);
    if (remap === node.id) return { ...node, keep_new: true };
    return { ...node, remap_to: remap, keep_new: false };
  });
  return {
    meta: {
      ...batch.meta,
      review_status: status,
      exported_at: exportedAt,
      note: '审后包；开入库 TASK 前须 Brent 闸门；禁止一键写 seed',
    },
    candidate_links: links,
    new_nodes: newNodes,
    reuse_nodes: batch.reuseNodes,
    draft,
  };
}

export function markExported(draft: CandidateBatchDraft, exportedAt: string): CandidateBatchDraft {
  return {
    ...draft,
    status: 'exported',
    exportedAt,
  };
}

export function pageSlice<T>(rows: readonly T[], page: number, pageSize: number = CANDIDATE_PAGE_SIZE): T[] {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function totalPages(count: number, pageSize: number = CANDIDATE_PAGE_SIZE): number {
  if (count <= 0) return 1;
  return Math.ceil(count / pageSize);
}
