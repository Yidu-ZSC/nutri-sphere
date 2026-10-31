export interface ExploreTheme {
  id: string;
  label: string;
  diseaseId: string | null;
  mechanismId: string | null;
}

export const EXPLORE_THEMES: readonly ExploreTheme[] = [
  {
    id: 'chronic-inflammation',
    label: '慢性炎症',
    diseaseId: null,
    mechanismId: 'chronic_inflammation',
  },
  {
    id: 'gut-barrier',
    label: '肠道屏障',
    diseaseId: null,
    mechanismId: 'gut_barrier_leak',
  },
  {
    id: 'cardiometabolic',
    label: '心血管代谢',
    diseaseId: 'cardiometabolic',
    mechanismId: null,
  },
];

export const HIERARCHY_HINT = '列顺序：膳食/食物 → 营养素/化合物/代谢物 → 机制 → 疾病/结局';

export function themeMatches(
  theme: ExploreTheme,
  diseaseId: string | null,
  mechanismId: string | null,
): boolean {
  return theme.diseaseId === diseaseId && theme.mechanismId === mechanismId;
}
