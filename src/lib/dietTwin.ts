/**
 * Personal diet twin questionnaire and locked copy (TASK-NS-028, extended by TASK-NS-029).
 * The screen still shows the original three-way labels. The v1 store maps them to low / mid / high.
 * Record storage and the record-window bands live in dietTwinStore.ts.
 * 基于公开资料的教育模拟，非个人生理测量。
 */

export const DIET_TWIN_STORAGE_KEY = 'cleardiet.dietTwin';

export type PlantLevel = 'plant_low' | 'plant_mid' | 'plant_high';
export type UpfLevel = 'upf_rare' | 'upf_weekly' | 'upf_daily';
export type FiberLevel = 'fiber_low' | 'fiber_mid' | 'fiber_high';
export type Band = 'low' | 'mid' | 'high';
export type TwinIndicatorId = 'plant' | 'upf' | 'fiber' | 'inflammation';

export interface DietTwinAnswers {
  plant: PlantLevel;
  upf: UpfLevel;
  fiber: FiberLevel;
}

/** Current questionnaire plus the assumption the bars are using. Overwrite, never a history list. */
export interface DietTwinSnapshot {
  v: 1;
  answers: DietTwinAnswers;
  assumption: DietTwinAnswers;
}

export interface TwinExploreTarget {
  /** Null when the seed has no such node. Callers then open the theme only. */
  nodeId: string | null;
  themeId: string;
}

export const DIET_TWIN_COPY = {
  entryKicker: '教育模拟 · 非诊断',
  entryTitle: '我的饮食孪生',
  entryPrompt: '用三道短问对照公开资料里的饮食叙述',
  entryBlurb: '模拟对照，不是个人检测',
  title: '我的饮食孪生',
  badge: '模拟，非诊断',
  persistent: '这是教育模拟，不是你个人的健康检测或诊断。',
  intro: '记下饮食原文，或改一档假设。结果只是公开资料叙事的教育对照。',
  submit: '查看对照',
  assumptionHint: '改这里的档位会写入假设。',
  switchHint: '切换到假设后可改三问。',
  barNote: '教育模拟 · 非个人检测',
  openGraph: '查看图谱里的相关讨论',
  plantQuestion: '近期植物性食物比例',
  upfQuestion: '超加工食品频率',
  fiberQuestion: '膳食纤维感受（主观）',
  plantBar: '植物性比例',
  upfBar: '超加工频率',
  fiberBar: '纤维感受',
  inflammationBar: '炎症关联',
  inflammationCaption: '公开资料中常被描述为与这些饮食选择一起出现的关联方向。',
  bandLow: '低',
  bandMid: '中',
  bandHigh: '高',
  back: '返回大厅',
  recordsTitle: '饮食记录',
  dateLabel: '日期',
  mealLabel: '餐次',
  textLabel: '原文',
  add: '添加',
  pasteLabel: '多行粘贴',
  pasteHint: '每行一条，记为今天的加餐。',
  pasteSubmit: '粘贴并添加',
  pasteEmpty: '先贴上至少一行原文。',
  range7: '最近 7 天',
  range30: '最近 30 天',
  remove: '删除',
  emptyList: '这几天还没有记录。',
  limitReached: '记录已满 200 条，请先删除再添加。',
  rejected: '有内容未保存：原文需为 1 到 200 个字，日期和餐次需有效。',
  added: '已添加。',
  statusTitle: '当前状态',
  hypothesisTitle: '假设',
  modeRecords: '基于记录',
  modeHypothesis: '假设',
  guide: '先记一笔饮食，或完成下面的假设三问。',
  mealBreakfast: '早餐',
  mealLunch: '午餐',
  mealDinner: '晚餐',
  mealSnack: '加餐',
  basedOnRecords: '基于你的本地记录（教育模拟）',
  basedOnHypothesis: '基于假设（教育模拟）',
  readingPlant: '公开资料中常把更高比例的植物性食物选择与膳食模式讨论联系起来。',
  readingUpf: '公开资料中常把更频繁的超加工食品选择与相关机制/观察描述联系起来。',
  readingFiber: '公开资料中常把膳食纤维摄入感受与消化及代谢相关讨论联系起来。',
  readingInflammation: '公开资料中常把多种饮食选择的组合与慢性炎症相关讨论联系起来。',
} as const;

