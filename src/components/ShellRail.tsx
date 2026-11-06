import { forwardRef, type ReactNode } from 'react';
import {
  SHELL_CLOSE_NAV,
  SHELL_COLLAPSE_NAV,
  SHELL_EXPAND_NAV,
  SHELL_METHODS_LABEL,
  SHELL_SEARCH_LABEL,
} from '../lib/exploreShell';

export type ShellRailVariant = 'expanded' | 'collapsed' | 'drawer';

interface ShellRailProps {
  variant: ShellRailVariant;
  graphReady: boolean;
  hidden: boolean;
  tools: ReactNode;
  footer: ReactNode;
  onOpenSearch: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onClose: () => void;
  onMethods: () => void;
}

type IconName = 'search' | 'expand' | 'collapse' | 'close';

function Icon({ name }: { name: IconName }) {
  if (name === 'search') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="10.5" cy="10.5" r="5.7" />
        <path d="m15 15 4.2 4.2" />
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

export const ShellRail = forwardRef<HTMLElement, ShellRailProps>(function ShellRail(
  {
    variant,
    graphReady,
    hidden,
    tools,
    footer,
    onOpenSearch,
    onExpand,
    onCollapse,
    onClose,
    onMethods,
  },
  ref,
) {
  const expanded = variant !== 'collapsed';
  const drawer = variant === 'drawer';

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

      {!expanded && (
        <nav className="shell-rail-nav" aria-label="工具">
          <button
            type="button"
            className="shell-rail-item"
            aria-label={SHELL_SEARCH_LABEL}
            title={SHELL_SEARCH_LABEL}
            onClick={onOpenSearch}
          >
            <span className="shell-rail-icon" aria-hidden="true">
              <Icon name="search" />
            </span>
          </button>
        </nav>
      )}

      {expanded ? (
        <div className="shell-rail-tools" data-testid="shell-rail-tools">
          {!graphReady && <p className="shell-rail-note">知识图谱仍在加载。</p>}
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
