import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DetailDrawer } from './components/DetailDrawer';
import { DisclaimerBar } from './components/DisclaimerBar';
import { FilterPanel } from './components/FilterPanel';
import { GraphCanvas } from './components/GraphCanvas';
import { LayoutToggle } from './components/LayoutToggle';
import { Legend } from './components/Legend';
import { PatternCompare } from './components/PatternCompare';
import { PatternDetail } from './components/PatternDetail';
import { SearchBar } from './components/SearchBar';
import { ThemeBar } from './components/ThemeBar';
import { ThemeLobby } from './components/ThemeLobby';
import { ViewLayerToggle } from './components/ViewLayerToggle';
import { useMediaQuery } from './hooks/useMediaQuery';
import { evidenceCounts, visibleGraphStats } from './lib/copy';
import { focusedNodeIds, isFocusEmpty } from './lib/focus';
import { readGraphView, writeGraphView, type GraphView } from './lib/graphView';
import {
  isLaypersonThemeEmpty,
  layerHint,
  LAYPERSON_THEME_EMPTY,
  renderVisibleGraph,
} from './lib/layerFilter';
import type { LayoutMode } from './lib/layout';
import { loadGraph } from './lib/loadGraph';
import { dietPatternById } from './lib/dietPatternDetails';
import { patternsForTheme } from './lib/patternLinks';
import { searchGraph, type SearchHit } from './lib/search';
import {
  findLinkIndex,
  linkKey,
  parseViewQuery,
  resolveScreen,
  serializeViewQuery,
  type ParsedShare,
} from './lib/shareUrl';
import { EXPLORE_THEMES, filtersFromShare, themeById, themeForFilters, type ExploreTheme } from './lib/themes';
import { selectionPinIds } from './lib/visibility';
import { readViewLayer, writeViewLayer } from './lib/viewLayer';
import type { GraphData, Selection, ViewLayer } from './types/graph';

interface ExploreSnapshot {
  diseaseId: string | null;
  mechanismId: string | null;
  foodId: string | null;
  layer: ViewLayer;
  layout: LayoutMode;
  graphView: GraphView;
  hideUnmatched: boolean;
  selection: Selection | null;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; graph: GraphData };

function readInitialQuery(): ParsedShare {
  if (typeof window === 'undefined') return parseViewQuery('');
  return parseViewQuery(window.location.search);
}

