import type { SourcesData, SourceRecord } from '../types/graph';

export function sourcesDataUrl(): string {
  return `${import.meta.env.BASE_URL}data/sources.json`;
}

export async function loadSources(url: string = sourcesDataUrl()): Promise<SourcesData> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('无法连接来源简介文件');
  }
  if (!response.ok) {
    throw new Error(`来源简介请求失败（${response.status}）`);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('来源简介不是合法 JSON');
  }
  return assertSources(payload);
}

export function assertSources(payload: unknown): SourcesData {
  if (!payload || typeof payload !== 'object') {
    throw new Error('来源简介结构无效');
  }
  const root = payload as Record<string, unknown>;
  if (root.schema_version !== '1.0') {
    throw new Error('来源简介 schema_version 无效');
  }
  if (!Array.isArray(root.sources)) {
    throw new Error('来源简介缺少 sources');
  }
  const sources: SourceRecord[] = root.sources.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`sources[${index}] 无效`);
    }
    const row = item as Record<string, unknown>;
    if (
      typeof row.id !== 'string' ||
      typeof row.title !== 'string' ||
      typeof row.authors !== 'string' ||
      typeof row.year !== 'number' ||
      typeof row.description !== 'string' ||
      typeof row.file !== 'string'
    ) {
      throw new Error(`sources[${index}] 字段不完整`);
    }
    return {
      id: row.id,
      title: row.title,
      authors: row.authors,
      year: row.year,
      description: row.description,
      file: row.file,
    };
  });
  return { schema_version: '1.0', sources };
}

export function sourceById(data: SourcesData | null | undefined, id: string | null | undefined): SourceRecord | null {
  if (!data || !id) return null;
  return data.sources.find((item) => item.id === id) ?? null;
}
