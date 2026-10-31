import type { LayoutMode } from '../lib/layout';

interface LayoutToggleProps {
  layout: LayoutMode;
  onChange: (layout: LayoutMode) => void;
}

export function LayoutToggle({ layout, onChange }: LayoutToggleProps) {
  return (
    <div className="segment layout-toggle" role="group" aria-label="布局" data-testid="layout-toggle">
      <button type="button" aria-pressed={layout === 'force'} onClick={() => onChange('force')}>
        力导向
      </button>
      <button type="button" aria-pressed={layout === 'hierarchy'} onClick={() => onChange('hierarchy')}>
        层次分列
      </button>
    </div>
  );
}
