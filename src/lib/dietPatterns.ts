export interface DietPatternCard {
  id: string;
  title: string;
  summary: string;
  emphasize: string;
  limit: string;
  evidence_note: string;
  limitations: string;
  related_themes: readonly string[];
}

/** Static lobby cards. Not seed nodes and not a new screen. */
export const DIET_PATTERN_CARDS: readonly DietPatternCard[] = [
  {
    id: 'mediterranean',
    title: '地中海模式',
    summary: '公开资料中常被描述为以蔬菜、水果、豆类、全谷物、橄榄油为主的模式。',
    emphasize: '蔬菜、水果、豆类、坚果、全谷物、橄榄油、鱼类',
    limit: '红肉、加工肉类、添加糖饮品、超加工食品',
    evidence_note: '多个心血管相关指南与综述将其与心血代谢结局联系起来（观察与部分干预证据）。',
    limitations: '个体差异大；不是针对个人的饮食医嘱；本项目不做原创研究。',
    related_themes: ['cardiometabolic'],
  },
  {
    id: 'dash',
    title: 'DASH 模式',
    summary: '公开资料中常被描述为强调蔬菜、水果、低脂乳制品与全谷物，并限制钠与饱和脂肪的模式。',
    emphasize: '蔬菜、水果、低脂乳制品、全谷物、豆类、坚果',
    limit: '高钠食物、红肉、添加糖、饱和脂肪较高的食物',
    evidence_note: '多个指南将其与血压与心血管结局联系起来。',
    limitations: '个体差异大；不是针对个人的饮食医嘱；本项目不做原创研究。',
    related_themes: ['cardiometabolic'],
  },
  {
    id: 'plant_forward',
    title: '植物性为主模式',
    summary: '公开资料与书摘中常描述为以全食物植物为主、限制动物性食物与超加工的方式。',
    emphasize: '蔬菜、豆类、全谷物、水果、坚果种子',
    limit: '动物性食物、超加工食品',
    evidence_note: '书摘机制描述为主，辅以部分观察与综述。',
    limitations: '个体差异大；不是针对个人的饮食医嘱；本项目不做原创研究；个体营养需求差异大。',
    related_themes: ['chronic-inflammation', 'cardiometabolic'],
  },
];
