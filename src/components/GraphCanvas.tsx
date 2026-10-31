import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph3D, { type ForceGraphMethods } from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import { linkIsFocused } from '../lib/focus';
import { directionLabel, evidenceLabel, nodeTypeLabel } from '../lib/copy';
import { colorWithAlpha, linkWidthForStrength, semanticColor } from '../lib/palette';
import type { GraphData, Selection, SimLink, SimNode, ViewLayer } from '../types/graph';

const LABEL_FONT =
  '"WenQuanYi Micro Hei", "Droid Sans Fallback", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';

const IDLE_RESUME_MS = 12_000;

type GraphApi = ForceGraphMethods<SimNode, SimLink>;

interface OrbitControlsLike {
  autoRotate: boolean;
  autoRotateSpeed: number;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
}

function controlsOf(api: GraphApi): OrbitControlsLike {
  return api.controls() as OrbitControlsLike;
}

interface GraphCanvasProps {
  graph: GraphData;
  focusIds: ReadonlySet<string> | null;
  selection: Selection | null;
  layer: ViewLayer;
  autoRotate: boolean;
  onSelectNode: (id: string) => void;
  onSelectLink: (index: number) => void;
  onBackground: () => void;
}

function endpointNode(endpoint: string | SimNode, nodes: SimNode[]): SimNode | undefined {
  if (typeof endpoint !== 'string') return endpoint;
  return nodes.find((node) => node.id === endpoint);
}

function flyTo(api: GraphApi, x: number, y: number, z: number) {
  const hypot = Math.hypot(x, y, z);
  const distance = 220;
  if (hypot < 1) {
    api.cameraPosition({ x: distance, y: distance * 0.35, z: distance }, { x, y, z }, 900);
    return;
  }
  const ratio = (hypot + distance) / hypot;
  api.cameraPosition({ x: x * ratio, y: y * ratio, z: z * ratio }, { x, y, z }, 900);
}

