import {
  PATTERN_SHELL,
  type DietPatternDetail,
} from '../lib/dietPatternDetails';
import { themeById, type ExploreTheme } from '../lib/themes';

interface PatternDetailProps {
  detail: DietPatternDetail;
  onBack: () => void;
  onCompare: () => void;
  onEnterTheme: (theme: ExploreTheme) => void;
  onReturnToGraph?: () => void;
}

function graphActions(detail: DietPatternDetail): { themeId: string; label: string }[] {
  const actions: { themeId: string; label: string }[] = [];
  const seen = new Set<string>();
  for (const path of detail.graph_paths) {
    if (seen.has(path.theme_id) || !themeById(path.theme_id)) continue;
    seen.add(path.theme_id);
    actions.push({ themeId: path.theme_id, label: path.label });
  }
  for (const themeId of detail.related_themes) {
    if (seen.has(themeId)) continue;
    const theme = themeById(themeId);
    if (!theme) continue;
    seen.add(themeId);
    actions.push({ themeId, label: theme.label });
  }
  return actions;
}

export function PatternDetail({ detail, onBack, onCompare, onEnterTheme, onReturnToGraph }: PatternDetailProps) {
  const meals = [
    { label: '早餐', text: detail.sample_day.breakfast },
    { label: '午餐', text: detail.sample_day.lunch },
    { label: '晚餐', text: detail.sample_day.dinner },
  ];

  return (
    <main className="pattern-screen" data-testid="pattern-detail" data-pattern={detail.id}>
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
        <header className="pattern-hero">
          <p className="kicker">健康饮食方式</p>
          <h1>{detail.title}</h1>
          <p>{detail.summary}</p>
          <p className="pattern-evidence-badge" data-testid="pattern-evidence-badge">
            {detail.evidence_badge}
          </p>
        </header>
        <section className="pattern-section" aria-labelledby="pattern-emphasize-heading">
          <h2 id="pattern-emphasize-heading">{PATTERN_SHELL.emphasizeTitle}</h2>
          <ul className="pattern-items">
            {detail.emphasize_items.map((item) => (
              <li key={item.label} className="pattern-item">
                <strong>{item.label}</strong>
                <span>{item.note}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="pattern-section" aria-labelledby="pattern-limit-heading">
          <h2 id="pattern-limit-heading">{PATTERN_SHELL.limitTitle}</h2>
          <ul className="pattern-items">
            {detail.limit_items.map((item) => (
              <li key={item.label} className="pattern-item">
                <strong>{item.label}</strong>
                <span>{item.note}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="pattern-section" aria-labelledby="pattern-sample-heading">
          <h2 id="pattern-sample-heading">{PATTERN_SHELL.sampleTitle}</h2>
          <p className="sample-disclaimer" data-testid="pattern-sample-disclaimer">
            {detail.sample_day.disclaimer}
          </p>
          <dl className="sample-meals">
            {meals.map((meal) => (
              <div key={meal.label}>
                <dt>{meal.label}</dt>
                <dd>{meal.text}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="pattern-section" aria-labelledby="pattern-graph-heading">
          <h2 id="pattern-graph-heading">{PATTERN_SHELL.graphTitle}</h2>
          <div className="pattern-actions">
            {graphActions(detail).map((action) => {
              const theme = themeById(action.themeId);
              if (!theme) return null;
              return (
                <button
                  key={action.themeId}
                  type="button"
                  className="pattern-action"
                  data-testid={`pattern-graph-${action.themeId}`}
                  onClick={() => onEnterTheme(theme)}
                >
                  {PATTERN_SHELL.graphPrefix}
                  {action.label}
                </button>
              );
            })}
          </div>
        </section>
        <section className="pattern-section" aria-labelledby="pattern-evidence-heading">
          <h2 id="pattern-evidence-heading">{PATTERN_SHELL.evidenceTitle}</h2>
          <p>{detail.evidence_note}</p>
          <ul className="pattern-sources">
            {detail.evidence_sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
          <p data-testid="pattern-detail-limitations">{detail.limitations}</p>
        </section>
        <button type="button" className="pattern-action" data-testid="pattern-detail-compare" onClick={onCompare}>
          {PATTERN_SHELL.compareEntry}
        </button>
      </div>
    </main>
  );
}
