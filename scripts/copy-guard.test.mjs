import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const banned = ['治愈', '疗效', '处方', '停药', '你患有', '诊断为', '包治', '必死', '替代就医', '防治', 'GRADE', '预防', '推荐', '建议采用'];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(tsx|ts|css)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) acc.push(full);
  }
  return acc;
}

test('interface copy does not make treatment or diagnosis claims', () => {
  const files = walk(path.join(root, 'src')).filter((file) => !file.endsWith(`${path.sep}copy.ts`));
  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const word of banned) {
      if (text.includes(word)) hits.push(`${path.relative(root, file)} contains ${word}`);
    }
  }
  assert.deepEqual(hits, []);
});
