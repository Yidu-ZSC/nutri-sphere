import { useEffect, useMemo, useRef, useState } from 'react';
import { applyLinkCurvature } from '../lib/linkCurvature';
import { LABEL_HOME_COLUMN, columnIndex, linkDegrees, placeNodes } from '../lib/layout';
import type { GraphView } from '../lib/graphView';
import type { GraphData, GraphLink, Selection, SimNode } from '../types/graph';
import { canvasStageForTheme } from '../lib/canvasStage';
import type { AppTheme } from '../lib/themePreference';
import type { LayoutMode } from '../lib/layout';
import { entryFocusInsets } from '../lib/entryFocus';
import { FlowCanvas } from './FlowCanvas';
import { FlowSlabScene } from './FlowSlabScene';
import { GraphScene2D } from './GraphScene2D';
import { GraphScene3D } from './GraphScene3D';
import { pickFramedNode, type DrawLink } from './graphShared';

interface GraphCanvasProps {
  graph: GraphData;
  focusIds: ReadonlySet<string> | null;
  focusRoot: string | null;
  /** The right-rail focus chip is expanded; widen the HUD-safe right inset. */
  focusChipExpanded: boolean;
  selection: Selection | null;
  layout: LayoutMode;
  graphView: GraphView;
  shownNodeIds: ReadonlySet<string>;
  shownLinks: readonly (GraphLink & { graphIndex: number })[];
  compact: boolean;
  legendExpanded: boolean;
  autoRotate: boolean;
  anchorId: string | null;
  flowAnchorIds: readonly string[];
  onSelectNode: (id: string) => void;
  onSelectLink: (index: number) => void;
  onBackground: () => void;
  highlightBrowseLocked: boolean;
  appTheme: AppTheme;
}

export function GraphCanvas({
  graph,
  focusIds,
  focusRoot,
  focusChipExpanded,
  selection,
  layout,
  graphView,
  shownNodeIds,
  shownLinks,
  compact,
  legendExpanded,
  autoRotate,
  anchorId,
  flowAnchorIds,
  onSelectNode,
  onSelectLink,
  onBackground,
  highlightBrowseLocked,
  appTheme,
}: GraphCanvasProps) {
  const canvasStage = useMemo(() => canvasStageForTheme(appTheme), [appTheme]);
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
    placeNodes(nodes, layout, graphView, compact);
    const links: DrawLink[] = shownLinks.map((link) => ({ ...link }));
    applyLinkCurvature(links, nodes);
    return { nodes, links };
  }, [compact, graph.nodes, graphView, layout, shownLinks, shownNodeIds]);

  const framedNode = useMemo(
    () => pickFramedNode(simData.nodes, anchorId),
    [anchorId, simData.nodes],
  );
  const homeColumn = framedNode && anchorId ? columnIndex(framedNode.type) : LABEL_HOME_COLUMN;

  const insets = useMemo(
    () =>
      entryFocusInsets({
        mobile: compact,
        legendExpanded,
        focusChip: focusChipExpanded,
        detailOverlay: selection != null && (compact || size.w <= 1024),
      }),
    [compact, focusChipExpanded, legendExpanded, selection, size.w],
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
    const measure = () => {
      const rect = element.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scene = {
    graph,
    nodes: simData.nodes,
    links: simData.links,
    focusIds,
    focusRoot,
    insets,
    selection,
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
    canvasStage,
    highlightBrowseLocked,
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
      data-canvas-theme={appTheme}
    >
      {graphView === '3d' && !webgl && (
        <div className="banner banner--error" role="alert">
          <p>当前环境无法创建 WebGL 画布，三维图谱不能显示。</p>
        </div>
      )}
      {size.w > 0 && size.h > 0 && graphView === 'flow' && (
        <FlowCanvas
          nodes={graph.nodes.filter((node) => shownNodeIds.has(node.id))}
          links={shownLinks}
          width={size.w}
          height={size.h}
          anchors={flowAnchorIds}
          pinIndex={selection?.kind === 'link' ? selection.index : null}
          selection={selection}
          focusIds={focusIds}
          focusRoot={focusRoot}
          insets={insets}
          canvasStage={canvasStage}
          onSelectNode={onSelectNode}
          onSelectLink={onSelectLink}
          onBackground={onBackground}
          highlightBrowseLocked={highlightBrowseLocked}
        />
      )}
      {ready && graphView === '2d' && <GraphScene2D {...scene} />}
      {size.w > 0 && size.h > 0 && graphView === '3d' && webgl && layout !== 'force' && (
        <FlowSlabScene
          nodes={graph.nodes.filter((node) => shownNodeIds.has(node.id))}
          links={shownLinks}
          width={size.w}
          height={size.h}
          anchors={flowAnchorIds}
          pinIndex={selection?.kind === 'link' ? selection.index : null}
          selection={selection}
          focusIds={focusIds}
          focusRoot={focusRoot}
          insets={insets}
          canvasStage={canvasStage}
          onSelectNode={onSelectNode}
          onSelectLink={onSelectLink}
          onBackground={onBackground}
          highlightBrowseLocked={highlightBrowseLocked}
        />
      )}
      {ready && graphView === '3d' && webgl && layout === 'force' && (
        <GraphScene3D {...scene} autoRotate={autoRotate} />
      )}
    </div>
  );
}
