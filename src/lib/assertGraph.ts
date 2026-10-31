import type { GraphData, GraphLink, GraphNode } from '../types/graph';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function readNode(value: unknown, index: number): GraphNode {
  if (!isRecord(value)) throw new Error(`节点 ${index} 不是对象`);
  if (!requiredString(value.id) || !requiredString(value.type) || !requiredString(value.label) || !requiredString(value.group)) {
    throw new Error(`节点 ${index} 缺少 id、type、label 或 group`);
  }
  return value as unknown as GraphNode;
}

function readLink(value: unknown, index: number): GraphLink {
  if (!isRecord(value)) throw new Error(`关联 ${index} 不是对象`);
  if (!requiredString(value.source) || !requiredString(value.target) || !requiredString(value.relation) || !requiredString(value.direction) || !requiredString(value.evidence_type)) {
    throw new Error(`关联 ${index} 缺少 source、target、relation、direction 或 evidence_type`);
  }
  return value as unknown as GraphLink;
}

/** Lightweight runtime guard. Broken references abort the view instead of drawing a partial graph. */
export function assertGraph(input: unknown): GraphData {
  if (!isRecord(input)) throw new Error('图谱数据不是对象');
  if (!Array.isArray(input.nodes) || !Array.isArray(input.links)) {
    throw new Error('图谱数据缺少 nodes 或 links');
  }
  if (!isRecord(input.meta)) throw new Error('图谱数据缺少 meta');

  const nodes = input.nodes.map((node, index) => readNode(node, index));
  const ids = new Set<string>();
  for (const node of nodes) {
    if (ids.has(node.id)) throw new Error(`节点 id 重复：${node.id}`);
    ids.add(node.id);
  }

  const links = input.links.map((link, index) => {
    const parsed = readLink(link, index);
    if (!ids.has(parsed.source) || !ids.has(parsed.target)) {
      throw new Error(`关联 ${index} 引用了不存在的节点（${parsed.source} → ${parsed.target}）`);
    }
    return parsed;
  });

  return {
    meta: input.meta as GraphData['meta'],
    nodes,
    links,
  };
}
