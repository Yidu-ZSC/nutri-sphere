import type { ViewLayer } from '../types/graph';

/** Exact Simplified Chinese disclaimer from the Phase 1 spec. Do not paraphrase. */
export const DISCLAIMER_TEXT =
  '免责声明：NutriSphere 是教育与研究用途的知识图谱可视化工具，不是医疗器械，不提供诊断、治疗方案或个性化医疗建议。图中关联多来自书摘与公开资料中的机制/观察描述，存在局限，不能替代执业医师或注册营养专业人员的意见。健康决策请咨询具备资质的专业人员。';

export const DISCLAIMER_SHORT = '教育/研究工具 · 非诊疗 · 非医疗建议 · 请咨询专业人员';

export const DISCLAIMER_EN = 'Educational / research use only. Not medical advice.';

const STRONG_TOKENS = ['免责声明', '不是', '不提供'] as const;

export function disclaimerSegments(text: string): { strong: boolean; value: string }[] {
  const segments: { strong: boolean; value: string }[] = [];
  let rest = text;
  while (rest.length > 0) {
    let nextIndex = -1;
    let token = '';
    for (const candidate of STRONG_TOKENS) {
      const index = rest.indexOf(candidate);
      if (index !== -1 && (nextIndex === -1 || index < nextIndex)) {
        nextIndex = index;
        token = candidate;
      }
    }
    if (nextIndex === -1 || token === '') {
      segments.push({ strong: false, value: rest });
      break;
    }
    if (nextIndex > 0) {
      segments.push({ strong: false, value: rest.slice(0, nextIndex) });
    }
    segments.push({ strong: true, value: token });
    rest = rest.slice(nextIndex + token.length);
  }
  return segments;
}

const NODE_TYPES: Record<string, string> = {
  diet_pattern: '膳食模式',
  food_category: '食物类别',
  food: '食物',
  nutrient: '营养素',
  compound: '化合物',
  metabolite: '代谢物',
  mechanism: '机制',
  disease: '疾病风险',
  biomarker: '生物标志',
};

const GROUPS: Record<string, string> = {
  protective: '保护相关',
  risk: '风险相关',
  neutral: '中性',
  mixed: '混合',
};

const DIRECTIONS: Record<string, string> = {
  protective: '保护相关（关联方向）',
  risk: '风险相关（关联方向）',
  neutral: '方向不明确',
  mixed: '证据混合 / 情境依赖',
};

const STRENGTHS: Record<string, string> = {
  low: '较弱',
  moderate: '中等',
  high: '较强',
  quantitative: '有定量描述',
};

const EVIDENCE: Record<string, string> = {
  book_notes_mechanistic: '书摘·机制描述',
  book_notes_observational_synthesis: '书摘·观察性综述',
  observational: '观察性研究（后续）',
  mechanistic: '机制/实验（后续）',
  interventional: '干预/试验（后续）',
  ecological: '生态/人群相关（后续）',
  expert_synthesis: '专家综述/指南（后续）',
};

function mapped(table: Record<string, string>, value: string): string {
  return table[value] ?? `${value}（未映射类型）`;
}

export function nodeTypeLabel(value: string): string {
  return mapped(NODE_TYPES, value);
}

export function groupLabel(value: string): string {
  return mapped(GROUPS, value);
}

export function directionLabel(value: string): string {
  return mapped(DIRECTIONS, value);
}

export function strengthLabel(value: string | undefined): string {
  if (!value) return '未注明';
  return mapped(STRENGTHS, value);
}

export function evidenceLabel(value: string): string {
  return mapped(EVIDENCE, value);
}

export function withEnum(vernacular: string, raw: string, layer: ViewLayer): string {
  if (layer === 'expert') return `${vernacular} · ${raw}`;
  return vernacular;
}
