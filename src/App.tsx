import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DetailDrawer } from './components/DetailDrawer';
import { DietTwin } from './components/DietTwin';
import { DisclaimerBar } from './components/DisclaimerBar';
import { FilterPanel } from './components/FilterPanel';
import { GraphCanvas } from './components/GraphCanvas';
import { LayoutToggle } from './components/LayoutToggle';
import { Legend } from './components/Legend';
import { readLegendExpanded } from './lib/legendChrome';
import { SourceDetail } from './components/SourceDetail';
import { AdminShell } from './components/AdminShell';
import { AdminBooksList } from './components/AdminBooksList';
import { AdminBookDetail } from './components/AdminBookDetail';
import { AdminEdges } from './components/AdminEdges';
import { AdminNodes } from './components/AdminNodes';
import { AdminValidate } from './components/AdminValidate';
import { AdminSettings } from './components/AdminSettings';
import { AdminCandidates } from './components/AdminCandidates';
import { VeganDietDetail } from './components/VeganDietDetail';
import { SearchBar } from './components/SearchBar';
import { DomainEmptyState } from './components/DomainEmptyState';
import { DomainOptions, DomainSwitcher } from './components/DomainSwitcher';
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
import { filterGraphByDomain } from './lib/domain';
import { loadGraph } from './lib/loadGraph';
import { loadSources, sourceById } from './lib/loadSources';
import { loadAdminBooks, adminBookById } from './lib/loadAdminBooks';
import { findLinkByKey, nodeById } from './lib/adminCatalog';
import { isVeganDietHubPattern, normalizeVeganDietPatternId, VEGAN_DIET_HUB_ID } from './lib/dietPatternDetails';
import { patternsForTheme } from './lib/patternLinks';
import { searchGraph, type SearchHit } from './lib/search';
import {
  findLinkIndex,
  linkKey,
  parseViewQuery,
  resolveScreen,
  serializeViewQuery,
  type AdminSection,
  type ParsedShare,
} from './lib/shareUrl';
import { EXPLORE_THEMES, filtersFromShare, themeById, themeForFilters, type ExploreTheme } from './lib/themes';
import { selectionPinIds } from './lib/visibility';
import { applyTheme, readTheme, writeTheme, type AppTheme } from './lib/themePreference';
import type { AdminBooksData, Domain, GraphData, Selection, SourcesData } from './types/graph';

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
  const [legendExpanded, setLegendExpanded] = useState(() => readLegendExpanded());
  const onLegendExpandedChange = useCallback((expanded: boolean) => {
    setLegendExpanded(expanded);
  }, []);
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
  const [sourceId, setSourceId] = useState<string | null>(() => {
    const parsed = initialQuery.current;
    return resolveScreen(parsed) === 'source' ? parsed.source : null;
  });
  const [sourceReturnSnapshot, setSourceReturnSnapshot] = useState<ExploreSnapshot | null>(null);
  const [sources, setSources] = useState<SourcesData | null>(null);
  const [adminBooks, setAdminBooks] = useState<AdminBooksData | null>(null);
  const [bookId, setBookId] = useState<string | null>(() => {
    const parsed = initialQuery.current;
    return resolveScreen(parsed) === 'admin' ? parsed.book : null;
  });
  const [adminSection, setAdminSection] = useState<AdminSection>(() => {
    const parsed = initialQuery.current;
    if (resolveScreen(parsed) !== 'admin') return 'books';
    return parsed.adminSection ?? 'books';
  });
  const [adminEdge, setAdminEdge] = useState<string | null>(() => {
    const parsed = initialQuery.current;
    if (resolveScreen(parsed) !== 'admin') return null;
    return (parsed.adminSection ?? 'books') === 'edges' ? parsed.edge : null;
  });
  const [adminNodeId, setAdminNodeId] = useState<string | null>(() => {
    const parsed = initialQuery.current;
    if (resolveScreen(parsed) !== 'admin') return null;
    return (parsed.adminSection ?? 'books') === 'nodes' ? parsed.node : null;
  });
  const [selection, setSelection] = useState<Selection | null>(null);
  const [clickFocusId, setClickFocusId] = useState<string | null>(null);
  const [themeHintDismissed, setThemeHintDismissed] = useState(false);
  const [themeChipsFlash, setThemeChipsFlash] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [shellMenuOpen, setShellMenuOpen] = useState(false);
  const [appTheme, setAppTheme] = useState<AppTheme>(() => readTheme());
  const [activeDomain, setActiveDomain] = useState<Domain>(() => initialQuery.current.domain);
  const [sideOpen, setSideOpen] = useState(false);
  const shellMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoad({ status: 'loading' });
    Promise.all([loadGraph(), loadSources(), loadAdminBooks()])
      .then(([graph, sourcesData, adminBooksData]) => {
        if (cancelled) return;
        setSources(sourcesData);
        setAdminBooks(adminBooksData);
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
          if (parsed.screen === 'source') {
            const known = sourceById(sourcesData, parsed.source);
            if (known) {
              setSourceId(known.id);
              setScreen('source');
            } else {
              setSourceId(null);
              setScreen('home');
            }
          }
          if (parsed.screen === 'admin') {
            setScreen('admin');
            const section = parsed.adminSection ?? 'books';
            setAdminSection(section);
            if (section === 'books' && parsed.book) {
              const knownBook = adminBookById(adminBooksData, parsed.book);
              setBookId(knownBook ? knownBook.id : null);
            } else if (section === 'candidates' && parsed.book) {
              setBookId(parsed.book);
            } else {
              setBookId(null);
            }
            setAdminEdge(section === 'edges' ? parsed.edge : null);
            setAdminNodeId(section === 'nodes' && parsed.node && graph.nodes.some((node) => node.id === parsed.node) ? parsed.node : null);
          }
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
      if (shellMenuOpen) {
        setShellMenuOpen(false);
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
  }, [aboutOpen, mobile, shellMenuOpen, selection, sideOpen]);

  useEffect(() => {
    if (!shellMenuOpen) return;
    const onPointer = (event: PointerEvent) => {
      const root = shellMenuRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) {
        setShellMenuOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, [shellMenuOpen]);

  const closeShellMenu = useCallback(() => {
    setShellMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!mobile) {
      setShellMenuOpen(false);
      setSideOpen(false);
    }
  }, [mobile]);

  const domainView = useMemo(
    () => (graph ? filterGraphByDomain(graph, activeDomain) : null),
    [activeDomain, graph],
  );
  const domainEmpty = domainView != null && domainView.nodes.length === 0;
  const exploreNodes = domainView?.nodes ?? [];

  const diseases = useMemo(
    () => exploreNodes.filter((node) => node.type === 'disease'),
    [exploreNodes],
  );
  const mechanisms = useMemo(
    () => exploreNodes.filter((node) => node.type === 'mechanism'),
    [exploreNodes],
  );

  const safeDisease = diseases.some((node) => node.id === diseaseId) ? diseaseId : null;
  const safeMechanism = mechanisms.some((node) => node.id === mechanismId) ? mechanismId : null;
  const safeFood = exploreNodes.some((node) => node.id === foodId) ? foodId : null;

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
    if (screen !== 'source') return;
    if (!sources) return;
    if (!sourceId || !sourceById(sources, sourceId)) {
      setSourceId(null);
      setSourceReturnSnapshot(null);
      setScreen('home');
    }
  }, [screen, sourceId, sources]);

  useEffect(() => {
    if (screen !== 'admin') return;
    if (!adminBooks) return;
    if (bookId && !adminBookById(adminBooks, bookId)) {
      setBookId(null);
    }
  }, [screen, bookId, adminBooks]);

  useEffect(() => {
    if (screen !== 'admin' || !graph) return;
    if (adminEdge && !findLinkByKey(graph, adminEdge)) setAdminEdge(null);
    if (adminNodeId && !nodeById(graph, adminNodeId)) setAdminNodeId(null);
  }, [adminEdge, adminNodeId, graph, screen]);

  useEffect(() => {
    if (screen !== 'admin') return;
    const robots = document.querySelector('meta[name="robots"]');
    const previous = robots?.getAttribute('content') ?? null;
    if (robots) robots.setAttribute('content', 'noindex,nofollow');
    else {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex,nofollow';
      document.head.appendChild(meta);
    }
    return () => {
      const current = document.querySelector('meta[name="robots"]');
      if (!current) return;
      if (previous == null) current.remove();
      else current.setAttribute('content', previous);
    };
  }, [screen]);

  useEffect(() => {
    if (screen === 'explore' && !graph) return;
    const exploring = screen === 'explore' && graph != null;
    const link = exploring && selection?.kind === 'link' ? graph.links[selection.index] : undefined;
    const next = serializeViewQuery({
      screen,
      domain: activeDomain,
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
      source: screen === 'source' ? sourceId : null,
      book: screen === 'admin' && (adminSection === 'books' || adminSection === 'candidates') ? bookId : null,
      adminSection: screen === 'admin' ? adminSection : 'books',
      edge: screen === 'admin' && adminSection === 'edges' ? adminEdge : null,
      layout,
      view: graphView,
      hideUnmatched: exploring ? hideUnmatched : false,
      node:
        exploring && selection?.kind === 'node'
          ? selection.id
          : screen === 'admin' && adminSection === 'nodes'
            ? adminNodeId
            : null,
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
    activeDomain,
    adminEdge,
    adminNodeId,
    adminSection,
    bookId,
    screen,
    selection,
    sourceId,
  ]);

  const focusIds = useMemo(
    () => (domainView ? focusedNodeIds(domainView.links, safeDisease, safeMechanism, safeFood) : null),
    [domainView, safeDisease, safeFood, safeMechanism],
  );

  /** Bright/dim only — click-focus dims outsiders; does not hard-hide nodes. */
  const brightFocusIds = useMemo(
    () => (domainView ? effectiveFocusIds(focusIds, clickFocusId, domainView.links) : null),
    [clickFocusId, domainView, focusIds],
  );

  const clickFocusLabel = useMemo(() => {
    if (!graph || !clickFocusId) return null;
    return graph.nodes.find((node) => node.id === clickFocusId)?.label ?? null;
  }, [clickFocusId, graph]);

  const rendered = useMemo(() => {
    if (!graph || !domainView) return null;
    const pinned = selectionPinIds(selection, graph.links, hideUnmatched, focusIds);
    const view = renderVisibleGraph({
      nodes: domainView.nodes,
      links: graph.links,
      focusIds,
      hideUnmatched,
      pinnedIds: pinned,
    });
    const links = view.links.filter((link) => domainView.linkIndices.has(link.graphIndex));
    return {
      nodeIds: view.nodeIds,
      links,
      linkIndices: new Set(links.map((link) => link.graphIndex)),
    };
  }, [domainView, focusIds, graph, hideUnmatched, selection]);

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
    setShellMenuOpen(false);
  };

  const clearFilters = () => {
    setDiseaseId(null);
    setMechanismId(null);
    setFoodId(null);
  };

  const onDomainChange = useCallback((next: Domain) => {
    setActiveDomain((prev) => {
      if (prev === next) return prev;
      setDiseaseId(null);
      setMechanismId(null);
      setFoodId(null);
      setSelection(null);
      setClickFocusId(null);
      setHideUnmatched(false);
      setQuery('');
      setSideOpen(false);
      setThemeHintDismissed(false);
      setShellMenuOpen(false);
      return next;
    });
  }, []);

  const returnToHealthDomain = useCallback(() => {
    onDomainChange('health');
  }, [onDomainChange]);

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
    setShellMenuOpen(false);
    setPatternId(null);
    setPatternReturnSnapshot(null);
    setScreen('explore');
    clearPatternHighlight();
  };

  const goHome = () => {
    setClickFocusId(null);
    setThemeHintDismissed(false);
    setSelection(null);
    setShellMenuOpen(false);
    setPatternId(null);
    setPatternReturnSnapshot(null);
    setSourceId(null);
    setSourceReturnSnapshot(null);
    setBookId(null);
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
    setShellMenuOpen(false);
    setScreen('pattern');
    clearPatternHighlight();
  };

  const openCompare = () => {
    openVeganDietDetail(false);
  };

  const openTwin = () => {
    setClickFocusId(null);
    setSelection(null);
    setShellMenuOpen(false);
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
      setShellMenuOpen(false);
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
    setShellMenuOpen(false);
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
    setShellMenuOpen(false);
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
      setShellMenuOpen(false);
      setScreen('explore');
      return;
    }
    if (source) enterTheme(source);
  };

  const openSourcePage = (id: string) => {
    if (!sourceById(sources, id)) return;
    if (screen === 'explore') setSourceReturnSnapshot(captureExplore());
    else setSourceReturnSnapshot(null);
    setSourceId(id);
    setClickFocusId(null);
    setSelection(null);
    setShellMenuOpen(false);
    setPatternId(null);
    setScreen('source');
    clearPatternHighlight();
  };

  const returnFromSource = () => {
    const snapshot = sourceReturnSnapshot;
    setSourceReturnSnapshot(null);
    setSourceId(null);
    if (!snapshot) {
      setScreen('explore');
      return;
    }
    setDiseaseId(snapshot.diseaseId);
    setMechanismId(snapshot.mechanismId);
    setFoodId(snapshot.foodId);
    setLayout(snapshot.layout);
    setGraphView(snapshot.graphView);
    setHideUnmatched(snapshot.hideUnmatched);
    setClickFocusId(null);
    setSelection(snapshot.selection);
    setShellMenuOpen(false);
    setScreen('explore');
  };

  const openCitedLink = (index: number) => {
    if (!graph) return;
    const link = graph.links[index];
    if (!link) return;
    setSourceReturnSnapshot(null);
    setSourceId(null);
    setBookId(null);
    setDiseaseId(null);
    setMechanismId(null);
    setFoodId(null);
    setHideUnmatched(false);
    setLayout('hierarchy');
    setGraphView('2d');
    setClickFocusId(null);
    setSelection({ kind: 'link', index });
    setShellMenuOpen(false);
    setScreen('explore');
    clearPatternHighlight();
  };

  const openAdminSection = (section: AdminSection) => {
    setAdminSection(section);
    setBookId(null);
    setAdminEdge(null);
    setAdminNodeId(null);
    setScreen('admin');
    setShellMenuOpen(false);
  };

  const openAdminBook = (id: string) => {
    if (!adminBookById(adminBooks, id)) return;
    setAdminSection('books');
    setAdminEdge(null);
    setAdminNodeId(null);
    setBookId(id);
    setScreen('admin');
    setShellMenuOpen(false);
  };

  const closeAdminBook = () => {
    setBookId(null);
    setScreen('admin');
  };

  const openAdminCandidate = (id: string) => {
    setAdminSection('candidates');
    setAdminEdge(null);
    setAdminNodeId(null);
    setBookId(id);
    setScreen('admin');
    setShellMenuOpen(false);
  };

  const closeAdminCandidate = () => {
    setBookId(null);
    setScreen('admin');
  };

  const openGraphNode = (id: string) => {
    if (!graph?.nodes.some((node) => node.id === id)) return;
    setSourceReturnSnapshot(null);
    setSourceId(null);
    setBookId(null);
    setAdminEdge(null);
    setAdminNodeId(null);
    setDiseaseId(null);
    setMechanismId(null);
    setFoodId(null);
    setHideUnmatched(false);
    setLayout('hierarchy');
    setGraphView('2d');
    setClickFocusId(null);
    setSelection({ kind: 'node', id });
    setShellMenuOpen(false);
    setScreen('explore');
    clearPatternHighlight();
  };

  const exploring = screen === 'explore';
  const showVeganDietDetail = screen === 'pattern' && isVeganDietHubPattern(patternId);
  const activeSource = sourceById(sources, sourceId);
  const showSourceDetail = screen === 'source' && activeSource != null && graph != null;
  const activeAdminBook = adminBookById(adminBooks, bookId);
  const showAdmin = screen === 'admin' && adminBooks != null;
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

  const filterEmpty = domainView != null && isFocusEmpty(focusIds, exploreNodes.map((node) => node.id));
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
    screen === 'twin' || screen === 'source' || screen === 'admin' ? null : (
      <button type="button" className="btn btn--ghost" onClick={copyViewLink}>
        {copied ? '已复制' : '复制链接'}
      </button>
    );

  return (
    <div className="app">
      <header
        className={
          mobile
            ? exploring
              ? 'topbar topbar--narrow topbar--mobile'
              : 'topbar topbar--mobile'
            : exploring
              ? 'topbar topbar--compact'
              : 'topbar'
        }
      >
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <div>
            <p className="brand-title" data-testid="brand-title" title="明膳知源" aria-label="明膳知源">
              明膳知源
            </p>
            {!exploring && !mobile && (
              <p className="brand-sub">仅供学习：饮食、机制与健康结局的关联图谱</p>
            )}
          </div>
        </div>
        {!mobile && (
          <nav className="shell-nav" aria-label="主视图">
            <button
              type="button"
              className="shell-nav-btn"
              aria-current={screen === 'home' || screen === 'pattern' ? 'page' : undefined}
              onClick={goHome}
            >
              主题大厅
            </button>
            <button
              type="button"
              className="shell-nav-btn"
              aria-current={exploring ? 'page' : undefined}
              disabled={!graph}
              onClick={() => {
                if (graph) setScreen('explore');
              }}
            >
              图谱探索
            </button>
          </nav>
        )}
        {!mobile && screen !== 'admin' && (
          <DomainSwitcher domain={activeDomain} onChange={onDomainChange} />
        )}
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
          {exploring && !mobile && (
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
            <div className="shell-menu" ref={shellMenuRef}>
              <button
                type="button"
                className="btn btn--ghost shell-menu-trigger"
                aria-expanded={shellMenuOpen}
                aria-controls="shell-menu-panel"
                aria-label="菜单"
                data-testid="shell-menu-trigger"
                onClick={() => setShellMenuOpen((open) => !open)}
              >
                <svg className="shell-menu-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M5 7h14M5 12h14M5 17h14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              {shellMenuOpen && (
                <>
                  <button
                    type="button"
                    className="shell-menu-backdrop"
                    aria-label="关闭菜单"
                    data-testid="shell-menu-backdrop"
                    onClick={closeShellMenu}
                  />
                  <div
                    id="shell-menu-panel"
                    className="shell-menu-panel"
                    data-testid="shell-menu-panel"
                    role="menu"
                    aria-label="应用菜单"
                  >
                    <p className="shell-menu-kicker">导航</p>
                    <nav className="shell-menu-nav" aria-label="主视图">
                      <button
                        type="button"
                        role="menuitem"
                        className="shell-menu-item"
                        aria-current={screen === 'home' || screen === 'pattern' ? 'true' : undefined}
                        onClick={() => {
                          goHome();
                          closeShellMenu();
                        }}
                      >
                        主题大厅
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="shell-menu-item"
                        aria-current={exploring ? 'true' : undefined}
                        disabled={!graph}
                        onClick={() => {
                          if (graph) {
                            setScreen('explore');
                            closeShellMenu();
                          }
                        }}
                      >
                        图谱探索
                      </button>
                    </nav>
                    {screen !== 'admin' && (
                      <DomainOptions
                        domain={activeDomain}
                        onChange={(next) => {
                          onDomainChange(next);
                          closeShellMenu();
                        }}
                      />
                    )}
                    {exploring && (
                      <>
                        <p className="shell-menu-kicker">探索</p>
                        {viewControls}
                        {rotateControl}
                      </>
                    )}
                    {copyControl}
                    <ThemeOptions theme={appTheme} onChange={onAppTheme} />
                  </div>
                </>
              )}
            </div>
          ) : exploring ? null : (
            <>{copyControl}</>
          )}
          {!mobile && <ThemeSwitcher theme={appTheme} onChange={onAppTheme} />}
        </div>
      </header>

      <div
        className={
          exploring && graph && rendered && !domainEmpty
            ? selection
              ? 'stage stage--explore stage--detail'
              : 'stage stage--explore'
            : exploring && domainEmpty
              ? 'stage stage--domain-empty'
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
            activeDomain={activeDomain}
            onReturnHealth={returnToHealthDomain}
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
        {showAdmin && adminBooks && (
          <AdminShell section={adminSection} onSection={openAdminSection}>
            {adminSection === 'books' && activeAdminBook ? (
              <AdminBookDetail
                book={activeAdminBook}
                sources={sources}
                graph={graph}
                onBack={closeAdminBook}
                onOpenPublicSource={openSourcePage}
                onOpenGraph={openCitedLink}
              />
            ) : null}
            {adminSection === 'books' && !activeAdminBook ? (
              <AdminBooksList
                books={adminBooks.books}
                sources={sources}
                graph={graph}
                onOpenBook={openAdminBook}
              />
            ) : null}
            {adminSection === 'edges' && graph ? (
              <AdminEdges
                graph={graph}
                selected={findLinkByKey(graph, adminEdge)}
                onOpen={setAdminEdge}
                onBack={() => setAdminEdge(null)}
                onOpenGraph={openCitedLink}
              />
            ) : null}
            {adminSection === 'edges' && !graph ? <p className="admin-empty">图谱仍在加载。</p> : null}
            {adminSection === 'nodes' && graph ? (
              <AdminNodes
                graph={graph}
                selected={adminNodeId ? nodeById(graph, adminNodeId) ?? null : null}
                onOpen={setAdminNodeId}
                onBack={() => setAdminNodeId(null)}
                onOpenGraph={openGraphNode}
                onOpenEdge={(key) => {
                  setAdminSection('edges');
                  setAdminNodeId(null);
                  setAdminEdge(key);
                }}
              />
            ) : null}
            {adminSection === 'nodes' && !graph ? <p className="admin-empty">图谱仍在加载。</p> : null}
            {adminSection === 'validate' && graph ? <AdminValidate graph={graph} sources={sources} /> : null}
            {adminSection === 'validate' && !graph ? <p className="admin-empty">图谱仍在加载。</p> : null}
            {adminSection === 'candidates' ? (
              <AdminCandidates
                selectedId={bookId}
                onOpen={openAdminCandidate}
                onBack={closeAdminCandidate}
              />
            ) : null}
            {adminSection === 'settings' ? (
              <AdminSettings graph={graph} sources={sources} books={adminBooks} appTheme={appTheme} />
            ) : null}
          </AdminShell>
        )}
        {showSourceDetail && activeSource && graph && (
          <SourceDetail
            source={activeSource}
            graph={graph}
            onBack={sourceReturnSnapshot ? returnFromSource : () => { setSourceId(null); setScreen('explore'); }}
            onOpenLink={openCitedLink}
          />
        )}
        {exploring && graph && domainEmpty && activeDomain !== 'health' && (
          <div className="stage-main stage-main--domain-empty" data-testid="explore-screen">
            <DomainEmptyState domain={activeDomain} onReturnHealth={returnToHealthDomain} />
          </div>
        )}
        {exploring && graph && rendered && !domainEmpty && (
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
                appTheme={appTheme}
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
              <div className={mobile && !legendExpanded ? 'hud hud--legend-collapsed' : 'hud'}>
                <Legend compact={mobile} onExpandedChange={onLegendExpandedChange} />
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
                onOpenSource={openSourcePage}
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
