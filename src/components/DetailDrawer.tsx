import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  directionLabel,
  evidenceAssurance,
  evidenceBadge,
  evidenceDetail,
  evidenceLabel,
  evidenceStatus,
  evidenceTrack,
  EVIDENCE_LADDER,
  groupLabel,
  nodeTypeLabel,
  strengthLabel,
  withEnum,
  DISCLAIMER_SHORT,
} from '../lib/copy';
import { semanticColor } from '../lib/palette';
import type { GraphCitation, GraphData, GraphLink, GraphNode, Selection, ViewLayer } from '../types/graph';

interface DetailDrawerProps {
  graph: GraphData;
  selection: Selection;
  layer: ViewLayer;
  mobile: boolean;
  evidenceCounts: Record<string, number>;
  visibleLinkIndices: ReadonlySet<number>;
  onClose: () => void;
  onSelectNode: (id: string) => void;
  onSelectLink: (index: number) => void;
}

function Swatch({ value }: { value: string }) {
  return <i className="swatch" style={{ background: semanticColor(value) }} aria-hidden="true" />;
}

function Field({
  label,
  children,
  testId,
}: {
  label: string;
  children: string | null | undefined;
  testId?: string;
}) {
  if (!children) return null;
  return (
    <div data-testid={testId}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function formatUnknown(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => formatUnknown(item))
      .filter((item): item is string => Boolean(item));
    return parts.length > 0 ? parts.join('、') : null;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return null;
  }
}

function ExcerptBlock({ text, full }: { text: string | undefined; full: boolean }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [text, full]);
  if (!text) return null;
  const limit = 48;
  const folded = !full && text.length > limit && !expanded;
  const shown = folded ? `${text.slice(0, limit)}…` : text;
  return (
    <div>
      <dt>摘录</dt>
      <dd>
        <p className="excerpt">{shown}</p>
        {!full && text.length > limit && (
          <button type="button" className="linkish" onClick={() => setExpanded((value) => !value)}>
            {expanded ? '收起摘录' : '展开摘录'}
          </button>
        )}
        <p className="muted">摘录与局限来自数据字段，界面未改写原文。</p>
      </dd>
    </div>
  );
}

function endpointLabel(graph: GraphData, id: string, layer: ViewLayer): string {
  const node = graph.nodes.find((item) => item.id === id);
  if (!node) return id;
  return layer === 'expert' ? `${node.label} · ${node.id}` : node.label;
}

function relatedLinks(
  graph: GraphData,
  nodeId: string,
  visibleLinkIndices: ReadonlySet<number>,
): { link: GraphLink; index: number }[] {
  return graph.links
    .map((link, index) => ({ link, index }))
    .filter(
      ({ link, index }) =>
        (link.source === nodeId || link.target === nodeId) && visibleLinkIndices.has(index),
    );
}

