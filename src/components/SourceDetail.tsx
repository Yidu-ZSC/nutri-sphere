import { useMemo, useState } from 'react';
import type { GraphData, SourceRecord } from '../types/graph';
import { directionLabel } from '../lib/copy';
import { semanticColor } from '../lib/palette';
import {
  citingLinks,
  filterCitingByDirection,
  sourceTypeLabel,
  type SourceDirFilter,
} from '../lib/sourceCitations';

interface SourceDetailProps {
  source: SourceRecord;
  graph: GraphData;
  onBack: () => void;
  onOpenLink: (index: number) => void;
}

function endpointLabel(graph: GraphData, id: string): string {
  return graph.nodes.find((node) => node.id === id)?.label ?? id;
}

const DIR_FILTERS: { id: SourceDirFilter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'protective', label: '保护相关' },
  { id: 'risk', label: '风险相关' },
];

export function SourceDetail({ source, graph, onBack, onOpenLink }: SourceDetailProps) {
  const [dirFilter, setDirFilter] = useState<SourceDirFilter>('all');
  const allLinks = useMemo(() => citingLinks(graph, source.id), [graph, source.id]);
  const visibleLinks = useMemo(
    () => filterCitingByDirection(allLinks, dirFilter),
    [allLinks, dirFilter],
  );
  const edgeCount = allLinks.length;
  const typeLabel = sourceTypeLabel(source.type);

  return (
    <main className="pattern-screen source-screen" data-testid="source-detail">
      <div className="pattern-screen-inner">
        <div className="pattern-toolbar source-toolbar">
          <button
            type="button"
            className="btn btn--ghost pattern-main-btn"
            data-testid="source-back"
            onClick={onBack}
          >
            返回
          </button>
          <nav className="source-breadcrumb" aria-label="面包屑" data-testid="source-breadcrumb">
            <button type="button" className="source-crumb-link" onClick={onBack}>
              图谱
            </button>
            <span className="source-crumb-sep" aria-hidden="true">
              /
            </span>
            <span className="source-crumb-plain">来源</span>
            <span className="source-crumb-sep" aria-hidden="true">
              /
            </span>
            <span className="source-crumb-current" title={source.title}>
              {source.title}
            </span>
          </nav>
        </div>

        <section className="source-card pattern-section" data-testid="source-card" aria-labelledby="source-title">
          <div className="source-card-main">
            <h1 id="source-title" className="source-card-title" data-testid="source-title">
              {source.title}
            </h1>
            <p className="muted source-card-byline" data-testid="source-byline">
              {source.authors} · {source.year}
            </p>
            <span className="source-type-badge" data-testid="source-type-badge">
              {typeLabel}
            </span>
          </div>
          <p className="source-card-summary" data-testid="source-summary">
            {source.summary}
          </p>
          <div className="source-card-meta">
            <p className="muted source-edge-count" data-testid="source-edge-count">
              本系统引用了 {edgeCount} 条相关描述
            </p>
            {source.url ? (
              <a
                className="source-external-link"
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="source-external-link"
              >
                查看公开资料
              </a>
            ) : null}
          </div>
        </section>

        <section
          className="source-cites pattern-section"
          aria-labelledby="source-citations-heading"
          data-testid="source-cites"
        >
          <div className="source-cites-head">
            <h2 id="source-citations-heading">本书被引用的边</h2>
            <div
              className="segment source-dir-filter"
              role="group"
              aria-label="按方向筛选"
              data-testid="source-dir-filter"
            >
              {DIR_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={dirFilter === item.id}
                  data-testid={`source-dir-${item.id}`}
                  onClick={() => setDirFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {edgeCount === 0 ? (
            <p className="muted" data-testid="source-empty">
              暂无引用边
            </p>
          ) : visibleLinks.length === 0 ? (
            <p className="muted" data-testid="source-filter-empty">
              当前筛选下暂无引用边
            </p>
          ) : (
            <ul className="source-cite-list" data-testid="source-cite-list">
              {visibleLinks.map(({ link, index }) => (
                <li key={index}>
                  <button
                    type="button"
                    className="related-btn source-cite-btn"
                    style={{ borderLeftColor: semanticColor(link.direction) }}
                    data-testid={`source-cite-${index}`}
                    onClick={() => onOpenLink(index)}
                  >
                    <span className="related-btn-main">
                      {endpointLabel(graph, link.source)} → {endpointLabel(graph, link.target)}
                    </span>
                    <span className="muted source-cite-relation">{link.relation}</span>
                    <span
                      className="badge badge--direction source-cite-dir"
                      style={{ borderLeftColor: semanticColor(link.direction) }}
                    >
                      {directionLabel(link.direction)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
