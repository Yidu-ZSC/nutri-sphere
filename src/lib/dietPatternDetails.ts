import type { DietPatternCard } from './dietPatterns.ts';

export interface DietPatternDetail {
  id: string;
  title: string;
  summary: string;
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

const EMPHASIZE_NOTE = '公开资料中常被描述为该模式的常见组成。';
const LIMIT_NOTE = '公开资料中常被描述为该模式会较少出现的类别。';

export const PATTERN_SHELL = {
  backLobby: '返回大厅',
  emphasizeTitle: '资料中常提到的多吃要点',
  limitTitle: '资料中常提到的少吃要点',
  sampleTitle: '典型一天示例',
  graphTitle: '与图谱的关联',
  graphPrefix: '在图谱里看相关讨论：',
  evidenceTitle: '证据与局限性',
  compareEntry: '与其他模式对比',
  backGraph: '返回图谱',
  openDetail: '查看详情',
  openCompare: '对比三种模式',
  lobbyNote: '公开资料中常被描述的健康饮食方式。供学习参考，不是个人饮食医嘱。',
  compareTitle: '三种饮食模式对比',
  compareNote: '以下为公开资料中常见描述的对比，非排名或个人建议。',
  compareLegend:
    '强调 = 公开资料中该模式常被强调；部分 = 有时提到、非核心强调；可选 = 多为可选或因人而异的描述；限制 = 常被描述为需限制',
  sidebarOne: '查看模式详情',
  highlightBadge: '与当前主题相关',
  columnPoint: '要点',
} as const;

export const COMPARE_CELLS = ['强调', '部分', '可选', '限制'] as const;
export type CompareCell = (typeof COMPARE_CELLS)[number];

export const COMPARE_COLUMNS = [
  { id: 'mediterranean', title: '地中海' },
  { id: 'dash', title: 'DASH' },
  { id: 'plant_forward', title: '植物性为主' },
] as const;

export const PATTERN_COMPARE_ROWS: readonly {
  point: string;
  cells: readonly [CompareCell, CompareCell, CompareCell];
}[] = [
  { point: '多吃蔬菜水果', cells: ['强调', '强调', '强调'] },
  { point: '多吃豆类全谷物', cells: ['强调', '强调', '强调'] },
  { point: '橄榄油 / 植物油', cells: ['强调', '部分', '部分'] },
  { point: '鱼类', cells: ['强调', '部分', '可选'] },
  { point: '低脂乳制品', cells: ['部分', '强调', '可选'] },
  { point: '限制红肉与加工肉', cells: ['限制', '限制', '限制'] },
  { point: '限制超加工', cells: ['限制', '限制', '限制'] },
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
    id: 'mediterranean',
    title: '地中海模式',
    summary: '公开资料中常被描述为以蔬菜、水果、豆类、全谷物、橄榄油为主的模式。',
    evidence_badge: '观察与综述',
    emphasize_items: items(['蔬菜', '水果', '豆类', '坚果', '全谷物', '橄榄油', '鱼类'], EMPHASIZE_NOTE),
    limit_items: items(['红肉', '加工肉类', '添加糖饮品', '超加工食品'], LIMIT_NOTE),
    sample_day: sample(
      '公开资料中常见的组合方式：全谷物或燕麦，搭配水果与坚果。',
      '公开资料中常见的组合方式：豆类或谷物配大量蔬菜，橄榄油调味，可含鱼。',
      '公开资料中常见的组合方式：蔬菜为主的一餐，可含豆类或少量鱼，少加工肉。',
    ),
    related_themes: ['cardiometabolic'],
    graph_paths: [{ label: '地中海模式 → 心血代谢主题', theme_id: 'cardiometabolic' }],
    evidence_note: '多个心血管相关指南与综述将其与心血代谢结局联系起来（观察与部分干预证据）。',
    evidence_sources: ['指南综述', '观察研究'],
    limitations: '个体差异大；不是针对个人的饮食医嘱；本项目不做原创研究；健康决策请咨询专业人员。',
  },
  {
    id: 'dash',
    title: 'DASH 模式',
    summary: '公开资料中常被描述为强调蔬菜、水果、低脂乳制品与全谷物，并限制钠与饱和脂肪的模式。',
    evidence_badge: '指南与观察',
    emphasize_items: items(['蔬菜', '水果', '低脂乳制品', '全谷物', '豆类', '坚果'], EMPHASIZE_NOTE),
    limit_items: items(['高钠食物', '红肉', '添加糖', '饱和脂肪较高的食物'], LIMIT_NOTE),
    sample_day: sample(
      '公开资料中常见的组合方式：全谷物配水果，可含低脂乳制品。',
      '公开资料中常见的组合方式：蔬菜与全谷物为主，可含豆类或低脂乳制品。',
      '公开资料中常见的组合方式：蔬菜配瘦蛋白来源描述中的选项，少高钠加工食品。',
    ),
    related_themes: ['cardiometabolic'],
    graph_paths: [{ label: 'DASH 模式 → 心血代谢主题', theme_id: 'cardiometabolic' }],
    evidence_note: '多个指南将其与血压与心血管结局联系起来。',
    evidence_sources: ['指南综述', '观察研究'],
    limitations: '个体差异大；不是针对个人的饮食医嘱；本项目不做原创研究；健康决策请咨询专业人员。',
  },
  {
    id: 'plant_forward',
    title: '植物性为主模式',
    summary: '公开资料与书摘中常描述为以全食物植物为主、限制动物性食物与超加工的方式。',
    evidence_badge: '书摘与综述',
    emphasize_items: items(['蔬菜', '豆类', '全谷物', '水果', '坚果种子'], EMPHASIZE_NOTE),
    limit_items: items(['动物性食物', '超加工食品'], LIMIT_NOTE),
    sample_day: sample(
      '公开资料中常见的组合方式：全谷物或燕麦配水果与坚果种子。',
      '公开资料中常见的组合方式：豆类与全谷物配大量蔬菜。',
      '公开资料中常见的组合方式：以植物性食物为主的一餐，少超加工食品。',
    ),
    related_themes: ['chronic-inflammation', 'cardiometabolic'],
    graph_paths: [
      { label: '植物性为主 → 慢性炎症主题', theme_id: 'chronic-inflammation' },
      { label: '植物性为主 → 心血代谢主题', theme_id: 'cardiometabolic' },
    ],
    evidence_note: '书摘机制描述为主，辅以部分观察与综述。',
    evidence_sources: ['书摘机制', '观察与综述'],
    limitations: '个体差异大；不是针对个人的饮食医嘱；本项目不做原创研究；个体营养需求差异大；健康决策请咨询专业人员。',
  },
];

export function dietPatternById(id: string | null | undefined): DietPatternDetail | null {
  if (!id) return null;
  return DIET_PATTERN_DETAILS.find((detail) => detail.id === id) ?? null;
}

/** Multi-pattern sidebar label. Drops a trailing 模式 and keeps a preceding space, as in DASH 详情. */
export function patternSidebarDetailLabel(title: string): string {
  return `${title.replace(/模式$/, '')}详情`;
}

export function patternCardTitle(cards: readonly DietPatternCard[], id: string): string | null {
  return cards.find((card) => card.id === id)?.title ?? null;
}
