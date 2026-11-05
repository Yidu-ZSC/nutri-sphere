import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ALIGNED_SEED, GRAPH_SCHEMA, validateAdminBooks, validateGraphData, validateGraphFile, validateWereadCorpora,
  validateWereadMappingReport } from './validate-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

const COLUMN = {
  diet_pattern: 0,
  food_category: 0,
  food: 0,
  nutrient: 1,
  compound: 1,
  metabolite: 1,
  mechanism: 2,
  disease: 3,
  biomarker: 3,
};

const ORIGINAL_EXCERPTS = [
  '谷胱甘肽多存在于芹菜、菠菜等黄绿色蔬菜中…从蔬菜汤中获取的谷胱甘肽被肠道吸收后…可以起到抗氧化和抗炎的作用',
  '谷胱甘肽能消除毒性最强的脂质自由基，预防癌症和炎症',
  '植物性饮食的抗氧化作用能够阻止氧化反应',
  '从慢性肝炎发展成肝功能衰竭、肝癌',
  '癌症是没有终止的炎症，长期持续的炎症状态是引发肝脏、胃等消化系统器官癌症的原因',
  '高血糖也会引起慢性炎症…糖化程度越强，大脑、心脏、肾脏等器官受到损伤而引发炎症的危险性就越大',
  '短链脂肪酸（SCFA）是细菌消化植物性纤维所产生的副产品…抗炎特性能够保护你的肠道和整体健康',
  '它们的抗炎特性能够保护你的肠道和整体健康',
  '益生元是一种人体无法消化的食物，却能给我们肠道中的健康细菌提供食物',
  '大豆食品含有强效的抗血管生成特性',
  '浆果、核果、番茄等含类胡萝卜素、花青素等，具有抗血管生成活性',
  '素食者所摄取到的所有营养素几乎都比肉食者多，包括膳食纤维',
  '少吃动物性食物和高度精制的植物性食物，并多吃天然蔬食',
  '如果脂多糖进入到血液，就会在动物体内诱发强烈的炎症反应',
  '血液中的脂多糖水平能对肠道渗漏起到指示作用',
  '微生物组可以调控或管理免疫反应',
  '菌-肠-脑轴调节心理和行为',
  'ω-3多不饱和脂肪酸具有抗氧化作用，可以对抗自由基造成的DNA破坏',
  '在植物性食物、茶或咖啡中发现的生物活性物质可以对你的DNA产生积极的影响',
  '肠道细菌失衡的中间产物同样会对线粒体造成直接伤害，转而引发更激烈的炎症反应',
];

const STAGE_A_LINKS = 101; // was 117; NS-064 removed 16 gut_brain edges from Stage A
// NS-064 deleted legacy gut_brain links at old indices 13,14,15,19 (and others later).
// Remap pre-NS-064 ORIGINAL_EXCERPTS indices onto the compacted link array.
const NS064_DELETED_ORIG_IDX = new Set([13, 14, 15, 19]);
function ns064RemapOrigIdx(oldIdx) {
  if (NS064_DELETED_ORIG_IDX.has(oldIdx)) return null;
  let shift = 0;
  for (const d of NS064_DELETED_ORIG_IDX) {
    if (d < oldIdx) shift += 1;
  }
  return oldIdx - shift;
}

test('aligned seed passes schema and referential checks', () => {
  const result = validateGraphFile();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.counts.nodes, 102);
  assert.equal(result.counts.links, 158);
});

const TECHNICAL_NODES = ['igf1_signaling', 'lps'];

