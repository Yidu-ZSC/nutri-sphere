import { forwardRef, type ReactNode } from 'react';
import {
  SHELL_CLOSE_NAV,
  SHELL_COLLAPSE_NAV,
  SHELL_EXPAND_NAV,
  SHELL_GRAPH_LABEL,
  SHELL_METHODS_LABEL,
  SHELL_RECORD_LABEL,
  SHELL_SEARCH_LABEL,
  SHELL_TWIN_LABEL,
} from '../lib/exploreShell';

export type WorkspaceId = 'explore' | 'twin';
export type ShellRailVariant = 'expanded' | 'collapsed' | 'drawer';

interface ShellRailProps {
  variant: ShellRailVariant;
  activeWorkspace: WorkspaceId;
  graphReady: boolean;
  hidden: boolean;
  tools: ReactNode;
  footer: ReactNode;
  onWorkspace: (workspace: WorkspaceId) => void;
  onOpenSearch: () => void;
  onOpenRecord: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onClose: () => void;
  onMethods: () => void;
}

type IconName = 'graph' | 'twin' | 'search' | 'record' | 'expand' | 'collapse' | 'close';

function Icon({ name }: { name: IconName }) {
  if (name === 'graph') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="6" cy="7" r="2.4" />
        <circle cx="18" cy="6" r="2.1" />
        <circle cx="12" cy="18" r="2.5" />
        <path d="M8.1 8.2 10.7 16M15.9 7.3l-2.4 8.5M8.3 6.8l7.5-.6" />
      </svg>
    );
  }
  if (name === 'twin') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="5.5" r="2.4" />
        <path d="M12 8.2v6.1M8.5 10.5l3.5-1.2 3.5 1.2M9.2 19l2.8-4.7 2.8 4.7" />
      </svg>
    );
  }
  if (name === 'search') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="10.5" cy="10.5" r="5.7" />
        <path d="m15 15 4.2 4.2" />
      </svg>
    );
  }
  if (name === 'record') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 5.5h9M5 10h9M5 14.5h6M15.5 18.5h5M18 16v5" />
      </svg>
    );
  }
  if (name === 'expand' || name === 'collapse') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={name === 'expand' ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function RailButton({
  icon,
  label,
  current,
  expanded,
  onClick,
}: {
  icon: IconName;
  label: string;
  current?: boolean;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="shell-rail-item"
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      title={expanded ? undefined : label}
      onClick={onClick}
    >
      <span className="shell-rail-icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      {expanded && <span>{label}</span>}
    </button>
  );
}

export const ShellRail = forwardRef<HTMLElement, ShellRailProps>(function ShellRail(
  {
    variant,
    activeWorkspace,
    graphReady,
    hidden,
    tools,
    footer,
    onWorkspace,
    onOpenSearch,
    onOpenRecord,
    onExpand,
    onCollapse,
    onClose,
    onMethods,
  },
  ref,
) {
  const expanded = variant !== 'collapsed';
  const drawer = variant === 'drawer';
  const selectWorkspace = (workspace: WorkspaceId) => onWorkspace(workspace);

  return (
    <aside
      ref={ref}
      id="shell-rail"
      className={`shell-rail shell-rail--${variant}`}
      data-testid="shell-rail"
      aria-label="导航与工具"
      role={drawer ? 'dialog' : undefined}
      aria-modal={drawer ? 'true' : undefined}
      hidden={hidden}
    >
      <header className="shell-rail-head">
        <div
          className={expanded ? 'shell-rail-brand' : 'shell-rail-brand shell-rail-brand--compact'}
          title="明膳知源"
          aria-label="明膳知源"
        >
          <span className="mark" aria-hidden="true" />
          {expanded && (
            <div>
              <p className="brand-title" data-testid="brand-title">
                明膳知源
              </p>
              <p className="brand-sub">仅供学习：饮食、机制与健康结局的关联图谱</p>
            </div>
          )}
        </div>
        {expanded && (
          <button
            type="button"
            className="shell-rail-icon-btn"
            aria-label={drawer ? SHELL_CLOSE_NAV : SHELL_COLLAPSE_NAV}
            title={drawer ? SHELL_CLOSE_NAV : SHELL_COLLAPSE_NAV}
            data-testid={drawer ? 'shell-rail-close' : 'shell-rail-collapse'}
            onClick={drawer ? onClose : onCollapse}
          >
            <Icon name={drawer ? 'close' : 'collapse'} />
          </button>
        )}
      </header>

      <nav className="shell-rail-nav" aria-label="工作区">
        <RailButton
          icon="graph"
          label={SHELL_GRAPH_LABEL}
          current={activeWorkspace === 'explore'}
          expanded={expanded}
          onClick={() => selectWorkspace('explore')}
        />
        <RailButton
          icon="twin"
          label={SHELL_TWIN_LABEL}
          current={activeWorkspace === 'twin'}
          expanded={expanded}
          onClick={() => selectWorkspace('twin')}
        />
        {!expanded && (
          <>
            <RailButton
              icon="search"
              label={SHELL_SEARCH_LABEL}
              expanded={false}
              onClick={onOpenSearch}
            />
            {activeWorkspace === 'twin' && (
              <RailButton icon="record" label={SHELL_RECORD_LABEL} expanded={false} onClick={onOpenRecord} />
            )}
          </>
        )}
      </nav>

      {expanded ? (
        <div className="shell-rail-tools" data-testid="shell-rail-tools">
          {!graphReady && activeWorkspace === 'explore' && (
            <p className="shell-rail-note">知识图谱仍在加载。</p>
          )}
          {tools}
        </div>
      ) : null}

      <footer className="shell-rail-foot">
        {expanded && (
          <button type="button" className="shell-rail-methods" onClick={onMethods}>
            {SHELL_METHODS_LABEL}
          </button>
        )}
        {footer}
        {!expanded && (
          <button
            type="button"
            className="shell-rail-icon-btn"
            aria-label={SHELL_EXPAND_NAV}
            title={SHELL_EXPAND_NAV}
            data-testid="shell-rail-expand"
            onClick={onExpand}
          >
            <Icon name="expand" />
          </button>
        )}
      </footer>
    </aside>
  );
});
