import { assertGraph } from './assertGraph';
import type { GraphData } from '../types/graph';

export function graphDataUrl(): string {
  return `${import.meta.env.BASE_URL}data/seed_triples_v0.3_aligned.json`;
}

export async function loadGraph(url: string = graphDataUrl()): Promise<GraphData> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('无法连接数据文件');
  }
  if (!response.ok) {
    throw new Error(`数据请求失败（${response.status}）`);
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('数据不是合法 JSON');
  }
  return assertGraph(payload);
}
