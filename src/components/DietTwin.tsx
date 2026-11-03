import { useState } from 'react';
import {
  DIET_TWIN_BASED_ON,
  DIET_TWIN_COPY,
  DIET_TWIN_INDICATORS,
  DIET_TWIN_QUESTIONS,
  DIET_TWIN_READINGS,
  bandLabel,
  dietTwinHistoryMeta,
  type DietTwinAnswers,
  type DietTwinQuestion,
  type TwinIndicatorId,
} from '../lib/dietTwin';
import {
  DIET_TWIN_RECORD_LIMIT,
  addRecords,
  answersFromHypothesis,
  defaultBasedOn,
  deleteRecord,
  formatLocalDate,
  hypothesisFromAnswers,
  inputsFromPaste,
  isMeal,
  openDietTwin,
  recordsInRange,
  saveDietTwin,
  snapshotBand,
  updateRecord,
  withHypothesis,
  withSnapshot,
  type BasedOn,
  type DietRecord,
  type DietTwinStore,
  type Meal,
  type RejectedRecord,
} from '../lib/dietTwinStore';

interface DietTwinProps {
  onBack: () => void;
  onOpenIndicator: (indicator: TwinIndicatorId) => void;
}

type Draft = Partial<DietTwinAnswers>;
type ListRange = 7 | 30;

/** Permanent short mark. The NS-028 sentence stays on screen beside it. */
const TWIN_SHORT_BADGE = '饮食观察，非诊断';

const MEAL_OPTIONS: readonly { value: Meal; label: string }[] = [
  { value: 'breakfast', label: DIET_TWIN_COPY.mealBreakfast },
  { value: 'lunch', label: DIET_TWIN_COPY.mealLunch },
  { value: 'dinner', label: DIET_TWIN_COPY.mealDinner },
  { value: 'snack', label: DIET_TWIN_COPY.mealSnack },
];

function choiceValue(question: DietTwinQuestion, draft: Draft): string {
  return draft[question.id] ?? '';
}

function resultNotice(added: number, rejected: readonly RejectedRecord[]): string | null {
  const hitLimit = rejected.some((item) => item.reason === 'limit');
  const hitInvalid = rejected.some((item) => item.reason !== 'limit');
  if (added === 0 && hitLimit && !hitInvalid) return DIET_TWIN_COPY.limitReached;
  if (added === 0 && hitInvalid) return DIET_TWIN_COPY.rejected;
  if (added === 0) return null;
  if (hitLimit) return `${DIET_TWIN_COPY.added}${DIET_TWIN_COPY.limitReached}`;
  if (hitInvalid) return `${DIET_TWIN_COPY.added}${DIET_TWIN_COPY.rejected}`;
  return DIET_TWIN_COPY.added;
}

