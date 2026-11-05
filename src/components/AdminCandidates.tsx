import { useEffect, useMemo, useState } from 'react';
import {
  BATCH_STATUS_LABEL,
  buildReviewedPackage,
  CANDIDATE_PAGE_SIZE,
  CANDIDATE_RELATION_MAX,
  candidateEdgeKey,
  discardedEvidenceIds,
  evidenceKey,
  isEdgeDiscarded,
  markExported,
  pageSlice,
  presentCandidateRelation,
  presentNodeRemap,
  resolveBatchStatus,
  setNodeRemap,
  setRelationOverride,
  toggleDiscardedEdge,
  toggleDiscardedEvidence,
  totalPages,
  validateCandidateRelation,
} from '../lib/adminCandidates';
import {
  candidateBatchDraft,
  readAdminDrafts,
  saveCandidateBatchDraft,
  writeAdminDrafts,
  type AdminDraftFile,
  type CandidateBatchDraft,
} from '../lib/adminMaintenance';
import {
  loadCandidateBatch,
  loadCandidateBatchSummaries,
  loadCandidateIndex,
  type CandidateBatchDetail,
  type CandidateLink,
  type CandidateMeta,
} from '../lib/loadCandidates';

interface AdminCandidatesProps {
  selectedId: string | null;
  onOpen: (sourceId: string) => void;
  onBack: () => void;
}

const GATE_COPY =
  '开入库 TASK 前须 Brent 闸门；禁止一键写 seed。本页只导出审后包，不会写入种子数据。';

