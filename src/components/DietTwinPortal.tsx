import { DIET_TWIN_COPY } from '../lib/dietTwin';

interface DietTwinPortalProps {
  onOpen: () => void;
}

export function DietTwinPortal({ onOpen }: DietTwinPortalProps) {
  return (
    <button
      type="button"
      className="diet-twin-entry"
      data-testid="diet-twin-entry"
      aria-label={DIET_TWIN_COPY.entryAria}
      onClick={onOpen}
    >
      <span className="diet-twin-stage" aria-hidden="true">
        <span className="diet-twin-glow" />
        <span className="diet-twin-figure-wrap">
          <svg className="diet-twin-silhouette" viewBox="0 0 120 176" focusable="false">
            <ellipse className="diet-twin-ring" cx="60" cy="92" rx="50" ry="76" />
            <g className="diet-twin-figure">
              <ellipse className="diet-twin-fill" cx="60" cy="32" rx="13" ry="15" />
              <ellipse className="diet-twin-stroke" cx="60" cy="32" rx="13" ry="15" />
              <path
                className="diet-twin-fill"
                d="M60 46c-14 2-24 12-26 28-3 18 2 40 10 54 4 8 10 12 16 12s12-4 16-12c8-14 13-36 10-54-2-16-12-26-26-28z"
              />
              <path
                className="diet-twin-stroke"
                d="M60 46c-14 2-24 12-26 28-3 18 2 40 10 54 4 8 10 12 16 12s12-4 16-12c8-14 13-36 10-54-2-16-12-26-26-28z"
              />
              <path className="diet-twin-limb" d="M42 76c-12 10-16 30-12 48" />
              <path className="diet-twin-limb" d="M78 76c12 10 16 30 12 48" />
              <path className="diet-twin-limb" d="M52 136c-2 12-5 24-8 34" />
              <path className="diet-twin-limb" d="M68 136c2 12 5 24 8 34" />
              <path className="diet-twin-meridian" d="M60 56v74" />
            </g>
          </svg>
          <span className="diet-twin-hotspot diet-twin-hotspot--chest" />
          <span className="diet-twin-hotspot diet-twin-hotspot--abdomen" />
          <span className="diet-twin-hotspot diet-twin-hotspot--shoulder" />
        </span>
      </span>
      <h2 className="diet-twin-title">{DIET_TWIN_COPY.entryTitle}</h2>
    </button>
  );
}
