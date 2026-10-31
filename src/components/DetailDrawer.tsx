import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  directionLabel,
  evidenceLabel,
  groupLabel,
  nodeTypeLabel,
  strengthLabel,
  withEnum,
  DISCLAIMER_SHORT,
} from '../lib/copy';
import { semanticColor } from '../lib/palette';
import type { GraphData, GraphLink, GraphNode, Selection, ViewLayer } from '../types/graph';

interface DetailDrawerProps {
  graph: GraphData;
  selection: Selection;
  layer: ViewLayer;
  mobile: boolean;
  onClose: () => void;
  onSelectNode: (id: string) => void;
  onSelectLink: (index: number) => void;
}

function Swatch({ value }: { value: string }) {
  return <i className="swatch" style={{ background: semanticColor(value) }} aria-hidden="true" />;
}

function Field({ label, children }: { label: string; children: string | null | undefined }) {
  if (!children) return null;
  return (
    <div>
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

function relatedLinks(graph: GraphData, nodeId: string): { link: GraphLink; index: number }[] {
  return graph.links
    .map((link, index) => ({ link, index }))
    .filter(({ link }) => link.source === nodeId || link.target === nodeId);
}

function NodeBody({
  graph,
  node,
  layer,
  onSelectLink,
}: {
  graph: GraphData;
  node: GraphNode;
  layer: ViewLayer;
  onSelectLink: (index: number) => void;
}) {
  const expert = layer === 'expert';
  const links = relatedLinks(graph, node.id);
  return (
    <>
      <p className="kicker">节点</p>
      <h2>{node.label}</h2>
      <dl className="fields">
        {expert && <Field label="id" children={node.id} />}
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
                      {directionLabel(link.direction)} · {endpointLabel(graph, otherId, layer)}
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

function LinkBody({
  graph,
  link,
  layer,
  onSelectNode,
}: {
  graph: GraphData;
  link: GraphLink;
  layer: ViewLayer;
  onSelectNode: (id: string) => void;
}) {
  const expert = layer === 'expert';
  return (
    <>
      <p className="kicker">关联</p>
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
      <dl className="fields">
        <div>
          <dt>方向</dt>
          <dd className="inline">
            <Swatch value={link.direction} />
            {withEnum(directionLabel(link.direction), link.direction, layer)}
          </dd>
        </div>
        <Field
          label="强度"
          children={
            link.strength ? withEnum(strengthLabel(link.strength), link.strength, layer) : '未注明'
          }
        />
        <Field label="证据类型" children={withEnum(evidenceLabel(link.evidence_type), link.evidence_type, layer)} />
        <ExcerptBlock text={link.excerpt} full={expert} />
        <Field label="来源文件" children={link.source_file ?? '未注明'} />
        <Field label="局限" children={link.limitations?.trim() ? link.limitations : '未注明局限'} />
        {expert && <Field label="note_id" children={link.note_id} />}
        {expert && <Field label="边 id" children={link.id} />}
        {expert && <Field label="dose_response" children={link.dose_response} />}
        {expert && <Field label="population" children={link.population} />}
        {expert && <Field label="weight" children={link.weight == null ? null : String(link.weight)} />}
        {expert && <Field label="metadata" children={formatUnknown(link.metadata)} />}
      </dl>
    </>
  );
}

export function DetailDrawer({
  graph,
  selection,
  layer,
  mobile,
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
          <NodeBody graph={graph} node={node} layer={layer} onSelectLink={onSelectLink} />
        )}
        {selection.kind === 'link' && link && (
          <LinkBody graph={graph} link={link} layer={layer} onSelectNode={onSelectNode} />
        )}
        {selection.kind === 'node' && !node && <p>未找到该节点。</p>}
        {selection.kind === 'link' && !link && <p>未找到该关联。</p>}
      </div>
    </aside>
  );
}
