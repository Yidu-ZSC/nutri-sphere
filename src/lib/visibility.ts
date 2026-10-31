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
