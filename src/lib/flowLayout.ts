import { COLUMN_CAPTIONS, columnIndex } from './layout.ts';

/** Cross-column bands drawn at once. Past this, lower-ranked edges stay in the data. */
export const FLOW_BAND_BUDGET = 36;
/** Stops one hub from consuming the whole budget before other nodes appear. */
export const FLOW_PER_NODE_CAP = 4;

export interface FlowNodeInput {
  id: string;
  label: string;
  type: string;
  group: string;
}

export interface FlowEdgeInput {
  source: string;
  target: string;
  graphIndex: number;
  direction: string;
  strength?: string;
  relation: string;
  evidenceCount: number;
}

export interface FlowBandPick {
  bands: FlowEdgeInput[];
  omittedSameColumn: number;
  omittedBudget: number;
}

/**
 * Keep left-to-right (and the rare backward) edges between columns.
 * Same-column edges are counted and left out of the picture.
 * Over budget, anchor-touching edges and stronger / better-evidenced edges win.
 * A pinned link is kept when it crosses columns.
 */
export function selectFlowBands(
  nodes: readonly FlowNodeInput[],
  links: readonly FlowEdgeInput[],
  anchors: readonly string[],
  pinIndex: number | null,
  budget = FLOW_BAND_BUDGET,
  perNode = FLOW_PER_NODE_CAP,
): FlowBandPick {
  const columnOf = new Map(nodes.map((node) => [node.id, columnIndex(node.type)]));
  const cross: FlowEdgeInput[] = [];
  let omittedSameColumn = 0;
  for (const link of links) {
    const sourceColumn = columnOf.get(link.source);
    const targetColumn = columnOf.get(link.target);
    if (sourceColumn == null || targetColumn == null || sourceColumn === targetColumn) {
      omittedSameColumn += 1;
      continue;
    }
    cross.push(link);
  }

  const anchorSet = new Set(anchors);
  const ranked = [...cross].sort(
    (a, b) => edgePriority(b, anchorSet) - edgePriority(a, anchorSet) || a.graphIndex - b.graphIndex,
  );
  let kept: FlowEdgeInput[];
  if (ranked.length <= budget) {
    kept = ranked;
  } else {
    kept = [];
    const used = new Map<string, number>();
    const deferred: FlowEdgeInput[] = [];
    for (const link of ranked) {
      const sourceCount = used.get(link.source) ?? 0;
      const targetCount = used.get(link.target) ?? 0;
      if (sourceCount >= perNode || targetCount >= perNode) {
        deferred.push(link);
        continue;
      }
      kept.push(link);
      used.set(link.source, sourceCount + 1);
      used.set(link.target, targetCount + 1);
      if (kept.length >= budget) break;
    }
    if (kept.length < budget) {
      for (const link of deferred) {
        kept.push(link);
        if (kept.length >= budget) break;
      }
    }
  }

  if (pinIndex != null && !kept.some((link) => link.graphIndex === pinIndex)) {
    const pinned = cross.find((link) => link.graphIndex === pinIndex);
    if (pinned) {
      if (kept.length >= budget && budget > 0) kept = kept.slice(0, budget - 1);
      kept = [...kept, pinned];
    }
  }

  return {
    bands: kept,
    omittedSameColumn,
    omittedBudget: Math.max(cross.length - kept.length, 0),
  };
}

export function edgePriority(link: FlowEdgeInput, anchors: ReadonlySet<string>): number {
  const strength =
    link.strength === 'high' ? 300 : link.strength === 'moderate' || link.strength === 'quantitative' ? 200 : 40;
  const evidence = Math.min(Math.max(link.evidenceCount, 1), 12) * 10;
  const touch = anchors.has(link.source) || anchors.has(link.target) ? 1000 : 0;
  return touch + strength + evidence;
}

