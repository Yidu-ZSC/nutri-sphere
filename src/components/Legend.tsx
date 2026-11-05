import { useEffect, useState } from 'react';
import { PALETTE } from '../lib/palette';
import { readLegendExpanded, writeLegendExpanded } from '../lib/legendChrome';
import type { ShapeKind } from '../lib/nodeStyle';

const DIRECTIONS: { id: keyof typeof PALETTE; label: string }[] = [
  { id: 'protective', label: '保护相关' },
  { id: 'risk', label: '风险相关' },
  { id: 'neutral', label: '中性' },
  { id: 'mixed', label: '混合' },
];

function ShapeIcon({ kind }: { kind: ShapeKind }) {
  if (kind === 'rounded') {
    return (
      <svg className="shape-icon" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" rx="3" />
      </svg>
    );
  }
  if (kind === 'hex') {
    return (
      <svg className="shape-icon" viewBox="0 0 16 16" aria-hidden="true">
        <polygon points="8,1.5 13.5,4.5 13.5,11.5 8,14.5 2.5,11.5 2.5,4.5" />
      </svg>
    );
  }
  if (kind === 'diamond') {
    return (
      <svg className="shape-icon" viewBox="0 0 16 16" aria-hidden="true">
        <polygon points="8,1.5 14,8 8,14.5 2,8" />
      </svg>
    );
  }
  return (
    <svg className="shape-icon" viewBox="0 0 16 16" aria-hidden="true">
      <polygon points="6,1.6 10,1.6 14.4,6 14.4,10 10,14.4 6,14.4 1.6,10 1.6,6" />
    </svg>
  );
}

function LegendBlocks() {
  return (
    <>
      <div className="legend-block">
        <p>关联方向</p>
        <ul>
          {DIRECTIONS.map((item) => (
            <li key={item.id}>
              <i className="swatch" style={{ background: PALETTE[item.id] }} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="legend-block">
        <p>强度（线越粗越高）</p>
        <ul>
          <li>
            <span className="legend-line legend-line--low" aria-hidden="true" />
            较弱
          </li>
          <li>
            <span className="legend-line legend-line--mid" aria-hidden="true" />
            中等
          </li>
          <li>
            <span className="legend-line legend-line--high" aria-hidden="true" />
            较强
          </li>
        </ul>
      </div>
      <div className="legend-block">
        <p>节点类型</p>
        <ul>
          <li>
            <ShapeIcon kind="rounded" />
            膳食 / 食物
          </li>
          <li>
            <ShapeIcon kind="hex" />
            营养素 / 化合物 / 代谢物
          </li>
          <li>
            <ShapeIcon kind="diamond" />
            机制
          </li>
          <li>
            <ShapeIcon kind="octagon" />
            健康/疾病
          </li>
        </ul>
      </div>
    </>
  );
}

export interface LegendProps {
  /** ≤768 explore: enable collapse chip. Desktop leaves this false/undefined. */
  compact?: boolean;
  /** Notifies parent so HUD can apply `.hud--legend-collapsed`. */
  onExpandedChange?: (expanded: boolean) => void;
}

export function Legend({ compact = false, onExpandedChange }: LegendProps) {
  const [expanded, setExpanded] = useState(() => (compact ? readLegendExpanded() : true));

  useEffect(() => {
    if (!compact) {
      onExpandedChange?.(true);
      return;
    }
    const next = readLegendExpanded();
    setExpanded(next);
    onExpandedChange?.(next);
  }, [compact, onExpandedChange]);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      writeLegendExpanded(next);
      onExpandedChange?.(next);
      return next;
    });
  };

  if (!compact) {
    return (
      <div className="legend" data-testid="legend" aria-label="图例">
        <LegendBlocks />
      </div>
    );
  }

  return (
    <div
      className={expanded ? 'legend legend--expanded' : 'legend legend--collapsed'}
      data-testid="legend"
      aria-label="图例"
    >
      <button
        type="button"
        className="legend-toggle"
        data-testid="legend-toggle"
        aria-expanded={expanded}
        aria-controls="legend-details"
        onClick={toggle}
      >
        <span className="legend-toggle-label">图例</span>
        <span className="legend-toggle-dots" aria-hidden="true">
          {DIRECTIONS.map((item) => (
            <i key={item.id} className="swatch" style={{ background: PALETTE[item.id] }} />
          ))}
        </span>
      </button>
      {expanded && (
        <div id="legend-details" className="legend-details">
          <LegendBlocks />
        </div>
      )}
    </div>
  );
}
