import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { ALIGNED_SEED, GRAPH_SCHEMA, validateGraphData, validateGraphFile } from './validate-data.mjs';

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

test('aligned seed passes schema and referential checks', () => {
  const result = validateGraphFile();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.counts.nodes, 69);
  assert.equal(result.counts.links, 117);
});

test('data 0.4 stays on schema 0.1 and keeps the original book-note excerpts', () => {
  const data = readJson(ALIGNED_SEED);
  assert.equal(data.meta.schema_version, '0.1');
  assert.equal(data.meta.data_version, '0.4');
  assert.equal(data.meta.disclaimer, 'Educational / research use only. Not medical advice.');
  assert.ok(data.nodes.length >= 60 && data.nodes.length <= 90);
  assert.ok(data.links.length >= 80 && data.links.length <= 140);
  assert.equal(data.links.length, ORIGINAL_EXCERPTS.length + 97);
  ORIGINAL_EXCERPTS.forEach((excerpt, index) => {
    assert.equal(data.links[index].excerpt, excerpt);
  });

  const byId = new Map(data.nodes.map((node) => [node.id, node]));
  const degree = new Map();
  for (const link of data.links) {
    degree.set(link.source, (degree.get(link.source) ?? 0) + 1);
    degree.set(link.target, (degree.get(link.target) ?? 0) + 1);
  }
  for (const node of data.nodes) {
    assert.ok((degree.get(node.id) ?? 0) > 0, node.id);
    if (COLUMN[node.type] === 0) {
      assert.ok(node.description && node.aliases?.length, node.id);
    }
    if (node.type === 'mechanism' && (degree.get(node.id) ?? 0) >= 3) {
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
  for (const link of data.links.slice(ORIGINAL_EXCERPTS.length)) {
    assert.equal(link.evidence_type.startsWith('book_notes_'), true, link.note_id);
    assert.notEqual(link.note_id, 'related');
    assert.notEqual(link.note_id, 'multiple');
    assert.equal(link.evidence_type.includes('interventional'), false);
  }
  const biomarkers = data.nodes.filter((node) => node.type === 'biomarker');
  assert.ok(biomarkers.length >= 1 && biomarkers.length <= 3);
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

test('missing limitations fail validation', () => {
  const data = readJson(ALIGNED_SEED);
  const schema = readJson(GRAPH_SCHEMA);
  delete data.links[1].limitations;
  const result = validateGraphData(data, schema);
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /limitations/);
});
