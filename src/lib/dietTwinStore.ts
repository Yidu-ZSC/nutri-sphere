/**
 * Local diet-twin store (TASK-NS-029).
 * Records and the questionnaire hypothesis stay on this device.
 * Bands are an educational sketch from a locked word list, not a measurement.
 */

import {
  DIET_TWIN_STORAGE_KEY,
  indicatorBand,
  isFiberLevel,
  isPlantLevel,
  isUpfLevel,
  type Band,
  type DietTwinAnswers,
  type FiberLevel,
  type PlantLevel,
  type TwinIndicatorId,
  type UpfLevel,
} from './dietTwin.ts';

export const DIET_TWIN_V1_STORAGE_KEY = 'cleardiet.dietTwin.v1';
export const DIET_TWIN_RECORD_LIMIT = 200;
export const DIET_TWIN_INFERENCE_DAYS = 7;

export const PLANT_LEXICON = [
  '蔬菜',
  '青菜',
  '豆',
  '大豆',
  '豆腐',
  '全谷',
  '糙米',
  '燕麦',
  '水果',
  '坚果',
  '素',
  '菌菇',
  '薯',
] as const;

export const UPF_LEXICON = [
  '零食',
  '薯片',
  '饮料',
  '可乐',
  '即食',
  '方便面',
  '罐头',
  '加工肉',
  '火腿',
  '香肠',
  '鸡块',
  '速冻',
  '风味',
] as const;

export const FIBER_LEXICON = ['纤维', '豆', '全谷', '燕麦', '糙米', '蔬菜', '青菜', '水果', '薯'] as const;

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const BANDS = ['low', 'mid', 'high'] as const;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type Meal = (typeof MEALS)[number];
export type BasedOn = 'records' | 'hypothesis';

export interface DietRecord {
  id: string;
  date: string;
  meal: Meal;
  text: string;
  createdAt: string;
}

export interface DietHypothesis {
  plantRatio: Band;
  upfFreq: Band;
  fiberFeel: Band;
}

export interface TwinSnapshot {
  plantRatio: Band;
  upfFreq: Band;
  fiberFeel: Band;
  inflammationDir: Band;
  basedOn: BasedOn;
  updatedAt: string;
}

export interface DietTwinStore {
  version: 1;
  records: DietRecord[];
  hypothesis: DietHypothesis | null;
  lastSnapshot: TwinSnapshot | null;
}

export interface DietTwinStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface RecordInput {
  date: string;
  meal: string;
  text: string;
}

export type RejectReason = 'text' | 'date' | 'meal' | 'limit';

export interface RejectedRecord {
  text: string;
  reason: RejectReason;
}

export interface AddRecordsResult {
  store: DietTwinStore;
  added: DietRecord[];
  rejected: RejectedRecord[];
}

export interface OpenedDietTwin {
  store: DietTwinStore;
  mode: BasedOn;
}

export function emptyDietTwinStore(): DietTwinStore {
  return { version: 1, records: [], hypothesis: null, lastSnapshot: null };
}

export function isMeal(value: string): value is Meal {
  return (MEALS as readonly string[]).includes(value);
}

export function isIsoDate(value: string): boolean {
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function normalizeRecordText(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length < 1 || trimmed.length > 200) return null;
  return trimmed;
}

export function formatLocalDate(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftIsoDate(iso: string, deltaDays: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + deltaDays);
  return formatLocalDate(date);
}

export function inLastDays(iso: string, today: string, days: number): boolean {
  if (!isIsoDate(iso) || !isIsoDate(today) || days < 1) return false;
  const start = shiftIsoDate(today, 1 - days);
  return iso >= start && iso <= today;
}

export function textHitsAny(text: string, words: readonly string[]): boolean {
  const haystack = text.toLowerCase();
  return words.some((word) => word.length > 0 && haystack.includes(word.toLowerCase()));
}

