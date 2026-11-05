import { useMemo, useState } from 'react';
import {
  defaultAdminNodeFilters,
  filterAdminNodes,
  labelOf,
  linkDegree,
  relatedLinks,
  uniqueSorted,
  type AdminNodeFilters,
} from '../lib/adminCatalog';
import { directionLabel, groupLabel, nodeTypeLabel } from '../lib/copy';
import type { GraphData, GraphNode } from '../types/graph';

interface AdminNodesProps {
  graph: GraphData;
  selected: GraphNode | null;
  onOpen: (id: string) => void;
  onBack: () => void;
  onOpenGraph: (id: string) => void;
  onOpenEdge: (key: string) => void;
}

export function AdminNodes({ graph, selected, onOpen, onBack, onOpenGraph, onOpenEdge }: AdminNodesProps) {
  const [filters, setFilters] = useState<AdminNodeFilters>(() => defaultAdminNodeFilters());
  const types = useMemo(() => uniqueSorted(graph.nodes.map((node) => node.type)), [graph.nodes]);
  const rows = useMemo(() => filterAdminNodes(graph, filters), [filters, graph]);

  if (selected) {
    const related = relatedLinks(graph, selected.id);
    return (
      <section className="admin-books" data-testid="admin-node-detail" aria-labelledby="admin-node-heading">
        <div className="admin-detail-toolbar">
          <button type="button" className="btn ghost" onClick={onBack}>
            返回节点列表
          </button>
          <button type="button" className="btn" onClick={() => onOpenGraph(selected.id)}>
            在图谱中查看
          </button>
        </div>
        <article className="admin-detail-card">
          <h1 id="admin-node-heading">{selected.label}</h1>
          <dl className="admin-meta-grid">
            <div>
              <dt>类型</dt>
              <dd>{nodeTypeLabel(selected.type)}</dd>
            </div>
            <div>
              <dt>分组</dt>
              <dd>{groupLabel(selected.group)}</dd>
            </div>
            <div>
              <dt>标识</dt>
              <dd>{selected.id}</dd>
            </div>
            <div>
              <dt>关联边</dt>
              <dd>{related.length}</dd>
            </div>
          </dl>
          {selected.description ? (
            <div className="admin-summary">
              <h2>说明</h2>
              <p>{selected.description}</p>
            </div>
          ) : null}
          {selected.aliases && selected.aliases.length > 0 ? (
            <div className="admin-summary">
              <h2>别名</h2>
              <p>{selected.aliases.join('、')}</p>
            </div>
          ) : null}
          <div className="admin-summary">
            <h2>关联边</h2>
            {related.length === 0 ? (
              <p className="muted">暂无关联边。</p>
            ) : (
              <ul className="admin-cite-list">
                {related.map(({ link, index }) => (
                  <li key={`${link.source}~${link.target}~${index}`}>
                    <button
                      type="button"
                      className="admin-inline-link"
                      onClick={() => onOpenEdge(`${link.source}~${link.target}`)}
                    >
                      {labelOf(graph, link.source)} → {labelOf(graph, link.target)}
                    </button>
                    <p>
                      {link.relation} · {directionLabel(link.direction)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="admin-books" data-testid="admin-nodes-list" aria-labelledby="admin-nodes-heading">
      <header className="admin-books-head">
        <h1 id="admin-nodes-heading">节点管理</h1>
        <p className="muted admin-books-sub">
          共 {graph.nodes.length} 个概念 · 当前 {rows.length} 个 · 字典字段以种子数据为准
        </p>
      </header>
      <div className="admin-filters" role="group" aria-label="节点筛选">
        <label className="admin-filter">
          <span>搜索</span>
          <input
            value={filters.query}
            onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
            placeholder="名称、别名或标识"
          />
        </label>
        <label className="admin-filter">
          <span>类型</span>
          <select
            value={filters.type}
            onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
          >
            <option value="all">全部</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {nodeTypeLabel(type)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>类型</th>
              <th>分组</th>
              <th>关联边</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((node) => (
              <tr key={node.id} className="admin-table-row" onClick={() => onOpen(node.id)}>
                <td>{node.label}</td>
                <td>{nodeTypeLabel(node.type)}</td>
                <td>{groupLabel(node.group)}</td>
                <td>{linkDegree(graph, node.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="admin-empty">没有符合筛选的节点。</p> : null}
      </div>
    </section>
  );
}