test('data 1.5 uses schema 0.7 with domain=health on all nodes/links; NS-065 drops limitations', () => {
  const data = readJson(ALIGNED_SEED);
  assert.equal(data.meta.schema_version, '0.7');
  assert.equal(data.meta.data_version, '1.5');
  assert.equal(data.meta.disclaimer, 'Educational / research use only. Not medical advice.');
  assert.equal(data.nodes.length, 102);
  assert.equal(data.links.length, 158);
  for (const node of data.nodes) {
    assert.equal(node.domain, 'health', node.id);
  }
  for (const link of data.links) {
    assert.equal(link.domain, 'health', link.id ?? `${link.source}->${link.target}`);
  }
  assert.equal(data.nodes.some((n) => n.domain === 'environment' || n.domain === 'culture'), false);
  assert.equal(data.links.some((l) => l.domain === 'environment' || l.domain === 'culture'), false);
  for (const link of data.links) {
    assert.equal('limitations' in link, false, link.id ?? `${link.source}->${link.target}`);
    for (const ev of link.evidences) {
      assert.equal('limitations' in ev, false);
    }
  }
  assert.ok(data.nodes.length >= 60 && data.nodes.length <= 120);
  assert.ok(data.links.length >= 80 && data.links.length <= 200);
  assert.equal(data.links.length, 158);
  assert.equal(data.links.slice(0, STAGE_A_LINKS).length, STAGE_A_LINKS);
  assert.equal(data.links[STAGE_A_LINKS].id, 'lit_fiber_cvd_reynolds_2019');
  // NS-056 pathway verification (800–1200)
  const ns056LengthenedIdx = new Set([11, 18]); // 19 was gut_brain, removed in NS-064
  // NS-058 priority-theme short→原文 expansions (target 400–800); 13–15 were gut_brain
  const ns058LengthenedIdx = new Set([2, 3, 4, 5, 7, 8, 12, 16]);
  // NS-061: short [0] (<200) may be promote0'd by weread mapping; prior short text kept in evidences[1+]
  const ns061Promote0Idx = new Set([6, 10, 17]);
  ORIGINAL_EXCERPTS.forEach((excerpt, index) => {
    const mapped = ns064RemapOrigIdx(index);
    if (mapped == null) {
      // Legacy gut_brain Stage-A short excerpts were deleted in NS-064 full replace.
      return;
    }
    if (ns056LengthenedIdx.has(index)) {
      assert.ok(data.links[mapped].excerpt.includes(excerpt.slice(0, 12)), `idx ${index}->${mapped}`);
      assert.ok(data.links[mapped].excerpt.length >= 800 && data.links[mapped].excerpt.length <= 1200);
    } else if (ns058LengthenedIdx.has(index)) {
      assert.notEqual(data.links[mapped].excerpt, excerpt, `idx ${index}->${mapped} should be expanded`);
      assert.ok(data.links[mapped].excerpt.length >= 400 && data.links[mapped].excerpt.length <= 1200, `idx ${index}->${mapped}`);
    } else if (ns061Promote0Idx.has(index)) {
      const ev0 = data.links[mapped].evidences[0];
      assert.ok(ev0.weread_bookmark_id, `idx ${index}->${mapped} promote0 weread`);
      assert.equal(ev0.source_file, `weread/${ev0.source_id}.json`);
      const still =
        data.links[mapped].evidences.slice(1).some((ev) => ev.excerpt === excerpt) ||
        data.links[mapped].excerpt !== excerpt;
      assert.ok(still, `idx ${index}->${mapped} prior short excerpt preserved or replaced via promote0`);
    } else {
      assert.equal(data.links[mapped].excerpt, excerpt);
    }
  });
  const wereadEv = data.links.reduce(
    (n, link) => n + (link.evidences || []).filter((ev) => ev.weread_bookmark_id).length,
    0,
  );
  // NS-064: gut_brain weread attachments removed with deleted edges (accepted).
  assert.ok(wereadEv >= 19, `weread evidences ${wereadEv}`);

  const byId = new Map(data.nodes.map((node) => [node.id, node]));
  const degree = new Map();
  for (const link of data.links) {
    degree.set(link.source, (degree.get(link.source) ?? 0) + 1);
    degree.set(link.target, (degree.get(link.target) ?? 0) + 1);
  }
  for (const node of data.nodes) {
    const deg = degree.get(node.id) ?? 0;
    // NS-053/054: dictionary-only mechanisms or protective disease nodes may ship with degree 0 (no forced edges).
    // NS-064: tryptophan_metabolites lost its only gut_brain edges; metabolite orphan kept (no hand-patched topology).
    const dictionaryOrphan =
      (node.type === 'mechanism' && deg === 0) ||
      (node.type === 'disease' && node.group === 'protective' && deg === 0);
    const ns064MetaboliteOrphan = node.type === 'metabolite' && deg === 0;
    const orphanAllowed = dictionaryOrphan || ns064MetaboliteOrphan;
    if (!orphanAllowed) {
      assert.ok(deg > 0, node.id);
    } else {
      assert.ok(node.description, node.id);
      if (dictionaryOrphan) {
        assert.deepEqual(node.aliases, []);
      }
    }
    if (COLUMN[node.type] === 0) {
      assert.ok(node.description && node.aliases?.length, node.id);
    }
    if (node.type === 'mechanism' && deg >= 3) {
      assert.ok(node.description && node.aliases?.length, node.id);
    }
  }
  for (const id of ['ultra_processed', 'autoimmune']) {
    const cross = data.links.some((link) => {
      if (link.source !== id && link.target !== id) return false;
      return COLUMN[byId.get(link.source).type] !== COLUMN[byId.get(link.target).type];
    });
    assert.equal(cross, true, id);
  }
  for (const link of data.links.slice(ORIGINAL_EXCERPTS.length, STAGE_A_LINKS)) {
    assert.equal(link.evidence_type.startsWith('book_notes_'), true, link.note_id);
    assert.notEqual(link.note_id, 'related');
    assert.notEqual(link.note_id, 'multiple');
    assert.equal(link.evidence_type.includes('interventional'), false);
    assert.equal(link.citation, undefined);
  }
  const biomarkers = data.nodes.filter((node) => node.type === 'biomarker');
  assert.ok(biomarkers.length >= 1 && biomarkers.length <= 3);

  for (const link of data.links) {
    assert.equal(typeof link.source_title, 'string', link.id);
    assert.ok(link.source_title.trim().length > 0, link.id);
    assert.ok(Array.isArray(link.evidences) && link.evidences.length >= 1, link.id);
    assert.equal(link.excerpt, link.evidences[0].excerpt, link.id);
    assert.equal(link.source_title, link.evidences[0].source_title, link.id);
    assert.equal(link.source_file, link.evidences[0].source_file, link.id);
    if (link.source_file === 'literature') {
      assert.equal('source_id' in link && link.source_id != null, false, link.id);
      assert.equal(link.source_title, link.citation.title, link.id);
    } else {
      assert.equal(typeof link.source_id, 'string', link.id);
      assert.ok(link.source_id.trim().length > 0, link.id);
    }
  }
  const longPrimaries = data.links.filter((link) => {
    const n = link.evidences[0].excerpt.length;
    return n >= 800 && n <= 1200;
  });
  assert.ok(longPrimaries.length >= 8 && longPrimaries.length <= 40, String(longPrimaries.length));
  const multi = data.links.filter((link) => link.evidences.length > 1);
  // NS-056 shipped 3 multi-evidence edges; NS-061 append/promote0 expands further
  assert.ok(multi.length >= 3, String(multi.length));
  assert.ok(
    multi.some(
      (link) =>
        link.source === 'dietary_fiber' &&
        link.target === 'gut_microbiome' &&
        link.evidences.length >= 3,
    ),
  );
  const bookIds = new Set(
    data.links.filter((link) => link.source_file !== 'literature').map((link) => link.source_id),
  );
  assert.deepEqual(
    [...bookIds].sort(),
    ['amazing_veggie_soup', 'china_study', 'eat_to_heal', 'gut_brain', 'how_not_to_die', 'know_your_gut'],
  );

  const deepReader = data.links.filter((link) => link.audience === 'deep_reader');
  assert.ok(deepReader.some((link) => link.id === 'lit_microbiome_colon_okeefe_2016'));
  assert.ok(
    deepReader.some((link) => link.source === 'dietary_fiber' && link.target === 'gut_microbiome'),
  );
  assert.equal(deepReader.length, 2, String(deepReader.map((l) => l.id ?? `${l.source}->${l.target}`)));
  for (const link of data.links) {
    assert.equal(link.mechanism_depth, undefined, link.id ?? link.source);
    const isDeep =
      link.id === 'lit_microbiome_colon_okeefe_2016' ||
      (link.source === 'dietary_fiber' && link.target === 'gut_microbiome');
    if (!isDeep) assert.equal(link.audience, 'general', link.id ?? link.source);
  }
  const mechanisms = data.nodes.filter((node) => node.type === 'mechanism');
  assert.equal(mechanisms.length, 28); // +4 NS-064
  const diseases = data.nodes.filter((node) => node.type === 'disease');
  assert.equal(diseases.length, 18); // +autism_spectrum NS-064
  assert.equal(diseases.filter((node) => node.group === 'protective').length, 8);
  assert.equal(biomarkers.length, 2);
  assert.deepEqual(
    mechanisms
      .filter((node) => node.mechanism_depth === 'technical')
      .map((node) => node.id)
      .sort(),
    [...TECHNICAL_NODES].sort(),
  );
  const SUMMARY_MECHANISMS = new Set(['gut_brain_axis', 'cesarean_birth']); // NS-064 B2
  for (const node of data.nodes) {
    assert.equal(node.audience, undefined, node.id);
    if (node.type === 'mechanism') {
      const expected = TECHNICAL_NODES.includes(node.id)
        ? 'technical'
        : SUMMARY_MECHANISMS.has(node.id)
          ? 'summary'
          : 'mechanism';
      assert.equal(node.mechanism_depth, expected, node.id);
    } else {
      assert.equal(node.mechanism_depth, undefined, node.id);
    }
  }
  const cited = data.links.filter((link) => link.citation);
  assert.equal(cited.filter((link) => link.audience === 'general').length, cited.length - 1);
  assert.ok(data.links.some((link) => link.strength === 'high' && link.audience === 'general'));
});

