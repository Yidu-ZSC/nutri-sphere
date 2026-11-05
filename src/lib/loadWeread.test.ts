import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { truncateMarkText, WEREAD_SOURCE_IDS } from './loadWeread.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const wereadDir = path.join(root, 'data/weread');

test('weread JSON corpora are absent after NS-066 deprecation', () => {
  assert.equal(WEREAD_SOURCE_IDS.length, 6);
  for (const sourceId of WEREAD_SOURCE_IDS) {
    assert.equal(fs.existsSync(path.join(wereadDir, `${sourceId}.json`)), false, sourceId);
  }
  assert.equal(fs.existsSync(path.join(wereadDir, 'mapping_report.json')), false);
});

test('truncateMarkText caps preview length', () => {
  assert.equal(truncateMarkText('短句'), '短句');
  const long = '啊'.repeat(130);
  const out = truncateMarkText(long, 120);
  assert.equal(out.length, 121);
  assert.ok(out.endsWith('…'));
});
