import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import SpriteText from 'three-spritetext';
import { LABEL_FONT } from '../lib/labelText';
import { FLOW_DIM_BAND, FLOW_DIM_LABEL, FLOW_DIM_NODE, semanticColor } from '../lib/palette';
import {
  layoutSlabs,
  slabCameraHome,
  SLAB_PITCH_DOWN,
  SLAB_PITCH_UP,
  SLAB_SCALE,
  SLAB_YAW_LIMIT,
  type SlabCameraHome,
} from '../lib/flowSlab';
import { selectFlowBands, type FlowEdgeInput, type FlowNodeInput } from '../lib/flowLayout';
import type { HudInsets } from '../lib/entryFocus';
import type { CanvasStage } from '../lib/canvasStage';
import type { GraphLink, GraphNode, Selection } from '../types/graph';
import { linkIsInteractable, nodeIsInteractable } from './graphShared';

interface FlowSlabSceneProps {
  nodes: readonly GraphNode[];
  links: readonly (GraphLink & { graphIndex: number })[];
  width: number;
  height: number;
  anchors: readonly string[];
  pinIndex: number | null;
  selection: Selection | null;
  focusIds: ReadonlySet<string> | null;
  focusRoot: string | null;
  insets: HudInsets;
  canvasStage: CanvasStage;
  onSelectNode: (id: string) => void;
  onSelectLink: (index: number) => void;
  onBackground: () => void;
  highlightBrowseLocked: boolean;
}

function flowNodes(nodes: readonly GraphNode[]): FlowNodeInput[] {
  return nodes.map((node) => ({
    id: node.id,
    label: node.label,
    type: node.type,
    group: node.group,
  }));
}

function flowEdges(links: readonly (GraphLink & { graphIndex: number })[]): FlowEdgeInput[] {
  return links.map((link) => ({
    source: link.source,
    target: link.target,
    graphIndex: link.graphIndex,
    direction: link.direction,
    strength: link.strength,
    relation: link.relation,
    evidenceCount: link.evidences?.length ?? 1,
  }));
}

function cssColor(value: string): string {
  const hex = value.match(/^#([0-9a-f]{6})/i);
  if (hex) return `#${hex[1]}`;
  const rgb = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    const channel = (part: string) => Number(part).toString(16).padStart(2, '0');
    return `#${channel(rgb[1] ?? '0')}${channel(rgb[2] ?? '0')}${channel(rgb[3] ?? '0')}`;
  }
  return '#9aa4b2';
}

function shortLabel(label: string): string {
  const chars = [...label];
  if (chars.length <= 8) return label;
  return `${chars.slice(0, 7).join('')}…`;
}

function bandOpacity(
  edge: FlowEdgeInput,
  selection: Selection | null,
  focusIds: ReadonlySet<string> | null,
  focusRoot: string | null,
): number {
  const selected = selection?.kind === 'link' && selection.index === edge.graphIndex;
  if (selected) return 0.95;
  if (selection?.kind === 'node') {
    return edge.source === selection.id || edge.target === selection.id ? 0.9 : FLOW_DIM_BAND;
  }
  if (selection?.kind === 'link') return 0.2;
  if (focusRoot != null) {
    return edge.source === focusRoot || edge.target === focusRoot ? 0.72 : FLOW_DIM_BAND;
  }
  if (focusIds && !(focusIds.has(edge.source) && focusIds.has(edge.target))) return FLOW_DIM_BAND;
  return 0.72;
}

function applyHome(camera: THREE.PerspectiveCamera, controls: OrbitControls, home: SlabCameraHome) {
  camera.position.set(home.position.x, home.position.y, home.position.z);
  controls.target.set(home.target.x, home.target.y, home.target.z);
  controls.minDistance = home.minDistance;
  controls.maxDistance = home.maxDistance;
  controls.minAzimuthAngle = home.yaw - SLAB_YAW_LIMIT;
  controls.maxAzimuthAngle = home.yaw + SLAB_YAW_LIMIT;
  controls.minPolarAngle = Math.PI / 2 - SLAB_PITCH_UP;
  controls.maxPolarAngle = Math.PI / 2 + SLAB_PITCH_DOWN;
  controls.update();
}