export function linesFromPaste(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function inputsFromPaste(raw: string, today: string): RecordInput[] {
  return linesFromPaste(raw).map((text) => ({ date: today, meal: 'snack', text }));
}

export function bandFromRatio(hits: number, total: number): Band {
  if (total <= 0) return 'low';
  if (hits * 3 < total) return 'low';
  if (hits * 3 < total * 2) return 'mid';
  return 'high';
}

/**
 * Educational combination. Not a personal measurement.
 * upf high + plant low starts high; upf low + plant high starts low; otherwise mid.
 * fiber low lifts a low result to mid; fiber high lowers a high result to mid.
 */
export function inflammationFromBands(plant: Band, upf: Band, fiber: Band): Band {
  let result: Band = 'mid';
  if (upf === 'high' && plant === 'low') result = 'high';
  else if (upf === 'low' && plant === 'high') result = 'low';
  if (fiber === 'low' && result === 'low') return 'mid';
  if (fiber === 'high' && result === 'high') return 'mid';
  return result;
}

export function hypothesisFromAnswers(answers: DietTwinAnswers): DietHypothesis {
  return {
    plantRatio: indicatorBand('plant', answers),
    upfFreq: indicatorBand('upf', answers),
    fiberFeel: indicatorBand('fiber', answers),
  };
}

export function answersFromHypothesis(hypothesis: DietHypothesis): DietTwinAnswers {
  const plant: PlantLevel =
    hypothesis.plantRatio === 'low' ? 'plant_low' : hypothesis.plantRatio === 'mid' ? 'plant_mid' : 'plant_high';
  const upf: UpfLevel =
    hypothesis.upfFreq === 'low' ? 'upf_rare' : hypothesis.upfFreq === 'mid' ? 'upf_weekly' : 'upf_daily';
  const fiber: FiberLevel =
    hypothesis.fiberFeel === 'low' ? 'fiber_low' : hypothesis.fiberFeel === 'mid' ? 'fiber_mid' : 'fiber_high';
  return { plant, upf, fiber };
}

export function hypothesisFromLegacyRaw(raw: string | null): DietHypothesis | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const record = data as Record<string, unknown>;
    if (record.v !== 1) return null;
    const assumption = readLegacyAnswers(record.assumption);
    const answers = readLegacyAnswers(record.answers);
    const chosen = assumption ?? answers;
    if (!chosen) return null;
    return hypothesisFromAnswers(chosen);
  } catch {
    return null;
  }
}