export function DietTwin({ onBack, onOpenIndicator }: DietTwinProps) {
  const [session, setSession] = useState(() => openDietTwin());
  const [modeLocked, setModeLocked] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  const [date, setDate] = useState(() => formatLocalDate(new Date()));
  const [meal, setMeal] = useState<Meal>('breakfast');
  const [text, setText] = useState('');
  const [paste, setPaste] = useState('');
  const [range, setRange] = useState<ListRange>(7);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { store, mode } = session;
  const today = formatLocalDate(new Date());
  const selected = store.hypothesis ? answersFromHypothesis(store.hypothesis) : null;
  const active: Draft = selected ?? draft;
  const ready = Boolean(active.plant && active.upf && active.fiber);
  const visibleRecords = recordsInRange(store.records, today, range);
  const atLimit = store.records.length >= DIET_TWIN_RECORD_LIMIT;
  const editing = editingId != null;

  const commit = (nextStore: DietTwinStore, nextMode: BasedOn, now = new Date()) => {
    const refreshed = withSnapshot(nextStore, nextMode, now);
    if (refreshed.records.length > 0 || refreshed.hypothesis) saveDietTwin(refreshed);
    setSession({ store: refreshed, mode: nextMode });
  };

  const modeAfterEdit = (nextStore: DietTwinStore, now: Date): BasedOn => {
    if (modeLocked) return mode;
    return defaultBasedOn(nextStore, formatLocalDate(now));
  };

  const clearForm = () => {
    setText('');
    setEditingId(null);
  };

  const applyRecords = (nextStore: DietTwinStore, added: number, rejected: readonly RejectedRecord[], now: Date) => {
    commit(nextStore, modeAfterEdit(nextStore, now), now);
    setNotice(resultNotice(added, rejected));
  };

  const onAdd = () => {
    const now = new Date();
    const result = addRecords(store, [{ date, meal, text }], now);
    applyRecords(result.store, result.added.length, result.rejected, now);
    if (result.added.length > 0) clearForm();
  };

  const onSaveEdit = () => {
    if (!editingId) return;
    const now = new Date();
    const result = updateRecord(store, editingId, { date, meal, text });
    if (result.reason != null && result.reason !== 'missing') {
      setNotice(DIET_TWIN_COPY.rejected);
      return;
    }
    if (result.reason === 'missing' || !result.updated) {
      clearForm();
      setNotice(DIET_TWIN_COPY.rejected);
      return;
    }
    commit(result.store, modeAfterEdit(result.store, now), now);
    clearForm();
    setNotice(DIET_TWIN_COPY.updated);
  };

  const onPaste = () => {
    const now = new Date();
    const todayIso = formatLocalDate(now);
    const inputs = inputsFromPaste(paste, todayIso);
    if (inputs.length === 0) {
      setNotice(DIET_TWIN_COPY.pasteEmpty);
      return;
    }
    const result = addRecords(store, inputs, now);
    applyRecords(result.store, result.added.length, result.rejected, now);
    if (result.added.length > 0) setPaste('');
  };

  const onEdit = (record: DietRecord) => {
    setEditingId(record.id);
    setDate(record.date);
    setMeal(record.meal);
    setText(record.text);
    setNotice(null);
  };

  const onCancelEdit = () => {
    clearForm();
    setDate(today);
    setMeal('breakfast');
    setNotice(null);
  };

  const onDelete = (id: string) => {
    const now = new Date();
    const next = deleteRecord(store, id);
    if (editingId === id) {
      clearForm();
      setDate(today);
      setMeal('breakfast');
    }
    commit(next, modeAfterEdit(next, now), now);
  };

  const onMode = (nextMode: BasedOn) => {
    setModeLocked(true);
    setNotice(null);
    commit(store, nextMode);
  };

  const applyPatch = (patch: Partial<DietTwinAnswers>) => {
    if (selected) {
      const nextAnswers: DietTwinAnswers = { ...selected, ...patch };
      commit(withHypothesis(store, hypothesisFromAnswers(nextAnswers)), mode);
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
    const now = new Date();
    const next = withHypothesis(
      store,
      hypothesisFromAnswers({ plant: draft.plant, upf: draft.upf, fiber: draft.fiber }),
    );
    commit(next, modeAfterEdit(next, now), now);
  };

  const snapshot = store.lastSnapshot;

  return (
    <main className="pattern-screen twin-screen" data-testid="diet-twin-screen">
      <div className="twin-chrome">
        <div className="pattern-toolbar">
          <button type="button" className="btn btn--ghost pattern-main-btn" onClick={onBack}>
            {DIET_TWIN_COPY.back}
          </button>
        </div>
        <div className="twin-chrome-mark">
          <p className="twin-edu-badge" data-testid="diet-twin-edu-badge">
            {TWIN_SHORT_BADGE}
          </p>
          <p className="twin-persistent" data-testid="diet-twin-disclaimer">
            {DIET_TWIN_COPY.persistent}
          </p>
        </div>
        <div className="segment twin-segment twin-mode" role="group" aria-label={DIET_TWIN_COPY.hypothesisTitle}>
          <button
            type="button"
            data-testid="diet-twin-mode-records"
            aria-pressed={mode === 'records'}
            onClick={() => onMode('records')}
          >
            {DIET_TWIN_COPY.modeRecords}
          </button>
          <button
            type="button"
            data-testid="diet-twin-mode-hypothesis"
            aria-pressed={mode === 'hypothesis'}
            onClick={() => onMode('hypothesis')}
          >
            {DIET_TWIN_COPY.modeHypothesis}
          </button>
        </div>
      </div>
      <div className="pattern-screen-inner">
        <header className="pattern-hero">
          <p className="kicker">{DIET_TWIN_COPY.badge}</p>
          <h1>{DIET_TWIN_COPY.title}</h1>
          <p>{DIET_TWIN_COPY.intro}</p>
        </header>

        <div className="twin-columns">
        <section className="twin-section twin-col twin-col--records" data-testid="diet-twin-records" aria-labelledby="diet-twin-records-heading">
          <h2 id="diet-twin-records-heading">{DIET_TWIN_COPY.recordsTitle}</h2>
          <div className="twin-records-layout">
            <div className="twin-records-compose">
              <form
                className="twin-record-form"
                data-testid="diet-twin-add-form"
                data-editing={editing ? 'true' : 'false'}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (editing) onSaveEdit();
                  else onAdd();
                }}
              >
                <div className="twin-fields">
                  <label>
                    {DIET_TWIN_COPY.dateLabel}
                    <input
                      type="date"
                      value={date}
                      data-testid="diet-twin-date"
                      onChange={(event) => setDate(event.target.value)}
                    />
                  </label>
                  <label>
                    {DIET_TWIN_COPY.mealLabel}
                    <select
                      value={meal}
                      data-testid="diet-twin-meal"
                      onChange={(event) => {
                        if (isMeal(event.target.value)) setMeal(event.target.value);
                      }}
                    >
                      {MEAL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  {DIET_TWIN_COPY.textLabel}
                  <textarea
                    value={text}
                    rows={2}
                    data-testid="diet-twin-text"
                    onChange={(event) => setText(event.target.value)}
                  />
                </label>
                <div className="twin-record-actions">
                  <button
                    type="submit"
                    className="btn btn--primary pattern-main-btn"
                    data-testid={editing ? 'diet-twin-save-edit' : 'diet-twin-add'}
                  >
                    {editing ? DIET_TWIN_COPY.saveEdit : DIET_TWIN_COPY.add}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      className="btn btn--ghost pattern-main-btn"
                      data-testid="diet-twin-cancel-edit"
                      onClick={onCancelEdit}
                    >
                      {DIET_TWIN_COPY.cancelEdit}
                    </button>
                  )}
                </div>
              </form>
              <details className="twin-paste-fold" data-testid="diet-twin-paste-fold">
                <summary>{DIET_TWIN_COPY.pasteFoldSummary}</summary>
                <div className="twin-paste">
                  <label>
                    {DIET_TWIN_COPY.pasteLabel}
                    <textarea
                      value={paste}
                      rows={4}
                      data-testid="diet-twin-paste"
                      onChange={(event) => setPaste(event.target.value)}
                    />
                  </label>
                  <p className="twin-hint">{DIET_TWIN_COPY.pasteHint}</p>
                  <button
                    type="button"
                    className="btn btn--primary pattern-main-btn"
                    data-testid="diet-twin-paste-submit"
                    onClick={onPaste}
                  >
                    {DIET_TWIN_COPY.pasteSubmit}
                  </button>
                </div>
              </details>
              <p className="twin-notice" data-testid="diet-twin-notice" role="status">
                {notice ?? ''}
              </p>
              {atLimit && (
                <p className="twin-notice" data-testid="diet-twin-limit">
                  {DIET_TWIN_COPY.limitReached}
                </p>
              )}
            </div>
            <div className="twin-records-history" aria-labelledby="diet-twin-history-heading">
              <div className="twin-records-history-head">
                <p id="diet-twin-history-heading" className="twin-history-meta" data-testid="diet-twin-history-count">
                  {dietTwinHistoryMeta(visibleRecords.length)}
                </p>
                <div className="segment twin-segment" role="group" aria-label={DIET_TWIN_COPY.recordsTitle}>
                  <button
                    type="button"
                    data-testid="diet-twin-range-7"
                    aria-pressed={range === 7}
                    onClick={() => setRange(7)}
                  >
                    {DIET_TWIN_COPY.range7}
                  </button>
                  <button
                    type="button"
                    data-testid="diet-twin-range-30"
                    aria-pressed={range === 30}
                    onClick={() => setRange(30)}
                  >
                    {DIET_TWIN_COPY.range30}
                  </button>
                </div>
              </div>
              {visibleRecords.length === 0 ? (
                <p className="twin-hint twin-records-history-empty" data-testid="diet-twin-empty">
                  {DIET_TWIN_COPY.emptyList}
                </p>
              ) : (
                <div className="twin-records-history-scroll" data-testid="diet-twin-history-scroll">
                  <ul className="twin-list" data-testid="diet-twin-list">
                    {visibleRecords.map((record) => (
                      <li
                        key={record.id}
                        className="twin-record"
                        data-testid={`diet-twin-record-${record.id}`}
                        data-editing={editingId === record.id ? 'true' : 'false'}
                      >
                        <span>{record.date}</span>
                        <span>{MEAL_OPTIONS.find((option) => option.value === record.meal)?.label}</span>
                        <span className="twin-record-text">{record.text}</span>
                        <button
                          type="button"
                          className="btn btn--ghost twin-edit"
                          data-testid={`diet-twin-edit-${record.id}`}
                          aria-pressed={editingId === record.id}
                          onClick={() => onEdit(record)}
                        >
                          {DIET_TWIN_COPY.edit}
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost twin-delete"
                          data-testid={`diet-twin-delete-${record.id}`}
                          onClick={() => onDelete(record.id)}
                        >
                          {DIET_TWIN_COPY.remove}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="twin-col twin-col--status">
        {snapshot ? (
          <section
            className="twin-section twin-bars"
            data-testid="diet-twin-bars"
            data-based-on={snapshot.basedOn}
            aria-label={DIET_TWIN_COPY.statusTitle}
          >
            <h2>{DIET_TWIN_COPY.statusTitle}</h2>
            <p className="twin-hint" data-testid="diet-twin-based-on">
              {DIET_TWIN_BASED_ON[snapshot.basedOn]}
            </p>
            {DIET_TWIN_INDICATORS.map((indicator) => {
              const band = snapshotBand(snapshot, indicator.id);
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
                  <span className="twin-bar-caption" data-testid={`diet-twin-reading-${indicator.id}`}>
                    {DIET_TWIN_READINGS[indicator.id]}
                  </span>
                  <span className="twin-bar-action">{DIET_TWIN_COPY.openGraph}</span>
                </button>
              );
            })}
          </section>
        ) : (
          <p className="twin-section twin-hint" data-testid="diet-twin-guide">
            {DIET_TWIN_COPY.guide}
          </p>
        )}

        <section className="twin-section" data-testid="diet-twin-hypothesis" aria-labelledby="diet-twin-hypothesis-heading">
          <h2 id="diet-twin-hypothesis-heading">{DIET_TWIN_COPY.hypothesisTitle}</h2>
          {mode === 'hypothesis' ? (
            <form
              className="twin-questions"
              data-testid="diet-twin-questions"
              onSubmit={(event) => {
                event.preventDefault();
                if (!selected) onSubmit();
              }}
            >
              <p className="twin-hint">{DIET_TWIN_COPY.assumptionHint}</p>
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
              {!selected && (
                <button type="submit" className="btn btn--primary pattern-main-btn" data-testid="diet-twin-submit" disabled={!ready}>
                  {DIET_TWIN_COPY.submit}
                </button>
              )}
            </form>
          ) : (
            <p className="twin-hint">{DIET_TWIN_COPY.switchHint}</p>
          )}
        </section>
        </div>
        </div>
      </div>
    </main>
  );
}
