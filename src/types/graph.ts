export interface GraphMeta {
  schema_version?: string;
  data_version?: string;
  disclaimer?: string;
  extracted_from?: string;
  extraction_date?: string;
  note?: string;
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  group: string;
  description?: string;
  aliases?: string[];
  sources?: string[];
  metadata?: Record<string, unknown>;
}

export interface GraphLink {
  id?: string;
  source: string;
  target: string;
  relation: string;
  direction: string;
  evidence_type: string;
  strength?: string;
  weight?: number;
  source_file?: string;
  note_id?: string;
  excerpt?: string;
  limitations?: string;
  dose_response?: string;
  population?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphData {
  meta: GraphMeta;
  nodes: GraphNode[];
  links: GraphLink[];
}

export type ViewLayer = 'layperson' | 'expert';

export type Selection =
  | { kind: 'node'; id: string }
  | { kind: 'link'; index: number };

export interface SimNode extends GraphNode {
  x?: number;
  y?: number;
  z?: number;
}

export interface SimLink extends Omit<GraphLink, 'source' | 'target'> {
  source: string | SimNode;
  target: string | SimNode;
}
