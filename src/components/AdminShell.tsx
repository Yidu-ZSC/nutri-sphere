import type { ReactNode } from 'react';

const NAV_ITEMS: { id: string; label: string; available: boolean }[] = [
  { id: 'books', label: '图书管理', available: true },
  { id: 'edges', label: '边管理', available: false },
  { id: 'nodes', label: '节点管理', available: false },
  { id: 'validate', label: '数据校验', available: false },
  { id: 'settings', label: '系统设置', available: false },
];

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="admin-shell" data-testid="admin-shell">
      <aside className="admin-sidebar" aria-label="后台导航" data-testid="admin-sidebar">
        <p className="admin-sidebar-title">后台管理</p>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) =>
            item.available ? (
              <span
                key={item.id}
                className="admin-nav-item is-active"
                aria-current="page"
                data-testid={`admin-nav-${item.id}`}
              >
                {item.label}
              </span>
            ) : (
              <button
                key={item.id}
                type="button"
                className="admin-nav-item is-soon"
                disabled
                title="即将推出"
                data-testid={`admin-nav-${item.id}`}
              >
                <span>{item.label}</span>
                <span className="admin-nav-soon">即将</span>
              </button>
            ),
          )}
        </nav>
      </aside>
      <div className="admin-content" data-testid="admin-content">
        {children}
      </div>
    </div>
  );
}
