import { useMemo, useState } from 'react';
import {
  defaultAdminEdgeFilters,
  evidenceCount,
  filterAdminEdges,
  labelOf,
  uniqueSorted,
  type AdminEdgeFilters,
  type IndexedLink,
} from '../lib/adminCatalog';
import { directionLabel, strengthLabel } from '../lib/copy';
import type { GraphData } from '../types/graph';

interface AdminEdgesProps {
  graph: GraphData;
  selected: IndexedLink | null;
  onOpen: (key: string) => void;
  onBack: () => void;
  onOpenGraph: (index: number) => void;
}

export function AdminEdges({ graph, selected, onOpen, onBack, onOpenGraph }: AdminEdgesProps) {
  const [filters, setFilters] = useState<AdminEdgeFilters>(() => defaultAdminEdgeFilters());
  const directions = useMemo(() => uniqueSorted(graph.links.map((link) => link.direction)), [graph.links]);
  const strengths = useMemo(
    () => uniqueSorted(graph.links.map((link) => link.strength ?? 'low')),
    [graph.links],
  );
  const rows = useMemo(() => filterAdminEdges(graph, filters), [filters, graph]);

  if (selected) {
    const { link, index } = selected;
    return (
      <section className="admin-books" data-testid="admin-edge-detail" aria-labelledby="admin-edge-heading">
        <div className="admin-detail-toolbar">
          <button type="button" className="btn ghost" onClick={onBack}>
            返回边列表
          </button>
          <button type="button" className="btn" onClick={() => onOpenGraph(index)}>
            在图谱中查看
          </button>
        </div>
        <article className="admin-detail-card">
          <h1 id="admin-edge-heading">{link.relation}</h1>
          <dl className="admin-meta-grid">
            <div>
              <dt>起点</dt>
              <dd>{labelOf(graph, link.source)}</dd>
            </div>
            <div>
              <dt>终点</dt>
              <dd>{labelOf(graph, link.target)}</dd>
            </div>
            <div>
              <dt>方向</dt>
              <dd>{directionLabel(link.direction)}</dd>
            </div>
            <div>
              <dt>强度</dt>
              <dd>{strengthLabel(link.strength)}</dd>
            </div>
            <div>
              <dt>来源标题</dt>
              <dd>{link.source_title ?? '—'}</dd>
            </div>
            <div>
              <dt>证据条数</dt>
              <dd>{evidenceCount(link)}</dd>
            </div>
          </dl>
          {link.excerpt ? (
            <div className="admin-summary">
              <h2>原文摘录</h2>
              <p>{link.excerpt}</p>
            </div>
          ) : null}
          {link.limitations ? (
            <div className="admin-summary">
              <h2>局限</h2>
              <p>{link.limitations}</p>
            </div>
          ) : null}
          {(link.evidences?.length ?? 0) > 1 ? (
            <div className="admin-summary">
              <h2>其他证据</h2>
              <ul className="admin-cite-list">
                {link.evidences?.slice(1).map((item, itemIndex) => (
                  <li key={`${item.note_id ?? item.source_title}-${itemIndex}`}>
                    <strong>{item.source_title}</strong>
                    <p>{item.excerpt}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      </section>
    );
  }

  return (
    <section className="admin-books" data-testid="admin-edges-list" aria-labelledby="admin-edges-heading">
      <header className="admin-books-head">
        <h1 id="admin-edges-heading">边管理</h1>
        <p className="muted admin-books-sub">
          共 {graph.links.length} 条 · 当前 {rows.length} 条 · 只读浏览，摘录以种子数据为准
        </p>
      </header>
      <div className="admin-filters" role="group" aria-label="边筛选">
        <label className="admin-filter">
          <span>搜索</span>
          <input
            value={filters.query}
            onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
            placeholder="关系、节点或来源"
          />
        </label>
        <label className="admin-filter">
          <span>方向</span>
          <select
            value={filters.direction}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, direction: event.target.value as AdminEdgeFilters['direction'] }))
            }
          >
            <option value="all">全部</option>
            {directions.map((value) => (
              <option key={value} value={value}>
                {directionLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-filter">
          <span>强度</span>
          <select
            value={filters.strength}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, strength: event.target.value as AdminEdgeFilters['strength'] }))
            }
          >
            <option value="all">全部</option>
            {strengths.map((value) => (
              <option key={value} value={value}>
                {strengthLabel(value)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>起点</th>
              <th>终点</th>
              <th>关系</th>
              <th>方向</th>
              <th>强度</th>
              <th>证据</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ link, index }) => (
              <tr
                key={`${link.source}~${link.target}~${index}`}
                className="admin-table-row"
                onClick={() => onOpen(`${link.source}~${link.target}`)}
              >
                <td>{labelOf(graph, link.source)}</td>
                <td>{labelOf(graph, link.target)}</td>
                <td>{link.relation}</td>
                <td>{directionLabel(link.direction)}</td>
                <td>{strengthLabel(link.strength)}</td>
                <td>{evidenceCount(link)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="admin-empty">没有符合筛选的边。</p> : null}
      </div>
    </section>
  );
}
