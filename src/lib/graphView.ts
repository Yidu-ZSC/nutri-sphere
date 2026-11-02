export type GraphView = '2d' | '3d';

export const GRAPH_VIEW_STORAGE_KEY = 'cleardiet.graphView';

function browserStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function readGraphView(storage?: Pick<Storage, 'getItem'> | null): GraphView {
  const store = storage === undefined ? browserStorage() : storage;
  try {
    const stored = store?.getItem(GRAPH_VIEW_STORAGE_KEY);
    if (stored === '2d' || stored === '3d') return stored;
  } catch {
    // Private mode or blocked storage: fall through to the default.
  }
  return '2d';
}

export function writeGraphView(view: GraphView, storage?: Pick<Storage, 'setItem'> | null): void {
  const store = storage === undefined ? browserStorage() : storage;
  try {
    store?.setItem(GRAPH_VIEW_STORAGE_KEY, view);
  } catch {
    // Persistence is best-effort; the in-memory choice still applies.
  }
}
