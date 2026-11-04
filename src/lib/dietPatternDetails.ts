import type { DietPatternCard } from './dietPatterns.ts';
import {
  VEGAN_DIET_SECTION_TAGLINE,
  VEGAN_DIET_SECTION_TITLE,
} from './exploreShell.ts';

export interface DietPatternDetail {
  id: string;
  journey_stage: string;
  title: string;
  summary: string;
  practice_hint: string;
  evidence_badge: string;
  emphasize_items: readonly { label: string; note: string }[];
  limit_items: readonly { label: string; note: string }[];
  sample_day: {
    disclaimer: string;
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  related_themes: readonly string[];
  graph_paths: readonly { label: string; theme_id: string }[];
  evidence_note: string;
  evidence_sources: readonly string[];
  limitations: string;
}

/** Shared by every pattern. Locked wording; do not swap back to a banned term. */
export const PATTERN_SAMPLE_DISCLAIMER = '仅为说明模式特征的示例组合，非个人食谱或饮食医嘱。';

const EMPHASIZE_NOTE = '公开资料与书摘中常被描述为该路径的常见组成。';
const LIMIT_NOTE = '公开资料与书摘中常被描述为该路径会较少出现或刻意避免的类别。';

export const PATTERN_SHELL = {
  backLobby: '返回大厅',
  sectionKicker: VEGAN_DIET_SECTION_TITLE,
  emphasizeTitle: '资料中常提到的多吃要点',
  limitTitle: '资料中常提到的少吃要点',
  practiceTitle: '实践与自我观察',
  sampleTitle: '典型一天示例',
  graphTitle: '与图谱的关联',
  graphPrefix: '在图谱里看相关讨论：',
  evidenceTitle: '证据与局限性',
  compareEntry: '与其他路径对比',
  backGraph: '返回图谱',
  openDetail: '查看详情',
  openCompare: '对比三种素食路径',
  lobbyNote: VEGAN_DIET_SECTION_TAGLINE,
  compareTitle: '三种素食路径对比',
  compareNote: '以下为公开资料与书摘中常见描述的对比，不是排名，也不是个人饮食方案，更不是在比高下。',
  compareLegend:
    '强调 = 该路径常被强调；部分 = 有时提到、非核心；可选 = 多为可选或因人而异；限制 = 常被描述为需限制或避免',
  sidebarOne: '查看路径详情',
  highlightBadge: '与当前主题相关',
  columnPoint: '要点',
} as const;

export const COMPARE_CELLS = ['强调', '部分', '可选', '限制'] as const;
export type CompareCell = (typeof COMPARE_CELLS)[number];

export const COMPARE_COLUMNS = [
  { id: 'plant_forward', title: '以植物为主' },
  { id: 'lacto_ovo', title: '蛋奶素' },
  { id: 'vegan_whole', title: '全食物全素' },
] as const;

export const PATTERN_COMPARE_ROWS: readonly {
  point: string;
  cells: readonly [CompareCell, CompareCell, CompareCell];
}[] = [
  { point: '蔬菜、水果、豆、全谷', cells: ['强调', '强调', '强调'] },
  { point: '坚果与种子', cells: ['强调', '强调', '强调'] },
  { point: '蛋、奶', cells: ['可选', '部分', '限制'] },
  { point: '肉、鱼', cells: ['部分', '限制', '限制'] },
  { point: '超加工食品', cells: ['限制', '限制', '限制'] },
  { point: '以记录与反馈调整', cells: ['强调', '强调', '强调'] },
];

function items(labels: readonly string[], note: string): readonly { label: string; note: string }[] {
  return labels.map((label) => ({ label, note }));
}

function sample(breakfast: string, lunch: string, dinner: string): DietPatternDetail['sample_day'] {
  return {
    disclaimer: PATTERN_SAMPLE_DISCLAIMER,
    breakfast,
    lunch,
    dinner,
  };
}

export const DIET_PATTERN_DETAILS: readonly DietPatternDetail[] = [
  {
    id: 'plant_forward',
    journey_stage: '起步',
    title: '弹性素食 · 以植物为主',
    summary:
      '公开资料与书摘里常把「先让盘子里更多全食物植物」描述为可试做的第一步，而不必立刻贴标签。',
    practice_hint:
      '适合先记录一两周：哪几餐植物比例更高、身体与精力感受如何，再决定是否往下一步走。',
    evidence_badge: '书摘与观察',
    emphasize_items: items(['蔬菜', '豆类', '全谷物', '水果', '坚果种子'], EMPHASIZE_NOTE),
    limit_items: items(['超加工食品', '长期以动物性食物为主的一餐'], LIMIT_NOTE),
    sample_day: sample(
      '书摘中常见的组合方式：全谷物或燕麦，搭配水果与坚果种子。',
      '书摘中常见的组合方式：豆类或全谷配大量蔬菜，少超加工配菜。',
      '书摘中常见的组合方式：以植物性为主的一餐；若仍有动物性食物，可观察比例与频率。',
    ),
    related_themes: ['chronic-inflammation', 'cardiometabolic'],
    graph_paths: [
      { label: '以植物为主 → 慢性炎症主题', theme_id: 'chronic-inflammation' },
      { label: '以植物为主 → 心血代谢主题', theme_id: 'cardiometabolic' },
    ],
    evidence_note: '书摘机制与观察性叙述为主，常与肠道、炎症、代谢等主题一起讨论。',
    evidence_sources: ['书摘机制', '观察与综述'],
    limitations: '个体差异大；不是针对个人的饮食医嘱；本项目不做原创研究；健康决策请咨询专业人员。',
  },
  {
    id: 'lacto_ovo',
    journey_stage: '进阶',
    title: '蛋奶素食',
    summary: '公开资料中常描述为不吃肉与鱼，仍可能选用蛋、奶等动物来源食物，并搭配多样植物性来源。',
    practice_hint:
      '若你正在减少肉类，可对照图谱里豆、全谷与蔬果节点，观察自己是否更容易坚持、是否愿意再减少蛋奶。',
    evidence_badge: '书摘与综述',
    emphasize_items: items(
      ['蔬菜', '豆类', '全谷物', '水果', '坚果种子', '蛋、奶（若保留）'],
      EMPHASIZE_NOTE,
    ),
    limit_items: items(['肉类', '鱼类', '超加工食品'], LIMIT_NOTE),
    sample_day: sample(
      '书摘中常见的组合方式：全谷物配水果；若含蛋奶，常与多样植物一起出现。',
      '书摘中常见的组合方式：豆类与全谷配大量蔬菜。',
      '书摘中常见的组合方式：以植物性为主的一餐，不含肉与鱼，少超加工。',
    ),
    related_themes: ['plant-based', 'chronic-inflammation', 'cardiometabolic'],
    graph_paths: [
      { label: '蛋奶素 → 植物性饮食主题', theme_id: 'plant-based' },
      { label: '蛋奶素 → 慢性炎症主题', theme_id: 'chronic-inflammation' },
    ],
    evidence_note: '公开资料与书摘中的模式描述为主，兼有部分观察与综述。',
    evidence_sources: ['书摘机制', '观察与综述'],
    limitations: '个体差异大；不是针对个人的饮食医嘱；本项目不做原创研究；营养搭配需因人而异；健康决策请咨询专业人员。',
  },
  {
    id: 'vegan_whole',
    journey_stage: '深入',
    title: '全食物全素食',
    summary:
      '书摘与公开资料里常把不选用动物来源食物、以未过度加工的植物性全食物为主的方式，与全食物植物性膳食节点一起讨论。',
    practice_hint:
      '适合在已有植物性实践基础上，对照饮食孪生与图谱反馈，看自己是否愿意把日常尽量收拢到全食物植物。',
    evidence_badge: '书摘与综述',
    emphasize_items: items(['蔬菜', '豆类', '全谷物', '水果', '坚果种子', '香草香料'], EMPHASIZE_NOTE),
    limit_items: items(['动物性食物（含蛋、奶、鱼、肉）', '超加工食品'], LIMIT_NOTE),
    sample_day: sample(
      '书摘中常见的组合方式：全谷物或燕麦配水果与坚果种子。',
      '书摘中常见的组合方式：豆类与全谷物配大量蔬菜。',
      '书摘中常见的组合方式：以全食物植物为主的一餐，少超加工。',
    ),
    related_themes: ['plant-based', 'chronic-inflammation', 'cardiometabolic'],
    graph_paths: [
      { label: '全食物全素 → 植物性饮食主题', theme_id: 'plant-based' },
      { label: '全食物全素 → 图谱节点：全食物植物性膳食', theme_id: 'plant-based' },
    ],
    evidence_note: '书摘机制描述为主，辅以部分观察与综述；与图谱中「全食物植物性膳食 / 素食」节点对应。',
    evidence_sources: ['书摘机制', '观察与综述'],
    limitations: '个体差异大；不是针对个人的饮食医嘱；本项目不做原创研究；个体营养需求差异大；健康决策请咨询专业人员。',
  },
];

export function dietPatternById(id: string | null | undefined): DietPatternDetail | null {
  if (!id) return null;
  return DIET_PATTERN_DETAILS.find((detail) => detail.id === id) ?? null;
}

/** Sidebar label for pattern detail entry. */
export function patternSidebarDetailLabel(title: string): string {
  const short = title.split('·')[0]?.trim() ?? title;
  return `${short}详情`;
}

export function patternCardTitle(cards: readonly DietPatternCard[], id: string): string | null {
  return cards.find((card) => card.id === id)?.title ?? null;
}
