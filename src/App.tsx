import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DetailDrawer } from './components/DetailDrawer';
import { DietTwinIcon, DietTwinModal, useDietTwinController } from './components/DietTwin';
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
import { DomainSwitcher } from './components/DomainSwitcher';
import { ThemeBar } from './components/ThemeBar';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { Shell } from './components/Shell';
import { ShellRail } from './components/ShellRail';
import { RailRecommendations } from './components/RailRecommendations';
import { useMediaQuery } from './hooks/useMediaQuery';
import { evidenceCounts } from './lib/copy';
import { type FlowEdgeInput } from './lib/flowLayout';
import { selectHierarchyLinks } from './lib/hierarchyBudget';
import {
  CLEAR_CLICK_FOCUS,
  CLICK_FOCUS_PREFIX,
  HIERARCHY_BUDGET_NOTE,
  LOBBY_SEARCH_EMPTY,
  LOBBY_SEARCH_PLACEHOLDER,
  RAIL_TOGGLE_LABEL,
  SHELL_SEARCH_LABEL,
  SHELL_VEGAN_ENTRY,
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
import { searchNodes, type SearchHit } from './lib/search';
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
import {
  railMode,
  readShellRailPreference,
  writeShellRailPreference,
  type ShellRailFocusTarget,
  type ShellRailPreference,
} from './lib/shellRail';
import type { AdminBooksData, Domain, GraphData, Selection, SourcesData } from './types/graph';

interface ExploreSnapshot {
  diseaseId: string | null;
  mechanismId: string | null;
  foodId: string | null;
  lensId: string | null;
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
  const wide = useMediaQuery('(min-width: 1280px)');
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
    if (
      (initialQuery.current.theme || initialQuery.current.lens) &&
      resolveScreen(initialQuery.current) === 'explore'
    ) {
      return 'flow';
    }
    return readGraphView();
  });
  const [hideUnmatched, setHideUnmatched] = useState(() => initialQuery.current.hideUnmatched);
  const [query, setQuery] = useState('');
  const [diseaseId, setDiseaseId] = useState<string | null>(() => initialFilters.current.disease);
  const [mechanismId, setMechanismId] = useState<string | null>(() => initialFilters.current.mechanism);
  const [foodId, setFoodId] = useState<string | null>(() => initialFilters.current.food);
  const [lensId, setLensId] = useState<string | null>(() =>
    resolveScreen(initialQuery.current) === 'explore' ? initialQuery.current.lens : null,
  );
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
  const [aboutOpen, setAboutOpen] = useState(false);
  const [twinOpen, setTwinOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [appTheme, setAppTheme] = useState<AppTheme>(() => readTheme());
  const [activeDomain, setActiveDomain] = useState<Domain>(() => initialQuery.current.domain);
  const [railPreference, setRailPreference] = useState<ShellRailPreference | null>(() => readShellRailPreference());
  const [railDrawerOpen, setRailDrawerOpen] = useState(false);
  const [railFocusTarget, setRailFocusTarget] = useState<{
    target: ShellRailFocusTarget;
    nonce: number;
  } | null>(null);
  const railRef = useRef<HTMLElement>(null);
  const railTriggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const twin = useDietTwinController();
  const prevMobile = useRef(mobile);

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
          const validLens =
            resolveScreen(parsed) === 'explore' &&
            parsed.lens &&
            graph.nodes.some((node) => node.id === parsed.lens)
              ? parsed.lens
              : null;
          const shared = filtersFromShare({ ...parsed, lens: validLens });
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
          setLensId(validLens);
          setSelection(nextSelection);
          if (parsed.screen === 'source') {
            const known = sourceById(sourcesData, parsed.source);
            if (known) {
              setSourceId(known.id);
              setScreen('source');
            } else {
              setSourceId(null);
              setScreen('explore');
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

  // The twin is now a modal, not a workspace. Legacy `?screen=twin` deep links
  // open the modal and land back on the graph.
  useEffect(() => {
    if (screen === 'twin') {
      setTwinOpen(true);
      setScreen('explore');
    }
  }, [screen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (aboutOpen) {
        setAboutOpen(false);
        return;
      }
      if (mobile && railDrawerOpen) return;
      if (selection) setSelection(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aboutOpen, mobile, railDrawerOpen, selection]);

  useEffect(() => {
    if (mobile && !prevMobile.current) setRailDrawerOpen(false);
    prevMobile.current = mobile;
  }, [mobile]);

  const railPresentation = railMode(mobile ? 0 : wide ? 1280 : 1024, railPreference);
  const railExpanded = railPresentation === 'expanded';

  const persistRailPreference = useCallback((next: ShellRailPreference) => {
    setRailPreference(next);
    writeShellRailPreference(next);
  }, []);

  const openRail = useCallback(
    (target?: ShellRailFocusTarget) => {
      if (mobile) {
        setRailDrawerOpen(true);
      } else if (railPresentation === 'collapsed') {
        persistRailPreference('expanded');
      }
      if (target) setRailFocusTarget({ target, nonce: Date.now() });
    },
    [mobile, persistRailPreference, railPresentation],
  );

  useEffect(() => {
    if (!railFocusTarget) return;
    const visible = mobile ? railDrawerOpen : railPresentation === 'expanded';
    if (!visible) return;
    const timer = window.setTimeout(() => {
      if (railFocusTarget.target === 'search') {
        searchInputRef.current?.focus();
      } else {
        const root = document.querySelector<HTMLElement>('[data-testid="theme-chips"]');
        const target =
          root?.querySelector<HTMLElement>('[aria-pressed="true"]') ??
          root?.querySelector<HTMLElement>('button');
        root?.scrollIntoView({ block: 'nearest' });
        target?.focus();
      }
      setRailFocusTarget(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [mobile, railDrawerOpen, railFocusTarget, railPresentation]);

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
  const safeLens = exploreNodes.some((node) => node.id === lensId) ? lensId : null;

  useEffect(() => {
    if (screen !== 'pattern') return;
    const normalized = normalizeVeganDietPatternId(patternId);
    if (!normalized) {
      setPatternId(null);
      setScreen('explore');
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
      setScreen('explore');
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
        ? safeLens
          ? null
          : (themeForFilters(safeDisease, safeMechanism, safeFood)?.id ?? null)
        : null,
      disease: exploring && !safeLens ? safeDisease : null,
      mechanism: exploring && !safeLens ? safeMechanism : null,
      food: exploring && !safeLens ? safeFood : null,
      lens: exploring ? safeLens : null,
      pattern: screen === 'pattern' ? patternId : null,
      patterns: [],
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
    safeDisease,
    safeFood,
    safeLens,
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
    () => (domainView ? focusedNodeIds(domainView.links, safeDisease, safeMechanism, safeFood, safeLens) : null),
    [domainView, safeDisease, safeFood, safeLens, safeMechanism],
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

  const flowAnchorIds = useMemo(() => {
    const ids = [safeLens, safeDisease, safeMechanism, safeFood];
    return ids.filter((id): id is string => Boolean(id));
  }, [safeDisease, safeFood, safeLens, safeMechanism]);

  const hierarchyPick = useMemo(() => {
    // Budget only the narrowed neighborhood. The unfiltered hierarchy keeps every edge.
    if (graphView !== '2d' || !rendered || !hideUnmatched || focusIds == null) return null;
    const links: FlowEdgeInput[] = rendered.links.map((link) => ({
      source: link.source,
      target: link.target,
      graphIndex: link.graphIndex,
      direction: link.direction,
      strength: link.strength,
      relation: link.relation,
      evidenceCount: link.evidences?.length ?? 1,
    }));
    const pinIndex = selection?.kind === 'link' ? selection.index : null;
    return selectHierarchyLinks(links, flowAnchorIds, pinIndex);
  }, [flowAnchorIds, focusIds, graphView, hideUnmatched, rendered, selection]);

  const drawnLinks = useMemo(() => {
    if (!rendered) return [];
    if (graphView !== '2d' || !hierarchyPick) return rendered.links;
    const kept = new Set(hierarchyPick.links.map((link) => link.graphIndex));
    return rendered.links.filter((link) => kept.has(link.graphIndex));
  }, [graphView, hierarchyPick, rendered]);

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
    if (!graph) return { hits: [] as SearchHit[], truncated: false };
    return { hits: searchNodes(query, exploreNodes), truncated: false };
  }, [exploreNodes, graph, query]);

  const counts = useMemo(() => (graph ? evidenceCounts(graph.links) : {}), [graph]);

  const anchorId = useMemo(() => {
    if (!graph || !selection) return safeLens ?? safeMechanism ?? safeDisease ?? safeFood;
    if (selection.kind === 'node') return selection.id;
    return graph.links[selection.index]?.target ?? safeLens ?? safeMechanism ?? safeDisease ?? safeFood;
  }, [graph, safeDisease, safeFood, safeLens, safeMechanism, selection]);

  const onQuery = useCallback((value: string) => setQuery(value), []);

  const onGraphView = (next: GraphView) => {
    setGraphView(next);
    setLayout('hierarchy');
  };

  const leaveLens = () => {
    if (!lensId) return;
    setLensId(null);
    setClickFocusId(null);
    setSelection(null);
  };

  const clearFilters = () => {
    leaveLens();
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
      setLensId(null);
      setSelection(null);
      setClickFocusId(null);
      setHideUnmatched(false);
      setQuery('');
      return next;
    });
  }, []);

  const returnToHealthDomain = useCallback(() => {
    onDomainChange('health');
  }, [onDomainChange]);

  const selectDisease = (id: string | null) => {
    leaveLens();
    setDiseaseId(id);
    if (id) setFoodId(null);
  };

  const selectMechanism = (id: string | null) => {
    leaveLens();
    setMechanismId(id);
    if (id) setFoodId(null);
  };

  const onTheme = (theme: ExploreTheme | null) => {
    leaveLens();
    if (!theme) {
      setDiseaseId(null);
      setMechanismId(null);
      setFoodId(null);
    } else {
      setDiseaseId(theme.diseaseId);
      setMechanismId(theme.mechanismId);
      setFoodId(theme.foodId);
    }
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
    setLensId(null);
    setLayout('hierarchy');
    setGraphView('flow');
    setHideUnmatched(true);
    setClickFocusId(null);
    setSelection(null);
    setPatternId(null);
    setPatternReturnSnapshot(null);
    setScreen('explore');
    setRailDrawerOpen(false);
  };

  const enterLens = (nodeId: string) => {
    if (!graph?.nodes.some((node) => node.id === nodeId)) return;
    setDiseaseId(null);
    setMechanismId(null);
    setFoodId(null);
    setLensId(nodeId);
    setLayout('hierarchy');
    setGraphView('flow');
    setHideUnmatched(true);
    setClickFocusId(nodeId);
    setSelection({ kind: 'node', id: nodeId });
    setPatternId(null);
    setPatternReturnSnapshot(null);
    setScreen('explore');
    setRailDrawerOpen(false);
  };

  const onSelectHit = (hit: SearchHit) => {
    if (hit.kind === 'node' && hit.id) enterLens(hit.id);
  };

  const captureExplore = (): ExploreSnapshot => ({
    diseaseId: safeDisease,
    mechanismId: safeMechanism,
    foodId: safeFood,
    lensId: safeLens,
    layout,
    graphView,
    hideUnmatched,
    selection,
  });

  const openVeganDietDetail = () => {
    setPatternReturnSnapshot(captureExplore());
    setPatternId(VEGAN_DIET_HUB_ID);
    setClickFocusId(null);
    setSelection(null);
    setScreen('pattern');
    setRailDrawerOpen(false);
  };

  const openTwin = () => {
    setTwinOpen(true);
    setRailDrawerOpen(false);
  };

  const openTwinIndicator = (indicator: TwinIndicatorId) => {
    setTwinOpen(false);
    if (!graph) {
      pendingTwin.current = indicator;
      return;
    }
    const known = new Set(graph.nodes.map((node) => node.id));
    const target = twinExploreTarget(indicator, known);
    const theme = themeById(target.themeId);
    if (!theme && !target.nodeId) return;
    if (target.nodeId) {
      setLensId(null);
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
      setGraphView('flow');
      selectNode(target.nodeId);
      setPatternId(null);
      setPatternReturnSnapshot(null);
      setScreen('explore');
      setRailDrawerOpen(false);
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
    setLensId(snapshot.lensId);
    setLayout(snapshot.layout);
    setGraphView(snapshot.graphView);
    setHideUnmatched(snapshot.hideUnmatched);
    setClickFocusId(null);
    setSelection(snapshot.selection);
    setScreen('explore');
  };

  const openSourcePage = (id: string) => {
    if (!sourceById(sources, id)) return;
    if (screen === 'explore') setSourceReturnSnapshot(captureExplore());
    else setSourceReturnSnapshot(null);
    setSourceId(id);
    setClickFocusId(null);
    setSelection(null);
    setPatternId(null);
    setScreen('source');
    setRailDrawerOpen(false);
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
    setLensId(snapshot.lensId);
    setLayout(snapshot.layout);
    setGraphView(snapshot.graphView);
    setHideUnmatched(snapshot.hideUnmatched);
    setClickFocusId(null);
    setSelection(snapshot.selection);
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
    setLensId(null);
    setHideUnmatched(false);
    setLayout('hierarchy');
    setGraphView('flow');
    setClickFocusId(null);
    setSelection({ kind: 'link', index });
    setScreen('explore');
  };

  const openAdminSection = (section: AdminSection) => {
    setAdminSection(section);
    setBookId(null);
    setAdminEdge(null);
    setAdminNodeId(null);
    setScreen('admin');
  };

  const openAdminBook = (id: string) => {
    if (!adminBookById(adminBooks, id)) return;
    setAdminSection('books');
    setAdminEdge(null);
    setAdminNodeId(null);
    setBookId(id);
    setScreen('admin');
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
    setLensId(null);
    setHideUnmatched(false);
    setLayout('hierarchy');
    setGraphView('flow');
    setClickFocusId(null);
    setSelection({ kind: 'node', id });
    setScreen('explore');
  };

  const graphWorkspace = screen === 'explore' || screen === 'pattern' || screen === 'source';
  const showVeganDietDetail = screen === 'pattern' && isVeganDietHubPattern(patternId);
  const activeSource = sourceById(sources, sourceId);
  const showSourceDetail = screen === 'source' && activeSource != null && graph != null;
  const activeAdminBook = adminBookById(adminBooks, bookId);
  const isAdmin = screen === 'admin';
  const showReadingLayer = showVeganDietDetail || showSourceDetail;
  const relatedPatternIds = patternsForTheme(themeForFilters(safeDisease, safeMechanism, safeFood)?.id);

  const filterEmpty = domainView != null && isFocusEmpty(focusIds, exploreNodes.map((node) => node.id));

  const onAppTheme = useCallback((next: AppTheme) => {
    setAppTheme(next);
    applyTheme(next);
    writeTheme(next);
  }, []);

  const openAbout = useCallback(() => {
    setRailDrawerOpen(false);
    setAboutOpen(true);
  }, []);

  const viewControls = graphWorkspace && !showReadingLayer ? <LayoutToggle view={graphView} onChange={onGraphView} /> : null;
  const rotateControl =
    graphWorkspace && !showReadingLayer && graphView === '3d' && layout === 'force' ? (
      <button
        type="button"
        className="btn btn--ghost"
        aria-pressed={autoRotate}
        onClick={() => setAutoRotate((value) => !value)}
      >
        旋转{autoRotate ? '开' : '关'}
      </button>
    ) : null;
  const focusSearch = () => {
    if (screen !== 'explore') setScreen('explore');
    openRail('search');
  };

  const graphRailTools = (
    <>
      <section className="shell-rail-section" aria-label={SHELL_SEARCH_LABEL}>
        <SearchBar
          inputRef={searchInputRef}
          hits={search.hits}
          truncated={search.truncated}
          onQuery={onQuery}
          onSelect={onSelectHit}
          placeholder={LOBBY_SEARCH_PLACEHOLDER}
          label={LOBBY_SEARCH_PLACEHOLDER}
          emptyText={LOBBY_SEARCH_EMPTY}
          ready={graph != null}
          nodesOnly
        />
      </section>
      <section className="shell-rail-section shell-rail-domain">
        <DomainSwitcher domain={activeDomain} onChange={onDomainChange} />
      </section>
      <RailRecommendations
        nodes={graph?.nodes ?? []}
        onEnterTheme={enterTheme}
        onOpenLens={enterLens}
      />
      <section className="shell-rail-section" aria-label="主题与筛选">
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
        <FilterPanel
          diseases={diseases}
          mechanisms={mechanisms}
          diseaseId={safeDisease}
          mechanismId={safeMechanism}
          onDisease={selectDisease}
          onMechanism={selectMechanism}
          onClear={clearFilters}
        />
      </section>
      <button
        type="button"
        className="btn btn--ghost shell-rail-action"
        data-testid="rail-vegan-detail"
        onClick={openVeganDietDetail}
      >
        {SHELL_VEGAN_ENTRY}
      </button>
    </>
  );

  const railVariant = mobile ? 'drawer' : railExpanded ? 'expanded' : 'collapsed';
  const rail = (
    <ShellRail
      ref={railRef}
      variant={railVariant}
      graphReady={graph != null}
      hidden={mobile && !railDrawerOpen}
      tools={graphRailTools}
      footer={<ThemeSwitcher theme={appTheme} onChange={onAppTheme} />}
      onOpenSearch={focusSearch}
      onExpand={() => persistRailPreference('expanded')}
      onCollapse={() => persistRailPreference('collapsed')}
      onClose={() => setRailDrawerOpen(false)}
      onMethods={openAbout}
    />
  );

  if (isAdmin) {
    return (
      <div className="app app--admin">
        <div className="admin-stage">
          <AdminShell section={adminSection} onSection={openAdminSection}>
            {adminBooks && adminSection === 'books' && activeAdminBook ? (
              <AdminBookDetail
                book={activeAdminBook}
                sources={sources}
                graph={graph}
                onBack={closeAdminBook}
                onOpenPublicSource={openSourcePage}
                onOpenGraph={openCitedLink}
              />
            ) : null}
            {adminBooks && adminSection === 'books' && !activeAdminBook ? (
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
            {adminSection === 'settings' && adminBooks ? (
              <AdminSettings graph={graph} sources={sources} books={adminBooks} appTheme={appTheme} />
            ) : null}
          </AdminShell>
        </div>
        <DisclaimerBar
          meta={graph?.meta ?? null}
          aboutOpen={aboutOpen}
          nodeCount={graph?.nodes.length ?? null}
          linkCount={graph?.links.length ?? null}
          evidenceCounts={counts}
          onAboutOpen={openAbout}
          onAboutClose={() => setAboutOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Shell
        mobile={mobile}
        railVariant={railVariant}
        drawerOpen={railDrawerOpen}
        onDrawerClose={() => setRailDrawerOpen(false)}
        railRef={railRef}
        triggerRef={railTriggerRef}
        rail={rail}
      >
        <div
          className={`workspace workspace--graph${
            selection && !showReadingLayer ? ' workspace--detail' : ''
          }${domainEmpty ? ' workspace--domain-empty' : ''}`}
          data-testid="workspace"
        >
          {!showReadingLayer && (
            <button
              ref={railTriggerRef}
              type="button"
              className="btn btn--ghost rail-toggle"
              data-testid="rail-toggle"
              aria-expanded={mobile ? railDrawerOpen : railExpanded}
              aria-controls="shell-rail"
              aria-label={RAIL_TOGGLE_LABEL}
              onClick={() => openRail()}
            >
              <svg className="rail-toggle-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" />
              </svg>
            </button>
          )}

          {graphWorkspace && load.status === 'loading' && (
            <p className="banner workspace-banner" role="status">
              正在加载知识图谱…
            </p>
          )}
          {graphWorkspace && load.status === 'error' && (
            <div className="banner banner--error workspace-banner" role="alert">
              <p>图谱数据加载失败</p>
              <p>{load.message}</p>
              <button type="button" className="btn" onClick={() => setAttempt((value) => value + 1)}>
                重试
              </button>
            </div>
          )}

          {graphWorkspace && graph && domainEmpty && activeDomain !== 'health' && (
            <div className="stage-main stage-main--domain-empty" data-testid="explore-screen">
              <DomainEmptyState domain={activeDomain} onReturnHealth={returnToHealthDomain} />
            </div>
          )}

          {graphWorkspace && graph && rendered && !domainEmpty && (
            <div className="graph-layout">
              <div className="stage-main graph-canvas-stage" data-testid="explore-screen">
                <GraphCanvas
                  graph={graph}
                  focusIds={brightFocusIds}
                  selection={selection}
                  layout={layout}
                  graphView={graphView}
                  shownNodeIds={rendered.nodeIds}
                  shownLinks={drawnLinks}
                  compact={mobile}
                  autoRotate={autoRotate}
                  anchorId={anchorId}
                  flowAnchorIds={flowAnchorIds}
                  onSelectNode={selectNode}
                  onSelectLink={selectLink}
                  onBackground={clearSelectionAndClickFocus}
                  appTheme={appTheme}
                />

                {(viewControls || rotateControl) && (
                  <div className="canvas-hud-controls" data-testid="canvas-hud-controls">
                    {viewControls}
                    {rotateControl}
                  </div>
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
                  <Legend
                    compact={mobile}
                    flow={graphView === 'flow' || (graphView === '3d' && layout === 'hierarchy')}
                    onExpandedChange={onLegendExpandedChange}
                  />
                  <p className="hud-note">
                    {graphView === '2d' && hierarchyPick && hierarchyPick.omittedBudget > 0
                      ? HIERARCHY_BUDGET_NOTE
                      : graphView === '3d' && layout === 'hierarchy'
                        ? '四块列板由近到远是膳食到健康。拖动可小幅转动，带子越宽表示书摘越多。'
                        : graphView === 'flow'
                          ? '颜色表示关联方向，带子越宽表示书摘越多。同列关联不画在通路上。'
                          : '颜色表示关联方向，线越粗表示强度越高。形状区分节点类型。'}
                  </p>
                </div>

                {!showReadingLayer && filterEmpty && (
                  <div className="empty-filter" role="status">
                    <p>无匹配，清除过滤</p>
                    <button type="button" className="btn btn--primary" onClick={clearFilters}>
                      清除全部
                    </button>
                  </div>
                )}
              </div>

              {selection && !showReadingLayer && (
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
                  relatedPatternIds={relatedPatternIds}
                  onOpenPattern={relatedPatternIds.length > 0 ? openVeganDietDetail : undefined}
                />
              )}
            </div>
          )}

          {showVeganDietDetail && (
            <div className="workspace-reading-layer" data-testid="pattern-reading-layer">
              <VeganDietDetail
                onBack={patternReturnSnapshot ? returnFromPatternToGraph : () => {
                  setPatternId(null);
                  setScreen('explore');
                }}
                onEnterTheme={enterTheme}
              />
            </div>
          )}

          {showSourceDetail && activeSource && graph && (
            <div className="workspace-reading-layer" data-testid="source-reading-layer">
              <SourceDetail
                source={activeSource}
                graph={graph}
                onBack={sourceReturnSnapshot ? returnFromSource : () => {
                  setSourceId(null);
                  setScreen('explore');
                }}
                onOpenLink={openCitedLink}
              />
            </div>
          )}
        </div>
      </Shell>

      <DietTwinIcon onOpen={openTwin} />
      {twinOpen && (
        <DietTwinModal
          controller={twin}
          onClose={() => setTwinOpen(false)}
          onOpenIndicator={openTwinIndicator}
        />
      )}

      <DisclaimerBar
        meta={graph?.meta ?? null}
        aboutOpen={aboutOpen}
        nodeCount={graph?.nodes.length ?? null}
        linkCount={graph?.links.length ?? null}
        evidenceCounts={counts}
        onAboutOpen={openAbout}
        onAboutClose={() => setAboutOpen(false)}
      />
    </div>
  );
}