export function AdminCandidates({ selectedId, onOpen, onBack }: AdminCandidatesProps) {
  const [drafts, setDrafts] = useState<AdminDraftFile>(() => readAdminDrafts());
  const [summaries, setSummaries] = useState<CandidateMeta[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [batch, setBatch] = useState<CandidateBatchDetail | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [relationDraft, setRelationDraft] = useState('');
  const [relationError, setRelationError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'append' | 'new' | 'discarded'>('all');

  useEffect(() => {
    let cancelled = false;
    setListError(null);
    loadCandidateIndex()
      .then((index) => loadCandidateBatchSummaries(index))
      .then((rows) => {
        if (!cancelled) setSummaries(rows);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setListError(error instanceof Error ? error.message : '候选批次加载失败');
          setSummaries([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setBatch(null);
      setBatchError(null);
      setBatchLoading(false);
      setPage(1);
      setExpandedKey(null);
      setNotice(null);
      return;
    }
    let cancelled = false;
    setBatchLoading(true);
    setBatchError(null);
    setNotice(null);
    setPage(1);
    setExpandedKey(null);
    loadCandidateIndex()
      .then((index) => {
        const entry = index.batches.find((item) => item.source_id === selectedId);
        if (!entry) throw new Error(`未找到候选批次 ${selectedId}`);
        return loadCandidateBatch(entry.dir);
      })
      .then((detail) => {
        if (!cancelled) {
          setBatch(detail);
          setBatchLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setBatch(null);
          setBatchLoading(false);
          setBatchError(error instanceof Error ? error.message : '候选详情加载失败');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function commit(next: AdminDraftFile) {
    setDrafts(next);
    writeAdminDrafts(next);
  }

  function updateSelectedDraft(mutator: (draft: CandidateBatchDraft) => CandidateBatchDraft) {
    if (!selectedId) return;
    const current = candidateBatchDraft(drafts, selectedId);
    commit(saveCandidateBatchDraft(drafts, selectedId, mutator(current)));
  }

  const selectedDraft = selectedId ? candidateBatchDraft(drafts, selectedId) : {};

  const filteredLinks = useMemo(() => {
    if (!batch) return [];
    return batch.links.filter((link) => {
      const discarded = isEdgeDiscarded(link, selectedDraft);
      const append = link.merge_action === 'append' || link.existing_endpoint_pair === true;
      if (filter === 'discarded') return discarded;
      if (filter === 'append') return append && !discarded;
      if (filter === 'new') return !append && !discarded;
      return true;
    });
  }, [batch, filter, selectedDraft]);

  const pages = totalPages(filteredLinks.length);
  const safePage = Math.min(page, pages);
  const pageRows = pageSlice(filteredLinks, safePage);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  useEffect(() => {
    if (!expandedKey || !batch) {
      setRelationDraft('');
      setRelationError(null);
      return;
    }
    const link = batch.links.find((item) => candidateEdgeKey(item) === expandedKey);
    if (!link) return;
    setRelationDraft(presentCandidateRelation(link, selectedDraft));
    setRelationError(null);
  }, [expandedKey, batch, selectedDraft]);

  async function exportPackage() {
    if (!batch || !selectedId) return;
    const exportedAt = new Date().toISOString();
    const nextDraft = markExported(selectedDraft, exportedAt);
    const payload = buildReviewedPackage(batch, nextDraft, exportedAt);
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${selectedId}.reviewed.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    try {
      await navigator.clipboard.writeText(text);
      setNotice('审后包已下载，并已尝试复制到剪贴板');
    } catch {
      setNotice('审后包已下载（剪贴板未授权）');
    }
    commit(saveCandidateBatchDraft(drafts, selectedId, nextDraft));
  }

  if (selectedId) {
    return (
      <section className="admin-books" data-testid="admin-candidates-detail" aria-labelledby="admin-candidates-detail-heading">
        <div className="admin-detail-toolbar">
          <button type="button" className="btn ghost" onClick={onBack} data-testid="admin-candidates-back">
            返回候选列表
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void exportPackage()}
            disabled={!batch}
            data-testid="admin-candidates-export"
          >
            导出审后包
          </button>
        </div>

        <div className="admin-audit-bad" role="note" data-testid="admin-candidates-gate">
          <p style={{ margin: 0 }}>{GATE_COPY}</p>
        </div>

        {batchLoading ? <p className="admin-empty">正在加载候选批次…</p> : null}
        {batchError ? (
          <div className="admin-empty" role="alert">
            <p>{batchError}</p>
          </div>
        ) : null}

        {batch ? (
          <>
            <header className="admin-books-head">
              <div>
                <h1 id="admin-candidates-detail-heading">{batch.meta.source_title}</h1>
                <p className="muted admin-books-sub">
                  {batch.meta.source_id} · {batch.meta.themes.join(' / ') || '—'} ·{' '}
                  {BATCH_STATUS_LABEL[resolveBatchStatus(batch.meta, selectedDraft)]} · 对齐 data{' '}
                  {batch.meta.aligned_data_version} / schema {batch.meta.aligned_schema_version}
                </p>
              </div>
            </header>

            {notice ? (
              <p className="admin-audit-ok" data-testid="admin-candidates-notice">
                {notice}
              </p>
            ) : null}

            <dl className="admin-meta-grid">
              <div>
                <dt>候选边</dt>
                <dd>{batch.meta.edge_count}</dd>
              </div>
              <div>
                <dt>证据</dt>
                <dd>{batch.meta.evidence_count}</dd>
              </div>
              <div>
                <dt>新节点</dt>
                <dd>{batch.meta.new_node_count}</dd>
              </div>
              <div>
                <dt>append</dt>
                <dd>{batch.meta.append_count}</dd>
              </div>
            </dl>

            <ChapterCoverage chapters={batch.chapters} />

            <div className="admin-filters" role="group" aria-label="候选边筛选">
              <label className="admin-filter">
                <span>筛选</span>
                <select
                  value={filter}
                  data-testid="admin-candidates-filter"
                  onChange={(event) => {
                    setFilter(event.target.value as typeof filter);
                    setPage(1);
                    setExpandedKey(null);
                  }}
                >
                  <option value="all">全部边</option>
                  <option value="append">同端点 append</option>
                  <option value="new">新端点对</option>
                  <option value="discarded">已弃用</option>
                </select>
              </label>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table admin-edge-table" data-testid="admin-candidates-edge-table">
                <thead>
                  <tr>
                    <th>起点</th>
                    <th>终点</th>
                    <th>关系</th>
                    <th>证据</th>
                    <th>标记</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((link) => {
                    const key = candidateEdgeKey(link);
                    const discarded = isEdgeDiscarded(link, selectedDraft);
                    const append = link.merge_action === 'append' || link.existing_endpoint_pair === true;
                    const relation = presentCandidateRelation(link, selectedDraft);
                    const selected = expandedKey === key;
                    return (
                      <tr
                        key={key}
                        className={`admin-table-row${selected ? ' is-selected' : ''}${discarded ? ' is-discarded' : ''}`}
                        data-testid={`admin-candidate-edge-${key}`}
                        onClick={() => setExpandedKey(selected ? null : key)}
                      >
                        <td>{link.source}</td>
                        <td>{link.target}</td>
                        <td>
                          <span className="admin-clip" title={relation}>
                            {relation}
                          </span>
                        </td>
                        <td>{link.evidences.length}</td>
                        <td>
                          {append ? <span className="admin-chip">append</span> : null}
                          {discarded ? <span className="admin-chip admin-chip--draft">已弃用</span> : null}
                          {selectedDraft.relationOverrides?.[key] ? (
                            <span className="admin-chip admin-chip--draft">改关系</span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pager page={safePage} pages={pages} total={filteredLinks.length} onPage={setPage} />

            {expandedKey ? (
              <EdgePanel
                link={batch.links.find((item) => candidateEdgeKey(item) === expandedKey) ?? null}
                draft={selectedDraft}
                relationDraft={relationDraft}
                relationError={relationError}
                onRelationDraft={setRelationDraft}
                onToggleEdge={(discard) =>
                  updateSelectedDraft((draft) => toggleDiscardedEdge(draft, expandedKey, discard))
                }
                onToggleEvidence={(evidenceId, discard) =>
                  updateSelectedDraft((draft) =>
                    toggleDiscardedEvidence(draft, expandedKey, evidenceId, discard),
                  )
                }
                onSaveRelation={() => {
                  const link = batch.links.find((item) => candidateEdgeKey(item) === expandedKey);
                  if (!link) return;
                  const message = validateCandidateRelation(relationDraft);
                  if (message) {
                    setRelationError(message);
                    return;
                  }
                  setRelationError(null);
                  updateSelectedDraft((draft) =>
                    setRelationOverride(draft, expandedKey, relationDraft, link.relation),
                  );
                  setNotice('关系修订已保存在本机');
                }}
                onClose={() => setExpandedKey(null)}
              />
            ) : null}

            <NewNodesPanel
              nodes={batch.newNodes}
              draft={selectedDraft}
              onRemap={(nodeId, value) => updateSelectedDraft((draft) => setNodeRemap(draft, nodeId, value))}
            />
          </>
        ) : null}
      </section>
    );
  }

  return (
    <section className="admin-books" data-testid="admin-candidates-list" aria-labelledby="admin-candidates-heading">
      <header className="admin-books-head">
        <h1 id="admin-candidates-heading">候选审阅</h1>
        <p className="muted admin-books-sub">
          只看待入库抽取批次 · 本机修订 · 导出审后包（不写 seed）
        </p>
      </header>

      <div className="admin-audit-bad" role="note">
        <p style={{ margin: 0 }}>{GATE_COPY}</p>
      </div>

      {listError ? (
        <div className="admin-empty" role="alert">
          <p>{listError}</p>
        </div>
      ) : null}

      {summaries === null ? <p className="admin-empty">正在加载候选批次…</p> : null}

      {summaries && summaries.length === 0 && !listError ? (
        <div className="admin-empty" role="status" data-testid="admin-candidates-empty">
          <p>暂无候选批次</p>
        </div>
      ) : null}

      {summaries && summaries.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table" data-testid="admin-candidates-table">
            <thead>
              <tr>
                <th>source_id</th>
                <th>书名</th>
                <th>主题</th>
                <th>边</th>
                <th>证据</th>
                <th>新节点</th>
                <th>append</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((meta) => {
                const draft = candidateBatchDraft(drafts, meta.source_id);
                const status = resolveBatchStatus(meta, draft);
                return (
                  <tr
                    key={meta.source_id}
                    className="admin-table-row"
                    data-testid={`admin-candidate-row-${meta.source_id}`}
                    onClick={() => onOpen(meta.source_id)}
                  >
                    <td>{meta.source_id}</td>
                    <td>{meta.source_title}</td>
                    <td>{meta.themes.join(', ') || '—'}</td>
                    <td>{meta.edge_count}</td>
                    <td>{meta.evidence_count}</td>
                    <td>{meta.new_node_count}</td>
                    <td>{meta.append_count}</td>
                    <td>{BATCH_STATUS_LABEL[status]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function ChapterCoverage({
  chapters,
}: {
  chapters: CandidateBatchDetail['chapters'];
}) {
  const covered = chapters.filter((row) => !row.skipped);
  const skipped = chapters.filter((row) => row.skipped);
  return (
    <div className="admin-summary" data-testid="admin-candidates-chapters">
      <h2>章节覆盖</h2>
      <p className="muted">
        覆盖 {covered.length} 章 · 跳过 {skipped.length} 章
      </p>
      {skipped.length > 0 ? (
        <ul className="admin-cite-list">
          {skipped.map((row) => (
            <li key={`skip-${row.spine}`}>
              spine {row.spine} · {row.title || '（无标题）'} — {row.skipReason ?? '跳过'}
            </li>
          ))}
        </ul>
      ) : null}
      {covered.length > 0 ? (
        <details>
          <summary>展开覆盖章列表</summary>
          <ul className="admin-cite-list">
            {covered.map((row) => (
              <li key={`cover-${row.spine}`}>
                spine {row.spine} · {row.title || '（无标题）'} · 摘录 {row.excerpts}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function Pager({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="admin-page-actions" data-testid="admin-candidates-pager" style={{ marginTop: 12 }}>
      <button type="button" className="btn ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        上一页
      </button>
      <span className="muted">
        第 {page} / {pages} 页 · 共 {total} 条 · 每页 {CANDIDATE_PAGE_SIZE}
      </span>
      <button type="button" className="btn ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        下一页
      </button>
    </div>
  );
}

function EdgePanel({
  link,
  draft,
  relationDraft,
  relationError,
  onRelationDraft,
  onToggleEdge,
  onToggleEvidence,
  onSaveRelation,
  onClose,
}: {
  link: CandidateLink | null;
  draft: CandidateBatchDraft;
  relationDraft: string;
  relationError: string | null;
  onRelationDraft: (value: string) => void;
  onToggleEdge: (discard: boolean) => void;
  onToggleEvidence: (evidenceId: string, discard: boolean) => void;
  onSaveRelation: () => void;
  onClose: () => void;
}) {
  if (!link) return null;
  const key = candidateEdgeKey(link);
  const discarded = isEdgeDiscarded(link, draft);
  const dropped = discardedEvidenceIds(link, draft);
  return (
    <article className="admin-detail-card" data-testid="admin-candidate-edge-panel" style={{ marginTop: 16 }}>
      <div className="admin-page-head-row">
        <h2 style={{ margin: 0 }}>
          {link.source} → {link.target}
        </h2>
        <button type="button" className="btn ghost" onClick={onClose}>
          收起
        </button>
      </div>
      <p className="muted">
        证据 {link.evidences.length} 条
        {link.merge_action === 'append' || link.existing_endpoint_pair
          ? ' · 与现网同端点（append）'
          : ' · 新端点对'}
      </p>
      <div className="admin-page-actions">
        <button
          type="button"
          className="btn"
          data-testid="admin-candidate-toggle-edge"
          onClick={() => onToggleEdge(!discarded)}
        >
          {discarded ? '恢复整边' : '弃用整边'}
        </button>
      </div>
      <label className="admin-filter" style={{ display: 'grid', gap: 6, marginTop: 12 }}>
        <span>关系表述（最长 {CANDIDATE_RELATION_MAX}）</span>
        <textarea
          value={relationDraft}
          rows={3}
          data-testid="admin-candidate-relation"
          onChange={(event) => onRelationDraft(event.target.value)}
        />
      </label>
      {relationError ? (
        <p className="admin-audit-bad" role="alert">
          {relationError}
        </p>
      ) : null}
      <div className="admin-page-actions">
        <button type="button" className="btn btn--primary" data-testid="admin-candidate-save-relation" onClick={onSaveRelation}>
          保存关系修订
        </button>
      </div>
      <div className="admin-summary">
        <h3>证据</h3>
        <ul className="admin-cite-list" data-testid="admin-candidate-evidences">
          {link.evidences.map((evidence) => {
            const id = evidenceKey(evidence);
            const isDropped = id ? dropped.has(id) : false;
            return (
              <li key={id || evidence.excerpt.slice(0, 24)}>
                <div className="admin-page-actions" style={{ marginBottom: 6 }}>
                  <code>{id || '（无 id）'}</code>
                  {id ? (
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => onToggleEvidence(id, !isDropped)}
                    >
                      {isDropped ? '恢复证据' : '弃用证据'}
                    </button>
                  ) : null}
                </div>
                <p style={{ opacity: isDropped ? 0.45 : 1, whiteSpace: 'pre-wrap' }}>{evidence.excerpt}</p>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="admin-draft-note">边键 {key} · 修订仅存本机草稿</p>
    </article>
  );
}

function NewNodesPanel({
  nodes,
  draft,
  onRemap,
}: {
  nodes: CandidateBatchDetail['newNodes'];
  draft: CandidateBatchDraft;
  onRemap: (nodeId: string, value: string) => void;
}) {
  return (
    <div className="admin-summary" data-testid="admin-candidates-new-nodes" style={{ marginTop: 24 }}>
      <h2>新节点（可 remap）</h2>
      <p className="muted">留空或填回原 id 表示保留新建；填现网 id 则映射到已有节点。</p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>候选 id</th>
              <th>标签</th>
              <th>类型</th>
              <th>映射到</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => {
              const value = presentNodeRemap(node.id, draft);
              const shown = value === node.id ? '' : value;
              return (
                <tr key={node.id}>
                  <td>
                    <code>{node.id}</code>
                  </td>
                  <td>{node.label}</td>
                  <td>{node.type ?? '—'}</td>
                  <td>
                    <input
                      value={shown}
                      placeholder="保留新建"
                      data-testid={`admin-candidate-remap-${node.id}`}
                      onChange={(event) => onRemap(node.id, event.target.value)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
