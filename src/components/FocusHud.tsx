import {
  CLEAR_CLICK_FOCUS,
  CLICK_FOCUS_PREFIX,
  FOCUS_HUD_COLLAPSE,
  FOCUS_HUD_EXPAND,
  FOCUS_HUD_LABEL,
  THEME_HIGHLIGHT_LOCK_LABEL,
  THEME_HIGHLIGHT_LOCK_OFF,
  THEME_HIGHLIGHT_LOCK_ON,
} from '../lib/exploreShell';

interface FocusHudProps {
  /** Visible label of the focused node; null means no browsing focus is active. */
  focusLabel: string | null;
  /** Whether the push-out chip is expanded. */
  expanded: boolean;
  onToggle: () => void;
  onClear: () => void;
  /** Theme / lens filter is active — show the highlight lock control. */
  themeLockVisible: boolean;
  themeHighlightLocked: boolean;
  onThemeLockToggle: () => void;
}

function FocusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="4.2" />
      <path d="M10 2.6v3M10 14.4v3M2.6 10h3M14.4 10h3" />
    </svg>
  );
}

function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="4.5" y="8.5" width="11" height="8" rx="1.6" />
      <path
        d={locked ? 'M7 8.5V6.2a3 3 0 0 1 6 0v2.3' : 'M7 8.5V6.8a3 3 0 0 1 6 0'}
        fill="none"
      />
    </svg>
  );
}

/**
 * TASK-NS-085: focus toggle card in the right view rail. The info chip is
 * absolutely positioned and pushes out to the left of the card, keeping the
 * top-left rail toggle and the top-right diet twin clear.
 */
export function FocusHud({
  focusLabel,
  expanded,
  onToggle,
  onClear,
  themeLockVisible,
  themeHighlightLocked,
  onThemeLockToggle,
}: FocusHudProps) {
  const hasFocus = focusLabel != null;
  const chipOpen = hasFocus && expanded;
  const toggleLabel = !hasFocus ? FOCUS_HUD_LABEL : chipOpen ? FOCUS_HUD_COLLAPSE : FOCUS_HUD_EXPAND;
  const lockLabel = themeHighlightLocked ? THEME_HIGHLIGHT_LOCK_ON : THEME_HIGHLIGHT_LOCK_LABEL;
  return (
    <div className="focus-hud" data-testid="focus-hud">
      {hasFocus && (
        <div
          className={`click-focus-banner${expanded ? ' is-open' : ''}`}
          data-testid="click-focus-banner"
          role="status"
        >
          <span className="click-focus-label">
            {CLICK_FOCUS_PREFIX}
            {focusLabel}
          </span>
          <button
            type="button"
            className="btn btn--ghost click-focus-clear"
            data-testid="clear-click-focus"
            onClick={onClear}
          >
            {CLEAR_CLICK_FOCUS}
          </button>
        </div>
      )}
      <div className="segment focus-hud-group" role="group" aria-label={FOCUS_HUD_LABEL}>
        {themeLockVisible && (
          <button
            type="button"
            className={`focus-hud-lock${themeHighlightLocked ? ' is-locked' : ''}`}
            data-testid="theme-highlight-lock"
            aria-label={themeHighlightLocked ? THEME_HIGHLIGHT_LOCK_OFF : lockLabel}
            aria-pressed={themeHighlightLocked}
            onClick={onThemeLockToggle}
          >
            <LockIcon locked={themeHighlightLocked} />
          </button>
        )}
        <button
          type="button"
          className="focus-hud-toggle"
          data-testid="focus-hud-toggle"
          aria-label={toggleLabel}
          aria-pressed={hasFocus}
          aria-expanded={chipOpen}
          onClick={onToggle}
        >
          <FocusIcon />
        </button>
      </div>
    </div>
  );
}
