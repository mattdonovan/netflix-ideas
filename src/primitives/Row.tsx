import { Box, Typography, IconButton } from "@mui/material";
import { type ReactNode, useEffect, useRef, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { tokens } from "@/theme/tokens";
import { useFocusContext, useSection } from "@/lib/focus";

/**
 * Horizontal scroll row.
 *
 * Web-first: tiles live in a native horizontal-scroll container with
 * scroll-snap, so a mouse user can swipe/drag/wheel through them naturally.
 * On keyboard nav, the active tile is scrolled into view (Netflix's actual
 * web behavior — focus follows the cursor, the viewport follows focus).
 *
 * Tile widths are percentage-based via the `itemsPerView` map, so the row
 * stays neatly column-aligned across breakpoints.
 */
export function Row({
  sectionId,
  title,
  titleSlot,
  itemCount,
  itemsPerView,
  gap = tokens.grouping.cardGap,
  children,
}: {
  sectionId: string;
  title?: string;
  titleSlot?: ReactNode;
  itemCount: number;
  /**
   * How many tiles to show across the row at each breakpoint. Used to
   * compute percentage-based tile widths. Defaults are tuned for 16:9 boxart.
   */
  itemsPerView?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number;
  children: ReactNode;
}) {
  const { activeIndex, isActive, focusItem } = useSection(sectionId, itemCount);
  const ctx = useFocusContext();
  const reelRef = useRef<HTMLDivElement | null>(null);
  const [chevrons, setChevrons] = useState({ left: false, right: false });

  const perView = {
    xs: itemsPerView?.xs ?? 1.4,
    sm: itemsPerView?.sm ?? 2.4,
    md: itemsPerView?.md ?? 4,
    lg: itemsPerView?.lg ?? 5,
    xl: itemsPerView?.xl ?? 6,
  };

  /**
   * Scroll the focused tile into view when keyboard nav moves the section's
   * active index. Scrolls ONLY the reel horizontally — using scrollIntoView
   * would also scroll the page vertically (because the reel is inside a
   * scrollable document), which on mount would push the hero out of view.
   */
  useEffect(() => {
    if (!isActive) return;
    const reel = reelRef.current;
    if (!reel) return;
    const child = reel.children[activeIndex] as HTMLElement | undefined;
    if (!child) return;
    const target = child.offsetLeft + child.offsetWidth / 2 - reel.clientWidth / 2;
    reel.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeIndex, isActive]);

  // Update chevron visibility when the reel scrolls.
  useEffect(() => {
    const reel = reelRef.current;
    if (!reel) return;
    function update() {
      if (!reel) return;
      const atStart = reel.scrollLeft <= 4;
      const atEnd = reel.scrollLeft + reel.clientWidth >= reel.scrollWidth - 4;
      setChevrons({ left: !atStart, right: !atEnd });
    }
    update();
    reel.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(reel);
    return () => {
      reel.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  /**
   * Prev/next chevrons advance the row's focused index — they're navigation,
   * not just scrolling. Setting input mode to "keyboard" makes the focus ring
   * light up just like an arrow-key press would (chevron is a deliberate
   * "select next" action, not a passive pointer hover).
   */
  function nudge(direction: -1 | 1) {
    ctx.setInputMode("keyboard");
    const next = Math.max(0, Math.min(itemCount - 1, activeIndex + direction));
    focusItem(next);
  }

  return (
    <Box>
      <Box
        sx={{
          mb: `${tokens.space.sm}px`,
          display: "flex",
          alignItems: "center",
          gap: `${tokens.space.sm}px`,
          opacity: isActive ? 1 : 0.85,
          transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
        }}
      >
        {title && (
          <Typography
            sx={{
              fontSize: { xs: 18, md: 22, lg: 26 },
              lineHeight: 1.2,
              fontWeight: tokens.type.weight.semibold,
              color: tokens.color.textPrimary,
              letterSpacing: "-0.005em",
            }}
          >
            {title}
          </Typography>
        )}
        {titleSlot}
      </Box>
      <Box sx={{ position: "relative", "&:hover .row-chevron": { opacity: 1 } }}>
        {chevrons.left && (
          <IconButton
            data-row-nav
            className="row-chevron"
            aria-label="Scroll left"
            onClick={() => nudge(-1)}
            sx={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              backgroundColor: "rgba(20,20,20,0.7)",
              color: tokens.color.textPrimary,
              width: 40,
              height: 64,
              borderRadius: 0,
              opacity: 0,
              transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
              "&:hover": { backgroundColor: "rgba(20,20,20,0.9)" },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 32 }} />
          </IconButton>
        )}
        {chevrons.right && (
          <IconButton
            data-row-nav
            className="row-chevron"
            aria-label="Scroll right"
            onClick={() => nudge(1)}
            sx={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              backgroundColor: "rgba(20,20,20,0.7)",
              color: tokens.color.textPrimary,
              width: 40,
              height: 64,
              borderRadius: 0,
              opacity: 0,
              transition: `opacity ${tokens.motion.duration.focus}ms ${tokens.motion.easing.focus}`,
              "&:hover": { backgroundColor: "rgba(20,20,20,0.9)" },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 32 }} />
          </IconButton>
        )}
        <Box
          ref={reelRef}
          sx={{
            display: "flex",
            gap: `${gap}px`,
            overflowX: "auto",
            overflowY: "visible",
            scrollSnapType: "x mandatory",
            scrollPaddingInline: `${gap}px`,
            // Generous vertical padding so the focus/hover scale-up (1.32x)
            // has room to grow above and below without being clipped by the
            // row title or the next row.
            paddingBlock: `${tokens.grouping.rowReelPadding}px`,
            // Hide scrollbar — Netflix doesn't show one. Mouse wheel/drag still works.
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            // Each direct child gets percentage width based on the breakpoint.
            "& > *": {
              scrollSnapAlign: "start",
              flexShrink: 0,
              // calc((100% - (N-1)*gap) / N) gives the tile width for N per view.
              width: {
                xs: `calc((100% - ${(perView.xs - 1) * gap}px) / ${perView.xs})`,
                sm: `calc((100% - ${(perView.sm - 1) * gap}px) / ${perView.sm})`,
                md: `calc((100% - ${(perView.md - 1) * gap}px) / ${perView.md})`,
                lg: `calc((100% - ${(perView.lg - 1) * gap}px) / ${perView.lg})`,
                xl: `calc((100% - ${(perView.xl - 1) * gap}px) / ${perView.xl})`,
              },
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
