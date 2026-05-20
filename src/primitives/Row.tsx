import { Box, Typography } from "@mui/material";
import { type ReactNode, useEffect, useRef } from "react";
import { tokens } from "@/theme/tokens";
import { useSection } from "@/lib/focus";

/**
 * A horizontal row of focusable items.
 *
 * Implements the "fixed focus, content slides to it" Netflix idiom: the row
 * scrolls left as the active index increases, so the focused tile stays in
 * roughly the same horizontal position. This is the row that callers compose
 * Tiles or other focusables into — see prototypes/channels/Channel.tsx for
 * the editable-title variant.
 */
export function Row({
  sectionId,
  title,
  titleSlot,
  itemCount,
  itemWidth = 260,
  gap = tokens.space.md,
  /**
   * Where (in px from the row's left edge) we want the focused tile to sit.
   * The reel content translates to keep the active index at this offset.
   */
  fixedFocusOffsetPx = 0,
  children,
}: {
  sectionId: string;
  title?: string;
  titleSlot?: ReactNode;
  itemCount: number;
  itemWidth?: number;
  gap?: number;
  fixedFocusOffsetPx?: number;
  children: ReactNode;
}) {
  const { activeIndex, isActive } = useSection(sectionId, itemCount);
  const reelRef = useRef<HTMLDivElement | null>(null);

  // Translate the reel so the active tile sits at fixedFocusOffsetPx.
  useEffect(() => {
    if (!reelRef.current) return;
    const offset = activeIndex * (itemWidth + gap);
    reelRef.current.style.transform = `translateX(${fixedFocusOffsetPx - offset}px)`;
  }, [activeIndex, itemWidth, gap, fixedFocusOffsetPx]);

  return (
    <Box sx={{ mb: `${tokens.space.xl}px` }}>
      <Box
        sx={{
          mb: `${tokens.space.md}px`,
          display: "flex",
          alignItems: "baseline",
          gap: `${tokens.space.sm}px`,
          opacity: isActive ? 1 : 0.6,
          transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        }}
      >
        {title && (
          <Typography
            sx={{
              fontSize: tokens.type.scale.h3.size,
              lineHeight: tokens.type.scale.h3.lineHeight,
              letterSpacing: tokens.type.scale.h3.letterSpacing,
              fontWeight: tokens.type.weight.semibold,
              color: tokens.color.textPrimary,
            }}
          >
            {title}
          </Typography>
        )}
        {titleSlot}
      </Box>
      <Box sx={{ position: "relative", overflow: "visible" }}>
        <Box
          ref={reelRef}
          sx={{
            display: "flex",
            gap: `${gap}px`,
            transition: `transform ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
            willChange: "transform",
            // Allow tile bloom to escape the row vertically
            paddingBlock: `${tokens.space.md}px`,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
