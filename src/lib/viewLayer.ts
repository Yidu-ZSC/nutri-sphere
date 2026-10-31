import type { ViewLayer } from '../types/graph';

export const VIEW_LAYER_STORAGE_KEY = 'nutrisphere.viewLayer';

export function readViewLayer(): ViewLayer {
  try {
    const stored = localStorage.getItem(VIEW_LAYER_STORAGE_KEY);
    if (stored === 'expert' || stored === 'layperson') return stored;
  } catch {
    // Private mode or blocked storage: fall through to the default.
  }
  return 'layperson';
}

export function writeViewLayer(layer: ViewLayer): void {
  try {
    localStorage.setItem(VIEW_LAYER_STORAGE_KEY, layer);
  } catch {
    // Persistence is best-effort; the in-memory choice still applies.
  }
}
