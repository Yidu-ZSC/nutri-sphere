import type { Domain } from '../types/graph';

interface DomainEmptyStateProps {
  /** Active non-health domain (environment | culture). */
  domain: Exclude<Domain, 'health'>;
  onReturnHealth: () => void;
}

/** Honest empty state for environment/culture. No fake nodes, no efficacy copy. */
export function DomainEmptyState({ domain, onReturnHealth }: DomainEmptyStateProps) {
  const topic = domain === 'culture' ? '饮食与文化' : '饮食与环境';
  return (
    <div className="domain-empty" data-testid="domain-empty" role="status">
      <h2 className="domain-empty-title">该主题内容筹备中</h2>
      <p className="domain-empty-body">
        {topic}的图谱条目尚在整理，当前没有可展示的节点与关联。你仍可切换回「健康」查看现有教育图谱。
      </p>
      <button
        type="button"
        className="btn btn--primary"
        data-testid="domain-empty-back-health"
        onClick={onReturnHealth}
      >
        返回健康主题
      </button>
    </div>
  );
}