test('a broken link target fails validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  data.links[0].target = 'does_not_exist';
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /does_not_exist/);
});

test('duplicate node ids fail validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  data.nodes.push({ ...data.nodes[0] });
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /重复/);
});

test('citation edges stay in range and are not book notes', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  const cited = data.links.filter((link) => link.citation);
  const citedEvidences = data.links.flatMap((link) =>
    (link.evidences ?? []).filter((ev) => ev.citation),
  );
  assert.ok(citedEvidences.length >= 5 && citedEvidences.length <= 15, String(citedEvidences.length));
  assert.equal(data.links.length, 158);
  assert.ok(cited.length >= 4 && cited.length <= citedEvidences.length, String(cited.length));
  // Top-level literature types (post-merge) plus nested observational evidences
  const observationalPmids = new Set(
    citedEvidences
      .filter((ev) => ['31401846', '31142457', '31189526'].includes(String(ev.citation?.pmid ?? '')))
      .map((ev) => ev.citation.pmid),
  );
  assert.ok(observationalPmids.size >= 2, String(observationalPmids.size));
  const synthesisOrInterventional = cited.filter(
    (link) => link.evidence_type === 'expert_synthesis' || link.evidence_type === 'interventional',
  );
  assert.ok(synthesisOrInterventional.length >= 2);
  const retracted = '10.1056/NEJMoa1200303';
  for (const link of cited) {
    assert.equal(link.evidence_type.startsWith('book_notes_'), false, link.id);
    assert.equal(link.source_file, 'literature', link.id);
    assert.ok(link.excerpt && link.excerpt.length <= 1200, link.id);
    assert.ok(link.citation.doi || link.citation.pmid, link.id);
    assert.notEqual(link.citation.doi, retracted, link.id);
    assert.equal(String(link.citation.doi).includes('doi.org'), false, link.id);
  }
  for (const ev of citedEvidences) {
    assert.ok(ev.excerpt && ev.excerpt.length <= 1200);
    assert.ok(ev.citation.doi || ev.citation.pmid);
    assert.equal('source_id' in ev && ev.source_id != null, false);
  }
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, true, result.errors.join('\n'));
});

