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

const THIN_SOURCE_IDS = new Set([
  'know_your_gut',
]);

const PROMOTE_GUT_BRAIN_IDS = ['gut_brain_02_coffee_poly', 'gut_brain_08_ferment_micro'];
const PROMOTE_LIT_IDS = [
  'lit_fiber_gi_gill_2021',
  'lit_prebiotic_sanders_2019',
  'lit_plant_mortality_baden_2019',
  'lit_redmeat_mortality_zheng_2019',
];
const PROMOTE_DOIS = [
  '10.1038/s41575-020-00375-4',
  '10.1038/s41575-019-0173-3',
  '10.1161/CIRCULATIONAHA.119.041014',
  '10.1136/bmj.l2110',
];

test('aligned seed passes schema and referential checks', () => {
  const result = validateGraphFile();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.counts.nodes, 173);
  assert.equal(result.counts.links, 591);
});

const TECHNICAL_NODES = ['igf1_signaling', 'lps'];

test('data 2.3 uses schema 0.7; NS-075 you_are_what_you_eat ingest; NS-072 no parallels; keeps books+lit', () => {
  const data = readJson(ALIGNED_SEED);
  assert.equal(data.meta.schema_version, '0.7');
  assert.equal(data.meta.data_version, '2.3');
  assert.equal(data.meta.disclaimer, 'Educational / research use only. Not medical advice.');
  assert.equal(data.nodes.length, 173);
  assert.equal(data.links.length, 591);
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
  const bookRel = /书中|本书|该书写道|作者认为|引述.+叙述|概述.+叙述/;
  for (const link of data.links) {
    assert.equal(bookRel.test(link.relation || ''), false, link.id ?? `${link.source}->${link.target}`);
  }
  assert.ok(data.meta.note.includes('NS-072'));
  assert.ok(data.meta.note.includes('NS-071'));
  assert.ok(data.meta.note.includes('NS-074'));
  assert.ok(data.meta.note.includes('NS-075'));
  assert.ok(data.nodes.length >= 170 && data.nodes.length <= 180);
  assert.ok(data.links.length >= 580 && data.links.length <= 610);

  const thinLeft = data.links.filter((link) => THIN_SOURCE_IDS.has(link.source_id));
  assert.equal(thinLeft.length, 0);
  const eatToHeal = data.links.filter((link) => link.source_id === 'eat_to_heal');
  assert.equal(eatToHeal.length, 79);
  const avs = data.links.filter((link) => link.source_id === 'amazing_veggie_soup');
  assert.equal(avs.length, 66);
  const hntd = data.links.filter((link) => link.source_id === 'how_not_to_die');
  assert.equal(hntd.length, 118);
  const chinaStudy = data.links.filter((link) => link.source_id === 'china_study');
  assert.equal(chinaStudy.length, 123);
  const yawye = data.links.filter((link) => link.source_id === 'you_are_what_you_eat');
  assert.equal(yawye.length, 143);
  const gutBrain = data.links.filter((link) => link.source_id === 'gut_brain');
  assert.ok(gutBrain.length >= 53, String(gutBrain.length));
  assert.equal(gutBrain.length, 55);
  const lit = data.links.filter((link) => !link.source_id);
  assert.ok(lit.length >= 4, String(lit.length));
  assert.equal(lit.length, 7);
  for (const id of PROMOTE_GUT_BRAIN_IDS) {
    assert.ok(data.links.some((link) => link.id === id), id);
  }
  // NS-072: lit_prebiotic_sanders_2019 collapses into lit_fiber_gi_gill_2021 (same endpoints);
  // other promote lit ids remain top-level hosts.
  for (const id of PROMOTE_LIT_IDS) {
    if (id === 'lit_prebiotic_sanders_2019') {
      assert.ok(
        data.links.some(
          (link) =>
            link.id === id ||
            (link.evidences || []).some(
              (ev) => ev.note_id === '31296969' || ev.citation?.doi === '10.1038/s41575-019-0173-3',
            ),
        ),
        id,
      );
      continue;
    }
    assert.ok(data.links.some((link) => link.id === id), id);
  }
  // NS-072: no parallel same-endpoint edges
  const pairCount = new Map();
  for (const link of data.links) {
    const key = `${link.source}\0${link.target}`;
    pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
  }
  for (const [key, n] of pairCount) {
    assert.equal(n, 1, key);
  }
  const chd = data.links.filter(
    (link) => link.source === 'plant_based_diet' && link.target === 'coronary_heart_disease',
  );
  assert.equal(chd.length, 1);
  assert.ok(chd[0].evidences.length >= 6, String(chd[0].evidences.length));
  const blob = JSON.stringify(data.links);
  for (const doi of PROMOTE_DOIS) {
    assert.ok(blob.includes(doi), doi);
  }
  const wereadEv = data.links.reduce(
    (n, link) => n + (link.evidences || []).filter((ev) => ev.weread_bookmark_id).length,
    0,
  );
  assert.equal(wereadEv, 0);

  const byId = new Map(data.nodes.map((node) => [node.id, node]));
  const degree = new Map();
  for (const link of data.links) {
    degree.set(link.source, (degree.get(link.source) ?? 0) + 1);
    degree.set(link.target, (degree.get(link.target) ?? 0) + 1);
  }
  for (const node of data.nodes) {
    const deg = degree.get(node.id) ?? 0;
    // NS-066 B2+D: degree-0 empty nodes are retained on purpose after thin-book purge.
    if (deg === 0) {
      assert.ok(node.description || node.label, node.id);
      continue;
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
  const biomarkers = data.nodes.filter((node) => node.type === 'biomarker');
  assert.ok(biomarkers.length >= 1 && biomarkers.length <= 8);

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
  const bookIds = new Set(
    data.links.filter((link) => link.source_file !== 'literature').map((link) => link.source_id),
  );
  assert.deepEqual([...bookIds].sort(), ['amazing_veggie_soup', 'china_study', 'eat_to_heal', 'gut_brain', 'how_not_to_die', 'you_are_what_you_eat']);

  const deepReader = data.links.filter((link) => link.audience === 'deep_reader');
  assert.ok(deepReader.some((link) => link.id === 'lit_microbiome_colon_okeefe_2016'));
  assert.ok(
    deepReader.some((link) => link.source === 'dietary_fiber' && link.target === 'gut_microbiome'),
  );
  assert.ok(deepReader.length >= 2, String(deepReader.map((l) => l.id ?? `${l.source}->${l.target}`)));
  for (const link of data.links) {
    assert.equal(link.mechanism_depth, undefined, link.id ?? link.source);
    const isDeep =
      link.id === 'lit_microbiome_colon_okeefe_2016' ||
      (link.source === 'dietary_fiber' && link.target === 'gut_microbiome');
    if (!isDeep) assert.equal(link.audience, 'general', link.id ?? link.source);
  }
  const mechanisms = data.nodes.filter((node) => node.type === 'mechanism');
  assert.equal(mechanisms.length, 41);
  const diseases = data.nodes.filter((node) => node.type === 'disease');
  assert.equal(diseases.length, 45);
  assert.equal(diseases.filter((node) => node.group === 'protective').length, 8);
  assert.equal(biomarkers.length, 5);
  assert.deepEqual(
    mechanisms
      .filter((node) => node.mechanism_depth === 'technical')
      .map((node) => node.id)
      .sort(),
    [...TECHNICAL_NODES].sort(),
  );
  const SUMMARY_MECHANISMS = new Set(['gut_brain_axis', 'cesarean_birth']);
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
  assert.equal(cited.filter((link) => link.audience === 'general').length, cited.length - deepReader.filter((l) => l.citation).length);
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
  assert.ok(citedEvidences.length >= 5 && citedEvidences.length <= 20, String(citedEvidences.length));
  assert.equal(data.links.length, 591);
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
  const bookNote = data.links.find((item) => item.evidence_type?.startsWith('book_notes_'));
  assert.ok(bookNote);
  bookNote.citation = {
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


test('sources.json lists exactly the seven cited books', () => {
  const sources = readJson('data/sources.json');
  assert.equal(sources.schema_version, '1.1');
  assert.equal(sources.sources.length, 7);
  const ids = sources.sources.map((row) => row.id).sort();
  assert.deepEqual(ids, [
    'amazing_veggie_soup',
    'china_study',
    'eat_to_heal',
    'gut_brain',
    'how_not_to_die',
    'know_your_gut',
    'you_are_what_you_eat',
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


test('admin_books.json passes catalog invariants after NS-075', () => {
  const result = validateAdminBooks();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.counts.books, 19);
  assert.equal(result.counts.ingested, 6);
  const admin = readJson('data/admin_books.json');
  assert.equal(admin.schema_version, '1.2');
  for (const row of admin.books) {
    assert.equal(Object.prototype.hasOwnProperty.call(row, 'note_count'), false, row.id);
    assert.equal(Object.prototype.hasOwnProperty.call(row, 'weread_book_id'), false, row.id);
  }
  const gut = admin.books.find((b) => b.id === 'gut_brain');
  assert.equal(gut.status, 'ingested');
  assert.equal(gut.source_id, 'gut_brain');
  const eth = admin.books.find((b) => b.id === 'eat_to_heal');
  assert.equal(eth.status, 'ingested');
  assert.equal(eth.source_id, 'eat_to_heal');
  const avsBook = admin.books.find((b) => b.id === 'amazing_veggie_soup');
  assert.equal(avsBook.status, 'ingested');
  assert.equal(avsBook.source_id, 'amazing_veggie_soup');
  const hntdBook = admin.books.find((b) => b.id === 'how_not_to_die');
  assert.equal(hntdBook.status, 'ingested');
  assert.equal(hntdBook.source_id, 'how_not_to_die');
  const csBook = admin.books.find((b) => b.id === 'china_study');
  assert.equal(csBook.status, 'ingested');
  assert.equal(csBook.source_id, 'china_study');
  const yawyeBook = admin.books.find((b) => b.id === 'you_are_what_you_eat');
  assert.equal(yawyeBook.status, 'ingested');
  assert.equal(yawyeBook.source_id, 'you_are_what_you_eat');
  for (const id of THIN_SOURCE_IDS) {
    const row = admin.books.find((b) => b.id === id);
    assert.ok(row, id);
    assert.equal(row.status, 'index_only');
    assert.equal(row.source_id, undefined);
  }
});

test('weread corpora gate is skipped after NS-066 deprecation', () => {
  const result = validateWereadCorpora();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.skipped, true);
  assert.equal(result.counts.files, 0);
});

test('weread mapping_report is absent and skipped after NS-066', () => {
  const result = validateWereadMappingReport();
  assert.equal(result.ok, true, result.errors?.join('; '));
  assert.equal(result.skipped, true);
});
