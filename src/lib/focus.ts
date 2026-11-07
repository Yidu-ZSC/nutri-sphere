export interface FocusLink {
  source: string;
  target: string;
}

/** One-hop neighborhood: the node itself plus every direct neighbor. */
export function neighborhood(nodeId: string, links: readonly FocusLink[]): Set<string> {
  const ids = new Set<string>([nodeId]);
  for (const link of links) {
    if (link.source === nodeId) ids.add(link.target);
    if (link.target === nodeId) ids.add(link.source);
  }
  return ids;
}

/**
 * No filters → null (everything stays fully visible).
 * One filter → that node plus its one-hop neighbors.
 * Disease, mechanism, and food together → intersection (AND across anchors).
 */
export function focusedNodeIds(
  links: readonly FocusLink[],
  diseaseId: string | null,
  mechanismId: string | null,
  foodId: string | null = null,
  lensId: string | null = null,
): ReadonlySet<string> | null {
  if (!diseaseId && !mechanismId && !foodId && !lensId) return null;
  const sets: Set<string>[] = [];
  if (diseaseId) sets.push(neighborhood(diseaseId, links));
  if (mechanismId) sets.push(neighborhood(mechanismId, links));
  if (foodId) sets.push(neighborhood(foodId, links));
  if (lensId) sets.push(neighborhood(lensId, links));
  return sets.reduce((acc, set) => {
    const next = new Set<string>();
    for (const id of acc) {
      if (set.has(id)) next.add(id);
    }
    return next;
  });
}

/**
 * Bright-set for the canvas: theme/filter focusIds AND click one-hop.
 * Missing filter → pure click neighborhood; missing click → filter (or null) alone.
 * Neither → null (full bright). Does not remove nodes from the scene.
 */
export function effectiveFocusIds(
  filterFocus: ReadonlySet<string> | null,
  clickRoot: string | null,
  links: readonly FocusLink[],
): ReadonlySet<string> | null {
  if (!clickRoot) return filterFocus;
  const click = neighborhood(clickRoot, links);
  if (filterFocus == null) return click;
  const next = new Set<string>();
  for (const id of click) {
    if (filterFocus.has(id)) next.add(id);
  }
  return next;
}

export function hasThemeHighlightContext(
  diseaseId: string | null,
  mechanismId: string | null,
  foodId: string | null,
  lensId: string | null,
): boolean {
  return Boolean(diseaseId || mechanismId || foodId || lensId);
}

/**
 * When the browse focus is locked, clicks only open the drawer — the bright set
 * stays on the snapshotted root (or the theme/lens filter when no root was set).
 */
export function resolveCanvasFocus(
  filterFocus: ReadonlySet<string> | null,
  clickRoot: string | null,
  links: readonly FocusLink[],
  locked: boolean,
  lockedFocusRoot: string | null,
): { brightIds: ReadonlySet<string> | null; focusRoot: string | null } {
  if (locked) {
    if (lockedFocusRoot != null) {
      return {
        brightIds: effectiveFocusIds(filterFocus, lockedFocusRoot, links),
        focusRoot: lockedFocusRoot,
      };
    }
    return { brightIds: filterFocus, focusRoot: null };
  }
  return {
    brightIds: effectiveFocusIds(filterFocus, clickRoot, links),
    focusRoot: clickRoot,
  };
}

export function isFocusEmpty(
  focus: ReadonlySet<string> | null,
  nodeIds: readonly string[],
): boolean {
  if (focus == null) return false;
  return nodeIds.every((id) => !focus.has(id));
}

export function linkIsFocused(
  link: FocusLink,
  focus: ReadonlySet<string> | null,
): boolean {
  if (focus == null) return true;
  return focus.has(link.source) && focus.has(link.target);
}

/**
 * Bright-edge rule for a browsing root (TASK-NS-084). When a root is present the
 * bright edges are exactly the root's incident edges (in + out), so neighbor—neighbor
 * edges stay in the dimmed background. Without a root it falls back to the induced
 * subgraph used by filter focus.
 */
export function linkIsRootIncident(
  link: FocusLink,
  root: string | null,
): boolean {
  if (root == null) return false;
  return link.source === root || link.target === root;
}

/** Root-aware bright-edge test: root incident edges win, otherwise the induced subgraph. */
export function linkIsBrightInFocus(
  link: FocusLink,
  root: string | null,
  focus: ReadonlySet<string> | null,
): boolean {
  if (root != null) return linkIsRootIncident(link, root);
  return linkIsFocused(link, focus);
}
