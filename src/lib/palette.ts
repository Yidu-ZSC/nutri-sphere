export const PALETTE = {
  protective: '#4ade80',
  risk: '#f87171',
  neutral: '#94a3b8',
  mixed: '#fbbf24',
} as const;

export function semanticColor(value: string | undefined): string {
  if (value === 'protective' || value === 'risk' || value === 'neutral' || value === 'mixed') {
    return PALETTE[value];
  }
  return '#888888';
}

/** three-forcegraph multiplies material opacity by the color alpha, so dimming stays per node/link. */
export function colorWithAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Edge width matches the prototype: high 2.5 / moderate 1.5 / low 0.8. */
export function linkWidthForStrength(strength: string | undefined): number {
  if (strength === 'high') return 2.5;
  if (strength === 'moderate') return 1.5;
  if (strength === 'quantitative') return 2;
  return 0.8;
}
