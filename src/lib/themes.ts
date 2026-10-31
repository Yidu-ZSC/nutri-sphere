export type ThemeKind = 'health_topic' | 'mechanism_deep';

export interface ExploreTheme {
  id: string;
  /** Short label used on the explore ThemeBar. */
  label: string;
  /** Vernacular card title on the theme lobby. */
  title: string;
  /** Educational question. Not a treatment prompt. */
  prompt: string;
  /** ≤40 characters. Educational only. */
  blurb: string;
  diseaseId: string | null;
  mechanismId: string | null;
  kind: ThemeKind;
}

/** Primary lobby grid: one card per disease node. */
export const HOME_HEALTH_THEMES: readonly ExploreTheme[] = [
  {
    id: 'cardiometabolic',
    label: '心血管 / 代谢',
    title: '心血管 / 代谢',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '教育向整理：饮食与心血管、代谢主题常被一起讨论。',
    diseaseId: 'cardiometabolic',
    mechanismId: null,
    kind: 'health_topic',
  },
  {
    id: 'fatty_liver',
    label: '脂肪肝相关',
    title: '脂肪肝相关',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '教育向整理：与代谢、炎症叙述常被一起讨论。',
    diseaseId: 'fatty_liver',
    mechanismId: null,
    kind: 'health_topic',
  },
  {
    id: 'obesity_risk',
    label: '肥胖相关风险',
    title: '肥胖相关风险',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '教育向整理：体重相关主题与饮食叙述常一起出现。',
    diseaseId: 'obesity_risk',
    mechanismId: null,
    kind: 'health_topic',
  },
  {
    id: 'ibd_related',
    label: '炎症性肠病相关',
    title: '炎症性肠病相关',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '教育向整理：屏障与炎症叙述里常被一起讨论。',
    diseaseId: 'ibd_related',
    mechanismId: null,
    kind: 'health_topic',
  },
  {
    id: 'liver_chronic',
    label: '慢性肝炎相关进展',
    title: '慢性肝炎相关进展',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '教育向整理：书摘里与饮食、肝脏叙述常一起出现。',
    diseaseId: 'liver_chronic',
    mechanismId: null,
    kind: 'health_topic',
  },
  {
    id: 'digestive_cancer_risk',
    label: '消化系统癌症风险',
    title: '消化系统癌症风险',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '教育向整理：消化系统风险主题与饮食常被讨论。',
    diseaseId: 'digestive_cancer_risk',
    mechanismId: null,
    kind: 'health_topic',
  },
  {
    id: 'autoimmune',
    label: '自身免疫相关',
    title: '自身免疫相关',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '教育向整理：自身免疫主题与饮食叙述常被讨论。',
    diseaseId: 'autoimmune',
    mechanismId: null,
    kind: 'health_topic',
  },
  {
    id: 'mental_health',
    label: '心理健康 / 抑郁等',
    title: '心理健康 / 抑郁等',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '教育向整理：情绪相关主题与饮食常被一起讨论。',
    diseaseId: 'mental_health',
    mechanismId: null,
    kind: 'health_topic',
  },
  {
    id: 'breast_prostate_risk',
    label: '乳腺与前列腺风险',
    title: '乳腺与前列腺风险',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '教育向整理：这些风险主题与饮食叙述常被讨论。',
    diseaseId: 'breast_prostate_risk',
    mechanismId: null,
    kind: 'health_topic',
  },
];

/**
 * Secondary lobby fold. Mechanism topics stay collapsed so they do not cover the disease grid.
 * chronic-inflammation and gut-barrier keep their existing theme ids.
 */
export const HOME_MECHANISM_THEMES: readonly ExploreTheme[] = [
  {
    id: 'chronic-inflammation',
    label: '慢性炎症',
    title: '慢性炎症',
    prompt: '这个机制和饮食常被怎样一起讨论？',
    blurb: '机制向深读：慢性炎症在资料里常被一起讨论。',
    diseaseId: null,
    mechanismId: 'chronic_inflammation',
    kind: 'mechanism_deep',
  },
  {
    id: 'gut-barrier',
    label: '肠道屏障',
    title: '肠道屏障',
    prompt: '这个机制和饮食常被怎样一起讨论？',
    blurb: '机制向深读：屏障相关叙述与饮食常被讨论。',
    diseaseId: null,
    mechanismId: 'gut_barrier_leak',
    kind: 'mechanism_deep',
  },
  {
    id: 'glycation',
    label: '糖化',
    title: '糖化',
    prompt: '这个机制和饮食常被怎样一起讨论？',
    blurb: '机制向深读：糖化叙述与饮食常被一起讨论。',
    diseaseId: null,
    mechanismId: 'glycation',
    kind: 'mechanism_deep',
  },
];

/** Disease topics first, then mechanism deep-reads. ThemeBar uses this full list on explore. */
export const EXPLORE_THEMES: readonly ExploreTheme[] = [
  ...HOME_HEALTH_THEMES,
  ...HOME_MECHANISM_THEMES,
];

export const HIERARCHY_HINT = '列顺序：膳食/食物 → 营养素/化合物/代谢物 → 机制 → 疾病/结局';

const THEME_ID = /^[a-z0-9_-]+$/;

export function themeById(id: string | null | undefined): ExploreTheme | null {
  if (!id || !THEME_ID.test(id)) return null;
  return EXPLORE_THEMES.find((theme) => theme.id === id) ?? null;
}

export function themeMatches(
  theme: ExploreTheme,
  diseaseId: string | null,
  mechanismId: string | null,
): boolean {
  return theme.diseaseId === diseaseId && theme.mechanismId === mechanismId;
}

export function themeForFilters(
  diseaseId: string | null,
  mechanismId: string | null,
): ExploreTheme | null {
  return EXPLORE_THEMES.find((theme) => themeMatches(theme, diseaseId, mechanismId)) ?? null;
}

/** Explicit disease/mechanism params win. A known theme fills filters only when both are absent. */
export function filtersFromShare(input: {
  disease: string | null;
  mechanism: string | null;
  theme: string | null;
}): { disease: string | null; mechanism: string | null } {
  if (input.disease || input.mechanism) {
    return { disease: input.disease, mechanism: input.mechanism };
  }
  const theme = themeById(input.theme);
  if (!theme) return { disease: null, mechanism: null };
  return { disease: theme.diseaseId, mechanism: theme.mechanismId };
}
