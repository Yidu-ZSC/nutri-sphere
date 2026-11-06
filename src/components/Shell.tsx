import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { SHELL_CLOSE_NAV } from '../lib/exploreShell';

interface ShellProps {
  mobile: boolean;
  railVariant: 'expanded' | 'collapsed' | 'drawer';
  drawerOpen: boolean;
  onDrawerClose: () => void;
  railRef: RefObject<HTMLElement>;
  triggerRef: RefObject<HTMLButtonElement>;
  rail: ReactNode;
  children: ReactNode;
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusableIn(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true',
  );
}

export function Shell({
  mobile,
  railVariant,
  drawerOpen,
  onDrawerClose,
  railRef,
  triggerRef,
  rail,
  children,
}: ShellProps) {
  const wasOpen = useRef(false);

  useEffect(() => {
    const open = mobile && drawerOpen;
    if (open) {
      const first = focusableIn(railRef.current)[0];
      first?.focus();
    } else if (wasOpen.current) {
      triggerRef.current?.focus();
    }
    wasOpen.current = open;
  }, [drawerOpen, mobile, railRef, triggerRef]);

  useEffect(() => {
    if (!mobile || !drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onDrawerClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusableIn(railRef.current);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [drawerOpen, mobile, onDrawerClose, railRef]);

  return (
    <div className={`shell shell--${mobile ? 'mobile' : railVariant}`}>
      {mobile && drawerOpen && (
        <button
          type="button"
          className="shell-rail-backdrop"
          aria-label={SHELL_CLOSE_NAV}
          data-testid="shell-rail-backdrop"
          onClick={onDrawerClose}
        />
      )}
      {rail}
      <div className="shell-workspace">{children}</div>
    </div>
  );
}
