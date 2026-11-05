import type { WereadCorpus } from '../types/graph.ts';

const ID = /^[a-z0-9_]+$/;
const BOOK_ID = /^[0-9]+$/;

/** Locked A2 ids — keep in sync with scripts/weread-book-map.mjs. */
export const WEREAD_SOURCE_IDS = [
  'eat_to_heal',
  'how_not_to_die',
  'gut_brain',
  'amazing_veggie_soup',
  'china_study',
  'know_your_gut',
] as const;

export type WereadSourceId = (typeof WEREAD_SOURCE_IDS)[number];

export function wereadCorpusUrl(sourceId: string): string {
  return `${import.meta.env.BASE_URL}data/weread/${sourceId}.json`;
}

export async function loadWereadCorpus(sourceId: string): Promise<WereadCorpus> {
  if (!ID.test(sourceId)) {
    throw new Error('微信划线语料 id 非法');
  }
  let response: Response;
  try {
    response = await fetch(wereadCorpusUrl(sourceId));
  } catch {
    throw new Error('无法连接微信划线语料');
  }
  if (!response.ok) {
    throw new Error(`微信划线语料请求失败（${response.status}）`);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('微信划线语料不是合法 JSON');
  }
  return assertWereadCorpus(payload, sourceId);
}

export async function loadAllWereadCorpora(): Promise<Map<string, WereadCorpus>> {
  const entries = await Promise.all(
    WEREAD_SOURCE_IDS.map(async (id) => {
      try {
        const corpus = await loadWereadCorpus(id);
        return [id, corpus] as const;
      } catch {
        return null;
      }
    }),
  );
  const map = new Map<string, WereadCorpus>();
  for (const entry of entries) {
    if (entry) map.set(entry[0], entry[1]);
  }
  return map;
}

export function assertWereadCorpus(payload: unknown, expectedSourceId?: string): WereadCorpus {
  if (!payload || typeof payload !== 'object') {
    throw new Error('微信划线语料结构无效');
  }
  const root = payload as Record<string, unknown>;
  if (root.schema_version !== '1.0') {
    throw new Error('微信划线语料 schema_version 无效');
  }
  if (typeof root.source_id !== 'string' || !ID.test(root.source_id)) {
    throw new Error('微信划线语料 source_id 非法');
  }
  if (expectedSourceId && root.source_id !== expectedSourceId) {
    throw new Error('微信划线语料 source_id 与文件名不一致');
  }
  if (typeof root.bookId !== 'string' || !BOOK_ID.test(root.bookId)) {
    throw new Error('微信划线语料 bookId 非法');
  }
  if (typeof root.title_weread !== 'string' || !root.title_weread.trim()) {
    throw new Error('微信划线语料缺少 title_weread');
  }
  if (typeof root.synced_at !== 'string' || !root.synced_at.trim()) {
    throw new Error('微信划线语料缺少 synced_at');
  }
  if (!root.meta || typeof root.meta !== 'object' || Array.isArray(root.meta)) {
    throw new Error('微信划线语料缺少 meta');
  }
  if (!Array.isArray(root.bookmarks)) {
    throw new Error('微信划线语料缺少 bookmarks');
  }
  if ('review' in root || 'reviews' in root || 'ideas' in root) {
    throw new Error('微信划线语料不得含 review/ideas');
  }
  const best = root.bestbookmarks;
  if (!best || typeof best !== 'object' || Array.isArray(best)) {
    throw new Error('微信划线语料缺少 bestbookmarks');
  }
  const bestObj = best as Record<string, unknown>;
  if (typeof bestObj.totalCount !== 'number' || !Array.isArray(bestObj.items)) {
    throw new Error('微信划线语料 bestbookmarks 形状无效');
  }
  const stats = root.stats;
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
    throw new Error('微信划线语料缺少 stats');
  }
  const statsObj = stats as Record<string, unknown>;
  if (typeof statsObj.bookmark_count !== 'number' || typeof statsObj.bestbookmark_item_count !== 'number') {
    throw new Error('微信划线语料 stats 形状无效');
  }
  if (statsObj.bookmark_count !== root.bookmarks.length) {
    throw new Error('微信划线语料 stats.bookmark_count 与 bookmarks.length 不一致');
  }
  if (statsObj.bestbookmark_item_count !== bestObj.items.length) {
    throw new Error('微信划线语料 stats.bestbookmark_item_count 与 items.length 不一致');
  }

  const bookmarks = root.bookmarks.map((item, index) => {
    if (!item || typeof item !== 'object') throw new Error(`bookmarks[${index}] 无效`);
    const row = item as Record<string, unknown>;
    if (typeof row.bookmarkId !== 'string' || typeof row.markText !== 'string') {
      throw new Error(`bookmarks[${index}] 字段不完整`);
    }
    return {
      bookmarkId: row.bookmarkId,
      chapterUid: typeof row.chapterUid === 'number' ? row.chapterUid : 0,
      chapterIdx: typeof row.chapterIdx === 'number' ? row.chapterIdx : undefined,
      chapterTitle: typeof row.chapterTitle === 'string' ? row.chapterTitle : undefined,
      range: typeof row.range === 'string' ? row.range : '',
      markText: row.markText,
      createTime: typeof row.createTime === 'number' ? row.createTime : 0,
      colorStyle: typeof row.colorStyle === 'number' ? row.colorStyle : undefined,
      type: typeof row.type === 'number' ? row.type : undefined,
    };
  });

  const items = bestObj.items.map((item, index) => {
    if (!item || typeof item !== 'object') throw new Error(`bestbookmarks.items[${index}] 无效`);
    const row = item as Record<string, unknown>;
    if (typeof row.bookmarkId !== 'string' || typeof row.markText !== 'string') {
      throw new Error(`bestbookmarks.items[${index}] 字段不完整`);
    }
    return {
      bookmarkId: row.bookmarkId,
      chapterUid: typeof row.chapterUid === 'number' ? row.chapterUid : 0,
      range: typeof row.range === 'string' ? row.range : '',
      markText: row.markText,
      totalCount: typeof row.totalCount === 'number' ? row.totalCount : undefined,
    };
  });

  return {
    schema_version: '1.0',
    source_id: root.source_id,
    bookId: root.bookId,
    title_weread: root.title_weread,
    synced_at: root.synced_at,
    meta: root.meta as Record<string, unknown>,
    bookmarks,
    bestbookmarks: {
      totalCount: bestObj.totalCount as number,
      items,
    },
    stats: {
      bookmark_count: statsObj.bookmark_count as number,
      bestbookmark_item_count: statsObj.bestbookmark_item_count as number,
    },
  };
}

export function truncateMarkText(text: string, max = 120): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function formatSyncedAt(iso: string): string {
  // Display Asia/Shanghai wall time to the minute when parseable.
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
