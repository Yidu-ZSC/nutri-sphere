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

/** Optional literature identifier. doi or pmid is required when the object is present. */
export interface GraphCitation {
  title?: string;
  authors?: string;
  year?: number;
  doi?: string;
  pmid?: string;
  url?: string;
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
  citation?: GraphCitation;
  metadata?: Record<string, unknown>;
}

export interface GraphData {
  meta: GraphMeta;
  nodes: GraphNode[];
  links: GraphLink[];
}

/** Only layperson and expert. Do not add another layer. */
export const VIEW_LAYERS = ['layperson', 'expert'] as const;

export type ViewLayer = (typeof VIEW_LAYERS)[number];

export type Selection =
  | { kind: 'node'; id: string }
  | { kind: 'link'; index: number };

export interface SimNode extends GraphNode {
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  /** Layout Y before a canvas-down flip. Label windows stay in this space. */
  layoutY?: number;
}

export interface SimLink extends Omit<GraphLink, 'source' | 'target'> {
  source: string | SimNode;
  target: string | SimNode;
}
