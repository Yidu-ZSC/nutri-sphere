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
              <g className="diet-twin-leg diet-twin-leg--left">
                <path className="diet-twin-limb" d="M94 122 L91 143" />
                <g className="diet-twin-shin diet-twin-shin--left">
                  <path className="diet-twin-limb" d="M91 143 L88 164" />
                </g>
              </g>
              <g className="diet-twin-leg diet-twin-leg--right">
                <path className="diet-twin-limb" d="M106 122 L109 143" />
                <g className="diet-twin-shin diet-twin-shin--right">
                  <path className="diet-twin-limb" d="M109 143 L112 164" />
                </g>
              </g>
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
                <path className="diet-twin-limb" d="M82 76 L71 53" />
                <g className="diet-twin-forearm diet-twin-forearm--left">
                  <path className="diet-twin-limb" d="M71 53 L60 32" />
                </g>
              </g>
              <g className="diet-twin-arm diet-twin-arm--right">
                <path className="diet-twin-limb" d="M118 76 L129 53" />
                <g className="diet-twin-forearm diet-twin-forearm--right">
                  <path className="diet-twin-limb" d="M129 53 L140 32" />
                </g>
              </g>
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
