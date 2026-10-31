import type { ViewLayer } from '../types/graph';

interface ViewLayerToggleProps {
  layer: ViewLayer;
  onChange: (layer: ViewLayer) => void;
}

export function ViewLayerToggle({ layer, onChange }: ViewLayerToggleProps) {
  return (
    <div className="segment" role="group" aria-label="视图分层">
      <button
        type="button"
        aria-pressed={layer === 'layperson'}
        onClick={() => onChange('layperson')}
      >
        普通
      </button>
      <button
        type="button"
        aria-pressed={layer === 'expert'}
        onClick={() => onChange('expert')}
      >
        专家
      </button>
    </div>
  );
}
