import { interpolate, useCurrentFrame } from "remotion";
import type { MapTarget } from "@bangladesh24/shared";

interface BangladeshMapBackdropProps {
  target: MapTarget;
}

const DISTRICT_GRID = [
  [395, 388],
  [448, 352],
  [505, 390],
  [372, 490],
  [450, 510],
  [532, 496],
  [612, 536],
  [363, 618],
  [450, 650],
  [535, 640],
  [630, 676],
  [350, 744],
  [445, 780],
  [540, 772],
  [620, 818],
  [356, 898],
  [448, 940],
  [548, 928],
  [622, 1010],
  [384, 1080],
  [482, 1115],
  [564, 1075],
  [440, 1222]
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function BangladeshMapBackdrop({ target }: BangladeshMapBackdropProps) {
  const frame = useCurrentFrame();
  const targetX = clamp(target.x, 325, 690);
  const targetY = clamp(target.y, 320, 1240);
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
          <clipPath id="bd-clip">
            <path d="M467 331 C559 346 621 401 640 482 C721 520 746 596 701 657 C741 728 722 803 657 840 C682 915 652 978 587 1015 C606 1090 574 1156 503 1184 C490 1268 424 1320 344 1301 C301 1241 298 1168 337 1117 C282 1054 275 974 319 908 C264 840 264 759 319 697 C282 618 302 536 374 500 C363 424 392 362 467 331 Z" />
          </clipPath>
        </defs>
        <rect width="1080" height="1920" fill="url(#water-glow)" />
        <g transform={`translate(${panX} ${panY}) scale(${zoom})`}>
          <g filter="url(#map-shadow)">
            <path
              d="M467 331 C559 346 621 401 640 482 C721 520 746 596 701 657 C741 728 722 803 657 840 C682 915 652 978 587 1015 C606 1090 574 1156 503 1184 C490 1268 424 1320 344 1301 C301 1241 298 1168 337 1117 C282 1054 275 974 319 908 C264 840 264 759 319 697 C282 618 302 536 374 500 C363 424 392 362 467 331 Z"
              fill="url(#terrain-fill)"
              filter="url(#terrain-noise)"
            />
            <path
              d="M469 357 C540 372 594 420 611 491 C680 531 700 586 660 642 C696 713 676 770 620 808 C644 881 614 937 558 966 C576 1037 547 1095 488 1117 C476 1180 424 1240 360 1260 C324 1208 323 1167 357 1113 C310 1056 309 985 348 927 C304 866 302 779 348 713 C321 653 324 579 389 525 C383 444 408 379 469 357 Z"
              fill="none"
              stroke="#d7f0c7"
              strokeWidth="8"
              opacity="0.55"
            />
          </g>
          <g clipPath="url(#bd-clip)">
            {[455, 542, 629, 716, 803, 890, 977, 1064, 1151].map((y) => (
              <path
                key={y}
                d={`M330 ${y} C430 ${y - 58} 534 ${y + 60} 686 ${y - 8}`}
                fill="none"
                stroke="#91c8ed"
                strokeWidth="9"
                opacity="0.5"
              />
            ))}
            {[385, 455, 525, 595].map((x) => (
              <path
                key={x}
                d={`M${x} 405 C${x + 70} 565 ${x - 46} 850 ${x + 62} 1190`}
                fill="none"
                stroke="#d8e7cf"
                strokeWidth="3"
                opacity="0.3"
              />
            ))}
            {DISTRICT_GRID.map(([x, y], index) => (
              <circle key={`${x}-${y}-${index}`} cx={x} cy={y} r="8" fill="#ffffff" opacity="0.34" />
            ))}
            <circle cx={targetX} cy={targetY} r="76" fill="url(#active-fill)" opacity={0.28 + reveal * 0.42} />
            <circle cx={targetX} cy={targetY} r="36" fill="#ff2444" opacity={0.9} />
          </g>
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
