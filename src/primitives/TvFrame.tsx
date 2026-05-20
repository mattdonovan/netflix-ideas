import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { tokens } from "@/theme/tokens";

/**
 * The TV frame.
 *
 * Sets the canonical viewport (1920×1080), enforces the 5% safe zone on every
 * edge, and provides the base surface. All TV screens render inside a TvFrame.
 *
 * On non-TV viewports (laptop, dev), we still render the same 1920×1080 box
 * scaled down to fit the available window — this preserves design proportions
 * during development. The scale uses CSS transform so layout math inside is
 * untouched.
 */
export function TvFrame({ children }: { children: ReactNode }) {
  const { width, height } = tokens.tv.viewport;
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        backgroundColor: tokens.color.base,
        // Hide cursor on the TV frame — focus is the interaction model.
        cursor: "none",
      }}
    >
      <Box
        sx={{
          width,
          height,
          position: "relative",
          backgroundColor: tokens.color.base,
          // Fit-to-window scaling without changing inner coordinates.
          transform: `scale(min(calc(100vw / ${width}), calc(100vh / ${height})))`,
          transformOrigin: "center",
          overflow: "hidden",
        }}
      >
        {/* Safe-zone-respecting content area */}
        <Box
          sx={{
            position: "absolute",
            inset: `${tokens.tv.safeBox.marginY}px ${tokens.tv.safeBox.marginX}px`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
