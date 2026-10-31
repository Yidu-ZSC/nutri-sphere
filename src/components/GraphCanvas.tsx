import { useEffect, useMemo, useRef, useState } from 'react';
import { LABEL_HOME_COLUMN, columnIndex, linkDegrees, placeNodes } from '../lib/layout';
import { visibleNodeIds } from '../lib/visibility';
import type { GraphView } from '../lib/graphView';
import type { GraphData, Selection, SimNode, ViewLayer } from '../types/graph';
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
  hideUnmatched: boolean;
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
  hideUnmatched,
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

  const degrees = useMemo(() => linkDegrees(graph.links), [graph]);

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
    placeNodes(nodes, layout, graphView);
    const links: DrawLink[] = graph.links
      .map((link, index) => ({ ...link, graphIndex: index }))
      .filter((link) => ids.has(link.source) && ids.has(link.target));
    return { nodes, links };
  }, [graph, graphView, layout, visibleKey]);

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
