import { FLOW_BAND_BUDGET } from './flowLayout.ts';

/** Lobby header copy (product source of truth). Keep educational tone; no clinical claims. */
export const LOBBY_KICKER = '饮食自我探索之路';

export const LOBBY_TITLE = '饮食科普';

export const LOBBY_TAGLINE = '了解饮食与健康主题在图书与公开资料里都做了哪些描述';

/** Secondary line under the lobby tagline. */
export const LOBBY_INTRO =
  '输入想了解的食物、机制或健康主题，或从下面几项看资料里的讨论。';

export const LOBBY_SEARCH_PLACEHOLDER = '输入想了解的概念';

export const LOBBY_SEARCH_EMPTY = '资料里还没有这个概念';

export const LOBBY_RECOMMENDED_HEADING = '先看这些';

export const LOBBY_CONTRAST_NOTE = '对照着看资料里另一类食物如何被讨论';

export const LOBBY_OUTCOMES_SUMMARY = '按结局浏览';

export const HIERARCHY_BUDGET_NOTE = `这一视图画出 ${FLOW_BAND_BUDGET} 条关联，其余仍留在资料和搜索里。`;

/** Method-help lead: how to read the graph. The legal disclaimer stays in the footer. */
export const LOBBY_EDU_FOOTER = '下面说明图谱怎么读、证据怎么标。';

/** Home section: ClearDiet vegetarian lifestyle hub (replaces generic “healthy patterns”). */
export const VEGAN_DIET_SECTION_TITLE = '素食饮食方式';

/** One continuous intro under the section heading (keep-all typography in CSS). */
export const VEGAN_DIET_SECTION_INTRO =
  '从认识自己的餐盘开始，在试做与反馈里慢慢理解全食物植物性选择。ClearDiet 希望帮你把「我吃什么」当回事：先看见过去习以为常的观念，再用小步实践对照书摘与公开资料里的讨论，决定是否更主动走向素食，乃至全素生活方式。';

/** Lobby section actions (whole hub, not per-card). */
export const VEGAN_DIET_SECTION_DETAIL_CTA = '查看详情';

export const VEGAN_DIET_SECTION_GRAPH_CTA = '在图谱里了解素食';

/** Default explore theme for the section graph entry. */
export const VEGAN_DIET_GRAPH_THEME_ID = 'plant-based';

/** @deprecated Use VEGAN_DIET_SECTION_INTRO — kept for tests that slice the first sentence. */
export const VEGAN_DIET_SECTION_TAGLINE =
  '从认识自己的盘子开始，在试做与反馈里慢慢理解全食物植物性选择。';

/** @deprecated Merged into VEGAN_DIET_SECTION_INTRO. */
export const VEGAN_DIET_SECTION_MISSION =
  'ClearDiet 希望帮你把「我吃什么」当回事：先看见过去习以为常的观念，再用小步实践对照书摘与公开资料里的讨论，决定是否更主动走向素食，乃至全素生活方式。';

/** Theme-card and related-theme action. */
export const THEME_CTA = '查看关联';

/** Compact explore top bar. */
export const BACK_TO_LOBBY = '回大厅';

/** Mobile control that opens the collapsed left column. */
export const RAIL_TOGGLE_LABEL = '主题/筛选';

/** Shown when explore has no theme and no manual filter. ≤20 字. */
export const EXPLORE_EMPTY_COPY = '先选择一个主题';

export const EXPLORE_EMPTY_ACTION = '选择主题';

/** Click-focus chrome: shown while a node one-hop focus is active. */
export const CLICK_FOCUS_PREFIX = '已聚焦：';

export const CLEAR_CLICK_FOCUS = '清除聚焦';

/** Close label for the non-blocking 「先选择一个主题」 hint (TASK-NS-045). */
export const THEME_HINT_CLOSE = '关闭';

/** The no-theme hint stays out of the way once the reader is focused, selecting, or dismissed it. */
export function themeHintVisible(state: {
  noTheme: boolean;
  filterEmpty: boolean;
  clickFocusId: string | null;
  hasSelection: boolean;
  dismissed: boolean;
}): boolean {
  if (!state.noTheme || state.filterEmpty) return false;
  if (state.clickFocusId || state.hasSelection) return false;
  return !state.dismissed;
}
