import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DetailDrawer } from './components/DetailDrawer';
import { DietTwin } from './components/DietTwin';
import { DisclaimerBar } from './components/DisclaimerBar';
import { FilterPanel } from './components/FilterPanel';
import { GraphCanvas } from './components/GraphCanvas';
import { LayoutToggle } from './components/LayoutToggle';
import { Legend } from './components/Legend';
import { VeganDietDetail } from './components/VeganDietDetail';
import { SearchBar } from './components/SearchBar';
import { ThemeBar } from './components/ThemeBar';
import { ThemeLobby } from './components/ThemeLobby';
import { ThemeOptions, ThemeSwitcher } from './components/ThemeSwitcher';
import { useMediaQuery } from './hooks/useMediaQuery';
import { evidenceCounts, visibleGraphStats } from './lib/copy';
import {
  BACK_TO_LOBBY,
  CLEAR_CLICK_FOCUS,
  CLICK_FOCUS_PREFIX,
  EXPLORE_EMPTY_ACTION,
  THEME_HINT_CLOSE,
  themeHintVisible,
  EXPLORE_EMPTY_COPY,
  RAIL_TOGGLE_LABEL,
} from './lib/exploreShell';
import { effectiveFocusIds, focusedNodeIds, isFocusEmpty } from './lib/focus';
import { readGraphView, writeGraphView, type GraphView } from './lib/graphView';
import { twinExploreTarget, type TwinIndicatorId } from './lib/dietTwin';
import {
  renderVisibleGraph,
} from './lib/layerFilter';
import type { LayoutMode } from './lib/layout';
import { loadGraph } from './lib/loadGraph';
import { isVeganDietHubPattern, normalizeVeganDietPatternId, VEGAN_DIET_HUB_ID } from './lib/dietPatternDetails';
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
import { applyTheme, readTheme, writeTheme, type AppTheme } from './lib/themePreference';
import type { GraphData, Selection } from './types/graph';

interface ExploreSnapshot {
  diseaseId: string | null;
  mechanismId: string | null;
  foodId: string | null;
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
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const pendingTwin = useRef<TwinIndicatorId | null>(null);
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
  const [clickFocusId, setClickFocusId] = useState<string | null>(null);
  const [themeHintDismissed, setThemeHintDismissed] = useState(false);
  const [themeChipsFlash, setThemeChipsFlash] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [appTheme, setAppTheme] = useState<AppTheme>(() => readTheme());
  const [sideOpen, setSideOpen] = useState(false);
  const moreRoot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoad({ status: 'loading' });
    loadGraph()
      .then((graph) => {
        if (cancelled) return;
        const parsed = initialQuery.current;
        if (screenRef.current === resolveScreen(parsed)) {
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
        }
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
    writeGraphView(graphView);
  }, [graphView]);

  const graph = load.status === 'ready' ? load.graph : null;

  useEffect(() => {
    // A bar click can land before the seed fetch resolves. Hold it and open the node once the graph exists.
    if (!graph || !pendingTwin.current) return;
    const indicator = pendingTwin.current;
    pendingTwin.current = null;
    openTwinIndicator(indicator);
  }, [graph]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (moreOpen) {
        setMoreOpen(false);
        return;
      }
      if (aboutOpen) {
        setAboutOpen(false);
        return;
      }
      if (mobile && sideOpen) {
        setSideOpen(false);
        return;
      }
      if (selection) setSelection(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aboutOpen, mobile, moreOpen, selection, sideOpen]);

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
    if (!mobile) {
      setMoreOpen(false);
      setSideOpen(false);
    }
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
    if (screen !== 'pattern') return;
    const normalized = normalizeVeganDietPatternId(patternId);
    if (!normalized) {
      setPatternId(null);
      setScreen('home');
      return;
    }
    if (patternId !== normalized) setPatternId(normalized);
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

  /** Bright/dim only — click-focus dims outsiders; does not hard-hide nodes. */
  const brightFocusIds = useMemo(
    () => (graph ? effectiveFocusIds(focusIds, clickFocusId, graph.links) : null),
    [clickFocusId, focusIds, graph],
  );

  const clickFocusLabel = useMemo(() => {
    if (!graph || !clickFocusId) return null;
    return graph.nodes.find((node) => node.id === clickFocusId)?.label ?? null;
  }, [clickFocusId, graph]);