test('a citation without doi or pmid fails validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  const link = data.links.find((item) => item.citation);
  link.citation = { title: 'Missing identifier' };
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /doi|pmid|citation/);
});

test('a book-note edge with citation fails validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  data.links[0].citation = {
    title: 'Should not sit on a book note',
    doi: '10.1136/bmj.l1451',
  };
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /book_notes_/);
});

test('an unknown citation key fails validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  const link = data.links.find((item) => item.citation);
  link.citation.extraNote = 'nope';
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /additional|citation/i);
});

test('schema 0.3 enums are optional and reject values outside the list', () => {
  const schema = readJson(GRAPH_SCHEMA);
  const audience = schema.properties.links.items.properties.audience;
  const depth = schema.properties.nodes.items.properties.mechanism_depth;
  assert.deepEqual(audience.enum, ['general', 'deep_reader']);
  assert.deepEqual(depth.enum, ['summary', 'mechanism', 'technical']);
  assert.equal(schema.properties.links.items.required.includes('audience'), false);
  assert.equal(schema.properties.nodes.items.required.includes('mechanism_depth'), false);
  assert.equal(schema.properties.links.items.additionalProperties, true);
  assert.equal(schema.properties.nodes.items.additionalProperties, true);
});

test('an audience outside general or deep_reader fails validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  data.links[0].audience = 'patient';
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /audience/);
});

