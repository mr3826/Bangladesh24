import { interpolate, useCurrentFrame } from "remotion";
import type { MapTarget } from "@bangladesh24/shared";
import type { MapFeaturePath } from "../types";

interface BangladeshMapBackdropProps {
  target: MapTarget;
  mapFeatures?: MapFeaturePath[];
}

const FALLBACK_BD_PATH =
  "M467 331 C559 346 621 401 640 482 C721 520 746 596 701 657 C741 728 722 803 657 840 C682 915 652 978 587 1015 C606 1090 574 1156 503 1184 C490 1268 424 1320 344 1301 C301 1241 298 1168 337 1117 C282 1054 275 974 319 908 C264 840 264 759 319 697 C282 618 302 536 374 500 C363 424 392 362 467 331 Z";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchesTarget(feature: MapFeaturePath, target: MapTarget) {
  const targetName = normalizeName(target.name);

  if (target.type === "district") {
    return normalizeName(feature.districtName) === targetName;
  }

  if (target.type === "division") {
    return normalizeName(feature.divisionName) === targetName;
  }

  return false;
}

export function BangladeshMapBackdrop({ target, mapFeatures = [] }: BangladeshMapBackdropProps) {
  const frame = useCurrentFrame();
  const targetX = clamp(target.x, 325, 690);
  const targetY = clamp(target.y, 320, 1240);
  const activeFeatures = mapFeatures.filter((feature) => matchesTarget(feature, target));
  const zoom = interpolate(frame, [0, 52, 108], [0.78, 0.95, 2.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const focusX = interpolate(frame, [0, 108], [510, targetX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const focusY = interpolate(frame, [0, 108], [820, targetY], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const pulse = interpolate(frame % 36, [0, 18, 36], [0.45, 1, 0.45]);
  const reveal = interpolate(frame, [56, 96], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const panX = 540 - focusX * zoom;
  const panY = 900 - focusY * zoom;

  return (
    <div className="map-scene">
      <svg className="bd-map" viewBox="0 0 1080 1920" aria-hidden="true">
        <defs>
          <radialGradient id="water-glow" cx="50%" cy="46%" r="70%">
            <stop offset="0" stopColor="#284f5d" />
            <stop offset="1" stopColor="#06131c" />
          </radialGradient>
          <linearGradient id="terrain-fill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#4f7a39" />
            <stop offset="0.45" stopColor="#2f5c33" />
            <stop offset="0.72" stopColor="#9b8a55" />
            <stop offset="1" stopColor="#24432d" />
          </linearGradient>
          <linearGradient id="active-fill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#ff2f4c" />
            <stop offset="1" stopColor="#b50021" />
          </linearGradient>
          <filter id="terrain-noise">
            <feTurbulence baseFrequency="0.018" numOctaves="4" seed="7" type="fractalNoise" />
            <feColorMatrix type="saturate" values="0.55" />
            <feBlend in="SourceGraphic" mode="overlay" />
          </filter>
          <filter id="map-shadow" x="-35%" y="-35%" width="170%" height="170%">
            <feDropShadow dx="0" dy="28" stdDeviation="28" floodColor="#000000" floodOpacity="0.48" />
          </filter>
        </defs>
        <rect width="1080" height="1920" fill="url(#water-glow)" />
        <g transform={`translate(${panX} ${panY}) scale(${zoom})`}>
          <g filter="url(#map-shadow)">
            {mapFeatures.length > 0 ? (
              <g>
                {mapFeatures.map((feature) => (
                  <path
                    key={feature.key}
                    d={feature.path}
                    fill="url(#terrain-fill)"
                    stroke="#c6d8b8"
                    strokeWidth="1.7"
                    opacity="0.9"
                  />
                ))}
              </g>
            ) : (
              <path
                d={FALLBACK_BD_PATH}
                fill="url(#terrain-fill)"
                filter="url(#terrain-noise)"
              />
            )}
            <g>
              {activeFeatures.map((feature) => (
                <path
                  key={`active-${feature.key}`}
                  d={feature.path}
                  fill="url(#active-fill)"
                  stroke="#ffffff"
                  strokeWidth="4.2"
                  opacity={0.22 + reveal * 0.72}
                />
              ))}
            </g>
            <path d={FALLBACK_BD_PATH} fill="none" stroke="#d7f0c7" strokeWidth="6" opacity={mapFeatures.length ? 0 : 0.55} />
          </g>
          <circle cx={targetX} cy={targetY} r="76" fill="url(#active-fill)" opacity={0.18 + reveal * 0.3} />
          <circle cx={targetX} cy={targetY} r="36" fill="#ff2444" opacity={0.9} />
          <circle
            cx={targetX}
            cy={targetY}
            r={72 + pulse * 38}
            fill="none"
            stroke="#ffffff"
            strokeWidth="8"
            opacity={reveal * (0.65 - pulse * 0.24)}
          />
          <circle
            cx={targetX}
            cy={targetY}
            r="13"
            fill="#ffffff"
            stroke="#151515"
            strokeWidth="5"
            opacity={reveal}
          />
        </g>
      </svg>
      <div className="map-target-label" style={{ opacity: reveal }}>
        {target.name}
      </div>
      <div className="map-vignette" />
    </div>
  );
}
