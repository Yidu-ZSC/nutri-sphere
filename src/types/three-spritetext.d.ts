declare module 'three-spritetext' {
  import { Object3D, SpriteMaterial, Vector2, Vector3 } from 'three';

  export default class SpriteText extends Object3D {
    constructor(text?: string, textHeight?: number, color?: string);
    text: string;
    textHeight: number;
    color: string;
    backgroundColor: string | false;
    padding: number | [number, number];
    borderRadius: number | [number, number, number, number];
    strokeWidth: number;
    strokeColor: string;
    fontFace: string;
    fontSize: number;
    fontWeight: string;
    center: Vector2;
    material: SpriteMaterial;
    position: Vector3;
  }
}
