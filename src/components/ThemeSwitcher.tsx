import { useEffect, useId, useRef, useState } from 'react';
import { THEME_OPTIONS, type AppTheme } from '../lib/themePreference';

interface ThemeControlProps {
  theme: AppTheme;
  onChange: (theme: AppTheme) => void;
}

function ThemeMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" />
    </svg>
  );
}

function ThemeChoice({
  theme,
  option,
  testId,
  onChange,
}: {
  theme: AppTheme;
  option: (typeof THEME_OPTIONS)[number];
  testId: string;
  onChange: (theme: AppTheme) => void;
}) {
  const selected = theme === option.id;
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      className="theme-option"
      data-testid={testId}
      onClick={() => onChange(option.id)}
    >
      <span className="theme-option-check" aria-hidden="true">
        {selected ? '✓' : ''}
      </span>
      {option.label}
    </button>
  );
}

export function ThemeSwitcher({ theme, onChange }: ThemeControlProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <div className="theme-switch" ref={rootRef}>
      <button
        type="button"
        className="btn btn--ghost theme-switch-btn"
        aria-label="切换主题"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        data-testid="theme-switch"
        onClick={() => setOpen((value) => !value)}
      >
        <ThemeMark />
      </button>
      {open && (
        <div id={menuId} className="theme-menu" role="menu" aria-label="切换主题" data-testid="theme-menu">
          {THEME_OPTIONS.map((option) => (
            <ThemeChoice
              key={option.id}
              theme={theme}
              option={option}
              testId={`theme-option-${option.id}`}
              onChange={(next) => {
                onChange(next);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