/** Stroke width in pixels. Strength sets the base; more excerpts add a little. */
export function bandThickness(link: Pick<FlowEdgeInput, 'strength' | 'evidenceCount'>): number {
  const base = link.strength === 'high' ? 5 : link.strength === 'moderate' || link.strength === 'quantitative' ? 3.2 : 1.7;
  return Math.min(base + Math.log2(Math.max(link.evidenceCount, 1)) * 0.8, 8);
}

export interface PlacedFlowNode {
  id: string;
  label: string;
  group: string;
  column: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlacedFlowBand {
  edge: FlowEdgeInput;
  d: string;
  width: number;
}

export interface FlowColumnCaption {
  label: string;
  x: number;
  w: number;
}

const NODE_H = 30;
const NODE_GAP = 12;
const HEADER = 32;
const BOTTOM = 28;

export function layoutFlow(
  nodes: readonly FlowNodeInput[],
  bands: readonly FlowEdgeInput[],
  width: number,
): {
  nodes: PlacedFlowNode[];
  bands: PlacedFlowBand[];
  captions: FlowColumnCaption[];
  width: number;
  height: number;
} {
  const nodeW = width < 900 ? 108 : 136;
  const colGap = 56;
  const layoutWidth = Math.max(width, nodeW * 4 + colGap * 3 + 32);
  const incident = new Map<string, string[]>();
  for (const band of bands) {
    pushIncident(incident, band.source, band.target);
    pushIncident(incident, band.target, band.source);
  }
  const visible = new Set<string>();
  for (const band of bands) {
    visible.add(band.source);
    visible.add(band.target);
  }
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const columns: FlowNodeInput[][] = [[], [], [], []];
  for (const id of visible) {
    const node = byId.get(id);
    if (!node) continue;
    columns[columnIndex(node.type)]?.push(node);
  }

  const order = new Map<string, number>();
  for (const list of columns) {
    list.sort((a, b) => a.label.localeCompare(b.label, 'zh') || a.id.localeCompare(b.id));
    list.forEach((node, index) => order.set(node.id, index));
  }
  for (let pass = 0; pass < 6; pass += 1) {
    for (const list of columns) {
      const next = [...list].sort((a, b) => {
        const delta = barycenter(a.id, incident, order) - barycenter(b.id, incident, order);
        if (delta !== 0) return delta;
        return a.label.localeCompare(b.label, 'zh') || a.id.localeCompare(b.id);
      });
      list.splice(0, list.length, ...next);
      list.forEach((node, index) => order.set(node.id, index));
    }
  }

  const tallest = Math.max(...columns.map((list) => list.length), 1);
  const contentHeight = HEADER + tallest * NODE_H + Math.max(tallest - 1, 0) * NODE_GAP + BOTTOM;
  const height = contentHeight;
  const inner = nodeW * 4 + colGap * 3;
  const startX = Math.max((layoutWidth - inner) / 2, 16);
  const placed = new Map<string, PlacedFlowNode>();
  columns.forEach((list, column) => {
    list.forEach((node, index) => {
      placed.set(node.id, {
        id: node.id,
        label: node.label,
        group: node.group,
        column,
        x: startX + column * (nodeW + colGap),
        y: HEADER + index * (NODE_H + NODE_GAP),
        w: nodeW,
        h: NODE_H,
      });
    });
  });

  const captions: FlowColumnCaption[] = COLUMN_CAPTIONS.map((label, column) => ({
    label,
    x: startX + column * (nodeW + colGap),
    w: nodeW,
  }));

  const geometric: { edge: FlowEdgeInput; from: PlacedFlowNode; to: PlacedFlowNode }[] = [];
  const exitCount = new Map<string, number>();
  const enterCount = new Map<string, number>();
  for (const edge of bands) {
    const source = placed.get(edge.source);
    const target = placed.get(edge.target);
    if (!source || !target) continue;
    const from = source.x <= target.x ? source : target;
    const to = source.x <= target.x ? target : source;
    exitCount.set(from.id, (exitCount.get(from.id) ?? 0) + 1);
    enterCount.set(to.id, (enterCount.get(to.id) ?? 0) + 1);
    geometric.push({ edge, from, to });
  }
  geometric.sort((a, b) => a.from.y - b.from.y || a.to.y - b.to.y || a.edge.graphIndex - b.edge.graphIndex);

  const exits = new Map<string, number>();
  const enters = new Map<string, number>();
  const placedBands = geometric.map(({ edge, from, to }) => {
    const fromSlot = exits.get(from.id) ?? 0;
    const toSlot = enters.get(to.id) ?? 0;
    exits.set(from.id, fromSlot + 1);
    enters.set(to.id, toSlot + 1);
    const y1 = from.y + ((fromSlot + 1) / ((exitCount.get(from.id) ?? 1) + 1)) * from.h;
    const y2 = to.y + ((toSlot + 1) / ((enterCount.get(to.id) ?? 1) + 1)) * to.h;
    const x1 = from.x + from.w;
    const x2 = to.x;
    const mid = (x1 + x2) / 2;
    const span = Math.abs(from.column - to.column);
    const bow = span > 1 ? ((fromSlot % 5) - 2) * 16 : 0;
    const d = `M ${round(x1)} ${round(y1)} C ${round(mid)} ${round(y1 + bow)}, ${round(mid)} ${round(y2 + bow)}, ${round(x2)} ${round(y2)}`;
    return { edge, d, width: bandThickness(edge) };
  });

  return { nodes: [...placed.values()], bands: placedBands, captions, width: layoutWidth, height };
}

function pushIncident(map: Map<string, string[]>, id: string, other: string) {
  const list = map.get(id);
  if (list) list.push(other);
  else map.set(id, [other]);
}

function barycenter(id: string, incident: Map<string, string[]>, order: Map<string, number>): number {
  const others = incident.get(id) ?? [];
  if (others.length === 0) return order.get(id) ?? 0;
  let sum = 0;
  let count = 0;
  for (const other of others) {
    const value = order.get(other);
    if (value == null) continue;
    sum += value;
    count += 1;
  }
  if (count === 0) return order.get(id) ?? 0;
  return sum / count;
}

function round(value: number): string {
  return value.toFixed(1);
}

export interface FlowCamera {
  x: number;
  y: number;
  k: number;
}

export const FLOW_ZOOM_MIN = 0.4;
export const FLOW_ZOOM_MAX = 3.5;

function clampZoom(value: number): number {
  return Math.min(FLOW_ZOOM_MAX, Math.max(FLOW_ZOOM_MIN, value));
}

/** Fit the pathway into the viewport. Content shorter than the view stays near the top. */
export function frameFlowCamera(
  layoutWidth: number,
  layoutHeight: number,
  viewWidth: number,
  viewHeight: number,
): FlowCamera {
  const pad = 20;
  const usableW = Math.max(viewWidth - pad * 2, 1);
  const usableH = Math.max(viewHeight - pad * 2, 1);
  const k = clampZoom(
    Math.min(usableW / Math.max(layoutWidth, 1), usableH / Math.max(layoutHeight, 1), 1),
  );
  const scaledH = layoutHeight * k;
  const y = scaledH + pad <= viewHeight ? pad : (viewHeight - scaledH) / 2;
  return {
    k,
    x: (viewWidth - layoutWidth * k) / 2,
    y,
  };
}

/** Zoom around a viewport point so that point stays under the pointer. */
export function zoomFlowCamera(
  camera: FlowCamera,
  anchorX: number,
  anchorY: number,
  factor: number,
): FlowCamera {
  const k = clampZoom(camera.k * factor);
  const ratio = k / camera.k;
  return {
    k,
    x: anchorX - (anchorX - camera.x) * ratio,
    y: anchorY - (anchorY - camera.y) * ratio,
  };
}

export function panFlowCamera(camera: FlowCamera, dx: number, dy: number): FlowCamera {
  return { x: camera.x + dx, y: camera.y + dy, k: camera.k };
}
