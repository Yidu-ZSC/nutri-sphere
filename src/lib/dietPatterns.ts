export interface DietPatternCard {
  id: string;
  /** Short step label on the ClearDiet journey (起步 / 进阶 / 深入). */
  journey_stage: string;
  title: string;
  summary: string;
  /** How to use practice and feedback; not a prescription. */
  practice_hint: string;
  emphasize: string;
  limit: string;
  evidence_note: string;
  limitations: string;
  related_themes: readonly string[];
}

/** Static lobby cards. Not seed nodes and not a new screen. */
export const DIET_PATTERN_CARDS: readonly DietPatternCard[] = [
  {
    id: 'plant_forward',
    journey_stage: '起步',
    title: '弹性素食 · 以植物为主',
    summary:
      '公开资料与书摘里常把「先让盘子里更多全食物植物」描述为可试做的第一步，而不必立刻贴标签。',
    practice_hint:
      '适合先记录一两周：哪几餐植物比例更高、身体与精力感受如何，再决定是否往下一步走。',
    emphasize: '蔬菜、豆类、全谷物、水果、坚果种子',
    limit: '超加工食品；仍以动物性食物为主的一餐（尚未刻意排除）',
    evidence_note: '书摘机制与观察性叙述为主，常与肠道、炎症、代谢等主题一起讨论。',
    limitations: '个体差异大；不是针对个人的饮食医嘱；本项目不做原创研究。',
    related_themes: ['chronic-inflammation', 'cardiometabolic'],
  },
  {
    id: 'lacto_ovo',
    journey_stage: '进阶',
    title: '蛋奶素食',
    summary: '公开资料中常描述为不吃肉与鱼，仍可能选用蛋、奶等动物来源食物，并搭配多样植物性来源。',
    practice_hint:
      '若你正在减少肉类，可对照图谱里豆、全谷与蔬果节点，观察自己是否更容易坚持、是否愿意再减少蛋奶。',
    emphasize: '蔬菜、豆类、全谷物、水果、坚果种子；若保留蛋奶，常与多样植物搭配一起讨论',
    limit: '肉类、鱼类、超加工食品',
    evidence_note: '公开资料与书摘中的模式描述为主，兼有部分观察与综述。',
    limitations: '个体差异大；不是针对个人的饮食医嘱；本项目不做原创研究；营养搭配需因人而异。',
    related_themes: ['plant-based', 'chronic-inflammation', 'cardiometabolic'],
  },
  {
    id: 'vegan_whole',
    journey_stage: '深入',
    title: '全食物全素食',
    summary:
      '书摘与公开资料里常把不选用动物来源食物、以未过度加工的植物性全食物为主的方式，与全食物植物性膳食节点一起讨论。',
    practice_hint:
      '适合在已有植物性实践基础上，对照饮食孪生与图谱反馈，看自己是否愿意把日常尽量收拢到全食物植物。',
    emphasize: '蔬菜、豆类、全谷物、水果、坚果种子、香草香料',
    limit: '动物性食物（含蛋、奶、鱼、肉）、超加工食品',
    evidence_note: '书摘机制描述为主，辅以部分观察与综述；与图谱中「全食物植物性膳食 / 素食」节点对应。',
    limitations: '个体差异大；不是针对个人的饮食医嘱；本项目不做原创研究；个体营养需求差异大。',
    related_themes: ['plant-based', 'chronic-inflammation', 'cardiometabolic'],
  },
];
