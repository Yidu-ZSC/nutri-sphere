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
  observational: '观察性研究',
  mechanistic: '机制/实验',
  interventional: '干预/试验',
  ecological: '生态/人群相关',
  expert_synthesis: '专家综述/指南',
};

export type EvidenceTrack = 'book_notes' | 'literature';

/** Book-note edges stay on the book-notes track. Every other evidence type is literature. */
export function evidenceTrack(type: string): EvidenceTrack {
  return type.startsWith('book_notes_') ? 'book_notes' : 'literature';
}

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

/** Short chip text. Book notes stay visibly "书摘", never a clinical grade. */
const EVIDENCE_BADGE: Record<string, string> = {
  book_notes_mechanistic: '书摘·机制',
  book_notes_observational_synthesis: '书摘·观察综述',
  observational: '观察研究',
  mechanistic: '机制/实验',
  interventional: '干预/试验',
  ecological: '生态/人群',
  expert_synthesis: '专家综述',
};

const EVIDENCE_DETAIL: Record<string, string> = {
  book_notes_mechanistic: '书摘中的机制描述',
  book_notes_observational_synthesis: '书摘中对观察资料的归纳',
  observational: '观察性研究',
  mechanistic: '实验或实验室机制资料',
  interventional: '干预研究或对照试验',
  ecological: '地区或人群层面的相关',
  expert_synthesis: '综述或共识性归纳',
};

export const EVIDENCE_LADDER: readonly { id: string; badge: string }[] = [
  { id: 'book_notes_mechanistic', badge: '书摘·机制' },
  { id: 'book_notes_observational_synthesis', badge: '书摘·观察综述' },
  { id: 'observational', badge: '观察研究' },
  { id: 'mechanistic', badge: '机制/实验' },
  { id: 'interventional', badge: '干预/试验' },
  { id: 'ecological', badge: '生态/人群' },
  { id: 'expert_synthesis', badge: '专家综述' },
];

export function evidenceBadge(value: string): string {
  return EVIDENCE_BADGE[value] ?? evidenceLabel(value);
}

export function evidenceDetail(value: string): string {
  return EVIDENCE_DETAIL[value] ?? '未映射类型';
}

export function evidenceCounts(links: readonly { evidence_type: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const link of links) {
    counts[link.evidence_type] = (counts[link.evidence_type] ?? 0) + 1;
  }
  return counts;
}

export function evidenceStatus(id: string, counts: Record<string, number>): string {
  const count = counts[id] ?? 0;
  return count > 0 ? `已收录 ${count}` : '尚未收录该级';
}

export function evidenceAssurance(type: string, strength: string | undefined): string {
  const badge = evidenceBadge(type);
  const strengthText = strengthLabel(strength);
  if (type.startsWith('book_notes_')) return `${strengthText} · ${badge}（非临床试验）`;
  return `${strengthText} · ${badge}`;
}

export function withEnum(vernacular: string, raw: string, layer: ViewLayer): string {
  if (layer === 'expert') return `${vernacular} · ${raw}`;
  return vernacular;
}
