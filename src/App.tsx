import { useCallback, useEffect, useMemo, useState } from 'react';
import { DetailDrawer } from './components/DetailDrawer';
import { DisclaimerBar } from './components/DisclaimerBar';
import { FilterPanel } from './components/FilterPanel';
import { GraphCanvas } from './components/GraphCanvas';
import { SearchBar } from './components/SearchBar';
import { ViewLayerToggle } from './components/ViewLayerToggle';
import { focusedNodeIds, isFocusEmpty } from './lib/focus';
import { loadGraph } from './lib/loadGraph';
import { PALETTE } from './lib/palette';
import { searchGraph, type SearchHit } from './lib/search';
import { readViewLayer, writeViewLayer } from './lib/viewLayer';
import { useMediaQuery } from './hooks/useMediaQuery';
import type { GraphData, Selection, ViewLayer } from './types/graph';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; graph: GraphData };

export function App() {
  const mobile = useMediaQuery('(max-width: 768px)');
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [layer, setLayer] = useState<ViewLayer>(() => readViewLayer());
  const [query, setQuery] = useState('');
  const [diseaseId, setDiseaseId] = useState<string | null>(null);
  const [mechanismId, setMechanismId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [sheet, setSheet] = useState<'search' | 'filter' | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(() => {
    if (typeof window === 'undefined') return true;
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    let cancelled = false;
    setLoad({ status: 'loading' });
    loadGraph()
      .then((graph) => {
        if (!cancelled) setLoad({ status: 'ready', graph });
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
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
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
  }, [aboutOpen, selection, sheet]);

  const graph = load.status === 'ready' ? load.graph : null;

  const diseases = useMemo(
    () => (graph ? graph.nodes.filter((node) => node.type === 'disease') : []),
    [graph],
  );
  const mechanisms = useMemo(
    () => (graph ? graph.nodes.filter((node) => node.type === 'mechanism') : []),
    [graph],
  );

  const focusIds = useMemo(
    () => (graph ? focusedNodeIds(graph.links, diseaseId, mechanismId) : null),
    [graph, diseaseId, mechanismId],
  );

  const search = useMemo(
    () => (graph ? searchGraph(query, graph) : { hits: [], truncated: false }),
    [graph, query],
  );

  const onQuery = useCallback((value: string) => setQuery(value), []);

  const onSelectHit = (hit: SearchHit) => {
    if (hit.kind === 'node' && hit.id) setSelection({ kind: 'node', id: hit.id });
    if (hit.kind === 'link' && hit.index != null) setSelection({ kind: 'link', index: hit.index });
    setSheet(null);
  };

  const clearFilters = () => {
    setDiseaseId(null);
    setMechanismId(null);
  };

  const filterEmpty =
    graph != null && isFocusEmpty(focusIds, graph.nodes.map((node) => node.id));

  const legend = (
    <ul className="legend" aria-label="颜色图例">
      <li>
        <i style={{ background: PALETTE.protective }} aria-hidden="true" />
        保护相关
      </li>
      <li>
        <i style={{ background: PALETTE.risk }} aria-hidden="true" />
        风险相关
      </li>
      <li>
        <i style={{ background: PALETTE.neutral }} aria-hidden="true" />
        中性 / 方向不明确
      </li>
      <li>
        <i style={{ background: PALETTE.mixed }} aria-hidden="true" />
        混合
      </li>
    </ul>
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
        {!mobile && graph && (
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
              diseaseId={diseaseId}
              mechanismId={mechanismId}
              layer={layer}
              onDisease={setDiseaseId}
              onMechanism={setMechanismId}
              onClear={clearFilters}
            />
          </div>
        )}
        <div className="header-actions">
          {mobile && (
            <div className="mobile-tools">
              <button
                type="button"
                className="btn btn--ghost"
                aria-expanded={sheet === 'search'}
                onClick={() => setSheet((current) => (current === 'search' ? null : 'search'))}
              >
                搜索
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                aria-expanded={sheet === 'filter'}
                onClick={() => setSheet((current) => (current === 'filter' ? null : 'filter'))}
              >
                筛选
              </button>
            </div>
          )}
          <ViewLayerToggle layer={layer} onChange={setLayer} />
          <button
            type="button"
            className="btn btn--ghost"
            aria-pressed={autoRotate}
            onClick={() => setAutoRotate((value) => !value)}
          >
            旋转{autoRotate ? '开' : '关'}
          </button>
        </div>
      </header>

      <div className={selection ? 'stage stage--detail' : 'stage'}>
        {load.status === 'loading' && (
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
        {graph && (
          <>
            <div className="stage-main">
            <GraphCanvas
              graph={graph}
              focusIds={focusIds}
              selection={selection}
              layer={layer}
              autoRotate={autoRotate}
              onSelectNode={(id) => setSelection({ kind: 'node', id })}
              onSelectLink={(index) => setSelection({ kind: 'link', index })}
              onBackground={() => setSelection(null)}
            />
            <div className="hud">
              {legend}
              <p className="counts" data-testid="graph-stats">
                {graph.nodes.length} 节点 · {graph.links.length} 关联
                {focusIds ? ` · 聚焦 ${[...focusIds].filter((id) => graph.nodes.some((node) => node.id === id)).length}` : ''}
              </p>
              <p className="hud-note">连线更粗表示证据强度更高。颜色与文字同时表示方向。</p>
            </div>
            {filterEmpty && (
              <div className="empty-filter" role="status">
                <p>无匹配，清除过滤</p>
                <button type="button" className="btn" onClick={clearFilters}>
                  清除全部
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
                    diseaseId={diseaseId}
                    mechanismId={mechanismId}
                    layer={layer}
                    onDisease={setDiseaseId}
                    onMechanism={setMechanismId}
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
                onClose={() => setSelection(null)}
                onSelectNode={(id) => setSelection({ kind: 'node', id })}
                onSelectLink={(index) => setSelection({ kind: 'link', index })}
              />
            )}
          </>
        )}
      </div>

      <DisclaimerBar
        meta={graph?.meta ?? null}
        aboutOpen={aboutOpen}
        onAboutOpen={() => setAboutOpen(true)}
        onAboutClose={() => setAboutOpen(false)}
      />
    </div>
  );
}
