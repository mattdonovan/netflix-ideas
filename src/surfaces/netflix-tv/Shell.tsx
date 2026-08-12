import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { TvNav, TV_NAV_HEIGHT, type TvNavItem } from "@/primitives";
import { tokens } from "@/theme/tokens";
import { ProfileMenu } from "./ProfileMenu";

/**
 * The head of a Netflix TV surface: the fixed centered nav plus the billboard
 * slot beneath it.
 *
 * Every prototype built on this surface wants the same three things at the top
 * of the page — an edge-to-edge nav band flush with the viewport, a spacer
 * holding the fixed nav's place in the flow, and a billboard inset to the
 * frame's safe-zone padding. Only the billboard's contents differ, so that's
 * the only thing passed in.
 */

/**
 * TV nav model. The 2025 redesign collapsed netflix.com's seven-item nav to
 * five destinations, gave Games its own slot, and replaced "My List" with the
 * broader "My Netflix". We quote it exactly — the item set is part of what
 * makes the bar read as the TV app rather than the website.
 */
export const TV_NAV_ITEMS: TvNavItem[] = [
  { label: "Home", active: true },
  { label: "Series" },
  { label: "Films" },
  { label: "Games" },
  { label: "My Netflix" },
];

export function TvSurfaceHead({
  children,
  navItems = TV_NAV_ITEMS,
  navTint,
}: {
  /** The billboard. Rendered inside the frame's safe-zone padding. */
  children: ReactNode;
  navItems?: TvNavItem[];
  /** Wash pulled from the billboard's dominant hue, applied behind the nav. */
  navTint?: string;
}) {
  return (
    <Box
      sx={{
        // Escape the TvFrame padding so the nav band runs edge to edge and
        // sits flush against the top of the viewport.
        marginInline: {
          xs: `-${tokens.space.md}px`,
          md: `-${tokens.space.lg}px`,
          lg: `-${tokens.space.xl}px`,
        },
        marginTop: { xs: `-${tokens.space.md}px`, md: `-${tokens.space.lg}px` },
        position: "relative",
      }}
    >
      {/* The TV nav puts the avatar in the top-left corner, so its menu has to
          open down-and-right or it lands off the viewport. */}
      <TvNav fixed items={navItems} leftSlot={<ProfileMenu align="left" />} tint={navTint} />

      {/* The fixed nav is out of flow; this holds its place so the billboard
          still starts below it rather than underneath it. */}
      <Box sx={{ height: TV_NAV_HEIGHT }} />

      <Box
        sx={{
          paddingInline: {
            xs: `${tokens.space.md}px`,
            md: `${tokens.space.lg}px`,
            lg: `${tokens.space.xl}px`,
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
