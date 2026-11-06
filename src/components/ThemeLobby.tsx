import { useEffect, useMemo, useState } from 'react';
import { DietTwinPortal } from './DietTwinPortal';
import { SearchBar } from './SearchBar';
import { DIET_TWIN_COPY } from '../lib/dietTwin';
import { DIET_PATTERN_CARDS, type DietPatternCard } from '../lib/dietPatterns';
import { PATTERN_SHELL } from '../lib/dietPatternDetails';
import {
  LOBBY_CONTRAST_NOTE,
  LOBBY_INTRO,
  LOBBY_KICKER,
  LOBBY_OUTCOMES_SUMMARY,
  LOBBY_RECOMMENDED_HEADING,
  LOBBY_SEARCH_EMPTY,
  LOBBY_SEARCH_PLACEHOLDER,
  LOBBY_TAGLINE,
  LOBBY_TITLE,
  VEGAN_DIET_GRAPH_THEME_ID,
  VEGAN_DIET_SECTION_DETAIL_CTA,
  VEGAN_DIET_SECTION_GRAPH_CTA,
  VEGAN_DIET_SECTION_INTRO,
  VEGAN_DIET_SECTION_TITLE,
} from '../lib/exploreShell';
import { LOBBY_RECOMMENDED } from '../lib/lobbyEntry';
import { PALETTE } from '../lib/palette';
import { searchNodes, type SearchHit } from '../lib/search';
import { themeAccent } from '../lib/themeAccent';
import { DomainEmptyState } from './DomainEmptyState';
import type { Domain, GraphNode } from '../types/graph';
import {
  HOME_FOOD_THEMES,
  HOME_HEALTH_THEMES,
  HOME_MECHANISM_THEMES,
  themeById,
  type ExploreTheme,
  type ThemeKind,
} from '../lib/themes';

interface ThemeLobbyProps {
  onEnter: (theme: ExploreTheme) => void;
  onOpenCompare: () => void;
  onOpenTwin: () => void;
  highlightedPatterns?: readonly string[];
  patternSourceTheme?: string | null;
  onReturnToGraph?: () => void;
  /** Knowledge domain. Non-health replaces theme cards with empty state; twin stays. */
  activeDomain?: Domain;
  onReturnHealth?: () => void;
  /** Full seed nodes power lobby search without waiting for an explore canvas. */
  graphNodes?: readonly GraphNode[];
  onOpenLens: (nodeId: string) => void;
  /** False until the seed is loaded, so an empty list is not reported as a missing concept. */
  searchReady?: boolean;
}

function kickerFor(kind: ThemeKind): string {
  if (kind === 'food_pattern') return '食物/模式';
  if (kind === 'mechanism_deep') return '机制向';
  return '健康主题';
}

