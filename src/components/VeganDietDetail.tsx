import { DIET_PATTERN_CARDS } from '../lib/dietPatterns';
import {
  COMPARE_COLUMNS,
  PATTERN_COMPARE_ROWS,
  PATTERN_SHELL,
  VEGAN_DIET_HUB_EVIDENCE,
} from '../lib/dietPatternDetails';
import { VEGAN_DIET_GRAPH_THEME_ID, VEGAN_DIET_SECTION_INTRO } from '../lib/exploreShell';
import { themeById, type ExploreTheme } from '../lib/themes';

interface VeganDietDetailProps {
  onBack: () => void;
  onEnterTheme: (theme: ExploreTheme) => void;
  onReturnToGraph?: () => void;
}

export function VeganDietDetail({ onBack, onEnterTheme, onReturnToGraph }: VeganDietDetailProps) {
  const graphTheme = themeById(VEGAN_DIET_GRAPH_THEME_ID);

  return (
    <main className="pattern-screen pattern-screen--hub" data-testid="vegan-diet-detail">
      <div className="pattern-screen-inner">
        <div className="pattern-toolbar">
          <button type="button" className="btn btn--ghost pattern-main-btn" onClick={onBack}>
            {PATTERN_SHELL.backLobby}
          </button>
          {onReturnToGraph && (
            <button
              type="button"
              className="btn btn--ghost pattern-main-btn"
              data-testid="pattern-return-graph"
              onClick={onReturnToGraph}
            >
              {PATTERN_SHELL.backGraph}
            </button>
          )}
        </div>
        <header className="pattern-hero pattern-section">
          <p className="kicker">{PATTERN_SHELL.sectionKicker}</p>
          <h1>{PATTERN_SHELL.hubTitle}</h1>
          <p className="pattern-intro pattern-intro--detail" data-testid="vegan-diet-detail-intro">
            {VEGAN_DIET_SECTION_INTRO}
          </p>
          <p data-testid="vegan-diet-detail-note">{PATTERN_SHELL.hubNote}</p>
        </header>

        <section className="pattern-section" aria-labelledby="vegan-journey-heading">
          <h2 id="vegan-journey-heading">{PATTERN_SHELL.journeyHeading}</h2>
          <ol className="vegan-journey-steps">
            {DIET_PATTERN_CARDS.map((card) => (
              <li key={card.id} className="vegan-journey-step" data-testid={`vegan-step-${card.id}`}>
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
              </li>
            ))}
          </ol>
        </section>

        <section className="pattern-section compare-scroll" aria-labelledby="vegan-compare-heading">
          <h2 id="vegan-compare-heading">对照表</h2>
          <p className="compare-legend" data-testid="compare-legend">
            {PATTERN_SHELL.compareLegend}
          </p>
          <table className="compare-table">
            <caption className="sr-only">{PATTERN_SHELL.hubTitle}</caption>
            <thead>
              <tr>
                <th scope="col">{PATTERN_SHELL.columnPoint}</th>
                {COMPARE_COLUMNS.map((column) => (
                  <th key={column.id} scope="col">
                    <span className="compare-col-title">{column.title}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PATTERN_COMPARE_ROWS.map((row) => (
                <tr key={row.point}>
                  <th scope="row">{row.point}</th>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.point}-${COMPARE_COLUMNS[index]?.id ?? index}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="pattern-section" aria-labelledby="vegan-evidence-heading">
          <h2 id="vegan-evidence-heading">{PATTERN_SHELL.evidenceTitle}</h2>
          <p>{VEGAN_DIET_HUB_EVIDENCE.evidence_note}</p>
          <ul className="pattern-sources">
            {VEGAN_DIET_HUB_EVIDENCE.evidence_sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
          <p data-testid="vegan-diet-detail-limitations">{VEGAN_DIET_HUB_EVIDENCE.limitations}</p>
        </section>

        {graphTheme && (
          <section className="pattern-section" aria-labelledby="vegan-graph-heading">
            <h2 id="vegan-graph-heading">{PATTERN_SHELL.graphTitle}</h2>
            <button
              type="button"
              className="btn btn--primary pattern-action"
              data-testid="vegan-detail-graph"
              onClick={() => onEnterTheme(graphTheme)}
            >
              {PATTERN_SHELL.graphCta}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
