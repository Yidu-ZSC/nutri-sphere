import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import {
  audienceLabel,
  directionLabel,
  evidenceBadge,
  evidenceLabel,
  evidenceStatus,
  evidenceTrack,
  EVIDENCE_LADDER,
  groupLabel,
  mechanismDepthLabel,
  nodeTypeLabel,
  strengthLabel,
  withEnum,
} from '../lib/copy';
import { DIET_PATTERN_CARDS, type DietPatternCard } from '../lib/dietPatterns';
import { PATTERN_SHELL } from '../lib/dietPatternDetails';
import { semanticColor } from '../lib/palette';
import type { GraphCitation, GraphData, GraphEvidence, GraphLink, GraphNode, Selection } from '../types/graph';

interface DetailDrawerProps {
  graph: GraphData;
  selection: Selection;
  mobile: boolean;
  evidenceCounts: Record<string, number>;
  visibleLinkIndices: ReadonlySet<number>;
  onClose: () => void;
  onSelectNode: (id: string) => void;
  onSelectLink: (index: number) => void;
  onOpenSource?: (sourceId: string) => void;
  onShowPatterns?: () => void;
  relatedPatternIds?: readonly string[];
  onOpenPattern?: (id: string) => void;
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

function ExcerptBlock({ text }: { text: string | undefined }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [text]);
  if (!text) return null;
  const limit = 120;
  const folded = text.length > limit && !expanded;
  const shown = folded ? `${text.slice(0, limit)}…` : text;
  return (
    <div data-testid="link-excerpt">
      <dt>原文摘录</dt>
      <dd>
        <p className="excerpt">{shown}</p>
        {text.length > limit && (
          <button type="button" className="linkish" onClick={() => setExpanded((value) => !value)}>
            {expanded ? '收起原文摘录' : '展开原文摘录'}
          </button>
        )}
      </dd>
    </div>
  );
}

