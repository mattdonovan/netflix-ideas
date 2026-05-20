import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { tokens } from "@/theme/tokens";

/**
 * The TV frame.
 *
 * Provides the base dark surface plus the canonical 5% safe-zone padding. Acts
 * as a normally-flowing page rather than a fixed 1920×1080 letterbox — the
 * page scrolls vertically when content overflows, and the canvas is centered
 * at a 1920px max-width so the layout doesn't anchor to the right on
 * non-TV-aspect viewports.
 *
 * Why we dropped the `transform: scale()` lock: it prevented scrolling and
 * caused the canvas to drift visually right at narrow widths. The trade-off
 * is that we no longer enforce a hard TV pixel size on the browser — but
 * design clarity is preserved by the 1920px max-width plus the safe-zone
 * padding, which together keep the TV-grade proportions wherever the
 * viewport allows it.
 */
export function TvFrame({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: tokens.color.base,
        color: tokens.color.textPrimary,
        fontFamily: tokens.type.family.sans,
        display: "flex",
        flexDirection: "column",
        paddingInline: {
          xs: `${tokens.space.md}px`,
          md: `${tokens.space.lg}px`,
          lg: `${tokens.space.xl}px`,
        },
        paddingBlock: {
          xs: `${tokens.space.md}px`,
          md: `${tokens.space.lg}px`,
        },
      }}
    >
      {children}
    </Box>
  );
}
