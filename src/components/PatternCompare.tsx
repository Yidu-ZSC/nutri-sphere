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
          <p className="compare-legend" data-testid="compare-legend">
            {PATTERN_SHELL.compareLegend}
          </p>
        </header>
        <div className="compare-scroll">
          <table className="compare-table">
            <caption className="sr-only">{PATTERN_SHELL.compareTitle}</caption>
            <thead>
              <tr>
                <th scope="col">{PATTERN_SHELL.columnPoint}</th>
                {COMPARE_COLUMNS.map((column) => (
                  <th key={column.id} scope="col">
                    <span className="compare-col-title">{column.title}</span>
                    <button
                      type="button"
                      className="compare-open"
                      data-testid={`compare-open-${column.id}`}
                      onClick={() => onOpenPattern(column.id)}
                    >
                      {PATTERN_SHELL.openDetail}
                    </button>
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