export const DIET_TWIN_READINGS: Record<TwinIndicatorId, string> = {
  plant: DIET_TWIN_COPY.readingPlant,
  upf: DIET_TWIN_COPY.readingUpf,
  fiber: DIET_TWIN_COPY.readingFiber,
  inflammation: DIET_TWIN_COPY.readingInflammation,
};

export const DIET_TWIN_BASED_ON = {
  records: DIET_TWIN_COPY.basedOnRecords,
  hypothesis: DIET_TWIN_COPY.basedOnHypothesis,
} as const;

const PLANT_OPTIONS = [
  { value: 'plant_low', label: '很少' },
  { value: 'plant_mid', label: '约一半' },
  { value: 'plant_high', label: '大多是植物性' },
] as const;

const UPF_OPTIONS = [
  { value: 'upf_rare', label: '很少' },
  { value: 'upf_weekly', label: '每周几次' },
  { value: 'upf_daily', label: '几乎每天' },
] as const;

const FIBER_OPTIONS = [
  { value: 'fiber_low', label: '偏少' },
  { value: 'fiber_mid', label: '一般' },
  { value: 'fiber_high', label: '比较充足' },
] as const;

export type DietTwinQuestion =
  | { id: 'plant'; prompt: string; options: typeof PLANT_OPTIONS }
  | { id: 'upf'; prompt: string; options: typeof UPF_OPTIONS }
  | { id: 'fiber'; prompt: string; options: typeof FIBER_OPTIONS };

export const DIET_TWIN_QUESTIONS: readonly DietTwinQuestion[] = [
  { id: 'plant', prompt: DIET_TWIN_COPY.plantQuestion, options: PLANT_OPTIONS },
  { id: 'upf', prompt: DIET_TWIN_COPY.upfQuestion, options: UPF_OPTIONS },
  { id: 'fiber', prompt: DIET_TWIN_COPY.fiberQuestion, options: FIBER_OPTIONS },
];

export const DIET_TWIN_INDICATORS: readonly {
  id: TwinIndicatorId;
  label: string;
  caption: string | null;
}[] = [
  { id: 'plant', label: DIET_TWIN_COPY.plantBar, caption: null },
  { id: 'upf', label: DIET_TWIN_COPY.upfBar, caption: null },
  { id: 'fiber', label: DIET_TWIN_COPY.fiberBar, caption: null },
  { id: 'inflammation', label: DIET_TWIN_COPY.inflammationBar, caption: DIET_TWIN_COPY.inflammationCaption },
];

/** Locked chain-back targets. Do not invent seed ids to fill a gap. */
export const TWIN_LINKS: Record<TwinIndicatorId, { nodeId: string; themeId: string }> = {
  plant: { nodeId: 'plant_based_diet', themeId: 'plant-based' },
  upf: { nodeId: 'ultra_processed', themeId: 'ultra-processed' },
  fiber: { nodeId: 'dietary_fiber', themeId: 'dietary-fiber' },
  inflammation: { nodeId: 'chronic_inflammation', themeId: 'chronic-inflammation' },
};

const PLANT_BAND: Record<PlantLevel, Band> = {
  plant_low: 'low',
  plant_mid: 'mid',
  plant_high: 'high',
};

const UPF_BAND: Record<UpfLevel, Band> = {
  upf_rare: 'low',
  upf_weekly: 'mid',
  upf_daily: 'high',
};

const FIBER_BAND: Record<FiberLevel, Band> = {
  fiber_low: 'low',
  fiber_mid: 'mid',
  fiber_high: 'high',
};

/**
 * Educational weights for the inflammation band.
 * 基于公开资料的教育模拟，非个人生理测量。
 * Higher plants and fiber pull the band down. More frequent ultra-processed choices pull it up.
 * Sum 0–1 low, 2–4 mid, 5–6 high. Never a numeric result on screen.
 */
