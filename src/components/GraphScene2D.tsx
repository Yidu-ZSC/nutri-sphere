import { useEffect, useMemo, useRef } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import { directionLabel, evidenceLabel, nodeTypeLabel } from '../lib/copy';
import { COLUMN_Y_GAP, frameGraph2d, columnIndex } from '../lib/layout';
import { particleCount, styledLinkWidth } from '../lib/linkStyle';
import { labelShouldShow } from '../lib/nodeStyle';
import { colorWithAlpha, semanticColor } from '../lib/palette';
import type { SimNode } from '../types/graph';
import { linkIsBright, nodeIsBright, nodeIsSelected, type DrawLink, type SceneCommonProps } from './graphShared';
import { paintColumnCaptions, paintGraphNode, paintGraphNodeHit, type PaintedNode } from './paintNode2d';

type GraphApi = ForceGraphMethods<SimNode, DrawLink>;

const MOBILE_ZOOM = 3.15;

export function GraphScene2D(props: SceneCommonProps) {
  const fgRef = useRef<GraphApi | undefined>(undefined);
  const layoutRef = useRef(props.layout);
  const compactRef = useRef(props.compact);
  layoutRef.current = props.layout;
  compactRef.current = props.compact;

  const describe = (node: SimNode): PaintedNode => {
    const bright = nodeIsBright(node.id, props.selection, props.graph.links, props.focusIds);
    const selected = nodeIsSelected(node.id, props.selection, props.graph.links);
    const focusY = props.framedNode?.layoutY ?? props.framedNode?.y;
    return {
      x: node.x ?? 0,
      y: node.y ?? 0,
      label: node.label,
      type: node.type,
      group: node.group,
      degree: props.degrees.get(node.id) ?? 0,
      selected,
      bright,
      expert: props.layer === 'expert',
      typeLabel: nodeTypeLabel(node.type),
      showLabel: labelShouldShow({
        compact: props.compact,
        bright,
        selected,
        column: columnIndex(node.type),
        homeColumn: props.homeColumn,
        nodeY: node.layoutY ?? node.y,
        focusY,
        above: COLUMN_Y_GAP * 2.2,
        below: COLUMN_Y_GAP * 1.15,
        surface: '2d',
      }),
    };
  };

  const nodeCanvasObject = (node: SimNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    paintGraphNode(ctx, describe(node), globalScale);
  };

  const nodePointerAreaPaint = (node: SimNode, color: string, ctx: CanvasRenderingContext2D) => {
    paintGraphNodeHit(ctx, describe(node), color);
  };

  const frameKey = `${props.layout}|${props.compact ? 'compact' : 'full'}|${props.size.w}x${props.size.h}|${props.visibleKey}|${props.compact ? props.anchorId ?? '' : ''}`;

  useEffect(() => {
    if (props.nodes.length === 0 || props.size.w === 0 || props.size.h === 0) return;
    if (!props.compact && props.layout === 'force') return;
    let attempts = 0;
    let applied = 0;
    let raf = 0;
    const tick = () => {
      const api = fgRef.current;
      if (!api) {
        if (attempts++ < 40) raf = requestAnimationFrame(tick);
        return;
      }
      if (props.compact) {
        const target = props.framedNode;
        if (!target || target.x == null || target.y == null) {
          if (attempts++ < 40) raf = requestAnimationFrame(tick);
          return;
        }
        api.centerAt(target.x, target.y, 0);
        api.zoom(MOBILE_ZOOM, 0);
      } else {
        const shot = frameGraph2d(props.nodes, props.size.w, props.size.h);
        api.centerAt(shot.x, shot.y, 0);
        api.zoom(Math.max(shot.k, 0.2), 0);
      }
      if (applied++ < 3) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frameKey, props.compact, props.framedNode, props.layout, props.nodes, props.size.h, props.size.w]);

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

  const nodeLabel = useMemo(() => {
    return (node: SimNode) => {
      if (props.layer === 'expert') {
        return `${node.label}\n${nodeTypeLabel(node.type)} · ${node.type}\n分组 ${node.group}`;
      }
      return node.label;
    };
  }, [props.layer]);

  const linkLabel = useMemo(() => {
    return (link: DrawLink) => {
      if (props.layer === 'expert') {
        return `${link.relation}\n${directionLabel(link.direction)} · ${link.direction}\n${evidenceLabel(link.evidence_type)}`;
      }
      return link.relation;
    };
  }, [props.layer]);

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={{ nodes: props.nodes, links: props.links }}
      width={props.size.w}
      height={props.size.h}
      backgroundColor="#0c1016"
      enableNodeDrag={props.layout === 'force'}
      nodeRelSize={0}
      nodeVal={1}
      nodeLabel={nodeLabel}
      nodeCanvasObjectMode={() => 'after'}
      nodeCanvasObject={nodeCanvasObject}
      nodePointerAreaPaint={nodePointerAreaPaint}
      nodeColor={() => 'rgba(0,0,0,0)'}
      linkCurvature={0}
      linkHoverPrecision={8}
      linkColor={(link) => {
        const typed = link as DrawLink;
        const color = semanticColor(typed.direction);
        const canonical = props.graph.links[typed.graphIndex];
        const bright = canonical ? linkIsBright(canonical, typed.graphIndex, props.selection, props.focusIds) : false;
        return bright ? colorWithAlpha(color, 0.92) : colorWithAlpha(color, 0.28);
      }}
      linkWidth={(link) => {
        const typed = link as DrawLink;
        const selected = props.selection?.kind === 'link' && props.selection.index === typed.graphIndex;
        return styledLinkWidth(typed.strength, '2d', selected);
      }}
      linkLabel={linkLabel}
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
      linkDirectionalParticleWidth={2.2}
      linkDirectionalParticleSpeed={0.006}
      onNodeClick={(node) => props.onSelectNode((node as SimNode).id)}
      onLinkClick={(link) => props.onSelectLink((link as DrawLink).graphIndex)}
      onBackgroundClick={props.onBackground}
      onRenderFramePost={(ctx, globalScale) => {
        if (layoutRef.current !== 'hierarchy') return;
        paintColumnCaptions(ctx, props.nodes, globalScale);
      }}
      onEngineStop={() => {
        if (layoutRef.current !== 'force' || compactRef.current) return;
        fgRef.current?.zoomToFit(600, 72);
      }}
      minZoom={0.15}
      maxZoom={8}
      warmupTicks={props.layout === 'hierarchy' ? 0 : 24}
      cooldownTicks={props.layout === 'hierarchy' ? 0 : 140}
    />
  );
}
