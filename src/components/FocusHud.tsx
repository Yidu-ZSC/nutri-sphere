import {
  FOCUS_HUD_COLLAPSE,
  FOCUS_HUD_EXPAND,
  FOCUS_HUD_LABEL,
  FOCUS_LOCK_LABEL,
  FOCUS_LOCK_OFF,
} from '../lib/exploreShell';

interface FocusHudProps {
  /** Visible label of the focused node; null means no browsing focus is active. */
  focusLabel: string | null;
  /** Whether the push-out chip is expanded. */
  expanded: boolean;
  onToggle: () => void;
  /** Unified browse-focus lock; freezes the bright set while the drawer opens. */
  highlightBrowseLocked: boolean;
  onLockToggle: () => void;
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
 * TASK-NS-085 / NS-088: focus toggle card in the right view rail. The info chip
 * pushes out to the left of the card and carries the unified browse-focus lock;
 * the top-left rail toggle and the top-right diet twin stay clear.
 */
export function FocusHud({
  focusLabel,
  expanded,
  onToggle,
  highlightBrowseLocked,
  onLockToggle,
}: FocusHudProps) {
  const hasFocus = focusLabel != null;
  const chipOpen = hasFocus && expanded;
  const toggleLabel = !hasFocus ? FOCUS_HUD_LABEL : chipOpen ? FOCUS_HUD_COLLAPSE : FOCUS_HUD_EXPAND;
  const lockLabel = highlightBrowseLocked ? FOCUS_LOCK_OFF : FOCUS_LOCK_LABEL;
  return (
    <div className="focus-hud" data-testid="focus-hud">
      {hasFocus && (
        <div
          className={`click-focus-banner${expanded ? ' is-open' : ''}`}
          data-testid="click-focus-banner"
          role="status"
        >
          <span className="click-focus-label">{focusLabel}</span>
          <button
            type="button"
            className={`click-focus-lock${highlightBrowseLocked ? ' is-locked' : ''}`}
            data-testid="focus-highlight-lock"
            aria-label={lockLabel}
            aria-pressed={highlightBrowseLocked}
            onClick={onLockToggle}
          >
            <LockIcon locked={highlightBrowseLocked} />
          </button>
        </div>
      )}
      <div className="segment focus-hud-group" role="group" aria-label={FOCUS_HUD_LABEL}>
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
