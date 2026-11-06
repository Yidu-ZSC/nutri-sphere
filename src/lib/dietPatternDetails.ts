import { DIET_PATTERN_CARDS, type DietPatternCard } from './dietPatterns.ts';
import {
  VEGAN_DIET_SECTION_GRAPH_CTA,
  VEGAN_DIET_SECTION_TITLE,
} from './exploreShell.ts';

/** Single shareable id for the unified vegetarian diet detail screen. */
export const VEGAN_DIET_HUB_ID = 'vegan_diet';

export const VEGAN_DIET_HUB_EVIDENCE = {
  evidence_note:
    '本页内容来自书摘与公开资料中的模式描述、观察与综述，不是原创研究，也不能外推为个人饮食方案。',
  evidence_sources: ['书摘机制', '观察与综述'] as const,
} as const;

export const PATTERN_SHELL = {
  sectionKicker: VEGAN_DIET_SECTION_TITLE,
  journeyHeading: '试做顺序（可快可慢）',
  graphTitle: '与图谱的关联',
  evidenceTitle: '证据说明',
  backGraph: '返回图谱',
  hubTitle: '素食饮食方式说明',
  hubNote:
    '下面三步是 ClearDiet 常用的试做顺序，不是三种互斥的「定义」。你可以只停留在某一步，也可以对照表格与图谱继续探索。',
  compareLegend:
    '强调 = 该路径常被强调；部分 = 有时提到、非核心；可选 = 多为可选或因人而异；限制 = 常被描述为需限制或避免',
  sidebarOne: '查看素食饮食方式详情',
  highlightBadge: '与当前主题相关',
  columnPoint: '要点',
  graphCta: VEGAN_DIET_SECTION_GRAPH_CTA,
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

const LOBBY_CARD_IDS = new Set(DIET_PATTERN_CARDS.map((card) => card.id));

/** Map legacy per-step ids and the hub id to the one detail screen. */
export function normalizeVeganDietPatternId(id: string | null | undefined): string | null {
  if (!id || !/^[a-z0-9_]+$/.test(id)) return null;
  if (id === VEGAN_DIET_HUB_ID) return VEGAN_DIET_HUB_ID;
  if (LOBBY_CARD_IDS.has(id)) return VEGAN_DIET_HUB_ID;
  return null;
}

export function isVeganDietHubPattern(id: string | null | undefined): boolean {
  return normalizeVeganDietPatternId(id) === VEGAN_DIET_HUB_ID;
}

/** @deprecated Use isVeganDietHubPattern — kept for call sites during rename. */
export function dietPatternById(id: string | null | undefined): { id: string } | null {
  return isVeganDietHubPattern(id) ? { id: VEGAN_DIET_HUB_ID } : null;
}

export function patternCardTitle(cards: readonly DietPatternCard[], id: string): string | null {
  return cards.find((card) => card.id === id)?.title ?? null;
}
