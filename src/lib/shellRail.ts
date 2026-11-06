export const SHELL_RAIL_STORAGE_KEY = 'cleardiet.shellRail';
export const SHELL_RAIL_MOBILE_MAX = 768;
export const SHELL_RAIL_EXPANDED_MIN = 1280;

export type ShellRailPreference = 'expanded' | 'collapsed';
export type ShellRailMode = ShellRailPreference | 'drawer';
export type ShellRailFocusTarget = 'search' | 'record' | 'themes';

interface RailStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function parseShellRailPreference(value: string | null): ShellRailPreference | null {
  if (value === 'expanded' || value === 'collapsed') return value;
  return null;
}

/** Desktop uses the saved preference, then the 1280px default. Mobile is always a drawer. */
export function railMode(viewportWidth: number, preference: ShellRailPreference | null): ShellRailMode {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= SHELL_RAIL_MOBILE_MAX) return 'drawer';
  if (preference) return preference;
  return viewportWidth >= SHELL_RAIL_EXPANDED_MIN ? 'expanded' : 'collapsed';
}

function browserStorage(): RailStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readShellRailPreference(storage: RailStorage | null = browserStorage()): ShellRailPreference | null {
  try {
    return parseShellRailPreference(storage?.getItem(SHELL_RAIL_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
}

export function writeShellRailPreference(
  preference: ShellRailPreference,
  storage: RailStorage | null = browserStorage(),
): void {
  try {
    storage?.setItem(SHELL_RAIL_STORAGE_KEY, preference);
  } catch {
    // Rail state is a convenience preference; a blocked storage API must not break the app.
  }
}
