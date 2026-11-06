import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SHELL_RAIL_MOBILE_MAX,
  SHELL_RAIL_STORAGE_KEY,
  parseShellRailPreference,
  railMode,
  readShellRailPreference,
  writeShellRailPreference,
} from './shellRail.ts';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

test('railMode uses the mobile cutoff and desktop defaults', () => {
  assert.equal(railMode(390, null), 'drawer');
  assert.equal(railMode(SHELL_RAIL_MOBILE_MAX, null), 'drawer');
  assert.equal(railMode(SHELL_RAIL_MOBILE_MAX + 1, null), 'collapsed');
  assert.equal(railMode(1024, null), 'collapsed');
  assert.equal(railMode(1279, null), 'collapsed');
  assert.equal(railMode(1280, null), 'expanded');
  assert.equal(railMode(1440, null), 'expanded');
});

test('a saved desktop preference overrides the width default but never turns mobile into a rail', () => {
  assert.equal(railMode(1024, 'expanded'), 'expanded');
  assert.equal(railMode(1440, 'collapsed'), 'collapsed');
  assert.equal(railMode(390, 'expanded'), 'drawer');
  assert.equal(railMode(768, 'collapsed'), 'drawer');
});

test('shell rail preference parsing ignores stale or unsafe values', () => {
  assert.equal(parseShellRailPreference('expanded'), 'expanded');
  assert.equal(parseShellRailPreference('collapsed'), 'collapsed');
  assert.equal(parseShellRailPreference('open'), null);
  assert.equal(parseShellRailPreference(''), null);
  assert.equal(parseShellRailPreference(null), null);
});

test('shell rail preference reads and writes only its own local key', () => {
  const storage = memoryStorage();
  assert.equal(readShellRailPreference(storage), null);
  writeShellRailPreference('collapsed', storage);
  assert.equal(storage.data.get(SHELL_RAIL_STORAGE_KEY), 'collapsed');
  assert.equal(readShellRailPreference(storage), 'collapsed');
  writeShellRailPreference('expanded', storage);
  assert.equal(readShellRailPreference(storage), 'expanded');
});
