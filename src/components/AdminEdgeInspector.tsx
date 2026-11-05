import { useEffect, useId, useRef, useState } from 'react';
import type { EdgeFieldDraft } from '../lib/adminMaintenance';
import { edgeBaseline, edgeDraftsEqual, normalizeEdgeDraft, presentEdge, validateEdgeDraft } from '../lib/adminMaintenance';
import { labelOf } from '../lib/adminCatalog';
import { directionLabel, evidenceLabel, strengthLabel } from '../lib/copy';
import type { GraphData, GraphLink } from '../types/graph';

interface AdminEdgeInspectorProps {
  graph: GraphData;
  link: GraphLink;
  index: number;
  draft: EdgeFieldDraft | null;
  onClose: () => void;
  onSave: (draft: EdgeFieldDraft) => void;
  onRevert: () => void;
  onOpenGraph?: (index: number) => void;
}

export function AdminEdgeInspector({
  graph,
  link,
  index,
  draft,
  onClose,
  onSave,
  onRevert,
  onOpenGraph,
}: AdminEdgeInspectorProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EdgeFieldDraft>(() => presentEdge(link, draft));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setEditing(false);
    setError(null);
    setNotice(null);
    closeRef.current?.focus();
  }, [index]);

  useEffect(() => {
    if (!editing) setForm(presentEdge(link, draft));
  }, [draft, editing, link]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (editing) {
        setForm(presentEdge(link, draft));
        setEditing(false);
        setError(null);
        return;
      }
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draft, editing, link, onClose]);

  const shown = presentEdge(link, draft);
  const evidenceRows = shown.evidences.length > 0 ? shown.evidences : null;
  const seedEvidences = link.evidences ?? [];

  function updateEvidence(evidenceIndex: number, patch: Partial<EdgeFieldDraft['evidences'][number]>) {
    setForm((prev) => ({
      ...prev,
      evidences: prev.evidences.map((item, itemIndex) => (itemIndex === evidenceIndex ? { ...item, ...patch } : item)),
    }));
  }

  function save() {
    const message = validateEdgeDraft(form);
    if (message) {
      setError(message);
      setNotice(null);
      return;
    }
    const next = normalizeEdgeDraft(form);
    onSave(next);
    setEditing(false);
    setError(null);
    setNotice(edgeDraftsEqual(next, edgeBaseline(link)) ? '内容与种子一致' : '修订已保存在本机');
  }

  async function copyDraft() {
    const payload = JSON.stringify({ key: `${link.source}~${link.target}`, ...normalizeEdgeDraft(shown) }, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      setNotice('修订已复制');
    } catch {
      setNotice('复制未完成，请检查浏览器剪贴板权限');
    }
  }

  return (
    <div className="admin-inspector-root">
      <button type="button" className="admin-inspector-backdrop" aria-label="关闭边维护" onClick={onClose} />
      <aside
        className="admin-inspector"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="admin-edge-inspector"
      >
        <header className="admin-inspector-head">
          <div className="admin-inspector-title">
            <p className="admin-kicker">维护关联边</p>
            <h2 id={titleId}>
              {labelOf(graph, link.source)}
              <span className="admin-inspector-arrow"> → </span>
              {labelOf(graph, link.target)}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="btn btn--ghost admin-inspector-close"
            data-testid="admin-edge-close"
            onClick={onClose}
          >
            关闭
          </button>
        </header>
        <div className="admin-inspector-body">
          <dl className="admin-meta-grid admin-meta-grid--compact">
            <div>
              <dt>方向</dt>
              <dd>{directionLabel(link.direction)}</dd>
            </div>
            <div>
              <dt>强度</dt>
              <dd>{strengthLabel(link.strength)}</dd>
            </div>
            <div>
              <dt>证据类型</dt>
              <dd>{evidenceLabel(link.evidence_type)}</dd>
            </div>
            <div>
              <dt>图谱序号</dt>
              <dd>{index}</dd>
            </div>
          </dl>
          <p className="admin-draft-note">起点、终点、方向和强度保持种子数据。这里维护关系表述、摘录和局限。</p>

          {editing ? (
            <form
              className="admin-edit-form"
              data-testid="admin-edge-form"
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              <label className="admin-field">
                <span>关系表述</span>
                <textarea
                  rows={2}
                  value={form.relation}
                  data-testid="admin-edge-relation"
                  onChange={(event) => setForm((prev) => ({ ...prev, relation: event.target.value }))}
                />
              </label>
              {form.evidences.length > 0 ? (
                form.evidences.map((item, evidenceIndex) => (
                  <fieldset key={evidenceIndex} className="admin-evidence">
                    <legend>证据 {evidenceIndex + 1}</legend>
                    {seedEvidences[evidenceIndex]?.source_title ? (
                      <p className="muted admin-evidence-source">{seedEvidences[evidenceIndex]?.source_title}</p>
                    ) : null}
                    <label className="admin-field">
                      <span>原文摘录</span>
                      <textarea
                        rows={5}
                        value={item.excerpt}
                        data-testid={`admin-edge-excerpt-${evidenceIndex}`}
                        onChange={(event) => updateEvidence(evidenceIndex, { excerpt: event.target.value })}
                      />
                    </label>
                    <label className="admin-field">
                      <span>局限</span>
                      <textarea
                        rows={3}
                        value={item.limitations}
                        data-testid={`admin-edge-limit-${evidenceIndex}`}
                        onChange={(event) => updateEvidence(evidenceIndex, { limitations: event.target.value })}
                      />
                    </label>
                  </fieldset>
                ))
              ) : (
                <>
                  <label className="admin-field">
                    <span>原文摘录</span>
                    <textarea
                      rows={5}
                      value={form.excerpt}
                      data-testid="admin-edge-excerpt-0"
                      onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))}
                    />
                  </label>
                  <label className="admin-field">
                    <span>局限</span>
                    <textarea
                      rows={3}
                      value={form.limitations}
                      data-testid="admin-edge-limit-0"
                      onChange={(event) => setForm((prev) => ({ ...prev, limitations: event.target.value }))}
                    />
                  </label>
                </>
              )}
              {error ? (
                <p className="admin-form-error" role="alert" data-testid="admin-edge-error">
                  {error}
                </p>
              ) : null}
            </form>
          ) : (
            <div data-testid="admin-edge-view">
              <h3 className="admin-inspector-label">关系表述</h3>
              <p className="admin-prose" data-testid="admin-edge-view-relation">
                {shown.relation}
              </p>
              {evidenceRows ? (
                evidenceRows.map((item, evidenceIndex) => (
                  <article key={evidenceIndex} className="admin-evidence">
                    <h3>证据 {evidenceIndex + 1}</h3>
                    {seedEvidences[evidenceIndex]?.source_title ? (
                      <p className="muted admin-evidence-source">{seedEvidences[evidenceIndex]?.source_title}</p>
                    ) : null}
                    {seedEvidences[evidenceIndex]?.weread_chapter_title ? (
                      <p className="muted admin-evidence-source">{seedEvidences[evidenceIndex]?.weread_chapter_title}</p>
                    ) : null}
                    <h4>原文摘录</h4>
                    <p className="admin-prose">{item.excerpt}</p>
                    <h4>局限</h4>
                    <p className="admin-prose">{item.limitations}</p>
                  </article>
                ))
              ) : (
                <article className="admin-evidence">
                  <h3>原文摘录</h3>
                  <p className="admin-prose">{shown.excerpt}</p>
                  <h4>局限</h4>
                  <p className="admin-prose">{shown.limitations}</p>
                </article>
              )}
            </div>
          )}
          {notice ? (
            <p className="admin-form-notice" role="status" data-testid="admin-edge-notice">
              {notice}
            </p>
          ) : null}
        </div>
        <footer className="admin-inspector-foot">
          {editing ? (
            <>
              <button type="button" className="btn btn--primary" data-testid="admin-edge-save" onClick={save}>
                保存修订
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                data-testid="admin-edge-cancel"
                onClick={() => {
                  setForm(presentEdge(link, draft));
                  setEditing(false);
                  setError(null);
                }}
              >
                取消
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn--primary"
              data-testid="admin-edge-edit"
              onClick={() => {
                setForm(presentEdge(link, draft));
                setEditing(true);
                setError(null);
                setNotice(null);
              }}
            >
              编辑内容
            </button>
          )}
          {draft && !editing ? (
            <button
              type="button"
              className="btn btn--ghost"
              data-testid="admin-edge-revert"
              onClick={() => {
                onRevert();
                setEditing(false);
                setError(null);
                setNotice('已恢复为种子内容');
              }}
            >
              恢复种子
            </button>
          ) : null}
          {draft && !editing ? (
            <button type="button" className="btn btn--ghost" data-testid="admin-edge-copy" onClick={() => void copyDraft()}>
              复制修订
            </button>
          ) : null}
          {onOpenGraph ? (
            <button
              type="button"
              className="btn btn--ghost"
              data-testid="admin-edge-graph"
              onClick={() => onOpenGraph(index)}
            >
              在图谱中查看
            </button>
          ) : null}
        </footer>
      </aside>
    </div>
  );
}
