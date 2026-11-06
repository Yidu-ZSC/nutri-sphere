import { FLOW_BAND_BUDGET, edgePriority, type FlowEdgeInput } from './flowLayout.ts';

export interface HierarchyLinkPick {
  links: FlowEdgeInput[];
  omittedBudget: number;
}

/**
 * Cap the 2D hierarchy's drawn edges with the pathway budget.
 * Unlike the pathway, same-column edges remain eligible. A selected edge is pinned.
 */
export function selectHierarchyLinks(
  links: readonly FlowEdgeInput[],
  anchors: readonly string[],
  pinIndex: number | null,
  budget = FLOW_BAND_BUDGET,
): HierarchyLinkPick {
  if (budget <= 0) {
    return { links: [], omittedBudget: links.length };
  }
  if (links.length <= budget) {
    return { links: [...links], omittedBudget: 0 };
  }

  const anchorSet = new Set(anchors);
  const ranked = [...links].sort(
    (a, b) => edgePriority(b, anchorSet) - edgePriority(a, anchorSet) || a.graphIndex - b.graphIndex,
  );
  let kept = ranked.slice(0, budget);

  if (pinIndex != null && !kept.some((link) => link.graphIndex === pinIndex)) {
    const pinned = links.find((link) => link.graphIndex === pinIndex);
    if (pinned) kept = [...kept.slice(0, budget - 1), pinned];
  }

  kept.sort((a, b) => a.graphIndex - b.graphIndex);
  return {
    links: kept,
    omittedBudget: Math.max(links.length - kept.length, 0),
  };
}
