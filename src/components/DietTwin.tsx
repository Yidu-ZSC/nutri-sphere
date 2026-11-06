import { useEffect, useRef, useState, type Ref } from 'react';
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
import { SHELL_TWIN_LABEL } from '../lib/exploreShell';

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

/**
 * Keep the local twin session above the workspace switch. Mounting either the
 * canvas or the rail controls must never recreate the store or discard a draft.
 */
export function useDietTwinController() {
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

  return {
    store,
    mode,
    snapshot: store.lastSnapshot,
    selected,
    active,
    ready,
    visibleRecords,
    atLimit,
    editing,
    editingId,
    date,
    meal,
    text,
    paste,
    range,
    notice,
    setDate,
    setMeal,
    setText,
    setPaste,
    setRange,
    onAdd,
    onSaveEdit,
    onPaste,
    onEdit,
    onDelete,
    onCancelEdit,
    onMode,
    onChoose,
    onSubmit,
  };
}

export type DietTwinController = ReturnType<typeof useDietTwinController>;

export function DietTwinControls({
  controller,
  recordRef,
}: {
  controller: DietTwinController;
  recordRef?: Ref<HTMLTextAreaElement>;
}) {
  const {
    mode,
    selected,
    active,
    ready,
    visibleRecords,
    atLimit,
    editing,
    editingId,
    date,
    meal,
    text,
    paste,
    range,
    notice,
    setDate,
    setMeal,
    setText,
    setPaste,
    setRange,
    onAdd,
    onSaveEdit,
    onPaste,
    onEdit,
    onDelete,
    onCancelEdit,
    onMode,
    onChoose,
    onSubmit,
  } = controller;

  return (
    <div className="twin-controls" data-testid="diet-twin-controls">
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

      <section className="shell-rail-section" data-testid="diet-twin-records" aria-labelledby="diet-twin-records-heading">
        <h2 id="diet-twin-records-heading" className="shell-rail-heading">
          {DIET_TWIN_COPY.recordsTitle}
        </h2>
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
              ref={recordRef}
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
      </section>

      <section className="shell-rail-section" data-testid="diet-twin-hypothesis" aria-labelledby="diet-twin-hypothesis-heading">
        <h2 id="diet-twin-hypothesis-heading" className="shell-rail-heading">
          {DIET_TWIN_COPY.hypothesisTitle}
        </h2>
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
  );
}

function TwinSilhouette() {
  return (
    <svg className="twin-silhouette" viewBox="0 0 200 180" aria-hidden="true" focusable="false">
      <circle className="twin-silhouette-ring" cx="100" cy="90" r="80" />
      <circle className="twin-silhouette-core" cx="100" cy="90" r="57" />
      <circle className="twin-silhouette-head" cx="100" cy="46" r="14" />
      <path
        className="twin-silhouette-body"
        d="M100 60C90 62 84 68 82 76C84 92 86 108 90 122C94 128 106 128 110 122C114 108 116 92 118 76C116 68 110 62 100 60Z"
      />
      <path className="twin-silhouette-limb" d="M94 122 91 143 88 164M106 122l3 21 3 21" />
      <path className="twin-silhouette-limb" d="M82 76 71 53 60 32M118 76l11-23 11-21" />
      <circle className="twin-silhouette-dot" cx="100" cy="78" r="3.2" />
      <circle className="twin-silhouette-dot" cx="100" cy="95" r="3.2" />
      <circle className="twin-silhouette-dot" cx="100" cy="112" r="3.2" />
    </svg>
  );
}

/** Animated top-right entry into the diet twin. Fixed to the shell by App. */
export function DietTwinIcon({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      className="twin-entry-icon"
      data-testid="diet-twin-entry"
      aria-label={SHELL_TWIN_LABEL}
      title={SHELL_TWIN_LABEL}
      onClick={onOpen}
    >
      <span className="twin-entry-glow" aria-hidden="true" />
      <svg className="twin-entry-silhouette" viewBox="0 0 200 180" focusable="false" aria-hidden="true">
        <circle className="twin-entry-ring" cx="100" cy="90" r="68" />
        <circle className="twin-entry-core" cx="100" cy="90" r="56" />
        <g className="twin-entry-figure">
          <circle className="twin-entry-head" cx="100" cy="41" r="15.5" />
          <path
            className="twin-entry-body"
            d="M100 57C88 60 80 66 78 76C80 94 83 110 89 122C93 129 107 129 111 122C117 110 120 94 122 76C120 66 112 60 100 57Z"
          />
          <g className="twin-entry-arm twin-entry-arm--left">
            <path className="twin-entry-limb" d="M78 74C70 56 64 41 59 27" />
          </g>
          <g className="twin-entry-arm twin-entry-arm--right">
            <path className="twin-entry-limb" d="M122 74C130 56 136 41 141 27" />
          </g>
          <path className="twin-entry-limb" d="M91 122C89 135 88 147 87 158" />
          <path className="twin-entry-limb" d="M109 122C111 135 112 147 113 158" />
        </g>
        <circle className="twin-entry-dot" cx="100" cy="73" r="3.2" />
        <circle className="twin-entry-dot" cx="100" cy="91" r="3.2" style={{ animationDelay: '0.5s' }} />
        <circle className="twin-entry-dot" cx="100" cy="109" r="3.2" style={{ animationDelay: '1s' }} />
      </svg>
    </button>
  );
}

function DietTwinStatus({
  controller,
  onOpenIndicator,
}: {
  controller: DietTwinController;
  onOpenIndicator: (indicator: TwinIndicatorId) => void;
}) {
  const { snapshot } = controller;

  return (
    <section className="twin-status" data-testid="diet-twin-status" aria-label={DIET_TWIN_COPY.statusTitle}>
      <section className="twin-figure-panel" aria-label="饮食孪生示意">
        <TwinSilhouette />
        <p className="twin-figure-note">教育示意 · 非个人生理测量</p>
      </section>

      <section
        className="twin-section twin-bars twin-canvas-status"
        data-testid="diet-twin-bars"
        data-based-on={snapshot?.basedOn ?? 'empty'}
        aria-label={DIET_TWIN_COPY.statusTitle}
      >
        <h2>{DIET_TWIN_COPY.statusTitle}</h2>
        {snapshot ? (
          <>
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
          </>
        ) : (
          <p className="twin-hint" data-testid="diet-twin-guide">
            {DIET_TWIN_COPY.guide}
          </p>
        )}
      </section>
    </section>
  );
}

export function DietTwinModal({
  controller,
  onClose,
  onOpenIndicator,
}: {
  controller: DietTwinController;
  onClose: () => void;
  onOpenIndicator: (indicator: TwinIndicatorId) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="twin-modal-layer"
      data-testid="diet-twin-modal"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="twin-modal" role="dialog" aria-modal="true" aria-label={DIET_TWIN_COPY.title}>
        <header className="twin-modal-head">
          <div className="twin-modal-title">
            <p className="twin-edu-badge" data-testid="diet-twin-edu-badge">
              {TWIN_SHORT_BADGE}
            </p>
            <h2>{DIET_TWIN_COPY.title}</h2>
            <p className="twin-persistent">{DIET_TWIN_COPY.persistent}</p>
          </div>
          <button ref={closeRef} type="button" className="btn btn--ghost" onClick={onClose}>
            关闭
          </button>
        </header>
        <div className="twin-modal-body">
          <DietTwinStatus controller={controller} onOpenIndicator={onOpenIndicator} />
          <DietTwinControls controller={controller} />
        </div>
      </div>
    </div>
  );
}
