import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import {
  frameFlowCamera,
  frameFlowFocus,
  layoutFlow,
  panFlowCamera,
  selectFlowBands,
  zoomFlowCamera,
  type FlowCamera,
  type FlowEdgeInput,
  type FlowNodeInput,
} from '../lib/flowLayout';
import { FLOW_DIM_BAND, FLOW_DIM_LABEL, FLOW_DIM_NODE, colorWithAlpha, semanticColor } from '../lib/palette';
import type { HudInsets } from '../lib/entryFocus';
import type { CanvasStage } from '../lib/canvasStage';
import type { GraphLink, GraphNode, Selection } from '../types/graph';
import { linkIsInteractable, nodeIsInteractable } from './graphShared';

interface FlowCanvasProps {
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

function shortLabel(label: string, width: number): string {
  const max = Math.max(4, Math.floor((width - 28) / 12));
  const chars = [...label];
  if (chars.length <= max) return label;
  return `${chars.slice(0, max - 1).join('')}…`;
}

export function FlowCanvas({
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
}: FlowCanvasProps) {
  const picture = useMemo(() => {
    const inputNodes = flowNodes(nodes);
    const picked = selectFlowBands(inputNodes, flowEdges(links), anchors, pinIndex, undefined, undefined, focusRoot);
    const laid = layoutFlow(inputNodes, picked.bands, width);
    return { picked, laid };
  }, [anchors, focusRoot, links, nodes, pinIndex, width]);

  const labels = useMemo(() => new Map(nodes.map((node) => [node.id, node.label])), [nodes]);
  const { laid } = picture;
  const viewportRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<FlowCamera>({ x: 0, y: 0, k: 1 });
  const dragRef = useRef<{
    id: number;
    x: number;
    y: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const [camera, setCamera] = useState<FlowCamera>({ x: 0, y: 0, k: 1 });
  const [panning, setPanning] = useState(false);
  const frameKey = `${laid.width}x${laid.height}@${width}x${height}`;

  useEffect(() => {
    const next = focusRoot != null
      ? frameFlowFocus(laid.nodes, focusIds, width, height, insets)
      : frameFlowCamera(laid.width, laid.height, width, height);
    cameraRef.current = next;
    setCamera(next);
  }, [focusIds, focusRoot, frameKey, height, insets, laid.height, laid.nodes, laid.width, width]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
      const factor = Math.exp(-delta * 0.0016);
      const next = zoomFlowCamera(
        cameraRef.current,
        event.clientX - rect.left,
        event.clientY - rect.top,
        factor,
      );
      cameraRef.current = next;
      setCamera(next);
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  const applyCamera = (next: FlowCamera) => {
    cameraRef.current = next;
    setCamera(next);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      originX: cameraRef.current.x,
      originY: cameraRef.current.y,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setPanning(true);
    applyCamera(panFlowCamera({ ...cameraRef.current, x: drag.originX, y: drag.originY }, dx, dy));
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    setPanning(false);
    if (drag.moved) suppressClick.current = true;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const ignoreSuppressed = () => {
    if (!suppressClick.current) return false;
    suppressClick.current = false;
    return true;
  };

  const bandOpacity = (edge: FlowEdgeInput) => {
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
  };

  return (
    <div className="flow-view" data-testid="flow-canvas" data-bands={picture.picked.bands.length}>
      <div
        className={panning ? 'flow-scroll is-panning' : 'flow-scroll'}
        ref={viewportRef}
        data-zoom={camera.k.toFixed(2)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(event: ReactMouseEvent<HTMLDivElement>) => {
          if ((event.target as Element).closest('.flow-node, .flow-band-hit')) return;
          applyCamera(frameFlowCamera(laid.width, laid.height, width, height));
        }}
      >
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="饮食通路。拖动平移，滚轮缩放。"
          onClick={(event) => {
            if (ignoreSuppressed()) return;
            if ((event.target as Element).closest('.flow-node, .flow-band-hit')) return;
            onBackground();
          }}
        >
          <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.k})`}>
          {laid.captions.map((caption) => (
            <text
              key={caption.label}
              x={caption.x}
              y={18}
              fill={canvasStage.columnText}
              fontSize="11"
            >
              {caption.label}
            </text>
          ))}
          {laid.bands.map((band) => {
            const sourceLabel = labels.get(band.edge.source) ?? band.edge.source;
            const targetLabel = labels.get(band.edge.target) ?? band.edge.target;
            const title = `${sourceLabel} → ${targetLabel}。${band.edge.relation}`;
            const edgeLink = links.find((item) => item.graphIndex === band.edge.graphIndex);
            const bandHit =
              edgeLink &&
              linkIsInteractable(
                edgeLink,
                band.edge.graphIndex,
                highlightBrowseLocked,
                selection,
                focusIds,
                focusRoot,
              );
            return (
              <g key={band.edge.graphIndex} style={{ pointerEvents: bandHit ? 'auto' : 'none' }}>
                <path
                  d={band.d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(band.width, 12)}
                  className="flow-band-hit"
                  data-testid="flow-band"
                  data-index={band.edge.graphIndex}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (ignoreSuppressed() || !bandHit) return;
                    onSelectLink(band.edge.graphIndex);
                  }}
                >
                  <title>{title}</title>
                </path>
                <path
                  d={band.d}
                  fill="none"
                  stroke={colorWithAlpha(semanticColor(band.edge.direction), bandOpacity(band.edge))}
                  strokeWidth={band.width}
                  strokeLinecap="round"
                  pointerEvents="none"
                />
              </g>
            );
          })}
          {laid.nodes.map((node) => {
            const selected = selection?.kind === 'node' && selection.id === node.id;
            const bright = focusIds == null || focusIds.has(node.id) || selected;
            const nodeHit = nodeIsInteractable(node.id, highlightBrowseLocked, selection, links, focusIds);
            return (
              <g
                key={node.id}
                className="flow-node"
                data-testid="flow-node"
                data-node={node.id}
                transform={`translate(${node.x} ${node.y})`}
                style={{ pointerEvents: nodeHit ? 'auto' : 'none' }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (ignoreSuppressed() || !nodeHit) return;
                  onSelectNode(node.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectNode(node.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={node.label}
                aria-pressed={selected}
              >
                <rect
                  width={node.w}
                  height={node.h}
                  rx="6"
                  fill={canvasStage.columnPlate}
                  stroke={selected ? canvasStage.nodeStrokeSelected : canvasStage.columnPlateStroke}
                  strokeWidth={selected ? 1.6 : 1}
                  opacity={bright ? 1 : FLOW_DIM_NODE}
                />
                <circle cx={12} cy={node.h / 2} r={3.5} fill={semanticColor(node.group)} opacity={bright ? 1 : FLOW_DIM_NODE} />
                <text x={22} y={node.h / 2 + 4} fill={canvasStage.columnText} fontSize="12" opacity={bright ? 1 : FLOW_DIM_LABEL}>
                  {shortLabel(node.label, node.w)}
                </text>
                <title>{node.label}</title>
              </g>
            );
          })}
          {laid.bands.length === 0 && (
            <text
              x={laid.width / 2}
              y={laid.height / 2}
              textAnchor="middle"
              fill={canvasStage.columnText}
              fontSize="13"
              data-testid="flow-empty"
            >
              这条筛选没有跨列通路
            </text>
          )}
          </g>
        </svg>
      </div>
    </div>
  );
}
