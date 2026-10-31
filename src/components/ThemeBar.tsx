import { HIERARCHY_HINT, themeMatches, type ExploreTheme } from '../lib/themes';
import type { LayoutMode } from '../lib/layout';

interface ThemeBarProps {
  themes: readonly ExploreTheme[];
  diseaseId: string | null;
  mechanismId: string | null;
  layout: LayoutMode;
  hideUnmatched: boolean;
  onTheme: (theme: ExploreTheme | null) => void;
  onHideUnmatched: (hide: boolean) => void;
}

export function ThemeBar({
  themes,
  diseaseId,
  mechanismId,
  layout,
  hideUnmatched,
  onTheme,
  onHideUnmatched,
}: ThemeBarProps) {
  return (
    <div className="theme-bar">
      <div className="themes" role="group" aria-label="探索主题" data-testid="theme-chips">
        <span className="themes-label">探索主题</span>
        {themes.map((theme) => {
          const pressed = themeMatches(theme, diseaseId, mechanismId);
          return (
            <button
              key={theme.id}
              type="button"
              className="chip"
              aria-pressed={pressed}
              onClick={() => onTheme(pressed ? null : theme)}
            >
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
