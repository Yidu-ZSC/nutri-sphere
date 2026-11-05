import { useEffect, useMemo, useState } from 'react';
import type { AdminBookRecord, GraphData, SourcesData, WereadCorpus } from '../types/graph';
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
import { formatSyncedAt, loadWereadCorpus, truncateMarkText } from '../lib/loadWeread';

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

/** Runtime scan of seed evidences with weread_bookmark_id for this book (NS-061 D1). */
function countWereadMappedEvidences(graph: GraphData | null, sourceId: string | undefined): number {
  if (!graph || !sourceId) return 0;
  let n = 0;
  for (const link of graph.links) {
    if (link.source_id !== sourceId) continue;
    for (const ev of link.evidences ?? []) {
      if (ev.weread_bookmark_id) n += 1;
    }
  }
  return n;
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
  const wereadPath = `data/weread/${book.id}.json`;

  const [weread, setWeread] = useState<WereadCorpus | null>(null);
  const [wereadError, setWereadError] = useState<string | null>(null);
  const [wereadLoading, setWereadLoading] = useState(false);

  useEffect(() => {
    if (!book.weread_book_id) {
      setWeread(null);
      setWereadError(null);
      setWereadLoading(false);
      return;
    }
    let cancelled = false;
    setWereadLoading(true);
    setWereadError(null);
    loadWereadCorpus(book.id)
      .then((corpus) => {
        if (!cancelled) {
          setWeread(corpus);
          setWereadLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setWeread(null);
          setWereadError(err instanceof Error ? err.message : '加载失败');
          setWereadLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [book.id, book.weread_book_id]);

  const previewMarks = useMemo(() => {
    if (!weread) return [];
    return weread.bookmarks.slice(0, 5).map((bm) => truncateMarkText(bm.markText, 120));
  }, [weread]);

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

      <div className="admin-detail-card pattern-section" data-testid="admin-book-weread">
        <h2>微信划线</h2>
        {!book.weread_book_id ? (
          <p className="muted" data-testid="admin-weread-not-in-scope">
            本目录书未接入微信读书（本期仅 6 本已入库）
          </p>
        ) : wereadLoading ? (
          <p className="muted" data-testid="admin-weread-loading">
            正在加载语料…
          </p>
        ) : weread ? (
          <>
            <dl className="admin-meta-grid" data-testid="admin-weread-meta">
              <div>
                <dt>状态</dt>
                <dd data-testid="admin-weread-status">已同步</dd>
              </div>
              <div>
                <dt>个人划线</dt>
                <dd data-testid="admin-weread-bookmark-count">{weread.stats.bookmark_count}</dd>
              </div>
              <div>
                <dt>热门划线</dt>
                <dd data-testid="admin-weread-best">
                  总量 {weread.bestbookmarks.totalCount} · 已存 {weread.bestbookmarks.items.length} 条
                </dd>
              </div>
              <div>
                <dt>最近同步</dt>
                <dd data-testid="admin-weread-synced-at">{formatSyncedAt(weread.synced_at)}</dd>
              </div>
              <div data-testid="admin-weread-mapping-progress">
                <dt>图谱映射</dt>
                <dd>
                  {countWereadMappedEvidences(graph, book.source_id ?? book.id)} / {weread.stats.bookmark_count}
                  <span className="muted">（个人划线）</span>
                </dd>
              </div>
            </dl>
            <div className="admin-weread-preview" data-testid="admin-weread-preview">
              <h3>个人划线预览</h3>
              {previewMarks.length === 0 ? (
                <p className="muted" data-testid="admin-weread-preview-empty">
                  暂无个人划线（仍可能有热门划线快照）
                </p>
              ) : (
                <ol className="admin-weread-preview-list">
                  {previewMarks.map((text, index) => (
                    <li key={index} data-testid={`admin-weread-preview-${index}`}>
                      {text}
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <p className="muted admin-weread-path">
              语料路径：<code data-testid="admin-weread-path">{wereadPath}</code>
            </p>
          </>
        ) : (
          <p className="muted" data-testid="admin-weread-missing">
            尚未同步{wereadError ? `（${wereadError}）` : ''}。预期路径：
            <code>{wereadPath}</code>
          </p>
        )}
      </div>
    </section>
  );
}
