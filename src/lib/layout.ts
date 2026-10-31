import type { SimNode } from '../types/graph';

export type LayoutMode = 'hierarchy' | 'force';

/** diet/food → nutrient/compound/metabolite → mechanism → disease/outcome */
export const COLUMN_X = [-117, -39, 39, 117] as const;
export const COLUMN_Y_GAP = 18;
/** Idle mobile labels stay on the mechanism column, which sits at the camera. */
export const LABEL_HOME_COLUMN = 2;

const COLUMN_BY_TYPE: Record<string, number> = {
  diet_pattern: 0,
  food_category: 0,
  food: 0,
  nutrient: 1,
  compound: 1,
  metabolite: 1,
  mechanism: 2,
  disease: 3,
  biomarker: 3,
};

export const COLUMN_CAPTIONS = ['膳食/食物', '营养素/代谢物', '机制', '疾病/结局'] as const;

export function columnIndex(type: string): number {
  return COLUMN_BY_TYPE[type] ?? 1;
}

export function linkDegrees(links: readonly { source: string; target: string }[]): Map<string, number> {
  const degrees = new Map<string, number>();
  for (const link of links) {
    degrees.set(link.source, (degrees.get(link.source) ?? 0) + 1);
    degrees.set(link.target, (degrees.get(link.target) ?? 0) + 1);
  }
  return degrees;
}

function unpin(node: SimNode) {
  delete node.fx;
  delete node.fy;
  delete node.fz;
}

/**
 * Hierarchy pins each node to a type column. Force mode keeps a column-seeded
 * start, then lets the simulation move unpinned nodes.
 */
export function applyLayout(nodes: SimNode[], mode: LayoutMode): void {
  const columns: SimNode[][] = [[], [], [], []];
  for (const node of nodes) {
    const column = columnIndex(node.type);
    columns[column]?.push(node);
  }

  columns.forEach((list, column) => {
    list.sort((a, b) => a.label.localeCompare(b.label, 'zh') || a.id.localeCompare(b.id));
    const mid = (list.length - 1) / 2;
    const x = (COLUMN_X[column] ?? 0) * (mode === 'hierarchy' ? 1 : 0.34);
    list.forEach((node, index) => {
      const y = (mid - index) * (mode === 'hierarchy' ? COLUMN_Y_GAP : 12);
      const z = ((index % 3) - 1) * (mode === 'hierarchy' ? 5 : 10);
      node.x = x;
      node.y = y;
      node.z = z;
      if (mode === 'hierarchy') {
        node.fx = x;
        node.fy = y;
        node.fz = z;
      } else {
        unpin(node);
      }
    });
  });
}

/** Camera placement that frames known node coordinates, including label padding. */
export function framingDistance(
  nodes: readonly { x?: number; y?: number }[],
  width: number,
  height: number,
  fovDegrees = 50,
): { x: number; y: number; z: number } {
  const xs = nodes.map((node) => node.x ?? 0);
  const ys = nodes.map((node) => node.y ?? 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 72) + 88;
  const spanY = Math.max(maxY - minY, 42) + 42;
  const aspect = Math.max(width, 1) / Math.max(height, 1);
  const tan = Math.tan(((fovDegrees * Math.PI) / 180) / 2);
  const z = Math.max(spanY / (2 * tan), spanX / (2 * tan * aspect)) * 1.04;
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z };
}

/** Distance that makes one world unit cover `pixelsPerUnit` screen pixels. */
export function cameraDistanceForPixels(viewportHeight: number, pixelsPerUnit: number, fovDegrees = 50): number {
  const height = Math.max(viewportHeight, 1);
  const pixels = Math.max(pixelsPerUnit, 0.5);
  const fov = (fovDegrees * Math.PI) / 180;
  const visibleHeight = height / pixels;
  return visibleHeight / (2 * Math.tan(fov / 2));
}