const INFLAMMATION_WEIGHT = {
  plant_low: 2,
  plant_mid: 1,
  plant_high: 0,
  upf_rare: 0,
  upf_weekly: 1,
  upf_daily: 2,
  fiber_low: 2,
  fiber_mid: 1,
  fiber_high: 0,
} as const;

export function isPlantLevel(value: string): value is PlantLevel {
  return value === 'plant_low' || value === 'plant_mid' || value === 'plant_high';
}

export function isUpfLevel(value: string): value is UpfLevel {
  return value === 'upf_rare' || value === 'upf_weekly' || value === 'upf_daily';
}

export function isFiberLevel(value: string): value is FiberLevel {
  return value === 'fiber_low' || value === 'fiber_mid' || value === 'fiber_high';
}

export function bandLabel(band: Band): string {
  if (band === 'low') return DIET_TWIN_COPY.bandLow;
  if (band === 'mid') return DIET_TWIN_COPY.bandMid;
  return DIET_TWIN_COPY.bandHigh;
}

export function indicatorBand(id: TwinIndicatorId, assumption: DietTwinAnswers): Band {
  if (id === 'plant') return PLANT_BAND[assumption.plant];
  if (id === 'upf') return UPF_BAND[assumption.upf];
  if (id === 'fiber') return FIBER_BAND[assumption.fiber];
  return inflammationBand(assumption);
}

export function inflammationBand(assumption: DietTwinAnswers): Band {
  const sum =
    INFLAMMATION_WEIGHT[assumption.plant] +
    INFLAMMATION_WEIGHT[assumption.upf] +
    INFLAMMATION_WEIGHT[assumption.fiber];
  if (sum <= 1) return 'low';
  if (sum <= 4) return 'mid';
  return 'high';
}

export function buildSnapshot(answers: DietTwinAnswers): DietTwinSnapshot {
  return {
    v: 1,
    answers: { ...answers },
    assumption: { ...answers },
  };
}

export function withAssumption(snapshot: DietTwinSnapshot, assumption: DietTwinAnswers): DietTwinSnapshot {
  return {
    v: 1,
    answers: { ...snapshot.answers },
    assumption: { ...assumption },
  };
}

function parseAnswers(value: unknown): DietTwinAnswers | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.plant !== 'string' || !isPlantLevel(record.plant)) return null;
  if (typeof record.upf !== 'string' || !isUpfLevel(record.upf)) return null;
  if (typeof record.fiber !== 'string' || !isFiberLevel(record.fiber)) return null;
  return { plant: record.plant, upf: record.upf, fiber: record.fiber };
}

export function parseDietTwinSnapshot(raw: string | null): DietTwinSnapshot | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object') return null;
    const record = data as Record<string, unknown>;
    if (record.v !== 1) return null;
    const answers = parseAnswers(record.answers);
    const assumption = parseAnswers(record.assumption);
    if (!answers || !assumption) return null;
    return { v: 1, answers, assumption };
  } catch {
    return null;
  }
}

function browserStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function readDietTwin(storage?: Pick<Storage, 'getItem'> | null): DietTwinSnapshot | null {
  const store = storage === undefined ? browserStorage() : storage;
  try {
    return parseDietTwinSnapshot(store?.getItem(DIET_TWIN_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

export function writeDietTwin(snapshot: DietTwinSnapshot, storage?: Pick<Storage, 'setItem'> | null): void {
  const store = storage === undefined ? browserStorage() : storage;
  try {
    store?.setItem(DIET_TWIN_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Persistence is best-effort. The in-memory screen still updates.
  }
}

/** Prefer the node. If it is absent from the loaded graph, keep the theme only. */
export function twinExploreTarget(
  indicator: TwinIndicatorId,
  knownNodeIds: ReadonlySet<string> | null,
): TwinExploreTarget {
  const link = TWIN_LINKS[indicator];
  const nodeId = knownNodeIds?.has(link.nodeId) ? link.nodeId : null;
  return { nodeId, themeId: link.themeId };
}