export function App() {
  const mobile = useMediaQuery('(max-width: 768px)');
  const initialQuery = useRef(readInitialQuery());
  const initialFilters = useRef(filtersFromShare(initialQuery.current));
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [screen, setScreen] = useState(() => resolveScreen(initialQuery.current));
  const [layer, setLayer] = useState<ViewLayer>(() => initialQuery.current.layer ?? readViewLayer());
  const [layout, setLayout] = useState<LayoutMode>(() => initialQuery.current.layout ?? 'hierarchy');
  const [graphView, setGraphView] = useState<GraphView>(() => {
    if (initialQuery.current.view) return initialQuery.current.view;
    if (initialQuery.current.theme && resolveScreen(initialQuery.current) === 'explore') return '2d';
    return readGraphView();
  });
  const [hideUnmatched, setHideUnmatched] = useState(() => initialQuery.current.hideUnmatched);
  const [query, setQuery] = useState('');
  const [diseaseId, setDiseaseId] = useState<string | null>(() => initialFilters.current.disease);
  const [mechanismId, setMechanismId] = useState<string | null>(() => initialFilters.current.mechanism);
  const [foodId, setFoodId] = useState<string | null>(() => initialFilters.current.food);
  const [patterns, setPatterns] = useState<string[]>(() => {
    const parsed = initialQuery.current;
    return resolveScreen(parsed) === 'home' ? parsed.patterns : [];
  });
  const [patternSourceTheme, setPatternSourceTheme] = useState<string | null>(() => {
    const parsed = initialQuery.current;
    return resolveScreen(parsed) === 'home' && parsed.patterns.length > 0 ? parsed.theme : null;
  });
  const [returnSnapshot, setReturnSnapshot] = useState<ExploreSnapshot | null>(null);
  const [patternId, setPatternId] = useState<string | null>(() => {
    const parsed = initialQuery.current;
    return resolveScreen(parsed) === 'pattern' ? parsed.pattern : null;
  });
  const [patternReturnSnapshot, setPatternReturnSnapshot] = useState<ExploreSnapshot | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [sheet, setSheet] = useState<'search' | 'filter' | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRoot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoad({ status: 'loading' });
    loadGraph()
      .then((graph) => {
        if (cancelled) return;
        const parsed = initialQuery.current;
        const shared = filtersFromShare(parsed);
        const disease =
          shared.disease && graph.nodes.some((node) => node.id === shared.disease && node.type === 'disease')
            ? shared.disease
            : null;
        const mechanism =
          shared.mechanism &&
          graph.nodes.some((node) => node.id === shared.mechanism && node.type === 'mechanism')
            ? shared.mechanism
            : null;
        const food = shared.food && graph.nodes.some((node) => node.id === shared.food) ? shared.food : null;
        let nextSelection: Selection | null = null;
        if (parsed.node && graph.nodes.some((node) => node.id === parsed.node)) {
          nextSelection = { kind: 'node', id: parsed.node };
        } else if (parsed.link) {
          const index = findLinkIndex(graph.links, parsed.link);
          if (index != null) nextSelection = { kind: 'link', index };
        }
        setDiseaseId(disease);
        setMechanismId(mechanism);
        setFoodId(food);
        setSelection(nextSelection);
        setLoad({ status: 'ready', graph });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : '图谱数据加载失败';
        setLoad({ status: 'error', message });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    writeViewLayer(layer);
  }, [layer]);

  useEffect(() => {
    writeGraphView(graphView);
  }, [graphView]);

  const graph = load.status === 'ready' ? load.graph : null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (moreOpen) {
        setMoreOpen(false);
        return;
      }
      if (sheet) {
        setSheet(null);
        return;
      }
      if (aboutOpen) {
        setAboutOpen(false);
        return;
      }
      if (selection) setSelection(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aboutOpen, moreOpen, selection, sheet]);

  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (event: PointerEvent) => {
      const root = moreRoot.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setMoreOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, [moreOpen]);

  useEffect(() => {
    if (!mobile) setMoreOpen(false);
  }, [mobile]);

  const diseases = useMemo(
    () => (graph ? graph.nodes.filter((node) => node.type === 'disease') : []),
    [graph],
  );
  const mechanisms = useMemo(
    () => (graph ? graph.nodes.filter((node) => node.type === 'mechanism') : []),
    [graph],
  );

  const safeDisease = diseases.some((node) => node.id === diseaseId) ? diseaseId : null;
  const safeMechanism = mechanisms.some((node) => node.id === mechanismId) ? mechanismId : null;
  const safeFood = graph?.nodes.some((node) => node.id === foodId) ? foodId : null;

  useEffect(() => {
    if (screen === 'pattern' && !dietPatternById(patternId)) {
      setPatternId(null);
      setScreen('home');
    }
  }, [patternId, screen]);

  useEffect(() => {
    if (screen === 'explore' && !graph) return;
    const exploring = screen === 'explore' && graph != null;
    const link = exploring && selection?.kind === 'link' ? graph.links[selection.index] : undefined;
    const next = serializeViewQuery({
      screen,
      theme: exploring
        ? (themeForFilters(safeDisease, safeMechanism, safeFood)?.id ?? null)
        : screen === 'home' && patterns.length > 0
          ? patternSourceTheme
          : null,
      disease: exploring ? safeDisease : null,
      mechanism: exploring ? safeMechanism : null,
      food: exploring ? safeFood : null,
      pattern: screen === 'pattern' ? patternId : null,
      patterns: screen === 'home' ? patterns : [],
      layer,
      layout,
      view: graphView,
      hideUnmatched: exploring ? hideUnmatched : false,
      node: exploring && selection?.kind === 'node' ? selection.id : null,
      link: link ? linkKey(link.source, link.target) : null,
    });
    const target = `${window.location.pathname}${next}${window.location.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (current !== target) window.history.replaceState(null, '', target);
  }, [
    graph,
    graphView,
    hideUnmatched,
    layer,
    layout,
    patternId,
    patternSourceTheme,
    patterns,
    safeDisease,
    safeFood,
    safeMechanism,
    screen,
    selection,
  ]);

  const focusIds = useMemo(
    () => (graph ? focusedNodeIds(graph.links, safeDisease, safeMechanism, safeFood) : null),
    [graph, safeDisease, safeFood, safeMechanism],
  );

  const rendered = useMemo(() => {
    if (!graph) return null;
    const pinned = selectionPinIds(selection, graph.links, hideUnmatched, focusIds);
    const view = renderVisibleGraph({
      nodes: graph.nodes,
      links: graph.links,
      focusIds,
      hideUnmatched,
      pinnedIds: pinned,
      layer,
    });
    return {
      nodeIds: view.nodeIds,
      links: view.links,
      linkIndices: new Set(view.links.map((link) => link.graphIndex)),
    };
  }, [focusIds, graph, hideUnmatched, layer, selection]);

  useEffect(() => {
    if (!graph || !rendered || !selection) return;
    if (selection.kind === 'node' && !rendered.nodeIds.has(selection.id)) {
      setSelection(null);
      return;
    }
    if (selection.kind === 'link' && !rendered.linkIndices.has(selection.index)) {
      setSelection(null);
    }
  }, [graph, rendered, selection]);

  const search = useMemo(() => {
    if (!graph || !rendered) return { hits: [], truncated: false };
    return searchGraph(query, graph, {
      nodeIds: rendered.nodeIds,
      linkIndices: rendered.linkIndices,
    });
  }, [graph, query, rendered]);

  const counts = useMemo(() => (graph ? evidenceCounts(graph.links) : {}), [graph]);

  const anchorId = useMemo(() => {
    if (!graph || !selection) return safeMechanism ?? safeDisease ?? safeFood;
    if (selection.kind === 'node') return selection.id;
    return graph.links[selection.index]?.target ?? safeMechanism ?? safeDisease ?? safeFood;
  }, [graph, safeDisease, safeFood, safeMechanism, selection]);

  const onQuery = useCallback((value: string) => setQuery(value), []);

  const onGraphView = (next: GraphView) => {
    setGraphView(next);
    setLayout('hierarchy');
  };

  const openMobileSheet = (next: 'search' | 'filter') => {
    setMoreOpen(false);
    setSheet((current) => (current === next ? null : next));
  };

  const onSelectHit = (hit: SearchHit) => {
    if (hit.kind === 'node' && hit.id) setSelection({ kind: 'node', id: hit.id });
    if (hit.kind === 'link' && hit.index != null) setSelection({ kind: 'link', index: hit.index });
    setSheet(null);
  };

  const clearFilters = () => {
    setDiseaseId(null);
    setMechanismId(null);
    setFoodId(null);
  };

  const selectDisease = (id: string | null) => {
    setDiseaseId(id);
    if (id) setFoodId(null);
  };

  const selectMechanism = (id: string | null) => {
    setMechanismId(id);
    if (id) setFoodId(null);
  };

  const onTheme = (theme: ExploreTheme | null) => {
    if (!theme) {
      setDiseaseId(null);
      setMechanismId(null);
      setFoodId(null);
      return;
    }
    setDiseaseId(theme.diseaseId);
    setMechanismId(theme.mechanismId);
    setFoodId(theme.foodId);
  };

  const clearPatternHighlight = () => {
    setPatterns([]);
    setPatternSourceTheme(null);
    setReturnSnapshot(null);
  };

  const enterTheme = (theme: ExploreTheme) => {
    setDiseaseId(theme.diseaseId);
    setMechanismId(theme.mechanismId);
    setFoodId(theme.foodId);
    setLayout('hierarchy');
    setGraphView('2d');
    setHideUnmatched(true);
    setSelection(null);
    setSheet(null);
    setMoreOpen(false);
    setPatternId(null);
    setPatternReturnSnapshot(null);
    setScreen('explore');
    clearPatternHighlight();
  };

  const goHome = () => {
    setSelection(null);
    setSheet(null);
    setMoreOpen(false);
    setPatternId(null);
    setPatternReturnSnapshot(null);
    setScreen('home');
    clearPatternHighlight();
  };

  const captureExplore = (): ExploreSnapshot => ({
    diseaseId: safeDisease,
    mechanismId: safeMechanism,
    foodId: safeFood,
    layer,
    layout,
    graphView,
    hideUnmatched,
    selection,
  });

  const openPatternFromLobby = (id: string) => {
    if (!dietPatternById(id)) return;
    setPatternReturnSnapshot(null);
    setPatternId(id);
    setSelection(null);
    setSheet(null);
    setMoreOpen(false);
    setScreen('pattern');
    clearPatternHighlight();
  };

  const openPatternFromCompare = (id: string) => {
    if (!dietPatternById(id)) return;
    setPatternId(id);
    setSelection(null);
    setSheet(null);
    setMoreOpen(false);
    setScreen('pattern');
  };

  const openPatternFromExplore = (id: string) => {
    if (!dietPatternById(id)) return;
    setPatternReturnSnapshot(captureExplore());
    setPatternId(id);
    setSelection(null);
    setSheet(null);
    setMoreOpen(false);
    setScreen('pattern');
    clearPatternHighlight();
  };

  const openCompare = () => {
    setSelection(null);
    setSheet(null);
    setMoreOpen(false);
    setScreen('compare');
    clearPatternHighlight();
  };

  const returnFromPatternToGraph = () => {
    const snapshot = patternReturnSnapshot;
    if (!snapshot) return;
    setPatternReturnSnapshot(null);
    setPatternId(null);
    setDiseaseId(snapshot.diseaseId);
    setMechanismId(snapshot.mechanismId);
    setFoodId(snapshot.foodId);
    setLayer(snapshot.layer);
    setLayout(snapshot.layout);
    setGraphView(snapshot.graphView);
    setHideUnmatched(snapshot.hideUnmatched);
    setSelection(snapshot.selection);
    setSheet(null);
    setMoreOpen(false);
    setScreen('explore');
    clearPatternHighlight();
  };

  const showRelatedPatterns = () => {
    const theme = themeForFilters(safeDisease, safeMechanism, safeFood);
    const linked = patternsForTheme(theme?.id);
    if (!theme || linked.length === 0) return;
    setReturnSnapshot({
      diseaseId: safeDisease,
      mechanismId: safeMechanism,
      foodId: safeFood,
      layer,
      layout,
      graphView,
      hideUnmatched,
      selection,
    });
    setPatternSourceTheme(theme.id);
    setPatterns([...linked]);
    setPatternId(null);
    setPatternReturnSnapshot(null);
    setSelection(null);
    setSheet(null);
    setMoreOpen(false);
    setScreen('home');
  };

  const returnToGraph = () => {
    const snapshot = returnSnapshot;
    const source = themeById(patternSourceTheme);
    clearPatternHighlight();
    if (snapshot) {
      setDiseaseId(snapshot.diseaseId);
      setMechanismId(snapshot.mechanismId);
      setFoodId(snapshot.foodId);
      setLayer(snapshot.layer);
      setLayout(snapshot.layout);
      setGraphView(snapshot.graphView);
      setHideUnmatched(snapshot.hideUnmatched);
      setSelection(snapshot.selection);
      setSheet(null);
      setMoreOpen(false);
      setScreen('explore');
      return;
    }
    if (source) enterTheme(source);
  };

  const exploring = screen === 'explore';
  const activePattern = screen === 'pattern' ? dietPatternById(patternId) : null;
  const relatedPatternIds = patternsForTheme(themeForFilters(safeDisease, safeMechanism, safeFood)?.id);

  const copyViewLink = () => {
    const href = window.location.href;
    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    };
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(href).then(done).catch(done);
      return;
    }
    done();
  };

  const filterEmpty = graph != null && isFocusEmpty(focusIds, graph.nodes.map((node) => node.id));
  const laypersonThemeEmpty =
    graph != null &&
    rendered != null &&
    isLaypersonThemeEmpty(
      layer,
      focusIds,
      rendered.nodeIds,
      graph.nodes.map((node) => node.id),
    );

  const viewControls = exploring ? <LayoutToggle view={graphView} onChange={onGraphView} /> : null;
  const rotateControl =
    exploring && graphView === '3d' ? (
      <button
        type="button"
        className="btn btn--ghost"
        aria-pressed={autoRotate}
        onClick={() => setAutoRotate((value) => !value)}
      >
        旋转{autoRotate ? '开' : '关'}
      </button>
    ) : null;
  const copyControl = (
    <button type="button" className="btn btn--ghost" onClick={copyViewLink}>
      {copied ? '已复制' : '复制链接'}
    </button>
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <p className="brand-title">NutriSphere</p>
            <p className="brand-sub">仅供学习：饮食、机制与健康结局的关联图谱</p>
          </div>
        </div>
        {exploring && !mobile && graph && (
          <div className="header-tools">
            <SearchBar
              hits={search.hits}
              truncated={search.truncated}
              onQuery={onQuery}
              onSelect={onSelectHit}
            />
            <FilterPanel
              diseases={diseases}
              mechanisms={mechanisms}
              diseaseId={safeDisease}
              mechanismId={safeMechanism}
              layer={layer}
              onDisease={selectDisease}
              onMechanism={selectMechanism}
              onClear={clearFilters}
            />
          </div>
        )}
        <div className="header-actions">
          {exploring && (
            <button type="button" className="btn" data-testid="back-to-home" onClick={goHome}>
              返回主题大厅
            </button>
          )}
          {mobile ? (
            <div className="more-menu" ref={moreRoot}>
              <button
                type="button"
                className="btn btn--ghost"
                aria-expanded={moreOpen}
                aria-controls="more-panel"
                data-testid="more-menu"
                onClick={() => setMoreOpen((open) => !open)}
              >
                更多
              </button>
              {moreOpen && (
                <div id="more-panel" className="more-panel" data-testid="more-panel" role="menu">
                  {exploring && (
                    <>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        aria-expanded={sheet === 'search'}
                        onClick={() => openMobileSheet('search')}
                      >
                        搜索
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        aria-expanded={sheet === 'filter'}
                        onClick={() => openMobileSheet('filter')}
                      >
                        筛选
                      </button>
                      {viewControls}
                    </>
                  )}
                  <ViewLayerToggle layer={layer} onChange={setLayer} />
                  {rotateControl}
                  {copyControl}
                </div>
              )}
            </div>
          ) : (
            <>
              {viewControls}
              <ViewLayerToggle layer={layer} onChange={setLayer} />
              {rotateControl}
              {copyControl}
            </>
          )}
        </div>
        <p className="layer-hint" data-testid="layer-hint" role="status">
          {layerHint(layer)}
        </p>
      </header>

      <div className={exploring && selection ? 'stage stage--detail' : 'stage'}>
        {exploring && load.status === 'loading' && (
          <p className="banner" role="status">
            正在加载知识图谱…
          </p>
        )}
        {load.status === 'error' && (
          <div className="banner banner--error" role="alert">
            <p>图谱数据加载失败</p>
            <p>{load.message}</p>
            <button type="button" className="btn" onClick={() => setAttempt((value) => value + 1)}>
              重试
            </button>
          </div>
        )}
        {(screen === 'home' || (screen === 'pattern' && !activePattern)) && (
          <ThemeLobby
            onEnter={enterTheme}
            onOpenPattern={openPatternFromLobby}
            onOpenCompare={openCompare}
            highlightedPatterns={patterns}
            patternSourceTheme={patternSourceTheme}
            onReturnToGraph={returnToGraph}
          />
        )}
        {activePattern && (
          <PatternDetail
            detail={activePattern}
            onBack={goHome}
            onCompare={openCompare}
            onEnterTheme={enterTheme}
            onReturnToGraph={patternReturnSnapshot ? returnFromPatternToGraph : undefined}
          />
        )}
        {screen === 'compare' && <PatternCompare onBack={goHome} onOpenPattern={openPatternFromCompare} />}
        {exploring && graph && rendered && (
          <>
            <div className="stage-main" data-testid="explore-screen">
              <GraphCanvas
                graph={graph}
                focusIds={focusIds}
                selection={selection}
                layer={layer}
                layout={layout}
                graphView={graphView}
                shownNodeIds={rendered.nodeIds}
                shownLinks={rendered.links}
                compact={mobile}
                autoRotate={autoRotate}
                anchorId={anchorId}
                onSelectNode={(id) => setSelection({ kind: 'node', id })}
                onSelectLink={(index) => setSelection({ kind: 'link', index })}
                onBackground={() => setSelection(null)}
              />
              <div className="stage-overlay">
                <ThemeBar
                  themes={EXPLORE_THEMES}
                  diseaseId={safeDisease}
                  mechanismId={safeMechanism}
                  foodId={safeFood}
                  layout={layout}
                  hideUnmatched={hideUnmatched}
                  onTheme={onTheme}
                  onHideUnmatched={setHideUnmatched}
                />
              </div>
              <div className="hud">
                <Legend />
                <p className="counts" data-testid="graph-stats">
                  {visibleGraphStats(rendered.nodeIds.size, rendered.links.length)}
                </p>
                <p className="hud-note">颜色表示关联方向，线越粗表示强度越高。形状区分节点类型。</p>
              </div>
              {filterEmpty && (
                <div className="empty-filter" role="status">
                  <p>无匹配，清除过滤</p>
                  <button type="button" className="btn" onClick={clearFilters}>
                    清除全部
                  </button>
                </div>
              )}
              {laypersonThemeEmpty && (
                <div className="empty-layperson" role="status" data-testid="layperson-empty">
                  <p>{LAYPERSON_THEME_EMPTY}</p>
                  <button
                    type="button"
                    className="btn"
                    data-testid="switch-expert"
                    onClick={() => setLayer('expert')}
                  >
                    切换专家层
                  </button>
                </div>
              )}
              {mobile && sheet && (
                <div className="sheet" role="dialog" aria-label={sheet === 'search' ? '搜索' : '筛选'}>
                  {sheet === 'search' ? (
                    <SearchBar
                      hits={search.hits}
                      truncated={search.truncated}
                      onQuery={onQuery}
                      onSelect={onSelectHit}
                    />
                  ) : (
                    <FilterPanel
                      diseases={diseases}
                      mechanisms={mechanisms}
                      diseaseId={safeDisease}
                      mechanismId={safeMechanism}
                      layer={layer}
                      onDisease={selectDisease}
                      onMechanism={selectMechanism}
                      onClear={clearFilters}
                    />
                  )}
                  <button type="button" className="btn" onClick={() => setSheet(null)}>
                    完成
                  </button>
                </div>
              )}
            </div>
            {selection && (
              <DetailDrawer
                graph={graph}
                selection={selection}
                layer={layer}
                mobile={mobile}
                evidenceCounts={counts}
                visibleLinkIndices={rendered.linkIndices}
                onClose={() => setSelection(null)}
                onSelectNode={(id) => setSelection({ kind: 'node', id })}
                onSelectLink={(index) => setSelection({ kind: 'link', index })}
                onShowPatterns={relatedPatternIds.length > 0 ? showRelatedPatterns : undefined}
                relatedPatternIds={relatedPatternIds}
                onOpenPattern={relatedPatternIds.length > 0 ? openPatternFromExplore : undefined}
              />
            )}
          </>
        )}
      </div>

      <DisclaimerBar
        meta={graph?.meta ?? null}
        aboutOpen={aboutOpen}
        nodeCount={graph?.nodes.length ?? null}
        linkCount={graph?.links.length ?? null}
        evidenceCounts={counts}
        onAboutOpen={() => setAboutOpen(true)}
        onAboutClose={() => setAboutOpen(false)}
      />
    </div>
  );
}
