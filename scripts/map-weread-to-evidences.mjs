/**
 * TASK-NS-061 · Map WeRead highlights → existing same-book link evidences[]
 *
 * Reproducible. Does NOT call WeRead API. Does NOT create nodes/links.
 * Does NOT rewrite data/weread/<id>.json corpus bodies.
 *
 * Usage:
 *   node scripts/map-weread-to-evidences.mjs
 *   node scripts/map-weread-to-evidences.mjs --dry-run
 *
 * Scoring (documented · C2):
 * 1. Candidate edges = links with matching source_id
 * 2. Tokenize endpoint label + aliases (+ documented NODE_SYNONYMS); tokens length ≥ 2
 * 3. Score: +2 source-end (≥1 non-generic token); +2 target-end; +1 relation KEY hit
 * 4. Auto-write if score ≥ 3 AND (both ends ≥1 non-generic OR one end ≥2 non-generic
 *    non-hub-only). Ties: highest score, then more char overlap with evidences[0].excerpt;
 *    still tie → needs_review (no seed write).
 * 5. Dedup by weread_bookmark_id or normalized excerpt; best skips if duplicates personal
 * 6. Append by default; promote[0] only if evidences[0].excerpt.length < 200
 *
 * Generic-alone hits never count as endpoint hits (C2 stopwords).
 */

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WEREAD_SOURCE_IDS } from './weread-book-map.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCERPT_LIMIT = 1200;
const SCRIPT_VERSION = '1.0.0';
const DRY = process.argv.includes('--dry-run');

const GENERIC = new Set([
  '食物', '健康', '饮食', '营养', '人体', '身体', '疾病', '风险', '作用', '功能',
  '相关', '影响', '过程', '水平', '反应', '系统', '细胞', '组织', '器官', '代谢',
  '炎症', '免疫', '肠道', '细菌', '菌群', '纤维', '蛋白', '蛋白质', '脂肪', '糖',
  '维生素', '抗氧化', '慢性', '长期', '研究', '表明', '可以', '能够', '产生', '提供',
  '参与', '支持', '改善', '降低', '增加', '预防', '治疗', '建议', '运动', '睡眠',
  '整体', '危险', '危险性', '状态', '异常', '问题', '叙述', '书摘', '模式', '活动',
  '物质', '能力', '植物', '保护', '外部', '内部', '环境', '变化', '方向',
]);

/** Hub mechanism/disease nodes: oneStrong-only matches on these are not auto-written. */
const HUB_NODE_IDS = new Set([
  'epigenetic_positive',
  'chronic_inflammation',
  'reactive_oxygen',
  'cardiometabolic',
  'oxidative_stress',
  'immune_activation',
  'immune_balance',
  'dna_damage',
  'angiogenesis_defense',
  'mental_health',
]);

/**
 * Documented synonym expansions (equivalents of label/aliases for matching).
 * Kept conservative to avoid wrong attaches.
 */
