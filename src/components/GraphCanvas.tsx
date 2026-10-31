import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D, { type ForceGraphMethods } from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { linkIsFocused } from '../lib/focus';
import { directionLabel, evidenceLabel, nodeTypeLabel } from '../lib/copy';
import {
  COLUMN_Y_GAP,
  LABEL_HOME_COLUMN,
  applyLayout,
  cameraDistanceForPixels,
  columnIndex,
  framingDistance,
  linkDegrees,
  type LayoutMode,
} from '../lib/layout';
import { labelShouldShow, labelTextHeight, nodeScale, shapeKindForType } from '../lib/nodeStyle';
import { colorWithAlpha, linkWidthForStrength, semanticColor } from '../lib/palette';
import { visibleNodeIds } from '../lib/visibility';
import type { GraphData, Selection, SimLink, SimNode, ViewLayer } from '../types/graph';
import { geometryFor } from './nodeGeometry';

const LABEL_FONT =
  '"WenQuanYi Micro Hei", "Droid Sans Fallback", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';

const IDLE_RESUME_MS = 12_000;
const LINK_WIDTH_SCALE = 1.45;

type DrawLink = SimLink & { graphIndex: number };
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

interface GraphCanvasProps {
  graph: GraphData;
  focusIds: ReadonlySet<string> | null;
  selection: Selection | null;
  layer: ViewLayer;
  layout: LayoutMode;
  hideUnmatched: boolean;
  compact: boolean;
  autoRotate: boolean;
  anchorId: string | null;
  onSelectNode: (id: string) => void;
  onSelectLink: (index: number) => void;
  onBackground: () => void;
}

function controlsOf(api: GraphApi): OrbitControlsLike {
  return api.controls() as OrbitControlsLike;
}

function endpointNode(endpoint: string | SimNode, nodes: SimNode[]): SimNode | undefined {
  if (typeof endpoint !== 'string') return endpoint;
  return nodes.find((node) => node.id === endpoint);
}

