import type { GraphView } from '../lib/graphView';

interface LayoutToggleProps {
  view: GraphView;
  onChange: (view: GraphView) => void;
}

export function LayoutToggle({ view, onChange }: LayoutToggleProps) {
  return (
    <div className="segment layout-toggle" role="group" aria-label="主视图" data-testid="layout-toggle">
      <button type="button" aria-pressed={view === '2d'} onClick={() => onChange('2d')}>
        2D 层次
      </button>
      <button type="button" aria-pressed={view === '3d'} onClick={() => onChange('3d')}>
        3D 探索
      </button>
    </div>
  );
}