function endpointLabel(graph: GraphData, id: string): string {
  const node = graph.nodes.find((item) => item.id === id);
  if (!node) return id;
  return node.label;
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

function MoreDetail({ children }: { children: ReactNode }) {
  return (
    <details className="more-detail" data-testid="more-detail">
      <summary>更多说明</summary>
      {children}
    </details>
  );
}

function NodeBody({
  graph,
  node,
  visibleLinkIndices,
  onSelectLink,
}: {
  graph: GraphData;
  node: GraphNode;
  visibleLinkIndices: ReadonlySet<number>;
  onSelectLink: (index: number) => void;
}) {
  const links = relatedLinks(graph, node.id, visibleLinkIndices);
  const depth = node.mechanism_depth;
  const sources = formatUnknown(node.sources);
  const metadata = formatUnknown(node.metadata);
  const hasAliases = Boolean(node.aliases && node.aliases.length > 0);
  const hasMore =
    Boolean(node.type) ||
    hasAliases ||
    Boolean(depth) ||
    Boolean(node.id) ||
    Boolean(sources) ||
    Boolean(metadata);
  return (
    <>
      <p className="kicker">节点</p>
      <h2>{node.label}</h2>
      {node.group ? (
        <div className="badge-row drawer-block" data-testid="node-direction">
          <span
            className="badge badge--direction"
            style={{ borderLeftColor: semanticColor(node.group) }}
          >
            <Swatch value={node.group} />
            {groupLabel(node.group)}
          </span>
        </div>
      ) : null}
      {node.description ? (
        <section className="drawer-block drawer-desc" data-testid="node-description">
          <p className="muted drawer-block-label">说明</p>
          <p className="drawer-desc-text">{node.description}</p>
        </section>
      ) : null}
      {links.length > 0 && (
        <section className="related drawer-block" aria-label="相关关联" data-testid="node-related">
          <h3>相关关联</h3>
          <ul>
            {links.map(({ link, index }) => {
              const otherId = link.source === node.id ? link.target : link.source;
              return (
                <li key={index}>
                  <button
                    type="button"
                    className="related-btn"
                    style={{ borderLeftColor: semanticColor(link.direction) }}
                    onClick={() => onSelectLink(index)}
                  >
                    <span className="related-btn-main">{link.relation}</span>
                    <span className="muted">
                      {directionLabel(link.direction)} · {evidenceBadge(link.evidence_type)}
                      {evidenceTrack(link.evidence_type) === 'literature' ? ' · 文献' : ''} ·{' '}
                      {endpointLabel(graph, otherId)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {hasMore && (
        <MoreDetail>
          <dl className="fields">
            <div>
              <dt>类型</dt>
              <dd>{withEnum(nodeTypeLabel(node.type), node.type)}</dd>
            </div>
            {hasAliases ? <Field label="别名" children={node.aliases!.join('、')} /> : null}
            {depth ? (
              <Field
                label="说明深度"
                testId="node-mechanism-depth"
                children={mechanismDepthLabel(depth)}
              />
            ) : null}
            <Field label="id" testId="node-id" children={node.id} />
            <Field label="来源" children={sources} />
            <Field label="metadata" children={metadata} />
          </dl>
        </MoreDetail>
      )}
    </>
  );
}

type SourceRef = Pick<GraphEvidence, 'source_title' | 'source_id' | 'citation' | 'weread_bookmark_id'> | GraphLink;

function SourceTitleLink({
  evidence,
  onOpenSource,
  testId = 'link-source-title',
}: {
  evidence: SourceRef;
  onOpenSource?: (sourceId: string) => void;
  testId?: string;
}) {
  const title = evidence.source_title?.trim() || '未注明来源';
  const sourceId = evidence.source_id?.trim() || '';
  const doi = evidence.citation?.doi?.trim() || '';
  const pmid = evidence.citation?.pmid?.trim() || '';
  let href: string | null = null;
  let action: (() => void) | null = null;
  if (sourceId && onOpenSource) {
    action = () => onOpenSource(sourceId);
  } else if (doi) {
    href = `https://doi.org/${doi}`;
  } else if (pmid) {
    href = `https://pubmed.ncbi.nlm.nih.gov/${pmid}`;
  }
  const wereadId =
    ('weread_bookmark_id' in evidence && evidence.weread_bookmark_id) ||
    ('evidences' in evidence &&
      Array.isArray(evidence.evidences) &&
      evidence.evidences[0]?.weread_bookmark_id);
  const wereadLabel = wereadId ? (
    <span className="muted weread-evidence-label" data-testid="weread-evidence-label">
      微信划线
    </span>
  ) : null;
  return (
    <div data-testid={testId}>
      <dt>来源</dt>
      <dd>
        {action ? (
          <button type="button" className="linkish" data-testid="open-source-page" onClick={action}>
            {title}
          </button>
        ) : href ? (
          <a
            className="linkish"
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            data-testid="open-source-external"
          >
            {title}
          </a>
        ) : (
          <span>{title}</span>
        )}
        {wereadLabel}
      </dd>
    </div>
  );
}

function MoreEvidences({
  evidences,
  onOpenSource,
}: {
  evidences: GraphEvidence[];
  onOpenSource?: (sourceId: string) => void;
}) {
  const extras = evidences.slice(1);
  if (extras.length === 0) return null;
  return (
    <details className="more-evidences" data-testid="more-evidences">
      <summary>还有 {extras.length} 处相关描述</summary>
      {extras.map((ev, index) => (
        <div className="drawer-block evidence-extra" key={index} data-testid={`evidence-extra-${index}`}>
          <dl className="fields">
            <ExcerptBlock text={ev.excerpt} />
            <SourceTitleLink evidence={ev} onOpenSource={onOpenSource} testId={`extra-source-title-${index}`} />
          </dl>
          <div className="limitations-callout" data-testid={`extra-limitations-${index}`}>
            <p className="muted">局限</p>
            <p>{ev.limitations?.trim() ? ev.limitations : '未注明局限'}</p>
          </div>
        </div>
      ))}
    </details>
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

function LinkBody({
  graph,
  link,
  counts,
  onSelectNode,
  onOpenSource,
}: {
  graph: GraphData;
  link: GraphLink;
  counts: Record<string, number>;
  onSelectNode: (id: string) => void;
  onOpenSource?: (sourceId: string) => void;
}) {
  const known = new Set(EVIDENCE_LADDER.map((step) => step.id));
  const extras = Object.keys(counts).filter((id) => !known.has(id));
  const sourceNode = graph.nodes.find((item) => item.id === link.source);
  const targetNode = graph.nodes.find((item) => item.id === link.target);
  return (
    <>
      <p className="kicker">关联证据</p>
      <h2>{link.relation}</h2>
      <p className="endpoints">
        <button type="button" className="linkish" onClick={() => onSelectNode(link.source)}>
          {endpointLabel(graph, link.source)}
        </button>
        <span aria-hidden="true"> → </span>
        <button type="button" className="linkish" onClick={() => onSelectNode(link.target)}>
          {endpointLabel(graph, link.target)}
        </button>
      </p>
      <div className="evidence-card" data-testid="evidence-card">
        <dl className="fields">
          <ExcerptBlock text={(link.evidences && link.evidences[0]?.excerpt) || link.excerpt} />
          <SourceTitleLink
            evidence={(link.evidences && link.evidences[0]) || link}
            onOpenSource={onOpenSource}
          />
        </dl>
        <div className="limitations-callout" data-testid="link-limitations">
          <p className="muted">局限</p>
          <p>
            {(() => {
              const primary = link.evidences?.[0]?.limitations ?? link.limitations;
              return primary?.trim() ? primary : '未注明局限';
            })()}
          </p>
        </div>
        <MoreEvidences evidences={link.evidences ?? []} onOpenSource={onOpenSource} />
        <div className="badge-row" data-testid="evidence-badges">
          <span className="badge badge--direction" style={{ borderLeftColor: semanticColor(link.direction) }}>
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
        <MoreDetail>
          {link.citation ? <CitationBlock citation={link.citation} /> : null}
          {link.audience ? (
            <dl className="fields">
              <Field label="读者对象" children={audienceLabel(link.audience)} />
            </dl>
          ) : null}
          {(sourceNode?.mechanism_depth || targetNode?.mechanism_depth) && (
            <dl className="fields">
              {sourceNode?.mechanism_depth ? (
                <Field
                  label={`${sourceNode.label} · 说明深度`}
                  children={mechanismDepthLabel(sourceNode.mechanism_depth)}
                />
              ) : null}
              {targetNode?.mechanism_depth ? (
                <Field
                  label={`${targetNode.label} · 说明深度`}
                  children={mechanismDepthLabel(targetNode.mechanism_depth)}
                />
              ) : null}
            </dl>
          )}
          <details className="ladder">
            <summary>证据类型一览</summary>
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
          </details>
          <dl className="fields" data-testid="expert-link-meta">
            <Field label="边 id" testId="edge-id" children={link.id} />
            <Field label="dose_response" testId="dose-response" children={link.dose_response} />
            <Field label="population" testId="population" children={link.population} />
            <Field label="direction" children={withEnum(directionLabel(link.direction), link.direction)} />
            <Field
              label="strength"
              children={link.strength ? withEnum(strengthLabel(link.strength), link.strength) : '未注明'}
            />
            <Field
              label="evidence_type"
              children={withEnum(evidenceLabel(link.evidence_type), link.evidence_type)}
            />
            <Field label="note_id" children={link.note_id} />
            <Field label="citation" children={formatUnknown(link.citation)} />
            <Field label="weight" children={link.weight == null ? null : String(link.weight)} />
            <Field label="metadata" children={formatUnknown(link.metadata)} />
          </dl>
        </MoreDetail>
      </div>
    </>
  );
}

export function DetailDrawer({
  graph,
  selection,
  mobile,
  evidenceCounts,
  visibleLinkIndices,
  onClose,
  onSelectNode,
  onSelectLink,
  onOpenSource,
  onShowPatterns,
  relatedPatternIds = [],
  onOpenPattern,
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
  const relatedPatterns = relatedPatternIds
    .map((id) => DIET_PATTERN_CARDS.find((card) => card.id === id))
    .filter((card): card is DietPatternCard => card != null);
  const openRelatedPattern = onOpenPattern;

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
            visibleLinkIndices={visibleLinkIndices}
            onSelectLink={onSelectLink}
          />
        )}
        {selection.kind === 'link' && link && (
          <LinkBody
            graph={graph}
            link={link}
            counts={evidenceCounts}
            onSelectNode={onSelectNode}
            onOpenSource={onOpenSource}
          />
        )}
        {selection.kind === 'node' && !node && <p>未找到该节点。</p>}
        {selection.kind === 'link' && !link && <p>未找到该关联。</p>}
      </div>
      {(onShowPatterns || (openRelatedPattern && relatedPatterns.length > 0)) && (
        <div className="drawer-patterns">
          {onShowPatterns && (
            <button
              type="button"
              className="btn btn--ghost drawer-pattern-btn"
              data-testid="show-related-patterns"
              onClick={onShowPatterns}
            >
              查看相关饮食模式
            </button>
          )}
          {openRelatedPattern && relatedPatterns.length > 0 && (
            <div className="drawer-pattern-actions" data-testid="pattern-detail-actions">
              <button
                type="button"
                className="btn btn--ghost drawer-pattern-btn"
                data-testid="show-pattern-detail"
                onClick={() => openRelatedPattern('vegan_diet')}
              >
                {PATTERN_SHELL.sidebarOne}
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