test('a mechanism_depth outside the enum fails validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  const node = data.nodes.find((item) => item.type === 'mechanism');
  node.mechanism_depth = 'grade';
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /mechanism_depth/);
});


test('schema 0.7 requires domain enum on nodes and links', () => {
  const schema = readJson(GRAPH_SCHEMA);
  const nodeDomain = schema.properties.nodes.items.properties.domain;
  const linkDomain = schema.properties.links.items.properties.domain;
  assert.deepEqual(nodeDomain.enum, ['health', 'environment', 'culture']);
  assert.deepEqual(linkDomain.enum, ['health', 'environment', 'culture']);
  assert.equal(schema.properties.nodes.items.required.includes('domain'), true);
  assert.equal(schema.properties.links.items.required.includes('domain'), true);
});

test('a missing domain on a node fails validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  delete data.nodes[0].domain;
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /domain|required/i);
});

test('a missing domain on a link fails validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  delete data.links[0].domain;
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /domain|required/i);
});

test('an illegal domain value fails validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  data.nodes[0].domain = 'nutrition';
  data.links[0].domain = 'wellness';
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /domain/);
});

test('omitted audience and mechanism_depth still validate', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  delete data.links[0].audience;
  const node = data.nodes.find((item) => item.type === 'mechanism');
  delete node.mechanism_depth;
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(result.warnings, []);
});

test('technical on a non-mechanism node warns and does not fail', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  const node = data.nodes.find((item) => item.type !== 'mechanism');
  node.mechanism_depth = 'technical';
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.match(result.warnings.join('\n'), /technical/);
  assert.match(result.warnings.join('\n'), new RegExp(node.id));
});

test('aligned seed has no audience or depth warnings', () => {
  const result = validateGraphFile();
  assert.deepEqual(result.warnings, []);
});