export function FlowSlabScene({
  nodes,
  links,
  width,
  height,
  anchors,
  pinIndex,
  selection,
  focusIds,
  focusRoot,
  insets,
  canvasStage,
  onSelectNode,
  onSelectLink,
  onBackground,
  highlightBrowseLocked,
}: FlowSlabSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const picture = useMemo(() => {
    const inputNodes = flowNodes(nodes);
    const picked = selectFlowBands(inputNodes, flowEdges(links), anchors, pinIndex, undefined, undefined, focusRoot);
    const laid = layoutSlabs(inputNodes, picked.bands, width);
    return { picked, laid };
  }, [anchors, focusRoot, links, nodes, pinIndex, width]);

  const selectionRef = useRef(selection);
  const focusRef = useRef(focusIds);
  const focusRootRef = useRef(focusRoot);
  const selectNodeRef = useRef(onSelectNode);
  const selectLinkRef = useRef(onSelectLink);
  const backgroundRef = useRef(onBackground);
  const lockedRef = useRef(highlightBrowseLocked);
  selectionRef.current = selection;
  focusRef.current = focusIds;
  focusRootRef.current = focusRoot;
  selectNodeRef.current = onSelectNode;
  selectLinkRef.current = onSelectLink;
  backgroundRef.current = onBackground;
  lockedRef.current = highlightBrowseLocked;

  const focusKey = focusIds ? [...focusIds].sort().join('|') : '';
  const selectionKey = selection == null ? '' : selection.kind === 'node' ? `n:${selection.id}` : `l:${selection.index}`;
  const paintRef = useRef<() => void>(() => {});
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const homeRef = useRef<SlabCameraHome | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || picture.laid.nodes.length === 0 || width < 2 || height < 2) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(cssColor(canvasStage.bg), 1);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 2000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.45;
    controls.zoomSpeed = 0.7;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    cameraRef.current = camera;
    controlsRef.current = controls;
    const home = slabCameraHome(picture.laid, width, height, focusRef.current, insets);
    homeRef.current = home;
    applyHome(camera, controls, home);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 0.45);
    key.position.set(30, 50, 80);
    scene.add(key);

    const root = new THREE.Group();
    scene.add(root);
    const disposables: Array<THREE.BufferGeometry | THREE.Material> = [];

    for (const board of picture.laid.boards) {
      const geo = new THREE.PlaneGeometry(board.w, board.h);
      const material = new THREE.MeshBasicMaterial({
        color: cssColor(canvasStage.columnPlate),
        transparent: true,
        opacity: 0.82,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(board.x, board.y, board.z);
      root.add(mesh);
      disposables.push(geo, material);

      const caption = new SpriteText(board.label);
      caption.color = canvasStage.columnText;
      caption.fontFace = LABEL_FONT;
      caption.fontSize = 72;
      caption.textHeight = 2.1;
      caption.position.set(board.x, board.y + board.h / 2 + 1.6, board.z + 1.4);
      caption.material.depthWrite = false;
      caption.material.depthTest = false;
      caption.raycast = () => {};
      root.add(caption);
      disposables.push(caption.material);
    }

    const nodeParts = new Map<string, { box: THREE.Mesh; dot: THREE.Mesh; label: SpriteText }>();

    for (const node of picture.laid.nodes) {
      const geo = new THREE.BoxGeometry(node.w, node.h, 0.35);
      const material = new THREE.MeshBasicMaterial({
        color: cssColor(canvasStage.columnPlate),
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(node.x, node.y, node.z);
      mesh.userData = { kind: 'node', id: node.id };
      root.add(mesh);
      disposables.push(geo, material);

      const dotGeo = new THREE.SphereGeometry(0.45, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: cssColor(semanticColor(node.group)), transparent: true, opacity: 1 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(node.x - node.w / 2 + 1.1, node.y, node.z + 0.3);
      dot.userData = { kind: 'node', id: node.id };
      root.add(dot);
      disposables.push(dotGeo, dotMat);

      const label = new SpriteText(shortLabel(node.label));
      label.color = canvasStage.spriteLabelColor;
      label.backgroundColor = canvasStage.spriteLabelBg;
      label.padding = 0.4;
      label.borderRadius = 0.4;
      label.strokeWidth = 0.45;
      label.strokeColor = canvasStage.spriteStroke;
      label.fontFace = LABEL_FONT;
      label.fontSize = 80;
      label.fontWeight = '600';
      label.textHeight = 1.7;
      label.position.set(node.x + 0.7, node.y, node.z + 0.7);
      label.material.depthWrite = false;
      label.material.depthTest = false;
      label.material.transparent = true;
      label.userData = { kind: 'node', id: node.id };
      root.add(label);
      disposables.push(label.material);

      nodeParts.set(node.id, { box: mesh, dot, label });
    }

    for (const band of picture.laid.bands) {
      const curve = new THREE.CatmullRomCurve3(
        band.points.map((point) => new THREE.Vector3(point.x, point.y, point.z)),
      );
      const radius = Math.max(band.width * SLAB_SCALE * 0.22, 0.11);
      const geo = new THREE.TubeGeometry(curve, 32, radius, 6, false);
      const material = new THREE.MeshBasicMaterial({
        color: cssColor(semanticColor(band.edge.direction)),
        transparent: true,
        opacity: bandOpacity(band.edge, selectionRef.current, focusRef.current, focusRootRef.current),
      });
      const mesh = new THREE.Mesh(geo, material);
      mesh.userData = { kind: 'band', index: band.edge.graphIndex, edge: band.edge };
      root.add(mesh);
      disposables.push(geo, material);
    }

    const paint = () => {
      const current = selectionRef.current;
      const focus = focusRef.current;
      const rootFocus = focusRootRef.current;
      root.traverse((object) => {
        const data = object.userData as { kind?: string; id?: string; edge?: FlowEdgeInput };
        if (data.kind === 'band' && object instanceof THREE.Mesh && data.edge) {
          const material = object.material;
          if (material instanceof THREE.MeshBasicMaterial) {
            material.opacity = bandOpacity(data.edge, current, focus, rootFocus);
          }
        }
      });
      for (const [id, parts] of nodeParts) {
        const selected = current?.kind === 'node' && current.id === id;
        const bright = focus == null || focus.has(id) || selected;
        (parts.box.material as THREE.MeshBasicMaterial).color.set(
          cssColor(selected ? canvasStage.nodeStrokeSelected : canvasStage.columnPlate),
        );
        (parts.box.material as THREE.MeshBasicMaterial).opacity = bright ? 1 : FLOW_DIM_NODE;
        (parts.dot.material as THREE.MeshBasicMaterial).opacity = bright ? 1 : FLOW_DIM_NODE;
        parts.label.material.opacity = bright ? 1 : FLOW_DIM_LABEL;
      }
    };
    paintRef.current = paint;
    paint();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let drag: { x: number; y: number; moved: boolean } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, moved: false };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!drag) return;
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 4) drag.moved = true;
    };
    const pick = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(root.children, false);
      return hits.find((hit) => {
        const kind = (hit.object.userData as { kind?: string }).kind;
        return kind === 'node' || kind === 'band';
      });
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!drag || event.button !== 0) {
        drag = null;
        return;
      }
      const moved = drag.moved;
      drag = null;
      if (moved) return;
      const hit = pick(event);
      const data = hit?.object.userData as { kind?: string; id?: string; index?: number } | undefined;
      if (data?.kind === 'node' && data.id) {
        if (
          !nodeIsInteractable(data.id, lockedRef.current, selectionRef.current, links, focusRef.current)
        ) {
          return;
        }
        selectNodeRef.current(data.id);
      } else if (data?.kind === 'band' && data.index != null) {
        const edge = links[data.index];
        if (
          !edge ||
          !linkIsInteractable(
            edge,
            data.index,
            lockedRef.current,
            selectionRef.current,
            focusRef.current,
            focusRootRef.current,
          )
        ) {
          return;
        }
        selectLinkRef.current(data.index);
      } else backgroundRef.current();
    };
    const onDoubleClick = (event: MouseEvent) => {
      const hit = pick(event as unknown as PointerEvent);
      if (hit) return;
      if (homeRef.current) applyHome(camera, controls, homeRef.current);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('dblclick', onDoubleClick);

    let frame = 0;
    const loop = () => {
      frame = window.requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      window.cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('dblclick', onDoubleClick);
      controls.dispose();
      for (const item of disposables) {
        if (item instanceof THREE.Material && item.map) item.map.dispose();
        item.dispose();
      }
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [canvasStage, height, picture, width]);

  useEffect(() => {
    paintRef.current();
  }, [focusKey, selectionKey]);

  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const home = slabCameraHome(picture.laid, width, height, focusIds, insets);
    homeRef.current = home;
    applyHome(camera, controls, home);
  }, [focusKey, height, insets, picture, width]);

  const empty = picture.laid.bands.length === 0;

  return (
    <div className="flow-slab" data-testid="flow-slab" data-bands={picture.picked.bands.length}>
      <div ref={hostRef} className="flow-slab-host" />
      {empty && (
        <p className="slab-empty" data-testid="flow-empty" style={{ color: canvasStage.columnText }}>
          这条筛选没有跨列通路
        </p>
      )}
      <div className="slab-sr">
        <p>拖动可小幅转动列板，滚轮缩放，双击空白回到正面。</p>
        {picture.laid.nodes.map((node) => (
          <button key={node.id} type="button" onClick={() => onSelectNode(node.id)}>
            {node.label}
          </button>
        ))}
      </div>
    </div>
  );
}
