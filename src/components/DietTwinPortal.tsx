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
          <svg className="diet-twin-silhouette" viewBox="0 0 200 180" focusable="false">
            <circle className="diet-twin-ring" cx="100" cy="90" r="80" />
            <g className="diet-twin-figure">
              <circle className="diet-twin-fill" cx="100" cy="46" r="14" />
              <circle className="diet-twin-stroke" cx="100" cy="46" r="14" />
              <path
                className="diet-twin-fill"
                d="M100 60C90 62 84 68 82 76C84 92 86 108 90 122C94 128 106 128 110 122C114 108 116 92 118 76C116 68 110 62 100 60Z"
              />
              <path
                className="diet-twin-stroke"
                d="M100 60C90 62 84 68 82 76C84 92 86 108 90 122C94 128 106 128 110 122C114 108 116 92 118 76C116 68 110 62 100 60Z"
              />
              <g className="diet-twin-arm diet-twin-arm--left">
                <path className="diet-twin-limb" d="M82 76C72 58 66 44 60 32" />
              </g>
              <g className="diet-twin-arm diet-twin-arm--right">
                <path className="diet-twin-limb" d="M118 76C128 58 134 44 140 32" />
              </g>
              <path className="diet-twin-limb" d="M94 122C92 138 90 152 88 164" />
              <path className="diet-twin-limb" d="M106 122C108 138 110 152 112 164" />
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
