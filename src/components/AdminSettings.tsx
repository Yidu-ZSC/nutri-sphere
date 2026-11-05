import { THEME_OPTIONS, type AppTheme } from '../lib/themePreference';
import type { AdminBooksData, GraphData, SourcesData } from '../types/graph';

interface AdminSettingsProps {
  graph: GraphData | null;
  sources: SourcesData | null;
  books: AdminBooksData;
  appTheme: AppTheme;
}

export function AdminSettings({ graph, sources, books, appTheme }: AdminSettingsProps) {
  return (
    <section className="admin-books" data-testid="admin-settings" aria-labelledby="admin-settings-heading">
      <header className="admin-books-head">
        <h1 id="admin-settings-heading">系统设置</h1>
        <p className="muted admin-books-sub">只读概览。图谱、来源与图书目录以仓库中的 JSON 为准，此页不写回文件。</p>
      </header>
      <article className="admin-detail-card">
        <h2>数据版本</h2>
        <dl className="admin-meta-grid">
          <div>
            <dt>图谱 schema</dt>
            <dd>{graph?.meta.schema_version ?? '—'}</dd>
          </div>
          <div>
            <dt>数据版本</dt>
            <dd>{graph?.meta.data_version ?? '—'}</dd>
          </div>
          <div>
            <dt>来源 schema</dt>
            <dd>{sources?.schema_version ?? '—'}</dd>
          </div>
          <div>
            <dt>图书目录</dt>
            <dd>
              {books.schema_version} · {books.books.length} 本
            </dd>
          </div>
          <div>
            <dt>节点 / 边</dt>
            <dd>
              {graph ? `${graph.nodes.length} / ${graph.links.length}` : '图谱尚未加载'}
            </dd>
          </div>
          <div>
            <dt>界面主题</dt>
            <dd>{THEME_OPTIONS.find((option) => option.id === appTheme)?.label ?? appTheme}</dd>
          </div>
        </dl>
        <div className="admin-summary">
          <h2>维护说明</h2>
          <p>教育边界与前台一致：后台只维护资料与关联，不写诊断、治疗或个体建议。</p>
          <p>入库前在仓库运行数据校验。来源同步与简介编辑仍走图书管理所依据的静态文件，不在浏览器内保存。</p>
        </div>
      </article>
    </section>
  );
}