function NodeBody({
  graph,
  node,
  layer,
  visibleLinkIndices,
  onSelectLink,
}: {
  graph: GraphData;
  node: GraphNode;
  layer: ViewLayer;
  visibleLinkIndices: ReadonlySet<number>;
  onSelectLink: (index: number) => void;
}) {
  const expert = layer === 'expert';
  const links = relatedLinks(graph, node.id, visibleLinkIndices);
  return (
    <>
      <p className="kicker">节点</p>
      <h2>{node.label}</h2>
      <dl className="fields">
        {expert && <Field label="id" testId="node-id" children={node.id} />}
        <div>
          <dt>类型</dt>
          <dd>{withEnum(nodeTypeLabel(node.type), node.type, layer)}</dd>
        </div>
        <div>
          <dt>分组</dt>
          <dd className="inline">
            <Swatch value={node.group} />
            {withEnum(groupLabel(node.group), node.group, layer)}
          </dd>
        </div>
        <Field label="说明" children={node.description} />
        {(expert || (node.aliases && node.aliases.length > 0)) && (
          <Field label="别名" children={node.aliases?.join('、')} />
        )}
        {expert && <Field label="来源" children={formatUnknown(node.sources)} />}
        {expert && <Field label="metadata" children={formatUnknown(node.metadata)} />}
      </dl>
      {links.length > 0 && (
        <section className="related" aria-label="相关关联">
          <h3>相关关联</h3>
          <ul>
            {links.map(({ link, index }) => {
              const otherId = link.source === node.id ? link.target : link.source;
              return (
                <li key={index}>
                  <button type="button" className="related-btn" onClick={() => onSelectLink(index)}>
                    <span className="inline">
                      <Swatch value={link.direction} />
                      {link.relation}
                    </span>
                    <span className="muted">
                      {directionLabel(link.direction)} · {evidenceBadge(link.evidence_type)}
                      {evidenceTrack(link.evidence_type) === 'literature' ? ' · 文献' : ''} ·{' '}
                      {endpointLabel(graph, otherId, layer)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

function SourceFile({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <dt>来源文件</dt>
      <dd className="source-line">
        <code>{name}</code>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            const finish = () => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            };
            if (navigator.clipboard?.writeText) {
              void navigator.clipboard.writeText(name).then(finish).catch(finish);
              return;
            }
            finish();
          }}
        >
          {copied ? '已复制' : '复制'}
        </button>
      </dd>
    </div>
  );
}

function CitationBlock({ citation }: { citation: GraphCitation }) {
  const byline = [citation.authors, citation.year == null ? '' : String(citation.year)].filter(Boolean);
  return (
    <div className="citation-block" data-testid="literature-citation">
      {citation.title ? <p className="citation-title">{citation.title}</p> : null}
      {byline.length > 0 ? <p className="muted">{byline.join(' · ')}</p> : null}
      <p className="citation-links">
        {citation.doi ? (
          <a
            className="linkish"
            href={`https://doi.org/${citation.doi}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            DOI {citation.doi}
          </a>
        ) : null}
        {citation.pmid ? (
          <a
            className="linkish"
            href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            PMID {citation.pmid}
          </a>
        ) : null}
      </p>
    </div>
  );
}

function CitationDisclosure({ citation, layer }: { citation: GraphCitation; layer: ViewLayer }) {
  const expert = layer === 'expert';
  return (
    <details key={layer} className="citation-fold" data-testid="citation-details" open={expert}>
      <summary>{expert ? '文献' : '文献详情'}</summary>
      <CitationBlock citation={citation} />
    </details>
  );
}

function LinkBody({
  graph,
  link,
  layer,
  counts,
  onSelectNode,
}: {
  graph: GraphData;
  link: GraphLink;
  layer: ViewLayer;
  counts: Record<string, number>;
  onSelectNode: (id: string) => void;
}) {
  const expert = layer === 'expert';
  const known = new Set(EVIDENCE_LADDER.map((step) => step.id));
  const extras = Object.keys(counts).filter((id) => !known.has(id));
  return (
    <>
      <p className="kicker">关联证据</p>
      <h2>{link.relation}</h2>
      <p className="endpoints">
        <button type="button" className="linkish" onClick={() => onSelectNode(link.source)}>
          {endpointLabel(graph, link.source, layer)}
        </button>
        <span aria-hidden="true"> → </span>
        <button type="button" className="linkish" onClick={() => onSelectNode(link.target)}>
          {endpointLabel(graph, link.target, layer)}
        </button>
      </p>
      <div className="evidence-card" data-testid="evidence-card">
        <div className="badge-row" data-testid="evidence-badges">
          <span className="badge badge--direction">
            <Swatch value={link.direction} />
            {directionLabel(link.direction)}
          </span>
          <span className="badge badge--evidence">{evidenceBadge(link.evidence_type)}</span>
          {evidenceTrack(link.evidence_type) === 'literature' && (
            <span className="badge badge--literature">文献</span>
          )}
          <span className="badge badge--strength">
            <span className={`legend-line legend-line--${link.strength === 'high' ? 'high' : link.strength === 'moderate' ? 'mid' : 'low'}`} />
            {strengthLabel(link.strength)}
          </span>
        </div>
        <p className="assurance">{evidenceAssurance(link.evidence_type, link.strength)}</p>
        <div className="limitations-callout" data-testid="link-limitations">
          <p className="muted">局限</p>
          <p>{link.limitations?.trim() ? link.limitations : '未注明局限'}</p>
        </div>
        {link.citation ? <CitationDisclosure citation={link.citation} layer={layer} /> : null}
        <dl className="fields">
          <ExcerptBlock text={link.excerpt} full={expert} />
          <SourceFile name={link.source_file ?? '未注明'} />
          <Field label="证据类型说明" children={evidenceDetail(link.evidence_type)} />
        </dl>
        <details className="ladder">
          <summary>证据类型说明</summary>
          <ul>
            {EVIDENCE_LADDER.map((step) => (
              <li key={step.id} className={step.id === link.evidence_type ? 'is-current' : undefined}>
                <span>{step.badge}</span>
                <span className="muted">{evidenceStatus(step.id, counts)}</span>
              </li>
            ))}
            {extras.map((id) => (
              <li key={id} className={id === link.evidence_type ? 'is-current' : undefined}>
                <span>{evidenceBadge(id)}</span>
                <span className="muted">{evidenceStatus(id, counts)}</span>
              </li>
            ))}
          </ul>
          <p className="muted">这些名称只说明资料来源，不是临床等级。</p>
        </details>
      </div>
      {expert && (
        <dl className="fields" data-testid="expert-link-meta">
          <Field label="边 id" testId="edge-id" children={link.id} />
          <Field label="dose_response" testId="dose-response" children={link.dose_response} />
          <Field label="population" testId="population" children={link.population} />
          <Field label="direction" children={withEnum(directionLabel(link.direction), link.direction, layer)} />
          <Field
            label="strength"
            children={link.strength ? withEnum(strengthLabel(link.strength), link.strength, layer) : '未注明'}
          />
          <Field
            label="evidence_type"
            children={withEnum(evidenceLabel(link.evidence_type), link.evidence_type, layer)}
          />
          <Field label="note_id" children={link.note_id} />
          <Field label="citation" children={formatUnknown(link.citation)} />
          <Field label="weight" children={link.weight == null ? null : String(link.weight)} />
          <Field label="metadata" children={formatUnknown(link.metadata)} />
        </dl>
      )}
    </>
  );
}

export function DetailDrawer({
  graph,
  selection,
  layer,
  mobile,
  evidenceCounts,
  visibleLinkIndices,
  onClose,
  onSelectNode,
  onSelectLink,
}: DetailDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [dragY, setDragY] = useState(0);
  const drag = useRef({ active: false, start: 0, dy: 0 });

  useEffect(() => {
    closeRef.current?.focus();
  }, [selection]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!mobile) return;
    drag.current = { active: true, start: event.clientY, dy: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const dy = Math.max(0, event.clientY - drag.current.start);
    drag.current.dy = dy;
    setDragY(dy);
  };
  const onPointerUp = () => {
    if (!drag.current.active) return;
    const shouldClose = drag.current.dy > 90;
    drag.current.active = false;
    setDragY(0);
    if (shouldClose) onClose();
  };

  const node = selection.kind === 'node' ? graph.nodes.find((item) => item.id === selection.id) : undefined;
  const link = selection.kind === 'link' ? graph.links[selection.index] : undefined;

  return (
    <aside
      className="drawer"
      role="dialog"
      aria-label="证据详情"
      data-testid="detail-drawer"
      style={dragY ? { transform: `translateY(${dragY}px)` } : undefined}
    >
      <div
        className="drawer-handle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="drawer-grip" aria-hidden="true" />
        <p className="drawer-short">{DISCLAIMER_SHORT}</p>
      </div>
      <div className="drawer-toolbar">
        <button ref={closeRef} type="button" className="btn btn--ghost" onClick={onClose} aria-label="关闭详情">
          关闭
        </button>
      </div>
      <div className="drawer-body">
        {selection.kind === 'node' && node && (
          <NodeBody
            graph={graph}
            node={node}
            layer={layer}
            visibleLinkIndices={visibleLinkIndices}
            onSelectLink={onSelectLink}
          />
        )}
        {selection.kind === 'link' && link && (
          <LinkBody
            graph={graph}
            link={link}
            layer={layer}
            counts={evidenceCounts}
            onSelectNode={onSelectNode}
          />
        )}
        {selection.kind === 'node' && !node && <p>未找到该节点。</p>}
        {selection.kind === 'link' && !link && <p>未找到该关联。</p>}
      </div>
    </aside>
  );
}