const NODE_SYNONYMS = Object.freeze({
  gut_microbiome: ['肠道微生物', '微生物组', '微生物', '益生菌', '有益菌', '肠道菌'],
  gut_barrier_leak: ['肠漏', '肠道屏障', '肠屏障', '肠黏膜', '肠道黏膜', '通透性', '肠通透性', '肠道通透性'],
  mental_health: ['大脑', '心理', '情绪', '抑郁', '行为', '脑健康', '心理健康'],
  chronic_inflammation: ['慢性炎症', '低度炎症'],
  ibd_related: ['肠道炎症', '炎症性肠病', '肠炎', 'IBD'],
  plant_based_diet: ['植物性食物', '植物性饮食', '蔬食', '素食', '全食物', '天然蔬食', '植物性膳食'],
  dietary_fiber: ['膳食纤维', '纤维素', '益生元'],
  whole_grains: ['全谷物', '全谷', '糙米', '燕麦'],
  red_meat: ['红肉', '肉类', '肉品'],
  processed_meat: ['加工肉', '火腿', '香肠'],
  cardiometabolic: ['心脏病', '心血管', '冠心病', '冠状动脉', '心血管疾病'],
  dairy: ['乳制品', '牛奶', '乳品'],
  animal_foods: ['动物性食物', '肉蛋奶', '动物蛋白'],
  insulin_resistance: ['胰岛素抵抗', '胰岛素'],
  obesity_risk: ['肥胖', '肥胖症'],
  reactive_oxygen: ['活性氧', '自由基', '氧化应激'],
  glutathione: ['谷胱甘肽', 'GSH'],
  vegetables_greens: ['绿叶菜', '菠菜', '芹菜', '黄绿色蔬菜', '卷心菜', '白菜', '黄绿蔬菜'],
  carotenoids: ['类胡萝卜素', '胡萝卜素'],
  glycation: ['糖化', '糖化反应'],
  fermented_foods: ['发酵食物', '发酵食品', '泡菜', '味噌'],
  legumes: ['豆类', '扁豆', '鹰嘴豆'],
  resistant_starch: ['抗性淀粉'],
  refined_carbs: ['精制主食', '白米饭'],
  omega3: ['omega-3', 'ω-3', '多不饱和脂肪酸'],
  polyphenols: ['多酚', '茶多酚'],
  heme_iron: ['血红素铁', '血红素'],
  tmao: ['TMAO', '氧化三甲胺'],
  dna_damage: ['DNA损伤'],
  digestive_cancer_risk: ['肠癌', '胃癌'],
  breast_prostate_risk: ['乳腺癌', '前列腺癌'],
  fatty_liver: ['脂肪肝'],
  liver_chronic: ['慢性肝炎', '肝癌'],
  igf1_signaling: ['IGF-1', 'IGF1', '生长因子'],
  ultra_processed: ['超加工', '高度精制'],
  added_sugar: ['添加糖', '含糖饮料'],
  berries_fruits: ['浆果', '番茄', '核果'],
  nuts_seeds: ['坚果', '核桃'],
  cruciferous: ['十字花科', '西兰花', '甘蓝'],
  flax_chia: ['亚麻籽', '奇亚籽'],
  herbs_spices: ['香料', '香草'],
  vitamin_c: ['维生素C'],
  vitamin_e: ['维生素E'],
  crp: ['C反应蛋白', 'CRP'],
  hba1c: ['糖化血红蛋白', 'HbA1c'],
  scfa: ['短链脂肪酸', 'SCFA', '丁酸'],
  lps: ['脂多糖', 'LPS'],
  mitochondrial_stress: ['线粒体'],
  angiogenesis_defense: ['抗血管生成', '血管生成'],
  epigenetic_positive: ['表观遗传'],
  immune_activation: ['免疫激活', '炎症反应', '免疫系统'],
  immune_balance: ['免疫平衡', '免疫调节', '免疫系统', '脑功能'],
  mushrooms: ['蘑菇', '白蘑菇'],
  beta_glucan: ['β-葡聚糖', '葡聚糖', 'beta-glucan'],
  soy: ['大豆', '大豆食品', '豆腐'],
  isoflavones: ['异黄酮'],
  sulforaphane: ['萝卜硫素'],
  coffee: ['咖啡'],
  tea: ['茶', '绿茶'],
  anthocyanins: ['花青素'],
  egcg: ['EGCG', '茶多酚'],
});

const RELATION_KEYS = [
  '抗氧化', '抗炎', '抗血管生成', '短链脂肪酸', '膳食纤维', '益生元', '脂多糖', '肠漏',
  '胰岛素', '线粒体', '表观遗传', '菌群', '屏障', 'IGF-1', 'TMAO', 'LPS', 'SCFA', 'DNA',
  '多酚', '花青素', '异黄酮', '谷胱甘肽', '萝卜硫素', '血红素', '酪蛋白', '乳品', '红肉',
  '加工肉', '植物性', '动物性', '心血管', '结肠', '乳腺', '前列腺', '肝脏', '自身免疫',
  '情绪', '心理', '通透', '发酵', '肥胖', '糖尿病', '心脏病', '活性氧', '自由基', '糖化',
  '素食', '蔬食',
];

export function truncateAtSentence(text, limit = EXCERPT_LIMIT) {
  if (text.length <= limit) return text;
  const window = text.slice(0, limit);
  let best = -1;
  for (const punct of ['。', '？', '！', '；', '.', '?', '!', ';']) {
    const pos = window.lastIndexOf(punct);
    if (pos > best) best = pos;
  }
  if (best >= Math.floor(limit * 0.5)) return text.slice(0, best + 1);
  return window;
}

export function normalizeExcerpt(text) {
  return String(text || '')
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .toLowerCase();
}

