import { COLUMN_CAPTIONS } from './layout.ts';
import { layoutFlow, type FlowEdgeInput, type FlowNodeInput } from './flowLayout.ts';

/** World units between neighboring column boards. Food sits closer to the camera. */
export const SLAB_DEPTH = 22;
/** Pathway pixels to world units. */
export const SLAB_SCALE = 0.12;
/** Default glance so the four boards are not edge-on. Radians of azimuth. */
export const SLAB_YAW = 0.26;
/** Radians above the horizon. */
export const SLAB_PITCH = 0.16;
/** How far the drag may turn away from the home glance. */
export const SLAB_YAW_LIMIT = 0.5;
export const SLAB_PITCH_UP = 0.4;
export const SLAB_PITCH_DOWN = 0.14;
/** Skip bands peel onto separate depths so a small turn shows which one is in front. */
const LANE = 5;

export interface SlabVec {
  x: number;
  y: number;
  z: number;
}

export interface SlabNode {
  id: string;
  label: string;
  group: string;
  column: number;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
}

export interface SlabBoard {
  column: number;
  label: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
}

export interface SlabBand {
  edge: FlowEdgeInput;
  width: number;
  span: number;
  points: SlabVec[];
}

export interface SlabLayout {
  nodes: SlabNode[];
  boards: SlabBoard[];
  bands: SlabBand[];
}

export interface SlabCameraHome {
  target: SlabVec;
  position: SlabVec;
  yaw: number;
  minDistance: number;
  maxDistance: number;
}

/** Column 0 (food) is nearest the camera. */
export function columnDepth(column: number): number {
  return (1.5 - column) * SLAB_DEPTH;
}

/**
 * Stand the pathway up as four boards.
 * Nodes keep the pathway's left-to-right order; each column steps back in z.
 * A band that skips a column peels onto its own depth. Adjacent bands stay in the gap.
 */
export function layoutSlabs(
  nodes: readonly FlowNodeInput[],
  bands: readonly FlowEdgeInput[],
  viewWidth: number,
): SlabLayout {
  const laid = layoutFlow(nodes, bands, viewWidth);
  const cx = laid.width / 2;
  const cy = laid.height / 2;
  const placed = laid.nodes.map((node) => {
    const centerX = node.x + node.w / 2;
    const centerY = node.y + node.h / 2;
    return {
      id: node.id,
      label: node.label,
      group: node.group,
      column: node.column,
      x: (centerX - cx) * SLAB_SCALE,
      y: (cy - centerY) * SLAB_SCALE,
      z: columnDepth(node.column),
      w: node.w * SLAB_SCALE,
      h: node.h * SLAB_SCALE,
    };
  });
  const byId = new Map(placed.map((node) => [node.id, node]));

  const slabBands: SlabBand[] = [];
  for (const band of laid.bands) {
    const source = byId.get(band.edge.source);
    const target = byId.get(band.edge.target);
    if (!source || !target) continue;
    const from = source.x <= target.x ? source : target;
    const to = source.x <= target.x ? target : source;
    const start = { x: from.x + from.w / 2, y: from.y, z: from.z };
    const end = { x: to.x - to.w / 2, y: to.y, z: to.z };
    const span = Math.abs(from.column - to.column);
    const lane = ((band.edge.graphIndex % 5) - 2) * LANE;
    const midZ = (start.z + end.z) / 2 + (span > 1 ? lane : 0);
    const midX1 = start.x + (end.x - start.x) * 0.35;
    const midX2 = start.x + (end.x - start.x) * 0.65;
    slabBands.push({
      edge: band.edge,
      width: band.width,
      span,
      points: [
        start,
        { x: midX1, y: start.y, z: midZ },
        { x: midX2, y: end.y, z: midZ },
        end,
      ],
    });
  }

  const boards: SlabBoard[] = [];
  for (let column = 0; column < COLUMN_CAPTIONS.length; column += 1) {
    const list = placed.filter((node) => node.column === column);
    if (list.length === 0) continue;
    const minY = Math.min(...list.map((node) => node.y - node.h / 2));
    const maxY = Math.max(...list.map((node) => node.y + node.h / 2));
    const pad = 1.4;
    boards.push({
      column,
      label: COLUMN_CAPTIONS[column] ?? '',
      x: list[0]?.x ?? 0,
      y: (minY + maxY) / 2,
      z: columnDepth(column) - 1.2,
      w: (list[0]?.w ?? 12) + pad * 2,
      h: maxY - minY + pad * 2,
    });
  }

  return { nodes: placed, boards, bands: slabBands };
}

/** A front-three-quarter view, close enough to read the column labels. */
export function slabCameraHome(layout: SlabLayout, viewWidth = 1000, viewHeight = 640): SlabCameraHome {
  const nodes = layout.nodes;
  if (nodes.length === 0) {
    return {
      target: { x: 0, y: 0, z: 0 },
      position: { x: 28, y: 12, z: 90 },
      yaw: SLAB_YAW,
      minDistance: 24,
      maxDistance: 220,
    };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const node of nodes) {
    minX = Math.min(minX, node.x - node.w / 2);
    maxX = Math.max(maxX, node.x + node.w / 2);
    minY = Math.min(minY, node.y - node.h / 2);
    maxY = Math.max(maxY, node.y + node.h / 2);
    minZ = Math.min(minZ, node.z);
    maxZ = Math.max(maxZ, node.z);
  }
  const target = {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    z: (minZ + maxZ) / 2,
  };
  const spanX = Math.max(maxX - minX, 12);
  const spanY = Math.max(maxY - minY, 12);
  const aspect = Math.max(viewWidth, 1) / Math.max(viewHeight, 1);
  const tan = Math.tan(((32 * Math.PI) / 180) / 2);
  const distance = Math.max(spanX / (2 * tan * aspect), spanY / (2 * tan)) * 1.55;
  const polar = Math.PI / 2 - SLAB_PITCH;
  const position = {
    x: target.x + distance * Math.sin(polar) * Math.sin(SLAB_YAW),
    y: target.y + distance * Math.cos(polar),
    z: target.z + distance * Math.sin(polar) * Math.cos(SLAB_YAW),
  };
  return {
    target,
    position,
    yaw: SLAB_YAW,
    minDistance: distance * 0.42,
    maxDistance: distance * 2.6,
  };
}
