export type ThemeKind = 'health_topic' | 'mechanism_deep' | 'food_pattern';

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
  /** Food, diet-pattern, or nutrient node. Null on disease and mechanism themes. */
  foodId: string | null;
  kind: ThemeKind;
}

/** Primary lobby grid: one card per disease node. */
export const HOME_HEALTH_THEMES: readonly ExploreTheme[] = [
  {
    id: 'cardiometabolic',
    label: '心血管 / 代谢',
    title: '想了解心血管与代谢相关饮食讨论',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '公开资料里常把饮食与这些主题放在一起说。',
    diseaseId: 'cardiometabolic',
    mechanismId: null,
    foodId: null,
    kind: 'health_topic',
  },
  {
    id: 'fatty_liver',
    label: '脂肪肝相关',
    title: '想了解脂肪肝相关饮食讨论',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '与代谢、炎症叙述常一起出现。',
    diseaseId: 'fatty_liver',
    mechanismId: null,
    foodId: null,
    kind: 'health_topic',
  },
  {
    id: 'obesity_risk',
    label: '肥胖相关风险',
    title: '想看看体重相关饮食讨论',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '体重主题与饮食叙述常一起出现。',
    diseaseId: 'obesity_risk',
    mechanismId: null,
    foodId: null,
    kind: 'health_topic',
  },
  {
    id: 'ibd_related',
    label: '炎症性肠病相关',
    title: '想了解炎症性肠病相关饮食讨论',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '屏障与炎症叙述里常被一起讨论。',
    diseaseId: 'ibd_related',
    mechanismId: null,
    foodId: null,
    kind: 'health_topic',
  },
  {
    id: 'liver_chronic',
    label: '慢性肝炎相关进展',
    title: '想了解肝脏相关饮食讨论',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '书摘与资料里与饮食、肝脏叙述常一起出现。',
    diseaseId: 'liver_chronic',
    mechanismId: null,
    foodId: null,
    kind: 'health_topic',
  },
  {
    id: 'digestive_cancer_risk',
    label: '消化系统癌症风险',
    title: '想了解消化系统风险与饮食讨论',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '消化系统主题与饮食常被一起讨论。',
    diseaseId: 'digestive_cancer_risk',
    mechanismId: null,
    foodId: null,
    kind: 'health_topic',
  },
  {
    id: 'autoimmune',
    label: '自身免疫相关',
    title: '想了解自身免疫相关饮食讨论',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '自身免疫主题与饮食叙述常被讨论。',
    diseaseId: 'autoimmune',
    mechanismId: null,
    foodId: null,
    kind: 'health_topic',
  },
  {
    id: 'mental_health',
    label: '心理健康 / 抑郁等',
    title: '想了解情绪与饮食的讨论',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '情绪相关主题与饮食常被一起讨论。',
    diseaseId: 'mental_health',
    mechanismId: null,
    foodId: null,
    kind: 'health_topic',
  },
  {
    id: 'breast_prostate_risk',
    label: '乳腺与前列腺风险',
    title: '想了解这些风险与饮食的讨论',
    prompt: '这个主题和饮食常被怎样一起讨论？',
    blurb: '这些风险主题与饮食叙述常被讨论。',
    diseaseId: 'breast_prostate_risk',
    mechanismId: null,
    foodId: null,
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
    blurb: '慢性炎症在资料里常被一起讨论。',
    diseaseId: null,
    mechanismId: 'chronic_inflammation',
    foodId: null,
    kind: 'mechanism_deep',
  },
  {
    id: 'gut-barrier',
    label: '肠道屏障',
    title: '肠道屏障',
    prompt: '这个机制和饮食常被怎样一起讨论？',
    blurb: '屏障相关叙述与饮食常被讨论。',
    diseaseId: null,
    mechanismId: 'gut_barrier_leak',
    foodId: null,
    kind: 'mechanism_deep',
  },
  {
    id: 'glycation',
    label: '糖化',
    title: '糖化',
    prompt: '这个机制和饮食常被怎样一起讨论？',
    blurb: '糖化叙述与饮食常被一起讨论。',
    diseaseId: null,
    mechanismId: 'glycation',
    foodId: null,
    kind: 'mechanism_deep',
  },
];

/** Food and diet-pattern entry cards. Separate from disease topics. */
export const HOME_FOOD_THEMES: readonly ExploreTheme[] = [
  {
    id: 'ultra-processed',
    label: '超加工食品',
    title: '想看看超加工食品常被怎么描述',
    prompt: '这类食物和健康常被怎样一起讨论？',
    blurb: '公开资料里常把它和某些健康主题放在一起说。',
    diseaseId: null,
    mechanismId: null,
    foodId: 'ultra_processed',
    kind: 'food_pattern',
  },
  {
    id: 'plant-based',
    label: '植物性饮食',
    title: '想知道植物性饮食与炎症常怎么一起出现',
    prompt: '这类食物和健康常被怎样一起讨论？',
    blurb: '书摘与资料里常提到这条路径。',
    diseaseId: null,
    mechanismId: null,
    foodId: 'plant_based_diet',
    kind: 'food_pattern',
  },
  {
    id: 'dietary-fiber',
    label: '膳食纤维',
    title: '想了解膳食纤维常被怎么说',
    prompt: '这类食物和健康常被怎样一起讨论？',
    blurb: '与菌群、炎症叙述常一起出现。',
    diseaseId: null,
    mechanismId: null,
    foodId: 'dietary_fiber',
    kind: 'food_pattern',
  },
];

/** Disease topics, mechanism deep-reads, then food anchors. ThemeBar uses this full list. */
export const EXPLORE_THEMES: readonly ExploreTheme[] = [
  ...HOME_HEALTH_THEMES,
  ...HOME_MECHANISM_THEMES,
  ...HOME_FOOD_THEMES,
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
  foodId: string | null = null,
): boolean {
  return theme.diseaseId === diseaseId && theme.mechanismId === mechanismId && theme.foodId === foodId;
}

export function themeForFilters(
  diseaseId: string | null,
  mechanismId: string | null,
  foodId: string | null = null,
): ExploreTheme | null {
  return EXPLORE_THEMES.find((theme) => themeMatches(theme, diseaseId, mechanismId, foodId)) ?? null;
}

/**
 * Explicit disease, mechanism, or food params win together.
 * A known theme fills filters only when all three are absent.
 */
export function filtersFromShare(input: {
  disease: string | null;
  mechanism: string | null;
  food?: string | null;
  theme: string | null;
}): { disease: string | null; mechanism: string | null; food: string | null } {
  const food = input.food ?? null;
  if (input.disease || input.mechanism || food) {
    return { disease: input.disease, mechanism: input.mechanism, food };
  }
  const theme = themeById(input.theme);
  if (!theme) return { disease: null, mechanism: null, food: null };
  return { disease: theme.diseaseId, mechanism: theme.mechanismId, food: theme.foodId };
}
