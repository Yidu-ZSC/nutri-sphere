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
 *
 * In focus mode (`focusRoot` set) every incident edge of the root is preserved
 * first — including same-column mechanism edges and past the 36-budget / per-node
 * cap — so the browsing focus can honestly show the whole one-hop neighborhood.
 * Non-root edges keep the full-graph rules unchanged.
 */
export function selectFlowBands(
  nodes: readonly FlowNodeInput[],
  links: readonly FlowEdgeInput[],
  anchors: readonly string[],
  pinIndex: number | null,
  budget = FLOW_BAND_BUDGET,
  perNode = FLOW_PER_NODE_CAP,
  focusRoot: string | null = null,
): FlowBandPick {
  const columnOf = new Map(nodes.map((node) => [node.id, columnIndex(node.type)]));
  const rootBands: FlowEdgeInput[] = [];
  const cross: FlowEdgeInput[] = [];
  let omittedSameColumn = 0;
  for (const link of links) {
    if (focusRoot != null && (link.source === focusRoot || link.target === focusRoot)) {
      rootBands.push(link);
      continue;
    }
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
  let keptCross: FlowEdgeInput[];
  if (ranked.length <= budget) {
    keptCross = ranked;
  } else {
    keptCross = [];
    const used = new Map<string, number>();
    const deferred: FlowEdgeInput[] = [];
    for (const link of ranked) {
      const sourceCount = used.get(link.source) ?? 0;
      const targetCount = used.get(link.target) ?? 0;
      if (sourceCount >= perNode || targetCount >= perNode) {
        deferred.push(link);
        continue;
      }
      keptCross.push(link);
      used.set(link.source, sourceCount + 1);
      used.set(link.target, targetCount + 1);
      if (keptCross.length >= budget) break;
    }
    if (keptCross.length < budget) {
      for (const link of deferred) {
        keptCross.push(link);
        if (keptCross.length >= budget) break;
      }
    }
  }

  if (pinIndex != null && !keptCross.some((link) => link.graphIndex === pinIndex)) {
    const pinned = cross.find((link) => link.graphIndex === pinIndex);
    if (pinned) {
      if (keptCross.length >= budget && budget > 0) keptCross = keptCross.slice(0, budget - 1);
      keptCross = [...keptCross, pinned];
    }
  }

  const rootSorted = [...rootBands].sort((a, b) => a.graphIndex - b.graphIndex);
  return {
    bands: [...rootSorted, ...keptCross],
    omittedSameColumn,
    omittedBudget: Math.max(cross.length - keptCross.length, 0),
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

/** Fit the pathway into the viewport, centered. Taller content starts at the top so it is pannable. */
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
  const y = scaledH + pad <= viewHeight ? (viewHeight - scaledH) / 2 : pad;
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

/**
 * Fit the bright (focused) pathway nodes into the HUD-safe viewport. Unlike the
 * whole-layout `frameFlowCamera`, this may zoom in past 1× so a small one-hop
 * neighborhood stays readable, and it accounts for the focus banner / legend / rail.
 */
export function frameFlowFocus(
  nodes: readonly PlacedFlowNode[],
  focusIds: ReadonlySet<string> | null,
  viewWidth: number,
  viewHeight: number,
  insets: { top?: number; right?: number; bottom?: number; left?: number } = {},
): FlowCamera {
  const bright = focusIds ? nodes.filter((node) => focusIds.has(node.id)) : nodes;
  const list = bright.length > 0 ? bright : nodes;
  if (list.length === 0) return { x: 0, y: 0, k: 1 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of list) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.w);
    maxY = Math.max(maxY, node.y + node.h);
  }
  const pad = 20;
  const left = insets.left ?? pad;
  const right = insets.right ?? pad;
  const top = insets.top ?? pad;
  const bottom = insets.bottom ?? pad;
  const usableW = Math.max(viewWidth - left - right, 1);
  const usableH = Math.max(viewHeight - top - bottom, 1);
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const k = clampZoom(Math.min(usableW / spanX, usableH / spanY));
  return {
    k,
    x: left + (usableW - spanX * k) / 2 - minX * k,
    y: top + (usableH - spanY * k) / 2 - minY * k,
  };
}
