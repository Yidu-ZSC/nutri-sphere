export const THEME_STORAGE_KEY = 'cleardiet.theme';

export const THEME_IDS = ['dark', 'fresh', 'soft', 'eye'] as const;

export type AppTheme = (typeof THEME_IDS)[number];

export const THEME_OPTIONS: readonly { id: AppTheme; label: string }[] = [
  { id: 'dark', label: '深色' },
  { id: 'fresh', label: '清新' },
  { id: 'soft', label: '柔和' },
  { id: 'eye', label: '护眼' },
];

const THEME_SET: ReadonlySet<string> = new Set(THEME_IDS);

export function isAppTheme(value: string | null | undefined): value is AppTheme {
  return value != null && THEME_SET.has(value);
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

/** Read `cleardiet.theme`. Missing key stays dark in memory. Illegal values fall back to dark and are written back. */
export function readTheme(storage?: ThemeStorage | null): AppTheme {
  const store = storage === undefined ? browserStorage() : storage;
  try {
    const stored = store?.getItem(THEME_STORAGE_KEY) ?? null;
    if (isAppTheme(stored)) return stored;
    if (stored !== null) {
      try {
        store?.setItem(THEME_STORAGE_KEY, 'dark');
      } catch {
        // Write-back is best-effort when storage rejects the write.
      }
    }
  } catch {
    // Private mode or blocked storage: keep the in-memory default.
  }
  return 'dark';
}

export function writeTheme(theme: AppTheme, storage?: ThemeStorage | null): void {
  const store = storage === undefined ? browserStorage() : storage;
  try {
    store?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Persistence is best-effort; the in-memory choice still applies.
  }
}

export function applyTheme(
  theme: AppTheme,
  root?: { setAttribute(name: string, value: string): void } | null,
): void {
  const target =
    root === undefined ? (typeof document !== 'undefined' ? document.documentElement : null) : root;
  target?.setAttribute('data-theme', theme);
}
