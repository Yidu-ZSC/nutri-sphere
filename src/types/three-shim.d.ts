declare module 'three' {
  export class Vector2 {
    set(x: number, y: number): this;
  }
  export class Vector3 {
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
    setScalar(scalar: number): this;
  }
  export class Object3D {
    position: Vector3;
    scale: Vector3;
    visible: boolean;
    frustumCulled: boolean;
    add(...objects: Object3D[]): this;
  }
  export class Material {
    dispose(): void;
    transparent: boolean;
    opacity: number;
    depthWrite: boolean;
    depthTest: boolean;
    map: { dispose(): void } | null;
  }
  export class SpriteMaterial extends Material {}
  export class MeshLambertMaterial extends Material {
    constructor(params?: object);
    color: { set(color: string): void };
    emissive: { set(color: string): void };
    emissiveIntensity: number;
  }
  export class BufferGeometry {
    translate(x: number, y: number, z: number): this;
    rotateX(angle: number): this;
  }
  export class ExtrudeGeometry extends BufferGeometry {
    constructor(shape: Shape, options?: object);
  }
  export class CylinderGeometry extends BufferGeometry {
    constructor(radiusTop: number, radiusBottom: number, height: number, radialSegments?: number);
  }
  export class OctahedronGeometry extends BufferGeometry {
    constructor(radius?: number, detail?: number);
  }
  export class Mesh extends Object3D {
    constructor(geometry?: BufferGeometry, material?: Material);
    material: MeshLambertMaterial;
  }
  export class Group extends Object3D {}
  export class Shape {
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  }
  export class Sprite extends Object3D {
    material: SpriteMaterial;
    center: Vector2;
  }
  export const DoubleSide: number;
}
