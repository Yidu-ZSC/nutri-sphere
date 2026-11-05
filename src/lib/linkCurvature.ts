/** Bow long edges that pass through an intermediate node with a shorter hop to the same anchor. */
export const LONG_COLLINEAR_CURVATURE = 0.22;

export interface LinkEndpoints {
  source: string;
  target: string;
}

export interface NodePosition {
  x: number;
  y: number;
  z?: number;
}

function endpointId(endpoint: string | { id: string }): string {
  return typeof endpoint === 'string' ? endpoint : endpoint.id;
}

function perpThreshold(segmentLength: number): number {
  return Math.max(16, segmentLength * 0.14);
}

function pointOnSegment(
  point: NodePosition,
  start: NodePosition,
  end: NodePosition,
): { t: number; perp: number; length: number } {
  const ax = end.x - start.x;
  const ay = end.y - start.y;
  const az = (end.z ?? 0) - (start.z ?? 0);
  const lengthSq = ax * ax + ay * ay + az * az;
  const length = Math.sqrt(lengthSq);
  if (lengthSq < 1e-6) return { t: 0, perp: Infinity, length: 0 };
  const t = ((point.x - start.x) * ax + (point.y - start.y) * ay + (point.z ?? 0) * az) / lengthSq;
  const px = start.x + t * ax;
  const py = start.y + t * ay;
  const pz = (start.z ?? 0) + t * az;
  const perp = Math.hypot(point.x - px, point.y - py, (point.z ?? 0) - pz);
  return { t, perp, length };
}

function dist(a: NodePosition, b: NodePosition): number {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

/** Stable sign so overlapping long edges bow in different directions when needed. */
function curvatureSign(source: string, target: string, via: string): number {
  const key = `${source}\0${target}\0${via}`;
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) | 0;
  }
  return hash % 2 === 0 ? 1 : -1;
}

/**
 * When A→C is collinear with an intermediate B that has a shorter B→C link, curve A→C
 * so the shorter mechanism hop stays straight and clickable.
 */
export function computeLinkCurvature(
  links: readonly LinkEndpoints[],
  positions: ReadonlyMap<string, NodePosition>,
): number[] {
  const curvatures = links.map(() => 0);

  for (let longIndex = 0; longIndex < links.length; longIndex += 1) {
    const long = links[longIndex];
    const sourceId = endpointId(long.source);
    const targetId = endpointId(long.target);
    const start = positions.get(sourceId);
    const end = positions.get(targetId);
    if (!start || !end) continue;

    const longSpan = dist(start, end);
    if (longSpan < 1e-3) continue;

    for (let hopIndex = 0; hopIndex < links.length; hopIndex += 1) {
      if (hopIndex === longIndex) continue;
      const hop = links[hopIndex];
      const hopSource = endpointId(hop.source);
      const hopTarget = endpointId(hop.target);

      let via: NodePosition | undefined;
      let viaId: string | undefined;
      let hopSpan = 0;

      if (hopTarget === targetId && hopSource !== sourceId) {
        via = positions.get(hopSource);
        viaId = hopSource;
        if (via) hopSpan = dist(via, end);
      } else if (hopSource === sourceId && hopTarget !== targetId) {
        via = positions.get(hopTarget);
        viaId = hopTarget;
        if (via) hopSpan = dist(start, via);
      } else {
        continue;
      }

      if (!via || !viaId) continue;

      const onLine = pointOnSegment(via, start, end);
      if (onLine.t <= 0.04 || onLine.t >= 0.96) continue;
      if (onLine.perp > perpThreshold(longSpan)) continue;
      if (hopSpan >= longSpan * 0.92) continue;

      const sign = curvatureSign(sourceId, targetId, viaId);
      curvatures[longIndex] = sign * LONG_COLLINEAR_CURVATURE;
      break;
    }
  }

  return curvatures;
}

export function applyLinkCurvature<T extends LinkEndpoints & { curvature?: number }>(
  links: T[],
  nodes: readonly { id: string; x?: number; y?: number; z?: number }[],
): void {
  const positions = new Map<string, NodePosition>();
  for (const node of nodes) {
    if (node.x == null || node.y == null) continue;
    positions.set(node.id, { x: node.x, y: node.y, z: node.z });
  }
  const values = computeLinkCurvature(links, positions);
  links.forEach((link, index) => {
    link.curvature = values[index] ?? 0;
  });
}
