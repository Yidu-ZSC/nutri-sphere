import * as THREE from 'three';
import type { ShapeKind } from '../lib/nodeStyle';

const cache = new Map<ShapeKind, THREE.BufferGeometry>();

function roundedTile(): THREE.BufferGeometry {
  const width = 1.9;
  const height = 1.9;
  const radius = 0.46;
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  const depth = 0.62;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 1,
    curveSegments: 3,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function polygon(sides: number, radius: number): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(radius, radius, 0.58, sides);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function build(kind: ShapeKind): THREE.BufferGeometry {
  switch (kind) {
    case 'rounded':
      return roundedTile();
    case 'hex':
      return polygon(6, 1.05);
    case 'diamond':
      return new THREE.OctahedronGeometry(1.12, 0);
    case 'octagon':
      return polygon(8, 1.08);
    default:
      return roundedTile();
  }
}

export function geometryFor(kind: ShapeKind): THREE.BufferGeometry {
  const cached = cache.get(kind);
  if (cached) return cached;
  const geometry = build(kind);
  cache.set(kind, geometry);
  return geometry;
}
