import { useMemo } from 'react';
import { auditLoadedGraph } from '../lib/adminAudit';
import type { GraphData, SourcesData } from '../types/graph';

interface AdminValidateProps {
  graph: GraphData;
  sources: SourcesData | null;
}

export function AdminValidate({ graph, sources }: AdminValidateProps) {
  const report = useMemo(() => auditLoadedGraph(graph, sources), [graph, sources]);
  const ok = report.errors.length === 0;

  return (
    <section className="admin-books" data-testid="admin-validate" aria-labelledby="admin-validate-heading">
      <header className="admin-books-head">
        <h1 id="admin-validate-heading">数据校验</h1>
        <p className="muted admin-books-sub">
          已加载 {report.counts.nodes} 个节点 · {report.counts.links} 条边 · {report.counts.sources} 个来源。完整 schema 校验仍由仓库命令 `npm run validate:data` 执行。
        </p>
      </header>
      <p className={ok ? 'admin-audit-ok' : 'admin-audit-bad'} data-testid="admin-audit-status">
        {ok ? '当前加载数据未发现阻断问题。' : `发现 ${report.errors.length} 个阻断问题。`}
        {report.warnings.length > 0 ? ` 另有 ${report.warnings.length} 条提示。` : ''}
      </p>
      {report.errors.length > 0 ? (
        <div className="admin-summary">
          <h2>阻断</h2>
          <ul className="admin-issue-list">
            {report.errors.map((issue) => (
              <li key={issue.message}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {report.warnings.length > 0 ? (
        <div className="admin-summary">
          <h2>提示</h2>
          <ul className="admin-issue-list">
            {report.warnings.map((issue) => (
              <li key={issue.message}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
