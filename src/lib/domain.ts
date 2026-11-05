import type { Domain, GraphData, GraphLink, GraphNode } from '../types/graph';

export const DOMAIN_IDS = ['health', 'environment', 'culture'] as const satisfies readonly Domain[];

export const DOMAIN_OPTIONS: readonly { id: Domain; label: string }[] = [
  { id: 'health', label: '健康' },
  { id: 'environment', label: '环境' },
  { id: 'culture', label: '文化' },
] as const;

/** Missing / illegal → health. Matches NS-062 loader default. */
export function normalizeDomain(value: unknown): Domain {
  if (value === 'health' || value === 'environment' || value === 'culture') return value;
  return 'health';
}

export function domainTopicPhrase(domain: Domain): string {
  if (domain === 'environment') return '饮食与环境';
  if (domain === 'culture') return '饮食与文化';
  return '饮食与健康';
}

export interface DomainFilteredGraph {
  nodes: GraphNode[];
  nodeIds: Set<string>;
  /** Original indices into graph.links that stay visible under B2. */
  linkIndices: Set<number>;
  links: GraphLink[];
}

/**
 * visibleNodes = nodes where domain===active
 * visibleLinks = links where domain===active AND both ends in visibleNodes
 */
export function filterGraphByDomain(
  graph: Pick<GraphData, 'nodes' | 'links'>,
  activeDomain: Domain,
): DomainFilteredGraph {
  const active = normalizeDomain(activeDomain);
  const nodes = graph.nodes.filter((node) => normalizeDomain(node.domain) === active);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const linkIndices = new Set<number>();
  const links: GraphLink[] = [];
  graph.links.forEach((link, index) => {
    if (normalizeDomain(link.domain) !== active) return;
    if (!nodeIds.has(link.source) || !nodeIds.has(link.target)) return;
    linkIndices.add(index);
    links.push(link);
  });
  return { nodes, nodeIds, linkIndices, links };
}
