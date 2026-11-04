/** sessionStorage key for mobile legend expand (TASK-NS-051). */
export const LEGEND_EXPANDED_KEY = 'cleardiet.legendExpanded';

type SessionLike = Pick<Storage, 'getItem' | 'setItem'>;

function browserSession(): SessionLike | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

/** `'1'` → expanded; missing / `'0'` / other → collapsed. */
export function readLegendExpanded(storage?: SessionLike | null): boolean {
  const store = storage === undefined ? browserSession() : storage;
  try {
    return store?.getItem(LEGEND_EXPANDED_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeLegendExpanded(expanded: boolean, storage?: SessionLike | null): void {
  const store = storage === undefined ? browserSession() : storage;
  try {
    store?.setItem(LEGEND_EXPANDED_KEY, expanded ? '1' : '0');
  } catch {
    // Persistence is best-effort.
  }
}
