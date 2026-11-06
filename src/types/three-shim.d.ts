declare module 'three' {
  export class Vector2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
    set(x: number, y: number): this;
  }
  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
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
    children: Object3D[];
    userData: Record<string, unknown>;
    add(...objects: Object3D[]): this;
    traverse(callback: (object: Object3D) => void): void;
    raycast: (...args: unknown[]) => void;
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
  export class MeshBasicMaterial extends Material {
    constructor(params?: object);
    color: { set(color: string): void };
    side: number;
  }
  export class BufferGeometry {
    translate(x: number, y: number, z: number): this;
    rotateX(angle: number): this;
    dispose(): void;
  }
  export class PlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number);
  }
  export class BoxGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, depth?: number);
  }
  export class SphereGeometry extends BufferGeometry {
    constructor(radius?: number, widthSegments?: number, heightSegments?: number);
  }
  export class CatmullRomCurve3 {
    constructor(points?: Vector3[]);
  }
  export class TubeGeometry extends BufferGeometry {
    constructor(
      path?: CatmullRomCurve3,
      tubularSegments?: number,
      radius?: number,
      radialSegments?: number,
      closed?: boolean,
    );
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
    geometry: BufferGeometry;
    material: Material;
  }
  export class Group extends Object3D {}
  export class Scene extends Object3D {}
  export class Camera extends Object3D {}
  export class PerspectiveCamera extends Camera {
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
  }
  export class AmbientLight extends Object3D {
    constructor(color?: number, intensity?: number);
  }
  export class DirectionalLight extends Object3D {
    constructor(color?: number, intensity?: number);
  }
  export class Raycaster {
    setFromCamera(pointer: Vector2, camera: Camera): void;
    intersectObjects(objects: Object3D[], recursive?: boolean): { object: Object3D }[];
  }
  export class WebGLRenderer {
    constructor(params?: object);
    domElement: HTMLCanvasElement;
    setPixelRatio(value: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    setClearColor(color: string, alpha?: number): void;
    render(scene: Scene, camera: Camera): void;
    dispose(): void;
  }
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

declare module 'three/addons/controls/OrbitControls.js' {
  import { Camera, Vector3 } from 'three';
  export class OrbitControls {
    constructor(camera: Camera, domElement?: HTMLElement);
    target: Vector3;
    enableDamping: boolean;
    dampingFactor: number;
    rotateSpeed: number;
    zoomSpeed: number;
    enablePan: boolean;
    screenSpacePanning: boolean;
    minDistance: number;
    maxDistance: number;
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    update(): void;
    dispose(): void;
  }
}
