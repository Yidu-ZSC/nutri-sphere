import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { assertWereadCorpus, truncateMarkText, WEREAD_SOURCE_IDS } from './loadWeread.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const A2: Record<string, string> = {
  eat_to_heal: '39484588',
  how_not_to_die: '3300017717',
  gut_brain: '24913511',
  amazing_veggie_soup: '3300084701',
  china_study: '3300047535',
  know_your_gut: '26793466',
};

function readJson(rel: string) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

test('six weread corpora assert shape, A2 bookId, and no review keys', () => {
  assert.deepEqual([...WEREAD_SOURCE_IDS].sort(), Object.keys(A2).sort());
  for (const sourceId of WEREAD_SOURCE_IDS) {
    const payload = readJson(`data/weread/${sourceId}.json`);
    const corpus = assertWereadCorpus(payload, sourceId);
    assert.equal(corpus.bookId, A2[sourceId]);
    assert.equal(corpus.stats.bookmark_count, corpus.bookmarks.length);
    assert.equal(corpus.stats.bestbookmark_item_count, corpus.bestbookmarks.items.length);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'review'), false);
    assert.ok(corpus.bookmarks.every((bm) => typeof bm.markText === 'string' && bm.markText.length > 0));
  }
  const soup = assertWereadCorpus(readJson('data/weread/amazing_veggie_soup.json'), 'amazing_veggie_soup');
  assert.equal(soup.bookmarks.length, 0);
  assert.ok(soup.bestbookmarks.items.length > 0);
  const gut = assertWereadCorpus(readJson('data/weread/gut_brain.json'), 'gut_brain');
  assert.ok(gut.stats.bookmark_count >= 60);
  assert.match(gut.bookmarks[0]!.markText, /\S/);
});

test('truncateMarkText caps preview length', () => {
  assert.equal(truncateMarkText('短句'), '短句');
  const long = '啊'.repeat(130);
  const out = truncateMarkText(long, 120);
  assert.equal(out.length, 121);
  assert.ok(out.endsWith('…'));
});
