import type { GraphNode, ViewLayer } from '../types/graph';

interface FilterPanelProps {
  diseases: GraphNode[];
  mechanisms: GraphNode[];
  diseaseId: string | null;
  mechanismId: string | null;
  layer: ViewLayer;
  onDisease: (id: string | null) => void;
  onMechanism: (id: string | null) => void;
  onClear: () => void;
}

export function FilterPanel({
  diseases,
  mechanisms,
  diseaseId,
  mechanismId,
  layer,
  onDisease,
  onMechanism,
  onClear,
}: FilterPanelProps) {
  const diseaseLabel = layer === 'expert' ? '疾病 disease' : '按健康主题';
  const mechanismLabel = layer === 'expert' ? '机制 mechanism' : '按机制';

  return (
    <div className="filters">
      <label>
        <span>{diseaseLabel}</span>
        <select
          aria-label={diseaseLabel}
          value={diseaseId ?? ''}
          onChange={(event) => onDisease(event.target.value || null)}
        >
          <option value="">全部</option>
          {diseases.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>{mechanismLabel}</span>
        <select
          aria-label={mechanismLabel}
          value={mechanismId ?? ''}
          onChange={(event) => onMechanism(event.target.value || null)}
        >
          <option value="">全部</option>
          {mechanisms.map((node) => (
            <option key={node.id} value={node.id}>
              {node.label}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="btn btn--ghost" onClick={onClear}>
        清除全部
      </button>
    </div>
  );
}