test('seed and evidences carry no limitations keys after NS-065', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, true, result.errors.join('\n'));
  for (const link of data.links) {
    assert.equal(Object.prototype.hasOwnProperty.call(link, 'limitations'), false);
    for (const ev of link.evidences) {
      assert.equal(Object.prototype.hasOwnProperty.call(ev, 'limitations'), false);
    }
  }
  assert.equal(JSON.stringify(schema).includes('"limitations"'), false);
});


test('sources.json lists exactly the six cited books', () => {
  const sources = readJson('data/sources.json');
  assert.equal(sources.schema_version, '1.1');
  assert.equal(sources.sources.length, 6);
  const ids = sources.sources.map((row) => row.id).sort();
  assert.deepEqual(ids, [
    'amazing_veggie_soup',
    'china_study',
    'eat_to_heal',
    'gut_brain',
    'how_not_to_die',
    'know_your_gut',
  ]);
  for (const row of sources.sources) {
    assert.ok(row.title && row.authors && row.file);
    assert.equal(typeof row.year, 'number');
    assert.equal(row.type, 'book');
    assert.ok(typeof row.summary === 'string' && row.summary.length >= 40);
    assert.equal(Object.prototype.hasOwnProperty.call(row, 'description'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(row, 'edge_count'), false);
  }
});

test('sources.json rejects residual description or edge_count', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  const sources = readJson('data/sources.json');
  sources.sources[0].description = '旧字段';
  let result = validateGraphData(data, schema, { sourcesPayload: sources });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /description/);

  const sources2 = readJson('data/sources.json');
  sources2.sources[0].edge_count = 7;
  result = validateGraphData(data, schema, { sourcesPayload: sources2 });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /edge_count/);
});

test('missing source_title fails validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  delete data.links[0].source_title;
  delete data.links[0].evidences[0].source_title;
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /source_title/);
});

test('literature edges must not carry source_id', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  const link = data.links.find((item) => item.source_file === 'literature');
  link.source_id = 'china_study';
  link.evidences[0].source_id = 'china_study';
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /source_id/);
});

test('book edges require a known source_id', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  const link = data.links.find((item) => item.source_file !== 'literature');
  link.source_id = 'not_a_book';
  link.evidences[0].source_id = 'not_a_book';
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /source_id|sources/i);
});

test('missing evidences fails validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  delete data.links[0].evidences;
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /evidences/);
});

test('top-level excerpt must mirror evidences[0]', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  data.links[0].excerpt = '镜像被破坏的摘录';
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /镜像/);
});


test('admin_books.json passes catalog invariants', () => {
  const result = validateAdminBooks();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.counts.books, 19);
  assert.equal(result.counts.ingested, 6);
});


test('weread corpora pass A2 map and shape invariants', () => {
  const result = validateWereadCorpora();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.counts.files, 6);
  assert.ok(result.counts.bookmarks >= 100);
});

test('admin_books six ingested books carry locked weread_book_id', () => {
  const admin = readJson('data/admin_books.json');
  assert.equal(admin.schema_version, '1.1');
  const a2 = {
    eat_to_heal: '39484588',
    how_not_to_die: '3300017717',
    gut_brain: '24913511',
    amazing_veggie_soup: '3300084701',
    china_study: '3300047535',
    know_your_gut: '26793466',
  };
  for (const [id, bookId] of Object.entries(a2)) {
    const row = admin.books.find((b) => b.id === id);
    assert.ok(row, id);
    assert.equal(row.weread_book_id, bookId);
  }
  assert.equal(admin.books.filter((b) => b.weread_book_id).length, 6);
});

test('weread mapping_report covers 156 personal outcomes and hard gate', () => {
  const result = validateWereadMappingReport();
  assert.equal(result.ok, true, result.errors?.join('; '));
  assert.ok(!result.skipped, 'mapping_report should exist after NS-061');
  assert.ok(result.counts.attached >= 25);
});
