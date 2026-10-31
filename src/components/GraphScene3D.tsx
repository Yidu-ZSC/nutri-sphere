import { useCallback, useEffect, useRef, useState } from 'react';
import ForceGraph3D, { type ForceGraphMethods } from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { directionLabel, evidenceLabel, nodeTypeLabel } from '../lib/copy';
import { LABEL_FONT } from '../lib/labelText';
import {
  COLUMN_Y_GAP,
  EXPLORE_FOV,
  cameraDistanceForPixels,
  columnIndex,
  framingDistance,
} from '../lib/layout';
import { LINK_OPACITY_3D, LINK_PARTICLE_WIDTH_3D, particleCount, styledLinkWidth } from '../lib/linkStyle';
import { labelShouldShow, labelTextHeight, nodeScale, shapeKindForType } from '../lib/nodeStyle';
import { colorWithAlpha, semanticColor } from '../lib/palette';
import type { SimNode } from '../types/graph';
import { geometryFor } from './nodeGeometry';
import { linkIsBright, nodeIsBright, nodeIsSelected, type DrawLink, type SceneCommonProps } from './graphShared';

const IDLE_RESUME_MS = 12_000;

type GraphApi = ForceGraphMethods<SimNode, DrawLink>;

interface OrbitControlsLike {
  autoRotate: boolean;
  autoRotateSpeed: number;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

interface NodeVisual {
  mesh: THREE.Mesh;
  material: THREE.MeshLambertMaterial;
  sprite: SpriteText;
}

interface GraphScene3DProps extends SceneCommonProps {
  autoRotate: boolean;
}

function controlsOf(api: GraphApi): OrbitControlsLike {
  return api.controls() as OrbitControlsLike;
}

function endpointNode(endpoint: string | SimNode, nodes: SimNode[]): SimNode | undefined {
  if (typeof endpoint !== 'string') return endpoint;
  return nodes.find((node) => node.id === endpoint);
}

function flyTo(api: GraphApi, x: number, y: number, z: number) {
  const distance = 280;
  const hypot = Math.hypot(x, y, z);
  if (hypot < 1) {
    api.cameraPosition({ x: distance, y: distance * 0.35, z: distance }, { x, y, z }, 900);
    return;
  }
  const ratio = (hypot + distance) / hypot;
  api.cameraPosition({ x: x * ratio, y: y * ratio, z: z * ratio }, { x, y, z }, 900);
}

function disposeVisual(visual: NodeVisual) {
  visual.material.dispose();
  visual.sprite.material.map?.dispose();
  visual.sprite.material.dispose();
}

function flattenCamera(api: GraphApi) {
  const camera = api.camera() as {
    fov?: number;
    updateProjectionMatrix?: () => void;
  };
  if (typeof camera.fov !== 'number' || typeof camera.updateProjectionMatrix !== 'function') return;
  if (camera.fov === EXPLORE_FOV) return;
  camera.fov = EXPLORE_FOV;
  camera.updateProjectionMatrix();
}

export function GraphScene3D(props: GraphScene3DProps) {
  const fgRef = useRef<GraphApi | undefined>(undefined);
  const visuals = useRef(new Map<string, NodeVisual>());
  const idleTimer = useRef<number | null>(null);
  const fitToken = useRef(0);
  const framedKey = useRef('');
  const [hold, setHold] = useState(false);

  const layerRef = useRef(props.layer);
  const selectionRef = useRef(props.selection);
  const compactRef = useRef(props.compact);
  const layoutRef = useRef(props.layout);
  const focusRef = useRef(props.focusIds);
  const brightNodeRef = useRef<(id: string) => boolean>(() => true);
  const paintNodeRef = useRef<(id: string) => void>(() => {});
  const degreeRef = useRef(props.degrees);
  const nodeByIdRef = useRef(new Map<string, SimNode>());
  layerRef.current = props.layer;
  selectionRef.current = props.selection;
  compactRef.current = props.compact;
  layoutRef.current = props.layout;
  focusRef.current = props.focusIds;
  degreeRef.current = props.degrees;
  nodeByIdRef.current = new Map(props.nodes.map((node) => [node.id, node]));

  const brightNode = useCallback(
    (id: string) => nodeIsBright(id, props.selection, props.graph.links, props.focusIds),
    [props.focusIds, props.graph.links, props.selection],
  );
  brightNodeRef.current = brightNode;

  const selectedNode = useCallback(
    (id: string) => nodeIsSelected(id, props.selection, props.graph.links),
    [props.graph.links, props.selection],
  );

  const paintNode = useCallback(
    (id: string) => {
      const visual = visuals.current.get(id);
      const node = nodeByIdRef.current.get(id);
      if (!visual || !node) return;
      const bright = brightNodeRef.current(id);
      const selected = selectedNode(id);
      const expert = props.layer === 'expert';
      const scale = nodeScale(degreeRef.current.get(id) ?? 0, node.type, selected);
      visual.mesh.scale.setScalar(scale);
      const color = semanticColor(node.group);
      visual.material.color.set(color);
      visual.material.emissive.set(color);
      visual.material.opacity = bright ? 0.96 : 0.16;
      visual.material.emissiveIntensity = selected ? 0.42 : bright ? 0.12 : 0.03;
      const height = labelTextHeight(selected, bright) * 0.92;
      const text = expert ? `${node.label}\n${node.type}` : node.label;
      const lines = expert ? 2 : 1;
      const focusY = props.framedNode?.layoutY ?? props.framedNode?.y;
      const show = labelShouldShow({
        compact: props.compact,
        bright,
        selected,
        column: columnIndex(node.type),
        homeColumn: props.homeColumn,
        nodeY: node.layoutY ?? node.y,
        focusY,
        above: COLUMN_Y_GAP * 2.2,
        below: COLUMN_Y_GAP * 1.15,
        surface: '3d',
      });
      visual.sprite.visible = show;
      visual.sprite.textHeight = height;
      visual.sprite.text = text;
      visual.sprite.material.opacity = bright ? 1 : 0.45;
      const worldHeight = height * lines + 0.7;
      visual.sprite.position.y = scale * 1.05 + worldHeight * 0.5 + 0.35;
    },
    [props.compact, props.framedNode, props.homeColumn, props.layer, selectedNode],
  );
  paintNodeRef.current = paintNode;

  const paintAll = useCallback(() => {
    const live = new Set(props.nodes.map((node) => node.id));
    for (const id of visuals.current.keys()) {
      if (!live.has(id)) {
        const visual = visuals.current.get(id);
        if (visual) disposeVisual(visual);
        visuals.current.delete(id);
      }
    }
    for (const id of live) paintNode(id);
  }, [brightNode, paintNode, props.nodes]);

  useEffect(() => {
    paintAll();
    const frame = requestAnimationFrame(paintAll);
    return () => cancelAnimationFrame(frame);
  }, [paintAll]);

  useEffect(() => {
    return () => {
      for (const visual of visuals.current.values()) disposeVisual(visual);
      visuals.current.clear();
      if (idleTimer.current != null) window.clearTimeout(idleTimer.current);
    };
  }, []);

  const nodeThreeObject = useCallback((node: SimNode) => {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({
      color: semanticColor(node.group),
      emissive: semanticColor(node.group),
      emissiveIntensity: 0.12,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometryFor(shapeKindForType(node.type)), material);
    mesh.frustumCulled = false;
    group.add(mesh);

    const expert = layerRef.current === 'expert';
    const sprite = new SpriteText(expert ? `${node.label}\n${node.type}` : node.label);
    sprite.color = '#f4f7fb';
    sprite.backgroundColor = 'rgba(8, 12, 18, 0.9)';
    sprite.padding = 0.55;
    sprite.borderRadius = 0.55;
    sprite.strokeWidth = 0.7;
    sprite.strokeColor = '#061018';
    sprite.fontFace = LABEL_FONT;
    sprite.fontSize = 96;
    sprite.fontWeight = '600';
    sprite.textHeight = labelTextHeight(false, true) * 0.92;
    sprite.material.transparent = true;
    sprite.material.depthWrite = false;
    sprite.material.depthTest = false;
    sprite.frustumCulled = false;
    sprite.center.set(0.5, 0.5);
    group.add(sprite);

    const previous = visuals.current.get(node.id);
    if (previous) disposeVisual(previous);
    visuals.current.set(node.id, { mesh, material, sprite });
    queueMicrotask(() => paintNodeRef.current(node.id));
    return group;
  }, []);

  const pauseTemporarily = useCallback(() => {
    setHold(true);
    if (idleTimer.current != null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setHold(false), IDLE_RESUME_MS);
  }, [setHold]);

  useEffect(() => {
    let disposed = false;
    let controls: OrbitControlsLike | null = null;
    const onStart = () => pauseTemporarily();
    const bind = () => {
      if (disposed) return;
      const api = fgRef.current;
      if (!api) {
        requestAnimationFrame(bind);
        return;
      }
      flattenCamera(api);
      controls = controlsOf(api);
      controls.autoRotateSpeed = 0.35;
      controls.addEventListener('start', onStart);
      controls.addEventListener('end', onStart);
    };
    bind();
    return () => {
      disposed = true;
      controls?.removeEventListener('start', onStart);
      controls?.removeEventListener('end', onStart);
    };
  }, [pauseTemporarily, props.nodes, props.size.h, props.size.w]);

  useEffect(() => {
    const api = fgRef.current;
    if (!api) return;
    const controls = controlsOf(api);
    controls.autoRotate = props.autoRotate && !hold;
    controls.autoRotateSpeed = 0.35;
  }, [props.autoRotate, hold, props.nodes, props.size.h, props.size.w]);

  useEffect(() => {
    let frame = 0;
    let cancelled = false;
    const tune = () => {
      if (cancelled) return;
      const api = fgRef.current;
      if (!api) {
        frame = requestAnimationFrame(tune);
        return;
      }
      const charge = api.d3Force('charge');
      const link = api.d3Force('link');
      if (props.layout === 'force') {
        charge?.strength?.(-180);
        link?.distance?.(56);
      } else {
        charge?.strength?.(-8);
        link?.distance?.(36);
      }
    };
    tune();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [props.layout, props.nodes, props.links]);

  const frameKey = `${props.layout}|${props.compact ? 'compact' : 'full'}|${props.size.w}x${props.size.h}|${props.visibleKey}|${props.anchorId ?? ''}`;

  useEffect(() => {
    if (props.nodes.length === 0 || props.size.w === 0 || props.size.h === 0) return;
    if (!props.compact && props.layout === 'force') return;
    const token = ++fitToken.current;
    let attempts = 0;
    let raf = 0;
    const tick = () => {
      if (fitToken.current !== token) return;
      const api = fgRef.current;
      if (!api) {
        if (attempts++ < 40) raf = requestAnimationFrame(tick);
        return;
      }
      flattenCamera(api);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duration = reduce ? 0 : 680;
      if (props.compact) {
        const target = props.framedNode;
        if (!target || target.x == null || target.y == null) return;
        const distance = cameraDistanceForPixels(props.size.h, 4, EXPLORE_FOV) * 1.06;
        const lift = -props.size.h * 0.045;
        api.cameraPosition(
          { x: target.x, y: target.y - lift + 6, z: distance },
          { x: target.x, y: target.y - lift, z: target.z ?? 0 },
          duration,
        );
        return;
      }
      const shot = framingDistance(props.nodes, props.size.w, props.size.h, EXPLORE_FOV);
      api.cameraPosition({ x: shot.x, y: shot.y, z: shot.z }, { x: shot.x, y: shot.y, z: 0 }, duration);
      framedKey.current = frameKey;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      fitToken.current += 1;
      cancelAnimationFrame(raf);
    };
  }, [frameKey, props.compact, props.framedNode, props.layout, props.nodes, props.size.h, props.size.w]);

  const selectionKey =
    props.selection == null
      ? ''
      : props.selection.kind === 'node'
        ? `node:${props.selection.id}`
        : `link:${props.selection.index}`;

  useEffect(() => {
    if (!selectionKey || props.compact) return;
    pauseTemporarily();
    let frame = 0;
    let tries = 0;
    const go = () => {
      const api = fgRef.current;
      const current = selectionRef.current;
      if (!api || !current) return;
      if (current.kind === 'node') {
        const node = props.nodes.find((item) => item.id === current.id);
        if (!node || node.x == null || node.y == null || node.z == null) {
          if (tries++ < 40) frame = requestAnimationFrame(go);
          return;
        }
        flyTo(api, node.x, node.y, node.z);
        return;
      }
      const link = props.links.find((item) => item.graphIndex === current.index);
      if (!link) return;
      const source = endpointNode(link.source, props.nodes);
      const target = endpointNode(link.target, props.nodes);
      if (
        !source ||
        !target ||
        source.x == null ||
        source.y == null ||
        source.z == null ||
        target.x == null ||
        target.y == null ||
        target.z == null
      ) {
        if (tries++ < 40) frame = requestAnimationFrame(go);
        return;
      }
      flyTo(api, (source.x + target.x) / 2, (source.y + target.y) / 2, (source.z + target.z) / 2);
    };
    frame = requestAnimationFrame(go);
    return () => cancelAnimationFrame(frame);
  }, [pauseTemporarily, props.compact, props.links, props.nodes, selectionKey]);

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={{ nodes: props.nodes, links: props.links }}
      width={props.size.w}
      height={props.size.h}
      backgroundColor="#0c1016"
      showNavInfo={false}
      enableNodeDrag={props.layout === 'force'}
      nodeRelSize={4}
      nodeResolution={8}
      nodeVal={1}
      nodeOpacity={1}
      nodeLabel={(node) => {
        const typed = node as SimNode;
        if (layerRef.current === 'expert') {
          return `${typed.label}\n${nodeTypeLabel(typed.type)} · ${typed.type}\n分组 ${typed.group}`;
        }
        return typed.label;
      }}
      nodeThreeObject={(node) => nodeThreeObject(node as SimNode)}
      nodeThreeObjectExtend={false}
      linkColor={(link) => {
        const typed = link as DrawLink;
        const color = semanticColor(typed.direction);
        const canonical = props.graph.links[typed.graphIndex];
        const bright = canonical ? linkIsBright(canonical, typed.graphIndex, props.selection, props.focusIds) : false;
        return bright ? color : colorWithAlpha(color, 0.2);
      }}
      linkWidth={(link) => {
        const typed = link as DrawLink;
        const selected = props.selection?.kind === 'link' && props.selection.index === typed.graphIndex;
        return styledLinkWidth(typed.strength, '3d', selected);
      }}
      linkOpacity={LINK_OPACITY_3D}
      linkLabel={(link) => {
        const typed = link as DrawLink;
        if (layerRef.current === 'expert') {
          return `${typed.relation}\n${directionLabel(typed.direction)} · ${typed.direction}\n${evidenceLabel(typed.evidence_type)}`;
        }
        return typed.relation;
      }}
      linkDirectionalParticles={(link) => {
        const typed = link as DrawLink;
        const canonical = props.graph.links[typed.graphIndex];
        return particleCount({
          coarse: props.coarse,
          selected: props.selection?.kind === 'link' && props.selection.index === typed.graphIndex,
          focused: canonical ? linkIsBright(canonical, typed.graphIndex, null, props.focusIds) : false,
          filtered: props.focusIds != null,
        });
      }}
      linkDirectionalParticleWidth={LINK_PARTICLE_WIDTH_3D}
      linkDirectionalParticleSpeed={0.006}
      onNodeClick={(node) => props.onSelectNode((node as SimNode).id)}
      onLinkClick={(link) => props.onSelectLink((link as DrawLink).graphIndex)}
      onBackgroundClick={props.onBackground}
      onEngineStop={() => {
        if (layoutRef.current !== 'force' || compactRef.current) return;
        if (framedKey.current === frameKey) return;
        framedKey.current = frameKey;
        fgRef.current?.zoomToFit(600, 64);
      }}
      warmupTicks={props.layout === 'hierarchy' ? 0 : 24}
      cooldownTicks={props.layout === 'hierarchy' ? 1 : 140}
    />
  );
}
