import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../components/DetailDrawer.tsx', import.meta.url), 'utf8');

/** Extract the LinkBody evidence-card JSX region for order checks. */
function evidenceCardSource(): string {
  const start = source.indexOf('data-testid="evidence-card"');
  assert.ok(start > 0);
  const end = source.indexOf('data-testid="expert-link-meta"', start);
  assert.ok(end > start);
  return source.slice(start, end);
}

test('NS-047 LinkBody keeps excerpt before source, limitations, badges, then more-detail', () => {
  const card = evidenceCardSource();
  const marks = [
    'ExcerptBlock',
    'SourceFile',
    'link-limitations',
    'evidence-badges',
    'MoreDetail',
  ];
  const at = marks.map((m) => {
    const i = card.indexOf(m);
    assert.ok(i >= 0, `missing ${m}`);
    return i;
  });
  for (let i = 1; i < at.length; i += 1) {
    assert.ok(at[i] > at[i - 1], `${marks[i - 1]} must precede ${marks[i]}`);
  }
  // Technical blocks live inside MoreDetail, after excerpt
  assert.ok(card.indexOf('ExcerptBlock') < card.indexOf('MoreDetail'));
  assert.ok(card.indexOf('assurance') > card.indexOf('MoreDetail'));
  assert.ok(card.indexOf('证据类型说明') > card.indexOf('MoreDetail'));
  assert.ok(card.indexOf('CitationBlock') > card.indexOf('MoreDetail'));
  assert.ok(card.indexOf('ladder') > card.indexOf('MoreDetail'));
});

test('NS-047 more-detail is a single collapsed details block; limitations stay outside', () => {
  assert.match(source, /data-testid="more-detail"/);
  assert.match(source, /<summary>更多说明<\/summary>/);
  // MoreDetail helper has no open attr
  const moreFn = source.indexOf('function MoreDetail');
  const moreChunk = source.slice(moreFn, moreFn + 280);
  assert.match(moreChunk, /data-testid="more-detail"/);
  assert.equal(/\bopen\b/.test(moreChunk), false);
  // limitations before MoreDetail in the card
  const card = evidenceCardSource();
  assert.ok(card.indexOf('link-limitations') < card.indexOf('MoreDetail'));
  assert.ok(card.indexOf('ExcerptBlock') < card.indexOf('link-limitations'));
  // no layer prop / expert gating
  assert.equal(/layer:\s*ViewLayer/.test(source), false);
  assert.equal(/full=\{expert\}/.test(source), false);
  assert.equal(/open=\{expert\}/.test(source), false);
  // only one more-detail test id in the file
  assert.equal((source.match(/data-testid="more-detail"/g) ?? []).length, 1);
});

test('NS-046 seed descriptions drop graph meta-language for the five baseline ids', () => {
  const seed = JSON.parse(
    fs.readFileSync(new URL('../../data/seed_triples_v0.3_aligned.json', import.meta.url), 'utf8'),
  ) as { nodes: { id: string; description: string }[] };
  const byId = Object.fromEntries(seed.nodes.map((n) => [n.id, n.description]));
  assert.equal(
    byId.chronic_inflammation,
    '持续存在的低度炎症状态，书摘里常把它和饮食选择、多种健康主题放在一起讨论。',
  );
  for (const id of [
    'chronic_inflammation',
    'digestive_cancer_risk',
    'cardiometabolic',
    'autoimmune',
    'mental_health',
  ]) {
    assert.equal(/枢纽|教育向节点|中间环节|路径节点|本节点是/.test(byId[id]), false, id);
  }
  assert.match(byId.autoimmune, /不是疾病分类标准/);
  for (const node of seed.nodes) {
    assert.equal(/中间环节|路径节点|枢纽|教育向节点/.test(node.description ?? ''), false, node.id);
  }
});

/** Extract the NodeBody function region for order checks. */
function nodeBodySource(): string {
  const start = source.indexOf('function NodeBody');
  assert.ok(start > 0);
  const end = source.indexOf('function SourceFile', start);
  assert.ok(end > start);
  return source.slice(start, end);
}

test('NS-052 NodeBody shows description and related before MoreDetail; type/aliases inside', () => {
  const body = nodeBodySource();
  const desc = body.indexOf('node-description');
  const related = body.indexOf('node-related');
  const more = body.indexOf('MoreDetail');
  assert.ok(desc >= 0, 'missing node-description');
  assert.ok(related >= 0, 'missing node-related');
  assert.ok(more >= 0, 'missing MoreDetail');
  assert.ok(desc < related, 'description must precede related');
  assert.ok(related < more, 'related must precede MoreDetail');

  // Direction badge from group, not a 分组 Field in the main area
  assert.ok(body.indexOf('node-direction') >= 0);
  assert.ok(body.indexOf('node-direction') < more);
  const main = body.slice(0, more);
  assert.equal(/<dt>分组<\/dt>/.test(main), false);
  assert.equal(/<dt>类型<\/dt>/.test(main), false);
  assert.equal(/label="别名"/.test(main), false);
  assert.equal(/label="说明"/.test(main), false);

  // Type + aliases live inside MoreDetail children
  const folded = body.slice(more);
  assert.match(folded, /<dt>类型<\/dt>/);
  assert.match(folded, /label="别名"/);
  assert.ok(folded.indexOf('类型') < folded.indexOf('别名'));
  assert.ok(folded.indexOf('别名') < folded.indexOf('说明深度'));
  assert.ok(folded.indexOf('说明深度') < folded.indexOf('node-id'));
});

test('NS-052 related cards use left direction color bar and 12px padding class', () => {
  const body = nodeBodySource();
  assert.match(body, /borderLeftColor:\s*semanticColor\(link\.direction\)/);
  assert.match(body, /className="related-btn"/);
  const css = fs.readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /\.related-btn\s*\{[\s\S]*?padding:\s*12px/);
  assert.match(css, /\.related-btn:hover\s*\{/);
  assert.match(css, /border-left-width:\s*4px/);
});
