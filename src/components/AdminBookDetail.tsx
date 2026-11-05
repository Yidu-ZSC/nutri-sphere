import { useMemo } from 'react';
import type { AdminBookRecord, GraphData, SourcesData } from '../types/graph';
import { directionLabel } from '../lib/copy';
import {
  displayAuthors,
  displayTitle,
  displayYear,
  edgeCountForBook,
  kbBodySynced,
  RELEVANCE_LABEL,
  sourceForBook,
  STATUS_LABEL,
} from '../lib/adminBooks';
import { citingLinks, sourceTypeLabel } from '../lib/sourceCitations';

interface AdminBookDetailProps {
  book: AdminBookRecord;
  sources: SourcesData | null;
  graph: GraphData | null;
  onBack: () => void;
  onOpenPublicSource?: (sourceId: string) => void;
  onOpenLink?: (index: number) => void;
}

function endpointLabel(graph: GraphData, id: string): string {
  return graph.nodes.find((node) => node.id === id)?.label ?? id;
}

export function AdminBookDetail({
  book,
  sources,
  graph,
  onBack,
  onOpenPublicSource,
  onOpenLink,
}: AdminBookDetailProps) {
  const source = sourceForBook(sources, book);
  const cites = useMemo(
    () => (graph && book.source_id ? citingLinks(graph, book.source_id) : []),
    [graph, book.source_id],
  );
  const edgeCount = edgeCountForBook(graph, book.source_id);
  const title = displayTitle(book, source);
  const authors = displayAuthors(book, source);
  const year = displayYear(book, source);
  const kbPath = `data/kb/${book.kb_file}`;
  const kbReady = kbBodySynced(book.kb_file);

  return (
    <section className="admin-book-detail" data-testid="admin-book-detail" aria-labelledby="admin-book-title">
      <div className="admin-detail-toolbar">
        <button type="button" className="btn btn--ghost" data-testid="admin-book-back" onClick={onBack}>
          返回列表
        </button>
        {book.source_id && onOpenPublicSource ? (
          <button
            type="button"
            className="btn btn--ghost"
            data-testid="admin-open-public-source"
            onClick={() => onOpenPublicSource(book.source_id!)}
          >
            在公开来源页查看
          </button>
        ) : null}
      </div>

      <div className="admin-detail-card pattern-section">
        <h1 id="admin-book-title" data-testid="admin-book-title">
          {title}
        </h1>
        <p className="muted" data-testid="admin-book-byline">
          {authors} · {year}
        </p>
        {source ? (
          <span className="source-type-badge" data-testid="admin-book-type">
            {sourceTypeLabel(source.type)}
          </span>
        ) : null}
        <dl className="admin-meta-grid" data-testid="admin-book-meta">
          <div>
            <dt>主题</dt>
            <dd>{book.theme}</dd>
          </div>
          <div>
            <dt>相关度</dt>
            <dd>{RELEVANCE_LABEL[book.relevance]}</dd>
          </div>
          <div>
            <dt>笔记数</dt>
            <dd>{book.note_count}</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd>{STATUS_LABEL[book.status]}</dd>
          </div>
          <div>
            <dt>已入库边数</dt>
            <dd data-testid="admin-detail-edge-count">{edgeCount}</dd>
          </div>
        </dl>
        <div className="admin-summary" data-testid="admin-book-summary">
          <h2>简介</h2>
          {source ? (
            <p>{source.summary}</p>
          ) : (
            <p className="muted">尚未入库到图谱来源表；简介待 sources 收录后显示。</p>
          )}
        </div>
      </div>

      <div className="admin-detail-card pattern-section" data-testid="admin-book-cites">
        <h2>关联边</h2>
        {cites.length === 0 ? (
          <p className="muted" data-testid="admin-cites-empty">
            暂无入库关联边
          </p>
        ) : (
          <ul className="source-cite-list admin-cite-list">
            {cites.map(({ link, index }) => (
              <li key={`${link.source}~${link.target}~${index}`}>
                <button
                  type="button"
                  className="btn btn--ghost source-cite-btn"
                  data-testid={`admin-cite-${index}`}
                  onClick={() => onOpenLink?.(index)}
                >
                  <span>
                    {graph ? endpointLabel(graph, link.source) : link.source}
                    {' → '}
                    {graph ? endpointLabel(graph, link.target) : link.target}
                  </span>
                  <span className="source-cite-relation muted">{link.relation}</span>
                  <span className="source-cite-dir muted">{directionLabel(link.direction)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="admin-detail-card pattern-section" data-testid="admin-book-kb">
        <h2>原始书摘</h2>
        {kbReady ? (
          <p>
            <code>{kbPath}</code>
          </p>
        ) : (
          <p className="muted" data-testid="admin-kb-missing">
            书摘正文尚未同步进仓库（当前仅有索引）。同步后路径：
            <code>{kbPath}</code>
          </p>
        )}
      </div>
    </section>
  );
}