export function tokenizeNode(node) {
  if (!node) return [];
  const raw = [];
  if (node.label) raw.push(node.label);
  for (const a of node.aliases || []) raw.push(a);
  for (const s of NODE_SYNONYMS[node.id] || []) raw.push(s);
  const tokens = new Set();
  for (const piece of raw) {
    for (const part of String(piece).split(/[\/／、,，;；|｜\s（）()【】\[\]·•+\-—_]+/)) {
      const t = part.trim();
      if (t.length >= 2 && t.length <= 24) tokens.add(t);
      for (const w of t.match(/[A-Za-z][A-Za-z0-9\-]{1,}/g) || []) {
        if (w.length >= 2) tokens.add(w);
      }
    }
  }
  return [...tokens].filter((t) => t.length >= 2);
}

export function tokenizeRelation(rel) {
  const tokens = new Set();
  const text = String(rel || '');
  for (const k of RELATION_KEYS) {
    if (text.includes(k) && !GENERIC.has(k)) tokens.add(k);
  }
  return [...tokens];
}

export function charOverlapRatio(a, b) {
  const A = new Set([...a]);
  let n = 0;
  for (const ch of b) if (A.has(ch)) n += 1;
  return n / Math.max(a.length, b.length, 1);
}

/**
 * Score one bookmark text against one link.
 * @returns {{ score: number, pass: boolean, srcHits: string[], tgtHits: string[], relHits: string[], bothEnds: boolean, oneStrong: boolean }}
 */
export function scoreCandidate(T, link, nodesById) {
  const srcNode = nodesById.get(link.source);
  const tgtNode = nodesById.get(link.target);
  const srcHits = tokenizeNode(srcNode).filter((t) => T.includes(t));
  const tgtHits = tokenizeNode(tgtNode).filter((t) => T.includes(t));
  const relHits = tokenizeRelation(link.relation).filter((t) => T.includes(t));
  const srcNonGen = srcHits.filter((t) => !GENERIC.has(t));
  const tgtNonGen = tgtHits.filter((t) => !GENERIC.has(t));
  const srcOk = srcNonGen.length >= 1;
  const tgtOk = tgtNonGen.length >= 1;
  let score = 0;
  if (srcOk) score += 2;
  if (tgtOk) score += 2;
  if (relHits.length >= 1) score += 1;
  const bothEnds = srcOk && tgtOk;
  const oneStrong = srcNonGen.length >= 2 || tgtNonGen.length >= 2;
  // Prefer bothEnds. oneStrong-only only for LPS/barrier source mechanisms when
  // the other end is not a disease hub missing hits (reduces AD→IBD style misses).
  const MECHANISM_ONE_STRONG_OK = new Set(['lps', 'gut_barrier_leak']);
  let oneStrongOk = false;
  if (!bothEnds && oneStrong) {
    const strongIsSrc = srcNonGen.length >= 2;
    const strongId = strongIsSrc ? link.source : link.target;
    const otherId = strongIsSrc ? link.target : link.source;
    const otherNode = strongIsSrc ? tgtNode : srcNode;
    if (
      MECHANISM_ONE_STRONG_OK.has(strongId) &&
      !HUB_NODE_IDS.has(strongId) &&
      otherNode?.type !== 'disease'
    ) {
      oneStrongOk = true;
    }
  }
  const pass = score >= 3 && (bothEnds || oneStrongOk);
  return {
    score,
    pass,
    srcHits: srcNonGen,
    tgtHits: tgtNonGen,
    relHits,
    bothEnds,
    oneStrong,
    oneStrongOk,
  };
}

/**
 * Pick best edge among same-book candidates; null if skip/needs_review.
 */
export function pickBestEdge(T, links, nodesById) {
  const scored = links.map((link) => ({ link, ...scoreCandidate(T, link, nodesById) }));
  const ok = scored
    .filter((s) => s.pass)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const oa = charOverlapRatio(a.link.evidences?.[0]?.excerpt || '', T);
      const ob = charOverlapRatio(b.link.evidences?.[0]?.excerpt || '', T);
      return ob - oa;
    });
  if (ok.length === 0) {
    return { status: 'skipped', reason: 'low_score', scored };
  }
  if (ok.length >= 2 && ok[0].score === ok[1].score) {
    const o0 = charOverlapRatio(ok[0].link.evidences?.[0]?.excerpt || '', T);
    const o1 = charOverlapRatio(ok[1].link.evidences?.[0]?.excerpt || '', T);
    if (Math.abs(o0 - o1) < 1e-12) {
      return { status: 'needs_review', reason: 'tie', candidates: ok.slice(0, 3), scored };
    }
  }
  return { status: 'attach', best: ok[0], scored };
}

