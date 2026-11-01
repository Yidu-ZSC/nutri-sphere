import { useEffect, useMemo, useRef, useState } from 'react';
import { LABEL_HOME_COLUMN, columnIndex, linkDegrees, placeNodes } from '../lib/layout';
import type { GraphView } from '../lib/graphView';
import type { GraphData, GraphLink, Selection, SimNode, ViewLayer } from '../types/graph';
import type { LayoutMode } from '../lib/layout';
import { GraphScene2D } from './GraphScene2D';
import { GraphScene3D } from './GraphScene3D';
import { pickFramedNode, type DrawLink } from './graphShared';

interface GraphCanvasProps {
  graph: GraphData;
  focusIds: ReadonlySet<string> | null;
  selection: Selection | null;
  layer: ViewLayer;
  layout: LayoutMode;
  graphView: GraphView;
  shownNodeIds: ReadonlySet<string>;
  shownLinks: readonly (GraphLink & { graphIndex: number })[];
  compact: boolean;
  autoRotate: boolean;
  anchorId: string | null;
  onSelectNode: (id: string) => void;
  onSelectLink: (index: number) => void;
  onBackground: () => void;
}

export function GraphCanvas({
  graph,
  focusIds,
  selection,
  layer,
  layout,
  graphView,
  shownNodeIds,
  shownLinks,
  compact,
  autoRotate,
  anchorId,
  onSelectNode,
  onSelectLink,
  onBackground,
}: GraphCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [webgl, setWebgl] = useState(true);
  const [coarse, setCoarse] = useState(false);

  const degrees = useMemo(() => linkDegrees(shownLinks), [shownLinks]);

  const visibleKey = useMemo(() => {
    const ids = [...shownNodeIds].sort().join('|');
    const links = shownLinks.map((link) => link.graphIndex).join(',');
    return `${ids}|${links}`;
  }, [shownLinks, shownNodeIds]);

  const simData = useMemo(() => {
    const nodes: SimNode[] = graph.nodes
      .filter((node) => shownNodeIds.has(node.id))
      .map((node) => ({ ...node }));
    placeNodes(nodes, layout, graphView);
    const links: DrawLink[] = shownLinks.map((link) => ({ ...link }));
    return { nodes, links };
  }, [graph.nodes, graphView, layout, shownLinks, shownNodeIds]);

  const framedNode = useMemo(
    () => pickFramedNode(simData.nodes, anchorId),
    [anchorId, simData.nodes],
  );
  const homeColumn = framedNode && anchorId ? columnIndex(framedNode.type) : LABEL_HOME_COLUMN;

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

  const scene = {
    graph,
    nodes: simData.nodes,
    links: simData.links,
    focusIds,
    selection,
    layer,
    layout,
    compact,
    anchorId,
    framedNode,
    homeColumn,
    degrees,
    size,
    coarse,
    visibleKey,
    onSelectNode,
    onSelectLink,
    onBackground,
  };

  const ready = size.w > 0 && size.h > 0 && simData.nodes.length > 0;

  return (
    <div
      className="canvas-wrap"
      ref={wrapRef}
      data-testid="graph-canvas"
      data-layout={layout}
      data-view={graphView}
      data-frame="columns"
    >
      {graphView === '3d' && !webgl && (
        <div className="banner banner--error" role="alert">
          <p>当前环境无法创建 WebGL 画布，三维图谱不能显示。</p>
        </div>
      )}
      {ready && graphView === '2d' && <GraphScene2D {...scene} />}
      {ready && graphView === '3d' && webgl && <GraphScene3D {...scene} autoRotate={autoRotate} />}
    </div>
  );
}