function CardHeading({ title, heading = 'strong' }: { title: string; heading?: 'strong' | 'h2' }) {
  const Title = heading === 'h2' ? 'h2' : 'strong';
  return (
    <div className="theme-card-heading">
      <Title>{title}</Title>
      <span className="theme-card-chevron" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" focusable="false">
          <path
            d="M6 3.5 10.5 8 6 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}

function ThemeCard({
  theme,
  onEnter,
  featured = false,
}: {
  theme: ExploreTheme;
  onEnter: (theme: ExploreTheme) => void;
  featured?: boolean;
}) {
  return (
    <button
      type="button"
      className={featured ? 'theme-card theme-card--featured' : 'theme-card'}
      data-testid={`theme-card-${theme.id}`}
      data-kind={theme.kind}
      data-featured={featured ? 'true' : undefined}
      data-direction={themeAccent(theme)}
      aria-label={theme.title}
      style={{ ['--card-accent' as string]: PALETTE[themeAccent(theme)] }}
      onClick={() => onEnter(theme)}
    >
      <span className="dir-top" aria-hidden="true" />
      <span className="kicker">{kickerFor(theme.kind)}</span>
      <CardHeading title={theme.title} />
      <span className="theme-blurb">{theme.blurb}</span>
    </button>
  );
}

function LensCard({
  entry,
  node,
  onOpen,
}: {
  entry: (typeof LOBBY_RECOMMENDED)[number];
  node: GraphNode;
  onOpen: (nodeId: string) => void;
}) {
  const accent = ['protective', 'risk', 'mixed', 'neutral'].includes(node.group)
    ? (node.group as keyof typeof PALETTE)
    : 'neutral';
  return (
    <button
      type="button"
      className="theme-card theme-card--contrast"
      data-testid={`lens-card-${entry.id}`}
      data-kind="lens"
      data-direction={accent}
      aria-label={`对照查看：${entry.label}`}
      style={{ ['--card-accent' as string]: PALETTE[accent] }}
      onClick={() => onOpen(entry.anchorNodeId)}
    >
      <span className="dir-top" aria-hidden="true" />
      <span className="kicker">对照</span>
      <CardHeading title={entry.label} />
      <span className="theme-blurb">{LOBBY_CONTRAST_NOTE}</span>
    </button>
  );
}

function PatternCard({
  card,
  highlighted,
}: {
  card: DietPatternCard;
  highlighted: boolean;
}) {
  return (
    <article
      className="pattern-card pattern-card--journey"
      data-testid={`pattern-card-${card.id}`}
      data-journey-stage={card.journey_stage}
      data-highlighted={highlighted ? 'true' : undefined}
    >
      {highlighted && <span className="pattern-badge">{PATTERN_SHELL.highlightBadge}</span>}
      <span className="pattern-stage">{card.journey_stage}</span>
      <h3>{card.title}</h3>
      <p className="pattern-hook">{card.hook}</p>
      <ul className="pattern-facets">
        {card.lobby_facets.map((facet) => (
          <li key={facet.kind} className="pattern-facet" data-facet={facet.kind}>
            <span className="pattern-facet-label">{facet.label}</span>
            <p>{facet.body}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function ThemeLobby({
  onEnter,
  onOpenCompare,
  onOpenTwin,
  highlightedPatterns = [],
  patternSourceTheme = null,
  onReturnToGraph,
  activeDomain = 'health',
  onReturnHealth,
  graphNodes = [],
  searchReady = false,
  onOpenLens,
}: ThemeLobbyProps) {
  const [lobbyQuery, setLobbyQuery] = useState('');
  const highlighted = new Set(highlightedPatterns);
  const showReturn = highlightedPatterns.length > 0 && themeById(patternSourceTheme) != null && Boolean(onReturnToGraph);
  const highlightKey = highlightedPatterns.join(',');
  const veganGraphTheme = themeById(VEGAN_DIET_GRAPH_THEME_ID);
  const primaryRecommendation = LOBBY_RECOMMENDED[0];
  const primaryTheme = primaryRecommendation.kind === 'theme' ? themeById(primaryRecommendation.id) : null;
  const nodeMap = useMemo(() => new Map(graphNodes.map((node) => [node.id, node])), [graphNodes]);
  const lobbyHits = useMemo(() => searchNodes(lobbyQuery, graphNodes), [graphNodes, lobbyQuery]);
  const fromFoodThemes = HOME_FOOD_THEMES.filter((theme) => theme.id !== primaryRecommendation.id);
  useEffect(() => {
    if (!highlightKey) return;
    document.getElementById('diet-patterns')?.scrollIntoView({ block: 'start' });
  }, [highlightKey]);

  const onLobbyHit = (hit: SearchHit) => {
    if (hit.kind === 'node' && hit.id) onOpenLens(hit.id);
  };

  return (
    <main className="lobby" data-testid="theme-lobby">
      <h1 className="sr-only">{LOBBY_KICKER}</h1>
      <p className="kicker lobby-lead" aria-hidden="true">{LOBBY_KICKER}</p>
      <div className="lobby-pillars">
        <div className="lobby-title-row">
          <h2>{LOBBY_TITLE}</h2>
          <section className="lobby-twin" aria-label={DIET_TWIN_COPY.entryTitle}>
            <DietTwinPortal onOpen={onOpenTwin} />
          </section>
        </div>
        <header className="lobby-intro">
          <p className="lobby-tagline" data-testid="lobby-tagline">{LOBBY_TAGLINE}</p>
          <p data-testid="lobby-intro">{LOBBY_INTRO}</p>
        </header>
      </div>
      {activeDomain !== 'health' && onReturnHealth ? (
        <DomainEmptyState domain={activeDomain} onReturnHealth={onReturnHealth} />
      ) : (
        <>
      <section className="lobby-search" aria-label="概念搜索" data-testid="lobby-search">
        <SearchBar
          hits={lobbyHits}
          truncated={false}
          onQuery={setLobbyQuery}
          onSelect={onLobbyHit}
          nodesOnly
          placeholder={LOBBY_SEARCH_PLACEHOLDER}
          label={LOBBY_SEARCH_PLACEHOLDER}
          emptyText={LOBBY_SEARCH_EMPTY}
          ready={searchReady}
        />
      </section>
      <section className="lobby-recommended" aria-labelledby="lobby-recommended-heading">
        <h2 id="lobby-recommended-heading">{LOBBY_RECOMMENDED_HEADING}</h2>
        <ul className="recommended-grid" data-testid="lobby-recommended-grid">
          {primaryTheme && (
            <li>
              <ThemeCard theme={primaryTheme} onEnter={onEnter} featured />
            </li>
          )}
          {LOBBY_RECOMMENDED.slice(1).map((entry) => {
            const node = nodeMap.get(entry.anchorNodeId);
            if (!node) return null;
            return (
              <li key={entry.id}>
                <LensCard entry={entry} node={node} onOpen={onOpenLens} />
              </li>
            );
          })}
        </ul>
      </section>
      <section className="lobby-food" aria-labelledby="food-theme-heading" data-testid="food-theme-grid">
        <h2 id="food-theme-heading">从食物/模式看</h2>
        <ul className="theme-grid">
          {fromFoodThemes.map((theme) => (
            <li key={theme.id}>
              <ThemeCard theme={theme} onEnter={onEnter} />
            </li>
          ))}
        </ul>
      </section>
      <details className="outcomes-fold" data-testid="outcomes-fold">
        <summary>{LOBBY_OUTCOMES_SUMMARY}</summary>
        <ul className="theme-grid" data-testid="health-theme-grid">
          {HOME_HEALTH_THEMES.map((theme) => (
            <li key={theme.id}>
              <ThemeCard theme={theme} onEnter={onEnter} />
            </li>
          ))}
        </ul>
      </details>
      <section className="lobby-patterns" id="diet-patterns" aria-labelledby="diet-pattern-heading" data-testid="diet-patterns">
        <div className="pattern-head">
          <h2 id="diet-pattern-heading">{VEGAN_DIET_SECTION_TITLE}</h2>
          {showReturn && (
            <button
              type="button"
              className="btn btn--ghost pattern-return"
              data-testid="return-to-graph"
              onClick={onReturnToGraph}
            >
              返回图谱
            </button>
          )}
        </div>
        <p className="pattern-intro" data-testid="vegan-diet-intro">
          {VEGAN_DIET_SECTION_INTRO}
        </p>
        <ul className="pattern-grid pattern-grid--journey">
          {DIET_PATTERN_CARDS.map((card) => (
            <li key={card.id}>
              <PatternCard card={card} highlighted={highlighted.has(card.id)} />
            </li>
          ))}
        </ul>
        <div className="pattern-section-actions">
          <button
            type="button"
            className="btn btn--primary pattern-section-btn"
            data-testid="vegan-section-detail"
            onClick={onOpenCompare}
          >
            {VEGAN_DIET_SECTION_DETAIL_CTA}
          </button>
          {veganGraphTheme && (
            <button
              type="button"
              className="btn btn--ghost pattern-section-btn"
              data-testid="vegan-section-graph"
              aria-label={`${VEGAN_DIET_SECTION_GRAPH_CTA}：${veganGraphTheme.label}`}
              onClick={() => onEnter(veganGraphTheme)}
            >
              {VEGAN_DIET_SECTION_GRAPH_CTA}
            </button>
          )}
        </div>
      </section>
      <details className="mechanism-fold" data-testid="mechanism-fold">
        <summary>进阶：机制与饮食（可选）</summary>
        <p className="mechanism-note">
          机制向主题供愿意深读的人选用，默认收起。
        </p>
        <ul className="mechanism-list">
          {HOME_MECHANISM_THEMES.map((theme) => (
            <li key={theme.id}>
              <ThemeCard theme={theme} onEnter={onEnter} />
            </li>
          ))}
        </ul>
      </details>
        </>
      )}
    </main>
  );
}
