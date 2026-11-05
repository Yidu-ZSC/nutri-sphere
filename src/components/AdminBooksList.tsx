import { useEffect, useMemo, useState } from 'react';
import type { AdminBookRecord, GraphData, SourcesData, WereadCorpus } from '../types/graph';
import {
  defaultAdminBookFilters,
  displayAuthors,
  displayTitle,
  displayYear,
  edgeCountForBook,
  filterAndSortAdminBooks,
  listAdminThemes,
  RELEVANCE_LABEL,
  sourceForBook,
  STATUS_LABEL,
  type AdminBookFilters,
} from '../lib/adminBooks';
import { loadAllWereadCorpora } from '../lib/loadWeread';

interface AdminBooksListProps {
  books: readonly AdminBookRecord[];
  sources: SourcesData | null;
  graph: GraphData | null;
  onOpenBook: (id: string) => void;
}

export function AdminBooksList({ books, sources, graph, onOpenBook }: AdminBooksListProps) {
  const [filters, setFilters] = useState<AdminBookFilters>(() => defaultAdminBookFilters());
  const [wereadById, setWereadById] = useState<Map<string, WereadCorpus>>(() => new Map());
  const themes = useMemo(() => listAdminThemes(books), [books]);
  const rows = useMemo(() => filterAndSortAdminBooks(books, filters), [books, filters]);
  const clearFilters = () => setFilters(defaultAdminBookFilters());

  useEffect(() => {
    let cancelled = false;
    loadAllWereadCorpora().then((map) => {
      if (!cancelled) setWereadById(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function wereadCell(book: AdminBookRecord): string {
    if (!book.weread_book_id) return '—';
    const corpus = wereadById.get(book.id);
    if (!corpus) return '—';
    return String(corpus.stats.bookmark_count);
  }

  return (
    <section className="admin-books" data-testid="admin-books-list" aria-labelledby="admin-books-heading">
      <header className="admin-books-head">
        <h1 id="admin-books-heading">图书管理</h1>
        <p className="muted admin-books-sub">目录 {books.length} 本 · 已入库 {books.filter((b) => b.status === 'ingested').length} 本</p>
      </header>

      <div className="admin-filters" role="group" aria-label="图书筛选" data-testid="admin-book-filters">
        <label className="admin-filter">
          <span>主题</span>
          <select
            value={filters.theme}
            data-testid="admin-filter-theme"
            onChange={(event) => setFilters((prev) => ({ ...prev, theme: event.target.value }))}
          >
            <option value="all">全部</option>
            {themes.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-filter">
          <span>相关度</span>
          <select
            value={filters.relevance}
            data-testid="admin-filter-relevance"
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                relevance: event.target.value as AdminBookFilters['relevance'],
              }))
            }
          >
            <option value="all">全部</option>
            <option value="high">高</option>
            <option value="edge">边缘</option>
            <option value="low">低</option>
          </select>
        </label>
        <label className="admin-filter">
          <span>状态</span>
          <select
            value={filters.status}
            data-testid="admin-filter-status"
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value as AdminBookFilters['status'],
              }))
            }
          >
            <option value="all">全部</option>
            <option value="ingested">已入库</option>
            <option value="index_only">仅索引</option>
          </select>
        </label>
      </div>

      {rows.length === 0 ? (
        <div className="admin-empty" role="status" data-testid="admin-books-empty">
          <p>没有符合筛选的图书</p>
          <button type="button" className="btn btn--primary" onClick={clearFilters}>
            清空筛选
          </button>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table" data-testid="admin-books-table">
            <thead>
              <tr>
                <th scope="col">书名</th>
                <th scope="col">作者</th>
                <th scope="col">出版年</th>
                <th scope="col">相关度</th>
                <th scope="col">笔记数</th>
                <th scope="col">已入库边数</th>
                <th scope="col">微信划线</th>
                <th scope="col">状态</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((book) => {
                const source = sourceForBook(sources, book);
                return (
                  <tr
                    key={book.id}
                    data-testid={`admin-book-row-${book.id}`}
                    className="admin-table-row"
                    onClick={() => onOpenBook(book.id)}
                  >
                    <td>{displayTitle(book, source)}</td>
                    <td>{displayAuthors(book, source)}</td>
                    <td>{displayYear(book, source)}</td>
                    <td>{RELEVANCE_LABEL[book.relevance]}</td>
                    <td>{book.note_count}</td>
                    <td data-testid={`admin-edge-count-${book.id}`}>
                      {edgeCountForBook(graph, book.source_id)}
                    </td>
                    <td data-testid={`admin-weread-count-${book.id}`}>{wereadCell(book)}</td>
                    <td>{STATUS_LABEL[book.status]}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        data-testid={`admin-view-${book.id}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenBook(book.id);
                        }}
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
