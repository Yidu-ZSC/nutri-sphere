export interface FocusLink {
  source: string;
  target: string;
}

function neighborhood(nodeId: string, links: readonly FocusLink[]): Set<string> {
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
): ReadonlySet<string> | null {
  if (!diseaseId && !mechanismId && !foodId) return null;
  const sets: Set<string>[] = [];
  if (diseaseId) sets.push(neighborhood(diseaseId, links));
  if (mechanismId) sets.push(neighborhood(mechanismId, links));
  if (foodId) sets.push(neighborhood(foodId, links));
  return sets.reduce((acc, set) => {
    const next = new Set<string>();
    for (const id of acc) {
      if (set.has(id)) next.add(id);
    }
    return next;
  });
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
