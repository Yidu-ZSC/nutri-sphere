import type { ReactNode } from 'react';
import type { AdminSection } from '../lib/shareUrl';

const NAV_ITEMS: { id: AdminSection; label: string }[] = [
  { id: 'books', label: '图书管理' },
  { id: 'edges', label: '边管理' },
  { id: 'nodes', label: '节点管理' },
  { id: 'candidates', label: '候选审阅' },
  { id: 'validate', label: '数据校验' },
  { id: 'settings', label: '系统设置' },
];

interface AdminShellProps {
  section: AdminSection;
  onSection: (section: AdminSection) => void;
  children: ReactNode;
}

export function AdminShell({ section, onSection, children }: AdminShellProps) {
  return (
    <div className="admin-shell" data-testid="admin-shell">
      <aside className="admin-sidebar" aria-label="后台导航" data-testid="admin-sidebar">
        <p className="admin-sidebar-title">后台管理</p>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item${section === item.id ? ' is-active' : ''}`}
              aria-current={section === item.id ? 'page' : undefined}
              data-testid={`admin-nav-${item.id}`}
              onClick={() => onSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="admin-content" data-testid="admin-content">
        {children}
      </div>
    </div>
  );
}
