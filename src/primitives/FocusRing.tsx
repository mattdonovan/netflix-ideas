import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { tokens } from "@/theme/tokens";

/**
 * Focus treatment.
 *
 * Wraps any focusable element. When `focused=true`:
 *  - Element scales up by tokens.tv.focusScale (the Netflix tile bloom).
 *  - A bright off-white ring + soft glow appears around it.
 *  - A deep shadow lifts it off the surface.
 *
 * The transition uses the focus easing curve. Press is a separate fast scale-down
 * that overlays the focus transform to give tactile feedback when Enter is pressed.
 */
export function FocusRing({
  focused,
  pressed = false,
  radius = tokens.radius.sm,
  children,
}: {
  focused: boolean;
  pressed?: boolean;
  radius?: number;
  children: ReactNode;
}) {
  const scale = focused ? (pressed ? tokens.tv.focusScale * 0.97 : tokens.tv.focusScale) : 1;
  // Composite ring tuned to Figma 109-9726: a 2px translucent off-white
  // outer stroke + a soft inner halo + a moderate deep shadow for lift.
  // The pass-1 finding (no hard browser outline) still holds — the stroke
  // is intentionally short of solid so it reads as a Netflix bloom rather
  // than a focus rect.
  const ringShadow = focused
    ? `0 0 0 2px rgba(245,245,245,0.92), 0 0 0 8px rgba(245,245,245,0.10), 0 18px 40px rgba(0,0,0,0.55)`
    : "none";
  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: `${radius}px`,
        transition: `transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}, box-shadow ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        transform: `scale(${scale})`,
        boxShadow: ringShadow,
        willChange: "transform",
      }}
    >
      {children}
    </Box>
  );
}
