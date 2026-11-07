import type { GraphView } from '../lib/graphView';

interface LayoutToggleProps {
  view: GraphView;
  onChange: (view: GraphView) => void;
}

/** Accessible names stay as the old visible labels (TASK-NS-082). */
const OPTIONS: { view: GraphView; label: string }[] = [
  { view: 'flow', label: '2D通路' },
  { view: '2d', label: '2D层次' },
  { view: '3d', label: '3D' },
];

function ViewIcon({ view }: { view: GraphView }) {
  if (view === 'flow') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="3.6" cy="10" r="1.6" />
        <path d="M5.4 10h4.1M9.5 10 13 5.4h3.4M9.5 10l3.5 4.6h3.4" />
      </svg>
    );
  }
  if (view === '2d') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path d="M4 16.5V8.5M8 16.5v-12M12 16.5v-8M16 16.5V4.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="m10 2.2 6.8 3.9v7.8L10 17.8l-6.8-3.9V6.1z" />
      <path d="m3.2 6.1 6.8 3.9 6.8-3.9M10 10v7.8" />
    </svg>
  );
}

export function LayoutToggle({ view, onChange }: LayoutToggleProps) {
  return (
    <div className="segment layout-toggle" role="group" aria-label="主视图" data-testid="layout-toggle">
      {OPTIONS.map((option) => (
        <button
          key={option.view}
          type="button"
          aria-label={option.label}
          aria-pressed={view === option.view}
          onClick={() => onChange(option.view)}
        >
          <ViewIcon view={option.view} />
        </button>
      ))}
    </div>
  );
}
