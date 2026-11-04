import { useEffect } from 'react';
import { DietTwinPortal } from './DietTwinPortal';
import { DIET_TWIN_COPY } from '../lib/dietTwin';
import { DIET_PATTERN_CARDS, type DietPatternCard } from '../lib/dietPatterns';
import { PATTERN_SHELL } from '../lib/dietPatternDetails';
import {
  LOBBY_INTRO,
  LOBBY_KICKER,
  LOBBY_TAGLINE,
  LOBBY_TITLE,
  VEGAN_DIET_GRAPH_THEME_ID,
  VEGAN_DIET_SECTION_DETAIL_CTA,
  VEGAN_DIET_SECTION_GRAPH_CTA,
  VEGAN_DIET_SECTION_INTRO,
  VEGAN_DIET_SECTION_TITLE,
} from '../lib/exploreShell';
import { PALETTE } from '../lib/palette';
import { themeAccent } from '../lib/themeAccent';
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

function ThemeCard({ theme, onEnter }: { theme: ExploreTheme; onEnter: (theme: ExploreTheme) => void }) {
  return (
    <button
      type="button"
      className="theme-card"
      data-testid={`theme-card-${theme.id}`}
      data-kind={theme.kind}
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
}: ThemeLobbyProps) {
  const highlighted = new Set(highlightedPatterns);
  const showReturn = highlightedPatterns.length > 0 && themeById(patternSourceTheme) != null && Boolean(onReturnToGraph);
  const highlightKey = highlightedPatterns.join(',');
  const veganGraphTheme = themeById(VEGAN_DIET_GRAPH_THEME_ID);

  useEffect(() => {
    if (!highlightKey) return;
    document.getElementById('diet-patterns')?.scrollIntoView({ block: 'start' });
  }, [highlightKey]);

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
      <section className="lobby-primary" aria-labelledby="health-theme-heading">
        <h2 id="health-theme-heading">常见健康主题</h2>
        <ul className="theme-grid" data-testid="health-theme-grid">
          {HOME_HEALTH_THEMES.map((theme) => (
            <li key={theme.id}>
              <ThemeCard theme={theme} onEnter={onEnter} />
            </li>
          ))}
        </ul>
      </section>
      <section className="lobby-food" aria-labelledby="food-theme-heading" data-testid="food-theme-grid">
        <h2 id="food-theme-heading">从食物/模式看</h2>
        <p className="food-note">从一种食物或吃法出发，看公开资料里常被怎么描述。</p>
        <ul className="theme-grid">
          {HOME_FOOD_THEMES.map((theme) => (
            <li key={theme.id}>
              <ThemeCard theme={theme} onEnter={onEnter} />
            </li>
          ))}
        </ul>
      </section>
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
          机制向主题供愿意深读的人选用，默认收起，不会替代上面的健康主题入口。
        </p>
        <ul className="mechanism-list">
          {HOME_MECHANISM_THEMES.map((theme) => (
            <li key={theme.id}>
              <ThemeCard theme={theme} onEnter={onEnter} />
            </li>
          ))}
        </ul>
      </details>
    </main>
  );
}