  const rendered = useMemo(() => {
    if (!graph) return null;
    const pinned = selectionPinIds(selection, graph.links, hideUnmatched, focusIds);
    const view = renderVisibleGraph({
      nodes: graph.nodes,
      links: graph.links,
      focusIds,
      hideUnmatched,
      pinnedIds: pinned,
    });
    return {
      nodeIds: view.nodeIds,
      links: view.links,
      linkIndices: new Set(view.links.map((link) => link.graphIndex)),
    };
  }, [focusIds, graph, hideUnmatched, selection]);

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

  const onSelectHit = (hit: SearchHit) => {
    if (hit.kind === 'node' && hit.id) {
      setClickFocusId(hit.id);
      setSelection({ kind: 'node', id: hit.id });
    }
    if (hit.kind === 'link' && hit.index != null) setSelection({ kind: 'link', index: hit.index });
    setMoreOpen(false);
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

  const focusThemeList = () => {
    const root = document.querySelector('[data-testid="theme-chips"]');
    const target =
      root?.querySelector<HTMLElement>('[aria-pressed="true"]') ??
      root?.querySelector<HTMLElement>('button');
    target?.focus();
  };

  const chooseTheme = () => {
    if (mobile) {
      setSideOpen(true);
      window.setTimeout(focusThemeList, 0);
      return;
    }
    // Desktop rail is always open, so sideOpen alone changed nothing: scroll, flash, focus.
    const root = document.querySelector<HTMLElement>('[data-testid="theme-chips"]');
    root?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    setThemeChipsFlash(true);
    window.setTimeout(() => setThemeChipsFlash(false), 1200);
    window.setTimeout(focusThemeList, 0);
  };

  const onTheme = (theme: ExploreTheme | null) => {
    if (!theme) {
      setDiseaseId(null);
      setMechanismId(null);
      setFoodId(null);
    } else {
      setDiseaseId(theme.diseaseId);
      setMechanismId(theme.mechanismId);
      setFoodId(theme.foodId);
    }
    if (mobile) setSideOpen(false);
  };

  const clearPatternHighlight = () => {
    setPatterns([]);
    setPatternSourceTheme(null);
    setReturnSnapshot(null);
  };

  const selectNode = (id: string) => {
    setClickFocusId(id);
    setSelection({ kind: 'node', id });
  };

  const selectLink = (index: number) => {
    setSelection({ kind: 'link', index });
  };

  const clearClickFocus = () => {
    setClickFocusId(null);
  };

  const clearSelectionAndClickFocus = () => {
    setClickFocusId(null);
    setSelection(null);
  };

  const enterTheme = (theme: ExploreTheme) => {
    setDiseaseId(theme.diseaseId);
    setMechanismId(theme.mechanismId);
    setFoodId(theme.foodId);
    setLayout('hierarchy');
    setGraphView('2d');
    setHideUnmatched(true);
    setClickFocusId(null);
    setSelection(null);
    setMoreOpen(false);
    setPatternId(null);
    setPatternReturnSnapshot(null);
    setScreen('explore');
    clearPatternHighlight();
  };

  const goHome = () => {
    setClickFocusId(null);
    setThemeHintDismissed(false);
    setSelection(null);
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
    layout,
    graphView,
    hideUnmatched,
    selection,
  });

  const openVeganDietDetail = (fromExplore: boolean) => {
    if (fromExplore) setPatternReturnSnapshot(captureExplore());
    else setPatternReturnSnapshot(null);
    setPatternId(VEGAN_DIET_HUB_ID);
    setClickFocusId(null);
    setSelection(null);
    setMoreOpen(false);
    setScreen('pattern');
    clearPatternHighlight();
  };

  const openCompare = () => {
    openVeganDietDetail(false);
  };

  const openTwin = () => {
    setClickFocusId(null);
    setSelection(null);
    setMoreOpen(false);
    setPatternId(null);
    setPatternReturnSnapshot(null);
    setScreen('twin');
    clearPatternHighlight();
  };

  const openTwinIndicator = (indicator: TwinIndicatorId) => {
    if (!graph) {
      pendingTwin.current = indicator;
      return;
    }
    const known = new Set(graph.nodes.map((node) => node.id));
    const target = twinExploreTarget(indicator, known);
    const theme = themeById(target.themeId);
    if (!theme && !target.nodeId) return;
    if (target.nodeId) {
      if (theme) {
        setDiseaseId(theme.diseaseId);
        setMechanismId(theme.mechanismId);
        setFoodId(theme.foodId);
        setHideUnmatched(true);
      } else {
        setDiseaseId(null);
        setMechanismId(null);
        setFoodId(null);
        setHideUnmatched(false);
      }
      setLayout('hierarchy');
      setGraphView('2d');
      selectNode(target.nodeId);
      setMoreOpen(false);
      setPatternId(null);
      setPatternReturnSnapshot(null);
      setScreen('explore');
      clearPatternHighlight();
      return;
    }
    if (theme) enterTheme(theme);
  };

