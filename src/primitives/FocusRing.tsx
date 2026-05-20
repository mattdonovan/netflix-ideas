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
  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: `${radius}px`,
        transition: `transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}, box-shadow ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        transform: `scale(${scale})`,
        boxShadow: focused ? tokens.color.focusShadow : "none",
        outline: focused ? `4px solid ${tokens.color.focusRing}` : "4px solid transparent",
        outlineOffset: "0px",
        willChange: "transform",
      }}
    >
      {children}
    </Box>
  );
}
