import type { AppTheme } from './themePreference.ts';

/** Visual tokens for the graph canvas (independent of light UI shell). */
export interface CanvasStage {
  bg: string;
  nodeStroke: string;
  nodeStrokeSelected: string;
  labelPlateBright: string;
  labelPlateDim: string;
  labelTextBright: string;
  labelTextDim: string;
  columnPlate: string;
  columnPlateStroke: string;
  columnText: string;
  spriteLabelColor: string;
  spriteLabelBg: string;
  spriteStroke: string;
  frameGlow: string;
}

const STAGES: Record<AppTheme, CanvasStage> = {
  light: {
    bg: '#0a0c11',
    nodeStroke: 'rgba(132, 146, 166, 0.48)',
    nodeStrokeSelected: '#eef2f8',
    labelPlateBright: 'rgba(10, 14, 22, 0.93)',
    labelPlateDim: 'rgba(10, 14, 22, 0.62)',
    labelTextBright: '#eef2f8',
    labelTextDim: 'rgba(238, 242, 248, 0.58)',
    columnPlate: 'rgba(12, 18, 28, 0.94)',
    columnPlateStroke: 'rgba(196, 208, 224, 0.2)',
    columnText: 'rgba(214, 224, 236, 0.96)',
    spriteLabelColor: '#eef2f8',
    spriteLabelBg: 'rgba(10, 14, 22, 0.93)',
    spriteStroke: '#06080c',
    frameGlow: 'rgba(61, 110, 168, 0.14)',
  },
  paper: {
    bg: '#100e0b',
    nodeStroke: 'rgba(158, 145, 128, 0.46)',
    nodeStrokeSelected: '#faf6f0',
    labelPlateBright: 'rgba(18, 14, 10, 0.93)',
    labelPlateDim: 'rgba(18, 14, 10, 0.62)',
    labelTextBright: '#faf6f0',
    labelTextDim: 'rgba(250, 246, 240, 0.58)',
    columnPlate: 'rgba(22, 16, 12, 0.94)',
    columnPlateStroke: 'rgba(210, 190, 165, 0.22)',
    columnText: 'rgba(232, 218, 198, 0.96)',
    spriteLabelColor: '#faf6f0',
    spriteLabelBg: 'rgba(18, 14, 10, 0.93)',
    spriteStroke: '#0c0a08',
    frameGlow: 'rgba(140, 100, 60, 0.12)',
  },
  stone: {
    bg: '#08090f',
    nodeStroke: 'rgba(118, 130, 158, 0.5)',
    nodeStrokeSelected: '#f0f2f8',
    labelPlateBright: 'rgba(8, 10, 18, 0.93)',
    labelPlateDim: 'rgba(8, 10, 18, 0.62)',
    labelTextBright: '#f0f2f8',
    labelTextDim: 'rgba(240, 242, 248, 0.58)',
    columnPlate: 'rgba(10, 12, 22, 0.94)',
    columnPlateStroke: 'rgba(170, 182, 210, 0.2)',
    columnText: 'rgba(206, 214, 232, 0.96)',
    spriteLabelColor: '#f0f2f8',
    spriteLabelBg: 'rgba(8, 10, 18, 0.93)',
    spriteStroke: '#05060a',
    frameGlow: 'rgba(70, 95, 150, 0.16)',
  },
  contrast: {
    bg: '#030304',
    nodeStroke: 'rgba(160, 168, 184, 0.55)',
    nodeStrokeSelected: '#ffffff',
    labelPlateBright: 'rgba(0, 0, 0, 0.88)',
    labelPlateDim: 'rgba(0, 0, 0, 0.58)',
    labelTextBright: '#ffffff',
    labelTextDim: 'rgba(255, 255, 255, 0.55)',
    columnPlate: 'rgba(0, 0, 0, 0.9)',
    columnPlateStroke: 'rgba(255, 255, 255, 0.22)',
    columnText: 'rgba(245, 245, 247, 0.98)',
    spriteLabelColor: '#ffffff',
    spriteLabelBg: 'rgba(0, 0, 0, 0.88)',
    spriteStroke: '#000000',
    frameGlow: 'rgba(255, 255, 255, 0.06)',
  },
};

export function canvasStageForTheme(theme: AppTheme): CanvasStage {
  return STAGES[theme] ?? STAGES.light;
}

/** Default stage background (light UI theme). */
export const CANVAS_BG = STAGES.light.bg;

export function applyCanvasStageCss(
  theme: AppTheme,
  root: { style: { setProperty(name: string, value: string): void } },
): void {
  const stage = canvasStageForTheme(theme);
  root.style.setProperty('--canvas-bg', stage.bg);
  root.style.setProperty('--canvas-frame-glow', stage.frameGlow);
}
