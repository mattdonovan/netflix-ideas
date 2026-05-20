import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { tokens } from "@/theme/tokens";
import { FocusRing } from "./FocusRing";

export type TileSize = "sm" | "md" | "lg";

const TILE_DIMENSIONS: Record<TileSize, { width: number; height: number }> = {
  // Poster aspect (2:3), sized for TV at 1080p where ~6 tiles fit a row.
  sm: { width: 220, height: 330 },
  md: { width: 260, height: 390 },
  lg: { width: 320, height: 480 },
};

/**
 * Content tile. Used for posters, channels, or any focusable card.
 *
 * Props:
 *  - title, subtitle: optional caption beneath the artwork
 *  - color: a placeholder fill when no artwork is provided (deliberately
 *    used here — we don't ship copyrighted Netflix art, so the prototype
 *    uses tone-matched color blocks instead)
 *  - badge: optional small label (e.g., "NEW", "TOP 10", "NOVELTY: HIGH")
 *  - focused: handled externally by the focus manager
 *  - onSelect: invoked on Enter press while focused
 */
export function Tile({
  size = "md",
  title,
  subtitle,
  color,
  artwork,
  badge,
  focused,
}: {
  size?: TileSize;
  title?: string;
  subtitle?: string;
  color?: string;
  artwork?: ReactNode;
  badge?: string;
  focused: boolean;
}) {
  const dims = TILE_DIMENSIONS[size];
  return (
    <Box sx={{ width: dims.width, flexShrink: 0 }}>
      <FocusRing focused={focused} radius={tokens.radius.sm}>
        <Box
          sx={{
            width: dims.width,
            height: dims.height,
            borderRadius: `${tokens.radius.sm}px`,
            background: color ?? `linear-gradient(155deg, ${tokens.color.surfaceMid}, ${tokens.color.surfaceLow})`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {artwork}
          {badge && (
            <Box
              sx={{
                position: "absolute",
                top: tokens.space.sm,
                left: tokens.space.sm,
                backgroundColor: tokens.color.base,
                color: tokens.color.textPrimary,
                paddingInline: tokens.space.xs,
                paddingBlock: tokens.space.xxs,
                borderRadius: tokens.radius.sm,
                fontSize: tokens.type.scale.micro.size,
                fontWeight: tokens.type.weight.semibold,
                letterSpacing: tokens.type.scale.micro.letterSpacing,
                textTransform: "uppercase",
              }}
            >
              {badge}
            </Box>
          )}
        </Box>
      </FocusRing>
      {(title || subtitle) && (
        <Box sx={{ mt: `${tokens.space.sm}px`, opacity: focused ? 1 : 0.72, transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}` }}>
          {title && (
            <Typography
              sx={{
                fontSize: tokens.type.scale.bodySmall.size,
                fontWeight: tokens.type.weight.semibold,
                color: tokens.color.textPrimary,
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography
              sx={{
                fontSize: tokens.type.scale.micro.size,
                fontWeight: tokens.type.weight.regular,
                color: tokens.color.textSecondary,
                mt: "4px",
                letterSpacing: tokens.type.scale.micro.letterSpacing,
                textTransform: "uppercase",
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