  const returnFromPatternToGraph = () => {
    const snapshot = patternReturnSnapshot;
    if (!snapshot) return;
    setPatternReturnSnapshot(null);
    setPatternId(null);
    setDiseaseId(snapshot.diseaseId);
    setMechanismId(snapshot.mechanismId);
    setFoodId(snapshot.foodId);
    setLayout(snapshot.layout);
    setGraphView(snapshot.graphView);
    setHideUnmatched(snapshot.hideUnmatched);
    setClickFocusId(null);
    setSelection(snapshot.selection);
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
        setLayout(snapshot.layout);
      setGraphView(snapshot.graphView);
      setHideUnmatched(snapshot.hideUnmatched);
      setClickFocusId(null);
    setSelection(snapshot.selection);
      setMoreOpen(false);
      setScreen('explore');
      return;
    }
    if (source) enterTheme(source);
  };

  const exploring = screen === 'explore';
  const showVeganDietDetail = screen === 'pattern' && isVeganDietHubPattern(patternId);
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
  const showThemeEmpty = !safeDisease && !safeMechanism && !safeFood;
  const themeHintShown = themeHintVisible({
    noTheme: showThemeEmpty,
    filterEmpty,
    clickFocusId,
    hasSelection: selection != null,
    dismissed: themeHintDismissed,
  });

  // Dismissal lasts for this no-theme stretch; picking a theme re-arms it for next time.
  useEffect(() => {
    if (!showThemeEmpty) setThemeHintDismissed(false);
  }, [showThemeEmpty]);

  const onAppTheme = useCallback((next: AppTheme) => {
    setAppTheme(next);
    applyTheme(next);
    writeTheme(next);
  }, []);

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
  const copyControl =
    screen === 'twin' ? null : (
      <button type="button" className="btn btn--ghost" onClick={copyViewLink}>
        {copied ? '已复制' : '复制链接'}
      </button>
    );

  return (
    <div className="app">
      <header
        className={
          exploring && mobile ? 'topbar topbar--narrow' : exploring ? 'topbar topbar--compact' : 'topbar'
        }
      >
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <p className="brand-title" data-testid="brand-title" title="明膳知源" aria-label="明膳知源">
              <span className="brand-title-full">明膳知源</span>
              <span className="brand-title-short">
                <span aria-hidden="true">明膳</span>
                <span className="sr-only">明膳知源</span>
              </span>
            </p>
            <p className="brand-sub">仅供学习：饮食、机制与健康结局的关联图谱</p>
          </div>
        </div>
        {exploring && graph && (
          <div className="header-tools">
            <SearchBar
              hits={search.hits}
              truncated={search.truncated}
              onQuery={onQuery}
              onSelect={onSelectHit}
            />
          </div>
        )}
        <div className="header-actions">
          {exploring && (
            <button
              type="button"
              className="btn btn--ghost"
              data-testid="back-to-home"
              aria-label="返回主题大厅"
              onClick={goHome}
            >
              {BACK_TO_LOBBY}
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
                  {exploring && viewControls}
                  {rotateControl}
                  {copyControl}
                  <ThemeOptions theme={appTheme} onChange={onAppTheme} />
                </div>
              )}
            </div>
          ) : exploring ? null : (
            <>
              {copyControl}
            </>
          )}
          {!mobile && <ThemeSwitcher theme={appTheme} onChange={onAppTheme} />}
        </div>
      </header>

      <div
        className={
          exploring && graph && rendered
            ? selection
              ? 'stage stage--explore stage--detail'
              : 'stage stage--explore'
            : 'stage'
        }
      >
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
        {(screen === 'home' || (screen === 'pattern' && !showVeganDietDetail)) && (
          <ThemeLobby
            onEnter={enterTheme}
            onOpenCompare={openCompare}
            onOpenTwin={openTwin}
            highlightedPatterns={patterns}
            patternSourceTheme={patternSourceTheme}
            onReturnToGraph={returnToGraph}
          />
        )}
        {screen === 'twin' && <DietTwin onBack={goHome} onOpenIndicator={openTwinIndicator} />}
        {showVeganDietDetail && (
          <VeganDietDetail
            onBack={goHome}
            onEnterTheme={enterTheme}
            onReturnToGraph={patternReturnSnapshot ? returnFromPatternToGraph : undefined}
          />
        )}
        {exploring && graph && rendered && (
          <>
            <aside
              id="explore-rail"
              className={sideOpen ? 'explore-rail is-open' : 'explore-rail'}
              data-testid="explore-rail"
              aria-label="主题与筛选"
              hidden={mobile && !sideOpen}
            >
              <ThemeBar
                themes={EXPLORE_THEMES}
                diseaseId={safeDisease}
                mechanismId={safeMechanism}
                foodId={safeFood}
                layout={layout}
                hideUnmatched={hideUnmatched}
                onTheme={onTheme}
                onHideUnmatched={setHideUnmatched}
                flash={themeChipsFlash}
              />
              <FilterPanel
                diseases={diseases}
                mechanisms={mechanisms}
                diseaseId={safeDisease}
                mechanismId={safeMechanism}
                onDisease={selectDisease}
                onMechanism={selectMechanism}
                onClear={clearFilters}
              />
              <div className="rail-tools">
                {viewControls}
                {rotateControl}
                {copyControl}
              </div>
            </aside>
            <div className="stage-main" data-testid="explore-screen">
              <GraphCanvas
                graph={graph}
                focusIds={brightFocusIds}
                selection={selection}
                layout={layout}
                graphView={graphView}
                shownNodeIds={rendered.nodeIds}
                shownLinks={rendered.links}
                compact={mobile}
                autoRotate={autoRotate}
                anchorId={anchorId}
                onSelectNode={selectNode}
                onSelectLink={selectLink}
                onBackground={clearSelectionAndClickFocus}
              />
              <button
                type="button"
                className="btn btn--ghost rail-toggle"
                data-testid="rail-toggle"
                aria-expanded={sideOpen}
                aria-controls="explore-rail"
                onClick={() => setSideOpen((open) => !open)}
              >
                {RAIL_TOGGLE_LABEL}
              </button>
              {mobile && sideOpen && (
                <button
                  type="button"
                  className="rail-backdrop"
                  aria-label="关闭主题筛选"
                  onClick={() => setSideOpen(false)}
                />
              )}
              {clickFocusId && clickFocusLabel && (
                <div className="click-focus-banner" data-testid="click-focus-banner" role="status">
                  <span className="click-focus-label">
                    {CLICK_FOCUS_PREFIX}
                    {clickFocusLabel}
                  </span>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    data-testid="clear-click-focus"
                    onClick={clearClickFocus}
                  >
                    {CLEAR_CLICK_FOCUS}
                  </button>
                </div>
              )}
              <div className="hud">
                <Legend />
                <p className="counts" data-testid="graph-stats">
                  {visibleGraphStats(rendered.nodeIds.size, rendered.links.length)}
                </p>
                <p className="hud-note">颜色表示关联方向，线越粗表示强度越高。形状区分节点类型。</p>
              </div>
              {themeHintShown && (
                <div className="empty-theme" role="status" data-testid="theme-empty">
                  <p>{EXPLORE_EMPTY_COPY}</p>
                  <button type="button" className="btn btn--primary" data-testid="choose-theme" onClick={chooseTheme}>
                    {EXPLORE_EMPTY_ACTION}
                  </button>
                  <button
                    type="button"
                    className="empty-theme-close"
                    aria-label={THEME_HINT_CLOSE}
                    data-testid="theme-empty-close"
                    onClick={() => setThemeHintDismissed(true)}
                  >
                    ×
                  </button>
                </div>
              )}
              {filterEmpty && (
                <div className="empty-filter" role="status">
                  <p>无匹配，清除过滤</p>
                  <button type="button" className="btn btn--primary" onClick={clearFilters}>
                    清除全部
                  </button>
                </div>
              )}
            </div>
            {selection && (
              <DetailDrawer
                graph={graph}
                selection={selection}
                mobile={mobile}
                evidenceCounts={counts}
                visibleLinkIndices={rendered.linkIndices}
                onClose={() => setSelection(null)}
                onSelectNode={selectNode}
                onSelectLink={selectLink}
                onShowPatterns={relatedPatternIds.length > 0 ? showRelatedPatterns : undefined}
                relatedPatternIds={relatedPatternIds}
                onOpenPattern={relatedPatternIds.length > 0 ? () => openVeganDietDetail(true) : undefined}
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
