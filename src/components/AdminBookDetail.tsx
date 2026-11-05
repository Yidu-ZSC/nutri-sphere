import { useEffect, useMemo, useState } from 'react';
import type { AdminBookRecord, AdminBookStatus, GraphData, SourcesData, WereadCorpus } from '../types/graph';
import { labelOf } from '../lib/adminCatalog';
import {
  bookBaseline,
  citeMatches,
  edgeBaseline,
  edgeDraftKey,
  normalizeBookDraft,
  presentEdge,
  readAdminDrafts,
  saveBookDraft,
  saveEdgeDraft,
  validateBookDraft,
  writeAdminDrafts,
  type AdminDraftFile,
  type BookFieldDraft,
} from '../lib/adminMaintenance';
import {
  displayTitle,
  edgeCountForBook,
  kbBodySynced,
  RELEVANCE_LABEL,
  sourceForBook,
  STATUS_LABEL,
} from '../lib/adminBooks';
import { citingLinks, sourceTypeLabel } from '../lib/sourceCitations';
import { directionLabel } from '../lib/copy';
import { formatSyncedAt, loadWereadCorpus, truncateMarkText } from '../lib/loadWeread';
import { AdminEdgeInspector } from './AdminEdgeInspector';

interface AdminBookDetailProps {
  book: AdminBookRecord;
  sources: SourcesData | null;
  graph: GraphData | null;
  onBack: () => void;
  onOpenPublicSource?: (sourceId: string) => void;
  onOpenGraph?: (index: number) => void;
}

