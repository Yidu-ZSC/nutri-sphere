export type PatternFacetKind = 'plate' | 'belief' | 'try';

export interface PatternLobbyFacet {
  kind: PatternFacetKind;
  label: string;
  body: string;
}

export interface DietPatternCard {
  id: string;
  /** Short step label on the ClearDiet journey (起步 / 进阶 / 深入). */
  journey_stage: string;
  title: string;
  /** One-line differentiator on the lobby card. */
  hook: string;
  /** What makes this step distinct on the lobby card (not evidence text). */
  lobby_facets: readonly PatternLobbyFacet[];
  /** Primary graph theme for a single lobby link. */
  primary_theme: string;
  /** Detail / compare pages. */
  summary: string;
  practice_hint: string;
  emphasize: string;
  limit: string;
  evidence_note: string;
  related_themes: readonly string[];
}

const PLATE = '盘上变化';
const BELIEF = '先问哪条观念';
const TRY = '试做一件事';

/** Static lobby cards. Not seed nodes and not a new screen. */
export const DIET_PATTERN_CARDS: readonly DietPatternCard[] = [
  {
    id: 'plant_forward',
    journey_stage: '起步',
    title: '弹性素食 · 以植物为主',
    hook: '还不必戒肉，先让植物在盘子里占主位。',
    lobby_facets: [
      {
        kind: 'plate',
        label: PLATE,
        body: '至少一餐以豆、全谷和大量蔬菜为主；肉从「主菜」变成配角，或可有可无。',
      },
      {
        kind: 'belief',
        label: BELIEF,
        body: '「不吃肉就不饱」——先数这餐植物有没有占到一半以上，而不是先想缺了什么肉。',
      },
      {
        kind: 'try',
        label: TRY,
        body: '记一周：哪几餐植物比例最高，当时的饱腹感与精力如何，再决定要不要往下走。',
      },
    ],
    primary_theme: 'chronic-inflammation',
    summary:
      '公开资料与书摘里常把「先让盘子里更多全食物植物」描述为可试做的第一步，而不必立刻贴标签。',
    practice_hint:
      '适合先记录一两周：哪几餐植物比例更高、身体与精力感受如何，再决定是否往下一步走。',
    emphasize: '蔬菜、豆类、全谷物、水果、坚果种子',
    limit: '超加工食品；仍以动物性食物为主的一餐（尚未刻意排除）',
    evidence_note: '书摘机制与观察性叙述为主，常与肠道、炎症、代谢等主题一起讨论。',
    related_themes: ['chronic-inflammation', 'cardiometabolic'],
  },
  {
    id: 'lacto_ovo',
    journey_stage: '进阶',
    title: '蛋奶素食',
    hook: '肉鱼退出日常，蛋奶仍可作选项。',
    lobby_facets: [
      {
        kind: 'plate',
        label: PLATE,
        body: '蛋白更多来自豆与全谷的组合；蛋奶若保留，通常不再单独撑起整餐。',
      },
      {
        kind: 'belief',
        label: BELIEF,
        body: '「没有肉就没有蛋白质」——对照图谱里豆类、全谷节点，看组合能否撑起日常。',
      },
      {
        kind: 'try',
        label: TRY,
        body: '试一周无肉：外出点餐、家人同桌时是否仍能坚持，再观察要不要减少蛋奶。',
      },
    ],
    primary_theme: 'plant-based',
    summary: '公开资料中常描述为不吃肉与鱼，仍可能选用蛋、奶等动物来源食物，并搭配多样植物性来源。',
    practice_hint:
      '若你正在减少肉类，可对照图谱里豆、全谷与蔬果节点，观察自己是否更容易坚持、是否愿意再减少蛋奶。',
    emphasize: '蔬菜、豆类、全谷物、水果、坚果种子；若保留蛋奶，常与多样植物搭配一起讨论',
    limit: '肉类、鱼类、超加工食品',
    evidence_note: '公开资料与书摘中的模式描述为主，兼有部分观察与综述。',
    related_themes: ['plant-based', 'chronic-inflammation', 'cardiometabolic'],
  },
  {
    id: 'vegan_whole',
    journey_stage: '深入',
    title: '全食物全素食',
    hook: '盘里尽量只有未过度加工的植物性食物。',
    lobby_facets: [
      {
        kind: 'plate',
        label: PLATE,
        body: '不选用动物来源食物；用整粒豆谷、新鲜蔬果、坚果种子填盘，少超加工替代。',
      },
      {
        kind: 'belief',
        label: BELIEF,
        body: '「全素很难营养够」——用饮食孪生与书摘节点对照多样性，而不是一次到位。',
      },
      {
        kind: 'try',
        label: TRY,
        body: '选一天作「全植物试跑」，再打开图谱「全食物植物性膳食 / 素食」节点对照讨论。',
      },
    ],
    primary_theme: 'plant-based',
    summary:
      '书摘与公开资料里常把不选用动物来源食物、以未过度加工的植物性全食物为主的方式，与全食物植物性膳食节点一起讨论。',
    practice_hint:
      '适合在已有植物性实践基础上，对照饮食孪生与图谱反馈，看自己是否愿意把日常尽量收拢到全食物植物。',
    emphasize: '蔬菜、豆类、全谷物、水果、坚果种子、香草香料',
    limit: '动物性食物（含蛋、奶、鱼、肉）、超加工食品',
    evidence_note: '书摘机制描述为主，辅以部分观察与综述；与图谱中「全食物植物性膳食 / 素食」节点对应。',
    related_themes: ['plant-based', 'chronic-inflammation', 'cardiometabolic'],
  },
];
