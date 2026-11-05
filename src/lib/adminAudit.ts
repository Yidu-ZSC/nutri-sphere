import type { GraphData, GraphEvidence, SourcesData } from '../types/graph.ts';

const EXCERPT_LIMIT = 1200;

export interface AuditIssue {
  level: 'error' | 'warning';
  message: string;
}

export interface AuditReport {
  errors: AuditIssue[];
  warnings: AuditIssue[];
  counts: { nodes: number; links: number; sources: number };
}

function pushError(issues: AuditIssue[], message: string) {
  issues.push({ level: 'error', message });
}

function checkEvidence(issues: AuditIssue[], ev: GraphEvidence | undefined, path: string, sourceIds: ReadonlySet<string>) {
  if (!ev) {
    pushError(issues, `${path} 缺少证据`);
    return;
  }
  if (!ev.excerpt?.trim()) pushError(issues, `${path} 缺少 excerpt`);
  else if (ev.excerpt.length > EXCERPT_LIMIT) {
    pushError(issues, `${path}.excerpt 长度为 ${ev.excerpt.length}，超过 ${EXCERPT_LIMIT}`);
  }
  if (!ev.source_title?.trim()) pushError(issues, `${path} 缺少 source_title`);
  if (!ev.source_file?.trim()) pushError(issues, `${path} 缺少 source_file`);
  if (ev.source_file === 'literature') {
    if (ev.source_id) pushError(issues, `${path} literature 不得带 source_id`);
    if (!ev.citation) pushError(issues, `${path} literature 需要 citation`);
  } else if (!ev.source_id) {
    pushError(issues, `${path} 图书证据缺少 source_id`);
  } else if (!sourceIds.has(ev.source_id)) {
    pushError(issues, `${path}.source_id "${ev.source_id}" 不在 sources.json`);
  }
}

/** Browser-side subset of seed checks. Schema compile stays in `npm run validate:data`. */
export function auditLoadedGraph(graph: GraphData, sources: SourcesData | null): AuditReport {
  const errors: AuditIssue[] = [];
  const warnings: AuditIssue[] = [];
  const ids = new Set<string>();
  const sourceIds = new Set((sources?.sources ?? []).map((source) => source.id));

  graph.nodes.forEach((node, index) => {
    if (ids.has(node.id)) pushError(errors, `nodes[${index}].id "${node.id}" 重复`);
    ids.add(node.id);
    if (node.type !== 'mechanism' && node.mechanism_depth === 'technical') {
      warnings.push({
        level: 'warning',
        message: `nodes[${index}] "${node.id}" type 不是 mechanism，却将 mechanism_depth 标为 technical`,
      });
    }
    if (!node.label?.trim()) pushError(errors, `nodes[${index}] "${node.id}" 缺少 label`);
  });

  const linkIds = new Set<string>();
  graph.links.forEach((link, index) => {
    const path = `links[${index}]`;
    if (!ids.has(link.source)) pushError(errors, `${path}.source "${link.source}" 不存在`);
    if (!ids.has(link.target)) pushError(errors, `${path}.target "${link.target}" 不存在`);
    if (!link.relation?.trim()) pushError(errors, `${path} 缺少 relation`);
    if (link.id) {
      if (linkIds.has(link.id)) pushError(errors, `${path}.id "${link.id}" 重复`);
      linkIds.add(link.id);
    }
    const first = link.evidences?.[0];
    if (!link.evidences || link.evidences.length === 0) {
      pushError(errors, `${path} 缺少 evidences`);
    } else {
      link.evidences.forEach((ev, evIndex) => {
        checkEvidence(errors, ev, `${path}.evidences[${evIndex}]`, sourceIds);
      });
    }
    if (first && link.excerpt !== undefined && link.excerpt !== first.excerpt) {
      pushError(errors, `${path}.excerpt 必须与 evidences[0].excerpt 一致`);
    }
    if (link.source_file === 'literature' && link.source_id) {
      pushError(errors, `${path} literature 不得带 source_id`);
    }
  });

  if (!sources) pushError(errors, 'sources.json 未加载');

  return {
    errors,
    warnings,
    counts: {
      nodes: graph.nodes.length,
      links: graph.links.length,
      sources: sources?.sources.length ?? 0,
    },
  };
}
