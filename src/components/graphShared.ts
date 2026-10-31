import { linkIsFocused } from '../lib/focus';
import { LABEL_HOME_COLUMN, columnIndex, type LayoutMode } from '../lib/layout';
import type { GraphData, Selection, SimLink, SimNode, ViewLayer } from '../types/graph';

export type DrawLink = SimLink & { graphIndex: number };

export interface SceneCommonProps {
  graph: GraphData;
  nodes: SimNode[];
  links: DrawLink[];
  focusIds: ReadonlySet<string> | null;
  selection: Selection | null;
  layer: ViewLayer;
  layout: LayoutMode;
  compact: boolean;
  anchorId: string | null;
  framedNode: SimNode | undefined;
  homeColumn: number;
  degrees: Map<string, number>;
  size: { w: number; h: number };
  coarse: boolean;
  visibleKey: string;
  onSelectNode: (id: string) => void;
  onSelectLink: (index: number) => void;
  onBackground: () => void;
}

export function nodeIsSelected(id: string, selection: Selection | null, links: GraphData['links']): boolean {
  if (selection?.kind === 'node') return selection.id === id;
  if (selection?.kind === 'link') {
    const link = links[selection.index];
    return Boolean(link && (link.source === id || link.target === id));
  }
  return false;
}

export function nodeIsBright(
  id: string,
  selection: Selection | null,
  links: GraphData['links'],
  focusIds: ReadonlySet<string> | null,
): boolean {
  if (nodeIsSelected(id, selection, links)) return true;
  if (focusIds == null) return true;
  return focusIds.has(id);
}

export function linkIsBright(
  link: { source: string; target: string },
  index: number,
  selection: Selection | null,
  focusIds: ReadonlySet<string> | null,
): boolean {
  if (selection?.kind === 'link' && selection.index === index) return true;
  return linkIsFocused(link, focusIds);
}

export function pickFramedNode(nodes: readonly SimNode[], anchorId: string | null): SimNode | undefined {
  if (anchorId) {
    const chosen = nodes.find((node) => node.id === anchorId);
    if (chosen) return chosen;
  }
  const column = nodes.filter((node) => columnIndex(node.type) === LABEL_HOME_COLUMN);
  column.sort((a, b) => (b.layoutY ?? b.y ?? 0) - (a.layoutY ?? a.y ?? 0));
  return column[Math.floor(column.length / 2)] ?? nodes[0];
}