export function recordsInRange(records: readonly DietRecord[], today: string, days: number): DietRecord[] {
  return records
    .filter((record) => inLastDays(record.date, today, days))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function inferFromRecords(
  records: readonly DietRecord[],
  today: string,
): Pick<TwinSnapshot, 'plantRatio' | 'upfFreq' | 'fiberFeel' | 'inflammationDir'> | null {
  const windowed = records.filter((record) => inLastDays(record.date, today, DIET_TWIN_INFERENCE_DAYS));
  if (windowed.length === 0) return null;
  const plantRatio = bandFromRatio(countHits(windowed, PLANT_LEXICON), windowed.length);
  const upfFreq = bandFromRatio(countHits(windowed, UPF_LEXICON), windowed.length);
  const fiberFeel = bandFromRatio(countHits(windowed, FIBER_LEXICON), windowed.length);
  return {
    plantRatio,
    upfFreq,
    fiberFeel,
    inflammationDir: inflammationFromBands(plantRatio, upfFreq, fiberFeel),
  };
}

export function snapshotBand(snapshot: TwinSnapshot, indicator: TwinIndicatorId): Band {
  if (indicator === 'plant') return snapshot.plantRatio;
  if (indicator === 'upf') return snapshot.upfFreq;
  if (indicator === 'fiber') return snapshot.fiberFeel;
  return snapshot.inflammationDir;
}

export function resolveSnapshot(
  store: DietTwinStore,
  mode: BasedOn,
  today: string,
  updatedAt: string,
): TwinSnapshot | null {
  if (mode === 'records') {
    const inferred = inferFromRecords(store.records, today);
    if (inferred) return { ...inferred, basedOn: 'records', updatedAt };
  }
  if (!store.hypothesis) return null;
  return {
    plantRatio: store.hypothesis.plantRatio,
    upfFreq: store.hypothesis.upfFreq,
    fiberFeel: store.hypothesis.fiberFeel,
    inflammationDir: inflammationFromBands(
      store.hypothesis.plantRatio,
      store.hypothesis.upfFreq,
      store.hypothesis.fiberFeel,
    ),
    basedOn: 'hypothesis',
    updatedAt,
  };
}

export function withSnapshot(store: DietTwinStore, mode: BasedOn, now: Date): DietTwinStore {
  const today = formatLocalDate(now);
  const previous = store.lastSnapshot;
  const next = resolveSnapshot(store, mode, today, previous?.updatedAt ?? now.toISOString());
  if (!next) {
    if (previous == null) return store;
    return { ...store, lastSnapshot: null };
  }
  if (
    previous &&
    previous.plantRatio === next.plantRatio &&
    previous.upfFreq === next.upfFreq &&
    previous.fiberFeel === next.fiberFeel &&
    previous.inflammationDir === next.inflammationDir &&
    previous.basedOn === next.basedOn
  ) {
    return store;
  }
  return { ...store, lastSnapshot: { ...next, updatedAt: now.toISOString() } };
}

export function defaultBasedOn(store: DietTwinStore, today: string): BasedOn {
  return recordsInRange(store.records, today, DIET_TWIN_INFERENCE_DAYS).length > 0 ? 'records' : 'hypothesis';
}

export function withHypothesis(store: DietTwinStore, hypothesis: DietHypothesis): DietTwinStore {
  return { ...store, hypothesis: { ...hypothesis } };
}

export function addRecords(
  store: DietTwinStore,
  inputs: readonly RecordInput[],
  now: Date,
  createId: () => string = randomId,
): AddRecordsResult {
  const records = store.records.slice();
  const added: DietRecord[] = [];
  const rejected: RejectedRecord[] = [];
  for (const input of inputs) {
    const text = normalizeRecordText(input.text);
    if (!text) {
      rejected.push({ text: input.text, reason: 'text' });
      continue;
    }
    if (!isIsoDate(input.date)) {
      rejected.push({ text, reason: 'date' });
      continue;
    }
    if (!isMeal(input.meal)) {
      rejected.push({ text, reason: 'meal' });
      continue;
    }
    if (records.length >= DIET_TWIN_RECORD_LIMIT) {
      rejected.push({ text, reason: 'limit' });
      continue;
    }
    const record: DietRecord = {
      id: createId(),
      date: input.date,
      meal: input.meal,
      text,
      createdAt: now.toISOString(),
    };
    records.push(record);
    added.push(record);
  }
  if (added.length === 0) return { store, added, rejected };
  return { store: { ...store, records }, added, rejected };
}

export function deleteRecord(store: DietTwinStore, id: string): DietTwinStore {
  const records = store.records.filter((record) => record.id !== id);
  if (records.length === store.records.length) return store;
  return { ...store, records };
}

export function parseDietTwinStore(raw: string | null): DietTwinStore | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const record = data as Record<string, unknown>;
    if (record.version !== 1 || !Array.isArray(record.records)) return null;
    return {
      version: 1,
      records: record.records.map(readRecord).filter((item): item is DietRecord => item != null),
      hypothesis: record.hypothesis == null ? null : readHypothesis(record.hypothesis),
      lastSnapshot: readSnapshot(record.lastSnapshot),
    };
  } catch {
    return null;
  }
}

export function loadDietTwin(storage?: DietTwinStorage | null, now: Date = new Date()): DietTwinStore {
  const target = storage === undefined ? browserStorage() : storage;
  if (!target) return emptyDietTwinStore();
  try {
    const existing = parseDietTwinStore(safeGet(target, DIET_TWIN_V1_STORAGE_KEY));
    if (existing) return existing;
    return migrateFromV0IfNeeded(target, now) ?? emptyDietTwinStore();
  } catch {
    return emptyDietTwinStore();
  }
}