function flyTo(api: GraphApi, x: number, y: number, z: number) {
  const hypot = Math.hypot(x, y, z);
  const distance = 180;
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

export function GraphCanvas({
  graph,
  focusIds,
  selection,
  layer,
  layout,
  hideUnmatched,
  compact,
  autoRotate,
  anchorId,
  onSelectNode,
  onSelectLink,
  onBackground,
}: GraphCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<GraphApi | undefined>(undefined);
  const visuals = useRef(new Map<string, NodeVisual>());
  const idleTimer = useRef<number | null>(null);
  const fitToken = useRef(0);
  const framedKey = useRef('');
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hold, setHold] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [coarse, setCoarse] = useState(false);

  const layerRef = useRef(layer);
  const selectionRef = useRef(selection);
  const compactRef = useRef(compact);
  const layoutRef = useRef(layout);
  const focusRef = useRef(focusIds);
  const brightNodeRef = useRef<(id: string) => boolean>(() => true);
  const paintNodeRef = useRef<(id: string) => void>(() => {});
  const degreeRef = useRef(new Map<string, number>());
  const nodeByIdRef = useRef(new Map<string, SimNode>());
  layerRef.current = layer;
  selectionRef.current = selection;
  compactRef.current = compact;
  layoutRef.current = layout;
  focusRef.current = focusIds;

  const degrees = useMemo(() => linkDegrees(graph.links), [graph]);
  degreeRef.current = degrees;

  const pinKey = useMemo(() => {
    if (!hideUnmatched || focusIds == null || !selection) return '';
    if (selection.kind === 'node') return selection.id;
    const link = graph.links[selection.index];
    return link ? `${link.source}|${link.target}` : '';
  }, [focusIds, graph.links, hideUnmatched, selection]);

  const visibleKey = useMemo(() => {
    const pinned = new Set(pinKey ? pinKey.split('|').filter(Boolean) : []);
    const ids = visibleNodeIds(
      graph.nodes.map((node) => node.id),
      focusIds,
      hideUnmatched,
      pinned,
    );
    return [...ids].sort().join('|');
  }, [focusIds, graph.nodes, hideUnmatched, pinKey]);

  const simData = useMemo(() => {
    const ids = new Set(visibleKey ? visibleKey.split('|') : []);
    const nodes: SimNode[] = graph.nodes.filter((node) => ids.has(node.id)).map((node) => ({ ...node }));
    applyLayout(nodes, layout);
    const links: DrawLink[] = graph.links
      .map((link, index) => ({ ...link, graphIndex: index }))
      .filter((link) => ids.has(link.source) && ids.has(link.target));
    return { nodes, links };
  }, [graph, layout, visibleKey]);

  nodeByIdRef.current = new Map(simData.nodes.map((node) => [node.id, node]));

  const framedNode = useMemo(() => {
    if (anchorId) {
      const chosen = simData.nodes.find((node) => node.id === anchorId);
      if (chosen) return chosen;
    }
    const column = simData.nodes.filter((node) => columnIndex(node.type) === LABEL_HOME_COLUMN);
    column.sort((a, b) => (b.y ?? 0) - (a.y ?? 0));
    return column[Math.floor(column.length / 2)] ?? simData.nodes[0];
  }, [anchorId, simData.nodes]);
  const homeColumn = framedNode && anchorId ? columnIndex(framedNode.type) : LABEL_HOME_COLUMN;

  const brightNode = useCallback(
    (id: string) => {
      if (selection?.kind === 'node' && selection.id === id) return true;
      if (selection?.kind === 'link') {
        const link = graph.links[selection.index];
        if (link && (link.source === id || link.target === id)) return true;
      }
      if (focusIds == null) return true;
      return focusIds.has(id);
    },
    [focusIds, graph.links, selection],
  );
  brightNodeRef.current = brightNode;

  const selectedNode = useCallback(
    (id: string) => {
      if (selection?.kind === 'node') return selection.id === id;
      if (selection?.kind === 'link') {
        const link = graph.links[selection.index];
        return Boolean(link && (link.source === id || link.target === id));
      }
      return false;
    },
    [graph.links, selection],
  );

  const brightLink = useCallback(
    (link: { source: string; target: string }, index: number) => {
      if (selection?.kind === 'link' && selection.index === index) return true;
      return linkIsFocused(link, focusIds);
    },
    [focusIds, selection],
  );

  const paintNode = useCallback(
    (id: string) => {
      const visual = visuals.current.get(id);
      const node = nodeByIdRef.current.get(id);
      if (!visual || !node) return;
      const bright = brightNodeRef.current(id);
      const selected = selectedNode(id);
      const expert = layer === 'expert';
      const scale = nodeScale(degreeRef.current.get(id) ?? 0, node.type, selected);
      visual.mesh.scale.setScalar(scale);
      const color = semanticColor(node.group);
      visual.material.color.set(color);
      visual.material.emissive.set(color);
      visual.material.opacity = bright ? 0.96 : 0.16;
      visual.material.emissiveIntensity = selected ? 0.48 : bright ? 0.18 : 0.04;
      const height = labelTextHeight(selected, bright);
      const text = expert ? `${node.label}\n${node.type}` : node.label;
      const lines = expert ? 2 : 1;
      const focusY = framedNode?.y ?? node.y ?? 0;
      const show = labelShouldShow({
        compact,
        bright,
        selected,
        column: columnIndex(node.type),
        homeColumn,
        nodeY: node.y,
        focusY,
        above: COLUMN_Y_GAP * 2.2,
        below: COLUMN_Y_GAP * 1.15,
      });
      visual.sprite.visible = show;
      visual.sprite.textHeight = height;
      visual.sprite.text = text;
      visual.sprite.material.opacity = bright ? 1 : 0.32;
      const worldHeight = height * lines + 0.7;
      visual.sprite.position.y = scale * 1.05 + worldHeight * 0.5 + 0.35;
    },
    [compact, framedNode, homeColumn, layer, selectedNode],
  );
  paintNodeRef.current = paintNode;

  const paintAll = useCallback(() => {
    const live = new Set(simData.nodes.map((node) => node.id));
    for (const id of visuals.current.keys()) {
      if (!live.has(id)) {
        const visual = visuals.current.get(id);
        if (visual) disposeVisual(visual);
        visuals.current.delete(id);
      }
    }
    for (const id of live) paintNode(id);
  }, [brightNode, paintNode, simData.nodes]);

  useEffect(() => {
    paintAll();
    const frame = requestAnimationFrame(paintAll);
    return () => cancelAnimationFrame(frame);
  }, [paintAll]);

  const nodeThreeObject = useCallback((node: SimNode) => {
    const group = new THREE.Group();
    const material = new THREE.MeshLambertMaterial({
      color: semanticColor(node.group),
      emissive: semanticColor(node.group),
      emissiveIntensity: 0.18,
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
    sprite.backgroundColor = 'rgba(8, 12, 18, 0.84)';
    sprite.padding = 0.32;
    sprite.borderRadius = 0.4;
    sprite.strokeWidth = 0.62;
    sprite.strokeColor = '#061018';
    sprite.fontFace = LABEL_FONT;
    sprite.fontSize = 120;
    sprite.fontWeight = '600';
    sprite.textHeight = labelTextHeight(false, true);
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

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setWebgl(false);
    } catch {
      setWebgl(false);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)');
    const update = () => setCoarse(media.matches || navigator.maxTouchPoints > 0);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const pauseTemporarily = useCallback(() => {
    setHold(true);
    if (idleTimer.current != null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setHold(false), IDLE_RESUME_MS);
  }, []);

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
      controls = controlsOf(api);
      controls.autoRotateSpeed = 0.45;
      controls.addEventListener('start', onStart);
      controls.addEventListener('end', onStart);
    };
    bind();
    return () => {
      disposed = true;
      controls?.removeEventListener('start', onStart);
      controls?.removeEventListener('end', onStart);
    };
  }, [pauseTemporarily, size.w, size.h, webgl, simData]);

  useEffect(() => {
    const api = fgRef.current;
    if (!api) return;
    const controls = controlsOf(api);
    controls.autoRotate = autoRotate && !hold;
    controls.autoRotateSpeed = 0.45;
  }, [autoRotate, hold, size.w, size.h, simData]);

  useEffect(() => {
    return () => {
      if (idleTimer.current != null) window.clearTimeout(idleTimer.current);
    };
  }, []);

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
      if (layout === 'force') {
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
  }, [layout, simData]);

  const frameKey = `${layout}|${compact ? 'compact' : 'full'}|${size.w}x${size.h}|${visibleKey}|${anchorId ?? ''}`;

  useEffect(() => {
    if (simData.nodes.length === 0 || size.w === 0 || size.h === 0) return;
    if (!compact && layout === 'force') return;
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
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duration = reduce ? 0 : 680;
      if (compact) {
        const target = framedNode;
        if (!target || target.x == null || target.y == null) return;
        const distance = cameraDistanceForPixels(size.h, 4) * 1.06;
        const lift = -size.h * 0.045;
        api.cameraPosition(
          { x: target.x, y: target.y - lift + 6, z: distance },
          { x: target.x, y: target.y - lift, z: target.z ?? 0 },
          duration,
        );
        return;
      }
      const shot = framingDistance(simData.nodes, size.w, size.h);
      api.cameraPosition({ x: shot.x, y: shot.y, z: shot.z }, { x: shot.x, y: shot.y, z: 0 }, duration);
      framedKey.current = frameKey;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      fitToken.current += 1;
      cancelAnimationFrame(raf);
    };
  }, [anchorId, compact, frameKey, framedNode, layout, simData, size.h, size.w]);

  const selectionKey =
    selection == null ? '' : selection.kind === 'node' ? `node:${selection.id}` : `link:${selection.index}`;

  useEffect(() => {
    if (!selectionKey || compact) return;
    pauseTemporarily();
    let frame = 0;
    let tries = 0;
    const go = () => {
      const api = fgRef.current;
      const current = selectionRef.current;
      if (!api || !current) return;
      if (current.kind === 'node') {
        const node = simData.nodes.find((item) => item.id === current.id);
        if (!node || node.x == null || node.y == null || node.z == null) {
          if (tries++ < 40) frame = requestAnimationFrame(go);
          return;
        }
        flyTo(api, node.x, node.y, node.z);
        return;
      }
      const link = simData.links.find((item) => item.graphIndex === current.index);
      if (!link) return;
      const source = endpointNode(link.source, simData.nodes);
      const target = endpointNode(link.target, simData.nodes);
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
  }, [compact, pauseTemporarily, selectionKey, simData.links, simData.nodes]);

  const nodeLabel = useCallback((node: SimNode) => {
    if (layerRef.current === 'expert') {
      return `${node.label}\n${nodeTypeLabel(node.type)} · ${node.type}\n分组 ${node.group}`;
    }
    return node.label;
  }, []);

  const linkLabel = useCallback((link: DrawLink) => {
    if (layerRef.current === 'expert') {
      return `${link.relation}\n${directionLabel(link.direction)} · ${link.direction}\n${evidenceLabel(link.evidence_type)}`;
    }
    return link.relation;
  }, []);

  if (!webgl) {
    return (
      <div className="banner banner--error" role="alert">
        <p>当前环境无法创建 WebGL 画布，三维图谱不能显示。</p>
      </div>
    );
  }

  return (
    <div className="canvas-wrap" ref={wrapRef} data-testid="graph-canvas" data-layout={layout} data-frame="columns">
      {size.w > 0 && size.h > 0 && simData.nodes.length > 0 && (
        <ForceGraph3D
          ref={fgRef}
          graphData={simData}
          width={size.w}
          height={size.h}
          backgroundColor="#0c1016"
          showNavInfo={false}
          enableNodeDrag={layout === 'force'}
          nodeRelSize={4}
          nodeResolution={8}
          nodeVal={1}
          nodeOpacity={1}
          nodeLabel={(node) => nodeLabel(node as SimNode)}
          nodeThreeObject={(node) => nodeThreeObject(node as SimNode)}
          nodeThreeObjectExtend={false}
          linkColor={(link) => {
            const typed = link as DrawLink;
            const color = semanticColor(typed.direction);
            const canonical = graph.links[typed.graphIndex];
            const bright = canonical ? brightLink(canonical, typed.graphIndex) : false;
            return bright ? color : colorWithAlpha(color, 0.16);
          }}
          linkWidth={(link) => {
            const typed = link as DrawLink;
            const base = linkWidthForStrength(typed.strength) * LINK_WIDTH_SCALE;
            return selection?.kind === 'link' && selection.index === typed.graphIndex ? base + 1.4 : base;
          }}
          linkOpacity={0.92}
          linkLabel={(link) => linkLabel(link as DrawLink)}
          linkDirectionalParticles={(link) => {
            if (coarse) return 0;
            const typed = link as DrawLink;
            const canonical = graph.links[typed.graphIndex];
            return canonical && brightLink(canonical, typed.graphIndex) ? 2 : 0;
          }}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={0.006}
          onNodeClick={(node) => onSelectNode((node as SimNode).id)}
          onLinkClick={(link) => onSelectLink((link as DrawLink).graphIndex)}
          onBackgroundClick={onBackground}
          onEngineStop={() => {
            if (layoutRef.current !== 'force' || compactRef.current) return;
            if (framedKey.current === frameKey) return;
            framedKey.current = frameKey;
            fgRef.current?.zoomToFit(600, 64);
          }}
          warmupTicks={layout === 'hierarchy' ? 0 : 24}
          cooldownTicks={layout === 'hierarchy' ? 1 : 140}
        />
      )}
    </div>
  );
}
