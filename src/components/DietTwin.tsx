import { useState } from 'react';
import {
  DIET_TWIN_COPY,
  DIET_TWIN_INDICATORS,
  DIET_TWIN_QUESTIONS,
  bandLabel,
  buildSnapshot,
  indicatorBand,
  readDietTwin,
  withAssumption,
  writeDietTwin,
  type DietTwinAnswers,
  type DietTwinQuestion,
  type DietTwinSnapshot,
  type TwinIndicatorId,
} from '../lib/dietTwin';

interface DietTwinProps {
  onBack: () => void;
  onOpenIndicator: (indicator: TwinIndicatorId) => void;
}

type Draft = Partial<DietTwinAnswers>;

function choiceValue(question: DietTwinQuestion, draft: Draft): string {
  return draft[question.id] ?? '';
}

export function DietTwin({ onBack, onOpenIndicator }: DietTwinProps) {
  const [snapshot, setSnapshot] = useState<DietTwinSnapshot | null>(() => readDietTwin());
  const [draft, setDraft] = useState<Draft>({});
  const active: Draft = snapshot ? snapshot.assumption : draft;
  const ready = Boolean(active.plant && active.upf && active.fiber);

  const applyPatch = (patch: Partial<DietTwinAnswers>) => {
    if (snapshot) {
      const next = withAssumption(snapshot, { ...snapshot.assumption, ...patch });
      setSnapshot(next);
      writeDietTwin(next);
      return;
    }
    setDraft((current) => ({ ...current, ...patch }));
  };

  const onChoose = (question: DietTwinQuestion, value: string) => {
    if (question.id === 'plant') {
      const match = question.options.find((option) => option.value === value);
      if (match) applyPatch({ plant: match.value });
      return;
    }
    if (question.id === 'upf') {
      const match = question.options.find((option) => option.value === value);
      if (match) applyPatch({ upf: match.value });
      return;
    }
    const match = question.options.find((option) => option.value === value);
    if (match) applyPatch({ fiber: match.value });
  };

  const onSubmit = () => {
    if (!draft.plant || !draft.upf || !draft.fiber) return;
    const next = buildSnapshot({ plant: draft.plant, upf: draft.upf, fiber: draft.fiber });
    setSnapshot(next);
    writeDietTwin(next);
  };

  return (
    <main className="pattern-screen twin-screen" data-testid="diet-twin-screen">
      <p className="twin-persistent" data-testid="diet-twin-disclaimer">
        {DIET_TWIN_COPY.persistent}
      </p>
      <div className="pattern-screen-inner">
        <div className="pattern-toolbar">
          <button type="button" className="btn btn--ghost pattern-main-btn" onClick={onBack}>
            {DIET_TWIN_COPY.back}
          </button>
        </div>
        <header className="pattern-hero">
          <p className="kicker">{DIET_TWIN_COPY.badge}</p>
          <h1>{DIET_TWIN_COPY.title}</h1>
          <p>{DIET_TWIN_COPY.intro}</p>
        </header>
        <form
          className="twin-questions"
          data-testid="diet-twin-questions"
          onSubmit={(event) => {
            event.preventDefault();
            if (!snapshot) onSubmit();
          }}
        >
          {DIET_TWIN_QUESTIONS.map((question) => (
            <fieldset key={question.id} className="twin-question">
              <legend>{question.prompt}</legend>
              <div className="twin-options">
                {question.options.map((option) => {
                  const checked = choiceValue(question, active) === option.value;
                  return (
                    <label
                      key={option.value}
                      className="twin-option"
                      data-checked={checked ? 'true' : 'false'}
                    >
                      <input
                        type="radio"
                        name={`diet-twin-${question.id}`}
                        value={option.value}
                        checked={checked}
                        data-testid={`diet-twin-opt-${option.value}`}
                        onChange={() => onChoose(question, option.value)}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
          {!snapshot && (
            <button type="submit" className="btn pattern-main-btn" data-testid="diet-twin-submit" disabled={!ready}>
              {DIET_TWIN_COPY.submit}
            </button>
          )}
        </form>
        {snapshot && (
          <section className="twin-bars" data-testid="diet-twin-bars" aria-label={DIET_TWIN_COPY.title}>
            <p className="twin-hint">{DIET_TWIN_COPY.assumptionHint}</p>
            {DIET_TWIN_INDICATORS.map((indicator) => {
              const band = indicatorBand(indicator.id, snapshot.assumption);
              return (
                <button
                  key={indicator.id}
                  type="button"
                  className="twin-bar"
                  data-testid={`diet-twin-bar-${indicator.id}`}
                  data-level={band}
                  onClick={() => onOpenIndicator(indicator.id)}
                >
                  <span className="twin-bar-head">
                    <span className="twin-bar-label">{indicator.label}</span>
                    <span className="twin-bar-band" data-testid={`diet-twin-band-${indicator.id}`}>
                      {bandLabel(band)}
                    </span>
                  </span>
                  <span className="twin-track" aria-hidden="true">
                    <span className="twin-fill" data-level={band} />
                  </span>
                  <span className="twin-bar-note">{DIET_TWIN_COPY.barNote}</span>
                  {indicator.caption && <span className="twin-bar-caption">{indicator.caption}</span>}
                  <span className="twin-bar-action">{DIET_TWIN_COPY.openGraph}</span>
                </button>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