export function saveDietTwin(store: DietTwinStore, storage?: DietTwinStorage | null): void {
  const target = storage === undefined ? browserStorage() : storage;
  try {
    target?.setItem(DIET_TWIN_V1_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Persistence is best-effort. The in-memory screen still updates.
  }
}

export function migrateFromV0IfNeeded(storage: DietTwinStorage, now: Date): DietTwinStore | null {
  if (parseDietTwinStore(safeGet(storage, DIET_TWIN_V1_STORAGE_KEY))) return null;
  const hypothesis = hypothesisFromLegacyRaw(safeGet(storage, DIET_TWIN_STORAGE_KEY));
  if (!hypothesis) return null;
  const store = withSnapshot(
    { version: 1, records: [], hypothesis, lastSnapshot: null },
    'hypothesis',
    now,
  );
  try {
    storage.setItem(DIET_TWIN_V1_STORAGE_KEY, JSON.stringify(store));
  } catch {
    return store;
  }
  try {
    storage.removeItem(DIET_TWIN_STORAGE_KEY);
  } catch {
    // The new key is already written. Leaving the old key does not block the screen.
  }
  return store;
}

export function openDietTwin(storage?: DietTwinStorage | null, now: Date = new Date()): OpenedDietTwin {
  const loaded = loadDietTwin(storage, now);
  const mode = defaultBasedOn(loaded, formatLocalDate(now));
  const store = withSnapshot(loaded, mode, now);
  if ((store.records.length > 0 || store.hypothesis) && store !== loaded) {
    saveDietTwin(store, storage);
  }
  return { store, mode };
}

function countHits(records: readonly DietRecord[], words: readonly string[]): number {
  return records.reduce((count, record) => count + (textHitsAny(record.text, words) ? 1 : 0), 0);
}

function readLegacyAnswers(value: unknown): DietTwinAnswers | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.plant !== 'string' || !isPlantLevel(record.plant)) return null;
  if (typeof record.upf !== 'string' || !isUpfLevel(record.upf)) return null;
  if (typeof record.fiber !== 'string' || !isFiberLevel(record.fiber)) return null;
  return { plant: record.plant, upf: record.upf, fiber: record.fiber };
}

function isBand(value: unknown): value is Band {
  return typeof value === 'string' && (BANDS as readonly string[]).includes(value);
}

function readHypothesis(value: unknown): DietHypothesis | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (!isBand(record.plantRatio) || !isBand(record.upfFreq) || !isBand(record.fiberFeel)) return null;
  return { plantRatio: record.plantRatio, upfFreq: record.upfFreq, fiberFeel: record.fiberFeel };
}

function readRecord(value: unknown): DietRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || record.id.trim().length === 0) return null;
  if (typeof record.date !== 'string' || !isIsoDate(record.date)) return null;
  if (typeof record.meal !== 'string' || !isMeal(record.meal)) return null;
  if (typeof record.text !== 'string') return null;
  const text = normalizeRecordText(record.text);
  if (!text) return null;
  if (typeof record.createdAt !== 'string' || Number.isNaN(Date.parse(record.createdAt))) return null;
  return { id: record.id, date: record.date, meal: record.meal, text, createdAt: record.createdAt };
}

function readSnapshot(value: unknown): TwinSnapshot | null {
  if (value == null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    !isBand(record.plantRatio) ||
    !isBand(record.upfFreq) ||
    !isBand(record.fiberFeel) ||
    !isBand(record.inflammationDir)
  ) {
    return null;
  }
  if (record.basedOn !== 'records' && record.basedOn !== 'hypothesis') return null;
  if (typeof record.updatedAt !== 'string' || Number.isNaN(Date.parse(record.updatedAt))) return null;
  return {
    plantRatio: record.plantRatio,
    upfFreq: record.upfFreq,
    fiberFeel: record.fiberFeel,
    inflammationDir: record.inflammationDir,
    basedOn: record.basedOn,
    updatedAt: record.updatedAt,
  };
}

function safeGet(storage: DietTwinStorage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function browserStorage(): DietTwinStorage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `rec-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
