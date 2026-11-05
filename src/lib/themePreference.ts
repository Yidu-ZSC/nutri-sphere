import { applyCanvasStageCss } from './canvasStage.ts';

export const THEME_STORAGE_KEY = 'cleardiet.theme';

export const THEME_IDS = ['light', 'paper', 'stone', 'contrast'] as const;

export type AppTheme = (typeof THEME_IDS)[number];

export const THEME_OPTIONS: readonly { id: AppTheme; label: string }[] = [
  { id: 'light', label: '标准' },
  { id: 'paper', label: '纸本' },
  { id: 'stone', label: '岩灰' },
  { id: 'contrast', label: '高对比' },
];

const THEME_SET: ReadonlySet<string> = new Set(THEME_IDS);

/** Previous UI theme slugs before the professional shell redesign. */
const LEGACY_THEME_MAP: Readonly<Record<string, AppTheme>> = {
  dark: 'light',
  fresh: 'light',
  soft: 'paper',
  eye: 'stone',
};

export function isAppTheme(value: string | null | undefined): value is AppTheme {
  return value != null && THEME_SET.has(value);
}

function normalizeTheme(stored: string | null): AppTheme {
  if (isAppTheme(stored)) return stored;
  if (stored != null && LEGACY_THEME_MAP[stored]) return LEGACY_THEME_MAP[stored]!;
  return 'light';
}

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): ThemeStorage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

/** Read `cleardiet.theme`. Missing key defaults to light. Illegal values fall back to light and are written back. */
export function readTheme(storage?: ThemeStorage | null): AppTheme {
  const store = storage === undefined ? browserStorage() : storage;
  try {
    const stored = store?.getItem(THEME_STORAGE_KEY) ?? null;
    const theme = normalizeTheme(stored);
    if (stored != null && stored !== theme) {
      try {
        store?.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Write-back is best-effort when storage rejects the write.
      }
    }
    return theme;
  } catch {
    return 'light';
  }
}

export function writeTheme(theme: AppTheme, storage?: ThemeStorage | null): void {
  const store = storage === undefined ? browserStorage() : storage;
  try {
    store?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Persistence is best-effort; the in-memory choice still applies.
  }
}

type ThemeRoot = HTMLElement | { setAttribute(name: string, value: string): void; style: { setProperty(name: string, value: string): void } };

export function applyTheme(theme: AppTheme, root?: ThemeRoot | null): void {
  const target =
    root === undefined ? (typeof document !== 'undefined' ? document.documentElement : null) : root;
  target?.setAttribute('data-theme', theme);
  if (target && 'style' in target && target.style) {
    applyCanvasStageCss(theme, target);
  }
}