function bestBookmarkId(item, sourceId) {
  if (item.bookmarkId) return `best:${item.bookmarkId}`;
  const h = createHash('sha1').update(`${sourceId}|${item.markText || ''}`).digest('hex').slice(0, 12);
  return `best:${h}`;
}

function buildEvidence({ markText, sourceId, sourceTitle, origin, bookmarkId, chapterTitle }) {
  const excerpt = truncateAtSentence(String(markText || '').trim(), EXCERPT_LIMIT);
  /** @type {Record<string, unknown>} */
  const ev = {
    excerpt,
    source_title: sourceTitle,
    source_file: `weread/${sourceId}.json`,
    source_id: sourceId,
    weread_bookmark_id: bookmarkId,
    weread_origin: origin,
  };
  if (chapterTitle) ev.weread_chapter_title = chapterTitle;
  return ev;
}

function linkKey(link) {
  return `${link.source}→${link.target}·${link.relation}`;
}

export function mapWereadToEvidences({ seed, sources, corpora, dryRun = false }) {
  const nodesById = new Map(seed.nodes.map((n) => [n.id, n]));
  const titleById = new Map((sources.sources || []).map((s) => [s.id, s.title]));
  const attached = [];
  const skipped = [];
  const needs_review = [];
  const perBook = {};

  /** Track personal normalized excerpts already attached (any edge) for best dedup. */
  const personalNormAttached = new Set();
  /** weread_bookmark_id already on any evidence in seed (pre-existing + new). */
  const existingBmIds = new Set();
  const existingNormByLink = new Map();

  for (const link of seed.links) {
    const norms = new Set();
    for (const ev of link.evidences || []) {
      if (ev.weread_bookmark_id) existingBmIds.add(String(ev.weread_bookmark_id));
      if (ev.excerpt) norms.add(normalizeExcerpt(ev.excerpt));
    }
    existingNormByLink.set(linkKey(link), norms);
  }

  for (const sourceId of WEREAD_SOURCE_IDS) {
    const corpus = corpora[sourceId];
    perBook[sourceId] = {
      personal_bookmarks: corpus?.bookmarks?.length ?? 0,
      best_items: corpus?.bestbookmarks?.items?.length ?? 0,
      attached: 0,
      attached_personal: 0,
      attached_best: 0,
      promote0: 0,
      skipped: 0,
      needs_review: 0,
    };
    if (!corpus) {
      skipped.push({ source_id: sourceId, reason: 'missing_corpus' });
      perBook[sourceId].skipped += 1;
      continue;
    }
    const bookLinks = seed.links.filter((l) => l.source_id === sourceId);
    const sourceTitle = titleById.get(sourceId) || corpus.title_weread || sourceId;
    const queue = [
      ...(corpus.bookmarks || []).map((b) => ({
        markText: b.markText,
        bookmarkId: b.bookmarkId,
        chapterTitle: b.chapterTitle,
        origin: 'personal',
      })),
      ...((corpus.bestbookmarks && corpus.bestbookmarks.items) || []).map((b) => ({
        markText: b.markText,
        bookmarkId: bestBookmarkId(b, sourceId),
        chapterTitle: b.chapterTitle,
        origin: 'best',
      })),
    ];

    for (const cand of queue) {
      const T = String(cand.markText || '').trim();
      const baseMeta = {
        source_id: sourceId,
        weread_bookmark_id: cand.bookmarkId || null,
        weread_origin: cand.origin,
        excerpt_preview: T.slice(0, 80),
      };

      if (!T) {
        skipped.push({ ...baseMeta, reason: 'empty_text' });
        perBook[sourceId].skipped += 1;
        continue;
      }
      if (bookLinks.length === 0) {
        skipped.push({ ...baseMeta, reason: 'no_same_book_edge' });
        perBook[sourceId].skipped += 1;
        continue;
      }

      const bmId = cand.bookmarkId || bestBookmarkId(cand, sourceId);
      if (existingBmIds.has(bmId)) {
        skipped.push({ ...baseMeta, weread_bookmark_id: bmId, reason: 'duplicate_bookmark_id' });
        perBook[sourceId].skipped += 1;
        continue;
      }

      const norm = normalizeExcerpt(T);
      if (cand.origin === 'best' && personalNormAttached.has(norm)) {
        skipped.push({ ...baseMeta, weread_bookmark_id: bmId, reason: 'duplicate_personal_text' });
        perBook[sourceId].skipped += 1;
        continue;
      }
      // also skip if any personal bookmark text equals this (even if not yet attached) — for best vs personal corpus
      if (cand.origin === 'best') {
        const personalDup = (corpus.bookmarks || []).some(
          (p) => normalizeExcerpt(p.markText) === norm ||
            (norm.length > 20 && (
              normalizeExcerpt(p.markText).includes(norm) ||
              norm.includes(normalizeExcerpt(p.markText))
            ) && Math.min(normalizeExcerpt(p.markText).length, norm.length) /
              Math.max(normalizeExcerpt(p.markText).length, norm.length) >= 0.8),
        );
        if (personalDup) {
          skipped.push({ ...baseMeta, weread_bookmark_id: bmId, reason: 'duplicate_personal_corpus' });
          perBook[sourceId].skipped += 1;
          continue;
        }
      }

      const pick = pickBestEdge(T, bookLinks, nodesById);
      if (pick.status === 'skipped') {
        skipped.push({ ...baseMeta, weread_bookmark_id: bmId, reason: pick.reason });
        perBook[sourceId].skipped += 1;
        continue;
      }
      if (pick.status === 'needs_review') {
        needs_review.push({
          ...baseMeta,
          weread_bookmark_id: bmId,
          reason: pick.reason,
          candidates: pick.candidates.map((c) => ({
            link: linkKey(c.link),
            score: c.score,
            srcHits: c.srcHits,
            tgtHits: c.tgtHits,
          })),
        });
        perBook[sourceId].needs_review += 1;
        continue;
      }

      const { best } = pick;
      const link = best.link;
      const norms = existingNormByLink.get(linkKey(link)) || new Set();
      if (norms.has(norm)) {
        skipped.push({ ...baseMeta, weread_bookmark_id: bmId, reason: 'duplicate_excerpt_on_edge', link: linkKey(link) });
        perBook[sourceId].skipped += 1;
        continue;
      }

      const edge0 = link.evidences?.[0];
      const edge0Len = (edge0?.excerpt || '').length;
      const canPromote = edge0Len < 200;
      const op = canPromote ? 'promote0' : 'append';

      const evidence = buildEvidence({
        markText: T,
        sourceId,
        sourceTitle,
        origin: cand.origin,
        bookmarkId: bmId,
        chapterTitle: cand.chapterTitle,
      });

      if (!dryRun) {
        if (!Array.isArray(link.evidences)) link.evidences = [];
        if (op === 'promote0') {
          const old0 = link.evidences[0];
          // Keep old short [0] as subsequent item when it looks like a real excerpt
          if (old0 && old0.excerpt && normalizeExcerpt(old0.excerpt) !== norm) {
            link.evidences = [evidence, old0, ...link.evidences.slice(1)];
          } else {
            link.evidences = [evidence, ...link.evidences.slice(1)];
          }
          link.excerpt = evidence.excerpt;
          link.source_title = evidence.source_title;
          link.source_id = evidence.source_id;
          link.source_file = evidence.source_file;
          if (evidence.note_id) link.note_id = evidence.note_id;
          else delete link.note_id;
        } else {
          link.evidences.push(evidence);
        }
      }

      existingBmIds.add(bmId);
      norms.add(norm);
      existingNormByLink.set(linkKey(link), norms);
      if (cand.origin === 'personal') personalNormAttached.add(norm);

      const row = {
        source_id: sourceId,
        link: linkKey(link),
        link_source: link.source,
        link_target: link.target,
        relation: link.relation,
        weread_bookmark_id: bmId,
        weread_origin: cand.origin,
        operation: op,
        score: best.score,
        srcHits: best.srcHits,
        tgtHits: best.tgtHits,
        relHits: best.relHits,
        old_excerpt0_len: edge0Len,
        excerpt_len: evidence.excerpt.length,
      };
      attached.push(row);
      perBook[sourceId].attached += 1;
      if (cand.origin === 'personal') perBook[sourceId].attached_personal += 1;
      else perBook[sourceId].attached_best += 1;
      if (op === 'promote0') perBook[sourceId].promote0 += 1;
    }
  }

  // Ensure every personal bookmark has an outcome in report (attached/skipped/needs_review)
  const personalOutcomes = {};
  for (const sourceId of WEREAD_SOURCE_IDS) {
    const corpus = corpora[sourceId];
    const outcomes = [];
    for (const b of corpus?.bookmarks || []) {
      const id = b.bookmarkId;
      const hit =
        attached.find((a) => a.weread_bookmark_id === id) ||
        skipped.find((s) => s.weread_bookmark_id === id) ||
        needs_review.find((n) => n.weread_bookmark_id === id);
      outcomes.push({
        bookmarkId: id,
        status: attached.some((a) => a.weread_bookmark_id === id)
          ? 'attached'
          : needs_review.some((n) => n.weread_bookmark_id === id)
            ? 'needs_review'
            : 'skipped',
        reason: hit?.reason || (attached.some((a) => a.weread_bookmark_id === id) ? undefined : hit?.reason),
        link: hit?.link,
        operation: hit?.operation,
      });
    }
    personalOutcomes[sourceId] = outcomes;
  }

  const totalAttached = attached.length;
  const booksWithAttach = WEREAD_SOURCE_IDS.filter((id) => perBook[id].attached > 0).length;
  const hardGate = {
    min_attached: 25,
    min_books: 4,
    attached: totalAttached,
    books_with_attach: booksWithAttach,
    ok: totalAttached >= 25 && booksWithAttach >= 4,
  };

  const report = {
    schema_version: '1.0',
    script_version: SCRIPT_VERSION,
    command: 'node scripts/map-weread-to-evidences.mjs',
    generated_at: new Date().toISOString(),
    scoring: {
      rules: [
        '+2 source-end (≥1 non-generic token from label/aliases/NODE_SYNONYMS)',
        '+2 target-end (≥1 non-generic token)',
        '+1 relation RELATION_KEYS hit',
        'pass if score≥3 AND (bothEnds OR oneStrong); hub oneStrong-only blocked',
        'ties → highest score → char overlap with evidences[0]; still tie → needs_review',
      ],
      generic_stopwords_sample: [...GENERIC].slice(0, 20),
      hub_nodes: [...HUB_NODE_IDS],
    },
    hard_gate: hardGate,
    per_book: perBook,
    attached,
    skipped,
    needs_review,
    personal_bookmark_outcomes: personalOutcomes,
    totals: {
      attached: totalAttached,
      promote0: attached.filter((a) => a.operation === 'promote0').length,
      skipped: skipped.length,
      needs_review: needs_review.length,
      personal_bookmarks: WEREAD_SOURCE_IDS.reduce((n, id) => n + (perBook[id].personal_bookmarks || 0), 0),
    },
  };

  return { seed, report, hardGate };
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function main() {
  const seed = readJson('data/seed_triples_v0.3_aligned.json');
  const sources = readJson('data/sources.json');
  const corpora = {};
  for (const id of WEREAD_SOURCE_IDS) {
    corpora[id] = readJson(`data/weread/${id}.json`);
  }

  // Deep clone seed for mutation safety when dry-run — actually we mutate; for dry-run clone
  const working = DRY ? JSON.parse(JSON.stringify(seed)) : seed;
  const { report, hardGate } = mapWereadToEvidences({
    seed: working,
    sources,
    corpora,
    dryRun: DRY,
  });

  if (!DRY) {
    working.meta = working.meta || {};
    working.meta.data_version = '1.2';
    working.meta.schema_version = '0.5';
    const note = working.meta.note || '';
    if (!note.includes('data 1.2 / NS-061')) {
      working.meta.note =
        `${note} data 1.2 / NS-061：六书微信划线映射进已有边 evidences[]（个人为主、热门去重补充；默认 append；短主摘录可 promote0）；schema 0.5 / sources 1.1 / admin_books 1.1 不动；语料 JSON 正文不改。`.trim();
    }
    fs.writeFileSync(
      path.join(root, 'data/seed_triples_v0.3_aligned.json'),
      `${JSON.stringify(working, null, 2)}\n`,
      'utf8',
    );
  }

  fs.writeFileSync(
    path.join(root, 'data/weread/mapping_report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );

  console.log(
    JSON.stringify(
      {
        dryRun: DRY,
        hardGate,
        totals: report.totals,
        per_book: report.per_book,
      },
      null,
      2,
    ),
  );
  if (!hardGate.ok) {
    console.error('HARD GATE FAILED: need ≥25 attached and ≥4 books with attaches');
    process.exitCode = 2;
  }
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) main();
