import type { ShipPose } from "@/lib/fleetCatalog";

/** Rigged fishing net drawn over the hull.
 *  The hull art never changes, so the four poses line up perfectly:
 *  the rope, mesh, floats, spray and catch are all drawn here. */
export function ShipNet({ pose, spray = true }: { pose: ShipPose; spray?: boolean }) {
  if (pose === "idle") return null;
  return (
    <span className={`ship-net ship-net-${pose}`} aria-hidden="true">
      <svg viewBox="0 0 200 120" preserveAspectRatio="none">
        <defs>
          <pattern id="net-mesh" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0H7M0 0V7" stroke="currentColor" strokeWidth="0.9" fill="none" opacity="0.85" />
          </pattern>
          <linearGradient id="net-rope" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="oklch(0.92 0.09 88)" />
            <stop offset="1" stopColor="oklch(0.66 0.11 72)" />
          </linearGradient>
        </defs>

        <path className="net-rope" d="M46 14 C 86 6, 126 22, 152 58" stroke="url(#net-rope)" strokeWidth="2.4" fill="none" strokeLinecap="round" />

        <g className="net-body">
          <path className="net-mesh" d="M118 36 C 150 34, 176 52, 178 82 C 178 104, 150 114, 126 106 C 100 98, 94 62, 118 36 Z" fill="url(#net-mesh)" />
          <path className="net-edge" d="M118 36 C 150 34, 176 52, 178 82 C 178 104, 150 114, 126 106 C 100 98, 94 62, 118 36 Z" fill="none" stroke="url(#net-rope)" strokeWidth="2.2" />
          <g className="net-floats">
            <circle cx="122" cy="40" r="3.2" />
            <circle cx="148" cy="35" r="3.2" />
            <circle cx="172" cy="56" r="3.2" />
          </g>
          <g className="net-catch">
            <ellipse cx="132" cy="84" rx="9" ry="5" />
            <ellipse cx="152" cy="74" rx="7" ry="4" />
            <ellipse cx="156" cy="92" rx="8" ry="4.5" />
            <ellipse cx="138" cy="98" rx="6" ry="3.5" />
          </g>
        </g>

        {spray && (
          <g className="net-spray">
            <circle cx="150" cy="70" r="2.4" />
            <circle cx="164" cy="60" r="1.8" />
            <circle cx="140" cy="58" r="1.5" />
            <circle cx="170" cy="78" r="2" />
          </g>
        )}
      </svg>
    </span>
  );
}