export function AdminBookDetail({
  book,
  sources,
  graph,
  onBack,
  onOpenPublicSource,
  onOpenGraph,
}: AdminBookDetailProps) {
  const source = sourceForBook(sources, book);
  const baseline = useMemo(() => bookBaseline(book, source), [book, source]);
  const [drafts, setDrafts] = useState<AdminDraftFile>(() => readAdminDrafts());
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editingBook, setEditingBook] = useState(false);
  const [bookForm, setBookForm] = useState<BookFieldDraft>(baseline);
  const [bookError, setBookError] = useState<string | null>(null);
  const [bookNotice, setBookNotice] = useState<string | null>(null);

  const bookDraft = drafts.books[book.id] ?? null;
  const shownBook = bookDraft ?? baseline;
  const cites = useMemo(
    () => (graph && book.source_id ? citingLinks(graph, book.source_id) : []),
    [graph, book.source_id],
  );
  const directions = useMemo(() => {
    const values = new Set(cites.map(({ link }) => link.direction));
    return [...values];
  }, [cites]);
  const visibleCites = useMemo(() => {
    if (!graph) return [];
    return cites.filter(({ link }) =>
      citeMatches(link, drafts.edges[edgeDraftKey(link)], labelOf(graph, link.source), labelOf(graph, link.target), query, direction),
    );
  }, [cites, direction, drafts.edges, graph, query]);
  const selected = cites.find((item) => item.index === selectedIndex) ?? null;
  const edgeCount = edgeCountForBook(graph, book.source_id);
  const title = displayTitle(book, source);
  const kbPath = `data/kb/${book.kb_file}`;
  const kbReady = kbBodySynced(book.kb_file);
  const wereadPath = `data/weread/${book.id}.json`;

  const [weread, setWeread] = useState<WereadCorpus | null>(null);
  const [wereadError, setWereadError] = useState<string | null>(null);
  const [wereadLoading, setWereadLoading] = useState(false);

  useEffect(() => {
    setSelectedIndex(null);
    setEditingBook(false);
    setBookForm(bookBaseline(book, sourceForBook(sources, book)));
    setBookError(null);
    setBookNotice(null);
    setQuery('');
    setDirection('all');
  }, [book, sources]);

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

  const mappedCount = useMemo(() => {
    if (!graph || !book.source_id) return 0;
    let n = 0;
    for (const item of graph.links) {
      if (item.source_id !== book.source_id) continue;
      for (const ev of item.evidences ?? []) {
        if (ev.weread_bookmark_id) n += 1;
      }
    }
    return n;
  }, [book.source_id, graph]);

  function commit(next: AdminDraftFile) {
    setDrafts(next);
    writeAdminDrafts(next);
  }

  function saveBook() {
    const message = validateBookDraft(bookForm);
    if (message) {
      setBookError(message);
      setBookNotice(null);
      return;
    }
    const next = saveBookDraft(drafts, book.id, bookForm, baseline);
    commit(next);
    setEditingBook(false);
    setBookError(null);
    setBookNotice(next.books[book.id] ? '修订已保存在本机' : '内容与种子一致');
  }

  async function copyBookDraft() {
    const payload = JSON.stringify({ id: book.id, ...normalizeBookDraft(shownBook) }, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      setBookNotice('图书修订已复制');
    } catch {
      setBookNotice('复制未完成，请检查浏览器剪贴板权限');
    }
  }

  const authors = shownBook.authors || '—';
  const year = shownBook.year || '—';

  return (
    <section className="admin-book-detail" data-testid="admin-book-detail" aria-labelledby="admin-book-title">
      <header className="admin-page-head">
        <div className="admin-page-head-row">
          <button type="button" className="btn btn--ghost" data-testid="admin-book-back" onClick={onBack}>
            返回列表
          </button>
          <div className="admin-page-actions">
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
            {editingBook ? (
              <>
                <button type="button" className="btn btn--primary" data-testid="admin-book-save" onClick={saveBook}>
                  保存修订
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  data-testid="admin-book-cancel"
                  onClick={() => {
                    setBookForm(shownBook);
                    setEditingBook(false);
                    setBookError(null);
                  }}
                >
                  取消
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                data-testid="admin-book-edit"
                onClick={() => {
                  setBookForm(shownBook);
                  setEditingBook(true);
                  setBookError(null);
                  setBookNotice(null);
                }}
              >
                编辑图书信息
              </button>
            )}
          </div>
        </div>
        <p className="admin-kicker">图书管理</p>
        <div className="admin-title-row">
          <h1 id="admin-book-title" data-testid="admin-book-title">
            {title}
          </h1>
          {bookDraft ? <span className="admin-chip admin-chip--draft">本机修订</span> : null}
        </div>
        <p className="muted admin-byline" data-testid="admin-book-byline">
          {authors} · {year}
        </p>
        <div className="admin-chip-row">
          <span className="admin-chip" data-testid="admin-book-status">
            {STATUS_LABEL[shownBook.status]}
          </span>
          <span className="admin-chip">{RELEVANCE_LABEL[book.relevance]}</span>
          <span className="admin-chip">{book.theme}</span>
          {source ? (
            <span className="admin-chip" data-testid="admin-book-type">
              {sourceTypeLabel(source.type)}
            </span>
          ) : null}
        </div>
      </header>

      <dl className="admin-stat-strip" data-testid="admin-book-meta">
        <div className="admin-stat">
          <dt>笔记数</dt>
          <dd>{book.note_count}</dd>
        </div>
        <div className="admin-stat">
          <dt>已入库边数</dt>
          <dd data-testid="admin-detail-edge-count">{edgeCount}</dd>
        </div>
        <div className="admin-stat">
          <dt>个人划线</dt>
          <dd>{weread ? weread.stats.bookmark_count : book.weread_book_id ? '…' : '—'}</dd>
        </div>
        <div className="admin-stat">
          <dt>图谱映射</dt>
          <dd>{weread ? `${mappedCount} / ${weread.stats.bookmark_count}` : '—'}</dd>
        </div>
        <div className="admin-stat">
          <dt>书摘正文</dt>
          <dd>{kbReady ? '已在仓库' : '尚未同步'}</dd>
        </div>
      </dl>

      <article className="admin-detail-card" data-testid="admin-book-summary">
        <div className="admin-section-head">
          <h2>简介</h2>
          {bookDraft && !editingBook ? (
            <button type="button" className="btn btn--ghost" data-testid="admin-book-copy" onClick={() => void copyBookDraft()}>
              复制图书修订
            </button>
          ) : null}
        </div>
        {editingBook ? (
          <form
            className="admin-edit-form"
            data-testid="admin-book-form"
            onSubmit={(event) => {
              event.preventDefault();
              saveBook();
            }}
          >
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>作者</span>
                <input
                  value={bookForm.authors}
                  data-testid="admin-book-authors"
                  onChange={(event) => setBookForm((prev) => ({ ...prev, authors: event.target.value }))}
                />
              </label>
              <label className="admin-field">
                <span>出版年</span>
                <input
                  inputMode="numeric"
                  value={bookForm.year}
                  data-testid="admin-book-year"
                  onChange={(event) => setBookForm((prev) => ({ ...prev, year: event.target.value }))}
                />
              </label>
              <label className="admin-field">
                <span>状态</span>
                <select
                  value={bookForm.status}
                  data-testid="admin-book-status-input"
                  onChange={(event) =>
                    setBookForm((prev) => ({ ...prev, status: event.target.value as AdminBookStatus }))
                  }
                >
                  <option value="ingested">已入库</option>
                  <option value="index_only">仅索引</option>
                </select>
              </label>
              <label className="admin-field admin-field--wide">
                <span>外部链接</span>
                <input
                  value={bookForm.url}
                  placeholder="https://"
                  data-testid="admin-book-url"
                  onChange={(event) => setBookForm((prev) => ({ ...prev, url: event.target.value }))}
                />
              </label>
              <label className="admin-field admin-field--wide">
                <span>简介</span>
                <textarea
                  rows={5}
                  value={bookForm.summary}
                  data-testid="admin-book-summary-input"
                  onChange={(event) => setBookForm((prev) => ({ ...prev, summary: event.target.value }))}
                />
              </label>
            </div>
            <button type="submit" className="sr-only">
              保存修订
            </button>
            {bookError ? (
              <p className="admin-form-error" role="alert" data-testid="admin-book-error">
                {bookError}
              </p>
            ) : null}
          </form>
        ) : shownBook.summary ? (
          <p className="admin-prose">{shownBook.summary}</p>
        ) : (
          <p className="muted">尚未入库到图谱来源表；简介待 sources 收录后显示。</p>
        )}
        {shownBook.url && !editingBook ? (
          <p className="admin-external">
            <a href={shownBook.url} target="_blank" rel="noreferrer">
              {shownBook.url}
            </a>
          </p>
        ) : null}
        {book.publisher || book.isbn || book.translator ? (
          <dl className="admin-meta-grid">
            {book.publisher ? (
              <div>
                <dt>出版社</dt>
                <dd>{book.publisher}</dd>
              </div>
            ) : null}
            {book.translator ? (
              <div>
                <dt>译者</dt>
                <dd>{book.translator}</dd>
              </div>
            ) : null}
            {book.isbn ? (
              <div>
                <dt>ISBN</dt>
                <dd>{book.isbn}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        {bookNotice ? (
          <p className="admin-form-notice" role="status" data-testid="admin-book-notice">
            {bookNotice}
          </p>
        ) : null}
        <p className="admin-draft-note">本机修订保存在这台浏览器，公开图谱继续读取种子数据。写入种子前可复制修订。</p>
      </article>

      <article className="admin-detail-card" data-testid="admin-book-cites">
        <div className="admin-section-head">
          <h2>关联边</h2>
          <p className="muted admin-section-count">
            显示 {visibleCites.length} / {cites.length}
          </p>
        </div>
        <p className="admin-draft-note">点一条边即可在本页查看和编辑摘录，不必离开后台。</p>
        {graph && cites.length > 0 ? (
          <div className="admin-filters" role="group" aria-label="关联边筛选">
            <label className="admin-filter admin-filter--grow">
              <span>搜索</span>
              <input
                value={query}
                data-testid="admin-cite-query"
                placeholder="起点、终点或关系"
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="admin-filter">
              <span>方向</span>
              <select
                value={direction}
                data-testid="admin-cite-direction"
                onChange={(event) => setDirection(event.target.value)}
              >
                <option value="all">全部</option>
                {directions.map((value) => (
                  <option key={value} value={value}>
                    {directionLabel(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
        {!graph ? (
          <p className="muted">图谱仍在加载。</p>
        ) : cites.length === 0 ? (
          <p className="muted" data-testid="admin-cites-empty">
            暂无入库关联边
          </p>
        ) : visibleCites.length === 0 ? (
          <div className="admin-empty" role="status">
            <p>没有符合筛选的边</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setQuery('');
                setDirection('all');
              }}
            >
              清空筛选
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-edge-table">
              <thead>
                <tr>
                  <th scope="col">起点</th>
                  <th scope="col">终点</th>
                  <th scope="col">关系</th>
                  <th scope="col">方向</th>
                  <th scope="col">证据</th>
                  <th scope="col">
                    <span className="sr-only">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleCites.map(({ link, index }) => {
                  const key = edgeDraftKey(link);
                  const revised = drafts.edges[key];
                  const relation = presentEdge(link, revised).relation;
                  const selectedRow = index === selectedIndex;
                  return (
                    <tr
                      key={`${link.source}~${link.target}~${index}`}
                      className={selectedRow ? 'admin-table-row is-selected' : 'admin-table-row'}
                      data-testid={`admin-cite-${index}`}
                      onClick={() => setSelectedIndex(index)}
                    >
                      <td>{labelOf(graph, link.source)}</td>
                      <td>{labelOf(graph, link.target)}</td>
                      <td>
                        <div className="admin-relation-cell">
                          <span className="admin-clip" title={relation}>
                            {relation}
                          </span>
                          {revised ? <span className="admin-chip admin-chip--draft">本机修订</span> : null}
                        </div>
                      </td>
                      <td>{directionLabel(link.direction)}</td>
                      <td>{revised?.evidences.length || link.evidences?.length || (link.excerpt ? 1 : 0)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn--ghost admin-row-action"
                          aria-expanded={selectedRow}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedIndex(index);
                          }}
                        >
                          维护
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <div className="admin-split">
        <article className="admin-detail-card" data-testid="admin-book-kb">
          <h2>原始书摘</h2>
          {kbReady ? (
            <p>
              正文已在仓库。路径 <code>{kbPath}</code>
            </p>
          ) : (
            <p className="muted" data-testid="admin-kb-missing">
              书摘正文尚未同步进仓库（当前仅有索引）。同步后路径：
              <code>{kbPath}</code>
            </p>
          )}
        </article>

        <article className="admin-detail-card" data-testid="admin-book-weread">
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
                    {mappedCount} / {weread.stats.bookmark_count}
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
                    {previewMarks.map((text, markIndex) => (
                      <li key={markIndex} data-testid={`admin-weread-preview-${markIndex}`}>
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
        </article>
      </div>

      {selected && graph ? (
        <AdminEdgeInspector
          graph={graph}
          link={selected.link}
          index={selected.index}
          draft={drafts.edges[edgeDraftKey(selected.link)] ?? null}
          onClose={() => setSelectedIndex(null)}
          onSave={(next) => {
            const key = edgeDraftKey(selected.link);
            commit(saveEdgeDraft(drafts, key, next, edgeBaseline(selected.link)));
          }}
          onRevert={() => {
            const key = edgeDraftKey(selected.link);
            const edges = { ...drafts.edges };
            delete edges[key];
            commit({ version: 1, books: drafts.books, edges });
          }}
          onOpenGraph={onOpenGraph}
        />
      ) : null}
    </section>
  );
}
