import { useMemo } from 'react';
import { layoutFlow, selectFlowBands, type FlowEdgeInput, type FlowNodeInput } from '../lib/flowLayout';
import { colorWithAlpha, semanticColor } from '../lib/palette';
import type { CanvasStage } from '../lib/canvasStage';
import type { GraphLink, GraphNode, Selection } from '../types/graph';

interface FlowCanvasProps {
  nodes: readonly GraphNode[];
  links: readonly (GraphLink & { graphIndex: number })[];
  width: number;
  anchors: readonly string[];
  pinIndex: number | null;
  selection: Selection | null;
  focusIds: ReadonlySet<string> | null;
  canvasStage: CanvasStage;
  onSelectNode: (id: string) => void;
  onSelectLink: (index: number) => void;
  onBackground: () => void;
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
  anchors,
  pinIndex,
  selection,
  focusIds,
  canvasStage,
  onSelectNode,
  onSelectLink,
  onBackground,
}: FlowCanvasProps) {
  const picture = useMemo(() => {
    const inputNodes = flowNodes(nodes);
    const picked = selectFlowBands(inputNodes, flowEdges(links), anchors, pinIndex);
    const laid = layoutFlow(inputNodes, picked.bands, width);
    return { picked, laid };
  }, [anchors, links, nodes, pinIndex, width]);

  const labels = useMemo(() => new Map(nodes.map((node) => [node.id, node.label])), [nodes]);
  const { laid } = picture;

  const bandOpacity = (edge: FlowEdgeInput) => {
    const selected = selection?.kind === 'link' && selection.index === edge.graphIndex;
    if (selected) return 0.95;
    if (selection?.kind === 'node') {
      return edge.source === selection.id || edge.target === selection.id ? 0.9 : 0.18;
    }
    if (selection?.kind === 'link') return 0.2;
    if (focusIds && !(focusIds.has(edge.source) && focusIds.has(edge.target))) return 0.16;
    return 0.72;
  };

  return (
    <div className="flow-view" data-testid="flow-canvas" data-bands={picture.picked.bands.length}>
      <div className="flow-scroll">
        <svg
          width={laid.width}
          height={laid.height}
          viewBox={`0 0 ${laid.width} ${laid.height}`}
          role="img"
          aria-label="饮食通路"
          onClick={onBackground}
        >
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
            return (
              <g key={band.edge.graphIndex}>
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
            return (
              <g
                key={node.id}
                className="flow-node"
                data-testid="flow-node"
                data-node={node.id}
                transform={`translate(${node.x} ${node.y})`}
                onClick={(event) => {
                  event.stopPropagation();
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
                />
                <circle cx={12} cy={node.h / 2} r={3.5} fill={semanticColor(node.group)} />
                <text x={22} y={node.h / 2 + 4} fill={canvasStage.columnText} fontSize="12">
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
        </svg>
      </div>
    </div>
  );
}
