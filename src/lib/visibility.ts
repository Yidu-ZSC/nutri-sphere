export function selectionPinIds(
  selection: { kind: 'node'; id: string } | { kind: 'link'; index: number } | null,
  links: readonly { source: string; target: string }[],
  hideUnmatched: boolean,
  focusIds: ReadonlySet<string> | null,
): Set<string> {
  if (!hideUnmatched || focusIds == null || selection == null) return new Set();
  if (selection.kind === 'node') return new Set([selection.id]);
  const link = links[selection.index];
  if (!link) return new Set();
  return new Set([link.source, link.target]);
}

export function visibleNodeIds(
  allIds: readonly string[],
  focusIds: ReadonlySet<string> | null,
  hideUnmatched: boolean,
  pinned: ReadonlySet<string>,
): Set<string> {
  if (!hideUnmatched || focusIds == null) return new Set(allIds);
  const visible = new Set<string>();
  for (const id of allIds) {
    if (focusIds.has(id) || pinned.has(id)) visible.add(id);
  }
  return visible;
}
