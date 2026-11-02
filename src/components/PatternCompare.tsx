import { DIET_PATTERN_CARDS } from '../lib/dietPatterns';
import {
  COMPARE_COLUMNS,
  PATTERN_COMPARE_ROWS,
  PATTERN_SHELL,
} from '../lib/dietPatternDetails';

interface PatternCompareProps {
  onBack: () => void;
  onOpenPattern: (id: string) => void;
}

export function PatternCompare({ onBack, onOpenPattern }: PatternCompareProps) {
  return (
    <main className="pattern-screen pattern-screen--compare" data-testid="pattern-compare">
      <div className="pattern-screen-inner">
        <div className="pattern-toolbar">
          <button type="button" className="btn btn--ghost pattern-main-btn" onClick={onBack}>
            {PATTERN_SHELL.backLobby}
          </button>
        </div>
        <header className="pattern-hero">
          <h1>{PATTERN_SHELL.compareTitle}</h1>
          <p data-testid="compare-note">{PATTERN_SHELL.compareNote}</p>
        </header>
        <ul className="pattern-grid compare-cards">
          {COMPARE_COLUMNS.map((column) => {
            const card = DIET_PATTERN_CARDS.find((item) => item.id === column.id);
            if (!card) return null;
            return (
              <li key={card.id}>
                <article className="pattern-card" data-testid={`compare-card-${card.id}`}>
                  <h2>{card.title}</h2>
                  <p className="pattern-summary" title={card.summary}>
                    {card.summary}
                  </p>
                  <dl className="pattern-fields">
                    <div>
                      <dt>{PATTERN_SHELL.emphasizeTitle}</dt>
                      <dd>{card.emphasize}</dd>
                    </div>
                    <div>
                      <dt>{PATTERN_SHELL.limitTitle}</dt>
                      <dd>{card.limit}</dd>
                    </div>
                    <div>
                      <dt>证据与来源（简述）</dt>
                      <dd>{card.evidence_note}</dd>
                    </div>
                    <div>
                      <dt>局限性</dt>
                      <dd data-testid={`compare-limitations-${card.id}`}>{card.limitations}</dd>
                    </div>
                  </dl>
                  <div className="pattern-related">
                    <button
                      type="button"
                      className="btn btn--primary pattern-jump compare-open"
                      data-testid={`compare-open-${column.id}`}
                      onClick={() => onOpenPattern(column.id)}
                    >
                      {PATTERN_SHELL.openDetail}
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
        <div className="compare-scroll">
          <p className="compare-legend" data-testid="compare-legend">
            {PATTERN_SHELL.compareLegend}
          </p>
          <table className="compare-table">
            <caption className="sr-only">{PATTERN_SHELL.compareTitle}</caption>
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
        </div>
      </div>
    </main>
  );
}