export function GraphCanvas({
  graph,
  focusIds,
  selection,
  layer,
  autoRotate,
  onSelectNode,
  onSelectLink,
  onBackground,
}: GraphCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<GraphApi | undefined>(undefined);
  const sprites = useRef(new Map<string, SpriteText>());
  const idleTimer = useRef<number | null>(null);
  const fitted = useRef(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hold, setHold] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [coarse, setCoarse] = useState(false);

  const layerRef = useRef(layer);
  const selectionRef = useRef(selection);
  const brightNodeRef = useRef<(id: string) => boolean>(() => true);
  layerRef.current = layer;
  selectionRef.current = selection;

  const simData = useMemo((): { nodes: SimNode[]; links: SimLink[] } => {
    return {
      nodes: graph.nodes.map((node) => ({ ...node })),
      links: graph.links.map((link) => ({ ...link })),
    };
  }, [graph]);

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

  const brightLink = useCallback(
    (link: { source: string; target: string }, index: number) => {
      if (selection?.kind === 'link' && selection.index === index) return true;
      return linkIsFocused(link, focusIds);
    },
    [focusIds, selection],
  );

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

  useEffect(() => {
    sprites.current.clear();
    fitted.current = false;
  }, [simData]);

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
      controls.autoRotateSpeed = 0.5;
      controls.addEventListener('start', onStart);
      controls.addEventListener('end', onStart);
    };
    bind();
    return () => {
      disposed = true;
      controls?.removeEventListener('start', onStart);
      controls?.removeEventListener('end', onStart);
    };
  }, [pauseTemporarily, size.w, size.h, webgl]);

  useEffect(() => {
    const api = fgRef.current;
    if (!api) return;
    const controls = controlsOf(api);
    controls.autoRotate = autoRotate && !hold;
    controls.autoRotateSpeed = 0.5;
  }, [autoRotate, hold, size.w, size.h]);

  useEffect(() => {
    return () => {
      if (idleTimer.current != null) window.clearTimeout(idleTimer.current);
    };
  }, []);

  const selectionKey =
    selection == null ? '' : selection.kind === 'node' ? `node:${selection.id}` : `link:${selection.index}`;

  useEffect(() => {
    if (!selectionKey) return;
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
      const link = simData.links[current.index];
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
  }, [pauseTemporarily, selectionKey, simData.links, simData.nodes]);

  useEffect(() => {
    if (fitted.current || size.w === 0) return;
    const timer = window.setTimeout(() => {
      fgRef.current?.zoomToFit?.(700, 70);
      fitted.current = true;
    }, 800);
    return () => window.clearTimeout(timer);
  }, [simData, size.w, size.h]);

  const paintSprites = useCallback(() => {
    for (const [id, sprite] of sprites.current) {
      const node = simData.nodes.find((item) => item.id === id);
      if (!node) continue;
      sprite.text = layer === 'expert' ? `${node.label}\n${node.type}` : node.label;
      sprite.material.transparent = true;
      sprite.material.opacity = brightNode(id) ? 0.96 : 0.14;
    }
    fgRef.current?.refresh?.();
  }, [brightNode, layer, simData.nodes]);

  useEffect(() => {
    paintSprites();
    const frame = requestAnimationFrame(paintSprites);
    return () => cancelAnimationFrame(frame);
  }, [paintSprites]);

  const nodeThreeObject = useCallback((node: SimNode) => {
    const currentLayer = layerRef.current;
    const sprite = new SpriteText(currentLayer === 'expert' ? `${node.label}\n${node.type}` : node.label);
    sprite.color = '#e8eef7';
    sprite.textHeight = 1.7;
    sprite.fontFace = LABEL_FONT;
    sprite.fontWeight = '500';
    sprite.position.y = 10;
    sprite.center.set(0.5, 0.5);
    sprite.material.transparent = true;
    sprite.material.depthWrite = false;
    sprite.material.depthTest = false;
    sprite.material.opacity = brightNodeRef.current(node.id) ? 0.96 : 0.14;
    sprites.current.set(node.id, sprite);
    return sprite;
  }, []);

  const nodeLabel = useCallback((node: SimNode) => {
    if (layerRef.current === 'expert') {
      return `${node.label}\n${nodeTypeLabel(node.type)} · ${node.type}\n分组 ${node.group}`;
    }
    return node.label;
  }, []);

  const linkLabel = useCallback((link: SimLink) => {
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
    <div className="canvas-wrap" ref={wrapRef} data-testid="graph-canvas">
      {size.w > 0 && size.h > 0 && (
        <ForceGraph3D
          ref={fgRef}
          graphData={simData}
          width={size.w}
          height={size.h}
          backgroundColor="#0c1016"
          showNavInfo={false}
          nodeRelSize={4}
          nodeResolution={16}
          nodeVal={(node) =>
            selection?.kind === 'node' && selection.id === (node as SimNode).id ? 12 : 7
          }
          nodeColor={(node) => {
            const typed = node as SimNode;
            const color = semanticColor(typed.group);
            return brightNode(typed.id) ? color : colorWithAlpha(color, 0.2);
          }}
          nodeOpacity={0.92}
          nodeLabel={(node) => nodeLabel(node as SimNode)}
          nodeThreeObject={(node: SimNode) => nodeThreeObject(node)}
          nodeThreeObjectExtend={true}
          linkColor={(link) => {
            const typed = link as SimLink;
            const index = simData.links.indexOf(typed);
            const color = semanticColor(typed.direction);
            const canonical = graph.links[index];
            const bright = canonical ? brightLink(canonical, index) : false;
            return bright ? color : colorWithAlpha(color, 0.14);
          }}
          linkWidth={(link) => {
            const typed = link as SimLink;
            const index = simData.links.indexOf(typed);
            const base = linkWidthForStrength(typed.strength);
            return index >= 0 && selection?.kind === 'link' && selection.index === index ? base + 1.2 : base;
          }}
          linkOpacity={0.9}
          linkLabel={(link) => linkLabel(link as SimLink)}
          linkDirectionalParticles={(link) => {
            if (coarse) return 0;
            const typed = link as SimLink;
            const index = simData.links.indexOf(typed);
            const canonical = graph.links[index];
            return canonical && brightLink(canonical, index) ? 2 : 0;
          }}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleSpeed={0.006}
          onNodeClick={(node) => onSelectNode((node as SimNode).id)}
          onLinkClick={(link) => {
            const index = simData.links.indexOf(link as SimLink);
            if (index >= 0) onSelectLink(index);
          }}
          onBackgroundClick={onBackground}
          cooldownTicks={140}
          warmupTicks={40}
        />
      )}
    </div>
  );
}
