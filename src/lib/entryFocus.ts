import { frameGraph2d, framingDistance } from './layout.ts';

/** sessionStorage key for the session-stable browsing focus root. */
export const ENTRY_FOCUS_STORAGE_KEY = 'cleardiet.entryFocusRoot';
/** Sentinel written after the reader clears the focus: no auto draw this session. */
export const ENTRY_FOCUS_NONE = '__none__';
/** A mechanism is eligible when its total in+out degree lands in this band. */
export const ENTRY_FOCUS_MIN_DEGREE = 3;
export const ENTRY_FOCUS_MAX_DEGREE = 12;

export interface EntryFocusLink {
  source: string;
  target: string;
}

export interface EntryFocusNode {
  id: string;
  type: string;
}

/** Total in+out degree, matching `linkDegrees` (undirected counting). */
export function entryFocusDegree(id: string, links: readonly EntryFocusLink[]): number {
  let degree = 0;
  for (const link of links) {
    if (link.source === id) degree += 1;
    if (link.target === id) degree += 1;
  }
  return degree;
}

/**
 * Mechanisms on the actual domain graph with 3 <= degree <= 12, sorted by stable id.
 * `depth` is intentionally ignored: summary / mechanism / technical all qualify.
 */
export function eligibleEntryFocusNodes(
  nodes: readonly EntryFocusNode[],
  links: readonly EntryFocusLink[],
): string[] {
  const candidates: string[] = [];
  for (const node of nodes) {
    if (node.type !== 'mechanism') continue;
    const degree = entryFocusDegree(node.id, links);
    if (degree >= ENTRY_FOCUS_MIN_DEGREE && degree <= ENTRY_FOCUS_MAX_DEGREE) {
      candidates.push(node.id);
    }
  }
  candidates.sort();
  return candidates;
}

/** Stable random draw over already-sorted candidates. Empty candidates → null (full graph). */
export function pickEntryFocusRoot(
  candidates: readonly string[],
  rng: () => number = Math.random,
): string | null {
  if (candidates.length === 0) return null;
  const raw = Math.floor(rng() * candidates.length);
  const index = Math.min(Math.max(raw, 0), candidates.length - 1);
  return candidates[index] ?? null;
}

export interface EntryFocusResolution {
  focusRoot: string | null;
  /** True when this resolution drew a fresh random candidate (the caller persists it). */
  drewRandom: boolean;
}

/**
 * Priority-ordered entry focus resolution (TASK-NS-084):
 * selection node → selection link (no focus) → filter/theme/lens context (no random)
 * → URL `focus` → sessionStorage id / `__none__` → random eligible mechanism.
 */
export function resolveEntryFocusRoot(
  input: {
    hasFilterContext: boolean;
    selection: { kind: 'node'; id: string } | { kind: 'link'; index: number } | null;
    urlFocus: string | null;
    storedFocus: string | null;
    eligible: readonly string[];
    validNodeIds: ReadonlySet<string>;
  },
  rng: () => number = Math.random,
): EntryFocusResolution {
  if (input.selection?.kind === 'node') {
    return { focusRoot: input.selection.id, drewRandom: false };
  }
  if (input.selection?.kind === 'link') {
    return { focusRoot: null, drewRandom: false };
  }
  if (input.hasFilterContext) {
    return { focusRoot: null, drewRandom: false };
  }
  if (input.urlFocus && input.validNodeIds.has(input.urlFocus)) {
    return { focusRoot: input.urlFocus, drewRandom: false };
  }
  if (input.storedFocus === ENTRY_FOCUS_NONE) {
    return { focusRoot: null, drewRandom: false };
  }
  if (input.storedFocus && input.validNodeIds.has(input.storedFocus)) {
    return { focusRoot: input.storedFocus, drewRandom: false };
  }
  const focusRoot = pickEntryFocusRoot(input.eligible, rng);
  return { focusRoot, drewRandom: focusRoot != null };
}

function sessionStorageLike(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

export function readEntryFocusStorage(
  storage?: Pick<Storage, 'getItem'> | null,
): string | null {
  const store = storage === undefined ? sessionStorageLike() : storage;
  try {
    return store?.getItem(ENTRY_FOCUS_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function writeEntryFocusStorage(
  value: string,
  storage?: Pick<Storage, 'setItem'> | null,
): void {
  const store = storage === undefined ? sessionStorageLike() : storage;
  try {
    store?.setItem(ENTRY_FOCUS_STORAGE_KEY, value);
  } catch {
    // Best-effort persistence; the in-memory choice still applies.
  }
}

export interface HudInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface EntryFocusViewport {
  mobile: boolean;
  legendExpanded: boolean;
  /** The focus chip pushes out to the left of the right view rail (TASK-NS-085). */
  focusChip: boolean;
  /** Detail drawer overlays the canvas (mobile sheet or <=1024 side overlay). */
  detailOverlay: boolean;
}

/** Width reserved on the right while the focus chip is expanded. */
export const FOCUS_CHIP_INSET = 200;

/**
 * Approximate HUD pixel budgets so the bright one-hop region stays clear of the
 * rail toggle, diet twin, view rail, legend, focus chip, and overlay drawer.
 * The desktop nav rail and non-overlay drawer shrink the measured canvas instead.
 */
export function entryFocusInsets(v: EntryFocusViewport): HudInsets {
  const chip = v.focusChip ? FOCUS_CHIP_INSET : 0;
  if (v.mobile) {
    return {
      top: 56,
      right: 60 + chip,
      bottom: (v.legendExpanded ? 148 : 72) + (v.detailOverlay ? 128 : 0),
      left: 60,
    };
  }
  return {
    top: 28,
    right: (v.detailOverlay ? 400 : 72) + chip,
    bottom: v.legendExpanded ? 148 : 48,
    left: 16,
  };
}

/** Bright nodes for fitting; falls back to all nodes when the focus set is empty. */
export function brightNodes<T extends { id: string }>(
  nodes: readonly T[],
  focusIds: ReadonlySet<string> | null,
): readonly T[] {
  if (!focusIds) return nodes;
  const bright = nodes.filter((node) => focusIds.has(node.id));
  return bright.length > 0 ? bright : nodes;
}

/** 2D camera that frames the bright region inside the HUD-safe viewport. */
export function frameBright2d(
  nodes: readonly { x?: number; y?: number }[],
  width: number,
  height: number,
  insets: HudInsets,
  compact = false,
): { x: number; y: number; k: number } {
  if (nodes.length === 0) return { x: 0, y: 0, k: 0.5 };
  return frameGraph2d(nodes, width, height, insets, compact);
}

/** 3D camera distance/center that frames the bright region inside the HUD-safe viewport. */
export function frameBright3d(
  nodes: readonly { x?: number; y?: number }[],
  width: number,
  height: number,
  insets: HudInsets,
  fovDegrees = 32,
): { x: number; y: number; z: number } {
  if (nodes.length === 0) return { x: 0, y: 0, z: 160 };
  const usableW = Math.max(width - insets.left - insets.right, 80);
  const usableH = Math.max(height - insets.top - insets.bottom, 80);
  return framingDistance(nodes, usableW, usableH, fovDegrees);
}
