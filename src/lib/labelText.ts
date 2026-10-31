export const LABEL_FONT =
  '"WenQuanYi Micro Hei", "Droid Sans Fallback", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';

function chunk(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (let index = 0; index < text.length; index += maxChars) {
    lines.push(text.slice(index, index + maxChars));
  }
  return lines;
}

/** Break long pathway names on " / " first, then by width, so columns stay readable. */
export function wrapCjk(text: string, maxChars: number): string[] {
  const clean = text.trim();
  if (clean.length <= maxChars) return [clean];
  const parts = clean.split(/\s*\/\s*/).map((part) => part.trim()).filter(Boolean);
  const lines = parts.length > 1 ? parts.flatMap((part) => chunk(part, maxChars)) : chunk(clean, maxChars);
  return lines.slice(0, 3);
}

export function pathwayLabelLines(label: string, expert: boolean, typeLabel: string): string[] {
  const lines = wrapCjk(label, 9);
  if (expert) lines.push(typeLabel);
  return lines.slice(0, 4);
}
