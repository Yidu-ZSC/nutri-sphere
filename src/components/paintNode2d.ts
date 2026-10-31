import { LABEL_FONT } from '../lib/labelText';
import { COLUMN_CAPTIONS, columnIndex } from '../lib/layout';
import { nodeScale, shapeKindForType, type ShapeKind } from '../lib/nodeStyle';
import { colorWithAlpha, semanticColor } from '../lib/palette';

const FONT = 4.15;
const MAX_LABEL_WIDTH = 60;

export interface PaintedNode {
  x: number;
  y: number;
  label: string;
  type: string;
  group: string;
  degree: number;
  selected: boolean;
  bright: boolean;
  showLabel: boolean;
  expert: boolean;
  typeLabel: string;
}

export function nodeRadius(degree: number, type: string, selected: boolean): number {
  return Math.min(nodeScale(degree, type, selected) * 1.12, 5.4);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function polygon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  sides: number,
  rotation: number,
) {
  ctx.beginPath();
  for (let index = 0; index < sides; index += 1) {
    const angle = rotation + (index * 2 * Math.PI) / sides;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function traceShape(ctx: CanvasRenderingContext2D, kind: ShapeKind, x: number, y: number, radius: number) {
  if (kind === 'rounded') {
    const width = radius * 1.9;
    const height = radius * 1.72;
    roundRect(ctx, x - width / 2, y - height / 2, width, height, radius * 0.42);
    return;
  }
  if (kind === 'hex') {
    polygon(ctx, x, y, radius, 6, Math.PI / 6);
    return;
  }
  if (kind === 'diamond') {
    polygon(ctx, x, y, radius * 1.18, 4, Math.PI / 2);
    return;
  }
  polygon(ctx, x, y, radius, 8, Math.PI / 8);
}

interface LabelBox {
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
  lineH: number;
  padY: number;
}

function fittedFont(ctx: CanvasRenderingContext2D, text: string, preferred: number): number {
  ctx.font = `600 ${preferred}px ${LABEL_FONT}`;
  const width = ctx.measureText(text).width;
  if (width <= MAX_LABEL_WIDTH) return preferred;
  return Math.max(3.05, preferred * (MAX_LABEL_WIDTH / width));
}

function measureLabel(ctx: CanvasRenderingContext2D, node: PaintedNode): LabelBox | null {
  if (!node.showLabel) return null;
  const fontPx = fittedFont(ctx, node.label, node.selected ? FONT * 1.12 : FONT);
  ctx.font = `600 ${fontPx}px ${LABEL_FONT}`;
  const lines = [node.label];
  if (node.expert) lines.push(node.typeLabel);
  const lineH = fontPx * 1.2;
  const padX = fontPx * 0.46;
  const padY = fontPx * 0.32;
  const textW = Math.max(...lines.map((line) => ctx.measureText(line).width), fontPx);
  const w = textW + padX * 2;
  const h = lineH * lines.length + padY * 2;
  const radius = nodeRadius(node.degree, node.type, node.selected);
  return {
    x: node.x - w / 2,
    y: node.y - radius - fontPx * 0.7 - h,
    w,
    h,
    lines,
    lineH,
    padY,
  };
}

export function paintGraphNode(ctx: CanvasRenderingContext2D, node: PaintedNode, globalScale: number) {
  const radius = nodeRadius(node.degree, node.type, node.selected);
  ctx.save();
  traceShape(ctx, shapeKindForType(node.type), node.x, node.y, radius);
  const color = semanticColor(node.group);
  ctx.fillStyle = node.bright ? color : colorWithAlpha(color, 0.22);
  ctx.fill();
  ctx.lineWidth = (node.selected ? 2.2 : 1.15) / Math.max(globalScale, 0.001);
  ctx.strokeStyle = node.selected ? '#f4f7fb' : 'rgba(6, 10, 16, 0.55)';
  ctx.stroke();

  const box = measureLabel(ctx, node);
  if (box) {
    roundRect(ctx, box.x, box.y, box.w, box.h, Math.min(2.4, box.h / 3));
    ctx.fillStyle = node.bright ? 'rgba(8, 12, 18, 0.9)' : 'rgba(8, 12, 18, 0.62)';
    ctx.fill();
    ctx.fillStyle = node.bright ? '#f4f7fb' : 'rgba(244, 247, 251, 0.62)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    box.lines.forEach((line, index) => {
      ctx.fillText(line, node.x, box.y + box.padY + index * box.lineH);
    });
  }
  ctx.restore();
}

export function paintGraphNodeHit(ctx: CanvasRenderingContext2D, node: PaintedNode, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  traceShape(ctx, shapeKindForType(node.type), node.x, node.y, nodeRadius(node.degree, node.type, node.selected));
  ctx.fill();
  const box = measureLabel(ctx, node);
  if (box) ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.restore();
}

export function paintColumnCaptions(
  ctx: CanvasRenderingContext2D,
  nodes: readonly { x?: number; y?: number; type: string }[],
  globalScale: number,
) {
  const placed = nodes.filter((node) => node.y != null);
  if (placed.length === 0) return;
  const scale = Math.max(globalScale, 0.001);
  const headerY = Math.min(...placed.map((node) => node.y ?? 0)) - 26;
  ctx.save();
  ctx.font = `600 ${13 / scale}px ${LABEL_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  COLUMN_CAPTIONS.forEach((caption, column) => {
    const group = placed.filter((node) => columnIndex(node.type) === column);
    if (group.length === 0) return;
    const x = group.reduce((sum, node) => sum + (node.x ?? 0), 0) / group.length;
    const width = ctx.measureText(caption).width;
    const padX = 8 / scale;
    const textH = 16 / scale;
    const boxW = width + padX * 2;
    const boxH = textH + 5 / scale;
    roundRect(ctx, x - boxW / 2, headerY - boxH, boxW, boxH, 7 / scale);
    ctx.fillStyle = 'rgba(18, 26, 38, 0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(232, 238, 247, 0.16)';
    ctx.lineWidth = 1 / scale;
    ctx.stroke();
    ctx.fillStyle = 'rgba(214, 224, 236, 0.96)';
    ctx.fillText(caption, x, headerY - 3 / scale);
  });
  ctx.restore();
}
