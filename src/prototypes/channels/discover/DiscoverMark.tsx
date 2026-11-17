import { Box } from "@mui/material";
import { useId } from "react";

/**
 * The Discover mark: a four-pointed star with concave sides, a little taller
 * than wide, cut like a gem. The left facet catches the light (coral), the
 * right falls into shadow (deep red), they meet on a vertical ridge, and a
 * soft red glow sits at the centre. Studied from Netflix's Discover icon
 * animation; drawn fresh as SVG so it stays crisp at nav size and hero size.
 *
 * `animate="intro"` plays once on mount: the star spins in on its vertical
 * axis, settles with a small overshoot, and the glow pulses. `animate="idle"`
 * adds a slow shimmer along the ridge.
 */
export function DiscoverMark({ size = 16, animate, glow = false }: { size?: number; animate?: "intro" | "idle"; glow?: boolean }) {
  const id = useId().replace(/:/g, "");
  const outer = "M0 -52 Q15 -15 50 0 Q15 15 0 52 Q-15 15 -50 0 Q-15 -15 0 -52 Z";
  const left = "M0 -52 Q-15 -15 -50 0 Q-15 15 0 52 Z";
  const right = "M0 -52 Q15 -15 50 0 Q15 15 0 52 Z";
  const inner = "M0 -34 Q10 -10 31 0 Q10 10 0 34 Q-10 10 -31 0 Q-10 -10 0 -34 Z";
  const w = size * (100 / 104);
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: "inline-grid",
        placeItems: "center",
        width: w,
        height: size,
        flexShrink: 0,
        position: "relative",
        filter: glow ? `drop-shadow(0 0 ${Math.max(4, size * 0.35)}px rgba(229, 9, 20, 0.55))` : undefined,
        "& svg": {
          overflow: "visible",
          transformOrigin: "50% 50%",
          ...(animate === "intro"
            ? { animation: "dmIntro 1100ms cubic-bezier(0.2, 0.9, 0.2, 1.15) both, dmFloat 6s ease-in-out 1100ms infinite" }
            : {}),
        },
        "& .dm-ridge": animate ? { animation: "dmShimmer 3.2s ease-in-out 900ms infinite" } : {},
        "& .dm-core": animate === "intro" ? { animation: "dmPulse 1400ms ease-out 500ms both" } : {},
        "@keyframes dmIntro": {
          "0%": { transform: "scale(0.35) rotateY(-540deg)", opacity: 0 },
          "55%": { opacity: 1 },
          "80%": { transform: "scale(1.08) rotateY(8deg)" },
          "100%": { transform: "scale(1) rotateY(0deg)" },
        },
        "@keyframes dmFloat": { "0%,100%": { transform: "translateY(0) rotate(0deg)" }, "50%": { transform: "translateY(-3%) rotate(2deg)" } },
        "@keyframes dmShimmer": { "0%,100%": { opacity: 0.25 }, "50%": { opacity: 0.6 } },
        "@keyframes dmPulse": { "0%": { opacity: 0 }, "35%": { opacity: 1 }, "100%": { opacity: 0.55 } },
      }}
    >
      <svg width={w} height={size} viewBox="-52 -54 104 108">
        <defs>
          <linearGradient id={`${id}l`} x1="-50" y1="-40" x2="0" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF7A7F" />
            <stop offset="1" stopColor="#EE3B47" />
          </linearGradient>
          <linearGradient id={`${id}r`} x1="50" y1="-40" x2="0" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#E52532" />
            <stop offset="1" stopColor="#B20A18" />
          </linearGradient>
          <radialGradient id={`${id}c`} cx="0" cy="0" r="30" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF2A38" stopOpacity="0.95" />
            <stop offset="1" stopColor="#FF2A38" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}g`} x1="0" y1="-52" x2="0" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={left} fill={`url(#${id}l)`} />
        <path d={right} fill={`url(#${id}r)`} />
        {/* Inner bevel: a smaller star, lighter on the lit side. */}
        <path d={inner} fill="none" stroke="#FFB3B7" strokeOpacity="0.16" strokeWidth="1.5" />
        <circle className="dm-core" cx="0" cy="0" r="30" fill={`url(#${id}c)`} opacity="0.55" />
        <line className="dm-ridge" x1="0" y1="-50" x2="0" y2="50" stroke={`url(#${id}g)`} strokeWidth="1.6" opacity="0.4" />
        <path d={outer} fill="none" stroke="#7A0610" strokeOpacity="0.35" strokeWidth="1" />
      </svg>
    </Box>
  );
}
