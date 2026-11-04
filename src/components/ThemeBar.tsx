import { useEffect, useRef } from 'react';
import type { LayoutMode } from '../lib/layout';
import { PALETTE } from '../lib/palette';
import { themeAccent } from '../lib/themeAccent';
import { HIERARCHY_HINT, themeMatches, type ExploreTheme } from '../lib/themes';

interface ThemeBarProps {
  themes: readonly ExploreTheme[];
  diseaseId: string | null;
  mechanismId: string | null;
  foodId: string | null;
  layout: LayoutMode;
  hideUnmatched: boolean;
  onTheme: (theme: ExploreTheme | null) => void;
  onHideUnmatched: (hide: boolean) => void;
  /** Brief highlight after 「选择主题」 on desktop (TASK-NS-045). */
  flash?: boolean;
}

export function ThemeBar({
  themes,
  diseaseId,
  mechanismId,
  foodId,
  layout,
  hideUnmatched,
  onTheme,
  onHideUnmatched,
  flash = false,
}: ThemeBarProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = listRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [diseaseId, mechanismId, foodId]);

  return (
    <div className="theme-bar">
      <div ref={listRef} className={flash ? 'themes is-flash' : 'themes'} role="group" aria-label="探索主题" data-testid="theme-chips">
        <span className="themes-label">探索主题</span>
        {themes.map((theme) => {
          const pressed = themeMatches(theme, diseaseId, mechanismId, foodId);
          return (
            <button
              key={theme.id}
              type="button"
              className={theme.kind === 'mechanism_deep' ? 'chip chip--deep' : 'chip'}
              data-testid={`theme-chip-${theme.id}`}
              data-direction={themeAccent(theme)}
              aria-pressed={pressed}
              style={{ ['--card-accent' as string]: PALETTE[themeAccent(theme)] }}
              onClick={() => onTheme(pressed ? null : theme)}
            >
              <span className="dir-bar" aria-hidden="true" />
              {theme.label}
            </button>
          );
        })}
      </div>
      <label className="hide-toggle">
        <input
          type="checkbox"
          data-testid="hide-unmatched"
          checked={hideUnmatched}
          onChange={(event) => onHideUnmatched(event.target.checked)}
        />
        <span className="hide-label-long">隐藏非匹配节点</span>
        <span className="hide-label-short">隐藏非匹配</span>
      </label>
      {layout === 'hierarchy' && <p className="theme-hint">{HIERARCHY_HINT}</p>}
    </div>
  );
}
